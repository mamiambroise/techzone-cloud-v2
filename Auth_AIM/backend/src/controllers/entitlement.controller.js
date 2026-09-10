const entitlementService = require('../services/entitlement.service');
const quotaService = require('../services/quota.service');
const { success } = require('../utils/response');

async function list(req, res, next) {
  try {
    const entitlements = await entitlementService.listEffectiveEntitlements(req.params.subscriptionId);
    return success(res, { data: entitlements });
  } catch (err) {
    return next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const entitlement = await entitlementService.getEffectiveEntitlement({
      subscriptionId: req.params.subscriptionId,
      featureCode: req.params.featureCode,
    });
    return success(res, { data: entitlement });
  } catch (err) {
    return next(err);
  }
}

async function createOverride(req, res, next) {
  try {
    const override = await entitlementService.createOverride({
      subscriptionId: req.params.subscriptionId,
      featureCode: req.params.featureCode,
      ...req.body,
      createdBy: req.auth.userId,
    });
    return success(res, { data: override, statusCode: 201, message: 'Override enregistré' });
  } catch (err) {
    return next(err);
  }
}

async function removeOverride(req, res, next) {
  try {
    await entitlementService.removeOverride({ subscriptionId: req.params.subscriptionId, featureCode: req.params.featureCode });
    return success(res, { message: 'Override retiré' });
  } catch (err) {
    return next(err);
  }
}

async function getQuota(req, res, next) {
  try {
    const status = await quotaService.getQuotaStatus({ subscriptionId: req.params.subscriptionId, featureCode: req.params.featureCode });
    return success(res, { data: status });
  } catch (err) {
    return next(err);
  }
}

async function consumeQuota(req, res, next) {
  try {
    const result = await quotaService.consumeQuota({
      subscriptionId: req.params.subscriptionId,
      featureCode: req.params.featureCode,
      amount: req.body.amount,
    });
    return success(res, { data: result });
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, getOne, createOverride, removeOverride, getQuota, consumeQuota };