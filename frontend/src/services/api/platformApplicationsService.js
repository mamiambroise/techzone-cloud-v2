import { api } from '../apiClient.js';

const unwrap = (res) => res.data;

export function getApplications() {
  return api.get('/business-manager/applications').then(unwrap);
}
export function createApplication(body) {
  return api.post('/business-manager/applications', body).then(unwrap);
}
export function updateApplication(id, body) {
  return api.patch(`/business-manager/applications/${id}`, body).then(unwrap);
}
export function archiveApplication(id) {
  return api.post(`/business-manager/applications/${id}/archive`).then(unwrap);
}
