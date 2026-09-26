import { api } from '../apiClient.js';

const unwrap = (res) => res.data;

const BACKEND_API_TRANSITIONS = {
  DRAFT: ['VALIDATING', 'RETIRED'],
  VALIDATING: ['DRAFT', 'READY'],
  READY: ['ACTIVE', 'DEPRECATED', 'RETIRED'],
  ACTIVE: ['DEPRECATED', 'RETIRED'],
  DEPRECATED: ['RETIRED'],
  RETIRED: [],
};

const toBackendOperations = (ops) => {
  if (!Array.isArray(ops)) return ops;
  return ops.reduce((acc, op) => {
    acc[`${op.method}:${op.path}`] = {
      summary: op.summary,
      rateLimit: op.rateLimit,
      idempotencyRequired: op.idempotencyRequired,
    };
    return acc;
  }, {});
};

const toFrontendOperations = (ops) => {
  if (!ops || typeof ops !== 'object') return [];
  return Object.entries(ops).map(([key, value]) => {
    const [method, path] = key.split(':');
    return {
      method: method || 'GET',
      path: path || '/',
      summary: value?.summary || '',
      rateLimit: value?.rateLimit || '120 req/min',
      idempotencyRequired: value?.idempotencyRequired || false,
    };
  });
};

export async function getApis() {
  const response = await api.get('/api/integrations/apis');
  const res = response.data;
  const items = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
  return items.map((apiItem) => ({
    ...apiItem,
    operations: toFrontendOperations(apiItem.operations),
    status: apiItem.status === 'ACTIVE' ? 'PUBLISHED' : apiItem.status,
    name: apiItem.name || apiItem.apiCode || null,
    totalRequests24h: null,
    errorRatePct: null,
    p95LatencyMs: null,
  }));
}

export function createApi(body) {
  return api.post('/api/integrations/apis', {
    ...body,
    operations: toBackendOperations(body.operations),
    rateLimit: body.rateLimit && typeof body.rateLimit === 'string' ? { max: body.rateLimit } : body.rateLimit,
    authentication: body.authentication || 'BEARER',
  }).then(unwrap);
}

export function updateApi(id, body) {
  return api.patch(`/api/integrations/apis/${id}`, {
    ...body,
    operations: body.operations ? toBackendOperations(body.operations) : undefined,
    rateLimit: body.rateLimit && typeof body.rateLimit === 'string' ? { max: body.rateLimit } : body.rateLimit,
  }).then(unwrap);
}

export async function transitionApiStatus(id, targetStatus, idempotencyKey) {
  const chain = async (currentStatus) => {
    if (currentStatus === targetStatus) return;
    const allowed = BACKEND_API_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      const next = allowed.find((s) => BACKEND_API_TRANSITIONS[s]?.includes(targetStatus));
      if (!next) throw new Error(`Cannot transition API from ${currentStatus} to ${targetStatus}`);
      await api.post(`/api/integrations/apis/${id}/transition`, { status: next }, { headers: { 'Idempotency-Key': idempotencyKey || crypto.randomUUID() } });
      await chain(next);
    } else {
      await api.post(`/api/integrations/apis/${id}/transition`, { status: targetStatus }, { headers: { 'Idempotency-Key': idempotencyKey || crypto.randomUUID() } });
    }
  };
  return chain('DRAFT');
}

export function deleteApi(id) {
  return api.delete(`/api/integrations/apis/${id}`).then(unwrap);
}

export function executeApi(id, body) {
  return api.post(`/api/integrations/apis/${id}/execute`, body).then(unwrap);
}
