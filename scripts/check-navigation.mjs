import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { navigationGroups, navigationEntries, pageDefinitions, routeDefinitions, redirects, resolveRoute, routeForTab } from '../frontend/src/app/navigationConfig.js';
import { canAccess } from '../frontend/src/app/navigationAccess.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = fs.readFileSync(path.join(root, 'frontend/src/App.jsx'), 'utf8');
const registry = app.match(/const routeComponents = \{([^}]+)\}/)[1].split(',').map(s => s.trim());
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
check(new Set(pageDefinitions.map(r => r.route)).size === pageDefinitions.length, 'Duplicate paths');
check(new Set(pageDefinitions.map(r => r.id)).size === pageDefinitions.length, 'Duplicate IDs');
check(new Set(redirects.map(r => r.from)).size === redirects.length, 'Duplicate redirects');
for (const route of routeDefinitions) {
  check(registry.includes(route.component), `Unregistered component: ${route.component}`);
  check(route.protected, `Unprotected route: ${route.route}`);
}
for (const match of app.matchAll(/lazy\(\(\) => import\('\.\/(.*?)'\)/g)) {
  check(fs.existsSync(path.join(root, 'frontend/src', match[1])), `Missing component file: ${match[1]}`);
}
for (const entry of navigationEntries) {
  if (!entry.implemented) { check(entry.status === 'NOT_IMPLEMENTED', `Unclassified missing page: ${entry.route}`); continue; }
  check(routeDefinitions.some(r => r.route === entry.route) || redirects.some(r => r.from === entry.route), `Broken menu: ${entry.route}`);
  check(!entry.route.includes(':'), `Unresolved menu parameter: ${entry.route}`);
}
for (const redirect of redirects) {
  const seen = new Set([redirect.from]);
  let target = redirect.to.split(/[?#]/)[0];
  while (redirects.some(r => r.from === target)) {
    if (seen.has(target)) { errors.push(`Redirect cycle: ${redirect.from}`); break; }
    seen.add(target); target = redirects.find(r => r.from === target).to.split(/[?#]/)[0];
  }
  check(routeDefinitions.some(r => r.route === target), `Missing redirect destination: ${redirect.from} -> ${target}`);
  check(!routeDefinitions.some(r => r.route === redirect.from), `Redirect shadows page: ${redirect.from}`);
}
const before = JSON.parse(fs.readFileSync(path.join(root, 'docs/navigation/before.json')));
for (const route of before) check(routeDefinitions.some(r => r.route === route.route) || redirects.some(r => r.from === route.route), `Lost legacy page: ${route.route}`);
assert.deepEqual(navigationGroups.map(g => g.id), ['dashboard','applications','bm','ui','automation','packs','runtime','data','erp','api','environments','deployments','iam','observability','billing','admin']);
assert.equal(resolveRoute('/packs/runtime').redirectTo, '/runtime');
assert.equal(resolveRoute('/erp').id, 'erp');
assert.equal(resolveRoute('/erps').id, 'erpRegistry');
assert.equal(resolveRoute('/erps/edit/abc').component, 'ERPEdit');
assert.equal(resolveRoute('/erp/mappings').component, 'Mapping');
assert.equal(resolveRoute('/erp/products').moduleKeyOverride, 'products');
assert.equal(resolveRoute('/erps-unrelated'), undefined);
assert.equal(resolveRoute('/applications/new').component, 'NewApplicationRoute');
assert.equal(resolveRoute('/applications/abc').component, 'ApplicationDetailRoute');
assert.equal(resolveRoute('/applications/workspace').component, 'WorkspaceConfigView');
assert.equal(canAccess({permission:'iam:admin'}, {user:{isAdmin:false}}), false);
assert.equal(canAccess({permission:'iam:admin'}, {user:{isAdmin:true}}), true);
assert.equal(canAccess({permission:'iam:admin'}, {user:{isAdmin:true,permissions:[]}}), false);
assert.equal(canAccess({entitlement:'unavailable'}, {user:{isAdmin:true}}), false);
assert.equal(canAccess({}, null), false);
assert.equal(routeForTab('contract-v1'), '/platform-contract');
assert.equal(routeForTab('workspace'), '/applications/workspace');
// Every legacy Redux navigation action must resolve to a real registered page.
const walk = directory => fs.readdirSync(directory, {withFileTypes:true}).flatMap(entry => entry.isDirectory() ? walk(path.join(directory,entry.name)) : [path.join(directory,entry.name)]);
for (const file of walk(path.join(root, 'frontend/src/components')).filter(f => f.endsWith('.jsx'))) {
  const source = fs.readFileSync(file, 'utf8');
  check(!/dispatch\(setActiveTab\(/.test(source), `Dead Redux navigation: ${file}`);
  for (const match of source.matchAll(/routeForTab\('([^']+)'\)/g)) check(!!routeForTab(match[1]), `Unknown tab ${match[1]} in ${file}`);
}
const summary = {
  SIDEBAR_MAIN_ITEMS: navigationGroups.length,
  ROUTES_TOTAL: pageDefinitions.length,
  ROUTES_REGISTERED: routeDefinitions.length,
  ROUTES_REAL: pageDefinitions.filter(r => r.status === 'REAL').length,
  ROUTES_PARTIAL: pageDefinitions.filter(r => r.status === 'PARTIAL').length,
  ROUTES_NOT_IMPLEMENTED: pageDefinitions.filter(r => r.status === 'NOT_IMPLEMENTED').length,
  LEGACY_REDIRECTS: redirects.length - pageDefinitions.filter(r => r.redirectTo).length,
  BROKEN_NAVIGATION_TARGETS: errors.length,
  errors,
};
fs.writeFileSync(path.join(root, 'docs/navigation/check-results.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
if (errors.length) process.exitCode = 1;
