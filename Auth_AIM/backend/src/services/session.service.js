const { prisma } = require('../config/database');
const { AppError } = require('../utils/response');
const { hashToken } = require('../utils/password');

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const ABSOLUTE_TIMEOUT_MS = 12 * 60 * 60 * 1000;

function computeExpirations(now = new Date()) {
  return {
    idleExpiresAt: new Date(now.getTime() + IDLE_TIMEOUT_MS),
    expiresAt: new Date(now.getTime() + ABSOLUTE_TIMEOUT_MS),
  };
}

async function createSession({
  userId,
  tenantId,
  organizationId,
  siteId,
  applicationId,
  environment,
  deviceId,
  ipAddress,
  userAgent,
  authenticationLevel,
  riskLevel = 'LOW',
}) {
  const now = new Date();
  const { idleExpiresAt, expiresAt } = computeExpirations(now);

  return prisma.session.create({
    data: {
      userId,
      tenantId,
      organizationId,
      siteId,
      applicationId,
      environment,
      deviceId,
      status: 'ACTIVE',
      authenticationLevel,
      riskLevel,
      ipHash: ipAddress ? hashToken(ipAddress) : null,
      userAgentHash: userAgent ? hashToken(userAgent) : null,
      lastActivityAt: now,
      idleExpiresAt,
      expiresAt,
    },
  });
}

async function getSessionById(sessionId) {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) {
    throw new AppError('Session introuvable', 404, 'SESSION_NOT_FOUND');
  }
  return session;
}

function isSessionAbsoluteExpired(session, now = new Date()) {
  return Boolean(session.expiresAt && session.expiresAt < now);
}

function isSessionIdleExpired(session, now = new Date()) {
  return Boolean(session.idleExpiresAt && session.idleExpiresAt < now);
}

async function assertSessionUsable(session, now = new Date()) {
  if (session.status === 'REVOKED') {
    throw new AppError('Session révoquée', 401, 'SESSION_REVOKED');
  }
  if (session.status === 'EXPIRED' || isSessionAbsoluteExpired(session, now)) {
    if (session.status !== 'EXPIRED') {
      await prisma.session.update({
        where: { id: session.id },
        data: { status: 'EXPIRED', statusChangedAt: now },
      });
    }
    throw new AppError('Session expirée', 401, 'SESSION_EXPIRED');
  }
  if (isSessionIdleExpired(session, now)) {
    await prisma.session.update({
      where: { id: session.id },
      data: { status: 'EXPIRED', statusChangedAt: now, revokeReason: 'IDLE_TIMEOUT' },
    });
    throw new AppError('Session expirée par inactivité', 401, 'SESSION_IDLE_EXPIRED');
  }
}

async function touchSession(sessionId) {
  const session = await getSessionById(sessionId);
  const now = new Date();
  await assertSessionUsable(session, now);

  return prisma.session.update({
    where: { id: sessionId },
    data: {
      lastActivityAt: now,
      idleExpiresAt: new Date(now.getTime() + IDLE_TIMEOUT_MS),
    },
  });
}

async function revokeSession({ sessionId, revokedBy, revokeReason }) {
  return prisma.session.update({
    where: { id: sessionId },
    data: {
      status: 'REVOKED',
      revokedAt: new Date(),
      revokedBy,
      revokeReason,
      statusChangedAt: new Date(),
    },
  });
}

async function revokeAllUserSessions({ userId, exceptSessionId, revokedBy, revokeReason }) {
  return prisma.session.updateMany({
    where: {
      userId,
      status: 'ACTIVE',
      ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
    },
    data: {
      status: 'REVOKED',
      revokedAt: new Date(),
      revokedBy,
      revokeReason,
      statusChangedAt: new Date(),
    },
  });
}

async function revokeSessionsByDevice({ deviceId, revokedBy, revokeReason }) {
  return prisma.session.updateMany({
    where: { deviceId, status: 'ACTIVE' },
    data: {
      status: 'REVOKED',
      revokedAt: new Date(),
      revokedBy,
      revokeReason,
      statusChangedAt: new Date(),
    },
  });
}

async function listUserSessions(userId) {
  return prisma.session.findMany({
    where: { userId },
    orderBy: { lastActivityAt: 'desc' },
  });
}

async function flagSessionRisk({ sessionId, riskLevel }) {
  const session = await prisma.session.update({
    where: { id: sessionId },
    data: { riskLevel },
  });

  const requiresStepUp = riskLevel === 'HIGH' || riskLevel === 'CRITICAL';
  return { session, requiresStepUp };
}
async function listSessions({ userId, status } = {}) {
  return prisma.session.findMany({
    where: {
      ...(userId ? { userId } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { lastActivityAt: 'desc' },
  });
}
module.exports = {
  createSession,
  getSessionById,
  assertSessionUsable,
  isSessionAbsoluteExpired,
  isSessionIdleExpired,
  touchSession,
  revokeSession,
  revokeAllUserSessions,
  revokeSessionsByDevice,
  listUserSessions,
  flagSessionRisk,
  listSessions,
};