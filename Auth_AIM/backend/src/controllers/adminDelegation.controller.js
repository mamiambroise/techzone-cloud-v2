const adminDelegationService = require('../services/adminDelegation.service');
const { success } = require('../utils/response');

async function listDelegations(req, res, next) {
  try {
    const delegations = await adminDelegationService.listDelegations({
      tenantId: req.query.tenantId || req.iamContext?.tenant?.tenantId || null,
      granteeUserId: req.query.grantedTo || req.query.userId || null,
    });
    return success(res, { data: delegations, message: 'Délégations récupérées' });
  } catch (err) {
    return next(err);
  }
}

async function getEffectiveDelegations(req, res, next) {
  try {
    const delegations = await adminDelegationService.getEffectiveDelegations({
      tenantId: req.query.tenantId || req.iamContext?.tenant?.tenantId || null,
      userId: req.query.userId || req.auth?.userId || null,
    });
    return success(res, { data: delegations, message: 'Délégations actives calculées' });
  } catch (err) {
    return next(err);
  }
}

async function createDelegation(req, res, next) {
  try {
    const delegation = await adminDelegationService.createDelegation({
      tenantId: req.body.tenantId || req.iamContext?.tenant?.tenantId || null,
      grantorUserId: req.body.grantedBy || req.auth.userId,
      granteeUserId: req.body.grantedTo || req.body.granteeUserId,
      scopeType: req.body.scopeType,
      scopeId: req.body.scopeId,
      permissions: req.body.permissions,
      validFrom: req.body.startsAt || req.body.validFrom,
      validUntil: req.body.endsAt || req.body.validUntil,
      reason: req.body.reason,
    });
    return success(res, { data: delegation, message: 'Délégation créée' });
  } catch (err) {
    return next(err);
  }
}

async function revokeDelegation(req, res, next) {
  try {
    const result = await adminDelegationService.revokeDelegation({
      delegationId: req.params.id,
      actorId: req.auth.userId,
      reason: req.body?.reason || 'ADMIN_DELEGATION_REVOKE',
    });
    return success(res, { data: result, message: 'Délégation révoquée' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listDelegations,
  getEffectiveDelegations,
  createDelegation,
  revokeDelegation,
};
