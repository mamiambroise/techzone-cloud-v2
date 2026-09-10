import apiClient from '../client.js';

export function getEnvironmentDeployments() {
  return apiClient.get('/api/deployment/environments');
}

export function promoteRelease(body) {
  return apiClient.post('/api/deployment/environments/promote', {
    releaseId: body.releaseId,
    targetEnvironmentId: body.targetEnvironmentId,
    startedBy: body.startedBy,
    strategy: body.strategy,
  });
}

export function getEnvironmentStatus(environmentId) {
  return apiClient.get(`/api/deployment/environments/${environmentId}/status`);
}

export function lockEnvironment(environmentId, body) {
  return apiClient.post(`/api/deployment/environments/${environmentId}/lock`, {
    reason: body.reason,
    lockedBy: body.lockedBy,
  });
}

export function unlockEnvironment(environmentId, actor) {
  return apiClient.post(`/api/deployment/environments/${environmentId}/unlock`, null, {
    body: { actor },
  });
}

export function detectDrift(environmentId) {
  return apiClient.get(`/api/deployment/environments/${environmentId}/drift`);
}
