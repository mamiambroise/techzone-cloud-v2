const test = require('node:test');
const assert = require('node:assert/strict');

const auditManagerService = require('../src/services/auditManager.service');

test('audit manager records immutable audit records with sanitized payloads', () => {
  const event = auditManagerService.recordAudit({
    actorType: 'USER',
    actorId: 'user-42',
    tenantId: 'tenant-1',
    applicationId: 'auth-app',
    action: 'PASSWORD_RESET',
    resourceType: 'USER',
    resourceId: 'user-42',
    result: 'SUCCESS',
    reason: 'User self-service reset',
    traceId: 'trace-audit-001',
    before: { password: 'secret' },
    after: { password: 'newsecret' },
  });

  assert.equal(event.action, 'PASSWORD_RESET');
  assert.equal(event.traceId, 'trace-audit-001');
  assert.equal(event.metadataSafe.before.password, '[REDACTED]');
  assert.equal(event.metadataSafe.after.password, '[REDACTED]');
  assert.equal(event.immutable, true);
});

test('audit manager can search and correlate by traceId and tenant', () => {
  auditManagerService.recordAudit({
    actorType: 'SYSTEM',
    actorId: 'system',
    tenantId: 'tenant-1',
    applicationId: 'auth-app',
    action: 'ROLE_ASSIGNMENT',
    resourceType: 'ROLE',
    resourceId: 'ROLE_ADMIN',
    result: 'SUCCESS',
    reason: 'Admin assignment',
    traceId: 'trace-audit-001',
    before: { role: 'viewer' },
    after: { role: 'admin' },
  });

  const byTrace = auditManagerService.searchAudit({ traceId: 'trace-audit-001' });
  const byTenant = auditManagerService.searchAudit({ tenantId: 'tenant-1', action: 'PASSWORD_RESET' });

  assert.ok(Array.isArray(byTrace));
  assert.ok(byTrace.length >= 2);
  assert.ok(Array.isArray(byTenant));
  assert.ok(byTenant.length >= 1);
});

test('audit manager has strict access policy metadata', () => {
  const access = auditManagerService.getAccessPolicy();

  assert.equal(access.readRequiresHigherPrivilege, true);
  assert.ok(Array.isArray(access.allowedRoles));
});
