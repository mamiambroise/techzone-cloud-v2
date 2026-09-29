// Isolated component regression test, not an authenticated runtime/E2E result.
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const fs = require('node:fs');
const esbuild = require('../frontend/node_modules/esbuild');
const React = require('../frontend/node_modules/react');
const { renderToString } = require('../frontend/node_modules/react-dom/server');
const { MemoryRouter, Routes, Route } = require('../frontend/node_modules/react-router-dom');
(async () => {
  const bundle = await esbuild.build({
    entryPoints: ['frontend/src/auth/ProtectedRoute.jsx'], bundle: true, write: false,
    platform: 'node', format: 'cjs', packages: 'external',
    plugins: [{ name: 'unit-auth-context', setup(build) {
      build.onResolve({ filter: /AuthProvider\.jsx$/ }, () => ({ path: 'unit-auth', namespace: 'unit' }));
      build.onLoad({ filter: /.*/, namespace: 'unit' }, () => ({ contents: 'export function useAuth(){ return {user: {id:"unit-test"}, loading:false}; }', loader: 'js' }));
    } }],
  });
  const compiled = new Module(path.resolve('frontend/unit-route-contract.cjs'), module);
  compiled.filename = path.resolve('frontend/unit-route-contract.cjs');
  compiled.paths = Module._nodeModulePaths(path.resolve('frontend'));
  compiled._compile(bundle.outputFiles[0].text, compiled.filename);
  const ProtectedRoute = compiled.exports.default;
  const html = renderToString(React.createElement(MemoryRouter, { initialEntries: ['/protected'] },
    React.createElement(Routes, null, React.createElement(Route, { element: React.createElement(ProtectedRoute) },
      React.createElement(Route, { path: '/protected', element: React.createElement('p', null, 'nested-route-rendered') })))));
  assert.ok(html.includes('nested-route-rendered'), 'authenticated parent must render its nested Outlet');
  const axios = require('../frontend/node_modules/axios/dist/node/axios.cjs');
  assert.equal(axios.create({ baseURL: '/api' }).getUri({ url: '/platform/applications' }), '/api/platform/applications');
  const inventory = JSON.parse(fs.readFileSync('docs/full-runtime-review/inventory.json'));
  assert.equal(new Set(inventory.menu.map(e => e.route)).size, inventory.menu.length);
  assert.ok(inventory.menu.some(e => e.route === '/erp/clients'));
  assert.ok(!inventory.requests.some(r => r.path.startsWith('/api/api/')));
  const result = { mode: 'ISOLATED_UNIT_NOT_E2E', nestedProtectedRoute: 'PASS', axiosBasePath: 'PASS', navigationKeys: 'PASS', duplicateApiPrefix: 'PASS' };
  fs.writeFileSync('docs/full-runtime-review/frontend-contract-check.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
