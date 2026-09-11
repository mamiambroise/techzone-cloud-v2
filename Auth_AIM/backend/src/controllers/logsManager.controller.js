const { success } = require('../utils/response');
const logsManagerService = require('../services/logsManager.service');

async function search(req, res, next) {
  try {
    const filters = {
      period: req.query.period ? JSON.parse(req.query.period) : undefined,
      level: req.query.level,
      service: req.query.service,
      component: req.query.component,
      environment: req.query.environment,
      tenantId: req.query.tenantId || req.auth?.tenantId,
      errorCode: req.query.errorCode,
      traceId: req.query.traceId,
    };

    const data = logsManagerService.searchLogs(filters);
    return success(res, { data, message: 'Recherche de logs', statusCode: 200 });
  } catch (err) {
    return next(err);
  }
}

module.exports = { search };
