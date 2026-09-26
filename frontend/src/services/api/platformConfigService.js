import { api } from '../apiClient.js';

const unwrap = (res) => res.data;

export function getConfigs() {
  return api.get('/api/platform/config').then(unwrap);
}
export function createConfig(body) {
  return api.post('/api/platform/config', body).then(unwrap);
}
export function updateConfig(id, body) {
  return api.patch(`/api/platform/config/${id}`, body).then(unwrap);
}
export function getEffective(params) {
  const { applicationId, applicationVersionId, environmentId } = params;
  return api.get(`/api/platform/config/effective/${applicationId}/${applicationVersionId}/${environmentId}`).then(unwrap);
}
