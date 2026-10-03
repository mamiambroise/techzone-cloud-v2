// Read-only audit. Explicit allowlist: never persist raw user/configuration payloads.
const fs = require('node:fs');
const { environment, root } = require('./windows/environment.cjs');
const env = environment();
const base = env.DOLIBARR_URL.replace(/\/+$/, '').replace(/\/api\/index\.php$/, '') + '/api/index.php';
const safeUser = user => ({ id: user.id, login: user.login, active: String(user.status ?? user.statut) === '1', admin: String(user.admin) === '1', entity: user.entity, rights: user.rights });
(async () => {
  const evidence = { date: new Date().toISOString(), credentialConfigured: Boolean(env.DOLIBARR_API_KEY), tenantId: env.DOLIBARR_TENANT_ID, encryptionKeyConfigured: /^[a-f0-9]{64}$/i.test(env.ERP_CREDENTIAL_ENCRYPTION_KEY || ''), requests: [] };
  for (const endpoint of ['/status', '/users/info?includepermissions=1', '/users?limit=100', '/users/2?includepermissions=1', '/users/2/groups', '/setup/modules', '/setup/modules/status/all?status=all']) {
    const started = Date.now();
    try {
      const response = await fetch(base + endpoint, { headers: { DOLAPIKEY: env.DOLIBARR_API_KEY }, signal: AbortSignal.timeout(15000) });
      const body = await response.json();
      let data;
      if (response.ok) {
        if (endpoint === '/status') data = { version: body.success?.dolibarr_version, environment: body.success?.environment };
        else if (endpoint.includes('/groups')) data = body.map(group => ({ id: group.id, name: group.name }));
        else if (endpoint.startsWith('/users?')) data = body.map(safeUser);
        else if (endpoint.startsWith('/users/')) data = safeUser(body);
        else if (endpoint === '/setup/modules') data = body;
        else data = Object.fromEntries(['SOCIETE', 'PRODUCT', 'COMMANDE', 'FACTURE', 'STOCK'].map(key => [key, { module: body[key]?.modName, active: String(body[key]?.active) === '1' }]));
      }
      evidence.requests.push({ endpoint, httpStatus: response.status, durationMs: Date.now() - started, data });
    } catch (error) { evidence.requests.push({ endpoint, error: error.name, durationMs: Date.now() - started }); }
  }
  fs.writeFileSync(root + '/.runtime/dolibarr-access-audit.json', JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
})().catch(error => { console.error(error.name); process.exitCode = 1; });
