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

function sanitizeAuditDiff(value) {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditDiff(item));
  }

  if (typeof value === 'object') {
    const output = {};
    for (const [key, item] of Object.entries(value)) {
      const lowered = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lowered) || lowered.includes('secret') || lowered.includes('token') || lowered.includes('password') || lowered.includes('authorization') || lowered.includes('cookie')) {
        output[key] = REDACTED;
        continue;
      }
      output[key] = typeof item === 'object' ? sanitizeAuditDiff(item) : item;
    }
    return output;
  }

  return value;
}

const auditStore = [];

function recordAudit({
  auditId = `AUD-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
  timestamp = new Date().toISOString(),
  actorType,
  actorId,
  tenantId,
  applicationId,
  action,
  resourceType,
  resourceId,
  result,
  reason,
  traceId,
  before,
  after,
  metadata = {},
} = {}) {
  const metadataSafe = {
    ...sanitizeAuditDiff(metadata),
    before: sanitizeAuditDiff(before),
    after: sanitizeAuditDiff(after),
  };

  const event = {
    auditId,
    timestamp,
    actorType,
    actorId,
    tenantId,
    applicationId,
    action,
    resourceType,
    resourceId,
    result,
    reason,
    traceId,
    metadataSafe,
    immutable: true,
    createdAt: new Date().toISOString(),
  };

  auditStore.push(event);
  return event;
}

function searchAudit(filters = {}) {
  const { actorType, actorId, tenantId, applicationId, action, resourceType, resourceId, result, traceId, from, to } = filters;

  return auditStore.filter((entry) => {
    if (actorType && entry.actorType !== actorType) return false;
    if (actorId && entry.actorId !== actorId) return false;
    if (tenantId && entry.tenantId !== tenantId) return false;
    if (applicationId && entry.applicationId !== applicationId) return false;
    if (action && entry.action !== action) return false;
    if (resourceType && entry.resourceType !== resourceType) return false;
    if (resourceId && entry.resourceId !== resourceId) return false;
    if (result && entry.result !== result) return false;
    if (traceId && entry.traceId !== traceId) return false;
    if (from && new Date(entry.timestamp) < new Date(from)) return false;
    if (to && new Date(entry.timestamp) > new Date(to)) return false;
    return true;
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function getAccessPolicy() {
  return {
    readRequiresHigherPrivilege: true,
    allowedRoles: ['ADMIN', 'SECURITY_ADMIN', 'AUDITOR'],
    defaultBehavior: 'DENY',
    tenantIsolation: true,
  };
}

module.exports = {
  recordAudit,
  searchAudit,
  getAccessPolicy,
  auditStore,
};
