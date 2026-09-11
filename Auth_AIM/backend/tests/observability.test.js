const test = require('node:test');
const assert = require('node:assert/strict');

const observabilityService = require('../src/services/observability.service');

test('dashboard exposes the required KPIs and tenant-scoped structure', () => {
  const dashboard = observabilityService.getDashboard({ tenantId: 'tenant-1' });

  assert.ok(dashboard);
  assert.ok(dashboard.kpis);
  assert.ok(dashboard.kpis.PlatformHealth);
  assert.ok(dashboard.kpis.ServicesHealthy >= 0);
  assert.ok(Array.isArray(dashboard.services));
  assert.ok(Array.isArray(dashboard.alerts));
  assert.equal(dashboard.tenantId, 'tenant-1');
});

test('health endpoint contract contains status and components', () => {
  const health = observabilityService.getHealth({ tenantId: 'tenant-1' });

  assert.ok(health);
  assert.ok(['HEALTHY', 'DEGRADED', 'UNHEALTHY', 'UNKNOWN'].includes(health.status));
  assert.ok(Array.isArray(health.components));
  assert.ok(health.components.length >= 1);
  assert.ok(Array.isArray(health.dependencies));
});
