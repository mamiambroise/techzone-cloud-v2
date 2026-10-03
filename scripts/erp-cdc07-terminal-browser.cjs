// Real browser acceptance; persisted evidence contains no cookies, keys or ERP records.
const fs = require('node:fs');
const { root, environment } = require('./windows/environment.cjs');
const { chromium } = require(root + '/logs/browser-tools/node_modules/playwright');
const env = environment();
const resources = ['clients', 'products', 'orders', 'invoices', 'stocks'];
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const evidence = { date: new Date().toISOString(), kind: 'REAL_BROWSER_AND_REAL_DOLIBARR', resources: [], cancelled: [], errors: [], responsive: [] };
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on('pageerror', error => evidence.errors.push(error.name));
    await page.goto('http://localhost:3000/login');
    await page.locator('#identifier').fill(env.TEST_USER_USERNAME || 'techzonetest');
    await page.locator('#password').fill(env.TEST_USER_PASSWORD);
    await page.locator('button[type=submit]').click();
    await page.waitForURL('**/dashboard');
    const started = new Map(), completed = new Map(), handlers = [];
    page.on('request', request => { const resource = new URL(request.url()).pathname.split('/').pop(); if (resources.includes(resource) && request.url().includes('/api/erp/')) started.set(request, { time: Date.now(), resource }); });
    page.on('requestfailed', request => { if (started.has(request)) evidence.cancelled.push({ resource: started.get(request).resource, reason: request.failure()?.errorText }); });
    page.on('response', response => {
      const start = started.get(response.request()); if (!start) return;
      handlers.push((async () => {
        let body; try { body = await response.json(); } catch { return; }
        const traceId = body.traceId || response.headers()['x-trace-id'];
        completed.set(start.resource, { resource: start.resource, techzoneEndpoint: new URL(response.url()).pathname, httpStatus: response.status(), durationMs: Date.now() - start.time, countReturned: Array.isArray(body) ? body.length : null, code: body.code || null, traceId, correlationId: response.headers()['x-request-id'] || null });
      })());
    });
    await page.goto('http://localhost:3000/erp');
    await page.waitForFunction(() => {
      const cards = [...document.querySelectorAll('[data-erp-resource]')];
      return cards.length === 5 && cards.every(card => ['LOADED', 'EMPTY', 'UNCONFIGURED', 'FORBIDDEN', 'UNAVAILABLE', 'ERROR'].includes(card.dataset.state));
    }, undefined, { timeout: 25000 });
    await Promise.all(handlers);
    const cards = await page.locator('[data-erp-resource]').evaluateAll(nodes => nodes.map(node => ({ resource: node.dataset.erpResource, finalUiState: node.dataset.state })));
    const logs = fs.readFileSync(root + '/.runtime/backend.out.log', 'utf8').split('\n').flatMap(line => {
      const match = line.match(/\{"event":"ERP_UPSTREAM_RESPONSE".*\}/); if (!match) return [];
      try { return [JSON.parse(match[0])]; } catch { return []; }
    });
    evidence.resources = cards.map(card => {
      const response = completed.get(card.resource) || {};
      const upstream = logs.filter(log => log.traceId && log.traceId === response.traceId).at(-1);
      return { ...response, ...card, dolibarrEndpoint: upstream ? '/api/index.php' + upstream.endpoint : undefined, upstreamStatus: upstream ? upstream.httpStatus : null, upstreamDurationMs: upstream?.durationMs, transportCode: upstream?.transportCode };
    });
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.screenshot({ path: root + '/.runtime/erp-terminal-' + width + '.png', fullPage: true });
      evidence.responsive.push({ width, overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2) });
    }
    evidence.stockChecks = [];
    for (const resource of ['stock-movements', 'warehouses']) {
      const start = Date.now();
      const response = await page.request.get('http://localhost:3000/api/erp/' + resource, { timeout: 20000 });
      const body = await response.json();
      const traceId = body.traceId || response.headers()['x-trace-id'];
      const upstream = fs.readFileSync(root + '/.runtime/backend.out.log', 'utf8').split('\n').flatMap(line => {
        const match = line.match(/\{"event":"ERP_UPSTREAM_RESPONSE".*\}/);
        try { return match ? [JSON.parse(match[0])] : []; } catch { return []; }
      }).filter(log => log.traceId === traceId).at(-1);
      evidence.stockChecks.push({ resource, techzoneEndpoint: '/api/erp/' + resource, dolibarrEndpoint: upstream ? '/api/index.php' + upstream.endpoint : null, httpStatus: response.status(), upstreamStatus: upstream?.httpStatus ?? null, durationMs: Date.now() - start, countReturned: Array.isArray(body) ? body.length : null, code: body.code || null, traceId, correlationId: response.headers()['x-request-id'] || null, capability: 'stock.lire', capabilityState: response.ok() ? 'VERIFIED' : 'FAILED' });
    }
    const permissions = { clients: 'societe.lire', products: 'produit.lire', orders: 'commande.lire', invoices: 'facture.lire', stocks: 'produit.lire + stock.lire' };
    evidence.resources = evidence.resources.map(row => ({ ...row, capability: permissions[row.resource], capabilityState: row.resource === 'stocks' ? (evidence.stockChecks.every(check => check.capabilityState === 'VERIFIED') ? 'VERIFIED' : 'FAILED') : ['LOADED', 'EMPTY'].includes(row.finalUiState) ? 'VERIFIED' : 'FAILED' }));
    evidence.status = evidence.resources.every(row => row.traceId && row.httpStatus && row.dolibarrEndpoint && row.finalUiState !== 'LOADING') && evidence.errors.length === 0 ? 'PASS' : 'FAIL';
    evidence.dataAccessStatus = evidence.resources.length === 5 && evidence.resources.every(row => ['LOADED', 'EMPTY'].includes(row.finalUiState) && row.capabilityState === 'VERIFIED') ? 'PASS' : 'FAIL';
    if (evidence.status !== 'PASS') process.exitCode = 1;
  } catch (error) { evidence.status = 'FAIL'; evidence.failure = error.name; process.exitCode = 1; }
  finally { await browser.close(); fs.writeFileSync(root + '/.runtime/erp-terminal-evidence.json', JSON.stringify(evidence, null, 2)); console.log(JSON.stringify(evidence, null, 2)); }
})();
