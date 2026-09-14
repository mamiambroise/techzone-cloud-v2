const crypto = require('crypto');
const { prisma } = require('../config/database');

async function logAdminAction({ traceId, actorId, tenantId, action, targetType, targetId, result, reason, before, after, metadata }) {
  return prisma.auditEvent.create({
    data: {
      traceId: traceId || crypto.randomUUID(),
      actorId,
      tenantId,
      action,
      targetType,
      targetId,
      result,
      reason,
      before,
      after,
      metadata,
    },
  });
}

module.exports = { logAdminAction };