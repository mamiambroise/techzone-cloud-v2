import apiClient from './client.js';

export function getWebhooks() {
  return apiClient.get('/api/integrations/webhooks');
}
