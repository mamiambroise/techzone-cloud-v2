// Read-only runtime diagnosis. Never print credentials, cookies or ERP records.
const { environment } = require('./windows/environment.cjs');
const env = environment();
const cookies = new Map();
async function request(route, body) {
  const response = await fetch('http://localhost:3003/api' + route, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', Cookie: [...cookies].map(([k,v]) => `${k}=${v}`).join('; ') },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(25000),
  });
  for (const raw of response.headers.getSetCookie()) {
    const pair = raw.split(';')[0]; const at = pair.indexOf('='); cookies.set(pair.slice(0,at), pair.slice(at+1));
  }
  const data = await response.json();
  console.log(JSON.stringify({ route, status: response.status, code: data.code || data.error?.code, traceId: data.traceId || response.headers.get('x-trace-id') }));
  return { ok: response.ok, data: data.data ?? data };
}
(async () => {
  const login = await request('/iam/auth/login', { identifier: env.TEST_USER_USERNAME || 'techzonetest', password: env.TEST_USER_PASSWORD, deviceFingerprint: 'erp-cdc07-probe', deviceName: 'ERP acceptance' });
  if (!login.ok) { process.exitCode = 1; return; }
  const tenants = await request('/iam/auth/tenants');
  const list = Array.isArray(tenants.data) ? tenants.data : tenants.data.items || tenants.data.tenants || [];
  if (list[0]?.id) await request('/iam/auth/tenant/switch', { tenantId: list[0].id });
  for (const resource of ['clients','products','orders','invoices']) await request('/erp/' + resource);
})().catch(error => { console.error(error.cause?.code || error.name); process.exitCode = 1; });
