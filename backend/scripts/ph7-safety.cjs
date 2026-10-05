const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { Client } = require('pg');
const dotenv = require('dotenv');
const original = 'techzonecloud_local';
const clone = 'techzonecloud_phase7_recipe';
const fresh = 'techzonecloud_phase7_fresh';
const [action, target = original, ...args] = process.argv.slice(2);
if (![original, clone, fresh].includes(target)) throw new Error('Target not allowlisted');
const url = new URL(dotenv.parse(fs.readFileSync(process.env.PH7_ENV_FILE || '.env')).DATABASE_URL);
if (url.hostname !== '127.0.0.1' || url.port !== '55432') throw new Error('Unexpected server');
url.pathname = '/' + target;
const pgUrl = new URL(url); pgUrl.search = '';
const pgEnv = { ...process.env, PGHOST: url.hostname, PGPORT: url.port, PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password) };
const directory = path.join(os.tmpdir(), 'techzone-phase7-safety');
const backup = path.join(directory, action === 'backup' && args[0] ? path.basename(args[0]) : 'before-phase7.backup');
const quote = s => '"' + s.replaceAll('"', '""') + '"';
function pgTool(tool, args) {
  const result = spawnSync('C:/Program Files/PostgreSQL/18/bin/' + tool + '.exe', args, { env: pgEnv, encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error(tool + ' failed: ' + (result.stderr || '').replaceAll(decodeURIComponent(url.password), '[REDACTED]'));
  return result.stdout;
}
async function main() {
  const db = new Client({ connectionString: pgUrl.toString() }); await db.connect();
  try {
    if ((await db.query('select current_database() as name')).rows[0].name !== target) throw new Error('Target mismatch');
    console.log('Verified target: ' + target);
    if (action === 'backup' && target === original) {
      fs.mkdirSync(directory, { recursive: true });
      if (fs.existsSync(backup)) throw new Error('Backup already exists; will not overwrite');
      pgTool('pg_dump', ['-w', '-Fc', '--no-owner', '--no-privileges', '-f', backup, original]);
      const toc = pgTool('pg_restore', ['-l', backup]);
      const receipt = { backup, bytes: fs.statSync(backup).size, tocEntries: toc.split('\n').filter(l => /^\d+;/.test(l)).length, sha256: crypto.createHash('sha256').update(fs.readFileSync(backup)).digest('hex') };
      fs.writeFileSync(backup + '.json', JSON.stringify(receipt, null, 2));
      console.log(JSON.stringify(receipt));
    } else if (action === 'prepare-copies' && target === original) {
      if (!fs.existsSync(backup)) throw new Error('Backup required');
      for (const name of [clone, fresh]) {
        const exists = (await db.query('select 1 from pg_database where datname=$1', [name])).rowCount;
        if (exists) throw new Error('Copy already exists: ' + name);
        await db.query('CREATE DATABASE ' + quote(name));
        if (name === clone) pgTool('pg_restore', ['-w', '--exit-on-error', '--no-owner', '--no-privileges', '-d', name, backup]);
        console.log('Created ' + name + (name === clone ? ' and restored backup' : ' empty'));
      }
    } else if (action === 'snapshot') {
      await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const tables = (await db.query("select tablename from pg_tables where schemaname='business_manager' order by tablename")).rows;
      const report = { database: target, tables: {} };
      for (const { tablename } of tables) {
        const rows = (await db.query(`select to_jsonb(t)::text as row from business_manager.${quote(tablename)} t order by to_jsonb(t)::text`)).rows;
        report.tables[tablename] = { count: rows.length, sha256: crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex') };
      }
      await db.query('COMMIT'); fs.mkdirSync(directory, { recursive: true });
      const file = path.join(directory, path.basename(args[0] || target + '.json'));
      if (fs.existsSync(file)) throw new Error('Snapshot exists; will not overwrite');
      fs.writeFileSync(file, JSON.stringify(report, null, 2)); console.log(JSON.stringify({ file, counts: Object.fromEntries(Object.entries(report.tables).map(([k,v])=>[k,v.count])) }));
    } else if (action === 'prisma' && target !== original) {
      const result = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), ...args, '--config', 'prisma7.config.ts'], { env: { ...process.env, DATABASE_URL: url.toString() }, encoding: 'utf8' });
      console.log((result.stdout || '').replaceAll(url.toString(), '[DATABASE_URL]'));
      console.error((result.stderr || '').replaceAll(url.toString(), '[DATABASE_URL]'));
      process.exitCode = result.status;
    } else throw new Error('Action not authorized');
  } finally { await db.end(); }
}
main().catch(e => { console.error(e.message.replaceAll(decodeURIComponent(url.password), '[REDACTED]')); process.exitCode = 1; });
