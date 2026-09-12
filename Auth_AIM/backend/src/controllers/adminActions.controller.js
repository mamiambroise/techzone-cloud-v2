const { success } = require('../utils/response');
const adminActionsService = require('../services/adminActions.service');

async function listActions(req, res, next) {
  try {
    const data = await adminActionsService.listActions({
      tenantId: req.query.tenantId || req.iamContext?.tenant?.tenantId || req.auth?.tenantId,
      status: req.query.status,
      actorId: req.query.actorId,
      targetType: req.query.targetType,
      actionType: req.query.actionType,
    });
    return success(res, { data, message: 'Actions administratives récupérées', statusCode: 200 });
  } catch (err) {
    return next(err);
  }
}

async function requestAction(req, res, next) {
  try {
    const data = await adminActionsService.requestAction({
      actorId: req.auth.userId,
      tenantId: req.body.tenantId || req.iamContext?.tenant?.tenantId || req.auth?.tenantId,
      actionType: req.body.actionType,
      targetType: req.body.targetType,
      targetId: req.body.targetId,
      reason: req.body.reason,
      metadata: req.body.metadata || {},
      dryRun: Boolean(req.body.dryRun),
    });
    return success(res, { data, message: 'Action administrative demandée', statusCode: 201 });
  } catch (err) {
    return next(err);
  }
}

async function getActionById(req, res, next) {
  try {
    const data = await adminActionsService.getActionById(req.params.id);
    return success(res, { data, message: 'Action administrative récupérée', statusCode: 200 });
  } catch (err) {
    return next(err);
  }
}

async function executeAction(req, res, next) {
  try {
    const data = await adminActionsService.executeAction(req.params.id, {
      actorId: req.auth.userId,
      resultStatus: req.body.resultStatus || 'COMPLETED',
      failureReason: req.body.failureReason,
      metadata: req.body.metadata,
    });
    return success(res, { data, message: 'Action administrative exécutée', statusCode: 200 });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listActions, requestAction, getActionById, executeAction };
