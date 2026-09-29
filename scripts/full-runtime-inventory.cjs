const fs = require('node:fs');
const path = require('node:path');
const out='docs/full-runtime-review';
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>['node_modules','dist','generated','.git','techzone','logs'].includes(e.name)?[]:e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name).replaceAll('\\','/')]);
const files=[...walk('frontend/src'),...walk('backend/src')];
const source=f=>fs.readFileSync(f,'utf8');
const nav=source('frontend/src/app/navigationConfig.js');
const definitions=JSON.parse(nav.match(/export const routeDefinitions = ([\s\S]*?);/)[1]);
const erp=source('frontend/src/erp/modulesConfig.js');
const keys=[...erp.matchAll(/^    key:\s*['"]([^'"]+)['"]/gm)].map(m=>m[1]);
const menu=[...definitions.filter(d=>d.menu),...keys.map(key=>({route:'/erp/'+key,component:'ErpModule',label:key,group:'erp',status:'ACTIVE'}))];
const endpoints=[];
for(const f of files.filter(f=>f.endsWith('.controller.ts'))){
 const s=source(f),prefix=s.match(/@Controller\(\s*['"]([^'"]*)['"]\s*\)/)?.[1]||'';
 for(const m of s.matchAll(/@(Get|Post|Put|Patch|Delete)\(\s*(?:['"]([^'"]*)['"])?\s*\)/g)) endpoints.push({file:f,method:m[1].toUpperCase(),path:'/'+[prefix,m[2]].filter(Boolean).join('/'),line:s.slice(0,m.index).split('\n').length,activeCandidate:!f.startsWith('backend/src/platform/')});
}
const markers=[];
for(const f of files.filter(f=>/\.(tsx?|jsx?)$/.test(f))){
 source(f).split('\n').forEach((s,i)=>{
  const marker=s.match(/mockData|fixture|\bfake\b|\bdemo\b|TODO|FIXME|notImplemented|NotImplemented|console\.log|Math\.random|setTimeout|NO_OP|no-op handler|onClick=\{\(\) => \{\}\}/i);
  if(marker)markers.push({path:f,line:i+1,marker:marker[0],status:/\.spec\.|\/test\//.test(f)?'TEST_ONLY':/iam-demo|demoPages/.test(f)?'DEMO_ONLY':/no-op handler/i.test(s)?'NO_OP':/Math.random/.test(s)&&/trace|toast|fingerprint|executionId/i.test(s)?'LEGITIMATE_STATIC_DATA':/TODO|FIXME|notImplemented/i.test(s)?'INCOMPLETE':'REVIEW_REQUIRED',productionReachable:/\.spec\.|\/test\//.test(f)?false:'UNVERIFIED'});
 });
}
const requests=[];
for(const f of files.filter(f=>f.startsWith('frontend/')&&/\.(jsx?|tsx?)$/.test(f))){
 const s=source(f);
 for(const m of s.matchAll(/\b(api|authApi|axios)\.(get|post|put|patch|delete)\(\s*(['"`])([^'"`]+)\3/g)){
  const requestPath=(m[1]==='authApi'?'/api/iam':m[1]==='api'?'/api':'')+m[4];
  const normalized=requestPath.split('?')[0].replace(/\$\{[^}]+\}/g,':param');
  const matches=endpoints.filter(e=>e.activeCandidate&&e.method===m[2].toUpperCase()&&e.path.replace(/:[^/]+/g,':param')===normalized);
  requests.push({file:f,line:s.slice(0,m.index).split('\n').length,method:m[2].toUpperCase(),path:requestPath,backend:matches.map(e=>e.file),status:matches.length?'STATIC_PATH_METHOD_MATCH_NOT_E2E':'UNRESOLVED_STATIC_MATCH',requestBody:'REQUIRES_DTO_REVIEW',expectedResponse:'REQUIRES_RESPONSE_REVIEW',actualResponse:'NOT_TESTED'});
 }
}
const packages=walk('.').filter(f=>f.endsWith('package.json'));
const migrations=walk('backend/prisma/migrations').filter(f=>f.endsWith('.sql')).map(f=>{const s=source(f);return {path:f,classification:/\bDROP\b|\bTRUNCATE\b|\bDELETE FROM\b/i.test(s)?'DESTRUCTIVE':/ALTER TABLE|UPDATE /i.test(s)?'DATA_MIGRATION_REQUIRED':'SAFE',iam:/iam_user|iam_session/i.test(s)}});
const assets=fs.readdirSync('frontend/dist/assets').filter(f=>f.endsWith('.js')).map(f=>({file:f,bytes:fs.statSync('frontend/dist/assets/'+f).size})).sort((a,b)=>b.bytes-a.bytes);
const result={timestamp:new Date().toISOString(),packages,menu,endpoints,requests,markers,migrations,performance:{largest:assets.slice(0,5),entry:assets.filter(a=>a.file.startsWith('index-')),lazyImports:(source('frontend/src/App.jsx').match(/lazy\(/g)||[]).length}};
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/inventory.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({packages,menus:menu.length,endpoints:endpoints.length,requests:requests.length,markers:markers.length,migrations:migrations.length,iamMigrations:migrations.filter(m=>m.iam).length,performance:result.performance}));
