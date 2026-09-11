const REDACTED = '[REDACTED]';
const ALERT_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const ALERT_STATUSES = ['OPEN', 'ACKNOWLEDGED', 'SUPPRESSED', 'RESOLVED', 'FALSE_POSITIVE'];
const DEFAULT_COOLDOWN_MS = 10 * 60 * 1000;
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
]);

const alertStore = [];

function normalizeSeverity(severity) {
  const value = String(severity || '').toUpperCase();
  return ALERT_SEVERITIES.includes(value) ? value : 'LOW';
}

function normalizeStatus(status) {
  const value = String(status || '').toUpperCase();
  return ALERT_STATUSES.includes(value) ? value : 'OPEN';
}

function sanitizeAlertValue(value) {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAlertValue(item));
  }

  if (typeof value === 'object') {
    const output = {};
    for (const [key, item] of Object.entries(value)) {
      const lowered = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lowered) || lowered.includes('secret') || lowered.includes('token') || lowered.includes('password') || lowered.includes('authorization') || lowered.includes('cookie')) {
        output[key] = REDACTED;
        continue;
      }

      output[key] = item && typeof item === 'object' ? sanitizeAlertValue(item) : item;
    }
    return output;
  }

  return value;
}

function buildDedupKey({ code, tenantId, scope, sourceType, condition, sourceRef } = {}) {
  return [
    String(code || '').trim().toUpperCase(),
    String(tenantId || 'global').trim(),
    String(scope || 'tenant').trim().toLowerCase(),
    String(sourceType || 'UNKNOWN').trim().toUpperCase(),
    String(condition || '').trim(),
    String(sourceRef || '').trim(),
  ].join('|');
}

function serializeAlert(alert) {
  return {
    ...alert,
    id: alert.id,
    code: alert.code,
    sourceType: alert.sourceType,
    condition: alert.condition,
    severity: normalizeSeverity(alert.severity),
    status: normalizeStatus(alert.status),
    tenantId: alert.tenantId || null,
    traceId: alert.traceId || null,
    scope: alert.scope || 'tenant',
    sourceRef: alert.sourceRef || null,
    detailsSafe: sanitizeAlertValue(alert.detailsSafe || alert.details || 'No additional details'),
    metadataSafe: sanitizeAlertValue(alert.metadataSafe || alert.metadata || {}),
    dedupKey: alert.dedupKey,
    cooldownApplied: Boolean(alert.cooldownApplied),
    reason: alert.reason || null,
    createdAt: alert.createdAt || new Date().toISOString(),
    updatedAt: alert.updatedAt || alert.createdAt || new Date().toISOString(),
  };
}

function getAlertById(id) {
  return alertStore.find((alert) => alert.id === id);
}

async function createAlert({
  code,
  sourceType,
  condition,
  severity,
  tenantId,
  tenantCode,
  traceId,
  scope = 'tenant',
  sourceRef,
  details,
  metadata = {},
  status = 'OPEN',
} = {}) {
  const normalizedSeverity = normalizeSeverity(severity);
  const normalizedStatus = normalizeStatus(status);
  const dedupKey = buildDedupKey({ code, tenantId, scope, sourceType, condition, sourceRef });
  const now = new Date();

  const previous = [...alertStore]
    .filter((entry) => {
      const sameTenant = entry.tenantId === tenantId || entry.tenantCode === tenantId || entry.tenantCode === tenantCode;
      return entry.dedupKey === dedupKey && sameTenant;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  if (previous && previous.status !== 'RESOLVED' && previous.status !== 'FALSE_POSITIVE') {
    const previousTime = new Date(previous.createdAt).getTime();
    const age = now.getTime() - previousTime;

    if (age < DEFAULT_COOLDOWN_MS) {
      const suppressed = serializeAlert({
        ...previous,
        id: `${previous.id}-suppressed-${Date.now()}`,
        status: 'SUPPRESSED',
        reason: 'DEDUPLICATED',
        cooldownApplied: true,
        cooldownMs: DEFAULT_COOLDOWN_MS,
        duplicateOf: previous.id,
        updatedAt: now.toISOString(),
      });

      alertStore.push(suppressed);
      return suppressed;
    }
  }

  const alert = serializeAlert({
    id: `ALT-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    code: String(code || '').toUpperCase(),
    sourceType: String(sourceType || 'UNKNOWN').toUpperCase(),
    condition: String(condition || 'unknown_condition'),
    severity: normalizedSeverity,
    status: normalizedStatus,
    tenantId: tenantId || null,
    tenantCode: tenantCode || (typeof tenantId === 'string' && tenantId.includes('-') ? null : tenantId) || null,
    traceId: traceId || null,
    scope,
    sourceRef: sourceRef || null,
    details,
    detailsSafe: sanitizeAlertValue(details || 'No additional details'),
    metadata,
    metadataSafe: sanitizeAlertValue(metadata || {}),
    dedupKey,
    cooldownApplied: false,
    reason: null,
    cooldownMs: DEFAULT_COOLDOWN_MS,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });

  alertStore.push(alert);
  return alert;
}

function listAlerts({ tenantId, status, severity, sourceType, code } = {}) {
  return [...alertStore]
    .filter((alert) => {
      if (tenantId) {
        const tenantMatches = alert.tenantId === tenantId || alert.tenantCode === tenantId;
        if (!tenantMatches) return false;
      }
      if (status && normalizeStatus(alert.status) !== normalizeStatus(status)) return false;
      if (severity && normalizeSeverity(alert.severity) !== normalizeSeverity(severity)) return false;
      if (sourceType && String(alert.sourceType).toUpperCase() !== String(sourceType).toUpperCase()) return false;
      if (code && String(alert.code).toUpperCase() !== String(code).toUpperCase()) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((alert) => serializeAlert(alert));
}

function getAlertSummary({ tenantId } = {}) {
  const alerts = listAlerts({ tenantId });

  const bySeverity = ALERT_SEVERITIES.reduce((acc, level) => {
    acc[level] = alerts.filter((item) => item.severity === level).length;
    return acc;
  }, {});

  const byStatus = ALERT_STATUSES.reduce((acc, status) => {
    acc[status] = alerts.filter((item) => normalizeStatus(item.status) === status).length;
    return acc;
  }, {});

  return {
    tenantId: tenantId || null,
    total: alerts.length,
    bySeverity,
    byStatus,
  };
}

async function acknowledgeAlert({ id, acknowledgedBy }) {
  const alert = getAlertById(id);
  if (!alert) {
    const error = new Error('Alerte introuvable');
    error.statusCode = 404;
    error.code = 'ALERT_NOT_FOUND';
    throw error;
  }

  const updated = serializeAlert({
    ...alert,
    status: 'ACKNOWLEDGED',
    acknowledgedBy,
    acknowledgedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const index = alertStore.findIndex((entry) => entry.id === id);
  if (index >= 0) alertStore[index] = updated;

  return updated;
}

async function resolveAlert({ id, resolvedBy, resolution }) {
  const alert = getAlertById(id);
  if (!alert) {
    const error = new Error('Alerte introuvable');
    error.statusCode = 404;
    error.code = 'ALERT_NOT_FOUND';
    throw error;
  }

  const updated = serializeAlert({
    ...alert,
    status: 'RESOLVED',
    resolvedBy,
    resolution: resolution || 'resolved',
    resolvedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const index = alertStore.findIndex((entry) => entry.id === id);
  if (index >= 0) alertStore[index] = updated;

  return updated;
}

module.exports = {
  alertStore,
  ALERT_SEVERITIES,
  ALERT_STATUSES,
  normalizeSeverity,
  normalizeStatus,
  buildDedupKey,
  createAlert,
  listAlerts,
  getAlertById,
  getAlertSummary,
  acknowledgeAlert,
  resolveAlert,
};
