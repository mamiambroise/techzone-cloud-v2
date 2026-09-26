import { api } from '../apiClient.js';

const unwrap = (res) => res.data;

export function getApplications() {
  return api.get('/api/platform/applications').then(unwrap);
}
export function createApplication(body) {
  return api.post('/api/platform/applications', body).then(unwrap);
}
export function updateApplication(id, body) {
  return api.patch(`/api/platform/applications/${id}`, body).then(unwrap);
}
export function archiveApplication(id) {
  return api.post(`/api/platform/applications/${id}/archive`).then(unwrap);
}
