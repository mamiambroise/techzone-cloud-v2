// Negative live HTTP test with the existing non-admin account. Never elevate it.
const assert=require('node:assert/strict');
const {environment}=require('../../scripts/windows/environment.cjs');
const {gate}=require('./ph7-live-gate.cjs');gate('techzonecloud_local');
const env=environment('local'),url=new URL(env.DATABASE_URL);
assert(url.hostname==='127.0.0.1'&&url.port==='55432'&&url.pathname==='/techzonecloud_local');
assert(env.TEST_USER_PASSWORD,'Configured local test password required');
process.env.DATABASE_URL=env.DATABASE_URL;
const {PrismaService}=require('../dist/prisma/prisma.service');const prisma=new PrismaService(),cookies=[],base='http://127.0.0.1:3003';
async function main(){
  const username=env.TEST_USER_USERNAME||'techzonetest';
  const user=await prisma.iamUser.findFirstOrThrow({where:{username}});assert.equal(user.isAdmin,false,'This is a negative test only');
  for(const code of ['WIFI_SERVICES','IT_SALES']){
    const app=await prisma.application.findFirstOrThrow({where:{code}}),version=await prisma.applicationVersion.findFirstOrThrow({where:{applicationId:app.id,version:'1.0.0'}});
    const response=await fetch(base+'/api/iam/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier:username,password:env.TEST_USER_PASSWORD,tenantId:app.tenantId})});assert.equal(response.status,200);
    const cookie=response.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');cookies.push(cookie);
    const call=(route,body)=>fetch(base+route,{method:body?'POST':'GET',headers:{cookie,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
    assert.equal((await call(`/api/runtime/manifests/${code.toLowerCase()}/1.0.0`)).status,403);
    const resource=`bm:${version.id}:customer`;
    assert.equal((await call('/api/data-runtime/query',{resource})).status,403);
    for(const operation of ['CREATE','UPDATE','DELETE'])assert.equal((await call('/api/data-runtime/execute',{resource,operation,input:{code:'DENIED-PH7',name:'Must not persist'}})).status,403);
    assert.equal(await prisma.businessRecord.count({where:{applicationId:app.id,data:{path:['code'],equals:'DENIED-PH7'}}}),0);
    console.log('PASS '+code+' live non-admin manifest/read/create/update/delete denied; no record written');
  }
}
main().catch(e=>{console.error(e.message.replaceAll(env.TEST_USER_PASSWORD,'[REDACTED]'));process.exitCode=1;}).finally(async()=>{for(const cookie of cookies)await fetch(base+'/api/iam/auth/logout',{method:'POST',headers:{cookie,'Content-Type':'application/json'},body:'{}'}).catch(()=>{});await prisma.$disconnect();});
