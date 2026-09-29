const fs = require('node:fs');
const { environment, root } = require('./environment.cjs');
const env = environment();
const results = { mode: env.APP_ENV, kind: 'REAL_RUNTIME_TEST', timestamp: new Date().toISOString(), checks: [] };
const jar = new Map();
async function call(url, data) {
  const response = await fetch('http://localhost:3003' + url, { method: data ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', Cookie: [...jar].map(([k,v]) => k+'='+v).join('; ') }, body: data ? JSON.stringify(data) : undefined, signal: AbortSignal.timeout(15000) });
  const cookies = response.headers.getSetCookie();
  for (const cookie of cookies) { const pair = cookie.split(';')[0]; const i = pair.indexOf('='); jar.set(pair.slice(0,i), pair.slice(i+1)); }
  const body = await response.json().catch(() => ({}));
  return { status: response.status, data: body.data ?? body, cookies };
}
function check(name, pass, status) { results.checks.push({ name, result: pass ? 'REAL_PASS' : 'FAIL', ...(status === undefined ? {} : { status }) }); if (!pass) throw new Error(name); }
(async () => {
  try {
    for (const url of ['/health','/ready','/api/iam/health','/api/iam/health/ready']) { const r = await call(url); check(url, r.status === 200 && !['not_ready','unhealthy'].includes(r.data.status), r.status); }
    const front = await fetch('http://localhost:3000', { signal: AbortSignal.timeout(30000) }); check('Frontend HTTP', front.ok, front.status);
    if (!env.TEST_USER_PASSWORD) throw new Error('CONFIG_MISSING: TEST_USER_PASSWORD');
    const login = await call('/api/iam/auth/login', { identifier: env.TEST_USER_USERNAME || 'techzonetest', password: env.TEST_USER_PASSWORD }); check('Login', login.status === 200, login.status);
    check('HttpOnly cookies', ['iam_access_token','iam_refresh_token'].every(name => login.cookies.some(c => c.startsWith(name+'=') && /;\s*HttpOnly/i.test(c))));
    const me = await call('/api/iam/auth/me'); check('Auth me non-admin', me.status === 200 && me.data.user?.isAdmin === false, me.status);
    const tenants = await call('/api/iam/auth/tenants'); check('Tenant list', tenants.status === 200 && Array.isArray(tenants.data), tenants.status);
    const tenant = tenants.data.find(t => (t.code ?? t.tenant?.code) === 'techzone-test'); check('Active Techzone Test membership', !!tenant);
    const id = tenant.id ?? tenant.tenantId ?? tenant.tenant?.id;
    const selected = await call('/api/iam/auth/tenant/switch', { tenantId: id }); check('Tenant selection', selected.status === 200, selected.status);
    const active = await call('/api/iam/auth/me'); check('Active session tenant', active.data.activeTenant === id);
    for (const url of ['/api/business-manager/applications','/api/business-manager/configurations','/api/data-runtime/resources']) { const r = await call(url); check(url, r.status === 200, r.status); }
    const admin = await call('/api/iam/users'); check('IAM administration denied', admin.status === 403, admin.status);
    await call('/api/iam/auth/logout', {});
    // A browser render cannot be certified by Vite's HTTP fallback.
    const { spawnSync } = require('node:child_process');
    const browser = spawnSync(process.execPath, [root + '/scripts/windows/browser.cjs'], { cwd: root, env, stdio: 'inherit', windowsHide: true });
    check('Browser route renders and sidebar', browser.status === 0);
  } catch (error) { results.failure = error.message.startsWith('CONFIG_MISSING') ? error.message : 'Failed check: ' + (results.checks.at(-1)?.name || 'connection'); process.exitCode = 1; }
  finally { fs.mkdirSync(root+'/.runtime', { recursive: true }); fs.writeFileSync(root+'/.runtime/test-results.json', JSON.stringify(results,null,2)); console.log(JSON.stringify(results,null,2)); }
})();
