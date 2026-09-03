const identityService = require('../services/identity.service');
const { success } = require('../utils/response');

async function listUsers(req, res, next) {
  try {
    const users = await identityService.listUsers({ status: req.query.status, search: req.query.search });
    return success(res, { data: users });
  } catch (err) {
    return next(err);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = await identityService.getUserById(req.params.id, { includeIdentities: true });
    return success(res, { data: user });
  } catch (err) {
    return next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const user = await identityService.updateUser(req.params.id, req.body);
    return success(res, { data: user, message: 'Utilisateur mis à jour' });
  } catch (err) {
    return next(err);
  }
}

function makeStatusHandler(status, defaultReason) {
  return async function (req, res, next) {
    try {
      const user = await identityService.setUserStatus({
        userId: req.params.id,
        status,
        changedBy: req.auth.userId,
        reason: req.body.reason || defaultReason,
      });
      return success(res, { data: user, message: `Statut mis à jour: ${status}` });
    } catch (err) {
      return next(err);
    }
  };
}

async function getMe(req, res, next) {
  try {
    const user = await identityService.getUserById(req.auth.userId, { includeIdentities: true });
    return success(res, { data: user });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listUsers,
  getUserById,
  updateUser,
  activate: makeStatusHandler('ACTIVE', 'ADMIN_ACTIVATE'),
  suspend: makeStatusHandler('SUSPENDED', 'ADMIN_SUSPEND'),
  lock: makeStatusHandler('LOCKED', 'ADMIN_LOCK'),
  unlock: makeStatusHandler('ACTIVE', 'ADMIN_UNLOCK'),
  disable: makeStatusHandler('DISABLED', 'ADMIN_DISABLE'),
  archive: makeStatusHandler('ARCHIVED', 'ADMIN_ARCHIVE'),
  getMe,
};