const test = require('node:test');
const assert = require('node:assert/strict');

const securityService = require('../src/services/security.service');

test('security manager creates a canonical security event and preserves sanitization', async () => {
  const event = await securityService.createSecurityEvent({
    eventType: 'AUTH_FAILURE',
    severity: 'HIGH',
    tenantId: 'tenant-1',
    userId: 'user-42',
    source: 'auth-service',
    resource: 'session',
    ipSafe: '10.0.0.8',
    traceId: 'trace-sec-001',
    status: 'OPEN',
    detailsSafe: 'Invalid password attempt',
    metadata: { password: 'secret', authorization: 'Bearer xyz' },
  });

  assert.ok(event);
  assert.equal(event.type, 'AUTH_FAILURE');
  assert.equal(event.severity, 'HIGH');
  assert.equal(event.traceId, 'trace-sec-001');
  assert.equal(event.metadata.status, 'OPEN');
  assert.equal(event.metadata.resource, 'session');
  assert.equal(event.metadata.password, '[REDACTED]');
});

test('security manager searches and correlates events by tenant, type, severity and status', async () => {
  await securityService.createSecurityEvent({
    eventType: 'MFA_FAILURE',
    severity: 'CRITICAL',
    tenantId: 'tenant-1',
    userId: 'user-42',
    source: 'auth-service',
    resource: 'session',
    ipSafe: '10.0.0.8',
    traceId: 'trace-sec-002',
    status: 'INVESTIGATING',
    detailsSafe: 'MFA code rejected',
  });

  const byTenant = await securityService.listSecurityEvents({ tenantId: 'tenant-1' });
  const byType = await securityService.listSecurityEvents({ type: 'AUTH_FAILURE' });
  const bySeverity = await securityService.listSecurityEvents({ severity: 'CRITICAL' });
  const byStatus = await securityService.listSecurityEvents({ status: 'INVESTIGATING' });
  const correlation = await securityService.getSecurityEventCorrelation({ tenantId: 'tenant-1', userId: 'user-42' });

  assert.ok(Array.isArray(byTenant));
  assert.ok(byTenant.length >= 2);
  assert.ok(byType.some((event) => event.type === 'AUTH_FAILURE'));
  assert.ok(bySeverity.some((event) => event.type === 'MFA_FAILURE'));
  assert.ok(byStatus.some((event) => event.type === 'MFA_FAILURE'));
  assert.ok(correlation.length >= 1);
  assert.ok(correlation[0].relatedEventCount >= 1);
});

test('security manager exposes lifecycle and correlation summary helpers', async () => {
  const lifecycle = securityService.getSecurityLifecycle();
  const summary = await securityService.getSecurityEventSummary({ tenantId: 'tenant-1' });

  assert.ok(Array.isArray(lifecycle));
  assert.ok(lifecycle.includes('OPEN'));
  assert.ok(summary.total >= 0);
  assert.ok(summary.bySeverity);
});
