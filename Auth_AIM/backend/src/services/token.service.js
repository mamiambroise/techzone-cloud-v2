const crypto = require('crypto');
const { prisma } = require('../config/database');
const { AppError } = require('../utils/response');
const { hashToken } = require('../utils/password');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt');

async function logSecurityEvent({ type, severity, userId, sessionId, deviceId, riskLevel, metadata }) {
  await prisma.securityEvent.create({
    data: { type, severity, userId, sessionId, deviceId, riskLevel, metadata },
  });
}

function buildAccessPayload(session) {
  return {
    userId: session.userId,
    sessionId: session.id,
    tenantId: session.tenantId,
    organizationId: session.organizationId,
    authenticationLevel: session.authenticationLevel,
  };
}

async function issueTokenPair(session) {
  const accessToken = signAccessToken(buildAccessPayload(session));

  const familyId = crypto.randomUUID();
  const refreshJwt = signRefreshToken({ sessionId: session.id, familyId });
  const tokenHash = hashToken(refreshJwt);

  const decoded = require('jsonwebtoken').decode(refreshJwt);
  const expiresAt = new Date(decoded.exp * 1000);

  await prisma.refreshToken.create({
    data: { sessionId: session.id, tokenHash, familyId, status: 'ACTIVE', expiresAt },
  });

  return { accessToken, refreshToken: refreshJwt };
}

async function rotateRefreshToken(rawRefreshToken) {
  let decoded;
  try {
    decoded = verifyRefreshToken(rawRefreshToken);
  } catch (err) {
    throw new AppError('Refresh token invalide ou expiré', 401, 'REFRESH_TOKEN_INVALID');
  }

  const tokenHash = hashToken(rawRefreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored) {
    throw new AppError('Refresh token inconnu', 401, 'REFRESH_TOKEN_UNKNOWN');
  }

  if (stored.status === 'REUSED' || stored.status === 'REVOKED' || stored.status === 'ROTATED') {
    await revokeTokenFamily({
      familyId: stored.familyId,
      revokedBy: 'SYSTEM',
      revokeReason: 'TOKEN_REUSE_DETECTED',
    });
    await logSecurityEvent({
      type: 'REFRESH_TOKEN_REUSE',
      severity: 'CRITICAL',
      sessionId: stored.sessionId,
      riskLevel: 'CRITICAL',
      metadata: { familyId: stored.familyId },
    });
    throw new AppError('Réutilisation de refresh token détectée — session révoquée', 401, 'TOKEN_REUSE_DETECTED');
  }

  if (stored.status === 'EXPIRED' || stored.expiresAt < new Date()) {
    throw new AppError('Refresh token expiré', 401, 'REFRESH_TOKEN_EXPIRED');
  }

  const session = await prisma.session.findUnique({ where: { id: stored.sessionId } });
  if (!session || session.status !== 'ACTIVE') {
    throw new AppError('Session associée invalide', 401, 'SESSION_INVALID');
  }

  const newAccessToken = signAccessToken(buildAccessPayload(session));
  const newRefreshJwt = signRefreshToken({ sessionId: session.id, familyId: stored.familyId });
  const newTokenHash = hashToken(newRefreshJwt);
  const decodedNew = require('jsonwebtoken').decode(newRefreshJwt);
  const newExpiresAt = new Date(decodedNew.exp * 1000);

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: stored.id },
      data: { status: 'ROTATED', rotatedAt: new Date() },
    }),
    prisma.refreshToken.create({
      data: {
        sessionId: session.id,
        tokenHash: newTokenHash,
        familyId: stored.familyId,
        status: 'ACTIVE',
        expiresAt: newExpiresAt,
      },
    }),
  ]);

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { replacedByTokenId: newTokenHash },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshJwt };
}

async function revokeTokenFamily({ familyId, revokedBy, revokeReason }) {
  return prisma.refreshToken.updateMany({
    where: { familyId, status: { in: ['ACTIVE', 'ROTATED'] } },
    data: { status: 'REVOKED', revokedAt: new Date(), revokeReason },
  });
}

async function revokeTokensForSession({ sessionId, revokeReason }) {
  return prisma.refreshToken.updateMany({
    where: { sessionId, status: { in: ['ACTIVE', 'ROTATED'] } },
    data: { status: 'REVOKED', revokedAt: new Date(), revokeReason },
  });
}
async function issueAccessTokenOnly(session) {
  return signAccessToken(buildAccessPayload(session));
}

module.exports = {
  issueTokenPair,
  rotateRefreshToken,
  revokeTokenFamily,
  revokeTokensForSession,
  issueAccessTokenOnly,
};