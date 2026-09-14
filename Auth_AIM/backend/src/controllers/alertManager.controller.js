const { success } = require('../utils/response');
const alertManagerService = require('../services/alertManager.service');

async function list(req, res, next) {
  try {
    const tenantId = req.query.tenantId || req.iamContext?.tenant?.tenantId || req.auth?.tenantId;
    const filters = {
      tenantId,
      status: req.query.status,
      severity: req.query.severity,
      sourceType: req.query.sourceType,
      code: req.query.code,
    };

    const alerts = alertManagerService.listAlerts(filters);
    return success(res, { data: alerts, message: 'Liste des alertes', statusCode: 200 });
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const alert = await alertManagerService.createAlert({
      code: req.body.code,
      sourceType: req.body.sourceType,
      condition: req.body.condition,
      severity: req.body.severity,
      tenantId: req.body.tenantId || req.auth?.tenantId,
      traceId: req.body.traceId,
      scope: req.body.scope,
      sourceRef: req.body.sourceRef,
      details: req.body.details,
      metadata: req.body.metadata,
      status: req.body.status,
    });

    return success(res, { data: alert, message: 'Alerte créée', statusCode: 201 });
  } catch (err) {
    return next(err);
  }
}

async function summary(req, res, next) {
  try {
    const tenantId = req.query.tenantId || req.iamContext?.tenant?.tenantId || req.auth?.tenantId;
    const summary = alertManagerService.getAlertSummary({ tenantId });
    return success(res, { data: summary, message: 'Synthèse des alertes', statusCode: 200 });
  } catch (err) {
    return next(err);
  }
}

async function acknowledge(req, res, next) {
  try {
    const alert = await alertManagerService.acknowledgeAlert({
      id: req.params.id,
      acknowledgedBy: req.auth?.userId,
    });

    return success(res, { data: alert, message: 'Alerte acquittée', statusCode: 200 });
  } catch (err) {
    return next(err);
  }
}

async function resolve(req, res, next) {
  try {
    const alert = await alertManagerService.resolveAlert({
      id: req.params.id,
      resolvedBy: req.auth?.userId,
      resolution: req.body?.resolution,
    });

    return success(res, { data: alert, message: 'Alerte résolue', statusCode: 200 });
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, create, summary, acknowledge, resolve };
