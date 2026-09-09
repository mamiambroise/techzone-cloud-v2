const subscriptionService = require('../services/subscription.service');
const { success } = require('../utils/response');

async function subscribe(req, res, next) {
  try {
    const subscription = await subscriptionService.subscribe(req.body);
    return success(res, { data: subscription, statusCode: 201, message: 'Abonnement créé' });
  } catch (err) {
    return next(err);
  }
}

async function list(req, res, next) {
  try {
    const subscriptions = await subscriptionService.listSubscriptionsForTenant(req.query.tenantId, { status: req.query.status });
    return success(res, { data: subscriptions });
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const subscription = await subscriptionService.getSubscriptionById(req.params.id);
    return success(res, { data: subscription });
  } catch (err) {
    return next(err);
  }
}

async function activate(req, res, next) {
  try {
    const subscription = await subscriptionService.activateFromTrial(req.params.id);
    return success(res, { data: subscription, message: 'Abonnement activé' });
  } catch (err) {
    return next(err);
  }
}

async function changePlan(req, res, next) {
  try {
    const subscription = await subscriptionService.changePlan({
      subscriptionId: req.params.id,
      newPlanId: req.body.newPlanId,
      policy: req.body.policy,
      actorId: req.auth.userId,
    });
    return success(res, { data: subscription, message: 'Changement de plan traité' });
  } catch (err) {
    return next(err);
  }
}

async function suspend(req, res, next) {
  try {
    const subscription = await subscriptionService.suspend({
      subscriptionId: req.params.id,
      reason: req.body.reason,
      actorId: req.auth.userId,
    });
    return success(res, { data: subscription, message: 'Abonnement suspendu' });
  } catch (err) {
    return next(err);
  }
}

async function resume(req, res, next) {
  try {
    const subscription = await subscriptionService.resume(req.params.id);
    return success(res, { data: subscription, message: 'Abonnement repris' });
  } catch (err) {
    return next(err);
  }
}

async function cancel(req, res, next) {
  try {
    const subscription = await subscriptionService.cancel({
      subscriptionId: req.params.id,
      cancelledBy: req.auth.userId,
      reason: req.body.reason,
      atPeriodEnd: req.body.atPeriodEnd,
    });
    return success(res, { data: subscription, message: 'Annulation traitée' });
  } catch (err) {
    return next(err);
  }
}

async function renew(req, res, next) {
  try {
    const subscription = await subscriptionService.renew(req.params.id);
    return success(res, { data: subscription, message: 'Abonnement renouvelé' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { subscribe, list, getById, activate, changePlan, suspend, resume, cancel, renew };