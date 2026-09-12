const { AppError } = require('../utils/response');
const securityService = require('./security.service');
const auditManagerService = require('./auditManager.service');

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

function redactSensitiveValue(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((item) => redactSensitiveValue(item));
  if (typeof value === 'object') {
    const output = {};
    for (const [key, item] of Object.entries(value)) {
      const lowered = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lowered) || lowered.includes('secret') || lowered.includes('token') || lowered.includes('password') || lowered.includes('authorization') || lowered.includes('cookie')) {
        output[key] = REDACTED;
        continue;
      }
      output[key] = typeof item === 'object' ? redactSensitiveValue(item) : item;
    }
    return output;
  }
  return value;
}

function publicSecurityEvent(event) {
  if (!event) return event;
  return {
    ...event,
    metadata: redactSensitiveValue(event.metadata),
    detailsSafe: event.detailsSafe || event.metadata?.detailsSafe || 'No additional details',
  };
}

function publicAuditEntry(entry) {
  if (!entry) return entry;
  return {
    ...entry,
    metadataSafe: redactSensitiveValue(entry.metadataSafe || entry.metadata),
    before: redactSensitiveValue(entry.before),
    after: redactSensitiveValue(entry.after),
  };
}

async function listSecurityEvents(filters = {}) {
  const events = await securityService.listSecurityEvents(filters);
  return events.map(publicSecurityEvent);
}

async function getSecurityEventById(id, { tenantId } = {}) {
  const event = await securityService.getSecurityEventById(id);
  if (tenantId && event.tenantId && String(event.tenantId) !== String(tenantId)) {
    throw new AppError('Accès refusé à cet événement pour ce tenant', 403, 'TENANT_ISOLATION_VIOLATION');
  }
  return publicSecurityEvent(event);
}

async function getSecurityEventCorrelation(filters = {}) {
  const events = await securityService.getSecurityEventCorrelation(filters);
  return events.map((event) => ({
    ...event,
    relatedEventCount: Number(event.relatedEventCount || events.length || 0),
  }));
}

async function getSecurityEventSummary(filters = {}) {
  return securityService.getSecurityEventSummary(filters);
}

async function setSecurityEventStatus({ id, status, actorId, reason, tenantId } = {}) {
  const current = await getSecurityEventById(id, { tenantId });
  const next = await securityService.setSecurityEventStatus({ id, status, actorId, reason });
  return publicSecurityEvent(next);
}

function searchAudit(filters = {}) {
  return auditManagerService.searchAudit(filters).map(publicAuditEntry);
}

module.exports = {
  listSecurityEvents,
  getSecurityEventById,
  getSecurityEventCorrelation,
  getSecurityEventSummary,
  setSecurityEventStatus,
  searchAudit,
};
