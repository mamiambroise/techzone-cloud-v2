const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const directory=path.join(os.tmpdir(),'techzone-phase7-safety');
const backupHash='4819df9c0e54696cd8f34b6701acdae030440abcde68de949b8f082d9e32ac05';
function gate(target){
  assert(['techzonecloud_local','techzonecloud_phase7_recipe'].includes(target),'Target not allowlisted');
  if(target!=='techzonecloud_local')return;
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(directory,'before-phase7.backup'))).digest('hex'),backupHash,'Verified backup must remain intact');
  const acceptance=JSON.parse(fs.readFileSync('.tmp/ph7-acceptance.json'));
  assert.equal(acceptance.database,'techzonecloud_phase7_recipe');
  for(const key of ['WIFI_SERVICES_PUBLISHED_MANIFEST','IT_SALES_PUBLISHED_MANIFEST','API_A_B_A_ISOLATION','BUSINESS_TRANSITIONS_AND_DENIAL','PUBLISHED_UI_REAL_RENDERER'])assert(acceptance.results.includes(key),'Acceptance missing: '+key);
}
module.exports={gate,directory,backupHash};
