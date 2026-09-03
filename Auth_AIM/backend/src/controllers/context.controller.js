const contextService = require('../services/context.service');
const { success } = require('../utils/response');

async function resolve(req, res, next) {
  try {
    const context = await contextService.getContext({
      subjectType: 'USER',
      subjectId: req.auth.userId,
      sessionId: req.auth.sessionId,
      requestedTenantId: req.body.requestedTenantId,
      resource: req.body.resource,
      action: req.body.action,
      source: req.body.source || 'API_REQUEST',
      traceId: req.body.traceId,
    });
    return success(res, { data: context, message: 'Contexte résolu' });
  } catch (err) {
    return next(err);
  }
}

async function switchTenant(req, res, next) {
  try {
    const context = await contextService.switchTenant({
      userId: req.auth.userId,
      sessionId: req.auth.sessionId,
      toTenantId: req.body.tenantId,
      traceId: req.body.traceId,
    });
    return success(res, { data: context, message: 'Tenant changé' });
  } catch (err) {
    return next(err);
  }
}

async function listActiveTenants(req, res, next) {
  try {
    const tenants = await contextService.getActiveTenantsForUser(req.auth.userId);
    return success(res, { data: tenants });
  } catch (err) {
    return next(err);
  }
}

async function invalidate(req, res, next) {
  try {
    const record = await contextService.invalidateContext({
      subjectType: req.body.subjectType || 'USER',
      subjectId: req.body.subjectId,
      tenantId: req.body.tenantId,
      reason: req.body.reason,
      sourceEventType: req.body.sourceEventType,
      sourceEventId: req.body.sourceEventId,
    });
    return success(res, { data: record, statusCode: 201 });
  } catch (err) {
    return next(err);
  }
}

module.exports = { resolve, switchTenant, listActiveTenants, invalidate };