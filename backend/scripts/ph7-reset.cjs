// Explicit deterministic legacy-demo allowlist. Dry-run is the default.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { Client } = require('pg');
const dotenv = require('dotenv');
const [database, action = 'dry-run', approvedHash] = process.argv.slice(2);
assert(['techzonecloud_local', 'techzonecloud_phase7_recipe'].includes(database));
assert(['dry-run', 'apply'].includes(action));
const url = new URL(dotenv.parse(fs.readFileSync(process.env.PH7_ENV_FILE || '.env')).DATABASE_URL);
assert.equal(url.hostname, '127.0.0.1'); assert.equal(url.port, '55432');
url.pathname = '/' + database; url.search = '';
const client = new Client({ connectionString: url.toString() });
const hash = data => crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
function seedId(key) {
  const hex = crypto.createHash('sha256').update('bm-demo:' + key).digest('hex');
  return [hex.slice(0,8),hex.slice(8,12),'5'+hex.slice(13,16),((parseInt(hex[16],16)&3)|8).toString(16)+hex.slice(17,20),hex.slice(20,32)].join('-');
}
const spec = {
  'techzone-it-solution': ['gestion-des-ventes', 'gestion-de-stock', 'crm', 'wisp', 'fret-transit'],
  'demo-horizon-sarl': ['centre-de-formation', 'gestion-scolaire', 'gestion-rh', 'gestion-projets', 'support-sav'],
};
const allowed = table => /^(bm_|ui_|pm_|pr_)/.test(table) || ['applications','application_versions','configurations','configuration_history','business_records'].includes(table);
const q = value => '"' + value.replaceAll('"','""') + '"';
async function main() {
  await client.connect();
  await client.query(action === 'apply' ? 'BEGIN ISOLATION LEVEL SERIALIZABLE' : 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  assert.equal((await client.query('select current_database() as name')).rows[0].name, database);
  const tables = (await client.query("select tablename from pg_tables where schemaname='business_manager' order by tablename")).rows.map(r=>r.tablename);
  const rows = {}, selected = {};
  for (const table of tables) {
    rows[table] = (await client.query(`select to_jsonb(t) as row from business_manager.${q(table)} t`)).rows.map(r=>r.row);
    selected[table] = new Set();
  }
  const inventory = [];
  for (const [tenant, codes] of Object.entries(spec)) for (const code of codes) {
    const id = seedId('application:' + code), tenantId = seedId('tenant:' + tenant), versionId = seedId('version:' + code + ':1.0.0');
    const app = rows.applications.find(r=>r.id === id);
    const matchingCode = rows.applications.find(r=>r.code===code && r.tenantId===tenantId);
    assert(!matchingCode || matchingCode.id===id, 'Unknown app with seed code: preserved');
    if (!app) { inventory.push({ tenant, code, id, state: 'ABSENT' }); continue; }
    assert.equal(app.code, code); assert.equal(app.tenantId, tenantId);
    const versions = rows.application_versions.filter(r=>r.applicationId===id);
    assert.equal(versions.length,1,'Unknown extra version: preserve app');
    assert.equal(versions[0].id,versionId); assert.equal(versions[0].version,'1.0.0');
    selected.applications.add(id); selected.application_versions.add(versionId);
    inventory.push({ tenant, code, id, versionId, version:'1.0.0', proof:'bm-demo SHA256 deterministic application/version/tenant IDs' });
  }
  const fks = (await client.query(`SELECT child.relname AS child,parent.relname AS parent,ca.attname AS column,pa.attname AS target
    FROM pg_constraint c JOIN pg_class child ON child.oid=c.conrelid JOIN pg_namespace n ON n.oid=child.relnamespace
    JOIN pg_class parent ON parent.oid=c.confrelid
    JOIN LATERAL unnest(c.conkey,c.confkey) AS k(childkey,parentkey) ON true
    JOIN pg_attribute ca ON ca.attrelid=child.oid AND ca.attnum=k.childkey
    JOIN pg_attribute pa ON pa.attrelid=parent.oid AND pa.attnum=k.parentkey
    WHERE c.contype='f' AND n.nspname='business_manager'`)).rows;
  const links = [...fks];
  // Explicit non-FK ownership columns used by current BM schema.
  for (const table of tables.filter(allowed)) {
    links.push({child:table,parent:'applications',column:'applicationId',target:'id'});
    links.push({child:table,parent:'application_versions',column:'applicationVersionId',target:'id'});
  }
  links.push({child:'bm_contract_versions',parent:'bm_contracts',column:'contractId',target:'id'});
  let changed;
  do {
    changed = false;
    for (const table of tables.filter(allowed)) for (const row of rows[table]) {
      if (selected[table].has(row.id)) continue;
      const owned = links.some(link=>link.child===table && link.target==='id' && row[link.column] && selected[link.parent]?.has(row[link.column])) ||
        (table==='configurations' && ((row.scope==='APPLICATION_VERSION' && selected.application_versions.has(row.scopeId)) || (row.scope==='APPLICATION' && selected.applications.has(row.scopeId))));
      if (owned) { assert(row.id, 'Row without primary identity'); selected[table].add(row.id); changed=true; }
    }
  } while(changed);
  // A retained record referencing a deleted record is a blocker, never silently cascaded.
  for (const fk of fks) for (const row of rows[fk.child] || []) if (fk.target==='id' && selected[fk.parent]?.has(row[fk.column]) && !selected[fk.child].has(row.id)) throw new Error('Protected/unknown incoming reference: '+fk.child+'.'+fk.column);
  const targets = Object.fromEntries(Object.entries(selected).filter(([,ids])=>ids.size).map(([table,ids])=>[table,[...ids].sort()]));
  const plan = { database, inventory, targets, counts: Object.fromEntries(Object.entries(targets).map(([t,ids])=>[t,ids.length])), unknownApplications: rows.applications.filter(r=>!selected.applications.has(r.id)).map(r=>({id:r.id,code:r.code,tenantId:r.tenantId})) };
  const fingerprint = hash(plan);
  const reportDirectory = path.join(os.tmpdir(),'techzone-phase7-safety'); fs.mkdirSync(reportDirectory,{recursive:true});
  fs.writeFileSync(path.join(reportDirectory,database+'-reset-'+fingerprint+'.json'),JSON.stringify(plan,null,2));
  console.log(JSON.stringify({ ...plan, targets: undefined, total: Object.values(targets).reduce((n,ids)=>n+ids.length,0), fingerprint },null,2));
  if(action==='apply') {
    require('./ph7-live-gate.cjs').gate(database);
    assert.equal(approvedHash,fingerprint,'Dry-run hash must match exactly');
    assert(fs.existsSync(path.join(reportDirectory,'before-phase7.backup')),'Backup required');
    const pending = new Set(Object.keys(targets));
    while(pending.size) {
      const leaf = [...pending].find(parent=>!fks.some(fk=>fk.parent===parent && fk.child!==parent && pending.has(fk.child)));
      assert(leaf,'Dependency cycle: no deletion attempted beyond transaction');
      await client.query(`DELETE FROM business_manager.${q(leaf)} WHERE id::text = ANY($1::text[])`,[targets[leaf]]);
      pending.delete(leaf);
    }
    // All untargeted rows in every table must remain exactly unchanged.
    for (const table of tables) {
      const after=(await client.query(`select to_jsonb(t) as row from business_manager.${q(table)} t`)).rows.map(r=>JSON.stringify(r.row)).sort();
      const expected=rows[table].filter(r=>!selected[table].has(r.id)).map(r=>JSON.stringify(r)).sort();
      assert.equal(hash(after),hash(expected),'Unexpected mutation: '+table);
    }
    await client.query('COMMIT'); console.log('COMMITTED: exact selected rows removed, all other rows unchanged');
  } else await client.query('ROLLBACK');
}
main().catch(async e=>{try{await client.query('ROLLBACK')}catch{}console.error(e.message);process.exitCode=1}).finally(()=>client.end());
