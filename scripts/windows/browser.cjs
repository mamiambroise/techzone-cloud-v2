const fs = require('node:fs');
const { environment, root } = require('./environment.cjs');
const env = environment();
let chromium;
try { ({ chromium } = require(root+'/frontend/node_modules/@playwright/test')); }
catch { try { ({ chromium } = require(root+'/logs/browser-tools/node_modules/playwright')); } catch { console.error('BROWSER_NOT_EXECUTED: install @playwright/test in frontend'); process.exit(1); } }
(async () => {
  const result = { kind: 'REAL_RUNTIME_TEST', routes: [], errors: [], network: [] };
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on('pageerror', e => result.errors.push(e.message));
    await page.goto('http://localhost:3000/login');
    await page.locator('#identifier').fill(env.TEST_USER_USERNAME || 'techzonetest');
    await page.locator('#password').fill(env.TEST_USER_PASSWORD);
    await page.locator('button[type=submit]').click();
    await page.waitForURL('**/dashboard');
    await page.locator('#main-sidebar').waitFor();
    // Capture unexpected failures only after the anonymous bootstrap/login.
    page.on('response', r => { const p = new URL(r.url()).pathname; if (p.startsWith('/api/') && r.status() >= 400) result.network.push({ path:p, status:r.status() }); });
    for (const route of ['/dashboard','/applications','/business-manager','/business-manager/configuration','/erp','/data-runtime','/ui/forms']) {
      await page.goto('http://localhost:3000'+route);
      await page.locator('#main-sidebar').waitFor();
      await page.waitForFunction(() => { const m = document.querySelector('main'); return m && m.innerText.trim().length > 15 && !/Chargement/.test(m.innerText); });
      await page.waitForTimeout(700);
      const text = await page.locator('main').innerText();
      if (await page.getByTestId('tenant-required').count() || /Accès interdit|Authentication required/.test(text)) throw new Error('Invalid route context: '+route);
      result.routes.push({ route, rendered: true, comingSoon: !!await page.getByTestId('coming-soon').count() });
      await page.screenshot({ path: root+'/.runtime/'+route.replaceAll('/','_')+'.png', fullPage:true });
    }
    const links = await page.locator('#main-sidebar [data-navigation-group] > div > a').evaluateAll(es => es.map(e => e.getAttribute('href')));
    for (const href of links) {
      await page.locator('#main-sidebar a').first().waitFor();
      await page.locator('#main-sidebar a[href="'+href+'"]').first().click();
      await page.waitForURL('**'+href);
    }
    result.sidebarClicks = links.length;
    if (result.errors.length) throw new Error('React crash');
    // ERP integration dependencies are reported separately; all other API failures fail the recipe.
    result.external = result.network.filter(r => /erp/.test(r.path));
    if (result.network.some(r => !/erp/.test(r.path))) throw new Error('Unexpected API failure');
    result.status = 'REAL_PASS';
  } catch(e) { result.status='FAIL'; result.failure='BROWSER_CHECK_FAILED'; result.errorType=e.name; process.exitCode=1; }
  finally { await browser.close(); fs.writeFileSync(root+'/.runtime/browser-results.json',JSON.stringify(result,null,2)); console.log(JSON.stringify(result,null,2)); }
})();
