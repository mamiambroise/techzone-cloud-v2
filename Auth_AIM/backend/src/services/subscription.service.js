const { prisma } = require('../config/database');
const { AppError } = require('../utils/response');
const planService = require('./plan.service');

function computePeriodEnd(start, billingInterval) {
  const end = new Date(start);
  switch (billingInterval) {
    case 'MONTHLY': end.setMonth(end.getMonth() + 1); break;
    case 'QUARTERLY': end.setMonth(end.getMonth() + 3); break;
    case 'SEMESTER': end.setMonth(end.getMonth() + 6); break;
    case 'YEARLY': end.setFullYear(end.getFullYear() + 1); break;
    default: end.setMonth(end.getMonth() + 1);
  }
  return end;
}

async function logSubscriptionEvent({ tenantId, subscriptionId, eventType, payload }) {
  return prisma.billingEvent.create({
    data: { tenantId, subscriptionId, eventType, payload },
  });
}

async function getSubscriptionById(id) {
  const subscription = await prisma.subscription.findUnique({ where: { id }, include: { plan: true } });
  if (!subscription) {
    throw new AppError('Abonnement introuvable', 404, 'SUBSCRIPTION_NOT_FOUND');
  }
  return subscription;
}

async function listSubscriptionsForTenant(tenantId, { status } = {}) {
  return prisma.subscription.findMany({
    where: { tenantId, ...(status ? { status } : {}) },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });
}

async function subscribe({ tenantId, planId, applicationCode, startTrial = true }) {
  const plan = await planService.getPlanById(planId);
  if (plan.status !== 'ACTIVE') {
    throw new AppError('Seul un plan ACTIVE peut être souscrit', 409, 'PLAN_NOT_ACTIVE');
  }

  const useTrial = startTrial && plan.trialDays && plan.trialDays > 0;
  const now = new Date();

  const subscription = await prisma.subscription.create({
    data: {
      tenantId,
      planId,
      applicationCode,
      status: useTrial ? 'TRIAL' : 'ACTIVE',
      startsAt: now,
      trialEndsAt: useTrial ? new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000) : null,
      currentPeriodStart: useTrial ? null : now,
      currentPeriodEnd: useTrial ? null : computePeriodEnd(now, plan.billingInterval),
    },
  });

  await logSubscriptionEvent({
    tenantId,
    subscriptionId: subscription.id,
    eventType: 'SUBSCRIPTION_CREATED',
    payload: { planId, status: subscription.status },
  });

  return subscription;
}

async function activateFromTrial(subscriptionId) {
  const subscription = await getSubscriptionById(subscriptionId);
  if (subscription.status !== 'TRIAL') {
    throw new AppError('Seul un abonnement TRIAL peut être activé par ce biais', 409, 'SUBSCRIPTION_INVALID_TRANSITION');
  }

  const now = new Date();
  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: computePeriodEnd(now, subscription.plan.billingInterval),
    },
  });

  await logSubscriptionEvent({
    tenantId: subscription.tenantId,
    subscriptionId,
    eventType: 'SUBSCRIPTION_ACTIVATED',
    payload: { fromStatus: 'TRIAL' },
  });

  return updated;
}

async function changePlan({ subscriptionId, newPlanId, policy = 'END_OF_PERIOD', actorId }) {
  const subscription = await getSubscriptionById(subscriptionId);
  const newPlan = await planService.getPlanById(newPlanId);

  if (newPlan.status !== 'ACTIVE') {
    throw new AppError('Le nouveau plan doit être ACTIVE', 409, 'PLAN_NOT_ACTIVE');
  }
  if (!['ACTIVE', 'TRIAL'].includes(subscription.status)) {
    throw new AppError('Changement de plan possible uniquement sur un abonnement ACTIVE ou TRIAL', 409, 'SUBSCRIPTION_INVALID_TRANSITION');
  }

  if (policy === 'IMMEDIATE') {
    const now = new Date();
    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        planId: newPlanId,
        currentPeriodStart: now,
        currentPeriodEnd: computePeriodEnd(now, newPlan.billingInterval),
        metadata: { ...(subscription.metadata || {}), pendingPlanChange: null },
      },
    });
    await logSubscriptionEvent({
      tenantId: subscription.tenantId,
      subscriptionId,
      eventType: 'SUBSCRIPTION_PLAN_CHANGED_IMMEDIATE',
      payload: { fromPlanId: subscription.planId, toPlanId: newPlanId, actorId },
    });
    return updated;
  }

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      metadata: {
        ...(subscription.metadata || {}),
        pendingPlanChange: { newPlanId, scheduledFor: subscription.currentPeriodEnd, requestedBy: actorId, requestedAt: new Date().toISOString() },
      },
    },
  });
  await logSubscriptionEvent({
    tenantId: subscription.tenantId,
    subscriptionId,
    eventType: 'SUBSCRIPTION_PLAN_CHANGE_SCHEDULED',
    payload: { fromPlanId: subscription.planId, toPlanId: newPlanId, effectiveAt: subscription.currentPeriodEnd },
  });
  return updated;
}

async function suspend({ subscriptionId, reason, actorId }) {
  const subscription = await getSubscriptionById(subscriptionId);
  if (!['ACTIVE', 'PAST_DUE'].includes(subscription.status)) {
    throw new AppError('Seul un abonnement ACTIVE ou PAST_DUE peut être suspendu', 409, 'SUBSCRIPTION_INVALID_TRANSITION');
  }

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: 'SUSPENDED', suspendedAt: new Date() },
  });

  await logSubscriptionEvent({
    tenantId: subscription.tenantId,
    subscriptionId,
    eventType: 'SUBSCRIPTION_SUSPENDED',
    payload: { reason, actorId },
  });

  return updated;
}

async function resume(subscriptionId) {
  const subscription = await getSubscriptionById(subscriptionId);
  if (subscription.status !== 'SUSPENDED') {
    throw new AppError('Seul un abonnement SUSPENDED peut être repris', 409, 'SUBSCRIPTION_INVALID_TRANSITION');
  }

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: 'ACTIVE', suspendedAt: null },
  });

  await logSubscriptionEvent({
    tenantId: subscription.tenantId,
    subscriptionId,
    eventType: 'SUBSCRIPTION_RESUMED',
    payload: {},
  });

  return updated;
}

async function cancel({ subscriptionId, cancelledBy, reason, atPeriodEnd = true }) {
  const subscription = await getSubscriptionById(subscriptionId);
  if (['CANCELLED', 'EXPIRED'].includes(subscription.status)) {
    throw new AppError('Abonnement déjà terminé', 409, 'SUBSCRIPTION_ALREADY_TERMINATED');
  }

  if (atPeriodEnd) {
    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { autoRenew: false, cancellationReason: reason, cancelledBy },
    });
    await logSubscriptionEvent({
      tenantId: subscription.tenantId,
      subscriptionId,
      eventType: 'SUBSCRIPTION_CANCEL_SCHEDULED',
      payload: { effectiveAt: subscription.currentPeriodEnd, reason, cancelledBy },
    });
    return updated;
  }

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy, cancellationReason: reason, autoRenew: false },
  });
  await logSubscriptionEvent({
    tenantId: subscription.tenantId,
    subscriptionId,
    eventType: 'SUBSCRIPTION_CANCELLED_IMMEDIATE',
    payload: { reason, cancelledBy },
  });
  return updated;
}

async function renew(subscriptionId) {
  const subscription = await getSubscriptionById(subscriptionId);
  if (subscription.status !== 'ACTIVE') {
    throw new AppError('Seul un abonnement ACTIVE peut être renouvelé', 409, 'SUBSCRIPTION_INVALID_TRANSITION');
  }
  if (!subscription.autoRenew) {
    return expire(subscriptionId);
  }

  const pendingChange = subscription.metadata?.pendingPlanChange;
  const nextPlanId = pendingChange ? pendingChange.newPlanId : subscription.planId;
  const nextPlan = await planService.getPlanById(nextPlanId);

  const now = new Date();
  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      planId: nextPlanId,
      currentPeriodStart: now,
      currentPeriodEnd: computePeriodEnd(now, nextPlan.billingInterval),
      metadata: { ...(subscription.metadata || {}), pendingPlanChange: null },
    },
  });

  await logSubscriptionEvent({
    tenantId: subscription.tenantId,
    subscriptionId,
    eventType: 'SUBSCRIPTION_RENEWED',
    payload: { planId: nextPlanId, planChangedAtRenewal: Boolean(pendingChange) },
  });

  return updated;
}

async function markPastDue(subscriptionId) {
  const subscription = await getSubscriptionById(subscriptionId);
  const updated = await prisma.subscription.update({ where: { id: subscriptionId }, data: { status: 'PAST_DUE' } });
  await logSubscriptionEvent({ tenantId: subscription.tenantId, subscriptionId, eventType: 'SUBSCRIPTION_PAST_DUE', payload: {} });
  return updated;
}

async function expire(subscriptionId) {
  const subscription = await getSubscriptionById(subscriptionId);
  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: 'EXPIRED', endsAt: new Date() },
  });
  await logSubscriptionEvent({ tenantId: subscription.tenantId, subscriptionId, eventType: 'SUBSCRIPTION_EXPIRED', payload: {} });
  return updated;
}
async function findActiveSubscriptionForTenant(tenantId, applicationCode) {
  return prisma.subscription.findFirst({
    where: {
      tenantId,
      status: { in: ['ACTIVE', 'TRIAL', 'PAST_DUE', 'SUSPENDED'] },
      ...(applicationCode ? { applicationCode } : {}),
    },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });
}
module.exports = {
  getSubscriptionById,
  listSubscriptionsForTenant,
  subscribe,
  activateFromTrial,
  changePlan,
  suspend,
  resume,
  cancel,
  renew,
  markPastDue,
  expire,
  findActiveSubscriptionForTenant,
};