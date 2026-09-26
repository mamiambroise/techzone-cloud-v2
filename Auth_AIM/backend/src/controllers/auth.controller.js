const authService = require('../services/auth.service');
const { success } = require('../utils/response');
const { setAuthCookies, clearAuthCookies } = require('../utils/auth-cookies');

async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);
    return success(res, { data: user, message: 'Compte créé', statusCode: 201 });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login({
      ...req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return success(res, { data: setAuthCookies(res, result), message: result.mfaRequired ? 'MFA requis' : 'Connexion réussie' });
  } catch (err) {
    return next(err);
  }
}

async function verifyMfa(req, res, next) {
  try {
    const result = await authService.verifyMfaChallenge({
      ...req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return success(res, { data: setAuthCookies(res, result), message: 'Connexion réussie' });
  } catch (err) {
    return next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const tokens = await authService.refresh({ refreshToken: req.cookies?.iam_refresh_token || req.body?.refreshToken });
    return success(res, { data: setAuthCookies(res, tokens), message: 'Token rafraîchi' });
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res, next) {
  try {
    await authService.logout({ sessionId: req.auth.sessionId, actorId: req.auth.userId });
    clearAuthCookies(res);
    return success(res, { message: 'Déconnexion réussie' });
  } catch (err) {
    return next(err);
  }
}

async function logoutAll(req, res, next) {
  try {
    await authService.logoutAll({
      userId: req.auth.userId,
      exceptSessionId: req.body.keepCurrentSession ? req.auth.sessionId : null,
      actorId: req.auth.userId,
    });
    return success(res, { message: 'Toutes les sessions ont été déconnectées' });
  } catch (err) {
    return next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    await authService.changePassword({
      userId: req.auth.userId,
      currentSessionId: req.auth.sessionId,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });
    return success(res, { message: 'Mot de passe modifié' });
  } catch (err) {
    return next(err);
  }
}

async function stepUp(req, res, next) {
  try {
    const result = await authService.initiateStepUp({
      userId: req.auth.userId,
      sessionId: req.auth.sessionId,
      resource: req.body.resource,
      action: req.body.action,
    });
    return success(res, { data: setAuthCookies(res, result), message: 'Step-up requis' });
  } catch (err) {
    return next(err);
  }
}

async function stepUpVerify(req, res, next) {
  try {
    const result = await authService.verifyStepUp({ ...req.body, requestingSessionId: req.auth.sessionId });
    return success(res, { data: setAuthCookies(res, result), message: 'Session élevée' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, login, verifyMfa, refresh, logout, logoutAll, changePassword, stepUp, stepUpVerify };