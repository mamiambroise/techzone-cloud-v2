const test = require('node:test');
const assert = require('node:assert/strict');

const adminSecurityAuditService = require('../src/services/adminSecurityAudit.service');
const securityService = require('../src/services/security.service');
const auditManagerService = require('../src/services/auditManager.service');

const TENANT_ID = 'dcc6d339-bf1f-4855-8888-c9d592a81753';

test('admin security audit exposes sanitized read-only security and audit views', async () => {
  const traceId = `trace-admin-audit-${Date.now()}`;

  await securityService.createSecurityEvent({
    eventType: 'AUTH_FAILURE',
    severity: 'HIGH',
    tenantId: TENANT_ID,
    userId: 'user-admin-audit',
    source: 'auth-service',
    resource: 'session',
    traceId,
    status: 'INVESTIGATING',
    detailsSafe: 'Too many password failures',
    metadata: { password: 'super-secret', authorization: 'Bearer xyz' },
  });

  auditManagerService.recordAudit({
    auditId: `AUD-${Date.now()}`,
    actorType: 'USER',
    actorId: 'user-admin-audit',
    tenantId: TENANT_ID,
    applicationId: 'iam-admin',
    action: 'AUTH_FAILURE_REVIEWED',
    resourceType: 'SESSION',
    resourceId: 'session-42',
    result: 'SUCCESS',
    reason: 'Security review',
    traceId,
    before: { status: 'OPEN' },
    after: { status: 'INVESTIGATING' },
    metadata: { password: 'super-secret', authorization: 'Bearer xyz' },
  });

  const events = await adminSecurityAuditService.listSecurityEvents({ tenantId: TENANT_ID, traceId });
  const correlation = await adminSecurityAuditService.getSecurityEventCorrelation({ tenantId: TENANT_ID, traceId });
  const auditTrail = adminSecurityAuditService.searchAudit({ tenantId: TENANT_ID, traceId });

  assert.ok(Array.isArray(events));
  assert.ok(events.some((event) => event.type === 'AUTH_FAILURE'));
  assert.ok(events.every((event) => !JSON.stringify(event).includes('super-secret')));
  assert.ok(Array.isArray(correlation));
  assert.ok(correlation.length >= 1);
  assert.ok(Array.isArray(auditTrail));
  assert.ok(auditTrail.some((entry) => entry.action === 'AUTH_FAILURE_REVIEWED'));
  assert.ok(auditTrail.every((entry) => !JSON.stringify(entry).includes('super-secret')));
});
