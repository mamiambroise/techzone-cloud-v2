const test = require('node:test');
const assert = require('node:assert/strict');

const observabilityService = require('../src/services/observability.service');

test('monitoring exposes health contract with normalized statuses and dependency metadata', () => {
  const health = observabilityService.getComponentHealth({ tenantId: 'tenant-1' });

  assert.ok(health);
  assert.ok(Array.isArray(health.components));
  assert.ok(health.components.length >= 1);
  assert.ok(health.components.every((component) => ['HEALTHY', 'DEGRADED', 'UNHEALTHY', 'UNKNOWN'].includes(component.status)));
  assert.ok(health.components.every((component) => Array.isArray(component.dependencies)));
  assert.ok(health.components.every((component) => typeof component.checkedAt === 'string'));
  assert.ok(health.components.every((component) => typeof component.detailsSafe === 'string'));
});

test('monitoring exposes core metrics and controlled dimensions', () => {
  const metrics = observabilityService.getServiceMetrics({ tenantId: 'tenant-1' });

  assert.ok(metrics);
  assert.equal(metrics.tenantId, 'tenant-1');
  assert.ok(Array.isArray(metrics.dimensions));
  assert.ok(metrics.metrics.requestCount >= 0);
  assert.ok(metrics.metrics.errorRate >= 0);
  assert.ok(metrics.metrics.latencyMs >= 0);
  assert.ok(metrics.metrics.timeoutCount >= 0);
  assert.ok(metrics.metrics.availability >= 0);
  assert.ok(metrics.metrics.queueDepth >= 0);
  assert.ok(metrics.metrics.cacheHitRate >= 0);
  assert.ok(metrics.metrics.dbHealth !== undefined);
  assert.ok(metrics.dimensions.every((item) => typeof item === 'string'));
});
