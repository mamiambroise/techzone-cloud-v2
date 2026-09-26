import { api } from './apiClient.js';

const unwrap = (res) => res.data;

const toFrontendDeploymentStatus = (status) => {
  const map = {
    PENDING: 'PENDING', RUNNING: 'RUNNING', VERIFYING: 'VERIFYING',
    SUCCEEDED: 'SUCCEEDED', FAILED: 'FAILED', ROLLED_BACK: 'ROLLED_BACK', CANCELLED: 'CANCELLED',
  };
  return map[status] || status;
};

export const deploymentsService = {
  getDeployments: (query = {}) => {
    const params = new URLSearchParams();
    if (query.environmentId) params.append('environmentId', query.environmentId);
    if (query.releaseId) params.append('releaseId', query.releaseId);
    if (query.status) params.append('status', query.status);
    return api.get(`/api/deployments?${params.toString()}`).then(unwrap).then((res) => {
      const items = Array.isArray(res) ? res : res.data || [];
      return items.map((d) => ({ ...d, status: toFrontendDeploymentStatus(d.status) }));
    });
  },
  getDeployment: (id) => api.get(`/api/deployments/${id}`).then(unwrap),
  createDeployment: (body) => api.post('/api/deployments', body).then(unwrap),
  verifyDeployment: (id, body) => api.post(`/api/deployments/${id}/verify`, body).then(unwrap),
  cancelDeployment: (id, actor) => api.post(`/api/deployments/${id}/cancel`, { actor }).then(unwrap),
  retryDeployment: (id, actor) => api.post(`/api/deployments/${id}/retry`, { actor }).then(unwrap),
};
