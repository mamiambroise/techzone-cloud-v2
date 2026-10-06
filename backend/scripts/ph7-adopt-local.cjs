// Explicit live adoption gate: restored backup equality, source unchanged, no reset.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process'),{Client}=require('pg');
const {gate,directory}=require('./ph7-live-gate.cjs');
gate('techzonecloud_local');
const url=new URL(require('dotenv').parse(fs.readFileSync('.env')).DATABASE_URL);
assert(url.hostname==='127.0.0.1'&&url.port==='55432'&&url.pathname==='/techzonecloud_local');
const connection=new URL(url);connection.search='';
const db=new Client({connectionString:connection.toString()});
async function main(){
  await db.connect();assert.equal((await db.query('select current_database() as name')).rows[0].name,'techzonecloud_local');
  const initial=JSON.parse(fs.readFileSync(path.join(directory,'before-reset.json'))).tables;
  const before=JSON.parse(fs.readFileSync(path.join(directory,'before-local-20261005.json'))).tables;
  const restored=JSON.parse(fs.readFileSync(path.join(directory,'restored-copy.json'))).tables;
  assert.deepEqual(restored,initial,'Initial backup restore proof differs');
  const receipt=JSON.parse(fs.readFileSync(path.join(directory,'before-local-20261005.backup.json')));
  assert(receipt.tocEntries>1000);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(directory,'before-local-20261005.backup'))).digest('hex'),receipt.sha256,'Latest backup integrity');
  const history=await db.query("select to_regclass('business_manager._prisma_migrations') as table_name");
  assert.equal(history.rows[0].table_name,null,'Already adopted: inspect status rather than marking again');
  await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  for(const [table,expected] of Object.entries(before)){
    assert(/^[A-Za-z0-9_]+$/.test(table));
    const rows=(await db.query(`select to_jsonb(t)::text as row from business_manager."${table}" t order by to_jsonb(t)::text`)).rows;
    assert.equal(rows.length,expected.count,'Source count changed: '+table);
    assert.equal(crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex'),expected.sha256,'Source changed after backup: '+table);
  }
  await db.query('COMMIT');
  for(const args of [['migrate','resolve','--applied','20261004000000_baseline_v2'],['migrate','deploy'],['migrate','status']]){
    const result=spawnSync(process.execPath,[require.resolve('prisma/build/index.js'),...args,'--config','prisma7.config.ts'],{env:{...process.env,DATABASE_URL:url.toString()},encoding:'utf8',windowsHide:true});
    console.log((result.stdout||'').replaceAll(url.toString(),'[DATABASE_URL]'));console.error((result.stderr||'').replaceAll(url.toString(),'[DATABASE_URL]'));assert.equal(result.status,0,'Prisma operation failed');
  }
  // The only historical-row change is the nullable link explicitly added by #3.
  for(const [table,expected] of Object.entries(before)){
    const expression=table==='pm_pack_versions'?"(to_jsonb(t) - 'applicationVersionId')":'to_jsonb(t)';
    const rows=(await db.query(`select ${expression}::text as row from business_manager."${table}" t order by ${expression}::text`)).rows;
    assert.equal(crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex'),expected.sha256,'Historical row changed during migration: '+table);
  }
  console.log('PASS local additive migration: all historical rows preserved byte-for-byte (new nullable Pack link excluded)');
}
main().catch(e=>{console.error(e.message.replaceAll(decodeURIComponent(url.password),'[REDACTED]'));process.exitCode=1;}).finally(()=>db.end());
