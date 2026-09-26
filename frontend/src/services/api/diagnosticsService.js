import { api } from '../apiClient.js';

const unwrap = (res) => res.data;

const FRONTEND_TO_BACKEND_STATUS = {
  SUCCESS: 'SUCCEEDED',
  WARNING: 'RETRYING',
  FAILURE: 'FAILED',
};

const BACKEND_TO_FRONTEND_STATUS = {
  STARTED: 'SUCCESS',
  SUCCEEDED: 'SUCCESS',
  FAILED: 'FAILURE',
  TIMEOUT: 'FAILURE',
  RETRYING: 'WARNING',
  CANCELLED: 'WARNING',
};

export function getDiagnosticsMetrics() {
  return api.get('/api/integrations/diagnostics/metrics').then(unwrap);
}
export function getLogs(filters = {}) {
  const params = new URLSearchParams();
  if (filters.traceId) params.append('traceId', filters.traceId);
  if (filters.tenantId && filters.tenantId !== 'ALL') params.append('tenantId', filters.tenantId);
  if (filters.connectorId && filters.connectorId !== 'ALL') params.append('connectorId', filters.connectorId);
  if (filters.direction && filters.direction !== 'ALL') params.append('direction', filters.direction);
  if (filters.status && filters.status !== 'ALL') params.append('status', FRONTEND_TO_BACKEND_STATUS[filters.status] || filters.status);
  if (filters.errorCode && filters.errorCode !== 'ALL') params.append('errorCode', filters.errorCode);
  if (filters.operation) params.append('operation', filters.operation);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));

  return api.get(`/api/integrations/diagnostics/logs?${params.toString()}`).then(unwrap).then((res) => {
    const items = Array.isArray(res) ? res : res.data || [];
    return items.map((log) => ({
      ...log,
      status: BACKEND_TO_FRONTEND_STATUS[log.status] || log.status,
      connector: log.connectorId || log.connector || '—',
      rootCause: log.rootCause || '—',
      httpStatus: log.httpStatus || null,
    }));
  });
}
export function getTimeline(traceId) {
  return api.get(`/api/integrations/diagnostics/timeline/${traceId}`).then(unwrap);
}
