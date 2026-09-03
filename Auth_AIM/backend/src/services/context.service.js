const { prisma } = require('../config/database');
const { AppError } = require('../utils/response');
const contextResolver = require('./contextResolver.service');

async function persistSnapshot(context) {
  return prisma.contextSnapshot.create({
    data: {
      traceId: context.traceId,
      userId: context.subject.userId,
      tenantId: context.tenant ? context.tenant.tenantId : null,
      organizationId: context.tenant ? context.tenant.organizationId : null,
      siteId: context.tenant ? context.tenant.siteId : null,
      sessionId: context.session.sessionId,
      roles: context.roles,
      permissions: context.permissions,
      policies: context.policyDecisions,
      authentication: {
        assuranceLevel: context.session.assuranceLevel,
        mfaVerified: context.session.mfaVerified,
      },
      security: {
        riskLevel: context.session.riskLevel,
        deviceTrusted: context.session.deviceTrusted,
        conflicts: context.conflicts,
        warnings: context.warnings,
      },
      resolvedAt: context.resolvedAt,
      expiresAt: context.expiresAt,
    },
  });
}

async function getContext(request) {
  const context = await contextResolver.resolveContext(request);
  if (context.status === 'RESOLVED' || context.status === 'PARTIAL') {
    await persistSnapshot(context);
  }
  return context;
}

async function getLatestValidSnapshot({ userId, tenantId }) {
  return prisma.contextSnapshot.findFirst({
    where: { userId, tenantId, expiresAt: { gt: new Date() } },
    orderBy: { resolvedAt: 'desc' },
  });
}

async function switchTenant({ userId, sessionId, toTenantId, traceId }) {
  const previous = await getLatestValidSnapshot({ userId, tenantId: undefined });

  let newContext;
  let result = 'SUCCESS';
  let reason = null;

  try {
    newContext = await getContext({
      subjectType: 'USER',
      subjectId: userId,
      sessionId,
      requestedTenantId: toTenantId,
      source: 'TENANT_SWITCH',
      traceId,
    });
    if (newContext.status !== 'RESOLVED') {
      result = 'DENIED';
      reason = newContext.warnings[0] || newContext.status;
    }
  } catch (err) {
    result = 'DENIED';
    reason = err.code || 'RESOLUTION_ERROR';
    throw err;
  } finally {
    await prisma.contextSwitchEvent.create({
      data: {
        traceId,
        userId,
        sessionId,
        toTenantId,
        previousContextId: previous ? previous.id : null,
        resolvedContextId: result === 'SUCCESS' ? newContext.traceId : null,
        result,
        reason,
      },
    });
  }

  return newContext;
}

async function invalidateContext({ subjectType = 'USER', subjectId, tenantId, reason, sourceEventType, sourceEventId }) {
  return prisma.contextInvalidation.create({
    data: { subjectType, subjectId, tenantId, reason, sourceEventType, sourceEventId },
  });
}

async function getActiveTenantsForUser(userId) {
  const memberships = await prisma.membership.findMany({
    where: { userId, status: 'ACTIVE' },
    include: { tenant: true },
  });
  return memberships
    .filter((m) => m.tenant.status === 'ACTIVE')
    .map((m) => ({ tenantId: m.tenantId, tenantName: m.tenant.name, membershipId: m.id }));
}

module.exports = {
  getContext,
  getLatestValidSnapshot,
  switchTenant,
  invalidateContext,
  getActiveTenantsForUser,
};