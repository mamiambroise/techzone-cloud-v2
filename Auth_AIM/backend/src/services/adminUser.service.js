const { prisma } = require('../config/database');
const identityService = require('./identity.service');
const sessionService = require('./session.service');
const { logAdminAction } = require('./adminAudit.service');

async function searchUsers({ search, status }) {
  return identityService.listUsers({ search, status });
}

async function getUserProfile(userId) {
  return identityService.getUserById(userId, { includeIdentities: true });
}

async function getUserMemberships(userId) {
  return prisma.membership.findMany({
    where: { userId },
    include: { tenant: true, organization: true, site: true },
  });
}

async function getUserSessions(userId) {
  return sessionService.listSessions({ userId });
}

async function changeUserStatus({ userId, status, actorId, reason }) {
  const before = await identityService.getUserById(userId);
  const updated = await identityService.setUserStatus({ userId, status, changedBy: actorId, reason });

  await logAdminAction({
    actorId,
    action: `USER_STATUS_${status}`,
    targetType: 'USER',
    targetId: userId,
    result: 'SUCCESS',
    reason,
    before: { status: before.status },
    after: { status: updated.status },
  });

  return updated;
}

async function forceRevokeSessions({ userId, actorId, reason }) {
  await sessionService.revokeAllUserSessions({ userId, revokedBy: actorId, revokeReason: reason || 'ADMIN_FORCED_REVOKE' });

  await logAdminAction({
    actorId,
    action: 'USER_SESSIONS_FORCE_REVOKED',
    targetType: 'USER',
    targetId: userId,
    result: 'SUCCESS',
    reason,
  });

  return { revoked: true };
}

module.exports = { searchUsers, getUserProfile, getUserMemberships, getUserSessions, changeUserStatus, forceRevokeSessions };