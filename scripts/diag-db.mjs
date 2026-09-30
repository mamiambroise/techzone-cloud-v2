// Diagnostic DB temporaire (non committé) — utilise le pg du backend
import { createRequire } from 'module';
const require = createRequire(new URL('../backend/node_modules/', import.meta.url));
const pg = require('pg');

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await client.connect();
  const q = await client.query(
    "select table_name from information_schema.tables where table_schema='business_manager' and table_name like $1 order by table_name",
    ['pm_%'],
  );
  console.log('PM tables:', q.rows.map((r) => r.table_name));
  const q2 = await client.query(
    "select table_name from information_schema.tables where table_schema='business_manager' and table_name like $1 order by table_name",
    ['pr_%'],
  );
  console.log('PR tables:', q2.rows.map((r) => r.table_name));
  const q3 = await client.query("select count(*)::int as n from information_schema.tables where table_schema='business_manager'");
  console.log('total tables business_manager:', q3.rows[0].n);
  await client.end();
} catch (e) {
  console.log('DB ERROR:', e.code || '', e.message);
}
