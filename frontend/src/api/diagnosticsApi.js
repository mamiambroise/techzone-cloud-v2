import apiClient from './client.js';

export function getDiagnosticsMetrics() {
  return apiClient.get('/api/integrations/diagnostics/metrics');
}
