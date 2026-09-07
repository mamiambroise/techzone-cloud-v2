import apiClient from './client.js';

export function getSynchronizations() {
  return apiClient.get('/api/integrations/synchronizations');
}
