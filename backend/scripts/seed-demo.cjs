// Safe, repeatable demo provisioning for one disposable database only.
// It composes the existing platform seed with the audited Phase 7 fixtures.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const dotenv = require('dotenv');
const { Client } = require('pg');

const TARGET = 'techzonecloud_phase7_recipe';
const root = path.resolve(__dirname, '..');
const targetArg = process.argv[2];

function readEnvironment() {
  const base = fs.existsSync(path.join(root, '.env'))
    ? dotenv.parse(fs.readFileSync(path.join(root, '.env')))
    : {};
  const local = fs.existsSync(path.join(root, '.env.local'))
    ? dotenv.parse(fs.readFileSync(path.join(root, '.env.local')))
    : {};
  return { base, local, merged: { ...base, ...local, ...process.env } };
}

function sanitized(output, url) {
  let result = output || '';
  if (url.password) {
    const password = decodeURIComponent(url.password);
    if (password) result = result.replaceAll(password, '[REDACTED]');
  }
  return result.replaceAll(url.toString(), '[DATABASE_URL]');
}

function run(args, env, sourceUrl) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    env,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  const output = sanitized((result.stdout || '') + (result.stderr || ''), sourceUrl);
  if (output) process.stdout.write(output);
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Étape échouée : ${args.join(' ')} (code ${result.status}).`);
  }
}

async function preflight(databaseUrl) {
  const pgUrl = new URL(databaseUrl);
  pgUrl.search = '';
  const client = new Client({ connectionString: pgUrl.toString() });
  await client.connect();
  try {
    const [{ name }] = (await client.query('SELECT current_database() AS name')).rows;
    assert.equal(name, TARGET, 'La base connectée ne correspond pas à la cible de démo.');

    const table = await client.query(
      `SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'business_manager' AND table_name = '_prisma_migrations'`,
    );
    assert.equal(table.rowCount, 1, 'Historique Prisma absent : migrations non déployées.');

    const expected = fs.readdirSync(path.join(root, 'prisma', 'migrations'))
      .filter((name) => fs.existsSync(path.join(root, 'prisma', 'migrations', name, 'migration.sql')));
    const history = await client.query(
      `SELECT migration_name, finished_at, rolled_back_at
       FROM business_manager._prisma_migrations`,
    );
    const applied = new Set(
      history.rows.filter((row) => row.finished_at && !row.rolled_back_at)
        .map((row) => row.migration_name),
    );
    const missing = expected.filter((name) => !applied.has(name));
    const failed = history.rows.filter((row) => !row.finished_at && !row.rolled_back_at);
    assert.equal(failed.length, 0, 'La base contient une migration échouée ou en cours.');
    assert.equal(missing.length, 0, `Migrations non déployées : ${missing.join(', ')}`);
    assert(history.rows.every((row) => expected.includes(row.migration_name)),
      'Historique ancien/inconnu : le seed démo refuse de réconcilier les migrations.');

    const nullable = await client.query(
      `SELECT is_nullable FROM information_schema.columns
       WHERE table_schema = 'business_manager' AND table_name = 'applications'
         AND column_name = 'tenantId'`,
    );
    assert.equal(nullable.rows[0]?.is_nullable, 'YES',
      'applications.tenantId doit être nullable (migration Phase 9 manquante).');
    const scopeCheck = await client.query(
      `SELECT 1 FROM pg_constraint
       WHERE connamespace = 'business_manager'::regnamespace
         AND conname = 'applications_tenant_scope_tenantId_check'`,
    );
    assert.equal(scopeCheck.rowCount, 1, 'Contrainte de cohérence du tenant absente.');
  } finally {
    await client.end();
  }
}

async function main() {
  assert.equal(targetArg, TARGET,
    `Usage : npm run seed:demo:cloud -- ${TARGET}. Toute autre base est refusée.`);

  const { base, local, merged: env } = readEnvironment();
  assert(env.SEED_AUTH_PASSWORD && env.SEED_AUTH_PASSWORD.length >= 10,
    'Définis SEED_AUTH_PASSWORD dans backend/.env.local (10 à 128 caractères).');
  const source = base.DATABASE_URL;
  assert(source, 'DATABASE_URL doit être défini dans backend/.env (utilisé aussi par les scripts Phase 7).');
  assert(!local.DATABASE_URL || local.DATABASE_URL === source,
    'DATABASE_URL de .env.local diffère de .env ; les scripts Phase 7 refuseraient la cible commune.');
  assert(!process.env.DATABASE_URL || process.env.DATABASE_URL === source,
    'DATABASE_URL du processus diffère de backend/.env ; utilisez une seule configuration de recette.');
  const url = new URL(source);
  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  assert(['127.0.0.1', '::1', 'localhost'].includes(hostname),
    'Le seed démo exige PostgreSQL local.');
  assert(['5432', '55432'].includes(url.port),
    'Le seed démo exige PostgreSQL local sur le port 5432 ou 55432.');
  url.pathname = `/${TARGET}`;
  url.searchParams.set('schema', 'business_manager');
  const targetUrl = url.toString();

  await preflight(targetUrl);
  const childEnv = {
    ...env,
    DATABASE_URL: targetUrl,
    TECHZONE_SEED_TARGET_URL: targetUrl,
    SEED_AUTH_PASSWORD: env.SEED_AUTH_PASSWORD,
  };

  // Existing seeds cover platform/integration/deployment and the demo auth/RBAC.
  run(['--import', 'tsx', 'src/prisma/seed.ts'], childEnv, url);
  run(['--import', 'tsx', 'src/prisma/seed-auth.ts'], childEnv, url);

  // Phase 7 scripts use compiled services. Refuse to build/rebuild application
  // modules implicitly; ask the developer to prepare dist through their normal workflow.
  for (const file of [
    'dist/modules/business-manager/data-model/data-model.service.js',
    'dist/data-runtime/data-access/bm-records.provider.js',
    'dist/modules/ui-builder/ui-builder.service.js',
    'dist/modules/pack-manager/pack-manager.service.js',
  ]) {
    assert(fs.existsSync(path.join(root, file)),
      `Build backend requis : fichier absent ${file}.`);
  }

  for (const script of [
    'scripts/ph7-build.cjs',
    'scripts/ph7-records.cjs',
    'scripts/ph7-ui.cjs',
    'scripts/ph7-pack.cjs',
  ]) {
    run([script, TARGET], childEnv, url);
  }
  run(['--import', 'tsx', 'src/prisma/seed-demo-extras.ts'], childEnv, url);

  console.log('\nSeed démo terminé. Données : plateforme, intégration, déploiement, IAM/RBAC,');
  console.log('2 applications BM et leurs records, pages UI, packs publiés, Billing catalogue et ERP inactif.');
  console.log('Automation utilise un mock mémoire : aucun enregistrement Prisma à créer.');
}

main().catch((error) => {
  console.error(`Seed démo interrompu : ${error.message}`);
  process.exitCode = 1;
});
