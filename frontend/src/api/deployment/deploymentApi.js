import apiClient from '../client.js';

const toFrontendReleaseStatus = (status) => {
  const map = {
    DRAFT: 'DRAFT',
    ASSEMBLING: 'ASSEMBLING',
    VALIDATING: 'VALIDATING',
    READY: 'READY',
    APPROVED: 'APPROVED',
    RELEASED: 'ACTIVE_PROD',
    SUPERSEDED: 'SUPERSEDED',
    ARCHIVED: 'ARCHIVED',
  };
  return map[status] || status;
};

const toBackendReleaseStatus = (status) => {
  const map = {
    ACTIVE_PROD: 'RELEASED',
    IN_STAGING: 'APPROVED',
    TESTING: 'VALIDATING',
  };
  return map[status] || status;
};

export function getCockpitDashboard() {
  return apiClient.get('/api/deployment/dashboard');
}

export function getRecentReleases(limit = 10) {
  return apiClient.get(`/api/releases/recent?limit=${limit}`);
}

export function getRunningDeployments() {
  return apiClient.get('/api/deployments/running');
}

export function getDeploymentActivity(limit = 20) {
  return apiClient.get(`/api/deployments/activity?limit=${limit}`);
}

export function getDeploymentHealth() {
  return apiClient.get('/api/deployment/health');
}

export function getReleases(query = {}) {
  const params = new URLSearchParams();
  if (query.applicationId) params.append('applicationId', query.applicationId);
  if (query.status) params.append('status', query.status);
  if (query.search) params.append('search', query.search);
  return apiClient.get(`/api/releases?${params.toString()}`).then((res) => {
    const items = Array.isArray(res) ? res : res.data || [];
    return items.map((release) => ({
      ...release,
      status: toFrontendReleaseStatus(release.status),
      appName: release.application?.name || release.applicationId,
      targetEnv: release.currentEnvironmentDeployments?.[0]?.environment?.code || '—',
    }));
  });
}

export function getRelease(id) {
  return apiClient.get(`/api/releases/${id}`);
}

export function createRelease(body) {
  const backendBody = {
    code: body.code,
    version: body.version,
    applicationId: body.applicationId,
    applicationVersionId: body.applicationVersionId,
    snapshotId: body.snapshotId,
    configurationVersion: body.configurationVersion,
    createdBy: body.createdBy,
    artifactRefs: body.artifactRefs,
    contractVersions: body.contractVersions,
  };
  return apiClient.post('/api/releases', backendBody);
}

export function assembleRelease(id) {
  return apiClient.post(`/api/releases/${id}/assemble`);
}

export function validateRelease(id) {
  return apiClient.post(`/api/releases/${id}/validate`);
}

export function approveRelease(id, body) {
  return apiClient.post(`/api/releases/${id}/approve`, {
    approvedBy: body.approvedBy,
    notes: body.notes,
  });
}

export function publishRelease(id) {
  return apiClient.post(`/api/releases/${id}/publish`);
}

export function archiveRelease(id) {
  return apiClient.post(`/api/releases/${id}/archive`);
}

export function getReleaseHistory(id) {
  return apiClient.get(`/api/releases/${id}/history`);
}

export function compareReleases(id1, id2) {
  return apiClient.get(`/api/releases/compare/${id1}/${id2}`);
}
