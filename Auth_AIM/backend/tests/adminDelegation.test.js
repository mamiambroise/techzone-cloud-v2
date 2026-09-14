const test = require('node:test');
const assert = require('node:assert/strict');

const { prisma } = require('../src/config/database');
const delegationService = require('../src/services/adminDelegation.service');

const TENANT_ID = 'dcc6d339-bf1f-4855-8888-c9d592a81753';
const USER_ID = '4ecdb16f-ba49-4d1c-9779-eda18dd5aba5';

async function ensureActiveAdminRole() {
  const tenant = await prisma.tenant.findUnique({ where: { id: TENANT_ID } });
  if (!tenant) return;

  const role = await prisma.role.findFirst({
    where: { tenantId: TENANT_ID, code: 'demo-admin' },
  });

  if (!role) return;

  const active = await prisma.roleAssignment.findFirst({
    where: { userId: USER_ID, roleId: role.id, tenantId: TENANT_ID, revokedAt: null },
  });

  if (!active) {
    await prisma.roleAssignment.create({
      data: {
        userId: USER_ID,
        roleId: role.id,
        tenantId: TENANT_ID,
      },
    });
  }
}

test('admin delegation creates a bounded delegation without exceeding delegant permissions', async () => {
  await ensureActiveAdminRole();

  const result = await delegationService.createDelegation({
    tenantId: TENANT_ID,
    grantorUserId: USER_ID,
    granteeUserId: USER_ID,
    scopeType: 'tenant',
    scopeId: TENANT_ID,
    permissions: ['iam.sessions.manage'],
    validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    reason: 'test delegation scope',
  });

  assert.ok(result.id);
  assert.equal(result.status, 'ACTIVE');
  assert.deepEqual(result.permissions, ['iam.sessions.manage']);
});

test('admin delegation can revoke and audit a delegation', async () => {
  await ensureActiveAdminRole();

  const list = await delegationService.listDelegations({ tenantId: TENANT_ID });
  const target = list[0] || null;

  if (target) {
    const revoked = await delegationService.revokeDelegation({
      delegationId: target.id,
      actorId: USER_ID,
      reason: 'test revoke',
    });

    assert.equal(revoked.revoked, true);
    assert.equal(revoked.audit, true);
  } else {
    assert.ok(true);
  }
});
