import apiClient from '../client.js';

const toFrontendDeploymentStatus = (status) => {
  const map = {
    PENDING: 'PENDING',
    RUNNING: 'RUNNING',
    VERIFYING: 'VERIFYING',
    SUCCEEDED: 'SUCCEEDED',
    FAILED: 'FAILED',
    ROLLED_BACK: 'ROLLED_BACK',
    CANCELLED: 'CANCELLED',
  };
  return map[status] || status;
};

export function getDeployments(query = {}) {
  const params = new URLSearchParams();
  if (query.environmentId) params.append('environmentId', query.environmentId);
  if (query.releaseId) params.append('releaseId', query.releaseId);
  if (query.status) params.append('status', query.status);
  return apiClient.get(`/api/deployments?${params.toString()}`).then((res) => {
    const items = Array.isArray(res) ? res : res.data || [];
    return items.map((deployment) => ({
      ...deployment,
      status: toFrontendDeploymentStatus(deployment.status),
    }));
  });
}

export function getDeployment(id) {
  return apiClient.get(`/api/deployments/${id}`);
}

export function createDeployment(body) {
  return apiClient.post('/api/deployments', {
    releaseId: body.releaseId,
    environmentId: body.environmentId,
    strategy: body.strategy || 'STANDARD',
    idempotencyKey: body.idempotencyKey,
    startedBy: body.startedBy,
  });
}

export function verifyDeployment(id, body) {
  return apiClient.post(`/api/deployments/${id}/verify`, {
    verifiedBy: body.verifiedBy,
  });
}

export function cancelDeployment(id, actor) {
  return apiClient.post(`/api/deployments/${id}/cancel`, null, {
    body: { actor },
  });
}

export function retryDeployment(id, actor) {
  return apiClient.post(`/api/deployments/${id}/retry`, null, {
    body: { actor },
  });
}
