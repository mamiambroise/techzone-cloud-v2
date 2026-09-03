const crypto = require('crypto');
const { prisma } = require('../config/database');
const { AppError } = require('../utils/response');
const identityService = require('./identity.service');
const sessionService = require('./session.service');

const CONTEXT_TTL_MS = 15 * 60 * 1000;

function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(',')}]`;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

function computeContextHash(payload) {
  return crypto.createHash('sha256').update(stableStringify(payload)).digest('hex');
}

async function resolveActiveMemberships(userId) {
  return prisma.membership.findMany({
    where: { userId, status: 'ACTIVE' },
    include: { tenant: true, organization: true, site: true },
  });
}

async function resolveTenantContext({ userId, requestedTenantId }) {
  const memberships = await resolveActiveMemberships(userId);

  if (memberships.length === 0) {
    return { status: 'INVALID', warnings: ['NO_ACTIVE_MEMBERSHIP'], membership: null, candidates: [] };
  }

  if (requestedTenantId) {
    const membership = memberships.find((m) => m.tenantId === requestedTenantId);
    if (!membership) {
      return { status: 'BLOCKED', warnings: ['MEMBERSHIP_NOT_FOUND_FOR_TENANT'], membership: null, candidates: [] };
    }
    if (membership.tenant.status !== 'ACTIVE') {
      return { status: 'BLOCKED', warnings: ['TENANT_NOT_ACTIVE'], membership: null, candidates: [] };
    }
    return { status: 'RESOLVED', warnings: [], membership, candidates: [] };
  }

  if (memberships.length === 1) {
    const membership = memberships[0];
    if (membership.tenant.status !== 'ACTIVE') {
      return { status: 'BLOCKED', warnings: ['TENANT_NOT_ACTIVE'], membership: null, candidates: [] };
    }
    return { status: 'RESOLVED', warnings: [], membership, candidates: [] };
  }

  return {
    status: 'PARTIAL',
    warnings: ['TENANT_SELECTION_REQUIRED'],
    membership: null,
    candidates: memberships.map((m) => ({ tenantId: m.tenantId, tenantName: m.tenant.name })),
  };
}

async function loadEffectiveRoleIds({ userId, tenantId }) {
  const groupMemberships = await prisma.groupMember.findMany({
    where: { userId, removedAt: null },
    select: { groupId: true },
  });
  const groupIds = groupMemberships.map((g) => g.groupId);
  const now = new Date();

  const assignments = await prisma.roleAssignment.findMany({
    where: {
      revokedAt: null,
      OR: [{ userId }, { groupId: { in: groupIds.length ? groupIds : ['__none__'] } }],
      AND: [
        { OR: [{ tenantId }, { tenantId: null }] },
        { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
        { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
      ],
    },
    select: { roleId: true },
  });

  return [...new Set(assignments.map((a) => a.roleId))];
}

async function loadRolesAndPermissions(roleIds) {
  if (roleIds.length === 0) return { roles: [], permissions: [] };

  const roles = await prisma.role.findMany({
    where: { id: { in: roleIds }, status: 'ACTIVE' },
  });

  const rolePermissions = await prisma.rolePermission.findMany({
    where: { roleId: { in: roleIds }, revokedAt: null },
    include: { permission: true },
  });

  const permissionsMap = new Map();
  for (const rp of rolePermissions) {
    if (rp.permission.active) {
      permissionsMap.set(rp.permission.code, {
        code: rp.permission.code,
        resource: rp.permission.resource,
        action: rp.permission.action,
        critical: rp.permission.critical,
      });
    }
  }

  return { roles: roles.map((r) => ({ id: r.id, code: r.code, privileged: r.privileged })), permissions: [...permissionsMap.values()] };
}

async function evaluatePolicies({ tenantId, resource, action }) {
  if (!resource || !action) return { decisions: [], effect: null };

  const now = new Date();
  const policies = await prisma.accessPolicy.findMany({
    where: {
      status: 'ACTIVE',
      OR: [{ tenantId }, { tenantId: null }],
      AND: [
        { OR: [{ resource: null }, { resource }] },
        { OR: [{ action: null }, { action }] },
        { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: now } }] },
        { OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: now } }] },
      ],
    },
    orderBy: { priority: 'asc' },
  });

  const decisions = policies.map((p) => ({ policyId: p.id, code: p.code, effect: p.effect, priority: p.priority }));

  let effect = 'DENY';
  if (decisions.some((d) => d.effect === 'DENY')) effect = 'DENY';
  else if (decisions.some((d) => d.effect === 'APPROVAL_REQUIRED')) effect = 'APPROVAL_REQUIRED';
  else if (decisions.some((d) => d.effect === 'STEP_UP')) effect = 'STEP_UP';
  else if (decisions.some((d) => d.effect === 'ALLOW')) effect = 'ALLOW';

  return { decisions, effect };
}

async function resolveSecurityContext(session) {
  let deviceTrusted = false;
  if (session.deviceId) {
    const device = await prisma.device.findUnique({ where: { id: session.deviceId } });
    deviceTrusted = Boolean(device && device.trustLevel === 'TRUSTED' && !device.revokedAt);
  }

  return {
    assuranceLevel: session.authenticationLevel,
    mfaVerified: session.authenticationLevel === 'MFA',
    riskLevel: session.riskLevel,
    deviceTrusted,
  };
}

async function resolveContext({
  subjectType = 'USER',
  subjectId,
  sessionId,
  requestedTenantId,
  resource,
  action,
  source = 'API_REQUEST',
  traceId,
}) {
  if (subjectType !== 'USER') {
    throw new AppError('Type de sujet non supporté par ce resolver', 400, 'IAM_CONTEXT_SUBJECT_UNSUPPORTED');
  }

  const user = await identityService.getUserById(subjectId);
  try {
    identityService.assertUserIsActive(user);
  } catch (err) {
    throw new AppError('Utilisateur inactif pour la résolution de contexte', 403, 'IAM_CONTEXT_USER_INACTIVE');
  }

  const session = await sessionService.getSessionById(sessionId);
  try {
    await sessionService.assertSessionUsable(session);
  } catch (err) {
    throw new AppError('Session invalide pour la résolution de contexte', 401, 'IAM_CONTEXT_SESSION_INVALID');
  }
  if (session.userId !== subjectId) {
    throw new AppError('Session ne correspond pas au sujet', 401, 'IAM_CONTEXT_SESSION_MISMATCH');
  }

  const warnings = [];
  const conflicts = [];

  const tenantResolution = await resolveTenantContext({ userId: subjectId, requestedTenantId });
  warnings.push(...tenantResolution.warnings);

  let roles = [];
  let permissions = [];
  let policyEvaluation = { decisions: [], effect: null };
  let deniedPermissions = [];
  let conditionalPermissions = [];

  if (tenantResolution.status === 'RESOLVED') {
    const roleIds = await loadEffectiveRoleIds({ userId: subjectId, tenantId: tenantResolution.membership.tenantId });
    const loaded = await loadRolesAndPermissions(roleIds);
    roles = loaded.roles;
    permissions = loaded.permissions;

    policyEvaluation = await evaluatePolicies({ tenantId: tenantResolution.membership.tenantId, resource, action });

    if (policyEvaluation.effect === 'DENY') {
      deniedPermissions = permissions.map((p) => p.code);
      permissions = [];
    } else if (policyEvaluation.effect === 'STEP_UP' || policyEvaluation.effect === 'APPROVAL_REQUIRED') {
      conditionalPermissions = permissions.map((p) => p.code);
    }
  }

  const security = await resolveSecurityContext(session);

  if (security.riskLevel === 'CRITICAL') {
    conflicts.push('SESSION_RISK_CRITICAL');
  }
  if (roles.some((r) => r.privileged) && !security.deviceTrusted) {
    warnings.push('PRIVILEGED_ROLE_ON_UNTRUSTED_DEVICE');
  }

  let status = tenantResolution.status;
  if (status === 'RESOLVED' && conflicts.includes('SESSION_RISK_CRITICAL')) {
    status = 'BLOCKED';
  }
  if (status === 'RESOLVED' && policyEvaluation.effect === 'APPROVAL_REQUIRED') {
    status = 'PARTIAL';
    warnings.push('APPROVAL_REQUIRED_FOR_ACTION');
  }

  const resolvedAt = new Date();
  const expiresAt = new Date(resolvedAt.getTime() + CONTEXT_TTL_MS);

  const context = {
    contextVersion: 1,
    status,
    source,
    subject: { subjectType, subjectId, userId: user.id },
    session: {
      sessionId: session.id,
      status: session.status,
      assuranceLevel: security.assuranceLevel,
      mfaVerified: security.mfaVerified,
      riskLevel: security.riskLevel,
      deviceTrusted: security.deviceTrusted,
    },
    tenant: tenantResolution.membership
      ? {
          tenantId: tenantResolution.membership.tenantId,
          organizationId: tenantResolution.membership.organizationId,
          siteId: tenantResolution.membership.siteId,
          membershipId: tenantResolution.membership.id,
          status: tenantResolution.membership.status,
        }
      : null,
    candidateTenants: tenantResolution.candidates,
    roles,
    permissions,
    conditionalPermissions,
    deniedPermissions,
    policyDecisions: policyEvaluation.decisions,
    conflicts,
    warnings,
    confidence: status === 'RESOLVED' ? 1 : 0.5,
    resolvedAt,
    expiresAt,
    traceId: traceId || crypto.randomUUID(),
  };

  context.contextHash = computeContextHash({
    subject: context.subject,
    tenant: context.tenant,
    roles: context.roles,
    permissions: context.permissions,
    security: context.session,
  });

  return context;
}

module.exports = { resolveContext, computeContextHash };