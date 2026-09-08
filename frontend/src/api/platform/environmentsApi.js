import apiClient from '../client.js';

export function getEnvironments() {
  return apiClient.get('/api/platform/environments').then((res) => {
    const items = Array.isArray(res) ? res : res.data || [];
    return items.map((env) => ({
      ...env,
      securityTier: env.region === 'fr-par-1' ? 'TIER1' : env.region === 'eu-west-1' ? 'TIER2' : 'TIER3',
      accessRule: 'IAM_RESTRICTED',
      allowedRoles: ['PLATFORM_SUPER_ADMIN', 'TEAM4_DEVELOPER', 'TEAM4_OPERATOR'],
      deployedApps: [],
      history: [],
    }));
  });
}

export function createEnvironment(body) {
  const backendBody = {
    code: body.code,
    name: body.name,
    type: body.type,
    status: body.status,
    region: body.region || null,
    baseUrl: body.baseUrl || null,
    configurationRef: body.configurationRef || null,
  };
  return apiClient.post('/api/platform/environments', backendBody);
}

export function updateEnvironment(id, body) {
  const backendBody = {
    name: body.name,
    type: body.type,
    status: body.status,
    region: body.region,
    baseUrl: body.baseUrl,
    configurationRef: body.configurationRef,
  };
  return apiClient.patch(`/api/platform/environments/${id}`, backendBody);
}

export function getEnvironmentHistory(id) {
  return apiClient.get(`/api/platform/environments/${id}/history`);
}
