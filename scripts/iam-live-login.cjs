// Real IAM checks. Credentials stay in the private per-user file, outside Git.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const base = 'http://localhost:5001';

async function main() {
  const result = { timestamp: new Date().toISOString() };
  const account = JSON.parse(fs.readFileSync(path.join(process.env.LOCALAPPDATA, 'TechzoneRecipe', 'test-login.json')));
  for (const route of ['health', 'ready']) {
    try {
      const response = await fetch(`${base}/${route}`, { signal: AbortSignal.timeout(15000) });
      const body = await response.json();
      result[route] = { status: response.status, code: body.code };
    } catch (error) { result[route] = { error: error.name }; }
  }
  let stage = 'login';
  try {
    const response = await fetch(`${base}/api/iam/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: account.username, password: account.password, deviceFingerprint: 'techzone-recipe-real' }),
      signal: AbortSignal.timeout(20000),
    });
    const body = await response.json();
    result.login = { status: response.status, code: body.code, technicalDetailsExposed: !!body.details };
    if (response.ok) {
      const cookies = response.headers.getSetCookie();
      result.login.httpOnly = cookies.length === 2 && cookies.every(value => value.includes('HttpOnly'));
      const cookie = cookies.map(value => value.split(';')[0]).join('; ');
      for (const [key, route, method] of [['me', 'me', 'GET'], ['tenants', 'context/tenants', 'GET'], ['context', 'context/resolve', 'POST']]) {
        stage = key;
        const check = await fetch(`${base}/api/iam/${route}`, {
          method, headers: { Cookie: cookie, 'Content-Type': 'application/json' },
          body: method === 'POST' ? '{}' : undefined, signal: AbortSignal.timeout(20000),
        });
        const data = await check.json();
        result[key] = { status: check.status, code: data.code, contextStatus: data.data?.status, count: Array.isArray(data.data) ? data.data.length : undefined };
      }
    }
  } catch (error) { result[stage] = { ...result[stage], error: error.name }; }
  const output = path.join(root, 'docs/postgresql-stability/iam-correction-live.json');
  if (fs.existsSync(output)) fs.copyFileSync(output, output.replace('.json', `.${Date.now()}.json`));
  fs.writeFileSync(output, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
}
main().catch(error => { console.error(JSON.stringify({ error: error.name })); process.exitCode = 1; });
