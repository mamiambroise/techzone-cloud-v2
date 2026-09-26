const { chromium } = require('../logs/browser-tools/node_modules/playwright');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const results = { mode: 'live frontend; authenticated route rendering uses explicit API doubles', live: {}, routes: [], errors };
  try {
    await page.goto('http://localhost:3000/cockpit');
    await page.waitForURL('**/login', { timeout: 25000 });
    results.live.protectedRoute = 'PASS';
    results.live.loginForm = await page.locator('#identifier').isVisible() ? 'PASS' : 'FAIL';
    await page.screenshot({ path: 'docs/consolidation/login.png' });
    await page.route('**/api/**', route => {
      const me = new URL(route.request().url()).pathname === '/api/iam/me';
      return route.fulfill({ status: me ? 200 : 503, contentType: 'application/json', headers: { 'X-Trace-Id': 'browser-contract-test' }, body: JSON.stringify(me ? { success: true, data: { id: 'browser-test', username: 'Browser contract test' } } : { success: false, message: 'Explicit browser contract test: API unavailable', code: 'TEST_UNAVAILABLE', traceId: 'browser-contract-test' }) });
    });
    const source = fs.readFileSync('frontend/src/App.jsx', 'utf8');
    const routes = [...source.matchAll(/<Route path="([^"]+)"/g)].map(m => m[1]).filter(p => !p.includes(':') && !p.includes('*') && p !== '/login' && p !== '/');
    for (const route of routes) {
      const before = errors.length;
      await page.goto('http://localhost:3000' + route);
      await page.waitForTimeout(400);
      results.routes.push({ route, status: errors.length === before ? 'PASS' : 'FAIL', errors: errors.slice(before) });
    }
    results.tokenStorage = await page.evaluate(() => Object.keys(localStorage).filter(key => /token|jwt/i.test(key)));
    results.iframes = await page.locator('iframe').count();
  } catch (error) { results.error = error.message; }
  finally { await browser.close(); }
  fs.writeFileSync('docs/consolidation/browser-results.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
})();
