const { prisma } = require('../config/database');
const { AppError } = require('../utils/response');

async function getEffectiveEntitlement({ subscriptionId, featureCode }) {
  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!subscription) {
    throw new AppError('Abonnement introuvable', 404, 'SUBSCRIPTION_NOT_FOUND');
  }

  const planEntitlement = await prisma.planEntitlement.findUnique({
    where: { planId_featureCode: { planId: subscription.planId, featureCode } },
  });

  const now = new Date();
  const override = await prisma.subscriptionEntitlementOverride.findFirst({
    where: {
      subscriptionId,
      featureCode,
      OR: [{ validFrom: null }, { validFrom: { lte: now } }],
      AND: [{ OR: [{ validUntil: null }, { validUntil: { gte: now } }] }],
    },
  });

  if (!planEntitlement && !override) {
    return { granted: false, source: 'NONE', featureCode, valueType: null, value: null };
  }

  const base = planEntitlement || { valueType: 'BOOLEAN', enabled: false, integerValue: null, decimalValue: null, stringValue: null, jsonValue: null };

  if (!override) {
    return {
      granted: base.enabled,
      source: 'PLAN',
      featureCode,
      valueType: base.valueType,
      value: base.integerValue ?? base.decimalValue ?? base.stringValue ?? base.jsonValue ?? base.enabled,
    };
  }

  const enabled = override.enabled !== null && override.enabled !== undefined ? override.enabled : base.enabled;
  return {
    granted: enabled,
    source: 'OVERRIDE',
    featureCode,
    valueType: override.valueType,
    value: override.integerValue ?? override.decimalValue ?? override.stringValue ?? override.jsonValue ?? enabled,
    overrideReason: override.reason,
    overrideValidUntil: override.validUntil,
  };
}

async function listEffectiveEntitlements(subscriptionId) {
  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!subscription) {
    throw new AppError('Abonnement introuvable', 404, 'SUBSCRIPTION_NOT_FOUND');
  }

  const planEntitlements = await prisma.planEntitlement.findMany({ where: { planId: subscription.planId } });
  return Promise.all(planEntitlements.map((pe) => getEffectiveEntitlement({ subscriptionId, featureCode: pe.featureCode })));
}

async function createOverride({ subscriptionId, featureCode, valueType, enabled, integerValue, decimalValue, stringValue, jsonValue, reason, validFrom, validUntil, createdBy }) {
  if (!reason) {
    throw new AppError('Un override doit toujours avoir une raison explicite (audit CDC-08)', 422, 'OVERRIDE_REASON_REQUIRED');
  }

  const override = await prisma.subscriptionEntitlementOverride.upsert({
    where: { subscriptionId_featureCode: { subscriptionId, featureCode } },
    update: { valueType, enabled, integerValue, decimalValue, stringValue, jsonValue, reason, validFrom, validUntil, createdBy },
    create: { subscriptionId, featureCode, valueType, enabled, integerValue, decimalValue, stringValue, jsonValue, reason, validFrom, validUntil, createdBy },
  });

  await prisma.billingEvent.create({
    data: {
      tenantId: (await prisma.subscription.findUnique({ where: { id: subscriptionId } })).tenantId,
      subscriptionId,
      eventType: 'ENTITLEMENT_OVERRIDE_SET',
      payload: { featureCode, reason, createdBy },
    },
  });

  return override;
}

async function removeOverride({ subscriptionId, featureCode }) {
  return prisma.subscriptionEntitlementOverride.delete({
    where: { subscriptionId_featureCode: { subscriptionId, featureCode } },
  });
}

module.exports = { getEffectiveEntitlement, listEffectiveEntitlements, createOverride, removeOverride };