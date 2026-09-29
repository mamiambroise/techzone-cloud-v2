// Recette HTTP des 7 écrans BM : chaque route est servie par Vite et les API
// appelées par l'écran répondent 200 avec les données réelles du tenant de recette.
const fs = require('node:fs');
const BASE = 'http://localhost:3000';
const API = 'http://localhost:3003';
const results = { timestamp: new Date().toISOString(), login: null, screens: {} };
const screens = [
  ['overview', '/business-manager', ['/api/business-manager/dashboard', '/api/business-manager/activity', '/api/business-manager/applications']],
  ['applications', '/business-manager/applications', ['/api/business-manager/applications']],
  ['configuration', '/business-manager/configuration', ['/api/business-manager/configurations']],
  ['features-index', '/business-manager/features', []],
  ['navigation-index', '/business-manager/navigation', []],
  ['models-index', '/business-manager/models', []],
  ['validation-index', '/business-manager/validation', []],
];
async function main() {
  const login = await fetch(`${API}/api/iam/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'techzonetest', password: process.env.TEST_USER_PASSWORD, deviceFingerprint: 'bm-recipe-browser' }),
  });
  results.login = login.status;
  const cookies = login.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');

  for (const [name, path, apis] of screens) {
    const entry = {};
    const page = await fetch(`${BASE}${path}`);
    entry.httpStatus = page.status;
    const html = await page.text();
    entry.servedByVite = html.includes('/src/main.jsx') || html.includes('@vite');
    entry.api = {};
    for (const api of apis) {
      const r = await fetch(`${API}${api}`, { headers: { Cookie: cookies } });
      const body = await r.json().catch(() => null);
      entry.api[api.replace('/api/business-manager/', '')] = { status: r.status, rows: Array.isArray(body) ? body.length : body ? 'object' : null };
    }
    results.screens[name] = entry;
  }

  const apps = await (await fetch(`${API}/api/business-manager/applications`, { headers: { Cookie: cookies } })).json();
  const versions = await (await fetch(`${API}/api/business-manager/applications/${apps[0].id}/versions`, { headers: { Cookie: cookies } })).json();
  if (versions[0]) {
    const v = versions[0];
    const versionScreens = [
      ['models-workspace', `/business-manager/applications/${apps[0].id}/versions/${v.id}/data-model`, [`/api/business-manager/data-model/${v.id}/schema`, `/api/business-manager/data-model/${v.id}/relations`]],
      ['features-workspace', `/business-manager/applications/${apps[0].id}/versions/${v.id}/features`, [`/api/business-manager/features/${v.id}`, `/api/business-manager/features/${v.id}/dependencies`]],
      ['navigation-workspace', `/business-manager/applications/${apps[0].id}/versions/${v.id}/navigation`, [`/api/business-manager/navigation/${v.id}/menus`]],
      ['validation-workspace', `/business-manager/applications/${apps[0].id}/versions/${v.id}/validation`, [`/api/business-manager/validation/${v.id}/reports`, `/api/business-manager/validation/${v.id}/gate-status`]],
    ];
    for (const [name, path, apis] of versionScreens) {
      const page = await fetch(`${BASE}${path}`);
      const entry = { httpStatus: page.status, servedByVite: (await page.text()).includes('/src/main.jsx'), api: {} };
      for (const api of apis) {
        const r = await fetch(`${API}${api}`, { headers: { Cookie: cookies } });
        const body = await r.json().catch(() => null);
        entry.api[api.split('/').slice(-2).join('/')] = { status: r.status, rows: Array.isArray(body) ? body.length : 'object' };
      }
      results.screens[name] = entry;
    }
    results.context = { application: apps[0].code, version: v.version, status: v.status };
  }
  fs.writeFileSync('docs/business-manager/BM_UI_RECIPE_RESULTS.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
}
main().catch((e) => { results.error = String(e.message); console.log(JSON.stringify(results)); process.exit(1); });
