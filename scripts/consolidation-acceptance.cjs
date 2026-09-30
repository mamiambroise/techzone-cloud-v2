// Real local API acceptance. Credentials are read from TEMP, never written to the repository.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname,'..');
const { chromium } = require(root+'/logs/browser-tools/node_modules/playwright');
const fixtures = JSON.parse(fs.readFileSync(path.join(process.env.TEMP,'consolidation-fixtures.json'),'utf8'));
const results = [];
(async () => {
  const browser = await chromium.launch({ channel:'msedge',headless:true });
  try {
    const contexts = [];
    for (const fixture of fixtures) {
      const context = await browser.newContext(); const page = await context.newPage();
      await page.goto('http://localhost:3000/login');
      await page.locator('#identifier').fill(fixture.username); await page.locator('#password').fill(fixture.password);
      await page.locator('button[type=submit]').click(); await page.waitForURL('**/dashboard');
      contexts.push(context); await page.close();
    }
    async function api(method,url,body,expected = [200,201],tenant = 0) {
      const response = await contexts[tenant].request.fetch('http://localhost:3000/api'+url,{ method,data:body });
      let raw; try { raw = await response.json(); } catch { raw = {}; }
      results.push({ method,url,status:response.status(),expected,pass:expected.includes(response.status()) });
      assert.ok(expected.includes(response.status()),method+' '+url+' '+response.status()+' '+JSON.stringify(raw));
      return raw.success === true ? raw.data : raw;
    }
    const stamp = Date.now();
    const app = await api('POST','/business-manager/applications',{ code:'qa_'+stamp,name:'Application recette consolidation' });
    const version = await api('POST',`/business-manager/applications/${app.id}/versions`,{ version:'1.0.0' });
    const env = await api('POST','/business-manager/environments',{ code:'DEV_'+stamp,name:'Développement recette',type:'DEVELOPMENT' });
    const entity = await api('POST',`/business-manager/data-model/${version.id}/entities`,{ code:'customer',name:'Client' });
    await api('POST',`/business-manager/data-model/entities/${entity.id}/fields`,{ code:'name',label:'Nom',type:'TEXT',required:true });
    const contract = await api('POST',`/business-manager/contracts/versions/${version.id}`,{ code:'customer.contract',name:'Contrat clients',manifest:{ contract:'qa.customer',contractVersion:'1.0.0',entities:['customer'] } });
    await api('POST',`/business-manager/contracts/contract/${contract.id}/validate`,{});
    const quality = await api('POST',`/business-manager/validation/${version.id}/run`,{});
    assert.equal(quality.gateResult,'PASS');
    const pack = await api('POST','/pack-manager/packs',{ code:'qa_'+stamp,name:'Pack recette consolidation' });
    await api('PATCH',`/pack-manager/packs/${pack.id}`,{ rowVersion:0,name:'Stale' },[409]);
    await api('PATCH',`/pack-manager/packs/${pack.id}`,{ rowVersion:1,name:'Pack recette validée' });
    const pv = await api('POST',`/pack-manager/packs/${pack.id}/versions`,{ versionNumber:'1.0.0' });
    await api('POST',`/pack-manager/versions/${pv.id}/publish`,{},[409]);
    const module = await api('POST',`/pack-manager/versions/${pv.id}/modules`,{ code:'core',name:'Module principal',enabled:true });
    const feature = await api('POST',`/pack-manager/versions/${pv.id}/features`,{ code:'customer.list',name:'Liste clients',moduleId:module.id,enabled:true });
    const cap = await api('POST','/pack-manager/capabilities',{ code:'customer.read.'+stamp,name:'Lire les clients' });
    await api('POST',`/pack-manager/features/${feature.id}/capabilities`,{ capabilityId:cap.id,relationType:'PROVIDES' });
    await api('POST',`/pack-manager/versions/${pv.id}/dependencies`,{ sourceType:'FEATURE',sourceId:feature.code,targetType:'MODULE',targetRef:module.code,dependencyType:'REQUIRED' });
    await api('POST',`/pack-manager/versions/${pv.id}/rules`,{ code:'dev.allow',name:'Activation développement',targetType:'FEATURE',targetId:feature.id,effect:'ENABLE',expression:{ field:'environment.code',operator:'EQ',value:env.code } });
    await api('POST',`/pack-manager/versions/${pv.id}/rules`,{ code:'bad.rule',name:'Invalide',targetType:'FEATURE',targetId:feature.id,effect:'ENABLE',expression:{ field:'permissions',operator:'EXEC',value:'code' } },[400]);
    await api('POST',`/pack-manager/versions/${pv.id}/modules`,{ code:'secret.module',name:'Refus',configuration:{ apiToken:'not-a-real-token' } },[400]);
    const validation = await api('POST',`/pack-manager/versions/${pv.id}/validate`,{}); assert.equal(validation.status,'VALID');
    const manifest = await api('POST',`/pack-manager/versions/${pv.id}/manifest`,{}); assert.match(manifest.manifestHash,/^sha256:/);
    const published = await api('POST',`/pack-manager/versions/${pv.id}/publish`,{}); assert.equal(published.status,'PUBLISHED');
    await api('POST',`/pack-manager/versions/${pv.id}/modules`,{ code:'forbidden',name:'Refus' },[409]);
    const request = { applicationId:app.id,businessVersionId:version.id,environment:env.code,packCode:pack.code,packVersion:'1.0.0' };
    const resolved = await api('POST','/runtime/resolve',request); assert.equal(resolved.status,'RESOLVED');
    const effective = await api('GET',`/runtime/resolutions/${resolved.resolutionId}/effective-manifest`); assert.equal(effective.executable,true);
    const cached = await api('POST','/runtime/resolve',request); assert.equal(cached.cache,'HIT');
    await api('POST','/runtime/resolve',{ ...request,context:{ permissions:['*'] } },[400]);
    await api('POST','/runtime/cache/invalidate',{ scope:'TENANT' });
    await api('PATCH',`/business-manager/data-model/entities/${entity.id}`,{ name:'Client modifié' });
    const stale = await api('POST','/runtime/resolve',request); assert.equal(stale.status,'BLOCKED');
    await api('POST',`/business-manager/validation/${version.id}/run`,{});
    const recovered = await api('POST','/runtime/resolve',request); assert.equal(recovered.status,'RESOLVED');
    for (const [method,url,body] of [['GET',`/pack-manager/packs/${pack.id}`],['PATCH',`/pack-manager/packs/${pack.id}`,{ rowVersion:2,name:'Foreign' }],['POST',`/pack-manager/versions/${pv.id}/publish`,{}],['GET',`/runtime/resolutions/${resolved.resolutionId}`],['POST','/runtime/resolve',request]]) await api(method,url,body,[404],1);
    const clone = await api('POST',`/pack-manager/versions/${pv.id}/clone`,{ versionNumber:'1.1.0' }); assert.equal(clone.modules.length,1); assert.notEqual(clone.modules[0].id,module.id);
    await api('GET',`/pack-manager/versions/${pv.id}/compare/${clone.id}`);
    const archivePack = await api('POST','/pack-manager/packs',{ code:'archive_'+stamp,name:'Archivage recette' });
    await api('POST',`/pack-manager/packs/${archivePack.id}/archive`,{});
    await api('POST',`/pack-manager/packs/${archivePack.id}/restore`,{});
    for (const url of ['/pack-manager/dashboard','/pack-manager/registry','/runtime/dashboard','/runtime/cache/status','/runtime/cache/entries','/runtime/providers/health']) await api('GET',url);
    await contexts[0].storageState({ path:path.join(process.env.TEMP,'consolidation-admin-auth.json') });
    fs.writeFileSync(path.join(process.env.TEMP,'consolidation-ids.json'),JSON.stringify({ app,version,env,pack,packVersion:pv,resolution:recovered,clone }));
    console.log('REAL_API_PASS',results.length);
  } catch(e) { console.error(e.message); process.exitCode=1; }
  finally { fs.mkdirSync(root+'/docs/platform-consolidation',{ recursive:true }); fs.writeFileSync(root+'/docs/platform-consolidation/api-acceptance.json',JSON.stringify({ pass:!process.exitCode,checks:results },null,2)); await browser.close(); }
})();
