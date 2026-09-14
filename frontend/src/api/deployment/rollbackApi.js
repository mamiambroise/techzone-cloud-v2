import apiClient from '../client.js';

export function getRollbacks() {
  return apiClient.get('/api/rollbacks');
}

export function getRollback(id) {
  return apiClient.get(`/api/rollbacks/${id}`);
}

export function rollbackDeployment(deploymentId, body) {
  return apiClient.post(`/api/deployments/${deploymentId}/rollback`, {
    type: body.type || 'MANUAL_ROLLBACK',
    reason: body.reason,
    toReleaseId: body.toReleaseId,
    startedBy: body.startedBy,
  });
}

export function rollbackEnvironment(environmentId, body) {
  return apiClient.post(`/api/deployment/environments/${environmentId}/rollback`, {
    applicationId: body.applicationId,
    reason: body.reason,
    startedBy: body.startedBy,
    toReleaseId: body.toReleaseId,
  });
}
