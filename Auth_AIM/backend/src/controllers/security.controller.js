const securityService = require('../services/security.service');
const { success } = require('../utils/response');

async function listAlerts(req, res, next) {
  try {
    const events = await securityService.listSecurityEvents({
      severity: req.query.severity,
      type: req.query.type,
      tenantId: req.query.tenantId,
      userId: req.query.userId,
      status: req.query.status,
      traceId: req.query.traceId,
      source: req.query.source,
      from: req.query.from,
      to: req.query.to,
    });
    return success(res, { data: events });
  } catch (err) {
    return next(err);
  }
}

async function listEvents(req, res, next) {
  try {
    const events = await securityService.listSecurityEvents({
      severity: req.query.severity,
      type: req.query.type,
      tenantId: req.query.tenantId,
      userId: req.query.userId,
      status: req.query.status,
      traceId: req.query.traceId,
      source: req.query.source,
      from: req.query.from,
      to: req.query.to,
    });
    return success(res, { data: events });
  } catch (err) {
    return next(err);
  }
}

async function createEvent(req, res, next) {
  try {
    const event = await securityService.createSecurityEvent({
      eventType: req.body.eventType,
      severity: req.body.severity,
      tenantId: req.body.tenantId || req.auth.tenantId,
      userId: req.body.userId || req.auth.userId,
      identityId: req.body.identityId,
      organizationId: req.body.organizationId,
      siteId: req.body.siteId,
      sessionId: req.body.sessionId,
      deviceId: req.body.deviceId,
      source: req.body.source,
      resource: req.body.resource,
      ipSafe: req.body.ipSafe,
      traceId: req.body.traceId,
      status: req.body.status,
      detailsSafe: req.body.detailsSafe,
      metadata: req.body.metadata,
    });
    return success(res, { data: event, message: 'Événement de sécurité créé' });
  } catch (err) {
    return next(err);
  }
}

async function getCorrelation(req, res, next) {
  try {
    const correlation = await securityService.getSecurityEventCorrelation({
      tenantId: req.query.tenantId || req.auth.tenantId,
      userId: req.query.userId,
      sessionId: req.query.sessionId,
      traceId: req.query.traceId,
      ipSafe: req.query.ipSafe,
      limit: Number(req.query.limit || 10),
    });
    return success(res, { data: correlation, message: 'Corrélation sécurité' });
  } catch (err) {
    return next(err);
  }
}

async function getSummary(req, res, next) {
  try {
    const summary = await securityService.getSecurityEventSummary({
      tenantId: req.query.tenantId || req.auth.tenantId,
    });
    return success(res, { data: summary, message: 'Synthèse sécurité' });
  } catch (err) {
    return next(err);
  }
}

async function acknowledge(req, res, next) {
  try {
    const event = await securityService.acknowledgeSecurityEvent({ id: req.params.id, acknowledgedBy: req.auth.userId });
    return success(res, { data: event, message: 'Alerte acquittée' });
  } catch (err) {
    return next(err);
  }
}

async function resolve(req, res, next) {
  try {
    const event = await securityService.resolveSecurityEvent({
      id: req.params.id,
      resolvedBy: req.auth.userId,
      resolution: req.body.resolution,
    });
    return success(res, { data: event, message: 'Alerte résolue' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listAlerts, listEvents, createEvent, getCorrelation, getSummary, acknowledge, resolve };