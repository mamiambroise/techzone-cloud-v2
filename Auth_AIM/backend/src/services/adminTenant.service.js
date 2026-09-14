const { prisma } = require('../config/database');
const tenantService = require('./tenant.service');
const subscriptionService = require('./subscription.service');
const quotaService = require('./quota.service');
const { logAdminAction } = require('./adminAudit.service');

async function searchTenants({ search, status }) {
  return tenantService.searchTenants({ search, status });
}

async function getTenantProfile(tenantId) {
  return tenantService.getTenantById(tenantId);
}

async function getTenantMemberships(tenantId) {
  return tenantService.getTenantMemberships(tenantId);
}

async function getTenantSubscriptions(tenantId) {
  return subscriptionService.listSubscriptionsForTenant(tenantId);
}

async function getTenantUsage(tenantId) {
  const subscriptions = await subscriptionService.listSubscriptionsForTenant(tenantId, { status: 'ACTIVE' });
  const usageBySubscription = await Promise.all(
    subscriptions.map(async (sub) => ({
      subscriptionId: sub.id,
      planCode: sub.plan.code,
      quotas: await quotaService.listQuotaUsageForSubscription(sub.id),
    }))
  );
  return usageBySubscription;
}

async function getTenantIncidents(tenantId) {
  return prisma.securityEvent.findMany({
    where: { tenantId, severity: { in: ['HIGH', 'CRITICAL'] } },
    orderBy: { occurredAt: 'desc' },
    take: 50,
  });
}

async function changeTenantStatus({ tenantId, status, actorId, reason }) {
  const before = await tenantService.getTenantById(tenantId);
  const updated = await tenantService.setTenantStatus({ tenantId, status, changedBy: actorId, reason });

  await logAdminAction({
    actorId,
    tenantId,
    action: `TENANT_STATUS_${status}`,
    targetType: 'TENANT',
    targetId: tenantId,
    result: 'SUCCESS',
    reason,
    before: { status: before.status },
    after: { status: updated.status },
  });

  return updated;
}

module.exports = {
  searchTenants,
  getTenantProfile,
  getTenantMemberships,
  getTenantSubscriptions,
  getTenantUsage,
  getTenantIncidents,
  changeTenantStatus,
};