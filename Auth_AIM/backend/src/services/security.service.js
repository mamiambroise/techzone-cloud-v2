const { prisma } = require('../config/database');
const { AppError } = require('../utils/response');

async function listSecurityEvents({ severity, type, tenantId, userId } = {}) {
  return prisma.securityEvent.findMany({
    where: {
      ...(severity ? { severity } : {}),
      ...(type ? { type } : {}),
      ...(tenantId ? { tenantId } : {}),
      ...(userId ? { userId } : {}),
    },
    orderBy: { occurredAt: 'desc' },
  });
}

async function getSecurityEventById(id) {
  const event = await prisma.securityEvent.findUnique({ where: { id } });
  if (!event) {
    throw new AppError('Événement de sécurité introuvable', 404, 'SECURITY_EVENT_NOT_FOUND');
  }
  return event;
}

async function acknowledgeSecurityEvent({ id, acknowledgedBy }) {
  const event = await getSecurityEventById(id);
  const metadata = { ...(event.metadata || {}), status: 'ACKNOWLEDGED', acknowledgedAt: new Date().toISOString(), acknowledgedBy };
  return prisma.securityEvent.update({ where: { id }, data: { metadata } });
}

async function resolveSecurityEvent({ id, resolvedBy, resolution }) {
  const event = await getSecurityEventById(id);
  const metadata = { ...(event.metadata || {}), status: 'RESOLVED', resolvedAt: new Date().toISOString(), resolvedBy, resolution };
  return prisma.securityEvent.update({ where: { id }, data: { metadata } });
}

module.exports = { listSecurityEvents, getSecurityEventById, acknowledgeSecurityEvent, resolveSecurityEvent };