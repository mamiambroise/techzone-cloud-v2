const adminGovernanceService = require('../services/adminGovernance.service');
const { success } = require('../utils/response');

async function listRoles(req, res, next) {
  try {
    const roles = await adminGovernanceService.listRoles({ tenantId: req.query.tenantId || req.iamContext?.tenant?.tenantId || null });
    return success(res, { data: roles, message: 'Rôles récupérés' });
  } catch (err) {
    return next(err);
  }
}

async function listPermissions(req, res, next) {
  try {
    const permissions = await adminGovernanceService.listPermissions({ tenantId: req.query.tenantId || req.iamContext?.tenant?.tenantId || null });
    return success(res, { data: permissions, message: 'Permissions récupérées' });
  } catch (err) {
    return next(err);
  }
}

async function listAssignments(req, res, next) {
  try {
    const assignments = await adminGovernanceService.listAssignments({ tenantId: req.query.tenantId || req.iamContext?.tenant?.tenantId || null });
    return success(res, { data: assignments, message: 'Affectations récupérées' });
  } catch (err) {
    return next(err);
  }
}

async function getAccessReview(req, res, next) {
  try {
    const review = await adminGovernanceService.getAccessReview({ tenantId: req.query.tenantId || req.iamContext?.tenant?.tenantId || null });
    return success(res, { data: review, message: 'Revue d’accès calculée' });
  } catch (err) {
    return next(err);
  }
}

async function getCriticalRoles(req, res, next) {
  try {
    const roles = await adminGovernanceService.getCriticalRoles({ tenantId: req.query.tenantId || req.iamContext?.tenant?.tenantId || null });
    return success(res, { data: roles, message: 'Rôles critiques récupérés' });
  } catch (err) {
    return next(err);
  }
}

async function getHistory(req, res, next) {
  try {
    const history = await adminGovernanceService.getHistory({ tenantId: req.query.tenantId || req.iamContext?.tenant?.tenantId || null });
    return success(res, { data: history, message: 'Historique de gouvernance récupéré' });
  } catch (err) {
    return next(err);
  }
}

async function revokeAssignment(req, res, next) {
  try {
    const result = await adminGovernanceService.revokeAssignment({
      assignmentId: req.params.id,
      actorId: req.auth.userId,
      reason: req.body?.reason || 'ADMIN_GOVERNANCE_REVOKE',
    });
    return success(res, { data: result, message: 'Affectation révoquée' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listRoles,
  listPermissions,
  listAssignments,
  getAccessReview,
  getCriticalRoles,
  getHistory,
  revokeAssignment,
};
