import { api } from '../apiClient.js';

const unwrap = (res) => res.data;

export function getEnvironments() {
  return api.get('/api/platform/environments').then(unwrap);
}
export function createEnvironment(body) {
  return api.post('/api/platform/environments', body).then(unwrap);
}
export function updateEnvironment(id, body) {
  return api.patch(`/api/platform/environments/${id}`, body).then(unwrap);
}
export function getEnvironmentHistory(id) {
  return api.get(`/api/platform/environments/${id}/history`).then(unwrap);
}
