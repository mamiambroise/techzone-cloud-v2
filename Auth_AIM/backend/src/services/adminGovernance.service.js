const { prisma } = require('../config/database');
const { AppError } = require('../utils/response');
const { logAdminAction } = require('./adminAudit.service');

function dedupe(items = []) {
  return [...new Set(items.filter(Boolean))];
}

async function listRoles({ tenantId, includePermissions = true } = {}) {
  const roles = await prisma.role.findMany({
    where: {
      ...(tenantId ? { tenantId } : {}),
    },
    include: includePermissions
      ? {
          permissions: {
            include: { permission: true },
          },
        }
      : undefined,
    orderBy: { createdAt: 'desc' },
  });

  return roles.map((role) => ({
    id: role.id,
    code: role.code,
    name: role.name,
    status: role.status,
    privileged: role.privileged,
    system: role.system,
    permissions: (role.permissions || []).map((rp) => ({
      id: rp.permission.id,
      code: rp.permission.code,
      resource: rp.permission.resource,
      action: rp.permission.action,
      critical: rp.permission.critical,
      active: rp.permission.active,
    })),
  }));
}

async function listPermissions({ tenantId } = {}) {
  const permissions = await prisma.permission.findMany({
    where: {
      ...(tenantId
        ? {
            rolePermissions: {
              some: {
                role: {
                  tenantId,
                },
              },
            },
          }
        : {}),
    },
    include: {
      rolePermissions: {
        include: {
          role: true,
        },
      },
    },
    orderBy: { code: 'asc' },
  });

  return permissions.map((permission) => ({
    id: permission.id,
    code: permission.code,
    resource: permission.resource,
    action: permission.action,
    critical: permission.critical,
    active: permission.active,
    roles: permission.rolePermissions.map((rp) => ({
      roleId: rp.role.id,
      roleCode: rp.role.code,
      tenantId: rp.role.tenantId,
    })),
  }));
}

async function listAssignments({ tenantId } = {}) {
  const assignments = await prisma.roleAssignment.findMany({
    where: {
      ...(tenantId ? { tenantId } : {}),
    },
    include: {
      role: true,
      user: {
        select: {
          id: true,
          username: true,
          primaryEmail: true,
          status: true,
        },
      },
      group: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return assignments.map((assignment) => ({
    id: assignment.id,
    tenantId: assignment.tenantId,
    userId: assignment.userId,
    groupId: assignment.groupId,
    roleId: assignment.roleId,
    roleCode: assignment.role?.code,
    roleName: assignment.role?.name,
    user: assignment.user,
    group: assignment.group,
    revokedAt: assignment.revokedAt,
    revokedBy: assignment.revokedBy,
    revokeReason: assignment.revokeReason,
    createdAt: assignment.createdAt,
    validFrom: assignment.validFrom,
    validUntil: assignment.validUntil,
  }));
}

async function getAccessReview({ tenantId } = {}) {
  const assignments = await listAssignments({ tenantId });
  const byUser = new Map();

  for (const assignment of assignments.filter((item) => !item.revokedAt)) {
    const userId = assignment.userId;
    if (!userId) continue;

    if (!byUser.has(userId)) {
      byUser.set(userId, {
        userId,
        username: assignment.user?.username || null,
        roles: [],
        permissions: [],
        duplicatePermissions: [],
      });
    }

    const bucket = byUser.get(userId);
    bucket.roles.push({
      id: assignment.roleId,
      code: assignment.roleCode,
      name: assignment.roleName,
    });

    const roleWithPermissions = await prisma.role.findUnique({
      where: { id: assignment.roleId },
      include: { permissions: { include: { permission: true } } },
    });

    const rolePermissions = (roleWithPermissions?.permissions || []).map((rp) => rp.permission.code);
    bucket.permissions.push(...rolePermissions);
  }

  return [...byUser.values()].map((entry) => {
    const permissions = dedupe(entry.permissions);
    const duplicatePermissions = permissions.filter((code, index, arr) => arr.indexOf(code) !== index);

    const riskyPermissions = permissions.filter((code) => code.includes('admin.') || code.includes('iam.security.manage') || code.includes('iam.context.manage'));

    return {
      userId: entry.userId,
      username: entry.username,
      roles: entry.roles,
      permissions,
      duplicatePermissions: dedupe(duplicatePermissions),
      excessivePrivileges: dedupe(riskyPermissions),
      leastPrivilegeScore: permissions.length,
    };
  });
}

async function getCriticalRoles({ tenantId } = {}) {
  const roles = await prisma.role.findMany({
    where: {
      ...(tenantId ? { tenantId } : {}),
      OR: [{ privileged: true }, { system: true }, { code: { contains: 'admin' } }],
    },
    include: {
      permissions: { include: { permission: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return roles.map((role) => ({
    id: role.id,
    code: role.code,
    name: role.name,
    privileged: role.privileged,
    system: role.system,
    permissions: role.permissions.map((rp) => rp.permission.code),
  }));
}

async function getHistory({ tenantId } = {}) {
  const events = await prisma.auditEvent.findMany({
    where: {
      ...(tenantId ? { tenantId } : {}),
      OR: [
        { action: { contains: 'ROLE' } },
        { action: { contains: 'PERMISSION' } },
        { action: { contains: 'ADMIN' } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return events.map((event) => ({
    id: event.id,
    traceId: event.traceId,
    actorId: event.actorId,
    tenantId: event.tenantId,
    action: event.action,
    targetType: event.targetType,
    targetId: event.targetId,
    result: event.result,
    reason: event.reason,
    before: event.before,
    after: event.after,
    createdAt: event.createdAt,
  }));
}

async function revokeAssignment({ assignmentId, actorId, reason } = {}) {
  const assignment = await prisma.roleAssignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment) {
    throw new AppError('Affectation introuvable', 404, 'ROLE_ASSIGNMENT_NOT_FOUND');
  }

  if (assignment.revokedAt) {
    return {
      revoked: false,
      reason: 'ALREADY_REVOKED',
      assignment,
    };
  }

  const updated = await prisma.roleAssignment.update({
    where: { id: assignmentId },
    data: {
      revokedAt: new Date(),
      revokedBy: actorId,
      revokeReason: reason || 'ADMIN_REVOCATION',
    },
  });

  await logAdminAction({
    actorId,
    tenantId: assignment.tenantId,
    action: 'ROLE_ASSIGNMENT_REVOKED',
    targetType: 'ROLE_ASSIGNMENT',
    targetId: assignmentId,
    result: 'SUCCESS',
    reason: reason || 'ADMIN_REVOCATION',
    before: { revokedAt: null },
    after: { revokedAt: updated.revokedAt, revokedBy: actorId },
  });

  return {
    revoked: true,
    assignment: updated,
    audit: true,
  };
}

module.exports = {
  listRoles,
  listPermissions,
  listAssignments,
  getAccessReview,
  getCriticalRoles,
  getHistory,
  revokeAssignment,
};
