import { api } from '../apiClient.js';

const unwrap = (res) => res.data;

const normalizeConflictPolicy = (conflictPolicy) => {
  if (typeof conflictPolicy === 'string') return conflictPolicy;
  if (conflictPolicy && typeof conflictPolicy === 'object') {
    if (typeof conflictPolicy.strategy === 'string') return conflictPolicy.strategy;
    if (typeof conflictPolicy.policy === 'string') return conflictPolicy.policy;
  }
  return 'SOURCE_WINS';
};

const toFrontendSync = (sync) => {
  if (!sync || typeof sync !== 'object') return sync;
  return { ...sync, conflictPolicy: normalizeConflictPolicy(sync.conflictPolicy) };
};

const toBackendSync = (sync) => {
  if (!sync || typeof sync !== 'object') return sync;
  const BACKEND_MODE_MAP = { FULL: 'FULL', INCREMENTAL: 'INCREMENTAL' };
  const BACKEND_DIRECTION_MAP = { PULL: 'PULL', PUSH: 'PUSH', BIDIRECTIONAL: 'BIDIRECTIONAL' };
  const mode = typeof sync.mode === 'string' ? BACKEND_MODE_MAP[sync.mode.toUpperCase()] || sync.mode : sync.mode;
  const direction = typeof sync.direction === 'string' ? BACKEND_DIRECTION_MAP[sync.direction.toUpperCase()] || sync.direction : sync.direction;
  return { ...sync, mode, direction };
};

export function getSynchronizations() {
  return api.get('/api/integrations/synchronizations').then(unwrap).then((res) => {
    const items = Array.isArray(res) ? res : res.data || [];
    return items.map(toFrontendSync);
  });
}
export function getSync(id) {
  return api.get(`/api/integrations/synchronizations/${id}`).then(unwrap).then((res) => toFrontendSync(res?.data ?? res));
}
export function createSync(body) {
  return api.post('/api/integrations/synchronizations', toBackendSync(body)).then(unwrap).then((res) => toFrontendSync(res?.data ?? res));
}
export function updateSync(id, body) {
  return api.patch(`/api/integrations/synchronizations/${id}`, toBackendSync(body)).then(unwrap).then((res) => toFrontendSync(res?.data ?? res));
}
export function runSync(id) {
  return api.post(`/api/integrations/synchronizations/${id}/run`).then(unwrap);
}
export function pauseSync(id) {
  return api.post(`/api/integrations/synchronizations/${id}/pause`).then(unwrap);
}
export function resumeSync(id) {
  return api.post(`/api/integrations/synchronizations/${id}/resume`).then(unwrap);
}
export function cancelSync(id) {
  return api.post(`/api/integrations/synchronizations/${id}/cancel`).then(unwrap);
}
export function getCheckpoint(id) {
  return api.get(`/api/integrations/synchronizations/${id}/checkpoint`).then(unwrap);
}
export function deleteSync(id) {
  return api.delete(`/api/integrations/synchronizations/${id}`).then(unwrap);
}
