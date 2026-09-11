const test = require('node:test');
const assert = require('node:assert/strict');

const alertManagerService = require('../src/services/alertManager.service');

test('alert manager creates an alert with normalized severity and safe details', async () => {
  const alert = await alertManagerService.createAlert({
    code: 'AUTH_HIGH_FAILURE',
    sourceType: 'SECURITY_EVENT',
    condition: 'auth_failure_count > 5',
    severity: 'HIGH',
    tenantId: 'tenant-1',
    traceId: 'trace-alert-001',
    scope: 'tenant',
    sourceRef: 'security-event-stream',
    details: 'Multiple invalid login attempts detected',
    metadata: { password: 'secret', requestId: 'req-123' },
  });

  assert.ok(alert);
  assert.equal(alert.code, 'AUTH_HIGH_FAILURE');
  assert.equal(alert.severity, 'HIGH');
  assert.equal(alert.status, 'OPEN');
  assert.equal(alert.detailsSafe.includes('secret'), false);
  assert.equal(alert.dedupKey.includes('tenant-1'), true);
});

test('alert manager deduplicates and enforces cooldown for identical alerts', async () => {
  await alertManagerService.createAlert({
    code: 'AUTH_HIGH_FAILURE',
    sourceType: 'SECURITY_EVENT',
    condition: 'auth_failure_count > 5',
    severity: 'HIGH',
    tenantId: 'tenant-1',
    traceId: 'trace-alert-002',
    scope: 'tenant',
    sourceRef: 'security-event-stream',
    details: 'Multiple invalid login attempts detected',
  });

  const deduped = await alertManagerService.createAlert({
    code: 'AUTH_HIGH_FAILURE',
    sourceType: 'SECURITY_EVENT',
    condition: 'auth_failure_count > 5',
    severity: 'HIGH',
    tenantId: 'tenant-1',
    traceId: 'trace-alert-003',
    scope: 'tenant',
    sourceRef: 'security-event-stream',
    details: 'Multiple invalid login attempts detected',
  });

  assert.equal(deduped.status, 'SUPPRESSED');
  assert.ok(deduped.cooldownApplied === true || deduped.reason === 'DEDUPLICATED');
});

test('alert manager tracks state transitions and summary', async () => {
  const byStatus = await alertManagerService.listAlerts({ tenantId: 'tenant-1', status: 'OPEN' });
  const summary = await alertManagerService.getAlertSummary({ tenantId: 'tenant-1' });

  assert.ok(Array.isArray(byStatus));
  assert.ok(summary.total >= 1);
  assert.ok(summary.bySeverity);
  assert.ok(summary.byStatus);
});
