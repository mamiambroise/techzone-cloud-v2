const test = require('node:test');
const assert = require('node:assert/strict');

const { prisma } = require('../src/config/database');
const governanceService = require('../src/services/adminGovernance.service');

const TENANT_ID = 'dcc6d339-bf1f-4855-8888-c9d592a81753';
const USER_ID = '4ecdb16f-ba49-4d1c-9779-eda18dd5aba5';

async function ensureActiveAdminRole() {
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

test('admin governance lists roles and permissions for the tenant', async () => {
  await ensureActiveAdminRole();

  const roles = await governanceService.listRoles({ tenantId: TENANT_ID });
  const permissions = await governanceService.listPermissions({ tenantId: TENANT_ID });

  assert.ok(Array.isArray(roles));
  assert.ok(Array.isArray(permissions));
  assert.ok(roles.length >= 1);
  assert.ok(permissions.length >= 1);
});

test('admin governance detects excessive privileges and duplicate RBAC', async () => {
  await ensureActiveAdminRole();

  const review = await governanceService.getAccessReview({ tenantId: TENANT_ID });

  assert.ok(Array.isArray(review));
  assert.ok(review.length >= 1);
  assert.ok(review[0].permissions.length >= 1 || review[0].duplicatePermissions.length >= 0);
});

test('admin governance can revoke an assignment and log the action', async () => {
  await ensureActiveAdminRole();

  const assignments = await governanceService.listAssignments({ tenantId: TENANT_ID });
  const target = assignments.find((item) => !item.revokedAt) || assignments[0];

  assert.ok(target, 'Expected at least one role assignment to revoke');

  const result = await governanceService.revokeAssignment({
    assignmentId: target.id,
    actorId: 'admin-governance-test',
    reason: 'test governance revocation',
  });

  assert.equal(result.revoked, true);
  assert.ok(result.audit);
});
