/* Guarded Phase 6 diagnostics. Credentials are read from PH6_ENV_FILE, never logged. */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { Client } = require('pg');
const dotenv = require('dotenv');
const crypto = require('node:crypto');
const allowed = ['techzonecloud_baseline_v2_empty_test', 'techzonecloud_baseline_v2_adoption_test'];
const source = 'techzonecloud_baseline_phase4';
const [database, action, ...args] = process.argv.slice(2);
if (![...allowed, source].includes(database)) throw new Error('Database not allowlisted');
if (database === source && action !== 'snapshot') throw new Error('Source is read-only');
const config = dotenv.parse(fs.readFileSync(process.env.PH6_ENV_FILE));
const url = new URL(config.DATABASE_URL);
url.pathname = '/' + database;
process.env.DATABASE_URL = url.toString();
const connection = new URL(url); connection.search = '';
const quote = value => '"' + value.replaceAll('"', '""') + '"';
async function main() {
  const client = new Client({ connectionString: connection.toString() });
  await client.connect();
  try {
    const actual = (await client.query('select current_database() as name')).rows[0].name;
    if (actual !== database) throw new Error('Resolved database mismatch');
    console.log('Verified target: ' + actual);
    if (action === 'snapshot') {
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const tables = (await client.query("select tablename from pg_tables where schemaname='business_manager' order by tablename")).rows;
      const result = { database, tables: {}, structure: [] };
      for (const { tablename } of tables) {
        const rows = (await client.query(`select to_jsonb(t)::text as row from business_manager.${quote(tablename)} t order by to_jsonb(t)::text`)).rows;
        result.tables[tablename] = { count: rows.length, sha256: crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex') };
      }
      result.structure = (await client.query("select table_name,column_name,data_type,udt_name,is_nullable,column_default from information_schema.columns where table_schema='business_manager' and table_name <> '_prisma_migrations' order by table_name,ordinal_position")).rows;
      await client.query('COMMIT');
      fs.mkdirSync('.tmp', { recursive: true });
      const file = path.join('.tmp', path.basename(args[0] || database + '.json'));
      fs.writeFileSync(file, JSON.stringify(result, null, 2));
      console.log(JSON.stringify({ file, tableCount: tables.length }));
    } else if (action === 'recreate-fresh' && database === allowed[1]) {
      // Explicitly temporary database only. Never terminate unidentified connections.
      await client.query('DROP DATABASE techzonecloud_baseline_v2_empty_test');
      await client.query('CREATE DATABASE techzonecloud_baseline_v2_empty_test');
      console.log('Recreated only techzonecloud_baseline_v2_empty_test');
    } else if (action === 'recreate-adoption' && database === allowed[0]) {
      const backup = process.env.PH6_BACKUP_FILE;
      if (!backup || !fs.statSync(backup).isFile()) throw new Error('Verified backup required');
      await client.query('DROP DATABASE techzonecloud_baseline_v2_adoption_test');
      await client.query('CREATE DATABASE techzonecloud_baseline_v2_adoption_test');
      const restored = spawnSync('C:/Program Files/PostgreSQL/18/bin/pg_restore.exe', ['-w', '--exit-on-error', '--no-owner', '--no-privileges', '-d', allowed[1], backup], {
        env: { ...process.env, PGHOST: url.hostname, PGPORT: url.port, PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password) }, encoding: 'utf8',
      });
      if (restored.status !== 0) throw new Error('Restore failed');
      console.log('Recreated and restored only ' + allowed[1]);
    } else if (action === 'verify') {
      const history = (await client.query('select migration_name,checksum,applied_steps_count,finished_at,rolled_back_at from business_manager._prisma_migrations order by migration_name')).rows;
      if (history.length !== 2 || history.some(r => !r.finished_at || r.rolled_back_at)) throw new Error('Invalid lineage');
      for (const row of history) {
        const sql = fs.readFileSync(path.join('prisma/migrations', row.migration_name, 'migration.sql'));
        if (crypto.createHash('sha256').update(sql).digest('hex') !== row.checksum) throw new Error('Checksum mismatch');
      }
      const indexes = (await client.query("select indexname,indexdef from pg_indexes where schemaname='business_manager' and tablename='business_records' order by indexname")).rows;
      const constraints = (await client.query("select conname,pg_get_constraintdef(oid) as definition from pg_constraint where conrelid='business_manager.business_records'::regclass order by conname")).rows;
      console.log(JSON.stringify({ history, indexes, constraints }));
    } else if (action === 'verify-source-data') {
      const srcUrl = new URL(connection); srcUrl.pathname = '/' + source;
      const src = new Client({ connectionString: srcUrl.toString() });
      await src.connect();
      try {
        await src.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
        await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
        const tables = (await src.query("select tablename from pg_tables where schemaname='business_manager' order by tablename")).rows;
        let originalRows = 0;
        for (const { tablename } of tables) {
          const sql = `select to_jsonb(t)::text as row from business_manager.${quote(tablename)} t`;
          const originals = (await src.query(sql)).rows;
          const actual = new Set((await client.query(sql)).rows.map(r => r.row));
          if (originals.some(r => !actual.has(r.row))) throw new Error('Original row changed in ' + tablename);
          originalRows += originals.length;
        }
        await src.query('COMMIT'); await client.query('COMMIT');
        console.log(JSON.stringify({ originalTables: tables.length, originalRows, unchanged: true }));
      } finally { await src.end(); }
    } else if (action === 'history') {
      const exists = (await client.query("select to_regclass('business_manager._prisma_migrations') as history,to_regclass('business_manager.business_records') as records")).rows[0];
      console.log(exists);
      if (exists.history) console.log((await client.query('select migration_name,finished_at,rolled_back_at,applied_steps_count from business_manager._prisma_migrations order by started_at')).rows);
    } else if (action === 'prisma') {
      const result = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), ...args, '--config', 'prisma7.config.ts'], { env: process.env, encoding: 'utf8' });
      const redact = text => (text || '').replaceAll(url.toString(), '[DATABASE_URL]').replaceAll(decodeURIComponent(url.password), '[REDACTED]');
      console.log(redact(result.stdout)); console.error(redact(result.stderr));
      if (result.error) throw new Error(result.error.code);
      process.exitCode = result.status;
    } else throw new Error('Unknown action');
  } finally { await client.end(); }
}
main().catch(error => { console.error(error.code || error.name, 'Phase 6 command failed (credentials suppressed)'); process.exitCode = 1; });
