const fs=require('node:fs'),assert=require('node:assert/strict');
const target=process.argv[2];require('./ph7-live-gate.cjs').gate(target);
const url=new URL(require('dotenv').parse(fs.readFileSync('.env')).DATABASE_URL);assert(url.hostname==='127.0.0.1'&&url.port==='55432');url.pathname='/'+target;process.env.DATABASE_URL=url.toString();
const {PrismaService}=require('../dist/prisma/prisma.service');
const {UiBuilderService}=require('../dist/modules/ui-builder/ui-builder.service');
const {PackManagerService}=require('../dist/modules/pack-manager/pack-manager.service');
const {contractHash}=require('../dist/modules/pack-manager/pack-contract');
const prisma=new PrismaService(),ui=new UiBuilderService(prisma),packs=new PackManagerService(prisma,ui);
async function main(){
  assert.equal((await prisma.$queryRawUnsafe('select current_database() as name'))[0].name,target);
  const admin=await prisma.iamUser.findFirstOrThrow({where:{isAdmin:true,status:'ACTIVE'},orderBy:{id:'asc'}});
  for(const code of ['WIFI_SERVICES','IT_SALES']){
    const app=await prisma.application.findFirstOrThrow({where:{code,description:'Phase 7 — managed two-app provisioning'}});
    const version=await prisma.applicationVersion.findFirstOrThrow({where:{applicationId:app.id,version:'1.0.0'}});
    const actor={userId:admin.id,tenantId:app.tenantId,permissions:['*']};
    const call=(method,...args)=>packs.atomic(method,[...args,actor]);
    const pack=await prisma.pack.findFirst({where:{tenantId:app.tenantId,code:code.toLowerCase()}})||await call('createPack',{code:code.toLowerCase(),name:app.name,sourceType:'CUSTOM',metadata:{source:'PHASE7'}});
    assert.equal(pack.metadata?.source,'PHASE7');
    let pv=await prisma.packVersion.findFirst({where:{packId:pack.id,versionNumber:'1.0.0'}})||await call('createVersion',pack.id,{versionNumber:'1.0.0',applicationVersionId:version.id});
    assert.equal(pv.applicationVersionId,version.id);
    if(pv.status!=='PUBLISHED'){
      if(!await prisma.packModule.findFirst({where:{packVersionId:pv.id,code:'business'}}))await call('addModule',pv.id,{code:'business',name:app.name});
      const validation=await call('validate',pv.id);
      assert.equal(validation.status,'VALID',JSON.stringify(validation));
      await call('generateManifest',pv.id);
      await call('publish',pv.id);
    }
    const published=await packs.publishedManifest(pack.code,'1.0.0',actor);
    assert.equal(published.definition.ui.applicationVersionId,version.id);
    assert(published.definition.ui.definition.businessContext.entities.length>0);
    const page=await prisma.uiPage.findFirstOrThrow({where:{applicationVersionId:version.id,key:'dashboard'}});
    const before=contractHash(published);
    await ui.updatePage(page.id,{description:'PH7 immutability probe — working definition only'},app.tenantId,admin.id);
    assert.equal(contractHash(await packs.publishedManifest(pack.code,'1.0.0',actor)),before);
    console.log(JSON.stringify({app:code,packId:pack.id,packVersionId:pv.id,manifestId:published.id,hash:published.hash,pages:published.definition.ui.definition.pages.length,immutable:'PASS'}));
  }
}
main().catch(e=>{console.error(e.message.replaceAll(decodeURIComponent(url.password),'[REDACTED]'));process.exitCode=1;}).finally(()=>prisma.$disconnect());
