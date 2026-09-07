import apiClient from './client.js';

export function getApis() {
  return apiClient.get('/api/integrations/apis');
}
