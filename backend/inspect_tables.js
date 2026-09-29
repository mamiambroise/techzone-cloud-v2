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

  // Get all table names in auth_aim (excluding _prisma_migrations)
  console.log('=== ALL TABLE NAMES in auth_aim ===');
  const tables = await c.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'auth_aim' AND table_type = 'BASE TABLE' AND table_name != '_prisma_migrations' ORDER BY table_name"
  );
  const tableNames = tables.rows.map(r => r.table_name);
  console.log(tableNames.join(', '));
  console.log('Count:', tableNames.length);

  // Get all enum type names in auth_aim
  console.log('\n=== ALL ENUM TYPES in auth_aim ===');
  const enums = await c.query(
    "SELECT t.typname FROM pg_type t WHERE t.typnamespace = 'auth_aim'::regnamespace AND t.typtype = 'e' ORDER BY t.typname"
  );
  console.log(enums.rows.map(r => r.typname).join(', '));

  // Check the exact columns of Credential and MfaMethod in auth_aim
  console.log('\n=== Columns for MfaMethod in auth_aim ===');
  const mfaCols = await c.query(
    "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'auth_aim' AND table_name = 'MfaMethod' ORDER BY ordinal_position"
  );
  mfaCols.rows.forEach(r => console.log(r.column_name + ' | ' + r.data_type));

  console.log('\n=== Columns for IamRefreshToken/RefreshToken in auth_aim ===');
  const rtCols = await c.query(
    "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'auth_aim' AND table_name = 'RefreshToken' ORDER BY ordinal_position"
  );
  rtCols.rows.forEach(r => console.log(r.column_name + ' | ' + r.data_type));

  console.log('\n=== Columns for PasswordHistory in auth_aim ===');
  const phCols = await c.query(
    "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'auth_aim' AND table_name = 'PasswordHistory' ORDER BY ordinal_position"
  );
  phCols.rows.forEach(r => console.log(r.column_name + ' | ' + r.data_type));

  console.log('\n=== Columns for MfaMethod (check for label) in auth_aim ===');
  const allMfaCols = await c.query(
    "SELECT * FROM information_schema.columns WHERE table_schema = 'auth_aim' AND table_name = 'MfaMethod' ORDER BY ordinal_position"
  );
  console.log('Total cols:', allMfaCols.rowCount);

  // Check if auth_aim has iam_* snake_case tables
  console.log('\n=== iam_* tables in auth_aim ===');
  const iamSnake = await c.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'auth_aim' AND table_name LIKE 'iam_%' ORDER BY table_name"
  );
  console.log(iamSnake.rowCount > 0 ? iamSnake.rows.map(r => r.table_name).join(', ') : 'NONE');

  // Check if auth_aim has snake_case tables (like iam_user, iam_credential)
  console.log('\n=== All table names in auth_aim (showing only ones starting with lowercase) ===');
  const lowerTables = await c.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'auth_aim' AND table_type = 'BASE TABLE' AND table_name ~ '^[a-z]' ORDER BY table_name"
  );
  console.log(lowerTables.rowCount > 0 ? lowerTables.rows.map(r => r.table_name).join(', ') : 'NONE');

  // Check if business_manager has IAM tables
  console.log('\n=== Tables matching iam_* or User/Credential/Device in business_manager ===');
  const bmIam = await c.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'business_manager' AND table_type = 'BASE TABLE' AND (table_name LIKE 'iam_%' OR table_name IN ('User', 'Credential', 'Device', 'Session')) ORDER BY table_name"
  );
  console.log(bmIam.rowCount > 0 ? bmIam.rows.map(r => r.table_name).join(', ') : 'NONE');

  await c.end();
}

main().catch((e) => {
  console.error('ERROR:', e.message);
  c.end();
});
