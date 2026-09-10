import apiClient from './client.js';

export function getCredentials() {
  return apiClient.get('/api/integrations/credentials');
}

export function createCredential(body) {
  return apiClient.post('/api/integrations/credentials', body);
}

export function updateCredential(id, body) {
  return apiClient.patch(`/api/integrations/credentials/${id}`, body);
}

export function rotateCredential(id, body) {
  return apiClient.post(`/api/integrations/credentials/${id}/rotate`, body);
}

export function disableCredential(id) {
  return apiClient.post(`/api/integrations/credentials/${id}/disable`);
}

export function archiveCredential(id) {
  return apiClient.post(`/api/integrations/credentials/${id}/archive`);
}

export function testCredential(id) {
  return apiClient.post(`/api/integrations/credentials/${id}/test`);
}

export function associateCredential(id, connectorId) {
  return apiClient.post(`/api/integrations/credentials/${id}/associate/${connectorId}`);
}
