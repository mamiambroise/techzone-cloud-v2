const fs=require('node:fs');
const path=require('node:path');
const out={timestamp:new Date().toISOString(),checks:[]};
async function check(base,route,options={}){
 const start=Date.now();
 try{const r=await fetch(base+route,{...options,signal:AbortSignal.timeout(12000)});const text=await r.text();let b;try{b=JSON.parse(text);}catch{}
 const result={base,route,method:options.method||'GET',status:r.status,ms:Date.now()-start,code:b?.code,success:b?.success,dependencyStatus:route.includes('health')?b?.data?.status:undefined,traceIdPresent:!!(r.headers.get('x-trace-id')||b?.traceId),technicalDetailsExposed:!!b?.stack||/SELECT .* FROM|PrismaClient|node_modules|postgresql:\/\//i.test(text)};out.checks.push(result);return {response:r,body:b,result};
 }catch(e){const result={base,route,status:'UNAVAILABLE',error:e.name,ms:Date.now()-start};out.checks.push(result);return {result};}
}
(async()=>{
 const base='http://localhost:3003';
 for(const route of ['/health','/ready','/api/iam/health','/api/iam/health/ready','/api/iam/me','/api/platform/applications','/api/erp-registry','/api/config/public'])await check(base,route);
 await check(base,'/api/iam/auth/refresh',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
 await check(base,'/api/iam/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
 await check(base,'/api/iam/auth/login',{method:'POST',headers:{'Content-Type':'application/json','Sec-Fetch-Site':'cross-site'},body:'{}'});
 await check(base,'/api/iam/me',{headers:{Cookie:'iam_access_token=invalid-session-probe'}});
 const cors=await check(base,'/api/iam/auth/login',{method:'OPTIONS',headers:{Origin:'http://localhost:3000','Access-Control-Request-Method':'POST'}});
 out.cors={status:cors.response?.status,allowedOrigin:cors.response?.headers.get('access-control-allow-origin'),credentials:cors.response?.headers.get('access-control-allow-credentials')};
 await check('http://localhost:3000','/api/iam/me');
 await check('http://127.0.0.1:8080','/index.php');
 const accountPath=path.join(process.env.LOCALAPPDATA,'TechzoneRecipe','test-login.json');
 if(fs.existsSync(accountPath)){
  const a=JSON.parse(fs.readFileSync(accountPath));
  const login=await check(base,'/api/iam/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier:a.username,password:a.password,deviceFingerprint:'full-runtime-review'})});out.login=login.result;
  if(login.response?.ok){
   let cookies=login.response.headers.getSetCookie();out.cookieFlags=cookies.map(c=>({httpOnly:c.includes('HttpOnly'),sameSiteLax:c.includes('SameSite=Lax'),secure:c.includes('; Secure')}));
   let cookie=cookies.map(c=>c.split(';')[0]).join('; ');
   for(const route of ['/api/iam/me','/api/iam/auth/sessions','/api/iam/users','/api/erp-registry','/api/platform/dashboard'])await check(base,route,{headers:{Cookie:cookie}});
   await check(base,'/api/iam/context/resolve',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:'{}'});
   const refresh=await check(base,'/api/iam/auth/refresh',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:'{}'});
   if(refresh.response?.ok) cookie=refresh.response.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
   await check(base,'/api/iam/auth/logout',{method:'POST',headers:{Cookie:cookie}});
   out.postLogout=(await check(base,'/api/iam/me',{headers:{Cookie:cookie}})).result;
  }
 }
 fs.writeFileSync('docs/full-runtime-review/http.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out));
})().catch(e=>{console.log(JSON.stringify({error:e.name}));process.exitCode=1;});
