const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const { Client } = require('../../backend/node_modules/pg');
const env = require('../../backend/node_modules/dotenv').parse(fs.readFileSync('backend/.env'));
const url = new URL(env.DATABASE_URL);
const schema = url.searchParams.get('schema') || 'business_manager';
url.searchParams.delete('schema');
const client = new Client({ connectionString: url.toString(), connectionTimeoutMillis: 5000 });
const q = value => '"' + value.replaceAll('"', '""') + '"';
const table = name => q(schema) + '.' + q(name);
async function main() {
  try {
    await client.connect();
    await client.query(`SELECT "applicationId" FROM ${table('pm_packs')} LIMIT 1`);
    const pending = await client.query(`SELECT migration_name FROM ${table('_prisma_migrations')} WHERE finished_at IS NULL AND rolled_back_at IS NULL`);
    if (pending.rowCount) throw new Error('MIGRATION_INCOMPLETE');
    const version = (await client.query(`SELECT "tenantId","packId",id,"applicationVersionId" FROM ${table('pm_pack_versions')} WHERE "applicationVersionId" IS NOT NULL LIMIT 1`)).rows[0];
    if (!version) throw new Error('NO_PACK_VERSION_FOR_INDEX_CHECK');
    const app = (await client.query(`SELECT "applicationId" FROM ${table('application_versions')} WHERE id=$1`, [version.applicationVersionId])).rows[0];
    await client.query('BEGIN');
    const insert = `INSERT INTO ${table('pr_runtime_resolutions')} (id,"tenantId","applicationId",environment,"packId","packVersionId","requestHash",context,result,"createdBy") VALUES ($1,$2,$3,$4,$5,$6,$7,'{}',$8,'TRANSACTIONAL_RUNTIME_INDEX_CHECK')`;
    const values = () => [randomUUID(), version.tenantId, app.applicationId, '__runtime_index_check__', version.packId, version.id, randomUUID(), JSON.stringify({runtimeContext:{status:'ACTIVE'}})];
    await client.query(insert, values());
    let rejected = false;
    try { await client.query(insert, values()); } catch (error) { if (error.code !== '23505' || error.constraint !== 'pr_one_active_context_per_scope') throw error; rejected = true; }
    await client.query('ROLLBACK');
    if (!rejected) throw new Error('ACTIVE_CONTEXT_UNIQUENESS_FAILED');
    const permissions = await client.query(`SELECT code FROM ${table('permission')} WHERE code IN ('runtime.activate','runtime.deactivate') AND active=true`);
    if (permissions.rowCount !== 2) throw new Error('RUNTIME_PERMISSIONS_MISSING');
    const report = { checkedAt: new Date().toISOString(), database: decodeURIComponent(url.pathname.slice(1)), schema, packApplicationColumn:'PASS', migrations:'PASS', oneActiveContextPerScope:'PASS', activationPermissions:'PASS', temporaryRows:'ROLLED_BACK', fullBusinessAcceptance:'NOT TESTED' };
    fs.writeFileSync('docs/recette/runtime-db-verification.json', JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report,null,2));
  } finally { await client.query('ROLLBACK').catch(()=>{}); await client.end(); }
}
main().catch(error => { console.error(JSON.stringify({status:'BLOCKED',code:error.code,message:error.message})); process.exitCode=1; });
