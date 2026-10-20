// Real IAM login using configured test credentials; never prints cookies or secrets.
const fs = require('node:fs');
const env = require('../../backend/node_modules/dotenv').parse(fs.readFileSync('backend/.env'));
const base = 'http://127.0.0.1:3003/api';
const cookies = new Map();
const checks = [];
async function request(path, body) {
  const response = await fetch(base+path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type':'application/json', Cookie:[...cookies].map(([k,v])=>`${k}=${v}`).join('; ') }, ...(body?{body:JSON.stringify(body)}:{}), signal:AbortSignal.timeout(15000) });
  for (const cookie of response.headers.getSetCookie()) { const first=cookie.split(';')[0]; const pos=first.indexOf('='); cookies.set(first.slice(0,pos),first.slice(pos+1)); }
  const json=await response.json().catch(()=>null);
  checks.push({path,status:response.status,code:json?.code,traceId:response.headers.get('x-trace-id')});
  if(!response.ok) throw new Error(`${path}: HTTP ${response.status} ${json?.code||''}`);
  return json?.data ?? json;
}
async function main() {
  const health = await fetch('http://127.0.0.1:3003/health', {signal:AbortSignal.timeout(15000)});
  checks.push({path:'/health',status:health.status});
  if(!health.ok) throw new Error('BACKEND_HEALTH_FAILED');
  const page = await fetch('http://127.0.0.1:3000/runtime', {signal:AbortSignal.timeout(15000)});
  checks.push({path:'frontend:/runtime',status:page.status});
  if(!page.ok) throw new Error('FRONTEND_RUNTIME_ROUTE_FAILED');
  const proxy = await fetch('http://127.0.0.1:3000/api/runtime/dashboard', {signal:AbortSignal.timeout(15000)});
  checks.push({path:'frontend:/api/runtime/dashboard',status:proxy.status});
  if(proxy.status!==401) throw new Error('FRONTEND_PROXY_OR_ANONYMOUS_GUARD_FAILED');
  try { await request('/runtime/dashboard'); throw new Error('ANONYMOUS_RUNTIME_ACCESS_ALLOWED'); }
  catch (error) { if (checks.at(-1)?.status !== 401) throw error; }
  const identifier=env.TEST_LOGIN_IDENTIFIER || env.TEST_USER_USERNAME;
  const password=env.TEST_LOGIN_PASSWORD || env.TEST_USER_PASSWORD;
  if(!identifier || !password) throw new Error('TEST_LOGIN_CREDENTIALS_MISSING');
  const login=await request('/iam/auth/login',{identifier,password,deviceFingerprint:'runtime-recette-http'});
  if(login.mfaRequired) throw new Error('MFA_REQUIRED');
  const response=await request('/iam/auth/tenants');
  const tenants=(Array.isArray(response)?response:response.tenants||[]).map(t=>t.tenant||t).filter(t=>t.status==='ACTIVE');
  if(!tenants.length) throw new Error('NO_AUTHORIZED_TENANT');
  const preferred=tenants.find(t=>t.code==='TENANT_BOUTIQUE_A') || tenants[0];
  await request('/iam/auth/tenant/switch',{tenantId:preferred.id});
  const me=await request('/iam/auth/me');
  const permissions=me.user?.permissions||[];
  const can=p=>me.user?.isAdmin||me.user?.isSuperAdmin||permissions.includes('*')||permissions.includes(p);
  const endpoints=[['/runtime/dashboard','runtime.resolution.read'],['/runtime/contexts','runtime.resolution.read'],['/pack-manager/registry','pack.read'],['/business-manager/applications','bm:read'],['/business-manager/environments','bm:read'],['/runtime/cache/status','runtime.cache.read'],['/runtime/cache/entries','runtime.cache.read'],['/runtime/providers/health','runtime.provider.read']];
  for(const [endpoint,permission] of endpoints) {
    if(can(permission)) await request(endpoint);
    else checks.push({path:endpoint,status:'NOT_TESTED_PERMISSION_NOT_GRANTED'});
  }
  const report={checkedAt:new Date().toISOString(),tenantCode:preferred.code,checks,fullBusinessAcceptance:'NOT TESTED'};
  fs.writeFileSync('docs/recette/runtime-http-verification.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}
main().catch(error=>{
  const report={checkedAt:new Date().toISOString(),status:'BLOCKED',message:error.message,checks,fullBusinessAcceptance:'NOT TESTED'};
  fs.writeFileSync('docs/recette/runtime-http-verification.json',JSON.stringify(report,null,2)+'\n');
  console.error(JSON.stringify(report,null,2));process.exitCode=1;
});
