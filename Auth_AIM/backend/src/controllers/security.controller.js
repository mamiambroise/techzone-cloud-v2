const securityService = require('../services/security.service');
const { success } = require('../utils/response');

async function listAlerts(req, res, next) {
  try {
    const events = await securityService.listSecurityEvents({
      severity: req.query.severity,
      type: req.query.type,
      tenantId: req.query.tenantId,
      userId: req.query.userId,
    });
    return success(res, { data: events });
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

module.exports = { listAlerts, acknowledge, resolve };