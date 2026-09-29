// Live browser only: no route fulfillment, API doubles, tracing, or credential output.
const fs = require('node:fs');
const path = require('node:path');
const { chromium }=require('../logs/browser-tools/node_modules/playwright');
(async()=>{
 const inventory=JSON.parse(fs.readFileSync('docs/full-runtime-review/inventory.json'));
 const result={timestamp:new Date().toISOString(),mode:'LIVE_NO_MOCKS',routes:[],responsive:[],errors:[],http:[]};
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext();
 const page=await context.newPage();
 page.on('pageerror',e=>result.errors.push({name:e.name}));
 page.on('response',r=>{const u=new URL(r.url());if(u.pathname.startsWith('/api/'))result.http.push({method:r.request().method(),path:u.pathname,status:r.status()});});
 try {
  const start=Date.now();await page.goto('http://localhost:3000/login');await page.locator('#identifier').waitFor({timeout:25000});result.loginLoadMs=Date.now()-start;
  const privatePath=path.join(process.env.LOCALAPPDATA,'TechzoneRecipe','test-login.json');
  if(fs.existsSync(privatePath)){
   const account=JSON.parse(fs.readFileSync(privatePath));
   await page.locator('#identifier').fill(account.username);await page.locator('#password').fill(account.password);
   const response=page.waitForResponse(r=>r.url().endsWith('/api/iam/auth/login'),{timeout:25000}).catch(()=>null);
   await page.locator('button[type=submit]').click();const login=await response;result.login={status:login?.status()||'TIMEOUT'};
   await page.waitForTimeout(500);
   result.login.reachedDashboard=new URL(page.url()).pathname==='/cockpit';
  } else result.login={status:'PRIVATE_CREDENTIALS_UNAVAILABLE'};
  result.cookies=(await context.cookies()).map(c=>({name:c.name,httpOnly:c.httpOnly,secure:c.secure,sameSite:c.sameSite}));
  for(const entry of inventory.menu){
   const before=result.errors.length;
   await page.goto('http://localhost:3000'+entry.route,{waitUntil:'domcontentloaded'});
   if(!result.login?.reachedDashboard) await page.waitForURL('**/login',{timeout:25000});
   await page.waitForTimeout(180);
   const finalPath=new URL(page.url()).pathname;
   result.routes.push({route:entry.route,finalPath,reactErrors:result.errors.length-before,loginVisible:await page.locator('#identifier').isVisible(),status:finalPath==='/login'?'AUTH_REDIRECT_ONLY':result.errors.length>before?'BROKEN':'RENDERED_NOT_BUSINESS_VALIDATED'});
  }
  for(const [name,width,height] of [['Desktop',1440,900],['Tablet',768,1024],['Mobile',390,844]]){
   await page.setViewportSize({width,height});await page.goto('http://localhost:3000/login');await page.locator('#identifier').waitFor({timeout:25000});
   result.responsive.push({name,width,horizontalOverflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),identifierLabel:await page.locator('label[for=identifier]').count(),passwordLabel:await page.locator('label[for=password]').count(),submitVisible:await page.locator('button[type=submit]').isVisible()});
  }
  result.tokenStorage=await page.evaluate(()=>({local:Object.keys(localStorage).filter(k=>/token|jwt/i.test(k)),session:Object.keys(sessionStorage).filter(k=>/token|jwt/i.test(k))}));
 }catch(e){result.error={name:e.name};}
 finally{await browser.close();fs.writeFileSync('docs/full-runtime-review/browser.json',JSON.stringify(result,null,2));console.log(JSON.stringify({routes:result.routes.length,errors:result.errors,login:result.login,responsive:result.responsive,error:result.error}));}
})().catch(e=>{console.log(JSON.stringify({error:e.name}));process.exitCode=1;});
