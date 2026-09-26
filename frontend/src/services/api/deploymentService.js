import { api } from '../apiClient.js';

const unwrap = (res) => res.data;

const toFrontendReleaseStatus = (status) => {
  const map = {
    DRAFT: 'DRAFT', ASSEMBLING: 'ASSEMBLING', VALIDATING: 'VALIDATING',
    READY: 'READY', APPROVED: 'APPROVED', RELEASED: 'ACTIVE_PROD',
    SUPERSEDED: 'SUPERSEDED', ARCHIVED: 'ARCHIVED',
  };
  return map[status] || status;
};

const toFrontendDeploymentStatus = (status) => {
  const map = {
    PENDING: 'PENDING', RUNNING: 'RUNNING', VERIFYING: 'VERIFYING',
    SUCCEEDED: 'SUCCEEDED', FAILED: 'FAILED', ROLLED_BACK: 'ROLLED_BACK', CANCELLED: 'CANCELLED',
  };
  return map[status] || status;
};

export const getCockpitDashboard = () => api.get('/api/deployment/dashboard').then(unwrap);
export const getRecentReleases = (limit = 10) => api.get(`/api/releases/recent?limit=${limit}`).then(unwrap);
export const getRunningDeployments = () => api.get('/api/deployments/running').then(unwrap);
export const getDeploymentActivity = (limit = 20) => api.get(`/api/deployments/activity?limit=${limit}`).then(unwrap);
export const getDeploymentHealth = () => api.get('/api/deployment/health').then(unwrap);

export const getReleases = (query = {}) => {
  const params = new URLSearchParams();
  if (query.applicationId) params.append('applicationId', query.applicationId);
  if (query.status) params.append('status', query.status);
  if (query.search) params.append('search', query.search);
  return api.get(`/api/releases?${params.toString()}`).then(unwrap).then((res) => {
    const items = Array.isArray(res) ? res : res.data || [];
    return items.map((release) => ({
      ...release,
      status: toFrontendReleaseStatus(release.status),
      appName: release.application?.name || release.applicationId,
      targetEnv: release.currentEnvironmentDeployments?.[0]?.environment?.code || '—',
    }));
  });
};

export const getRelease = (id) => api.get(`/api/releases/${id}`).then(unwrap);
export const createRelease = (body) => api.post('/api/releases', body).then(unwrap);
export const assembleRelease = (id) => api.post(`/api/releases/${id}/assemble`).then(unwrap);
export const validateRelease = (id) => api.post(`/api/releases/${id}/validate`).then(unwrap);
export const approveRelease = (id, body) => api.post(`/api/releases/${id}/approve`, body).then(unwrap);
export const publishRelease = (id) => api.post(`/api/releases/${id}/publish`).then(unwrap);
export const archiveRelease = (id) => api.post(`/api/releases/${id}/archive`).then(unwrap);
export const getReleaseHistory = (id) => api.get(`/api/releases/${id}/history`).then(unwrap);
export const compareReleases = (id1, id2) => api.get(`/api/releases/compare/${id1}/${id2}`).then(unwrap);

export const getDeployments = (query = {}) => {
  const params = new URLSearchParams();
  if (query.environmentId) params.append('environmentId', query.environmentId);
  if (query.releaseId) params.append('releaseId', query.releaseId);
  if (query.status) params.append('status', query.status);
  return api.get(`/api/deployments?${params.toString()}`).then(unwrap).then((res) => {
    const items = Array.isArray(res) ? res : res.data || [];
    return items.map((d) => ({ ...d, status: toFrontendDeploymentStatus(d.status) }));
  });
};

export const getDeployment = (id) => api.get(`/api/deployments/${id}`).then(unwrap);
export const createDeployment = (body) => api.post('/api/deployments', body).then(unwrap);
export const verifyDeployment = (id, body) => api.post(`/api/deployments/${id}/verify`, body).then(unwrap);
export const cancelDeployment = (id, actor) => api.post(`/api/deployments/${id}/cancel`, { actor }).then(unwrap);
export const retryDeployment = (id, actor) => api.post(`/api/deployments/${id}/retry`, { actor }).then(unwrap);

export const getRollbacks = () => api.get('/api/rollbacks').then(unwrap);
export const getRollback = (id) => api.get(`/api/rollbacks/${id}`).then(unwrap);
export const rollbackDeployment = (deploymentId, body) => api.post(`/api/deployments/${deploymentId}/rollback`, body).then(unwrap);
export const rollbackEnvironment = (environmentId, body) => api.post(`/api/deployment/environments/${environmentId}/rollback`, body).then(unwrap);

export const getGates = (deploymentId) => api.get(`/api/deployments/${deploymentId}/gates`).then(unwrap);
export const evaluateGate = (deploymentId, body) => api.post(`/api/deployments/${deploymentId}/gates/evaluate`, body).then(unwrap);
export const approveGate = (deploymentId, gateId, body) => api.post(`/api/deployments/${deploymentId}/gates/${gateId}/approve`, body).then(unwrap);
export const bypassGate = (deploymentId, gateId, body) => api.post(`/api/deployments/${deploymentId}/gates/${gateId}/bypass`, body).then(unwrap);

export const getEnvironmentDeployments = () => api.get('/api/deployment/environments').then(unwrap);
export const promoteRelease = (body) => api.post('/api/deployment/environments/promote', body).then(unwrap);
export const getEnvironmentStatus = (environmentId) => api.get(`/api/deployment/environments/${environmentId}/status`).then(unwrap);
export const lockEnvironment = (environmentId, body) => api.post(`/api/deployment/environments/${environmentId}/lock`, body).then(unwrap);
export const unlockEnvironment = (environmentId, actor) => api.post(`/api/deployment/environments/${environmentId}/unlock`, { actor }).then(unwrap);
export const detectDrift = (environmentId) => api.get(`/api/deployment/environments/${environmentId}/drift`).then(unwrap);

export const getDeploymentHistory = (query = {}) => {
  const params = new URLSearchParams();
  if (query.applicationId) params.append('applicationId', query.applicationId);
  if (query.releaseId) params.append('releaseId', query.releaseId);
  if (query.deploymentId) params.append('deploymentId', query.deploymentId);
  if (query.environmentId) params.append('environmentId', query.environmentId);
  if (query.status) params.append('status', query.status);
  if (query.actor) params.append('actor', query.actor);
  if (query.traceId) params.append('traceId', query.traceId);
  return api.get(`/api/deployments/history?${params.toString()}`).then(unwrap);
};

export const getDeploymentTimeline = (deploymentId) => api.get(`/api/deployments/history/timeline/${deploymentId}`).then(unwrap);
export const getDeploymentDiagnostics = () => api.get('/api/deployments/diagnostics').then(unwrap);
export const getDeploymentDiagnostic = (deploymentId) => api.get(`/api/deployments/diagnostics/${deploymentId}`).then(unwrap);
