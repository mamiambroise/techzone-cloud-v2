const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname,'..');
const { chromium } = require(root+'/logs/browser-tools/node_modules/playwright');
const ids = JSON.parse(fs.readFileSync(path.join(process.env.TEMP,'consolidation-ids.json'),'utf8'));
const result = { routes:[],responsive:[],errors:[],network:[],authExpected:[],actions:[] };
(async () => {
 const browser = await chromium.launch({ channel:'msedge',headless:true });
 try {
  const context = await browser.newContext({ viewport:{ width:1440,height:1000 } });
  const page = await context.newPage(); page.on('pageerror',e => result.errors.push(e.message));
  const fixture = JSON.parse(fs.readFileSync(path.join(process.env.TEMP,'consolidation-fixtures.json'),'utf8'))[0];
  await page.goto('http://localhost:3000/login'); await page.locator('#identifier').fill(fixture.username); await page.locator('#password').fill(fixture.password); await page.locator('button[type=submit]').click(); await page.waitForURL('**/dashboard');
  let authStage = false;
  page.on('response',r => { if (new URL(r.url()).pathname.startsWith('/api/') && r.status() >= 400) (authStage ? result.authExpected : result.network).push({ path:new URL(r.url()).pathname,status:r.status() }); });
  const runStamp = Date.now();
  const pmQuery = '?pack='+ids.pack.id+'&version='+ids.packVersion.id;
  const bmBase = '/business-manager/applications/'+ids.app.id+'/versions/'+ids.version.id;
  const routes = ['/business-manager','/business-manager/applications',bmBase+'/data-model',bmBase+'/features',bmBase+'/navigation','/business-manager/configuration',bmBase+'/validation',...['','/packs','/versions','/modules','/features','/capabilities','/dependencies','/rules','/validation','/publication','/registry'].map(s => '/packs'+s+pmQuery),...['','/context','/manifest','/resolver','/effective','/cache','/diagnostics'].map(s => '/runtime'+s+'?resolution='+ids.resolution.resolutionId)];
  for (const route of routes) {
    await page.goto('http://localhost:3000'+route); await page.locator('#main-sidebar').waitFor(); await page.locator('main h1').waitFor();
    assert.equal(new URL(page.url()).pathname,route.split('?')[0]);
    await page.waitForFunction(() => !document.querySelector('main [role="status"]'));
    const text = await page.locator('main').innerText(); assert.ok(text.length > 40,route);
    assert.ok(!/Insufficient permission|Opération impossible|Runtime indisponible/.test(text),route);
    result.routes.push({ route,title:await page.locator('main h1').innerText(),pass:true });
  }
  // Real UI authoring, using the draft cloned version from the API recipe.
  await page.goto('http://localhost:3000/packs/modules?pack='+ids.pack.id+'&version='+ids.clone.id);
  await page.getByRole('button',{ name:'Créer un élément' }).click();
  await page.getByLabel('Code technique',{ exact:true }).count().then(async n => { if(n) await page.getByLabel('Code technique',{exact:true}).fill('ui.module.'+Date.now()); else await page.getByLabel('Code',{exact:true}).fill('ui.module.'+Date.now()); });
  await page.getByLabel('Nom',{exact:true}).fill('Module créé '+runStamp);
  await page.getByRole('button',{ name:'Enregistrer',exact:true }).click();
  await page.getByText('Module créé '+runStamp,{exact:true}).waitFor(); result.actions.push('CREATE_MODULE_UI');
  const row = page.getByRole('row').filter({ hasText:'Module créé '+runStamp });
  await row.getByRole('button',{ name:'Modifier' }).click(); await page.getByLabel('Nom',{exact:true}).fill('Module modifié '+runStamp); await page.getByRole('button',{ name:'Enregistrer',exact:true }).click(); await page.getByText('Module modifié '+runStamp,{exact:true}).waitFor(); result.actions.push('UPDATE_MODULE_UI');
  const screenshotRoutes = ['/packs'+pmQuery,'/packs/modules?pack='+ids.pack.id+'&version='+ids.clone.id,'/runtime/effective?resolution='+ids.resolution.resolutionId];
  for (const width of [1920,1440,1280,1024,768,390]) {
    await page.setViewportSize({ width,height:1000 });
    for (const route of screenshotRoutes) {
      await page.goto('http://localhost:3000'+route); await page.locator('main h1').waitFor(); await page.waitForTimeout(350);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth+1);
      result.responsive.push({ width,route,overflow }); assert.equal(overflow,false,route+' width '+width);
    }
    await page.screenshot({ path:root+'/logs/runtime-'+width+'.png',fullPage:true });
  }
  await page.setViewportSize({ width:1440,height:1000 }); await page.goto('http://localhost:3000/packs'+pmQuery); await page.getByText('Activité récente',{exact:true}).waitFor(); await page.waitForFunction(() => !document.querySelector('main [role="status"]')); await page.screenshot({ path:root+'/logs/pm-cockpit.png',fullPage:true });
  await page.reload(); await page.locator('main h1').waitFor(); result.actions.push('AUTHENTICATED_REFRESH');
  const anonymous = await browser.newContext(); const login = await anonymous.newPage(); await login.goto('http://localhost:3000/packs'); await login.waitForURL('**/login'); result.actions.push('ANONYMOUS_REDIRECT');
  for (const width of [1920,1440,1280,1024,768,390]) { await login.setViewportSize({ width,height:1000 }); assert.equal(await login.evaluate(() => document.documentElement.scrollWidth > innerWidth+1),false); result.responsive.push({ width,route:'/login',overflow:false }); }
  await login.screenshot({ path:root+'/logs/auth-mobile.png',fullPage:true }); await login.setViewportSize({ width:1440,height:1000 }); await login.screenshot({ path:root+'/logs/auth-desktop.png',fullPage:true });
  await login.getByLabel('Identifiant ou email').fill('nonexistent-consolidation-test'); await login.getByLabel('Mot de passe',{exact:true}).fill('invalid-password'); await login.getByRole('button',{ name:'Se connecter' }).click(); await login.getByRole('alert').waitFor(); result.actions.push('INVALID_LOGIN_INLINE_ERROR');
  // Revoke the real server session while the React tab remains authenticated.
  authStage = true;
  await page.goto('http://localhost:3000/runtime/resolver?resolution='+ids.resolution.resolutionId);
  await page.getByRole('button',{ name:'Relancer la résolution' }).waitFor();
  await context.request.post('http://localhost:3000/api/iam/auth/logout');
  await page.getByRole('button',{ name:'Relancer la résolution' }).click();
  await page.waitForURL('**/login'); await page.getByText('Votre session a expiré. Connectez-vous pour reprendre.').waitFor(); result.actions.push('REVOKED_SESSION_401_REDIRECT');
  await page.locator('#identifier').fill(fixture.username); await page.locator('#password').fill(fixture.password);
  let submissions = 0;
  await page.route('**/api/iam/auth/login',async route => { submissions++; await new Promise(resolve => setTimeout(resolve,300)); await route.continue(); });
  await page.locator('form').evaluate(form => { form.requestSubmit(); form.requestSubmit(); });
  await page.waitForURL('**/runtime/resolver?resolution=*'); assert.equal(submissions,1); result.actions.push('DOUBLE_SUBMIT_ONE_REQUEST_AND_RETURN_ROUTE');
  await page.unroute('**/api/iam/auth/login');
  await context.storageState({ path:path.join(process.env.TEMP,'consolidation-admin-auth.json') });
  const ordinary = JSON.parse(fs.readFileSync(path.join(process.env.LOCALAPPDATA,'TechzoneRecipe','test-login.json'),'utf8'));
  await login.locator('#identifier').fill(ordinary.username); await login.locator('#password').fill(ordinary.password); await login.getByRole('button',{ name:'Se connecter' }).click();
  await login.waitForURL('**/packs'); await login.getByText(/interdit/i).first().waitFor();
  assert.equal((await anonymous.request.get('http://localhost:3000/api/pack-manager/packs')).status(),403); result.actions.push('ORDINARY_USER_403_UI_AND_API');
  assert.deepEqual(result.errors,[]); assert.deepEqual(result.network,[]); result.pass=true;
 } catch(e) { result.pass=false; result.failure=e.message; process.exitCode=1; }
 finally { fs.writeFileSync(root+'/docs/platform-consolidation/browser-acceptance.json',JSON.stringify(result,null,2)); console.log(JSON.stringify({ pass:result.pass,routes:result.routes.length,responsive:result.responsive.length,actions:result.actions,errors:result.errors,network:result.network,failure:result.failure })); await browser.close(); }
})();
