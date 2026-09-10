const { prisma } = require('../config/database');
const { AppError } = require('../utils/response');
const entitlementService = require('./entitlement.service');

async function getOrCreateQuotaPeriod({ subscriptionId, featureCode }) {
  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!subscription) {
    throw new AppError('Abonnement introuvable', 404, 'SUBSCRIPTION_NOT_FOUND');
  }
  if (!subscription.currentPeriodStart || !subscription.currentPeriodEnd) {
    throw new AppError('Période d\'abonnement non définie, impossible de suivre un quota', 409, 'SUBSCRIPTION_PERIOD_UNDEFINED');
  }

  const existing = await prisma.quotaUsage.findUnique({
    where: {
      subscriptionId_featureCode_periodStart_periodEnd: {
        subscriptionId,
        featureCode,
        periodStart: subscription.currentPeriodStart,
        periodEnd: subscription.currentPeriodEnd,
      },
    },
  });
  if (existing) return existing;

  const entitlement = await entitlementService.getEffectiveEntitlement({ subscriptionId, featureCode });
  if (!entitlement.granted) {
    throw new AppError('Cette feature n\'est pas incluse dans l\'abonnement', 403, 'FEATURE_NOT_INCLUDED');
  }

  const limitValue = typeof entitlement.value === 'number' ? entitlement.value : null;

  return prisma.quotaUsage.create({
    data: {
      subscriptionId,
      featureCode,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
      usedValue: 0,
      limitValue,
    },
  });
}

async function getQuotaStatus({ subscriptionId, featureCode }) {
  const usage = await getOrCreateQuotaPeriod({ subscriptionId, featureCode });
  const remaining = usage.limitValue === null ? null : Math.max(Number(usage.limitValue) - Number(usage.usedValue), 0);
  return { ...usage, remaining };
}

async function consumeQuota({ subscriptionId, featureCode, amount = 1 }) {
  const usage = await getOrCreateQuotaPeriod({ subscriptionId, featureCode });

  if (usage.limitValue === null) {
    const updated = await prisma.quotaUsage.update({
      where: { id: usage.id },
      data: { usedValue: { increment: amount } },
    });
    return { allowed: true, quota: updated, remaining: null };
  }

  const result = await prisma.$queryRaw`
    UPDATE "QuotaUsage"
    SET "usedValue" = "usedValue" + ${amount}, "updatedAt" = now()
    WHERE id = ${usage.id} AND "usedValue" + ${amount} <= "limitValue"
    RETURNING *
  `;

  if (result.length === 0) {
    const current = await prisma.quotaUsage.findUnique({ where: { id: usage.id } });
    throw new AppError(
      'Quota dépassé',
      429,
      'QUOTA_EXCEEDED',
      { limit: Number(current.limitValue), used: Number(current.usedValue) }
    );
  }

  const updated = result[0];
  return { allowed: true, quota: updated, remaining: Number(updated.limitValue) - Number(updated.usedValue) };
}

module.exports = { getOrCreateQuotaPeriod, getQuotaStatus, consumeQuota };