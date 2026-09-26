const fs = require('fs');
const targets = [
  [3000, '/login'], [5001, '/health'], [5001, '/api/iam/me'],
  [3003, '/health'], [3003, '/api/platform/applications'],
  [3002, '/api/config/public'], [3002, '/api/erp-registry'],
  [3002, '/api/data-runtime/contract'], [3002, '/api/automation/contract'],
];
(async () => {
  const results = await Promise.all(targets.map(async ([port, route]) => {
    try {
      const response = await fetch(`http://127.0.0.1:${port}${route}`, { signal: AbortSignal.timeout(5000) });
      return { port, route, status: response.status, trace: response.headers.get('x-trace-id') || response.headers.get('x-request-id') };
    } catch (error) { return { port, route, error: error.cause?.code || error.name }; }
  }));
  const report = { timestamp: new Date().toISOString(), results };
  fs.writeFileSync('docs/consolidation/health-results.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
})();
