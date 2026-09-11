const { success } = require('../utils/response');
const observabilityService = require('../services/observability.service');

async function dashboard(req, res, next) {
  try {
    const tenantId = req.auth?.tenantId || req.query?.tenantId || req.body?.tenantId || 'global';
    const data = observabilityService.getDashboard({ tenantId });
    return success(res, { data, message: 'Dashboard observabilité', statusCode: 200 });
  } catch (err) {
    return next(err);
  }
}

async function health(req, res, next) {
  try {
    const tenantId = req.auth?.tenantId || req.query?.tenantId || req.body?.tenantId || 'global';
    const data = observabilityService.getHealth({ tenantId });
    return success(res, { data, message: 'Santé des services', statusCode: 200 });
  } catch (err) {
    return next(err);
  }
}

async function activity(req, res, next) {
  try {
    const tenantId = req.auth?.tenantId || req.query?.tenantId || req.body?.tenantId || 'global';
    const data = observabilityService.getActivity({ tenantId });
    return success(res, { data, message: 'Activité récente', statusCode: 200 });
  } catch (err) {
    return next(err);
  }
}

async function attention(req, res, next) {
  try {
    const tenantId = req.auth?.tenantId || req.query?.tenantId || req.body?.tenantId || 'global';
    const data = observabilityService.getAttention({ tenantId });
    return success(res, { data, message: 'Alertes et événements d’attention', statusCode: 200 });
  } catch (err) {
    return next(err);
  }
}

async function componentHealth(req, res, next) {
  try {
    const tenantId = req.auth?.tenantId || req.query?.tenantId || req.body?.tenantId || 'global';
    const data = observabilityService.getComponentHealth({ tenantId });
    return success(res, { data, message: 'Santé des composants', statusCode: 200 });
  } catch (err) {
    return next(err);
  }
}

async function metrics(req, res, next) {
  try {
    const tenantId = req.auth?.tenantId || req.query?.tenantId || req.body?.tenantId || 'global';
    const data = observabilityService.getServiceMetrics({ tenantId });
    return success(res, { data, message: 'Métriques de service', statusCode: 200 });
  } catch (err) {
    return next(err);
  }
}

module.exports = { dashboard, health, activity, attention, componentHealth, metrics };
