const fs = require('node:fs');
const path = require('node:path');

const credsPath = path.join(process.env.LOCALAPPDATA, 'TechzoneRecipe', 'test-login.json');
const account = JSON.parse(fs.readFileSync(credsPath, 'utf-8'));

const payload = JSON.stringify({
  identifier: account.username,
  password: account.password,
  deviceFingerprint: 'techzone-recipe-real',
});

async function main() {
  const result = {};

  // Health & Ready
  for (const route of ['health', 'ready']) {
    try {
      const res = await fetch('http://localhost:3003/' + route, { signal: AbortSignal.timeout(15000) });
      const body = await res.json();
      result[route] = { status: res.status, body };
    } catch (e) {
      result[route] = { error: e.name, message: e.message };
    }
  }

  // Login attempt
  try {
    const res = await fetch('http://localhost:3003/api/iam/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      signal: AbortSignal.timeout(20000),
    });
    const body = await res.json();
    result.login = {
      status: res.status,
      body,
      setCookie: res.headers.get('set-cookie'),
    };
  } catch (e) {
    result.login = { error: e.name, message: e.message };
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => console.error('FATAL:', e));
