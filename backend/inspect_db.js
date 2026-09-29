const { Client } = require('pg');

const c = new Client({
  host: '167.86.71.186',
  port: 28417,
  user: 'techzonecloud',
  password: 'tech-cloud-pass-db',
  database: 'techzonecloud',
  ssl: false,
});

async function main() {
  await c.connect();

  console.log('=== _prisma_migrations structure in auth_aim ===');
  const cols = await c.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'auth_aim' AND table_name = '_prisma_migrations' ORDER BY ordinal_position"
  );
  console.log(cols.rows.map((r) => r.column_name + ' | ' + r.data_type).join('\n'));

  console.log('\n=== All rows from auth_aim._prisma_migrations ===');
  const allRows = await c.query("SELECT * FROM auth_aim._prisma_migrations ORDER BY 1");
  console.log('Total rows:', allRows.rowCount);
  allRows.rows.forEach((r) => {
    console.log(JSON.stringify(r));
  });

  console.log('\n=== _prisma_migrations structure in business_manager ===');
  const cols2 = await c.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'business_manager' AND table_name = '_prisma_migrations' ORDER BY ordinal_position"
  );
  console.log(cols2.rows.map((r) => r.column_name + ' | ' + r.data_type).join('\n'));

  console.log('\n=== All rows from business_manager._prisma_migrations ===');
  const bmRows = await c.query("SELECT * FROM business_manager._prisma_migrations ORDER BY 1");
  console.log('Total rows:', bmRows.rowCount);
  bmRows.rows.forEach((r) => {
    console.log(JSON.stringify(r));
  });

  await c.end();
}

main().catch((e) => {
  console.error('ERROR:', e.message);
  c.end();
});
