const fs = require('fs');
const path = require('path');
// Use only the development account already specified in the repository seed.
// Never log its password, tokens, cookies or returned personal data.
let identifier, password;
const seedPath = path.join(__dirname, '..', 'backend', 'src', 'prisma', 'seed.ts');
try {
  const seed = fs.readFileSync(seedPath, 'utf8');
  identifier = /where:\s*\{ username: '([^']+)'/.exec(seed)?.[1];
  password = /bcrypt\.hash\('([^']+)'/.exec(seed)?.[1];
} catch {}
identifier = identifier || process.env.TEST_LOGIN_IDENTIFIER;
password = password || process.env.TEST_LOGIN_PASSWORD;
const results = { mode: 'REAL_HTTP_AND_CONFIGURED_DATABASE', steps: [] };
let cookies = new Map();
async function call(base, route, method = 'GET', body) {
  const start = Date.now();
  try {
    const response = await fetch(base + route, { method, headers: { 'Content-Type': 'application/json', Cookie: [...cookies].map(([k,v]) => `${k}=${v}`).join('; ') }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(18000) });
    for (const raw of response.headers.getSetCookie()) { const [pair] = raw.split(';'); const split=pair.indexOf('='); cookies.set(pair.slice(0,split),pair.slice(split+1)); }
    const data = await response.json().catch(() => null);
    const result = { route, method, status: response.status, code: data?.code, traceId: response.headers.get('x-trace-id') || response.headers.get('x-request-id'), ms: Date.now()-start };
    results.steps.push(result);
    console.log(JSON.stringify(result));
    return {response,data};
  } catch (error) { const result={route,method,error:error.cause?.code||error.name,ms:Date.now()-start};results.steps.push(result);console.log(JSON.stringify(result));return {}; }
}
(async () => {
  const base = 'http://127.0.0.1:3000';
  await call(base,'/api/iam/me');
  const login=await call(base,'/api/iam/auth/login','POST',{identifier,password,deviceFingerprint:'consolidation-smoke-20260925',deviceName:'Consolidation smoke',deviceType:'browser'});
  if(login.response?.ok && login.data?.data?.user) {
    results.cookieAuth = login.response.headers.getSetCookie().every(v=>v.includes('HttpOnly')) && cookies.has('iam_access_token');
    results.tokensAbsentFromBody = !login.data.data.accessToken && !login.data.data.refreshToken;
    for(const route of ['/api/iam/me','/api/iam/users','/api/iam/sessions','/api/iam/admin/tenants','/api/iam/billing/plans','/api/iam/billing/features','/api/iam/observability/dashboard','/api/iam/logs/search','/api/iam/audit/search','/api/iam/security/events','/api/iam/alerts','/api/platform/applications','/api/erp-registry','/api/data-runtime/contract','/api/automation/contract']) await call(base,route);
    await call(base,'/api/iam/auth/refresh','POST',{});
    await call(base,'/api/iam/me');
    await call(base,'/api/iam/auth/logout','POST',{});
    await call(base,'/api/iam/me');
  }
  fs.writeFileSync('docs/consolidation/live-smoke-results.json',JSON.stringify(results,null,2));
})();
