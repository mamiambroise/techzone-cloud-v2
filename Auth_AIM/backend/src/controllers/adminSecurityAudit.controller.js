const adminSecurityAuditService = require('../services/adminSecurityAudit.service');
const { success } = require('../utils/response');

async function listSecurityEvents(req, res, next) {
  try {
    const data = await adminSecurityAuditService.listSecurityEvents({
      severity: req.query.severity,
      type: req.query.type,
      tenantId: req.query.tenantId || req.iamContext?.tenant?.tenantId || req.auth?.tenantId,
      userId: req.query.userId,
      status: req.query.status,
      traceId: req.query.traceId,
      source: req.query.source,
      from: req.query.from,
      to: req.query.to,
    });
    return success(res, { data, message: 'Événements de sécurité récupérés' });
  } catch (err) {
    return next(err);
  }
}

async function getSecurityEventById(req, res, next) {
  try {
    const data = await adminSecurityAuditService.getSecurityEventById(req.params.id, {
      tenantId: req.query.tenantId || req.iamContext?.tenant?.tenantId || req.auth?.tenantId,
    });
    return success(res, { data, message: 'Événement de sécurité récupéré' });
  } catch (err) {
    return next(err);
  }
}

async function getCorrelation(req, res, next) {
  try {
    const data = await adminSecurityAuditService.getSecurityEventCorrelation({
      tenantId: req.query.tenantId || req.iamContext?.tenant?.tenantId || req.auth?.tenantId,
      userId: req.query.userId,
      sessionId: req.query.sessionId,
      traceId: req.query.traceId,
      ipSafe: req.query.ipSafe,
      limit: Number(req.query.limit || 10),
    });
    return success(res, { data, message: 'Corrélation sécurité' });
  } catch (err) {
    return next(err);
  }
}

async function getSummary(req, res, next) {
  try {
    const data = await adminSecurityAuditService.getSecurityEventSummary({
      tenantId: req.query.tenantId || req.iamContext?.tenant?.tenantId || req.auth?.tenantId,
    });
    return success(res, { data, message: 'Synthèse de sécurité' });
  } catch (err) {
    return next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const data = await adminSecurityAuditService.setSecurityEventStatus({
      id: req.params.id,
      status: req.body.status,
      actorId: req.auth.userId,
      reason: req.body.reason,
      tenantId: req.query.tenantId || req.iamContext?.tenant?.tenantId || req.auth?.tenantId,
    });
    return success(res, { data, message: 'Statut de sécurité mis à jour' });
  } catch (err) {
    return next(err);
  }
}

async function searchAudit(req, res, next) {
  try {
    const data = adminSecurityAuditService.searchAudit({
      actorType: req.query.actorType,
      actorId: req.query.actorId,
      tenantId: req.query.tenantId || req.iamContext?.tenant?.tenantId || req.auth?.tenantId,
      applicationId: req.query.applicationId,
      action: req.query.action,
      resourceType: req.query.resourceType,
      resourceId: req.query.resourceId,
      result: req.query.result,
      traceId: req.query.traceId,
      from: req.query.from,
      to: req.query.to,
    });
    return success(res, { data, message: 'Recherche d’audit' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listSecurityEvents,
  getSecurityEventById,
  getCorrelation,
  getSummary,
  updateStatus,
  searchAudit,
};
