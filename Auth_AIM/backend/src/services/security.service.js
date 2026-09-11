const { prisma } = require('../config/database');
const { AppError } = require('../utils/response');

const SECURITY_EVENT_LIFECYCLE = ['OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'];
const SECURITY_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const REDACTED = '[REDACTED]';
const SENSITIVE_KEYS = new Set([
  'password',
  'passwd',
  'pwd',
  'secret',
  'token',
  'authorization',
  'cookie',
  'apiKey',
  'apikey',
  'accessKey',
  'privateKey',
  'clientSecret',
  'credentials',
  'jwt',
  'refreshToken',
]);

function normalizeEventType(eventType) {
  const value = String(eventType || '').trim();
  return value || 'UNKNOWN_EVENT';
}

function normalizeSeverity(severity) {
  const value = String(severity || '').toUpperCase();
  return SECURITY_SEVERITIES.includes(value) ? value : 'LOW';
}

function normalizeLifecycle(status) {
  const value = String(status || '').toUpperCase();
  return SECURITY_EVENT_LIFECYCLE.includes(value) ? value : 'OPEN';
}

function sanitizeSecurityMetadata(value) {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeSecurityMetadata(item));
  }

  if (typeof value === 'object') {
    const output = {};
    for (const [key, item] of Object.entries(value)) {
      const lowered = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lowered) || lowered.includes('secret') || lowered.includes('token') || lowered.includes('password') || lowered.includes('authorization') || lowered.includes('cookie')) {
        output[key] = REDACTED;
        continue;
      }

      output[key] = item && typeof item === 'object' ? sanitizeSecurityMetadata(item) : item;
    }
    return output;
  }

  return value;
}

function buildCanonicalMetadata({ status, resource, detailsSafe, metadata = {} } = {}) {
  return sanitizeSecurityMetadata({
    ...(metadata || {}),
    status: normalizeLifecycle(status),
    resource: resource || metadata?.resource || 'unknown',
    detailsSafe: detailsSafe || metadata?.detailsSafe || 'No additional details',
  });
}

async function createSecurityEvent({
  eventType,
  severity,
  tenantId,
  userId,
  identityId,
  organizationId,
  siteId,
  sessionId,
  deviceId,
  source,
  resource,
  ipSafe,
  traceId,
  status = 'OPEN',
  detailsSafe,
  metadata = {},
} = {}) {
  const normalizedType = normalizeEventType(eventType);
  const normalizedSeverity = normalizeSeverity(severity);
  const normalizedStatus = normalizeLifecycle(status);
  const canonicalMetadata = buildCanonicalMetadata({ status: normalizedStatus, resource, detailsSafe, metadata });

  const event = await prisma.securityEvent.create({
    data: {
      type: normalizedType,
      severity: normalizedSeverity,
      tenantId: tenantId || null,
      userId: userId || null,
      identityId: identityId || null,
      organizationId: organizationId || null,
      siteId: siteId || null,
      sessionId: sessionId || null,
      deviceId: deviceId || null,
      source: source || 'unknown',
      riskLevel: normalizedSeverity === 'CRITICAL' ? 'CRITICAL' : normalizedSeverity === 'HIGH' ? 'HIGH' : normalizedSeverity === 'MEDIUM' ? 'MEDIUM' : 'LOW',
      traceId: traceId || null,
      metadata: canonicalMetadata,
      occurredAt: new Date(),
    },
  });

  return {
    ...event,
    eventType: event.type,
    timestamp: event.occurredAt,
    status: event.metadata?.status || normalizedStatus,
    resource: event.metadata?.resource || resource || 'unknown',
    detailsSafe: event.metadata?.detailsSafe || detailsSafe || 'No additional details',
    ipSafe: ipSafe || null,
  };
}

async function listSecurityEvents({ severity, type, tenantId, userId, status, traceId, source, from, to } = {}) {
  const events = await prisma.securityEvent.findMany({
    where: {
      ...(severity ? { severity: normalizeSeverity(severity) } : {}),
      ...(type ? { type: normalizeEventType(type) } : {}),
      ...(tenantId ? { tenantId } : {}),
      ...(userId ? { userId } : {}),
      ...(traceId ? { traceId } : {}),
      ...(source ? { source } : {}),
      ...(from || to ? {
        occurredAt: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to) } : {}),
        },
      } : {}),
    },
    orderBy: { occurredAt: 'desc' },
  });

  return events
    .map((event) => ({
      ...event,
      eventType: event.type,
      timestamp: event.occurredAt,
      status: event.metadata?.status || 'OPEN',
      resource: event.metadata?.resource || 'unknown',
      detailsSafe: event.metadata?.detailsSafe || 'No additional details',
    }))
    .filter((event) => {
      if (status && normalizeLifecycle(event.status) !== normalizeLifecycle(status)) return false;
      return true;
    });
}

async function getSecurityEventById(id) {
  const event = await prisma.securityEvent.findUnique({ where: { id } });
  if (!event) {
    throw new AppError('Événement de sécurité introuvable', 404, 'SECURITY_EVENT_NOT_FOUND');
  }

  return {
    ...event,
    eventType: event.type,
    timestamp: event.occurredAt,
    status: event.metadata?.status || 'OPEN',
    resource: event.metadata?.resource || 'unknown',
    detailsSafe: event.metadata?.detailsSafe || 'No additional details',
  };
}

async function acknowledgeSecurityEvent({ id, acknowledgedBy }) {
  const event = await getSecurityEventById(id);
  const metadata = {
    ...(event.metadata || {}),
    status: 'ACKNOWLEDGED',
    acknowledgedAt: new Date().toISOString(),
    acknowledgedBy,
  };

  const updated = await prisma.securityEvent.update({ where: { id }, data: { metadata } });
  return {
    ...updated,
    eventType: updated.type,
    timestamp: updated.occurredAt,
    status: updated.metadata?.status || 'ACKNOWLEDGED',
    resource: updated.metadata?.resource || 'unknown',
    detailsSafe: updated.metadata?.detailsSafe || 'No additional details',
  };
}

async function resolveSecurityEvent({ id, resolvedBy, resolution }) {
  const event = await getSecurityEventById(id);
  const metadata = {
    ...(event.metadata || {}),
    status: 'RESOLVED',
    resolvedAt: new Date().toISOString(),
    resolvedBy,
    resolution,
  };

  const updated = await prisma.securityEvent.update({ where: { id }, data: { metadata } });
  return {
    ...updated,
    eventType: updated.type,
    timestamp: updated.occurredAt,
    status: updated.metadata?.status || 'RESOLVED',
    resource: updated.metadata?.resource || 'unknown',
    detailsSafe: updated.metadata?.detailsSafe || 'No additional details',
  };
}

function getSecurityLifecycle() {
  return [...SECURITY_EVENT_LIFECYCLE];
}

async function getSecurityEventSummary({ tenantId } = {}) {
  const events = await listSecurityEvents({ tenantId });

  const bySeverity = SECURITY_SEVERITIES.reduce((acc, severity) => {
    acc[severity] = events.filter((event) => event.severity === severity).length;
    return acc;
  }, {});

  const byStatus = SECURITY_EVENT_LIFECYCLE.reduce((acc, status) => {
    acc[status] = events.filter((event) => normalizeLifecycle(event.status) === status).length;
    return acc;
  }, {});

  return {
    tenantId: tenantId || null,
    total: events.length,
    bySeverity,
    byStatus,
  };
}

async function getSecurityEventCorrelation({ tenantId, userId, sessionId, traceId, ipSafe, limit = 10 } = {}) {
  const filters = {
    ...(tenantId ? { tenantId } : {}),
    ...(userId ? { userId } : {}),
    ...(sessionId ? { sessionId } : {}),
    ...(traceId ? { traceId } : {}),
  };

  const events = await prisma.securityEvent.findMany({
    where: filters,
    orderBy: { occurredAt: 'desc' },
    take: limit,
  });

  return events.map((event) => ({
    id: event.id,
    type: event.type,
    severity: event.severity,
    tenantId: event.tenantId,
    userId: event.userId,
    sessionId: event.sessionId,
    traceId: event.traceId,
    status: event.metadata?.status || 'OPEN',
    relatedEventCount: events.length,
    correlatedBy: {
      tenantId: Boolean(tenantId),
      userId: Boolean(userId),
      sessionId: Boolean(sessionId),
      traceId: Boolean(traceId),
      ipSafe: Boolean(ipSafe),
    },
  }));
}

module.exports = {
  listSecurityEvents,
  getSecurityEventById,
  acknowledgeSecurityEvent,
  resolveSecurityEvent,
  createSecurityEvent,
  getSecurityLifecycle,
  getSecurityEventSummary,
  getSecurityEventCorrelation,
  SECURITY_EVENT_LIFECYCLE,
  SECURITY_SEVERITIES,
};