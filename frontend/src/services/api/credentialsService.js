import { api } from '../apiClient.js';

const unwrap = (res) => res.data;

export function getCredentials() {
  return api.get('/integrations/credentials').then(unwrap);
}
export function createCredential(body) {
  return api.post('/integrations/credentials', body).then(unwrap);
}
export function updateCredential(id, body) {
  return api.patch(`/integrations/credentials/${id}`, body).then(unwrap);
}
export function rotateCredential(id, body) {
  return api.post(`/integrations/credentials/${id}/rotate`, body).then(unwrap);
}
export function disableCredential(id) {
  return api.post(`/integrations/credentials/${id}/disable`).then(unwrap);
}
export function archiveCredential(id) {
  return api.post(`/integrations/credentials/${id}/archive`).then(unwrap);
}
export function testCredential(id) {
  return api.post(`/integrations/credentials/${id}/test`).then(unwrap);
}
export function associateCredential(id, connectorId) {
  return api.post(`/integrations/credentials/${id}/associate/${connectorId}`).then(unwrap);
}
