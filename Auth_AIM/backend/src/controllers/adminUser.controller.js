const adminUserService = require('../services/adminUser.service');
const { success } = require('../utils/response');

async function search(req, res, next) {
  try {
    const users = await adminUserService.searchUsers({ search: req.query.search, status: req.query.status });
    return success(res, { data: users });
  } catch (err) {
    return next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const user = await adminUserService.getUserProfile(req.params.id);
    return success(res, { data: user });
  } catch (err) {
    return next(err);
  }
}

async function getMemberships(req, res, next) {
  try {
    const memberships = await adminUserService.getUserMemberships(req.params.id);
    return success(res, { data: memberships });
  } catch (err) {
    return next(err);
  }
}

async function getSessions(req, res, next) {
  try {
    const sessions = await adminUserService.getUserSessions(req.params.id);
    return success(res, { data: sessions });
  } catch (err) {
    return next(err);
  }
}

async function changeStatus(req, res, next) {
  try {
    const user = await adminUserService.changeUserStatus({
      userId: req.params.id,
      status: req.body.status,
      actorId: req.auth.userId,
      reason: req.body.reason,
    });
    return success(res, { data: user, message: 'Statut utilisateur mis à jour' });
  } catch (err) {
    return next(err);
  }
}

async function revokeSessions(req, res, next) {
  try {
    const result = await adminUserService.forceRevokeSessions({
      userId: req.params.id,
      actorId: req.auth.userId,
      reason: req.body.reason,
    });
    return success(res, { data: result, message: 'Sessions révoquées' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { search, getProfile, getMemberships, getSessions, changeStatus, revokeSessions };