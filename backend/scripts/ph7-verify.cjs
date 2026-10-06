const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const {gate,directory}=require('./ph7-live-gate.cjs');
const target=process.argv[2];gate(target);
const url=new URL(require('dotenv').parse(fs.readFileSync('.env')).DATABASE_URL);assert(url.hostname==='127.0.0.1'&&url.port==='55432');url.pathname='/'+target;process.env.DATABASE_URL=url.toString();
const {PrismaService}=require('../dist/prisma/prisma.service');
const {PackManagerService}=require('../dist/modules/pack-manager/pack-manager.service');
const {BmRecordsProvider}=require('../dist/data-runtime/data-access/bm-records.provider');
const {DataAccessManager}=require('../dist/data-runtime/data-access/data-access-manager');
const {ExecutionEngine}=require('../dist/data-runtime/execution-engine/execution-engine');
const prisma=new PrismaService(),packs=new PackManagerService(prisma),provider=new BmRecordsProvider(prisma),access=new DataAccessManager();
access.registerProvider('BM_RECORDS',provider);const engine=new ExecutionEngine(access);
async function main(){
  assert.equal((await prisma.$queryRawUnsafe('select current_database() as name'))[0].name,target);
  const admin=await prisma.iamUser.findFirstOrThrow({where:{isAdmin:true,status:'ACTIVE',NOT:{username:{startsWith:'PH7-TEST-'}}},orderBy:{id:'asc'}});
  const report={database:target,apps:[],orphans:{}};
  for(const [code,entity,key,prefix] of [['WIFI_SERVICES','customer','code','RT-WIFI-FINAL'],['IT_SALES','product','reference','RT-IT-FINAL']]){
    const app=await prisma.application.findFirstOrThrow({where:{code,description:'Phase 7 — managed two-app provisioning'}});
    const actor={userId:admin.id,tenantId:app.tenantId,permissions:['*'],traceId:'phase7-final'};
    const manifest=await packs.publishedManifest(code.toLowerCase(),'1.0.0',actor);
    const versionId=manifest.definition.ui.applicationVersionId;
    const resource=`bm:${versionId}:${entity}`;
    assert(manifest.definition.ui.definition.pages.some(p=>p.key===entity+'-create'));
    const input={[key]:prefix,name:'Runtime final — '+app.name,...(entity==='product'?{saleprice:150000,category:(await provider.list(`bm:${versionId}:category`,actor)).items[0].id}:{active:true})};
    let record=(await provider.list(resource,actor,{filter:{logic:'AND',conditions:[{field:key,operator:'EQ',value:prefix}]}})).items[0];
    if(!record){const result=await engine.execute({resource,operation:'CREATE',input,idempotencyKey:prefix},actor);assert(result.success,JSON.stringify(result));record=result.data;}
    assert.equal((await prisma.businessRecord.findUniqueOrThrow({where:{id:record.id}})).data[key],prefix);
    const scope={applicationVersionId:versionId,tenantId:app.tenantId};
    const entities=await prisma.bmEntity.findMany({where:scope});
    const menus=await prisma.bmMenu.findMany({where:scope});
    report.apps.push({code,tenantId:app.tenantId,applicationId:app.id,versionId,entities:entities.length,fields:await prisma.bmField.count({where:{entityId:{in:entities.map(e=>e.id)}}}),relations:await prisma.bmRelation.count({where:scope}),features:await prisma.bmFeature.count({where:scope}),capabilities:await prisma.bmFeatureCapability.count({where:{tenantId:app.tenantId,feature:{applicationVersionId:versionId}}}),navigation:await prisma.bmNavigationItem.count({where:{menuId:{in:menus.map(m=>m.id)}}}),configurations:await prisma.configuration.count({where:{tenantId:app.tenantId,scope:'APPLICATION_VERSION',scopeId:versionId,status:'ACTIVE'}}),pages:manifest.definition.ui.definition.pages.length,records:await prisma.businessRecord.count({where:{applicationId:app.id,archivedAt:null}}),runtimeRecordId:record.id,packVersionId:manifest.packVersionId,manifestId:manifest.id,manifestHash:manifest.hash});
  }
  for(const [table,column,parent] of [['application_versions','applicationId','applications'],['bm_entities','applicationVersionId','application_versions'],['bm_fields','entityId','bm_entities'],['bm_relations','sourceEntityId','bm_entities'],['bm_relations','targetEntityId','bm_entities'],['bm_feature_capabilities','featureId','bm_features'],['bm_navigation_items','menuId','bm_menus'],['ui_pages','applicationVersionId','application_versions'],['business_records','entityId','bm_entities']]){
    const rows=await prisma.$queryRawUnsafe(`SELECT count(*)::int AS count FROM business_manager."${table}" c LEFT JOIN business_manager."${parent}" p ON p.id=c."${column}" WHERE c."${column}" IS NOT NULL AND p.id IS NULL`);
    report.orphans[table+'.'+column]=rows[0].count;assert.equal(rows[0].count,0,'Orphan: '+table+'.'+column);
  }
  report.historicalPackVersions=await prisma.packVersion.count({where:{applicationVersionId:null}});assert.equal(report.historicalPackVersions,5);
  fs.writeFileSync(path.join(directory,target+'-final-verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
main().catch(e=>{console.error(e.message.replaceAll(decodeURIComponent(url.password),'[REDACTED]'));process.exitCode=1;}).finally(()=>prisma.$disconnect());
