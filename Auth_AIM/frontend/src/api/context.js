import { apiRequest } from './client';

export async function resolveContext(payload = {}) {
  const body = {
    requestedTenantId: payload.requestedTenantId || null,
    resource: payload.resource || null,
    action: payload.action || null,
    source: payload.source || 'API_REQUEST',
    traceId: payload.traceId || null,
  };

  const result = await apiRequest('/api/iam/context/resolve', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return result;
}

export async function switchTenant(tenantId, traceId = null) {
  const result = await apiRequest('/api/iam/context/switch-tenant', {
    method: 'POST',
    body: JSON.stringify({ tenantId, traceId }),
  });

  return result;
}

export async function listActiveTenants() {
  const result = await apiRequest('/api/iam/context/tenants', {
    method: 'GET',
  });

  return result;
}

export async function invalidateContext(payload = {}) {
  const body = {
    subjectType: payload.subjectType || 'USER',
    subjectId: payload.subjectId || null,
    tenantId: payload.tenantId || null,
    reason: payload.reason || null,
    sourceEventType: payload.sourceEventType || null,
    sourceEventId: payload.sourceEventId || null,
  };

  const result = await apiRequest('/api/iam/context/invalidate', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return result;
}
