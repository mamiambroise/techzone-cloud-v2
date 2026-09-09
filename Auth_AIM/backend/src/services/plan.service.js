const { prisma } = require('../config/database');
const { AppError } = require('../utils/response');

async function createPlan({ code, name, description, billingInterval, price, currency, trialDays, metadata }) {
  const existing = await prisma.plan.findUnique({ where: { code } });
  if (existing) {
    throw new AppError('Un plan avec ce code existe déjà', 409, 'PLAN_CODE_ALREADY_EXISTS');
  }
  return prisma.plan.create({
    data: { code, name, description, billingInterval, price, currency, trialDays, metadata, status: 'DRAFT' },
  });
}

async function listPlans({ status } = {}) {
  return prisma.plan.findMany({
    where: { ...(status ? { status } : {}) },
    include: { entitlements: true },
    orderBy: { createdAt: 'desc' },
  });
}

async function getPlanById(id) {
  const plan = await prisma.plan.findUnique({ where: { id }, include: { entitlements: true } });
  if (!plan) {
    throw new AppError('Plan introuvable', 404, 'PLAN_NOT_FOUND');
  }
  return plan;
}

async function updatePlan(id, patch) {
  const plan = await getPlanById(id);
  const criticalFields = ['price', 'currency', 'billingInterval'];
  const touchesCritical = criticalFields.some((f) => patch[f] !== undefined && patch[f] !== plan[f]);

  if (plan.status === 'ACTIVE' && touchesCritical) {
    throw new AppError(
      'Un plan actif ne peut pas être modifié rétroactivement sur le prix/devise/périodicité — crée une nouvelle version du plan',
      409,
      'PLAN_ACTIVE_IMMUTABLE'
    );
  }

  return prisma.plan.update({
    where: { id },
    data: { ...patch, version: { increment: 1 } },
  });
}

async function activatePlan(id) {
  const plan = await getPlanById(id);
  if (plan.status !== 'DRAFT') {
    throw new AppError('Seul un plan DRAFT peut être activé', 409, 'PLAN_INVALID_TRANSITION');
  }
  if (plan.entitlements.length === 0) {
    throw new AppError('Un plan doit avoir au moins une entitlement définie avant activation', 422, 'PLAN_NO_ENTITLEMENTS');
  }
  return prisma.plan.update({ where: { id }, data: { status: 'ACTIVE' } });
}

async function deprecatePlan(id) {
  await getPlanById(id);
  return prisma.plan.update({ where: { id }, data: { status: 'DISABLED' } });
}

async function archivePlan(id) {
  await getPlanById(id);
  return prisma.plan.update({ where: { id }, data: { status: 'ARCHIVED', archivedAt: new Date() } });
}

async function createNewPlanVersion(oldPlanId, { code, ...overrides }) {
  const oldPlan = await getPlanById(oldPlanId);
  const newPlan = await prisma.plan.create({
    data: {
      code,
      name: overrides.name ?? oldPlan.name,
      description: overrides.description ?? oldPlan.description,
      billingInterval: overrides.billingInterval ?? oldPlan.billingInterval,
      price: overrides.price ?? oldPlan.price,
      currency: overrides.currency ?? oldPlan.currency,
      trialDays: overrides.trialDays ?? oldPlan.trialDays,
      metadata: overrides.metadata ?? oldPlan.metadata,
      status: 'DRAFT',
    },
  });
  await prisma.planEntitlement.createMany({
    data: oldPlan.entitlements.map((e) => ({
      planId: newPlan.id,
      featureCode: e.featureCode,
      valueType: e.valueType,
      enabled: e.enabled,
      integerValue: e.integerValue,
      decimalValue: e.decimalValue,
      stringValue: e.stringValue,
      jsonValue: e.jsonValue,
    })),
  });
  return newPlan;
}

async function addEntitlement({ planId, featureCode, valueType, enabled, integerValue, decimalValue, stringValue, jsonValue }) {
  const plan = await getPlanById(planId);
  if (plan.status === 'ACTIVE') {
    throw new AppError('Impossible d\'ajouter une entitlement à un plan déjà actif', 409, 'PLAN_ACTIVE_IMMUTABLE');
  }
  return prisma.planEntitlement.create({
    data: { planId, featureCode, valueType, enabled, integerValue, decimalValue, stringValue, jsonValue },
  });
}

async function removeEntitlement(entitlementId) {
  return prisma.planEntitlement.delete({ where: { id: entitlementId } });
}

module.exports = {
  createPlan,
  listPlans,
  getPlanById,
  updatePlan,
  activatePlan,
  deprecatePlan,
  archivePlan,
  createNewPlanVersion,
  addEntitlement,
  removeEntitlement,
};