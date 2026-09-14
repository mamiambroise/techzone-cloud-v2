const test = require('node:test');
const assert = require('node:assert/strict');

const adminActionsService = require('../src/services/adminActions.service');

test('admin actions execute sensitive administrative operations with audit and validation', async () => {
  const action = await adminActionsService.requestAction({
    actorId: 'actor-1',
    tenantId: 'tenant-123',
    actionType: 'SUSPEND_USER',
    targetType: 'USER',
    targetId: 'user-42',
    reason: 'Suspension suite à incident de sécurité',
    metadata: { userStatus: 'SUSPENDED' },
  });

  assert.ok(action);
  assert.equal(action.actionType, 'SUSPEND_USER');
  assert.equal(action.targetType, 'USER');
  assert.ok(action.id);
  assert.ok(['REQUESTED', 'APPROVED', 'RUNNING', 'COMPLETED', 'FAILED'].includes(action.status));
  assert.equal(action.reason, 'Suspension suite à incident de sécurité');
});

test('admin actions reject critical actions without a reason', async () => {
  await assert.rejects(
    () => adminActionsService.requestAction({
      actorId: 'actor-1',
      tenantId: 'tenant-123',
      actionType: 'FORCE_REVOKE_SESSIONS',
      targetType: 'SESSION',
      targetId: 'session-42',
      metadata: { force: true },
    }),
    (err) => {
      assert.equal(err.code, 'ADMIN_ACTION_REASON_REQUIRED');
      return true;
    }
  );
});
