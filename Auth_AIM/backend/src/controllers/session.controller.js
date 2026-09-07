const sessionService = require('../services/session.service');
const deviceService = require('../services/device.service');
const { success } = require('../utils/response');
const { verifyAccessToken } = require('../utils/jwt');
async function listAllSessions(req, res, next) {
  try {
    const sessions = await sessionService.listSessions({ userId: req.query.userId, status: req.query.status });
    return success(res, { data: sessions });
  } catch (err) {
    return next(err);
  }
}

async function getSessionById(req, res, next) {
  try {
    const session = await sessionService.getSessionById(req.params.id);
    return success(res, { data: session });
  } catch (err) {
    return next(err);
  }
}

async function revokeSessionById(req, res, next) {
  try {
    const session = await sessionService.revokeSession({
      sessionId: req.params.id,
      revokedBy: req.auth.userId,
      revokeReason: req.body.reason || 'ADMIN_REVOKE',
    });
    return success(res, { data: session, message: 'Session révoquée' });
  } catch (err) {
    return next(err);
  }
}

async function revokeAllForUser(req, res, next) {
  try {
    await sessionService.revokeAllUserSessions({
      userId: req.params.id,
      revokedBy: req.auth.userId,
      revokeReason: req.body.reason || 'ADMIN_REVOKE_ALL',
    });
    return success(res, { message: 'Sessions révoquées' });
  } catch (err) {
    return next(err);
  }
}

async function revokeByDevice(req, res, next) {
  try {
    await sessionService.revokeSessionsByDevice({
      deviceId: req.params.id,
      revokedBy: req.auth.userId,
      revokeReason: req.body.reason || 'DEVICE_REVOKE',
    });
    return success(res, { message: 'Sessions de l\'appareil révoquées' });
  } catch (err) {
    return next(err);
  }
}

async function listMySessions(req, res, next) {
  try {
    const sessions = await sessionService.listUserSessions(req.auth.userId);
    return success(res, { data: sessions });
  } catch (err) {
    return next(err);
  }
}

async function revokeMySession(req, res, next) {
  try {
    const session = await sessionService.getSessionById(req.params.id);
    if (session.userId !== req.auth.userId) {
      return next({ statusCode: 403, code: 'FORBIDDEN', message: 'Session non autorisée' });
    }
    await sessionService.revokeSession({
      sessionId: req.params.id,
      revokedBy: req.auth.userId,
      revokeReason: 'USER_REVOKE',
    });
    return success(res, { message: 'Session révoquée' });
  } catch (err) {
    return next(err);
  }
}

async function revokeMyOtherSessions(req, res, next) {
  try {
    await sessionService.revokeAllUserSessions({
      userId: req.auth.userId,
      exceptSessionId: req.auth.sessionId,
      revokedBy: req.auth.userId,
      revokeReason: 'USER_REVOKE_OTHERS',
    });
    return success(res, { message: 'Autres sessions révoquées' });
  } catch (err) {
    return next(err);
  }
}

async function listMyDevices(req, res, next) {
  try {
    const devices = await deviceService.getUserDevices(req.auth.userId);
    return success(res, { data: devices });
  } catch (err) {
    return next(err);
  }
}

async function getDeviceById(req, res, next) {
  try {
    const device = await deviceService.getDeviceById(req.params.id, req.auth.userId);
    return success(res, { data: device });
  } catch (err) {
    return next(err);
  }
}

async function trustDevice(req, res, next) {
  try {
    const device = await deviceService.trustDevice({
      deviceId: req.params.id,
      userId: req.auth.userId,
      trustedBy: req.auth.userId,
    });
    return success(res, { data: device, message: 'Appareil approuvé' });
  } catch (err) {
    return next(err);
  }
}

async function untrustDevice(req, res, next) {
  try {
    const device = await deviceService.untrustDevice({ deviceId: req.params.id, userId: req.auth.userId });
    return success(res, { data: device, message: 'Confiance retirée' });
  } catch (err) {
    return next(err);
  }
}

async function blockDevice(req, res, next) {
  try {
    const device = await deviceService.revokeDevice({
      deviceId: req.params.id,
      userId: req.auth.userId,
      revokedBy: req.auth.userId,
      revokeReason: req.body.reason || 'USER_BLOCKED',
    });
    await sessionService.revokeSessionsByDevice({
      deviceId: req.params.id,
      revokedBy: req.auth.userId,
      revokeReason: 'DEVICE_BLOCKED',
    });
    return success(res, { data: device, message: 'Appareil bloqué' });
  } catch (err) {
    return next(err);
  }
}

async function recalculateRisk(req, res, next) {
  try {
    const result = await sessionService.recalculateSessionRisk(req.params.id);
    return success(res, { data: result, message: 'Risque recalculé' });
  } catch (err) {
    return next(err);
  }
}

async function validateSession(req, res, next) {
  try {
    const decoded = verifyAccessToken(req.body.accessToken);
    const result = await sessionService.validateSessionToken(decoded.sessionId);
    return success(res, {
      data: { ...result, userId: decoded.userId, tenantId: decoded.tenantId },
    });
  } catch (err) {
    return success(res, { data: { valid: false, reason: 'TOKEN_INVALID' } });
  }
}

module.exports = {
  listAllSessions,
  getSessionById,
  revokeSessionById,
  revokeAllForUser,
  revokeByDevice,
  listMySessions,
  revokeMySession,
  revokeMyOtherSessions,
  listMyDevices,
  getDeviceById,
  trustDevice,
  untrustDevice,
  blockDevice,
  recalculateRisk,
  validateSession,
  
};