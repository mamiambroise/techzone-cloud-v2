const { verifyAccessToken } = require('../utils/jwt');
const { AppError } = require('../utils/response');
const sessionService = require('../services/session.service');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.iam_access_token;
    if (!token) {
      throw new AppError('Token manquant', 401, 'UNAUTHENTICATED');
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      throw new AppError('Token invalide ou expiré', 401, 'UNAUTHENTICATED');
    }

    const session = await sessionService.getSessionById(decoded.sessionId);
    await sessionService.assertSessionUsable(session);
    await sessionService.touchSession(session.id);

    req.auth = {
      userId: decoded.userId,
      sessionId: decoded.sessionId,
      tenantId: decoded.tenantId,
      organizationId: decoded.organizationId,
      authenticationLevel: decoded.authenticationLevel,
    };

    return next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    return next(new AppError('Non authentifié', 401, 'UNAUTHENTICATED'));
  }
}

module.exports = { authenticate };