const fs = require('node:fs');
const { environment, root } = require('./windows/environment.cjs');
const { chromium } = require(root + '/logs/browser-tools/node_modules/playwright');
const env = environment();
(async () => {
  const result = { kind: 'REAL_BROWSER', routes: [], network: [], crashes: [], responsive: [] };
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on('pageerror', error => result.crashes.push(error.name));
    await page.goto('http://localhost:3000/login');
    await page.locator('#identifier').fill(env.TEST_USER_USERNAME || 'techzonetest');
    await page.locator('#password').fill(env.TEST_USER_PASSWORD);
    await page.locator('button[type=submit]').click();
    await page.waitForURL('**/dashboard');
    page.on('response', async response => {
      const path = new URL(response.url()).pathname;
      if (!path.startsWith('/api/erp')) return;
      let body; try { body = await response.json(); } catch { return; }
      result.network.push({ path, status: response.status(), code: body.code, traceId: body.traceId });
    });
    for (const route of ['/erp', '/erp/clients', '/erp/products', '/erp/orders', '/erp/invoices', '/erp/stocks', '/erp/mappings', '/settings/erp']) {
      await page.goto('http://localhost:3000' + route);
      await page.locator('#main-sidebar').waitFor();
      await page.waitForFunction(() => document.querySelector('main')?.innerText.length > 40);
      if (/^\/erp\/(clients|products|orders|invoices|stocks)$/.test(route)) {
        await page.waitForFunction(() => document.querySelector('main')?.innerText.includes('Aucune donnee pour ce module') || document.querySelector('[aria-label="Erreurs ERP"]') || document.querySelector('main table'), undefined, { timeout: 25000 });
      } else await page.waitForTimeout(1200);
      result.routes.push({ route, rendered: true, errorPanels: await page.getByRole('region', { name: 'Erreurs ERP' }).count(), globalErrorBanners: await page.locator('[role=alert]').count() });
    }
    const test = page.getByRole('button', { name: 'Tester la connexion', exact: true });
    if (await test.isEnabled()) { await test.click(); await page.getByRole('button', { name: 'Tester la connexion', exact: true }).waitFor({ timeout: 30000 }); result.connectionTestExecuted = true; }
    const history = page.getByRole('button', { name: 'Actualiser l’historique' });
    if (await history.isEnabled()) { await history.click(); await page.waitForTimeout(500); result.historyExecuted = true; }
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.screenshot({ path: root + '/.runtime/erp-connection-' + width + '.png', fullPage: true });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
      result.responsive.push({ route: '/settings/erp', width, overflow });
    }
    await page.goto('http://localhost:3000/erp');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: root + '/.runtime/erp-overview-mobile.png', fullPage: true });
    result.sessionPreserved = !page.url().includes('/login');
    if (result.crashes.length || result.responsive.some(item => item.overflow) || !result.sessionPreserved || result.network.some(item => item.status === 500)) throw new Error('ERP_BROWSER_CHECK_FAILED');
    result.status = 'PASS';
  } catch (error) { result.status = 'FAIL'; result.failure = error.name; process.exitCode = 1; }
  finally { await browser.close(); fs.writeFileSync(root + '/.runtime/erp-browser-results.json', JSON.stringify(result, null, 2)); console.log(JSON.stringify(result, null, 2)); }
})();
