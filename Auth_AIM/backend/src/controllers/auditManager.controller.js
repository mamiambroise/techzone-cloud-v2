const { success } = require('../utils/response');
const auditManagerService = require('../services/auditManager.service');

async function search(req, res, next) {
  try {
    const filters = {
      actorType: req.query.actorType,
      actorId: req.query.actorId,
      tenantId: req.query.tenantId || req.auth?.tenantId,
      applicationId: req.query.applicationId,
      action: req.query.action,
      resourceType: req.query.resourceType,
      resourceId: req.query.resourceId,
      result: req.query.result,
      traceId: req.query.traceId,
      from: req.query.from,
      to: req.query.to,
    };

    const data = auditManagerService.searchAudit(filters);
    return success(res, { data, message: 'Recherche d’audit', statusCode: 200 });
  } catch (err) {
    return next(err);
  }
}

module.exports = { search };
