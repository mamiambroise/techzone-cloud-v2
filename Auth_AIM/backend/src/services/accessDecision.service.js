const contextService = require('./context.service');
const subscriptionService = require('./subscription.service');
const entitlementService = require('./entitlement.service');
const quotaService = require('./quota.service');

function denied(reasonCode, extra = {}) {
  return { allowed: false, reasonCode, planCode: null, entitlementCode: null, quotaState: null, effectiveUntil: null, ...extra };
}

async function decideAccess({ userId, sessionId, tenantId, resource, action, featureCode, applicationCode }) {
  const context = await contextService.getContext({
    subjectType: 'USER',
    subjectId: userId,
    sessionId,
    requestedTenantId: tenantId,
    resource,
    action,
    source: 'ACCESS_DECISION',
  });

  if (context.status !== 'RESOLVED') {
    return denied('IAM_PERMISSION_DENIED', { iamStatus: context.status });
  }

  const hasIamPermission = context.permissions.some((p) => p.resource === resource && p.action === action);
  if (!hasIamPermission) {
    return denied('IAM_PERMISSION_DENIED');
  }

  const subscription = await subscriptionService.findActiveSubscriptionForTenant(tenantId, applicationCode);
  if (!subscription) {
    return denied('NO_ACTIVE_SUBSCRIPTION');
  }

  if (subscription.status === 'SUSPENDED') {
    return denied('SUBSCRIPTION_SUSPENDED', { planCode: subscription.plan.code });
  }
  if (['EXPIRED', 'CANCELLED'].includes(subscription.status)) {
    return denied('SUBSCRIPTION_EXPIRED', { planCode: subscription.plan.code });
  }

  const entitlement = await entitlementService.getEffectiveEntitlement({
    subscriptionId: subscription.id,
    featureCode,
  });
  if (!entitlement.granted) {
    return denied('FEATURE_NOT_INCLUDED', { planCode: subscription.plan.code });
  }

  let quotaState = null;
  const quotaCheck = await entitlementService.getEffectiveEntitlement({ subscriptionId: subscription.id, featureCode });
  if (typeof quotaCheck.value === 'number') {
    const status = await quotaService.getQuotaStatus({ subscriptionId: subscription.id, featureCode });
    quotaState = { used: Number(status.usedValue), limit: status.limitValue === null ? null : Number(status.limitValue), remaining: status.remaining };
    if (status.remaining !== null && status.remaining <= 0) {
      return denied('QUOTA_EXCEEDED', { planCode: subscription.plan.code, entitlementCode: featureCode, quotaState });
    }
  }

  return {
    allowed: true,
    reasonCode: null,
    planCode: subscription.plan.code,
    entitlementCode: featureCode,
    quotaState,
    effectiveUntil: entitlement.overrideValidUntil || subscription.currentPeriodEnd,
  };
}

module.exports = { decideAccess };