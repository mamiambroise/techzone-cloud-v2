const { prisma } = require('../config/database');
const { AppError } = require('../utils/response');
const { logAdminAction } = require('./adminAudit.service');

const ALLOWED_SCOPE_TYPES = new Set([
  'tenant',
  'application',
  'environment',
  'support',
  'facturation',
  'billing',
  'security',
  'securite',
]);

function normalizeScopeType(scopeType) {
  const value = String(scopeType || '').trim().toLowerCase();
  if (!value) return null;

  const aliases = {
    securite: 'security',
    's\xe9curit\xe9': 'security',
    facturation: 'facturation',
    billing: 'facturation',
    application: 'application',
    environment: 'environment',
    support: 'support',
    tenant: 'tenant',
  };

  return aliases[value] || value;
}

function normalizePermissions(permissionList = []) {
  const raw = Array.isArray(permissionList) ? permissionList : [permissionList];
  return [...new Set(raw.filter(Boolean).map((item) => String(item).trim()).filter(Boolean))];
}

function serializePermissions(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function toPublicDelegation(record) {
  return {
    id: record.id,
    tenantId: record.tenantId,
    grantedBy: record.grantorUserId,
    grantedTo: record.granteeUserId,
    scopeType: record.scopeType,
    scopeId: record.scopeId,
    permissions: serializePermissions(record.permissions),
    startsAt: record.validFrom,
    endsAt: record.validUntil,
    status: record.status,
    reason: record.reason,
    revokedAt: record.revokedAt,
    revokedBy: record.revokedBy,
    createdAt: record.createdAt,
  };
}

async function expireDelegations({ tenantId } = {}) {
  const now = new Date();
  const result = await prisma.adminDelegation.updateMany({
    where: {
      ...(tenantId ? { tenantId } : {}),
      status: { in: ['ACTIVE', 'SUSPENDED'] },
      validUntil: { not: null, lte: now },
    },
    data: {
      status: 'EXPIRED',
    },
  });

  return { expired: result.count };
}

async function getGrantorPermissionSet({ userId, tenantId } = {}) {
  const assignments = await prisma.roleAssignment.findMany({
    where: {
      userId,
      tenantId,
      revokedAt: null,
    },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  const permissionSet = new Set();
  for (const assignment of assignments) {
    for (const rolePermission of assignment.role.permissions || []) {
      if (rolePermission.permission) permissionSet.add(rolePermission.permission.code);
    }
  }

  return permissionSet;
}

async function listDelegations({ tenantId, granteeUserId } = {}) {
  await expireDelegations({ tenantId });

  const delegations = await prisma.adminDelegation.findMany({
    where: {
      ...(tenantId ? { tenantId } : {}),
      ...(granteeUserId ? { granteeUserId } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  return delegations.map(toPublicDelegation);
}

async function getEffectiveDelegations({ tenantId, userId } = {}) {
  await expireDelegations({ tenantId });

  const now = new Date();
  const delegations = await prisma.adminDelegation.findMany({
    where: {
      ...(tenantId ? { tenantId } : {}),
      ...(userId ? { granteeUserId: userId } : {}),
      status: 'ACTIVE',
      validFrom: { lte: now },
      OR: [{ validUntil: null }, { validUntil: { gte: now } }],
    },
    orderBy: { validFrom: 'desc' },
  });

  return delegations.map(toPublicDelegation);
}

async function createDelegation({
  tenantId,
  grantorUserId,
  granteeUserId,
  scopeType,
  scopeId,
  permissions,
  validFrom,
  validUntil,
  reason,
} = {}) {
  if (!grantorUserId) {
    throw new AppError('Délégant requis', 400, 'DELEGATION_GRANTOR_REQUIRED');
  }

  if (!granteeUserId) {
    throw new AppError('Bénéficiaire requis', 400, 'DELEGATION_GRANTEE_REQUIRED');
  }

  const normalizedScopeType = normalizeScopeType(scopeType);
  if (!normalizedScopeType || !ALLOWED_SCOPE_TYPES.has(normalizedScopeType)) {
    throw new AppError('Type de périmètre invalide', 400, 'DELEGATION_SCOPE_INVALID');
  }

  const normalizedPermissions = normalizePermissions(permissions);
  if (normalizedPermissions.length === 0) {
    throw new AppError('Au moins une permission est requise', 400, 'DELEGATION_PERMISSION_REQUIRED');
  }

  const grantorPermissionSet = await getGrantorPermissionSet({ userId: grantorUserId, tenantId });
  const unauthorized = normalizedPermissions.filter((permission) => !grantorPermissionSet.has(permission));

  if (unauthorized.length > 0) {
    throw new AppError('La délégation ne peut pas dépasser les permissions du délégant', 403, 'DELEGATION_PERMISSION_EXCEEDS_GRANTOR');
  }

  const startsAt = validFrom ? new Date(validFrom) : new Date();
  const endsAt = validUntil ? new Date(validUntil) : null;
  if (endsAt && endsAt <= startsAt) {
    throw new AppError('La date de fin doit être postérieure à la date de début', 400, 'DELEGATION_DATE_INVALID');
  }

  const record = await prisma.adminDelegation.create({
    data: {
      tenantId,
      grantorUserId,
      granteeUserId,
      scopeType: normalizedScopeType,
      scopeId: scopeId || tenantId || null,
      permissions: normalizedPermissions,
      status: 'ACTIVE',
      validFrom: startsAt,
      validUntil: endsAt,
      reason: reason || 'ADMIN_DELEGATION',
      createdBy: grantorUserId,
    },
  });

  await logAdminAction({
    actorId: grantorUserId,
    tenantId,
    action: 'ADMIN_DELEGATION_CREATED',
    targetType: 'ADMIN_DELEGATION',
    targetId: record.id,
    result: 'SUCCESS',
    reason: reason || 'ADMIN_DELEGATION',
    before: null,
    after: { status: record.status, scopeType: record.scopeType, permissions: record.permissions },
  });

  return toPublicDelegation(record);
}

async function revokeDelegation({ delegationId, actorId, reason } = {}) {
  const delegation = await prisma.adminDelegation.findUnique({
    where: { id: delegationId },
  });

  if (!delegation) {
    throw new AppError('Délégation introuvable', 404, 'DELEGATION_NOT_FOUND');
  }

  if (delegation.status === 'REVOKED') {
    return {
      revoked: false,
      reason: 'ALREADY_REVOKED',
      delegation: toPublicDelegation(delegation),
      audit: true,
    };
  }

  const updated = await prisma.adminDelegation.update({
    where: { id: delegationId },
    data: {
      status: 'REVOKED',
      revokedAt: new Date(),
      revokedBy: actorId,
      reason: reason || delegation.reason || 'ADMIN_REVOCATION',
    },
  });

  await logAdminAction({
    actorId,
    tenantId: delegation.tenantId,
    action: 'ADMIN_DELEGATION_REVOKED',
    targetType: 'ADMIN_DELEGATION',
    targetId: delegationId,
    result: 'SUCCESS',
    reason: reason || 'ADMIN_REVOCATION',
    before: { status: delegation.status },
    after: { status: updated.status, revokedBy: actorId, revokedAt: updated.revokedAt },
  });

  return {
    revoked: true,
    delegation: toPublicDelegation(updated),
    audit: true,
  };
}

module.exports = {
  listDelegations,
  getEffectiveDelegations,
  createDelegation,
  revokeDelegation,
  expireDelegations,
};
