// Read-only inventory. Never prints credentials or personal user attributes.
const fs = require('node:fs');
const dotenv = require('dotenv');
const { Client } = require('pg');
const url = new URL(dotenv.parse(fs.readFileSync(process.env.PH7_ENV_FILE || '.env')).DATABASE_URL);
url.search = '';
const client = new Client({ connectionString: url.toString() });
async function main() {
  await client.connect();
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  console.log((await client.query('select current_database() as database')).rows);
  console.log(JSON.stringify((await client.query('select a.id,a.code,a.name,a."tenantId",t.code as tenant from business_manager.applications a left join business_manager.tenant t on t.id::text=a."tenantId"::text order by t.code,a.code')).rows, null, 2));
  console.log(JSON.stringify((await client.query('select id,"applicationId",version,status from business_manager.application_versions order by "applicationId",version')).rows, null, 2));
  console.log((await client.query("select to_regclass('business_manager._prisma_migrations') as history,to_regclass('business_manager.business_records') as records")).rows);
  await client.query('COMMIT');
}
main().catch(e => { console.error(e.code || e.name, 'Read-only inventory failed'); process.exitCode = 1; }).finally(() => client.end());
