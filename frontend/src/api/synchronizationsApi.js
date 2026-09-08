import apiClient from './client.js';

const BACKEND_MODE_MAP = {
  FULL: 'FULL',
  INCREMENTAL: 'INCREMENTAL',
};

const BACKEND_DIRECTION_MAP = {
  PULL: 'PULL',
  PUSH: 'PUSH',
  BIDIRECTIONAL: 'BIDIRECTIONAL',
};

const toBackendSync = (sync) => {
  if (!sync || typeof sync !== 'object') return sync;
  const mode = typeof sync.mode === 'string' ? BACKEND_MODE_MAP[sync.mode.toUpperCase()] || sync.mode : sync.mode;
  const direction = typeof sync.direction === 'string' ? BACKEND_DIRECTION_MAP[sync.direction.toUpperCase()] || sync.direction : sync.direction;
  return { ...sync, mode, direction };
};

const toFrontendSync = (sync) => {
  if (!sync || typeof sync !== 'object') return sync;
  return { ...sync };
};

export function getSynchronizations() {
  return apiClient.get('/api/integrations/synchronizations').then((res) => {
    const items = Array.isArray(res) ? res : res.data || [];
    return items.map(toFrontendSync);
  });
}

export function createSync(body) {
  return apiClient.post('/api/integrations/synchronizations', toBackendSync(body));
}

export function updateSync(id, body) {
  return apiClient.patch(`/api/integrations/synchronizations/${id}`, toBackendSync(body));
}

export function runSync(id) {
  return apiClient.post(`/api/integrations/synchronizations/${id}/run`);
}

export function pauseSync(id) {
  return apiClient.post(`/api/integrations/synchronizations/${id}/pause`);
}

export function resumeSync(id) {
  return apiClient.post(`/api/integrations/synchronizations/${id}/resume`);
}

export function cancelSync(id) {
  return apiClient.post(`/api/integrations/synchronizations/${id}/cancel`);
}

export function getCheckpoint(id) {
  return apiClient.get(`/api/integrations/synchronizations/${id}/checkpoint`);
}

export function deleteSync(id) {
  return apiClient.delete(`/api/integrations/synchronizations/${id}`);
}
