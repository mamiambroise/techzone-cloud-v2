import { api } from '../apiClient.js';

const unwrap = (res) => res.data;

export function getEnvironments() {
  return api.get('/business-manager/environments').then(unwrap);
}
export function createEnvironment(body) {
  return api.post('/business-manager/environments', body).then(unwrap);
}
export function updateEnvironment(id, body) {
  return api.patch(`/business-manager/environments/${id}`, body).then(unwrap);
}
export function getEnvironmentHistory(id) {
  return api.get(`/business-manager/environments/${id}/history`).then(unwrap);
}
