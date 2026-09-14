const planService = require('../services/plan.service');
const { success } = require('../utils/response');

async function create(req, res, next) {
  try {
    const plan = await planService.createPlan(req.body);
    return success(res, { data: plan, statusCode: 201, message: 'Plan créé' });
  } catch (err) {
    return next(err);
  }
}

async function list(req, res, next) {
  try {
    const plans = await planService.listPlans({ status: req.query.status });
    return success(res, { data: plans });
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const plan = await planService.getPlanById(req.params.id);
    return success(res, { data: plan });
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const plan = await planService.updatePlan(req.params.id, req.body);
    return success(res, { data: plan, message: 'Plan mis à jour' });
  } catch (err) {
    return next(err);
  }
}

async function activate(req, res, next) {
  try {
    const plan = await planService.activatePlan(req.params.id);
    return success(res, { data: plan, message: 'Plan activé' });
  } catch (err) {
    return next(err);
  }
}

async function deprecate(req, res, next) {
  try {
    const plan = await planService.deprecatePlan(req.params.id);
    return success(res, { data: plan, message: 'Plan désactivé' });
  } catch (err) {
    return next(err);
  }
}

async function archive(req, res, next) {
  try {
    const plan = await planService.archivePlan(req.params.id);
    return success(res, { data: plan, message: 'Plan archivé' });
  } catch (err) {
    return next(err);
  }
}

async function newVersion(req, res, next) {
  try {
    const plan = await planService.createNewPlanVersion(req.params.id, req.body);
    return success(res, { data: plan, statusCode: 201, message: 'Nouvelle version du plan créée' });
  } catch (err) {
    return next(err);
  }
}

async function addEntitlement(req, res, next) {
  try {
    const entitlement = await planService.addEntitlement({ planId: req.params.id, ...req.body });
    return success(res, { data: entitlement, statusCode: 201 });
  } catch (err) {
    return next(err);
  }
}

async function removeEntitlement(req, res, next) {
  try {
    await planService.removeEntitlement(req.params.entitlementId);
    return success(res, { message: 'Entitlement retirée' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { create, list, getById, update, activate, deprecate, archive, newVersion, addEntitlement, removeEntitlement };