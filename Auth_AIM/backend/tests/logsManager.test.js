const test = require('node:test');
const assert = require('node:assert/strict');

const logsManagerService = require('../src/services/logsManager.service');

test('log manager records structured logs and sanitizes secrets', () => {
  const log = logsManagerService.recordLog({
    level: 'ERROR',
    service: 'auth-service',
    component: 'login',
    message: 'Authentication failed',
    traceId: 'trace-123',
    requestId: 'req-456',
    tenantId: 'tenant-1',
    userId: 'user-42',
    environmentId: 'production',
    errorCode: 'INVALID_CREDENTIALS',
    metadata: {
      headers: { authorization: 'Bearer secret-token' },
      password: 'supersecret',
      payload: { token: 'abc' },
    },
  });

  assert.equal(log.level, 'ERROR');
  assert.equal(log.traceId, 'trace-123');
  assert.equal(log.metadataSafe.headers.authorization, '[REDACTED]');
  assert.equal(log.metadataSafe.password, '[REDACTED]');
  assert.equal(log.metadataSafe.payload.token, '[REDACTED]');
});

test('log manager can search and correlate by traceId', () => {
  logsManagerService.recordLog({
    level: 'INFO',
    service: 'context-service',
    component: 'context-resolver',
    message: 'Context resolved',
    traceId: 'trace-123',
    requestId: 'req-789',
    tenantId: 'tenant-1',
    userId: 'user-42',
    environmentId: 'production',
    errorCode: null,
    metadata: { status: 'OK' },
  });

  const byTrace = logsManagerService.searchLogs({ traceId: 'trace-123' });
  const byTenant = logsManagerService.searchLogs({ tenantId: 'tenant-1', level: 'ERROR' });

  assert.ok(Array.isArray(byTrace));
  assert.ok(byTrace.length >= 2);
  assert.ok(Array.isArray(byTenant));
  assert.ok(byTenant.length >= 1);
});

test('log manager exposes retention config', () => {
  const retention = logsManagerService.getRetentionConfig();

  assert.ok(retention);
  assert.ok(typeof retention.defaultDays === 'number');
  assert.ok(retention.levels);
});
