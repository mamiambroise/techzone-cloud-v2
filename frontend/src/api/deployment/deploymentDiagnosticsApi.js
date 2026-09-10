import apiClient from '../client.js';

export function getDeploymentHistory(query = {}) {
  const params = new URLSearchParams();
  if (query.applicationId) params.append('applicationId', query.applicationId);
  if (query.releaseId) params.append('releaseId', query.releaseId);
  if (query.deploymentId) params.append('deploymentId', query.deploymentId);
  if (query.environmentId) params.append('environmentId', query.environmentId);
  if (query.status) params.append('status', query.status);
  if (query.actor) params.append('actor', query.actor);
  if (query.traceId) params.append('traceId', query.traceId);
  return apiClient.get(`/api/deployments/history?${params.toString()}`);
}

export function getDeploymentTimeline(deploymentId) {
  return apiClient.get(`/api/deployments/history/timeline/${deploymentId}`);
}

export function getDeploymentDiagnostics() {
  return apiClient.get('/api/deployments/diagnostics');
}

export function getDeploymentDiagnostic(deploymentId) {
  return apiClient.get(`/api/deployments/diagnostics/${deploymentId}`);
}
