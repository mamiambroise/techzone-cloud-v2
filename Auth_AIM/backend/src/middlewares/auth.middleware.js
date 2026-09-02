const { verifyAccessToken } = require('../utils/jwt');
const { failure } = require('../utils/response');
const { prisma } = require('../config/database');

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return failure(res, { statusCode: 401, message: 'Token manquant' });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    const session = await prisma.session.findUnique({ where: { id: payload.sessionId } });
    if (!session || session.status !== 'ACTIVE') {
      return failure(res, { statusCode: 401, message: 'Session invalide ou expirée' });
    }

    req.user = { id: payload.sub, sessionId: payload.sessionId, tenantId: payload.tenantId };
    next();
  } catch (err) {
    return failure(res, { statusCode: 401, message: 'Token invalide' });
  }
}

module.exports = authMiddleware;