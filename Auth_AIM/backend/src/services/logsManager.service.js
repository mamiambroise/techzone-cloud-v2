const REDACTED = '[REDACTED]';
const SENSITIVE_KEYS = new Set([
  'password',
  'passwd',
  'pwd',
  'secret',
  'token',
  'authorization',
  'cookie',
  'set-cookie',
  'apiKey',
  'apikey',
  'accessKey',
  'privateKey',
  'clientSecret',
  'credentials',
  'jwt',
  'refreshToken',
  'sessionToken',
]);

function redactValue(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return value.length > 0 ? REDACTED : value;
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  return REDACTED;
}

function sanitizeMetadata(value) {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMetadata(item));
  }

  if (typeof value === 'object') {
    const output = {};
    for (const [key, item] of Object.entries(value)) {
      const lowered = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lowered) || lowered.includes('secret') || lowered.includes('token') || lowered.includes('password') || lowered.includes('authorization') || lowered.includes('cookie')) {
        output[key] = redactValue(item);
        continue;
      }

      if (item && typeof item === 'object') {
        output[key] = sanitizeMetadata(item);
      } else {
        output[key] = item;
      }
    }
    return output;
  }

  return value;
}

const logStore = [];

function recordLog({
  timestamp = new Date().toISOString(),
  level = 'INFO',
  service,
  component,
  message,
  traceId,
  requestId,
  tenantId,
  userId,
  environmentId,
  errorCode = null,
  metadata = {},
} = {}) {
  const metadataSafe = sanitizeMetadata(metadata);

  const log = {
    timestamp,
    level,
    service,
    component,
    message,
    traceId,
    requestId,
    tenantId,
    userId,
    environmentId,
    errorCode,
    metadataSafe,
  };

  logStore.push(log);
  return log;
}

function searchLogs(filters = {}) {
  const { period, level, service, component, environment, tenantId, errorCode, traceId } = filters;

  return logStore.filter((entry) => {
    if (period && period.start && new Date(entry.timestamp) < new Date(period.start)) return false;
    if (period && period.end && new Date(entry.timestamp) > new Date(period.end)) return false;
    if (level && entry.level !== level) return false;
    if (service && entry.service !== service) return false;
    if (component && entry.component !== component) return false;
    if (environment && entry.environmentId !== environment) return false;
    if (tenantId && entry.tenantId !== tenantId) return false;
    if (errorCode && entry.errorCode !== errorCode) return false;
    if (traceId && entry.traceId !== traceId) return false;
    return true;
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function getRetentionConfig() {
  return {
    defaultDays: 30,
    levels: {
      INFO: 30,
      WARNING: 60,
      ERROR: 90,
      CRITICAL: 180,
    },
    environments: {
      development: 7,
      test: 14,
      staging: 30,
      production: 90,
    },
  };
}

module.exports = {
  recordLog,
  searchLogs,
  getRetentionConfig,
  logStore,
};
