const { success } = require('../utils/response');
const adminMonitoringDiagnosticsService = require('../services/adminMonitoringDiagnostics.service');

async function getGlobalHealth(req, res, next) {
  try {
    const tenantId = req.query.tenantId || req.iamContext?.tenant?.tenantId || req.auth?.tenantId || 'global';
    const data = adminMonitoringDiagnosticsService.getGlobalHealth({ tenantId });
    return success(res, { data, message: 'Vue globale de santé de la plateforme', statusCode: 200 });
  } catch (err) {
    return next(err);
  }
}

async function getServiceHealth(req, res, next) {
  try {
    const tenantId = req.query.tenantId || req.iamContext?.tenant?.tenantId || req.auth?.tenantId || 'global';
    const data = adminMonitoringDiagnosticsService.getServiceHealth({ tenantId });
    return success(res, { data, message: 'Santé détaillée par service', statusCode: 200 });
  } catch (err) {
    return next(err);
  }
}

async function getCriticalErrors(req, res, next) {
  try {
    const tenantId = req.query.tenantId || req.iamContext?.tenant?.tenantId || req.auth?.tenantId || 'global';
    const data = adminMonitoringDiagnosticsService.getCriticalErrors({ tenantId });
    return success(res, { data, message: 'Erreurs critiques', statusCode: 200 });
  } catch (err) {
    return next(err);
  }
}

async function getLatencyOverview(req, res, next) {
  try {
    const tenantId = req.query.tenantId || req.iamContext?.tenant?.tenantId || req.auth?.tenantId || 'global';
    const data = adminMonitoringDiagnosticsService.getLatencyOverview({ tenantId });
    return success(res, { data, message: 'Vue de latence', statusCode: 200 });
  } catch (err) {
    return next(err);
  }
}

async function getDegradedDependencies(req, res, next) {
  try {
    const tenantId = req.query.tenantId || req.iamContext?.tenant?.tenantId || req.auth?.tenantId || 'global';
    const data = adminMonitoringDiagnosticsService.getDegradedDependencies({ tenantId });
    return success(res, { data, message: 'Dépendances dégradées', statusCode: 200 });
  } catch (err) {
    return next(err);
  }
}

async function getRecentIncidents(req, res, next) {
  try {
    const tenantId = req.query.tenantId || req.iamContext?.tenant?.tenantId || req.auth?.tenantId || 'global';
    const data = adminMonitoringDiagnosticsService.getRecentIncidents({ tenantId });
    return success(res, { data, message: 'Incidents récents', statusCode: 200 });
  } catch (err) {
    return next(err);
  }
}

async function getTraceDiagnostics(req, res, next) {
  try {
    const tenantId = req.query.tenantId || req.iamContext?.tenant?.tenantId || req.auth?.tenantId || 'global';
    const data = adminMonitoringDiagnosticsService.getTraceDiagnostics({
      tenantId,
      traceId: req.query.traceId || req.params.traceId || 'obs-trace-001',
    });
    return success(res, { data, message: 'Diagnostics par traceId', statusCode: 200 });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getGlobalHealth,
  getServiceHealth,
  getCriticalErrors,
  getLatencyOverview,
  getDegradedDependencies,
  getRecentIncidents,
  getTraceDiagnostics,
};
