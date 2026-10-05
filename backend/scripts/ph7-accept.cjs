// Disposable-clone-only real HTTP/IAM/PG acceptance. Test passwords never leave memory.
const fs=require('node:fs'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),{randomBytes}=require('node:crypto');
const target='techzonecloud_phase7_recipe';
const url=new URL(require('dotenv').parse(fs.readFileSync('.env')).DATABASE_URL);assert(url.hostname==='127.0.0.1'&&url.port==='55432');url.pathname='/'+target;process.env.DATABASE_URL=url.toString();
const {PrismaService}=require('../dist/prisma/prisma.service');
const {BmRecordsProvider}=require('../dist/data-runtime/data-access/bm-records.provider');
const prisma=new PrismaService(),provider=new BmRecordsProvider(prisma),bcrypt=require('bcrypt');
const stamp=Date.now().toString(36),base='http://127.0.0.1:3107',results=[];let child;
async function request(route,body,cookie='',method='POST'){
  const response=await fetch(base+route,{method,headers:{'Content-Type':'application/json',cookie},...(body===undefined?{}:{body:JSON.stringify(body)})});
  return {status:response.status,data:await response.json(),cookie:response.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ')};
}
async function api(route,body,cookie,method){const r=await request(route,body,cookie,method);assert(r.status<400,route+': '+JSON.stringify(r.data));return r.data;}
async function check(name,fn){await fn();results.push(name);console.log('PASS '+name);}
async function fixture(code){
  const app=await prisma.application.findFirstOrThrow({where:{code}}),version=await prisma.applicationVersion.findFirstOrThrow({where:{applicationId:app.id,version:'1.0.0'}});
  const password=randomBytes(32).toString('base64url');
  const user=await prisma.iamUser.create({data:{username:`PH7-TEST-${code}-${stamp}`,primaryEmail:`ph7-${code.toLowerCase()}-${stamp}@example.test`,status:'ACTIVE',isAdmin:true,defaultTenantId:app.tenantId,credentials:{create:{type:'PASSWORD',status:'ACTIVE',secretHash:await bcrypt.hash(password,10)}}}});
  await prisma.membership.create({data:{userId:user.id,tenantId:app.tenantId,status:'ACTIVE'}});
  const login=await request('/api/iam/auth/login',{identifier:user.username,password,tenantId:app.tenantId});assert.equal(login.status,200);assert(login.cookie);
  return {code,app,version,user,cookie:login.cookie,resource:entity=>`bm:${version.id}:${entity}`,ctx:{userId:user.id,tenantId:app.tenantId,permissions:['*']}};
}
async function main(){
  assert.equal((await prisma.$queryRawUnsafe('select current_database() as name'))[0].name,target);
  fs.mkdirSync('.tmp',{recursive:true});const log=fs.openSync('.tmp/ph7-backend.log','w');
  child=spawn(process.execPath,['dist/main.js'],{env:{...process.env,PORT:'3107',NODE_ENV:'test',JWT_ACCESS_SECRET:randomBytes(48).toString('hex'),JWT_REFRESH_SECRET:randomBytes(48).toString('hex')},stdio:['ignore',log,log],windowsHide:true});
  for(let i=0;i<100;i++){assert.equal(child.exitCode,null,'Owned backend exited');if(fs.readFileSync('.tmp/ph7-backend.log','utf8').includes('"event":"BOOT"'))break;await new Promise(r=>setTimeout(r,300));}
  const a=await fixture('WIFI_SERVICES'),b=await fixture('IT_SALES');
  for(const f of [a,b]){
    const entity=f===a?'customer':'product',resource=f.resource(entity);
    await check(f.code+'_PUBLISHED_MANIFEST',async()=>{const m=await api(`/api/runtime/manifests/${f.code.toLowerCase()}/1.0.0`,undefined,f.cookie,'GET');assert.equal(m.definition.ui.applicationVersionId,f.version.id);assert(m.definition.ui.definition.businessContext);});
    await check(f.code+'_QUERY_FILTER_SORT_PAGINATION',async()=>{
      const q=await api('/api/data-runtime/query',{resource,page:1,pageSize:2,sort:[{field:f===a?'code':'reference',direction:'DESC'}]},f.cookie);assert.equal(q.items.length,2);assert(q.total>=5);
      const next=await api('/api/data-runtime/query',{resource,page:2,pageSize:2,sort:[{field:f===a?'code':'reference',direction:'DESC'}]},f.cookie);assert(!next.items.some(r=>q.items.some(x=>x.id===r.id)));
      const filtered=await api('/api/data-runtime/query',{resource,filter:{logic:'AND',conditions:[{field:f===a?'code':'reference',operator:'EQ',value:q.items[0].data[f===a?'code':'reference']}]}},f.cookie);assert.equal(filtered.total,1);
    });
    await check(f.code+'_READ_CREATE_UPDATE_DELETE_CAPABILITIES',async()=>{
      const restricted={...f.ctx,permissions:[]};
      for(const op of ['read','create','update','delete'])await assert.rejects(()=>provider.authorize(resource,op,restricted),/FORBIDDEN/);
      await provider.authorize(resource,'read',{...f.ctx,permissions:[entity+'.read']});
    });
  }
  await check('API_A_B_A_ISOLATION',async()=>{
    for(const f of [a,b,a]){const r=await api('/api/data-runtime/query',{resource:f.resource('customer')},f.cookie);assert(r.items.every(x=>x.tenantId===f.app.tenantId));}
    const leak=await request('/api/data-runtime/query',{resource:a.resource('customer')},b.cookie);assert(leak.status>=400||leak.data.total===0);
    const manifest=await request('/api/runtime/manifests/wifi_services/1.0.0',undefined,b.cookie,'GET');assert.equal(manifest.status,404);
  });
  await check('REAL_BUSINESS_RELATIONS_AND_TOTALS',async()=>{
    const records=await prisma.businessRecord.findMany({where:{tenantId:{in:[a.app.tenantId,b.app.tenantId]},archivedAt:null}});
    const byId=new Map(records.map(r=>[r.id,r]));
    const relations=await prisma.bmRelation.findMany({where:{tenantId:{in:[a.app.tenantId,b.app.tenantId]}}});
    for(const r of records)for(const rel of relations.filter(x=>x.sourceEntityId===r.entityId))if(r.data[rel.code]){const linked=byId.get(r.data[rel.code]);assert(linked);assert.equal(linked.tenantId,r.tenantId);assert.equal(linked.entityId,rel.targetEntityId);}
    for(const r of records.filter(x=>['order','customerorder','sale','purchaseorder'].includes(x.entityCode))){const lineEntity={order:'orderline',customerorder:'customerorderline',sale:'saleline',purchaseorder:'purchaseorderline'}[r.entityCode];const lines=records.filter(x=>x.entityCode===lineEntity&&x.data[r.entityCode]===r.id);assert.equal(lines.reduce((n,x)=>n+x.data.total,0)-(r.data.discount||0),r.data.total);}
  });
  await check('BUSINESS_TRANSITIONS_AND_DENIAL',async()=>{
    for(const [f,entity,states] of [[a,'subscription',['SUSPENDED','ACTIVE','CANCELLED','ACTIVE']],[a,'order',['CANCELLED','CONFIRMED']],[a,'installation',['PLANNED','COMPLETED']],[a,'intervention',['OPEN','COMPLETED']],[b,'purchaseorder',['ORDERED','RECEIVED']],[b,'customerorder',['CANCELLED','CONFIRMED','COMPLETED']]]){
      const record=await prisma.businessRecord.findFirstOrThrow({where:{applicationId:f.app.id,entityCode:entity,archivedAt:null}});
      const original=record.data.status;
      for(const status of states){
        const cap=await prisma.bmFeatureCapability.findFirst({where:{tenantId:f.app.tenantId,configuration:{path:['transition','value'],equals:status},requiredEntities:{has:entity}}});
        if(cap && status!==original)await assert.rejects(()=>provider.update(f.resource(entity),record.id,{status},{...f.ctx,permissions:[entity+'.update']}),/FORBIDDEN/);
        const updated=await api('/api/data-runtime/execute',{resource:f.resource(entity),operation:'UPDATE',targetId:record.id,input:{status}},f.cookie);assert(updated.success,JSON.stringify(updated));
      }
      await provider.update(f.resource(entity),record.id,{status:original},f.ctx);
    }
  });
  await check('PUBLISHED_UI_REAL_RENDERER',async()=>{
    const result=await new Promise(resolve=>{const proc=spawn(process.execPath,['node_modules/vitest/vitest.mjs','run','src/features/ui-builder/renderer/Phase7.postgres.test.jsx'],{cwd:'../frontend',env:{...process.env,PH7_FIXTURES:JSON.stringify([a,b].map(f=>({code:f.code,cookie:f.cookie,tenantId:f.app.tenantId,versionId:f.version.id}))),PH7_STAMP:stamp},stdio:['ignore','pipe','pipe'],windowsHide:true});let output='';proc.stdout.on('data',d=>output+=d);proc.stderr.on('data',d=>output+=d);proc.on('close',code=>resolve({code,output}));});console.log(result.output);assert.equal(result.code,0);
    for(const [f,entity,key,prefix] of [[a,'customer','code','RT-WIFI-'],[b,'product','reference','RT-IT-']])assert.equal(await prisma.businessRecord.count({where:{applicationId:f.app.id,entityCode:entity,data:{path:[key],equals:prefix+stamp}}}),1);
  });
  if(process.env.PH7_BROWSER==='1')await check('REAL_BROWSER_RESPONSIVE',()=>require('./ph7-browser.cjs')([a,b]));
  fs.writeFileSync('.tmp/ph7-acceptance.json',JSON.stringify({database:target,results,stamp},null,2));
}
main().catch(e=>{console.error(e.message.replaceAll(decodeURIComponent(url.password),'[REDACTED]'));process.exitCode=1;}).finally(async()=>{if(child)child.kill();await prisma.$disconnect();});
