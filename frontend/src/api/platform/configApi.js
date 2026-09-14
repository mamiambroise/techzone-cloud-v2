import apiClient from '../client.js';

const BACKEND_TO_FRONTEND_STATUS = {
  DRAFT: 'INVALID',
  VALIDATING: 'INVALID',
  READY: 'VALID',
  ACTIVE: 'VALID',
  DEPRECATED: 'INVALID',
  ARCHIVED: 'INVALID',
};

const FRONTEND_TO_BACKEND_STATUS = {
  VALID: 'ACTIVE',
  INVALID: 'DRAFT',
};

const toSemver = (version) => {
  const str = String(version);
  const parts = str.split('.');
  if (parts.length >= 3) return str;
  return `${parts[0] || '0'}.${parts[1] || '0'}.${parts[2] || '0'}`;
};

export function getConfigs() {
  return apiClient.get('/api/platform/config').then((res) => {
    const items = Array.isArray(res) ? res : res.data || [];
    return items.map((cfg) => ({
      ...cfg,
      status: BACKEND_TO_FRONTEND_STATUS[cfg.status] || cfg.status,
      description: cfg.description || '—',
      updatedBy: cfg.updatedBy || '—',
      isSecret: false,
    }));
  });
}

export function createConfig(body) {
  const backendBody = {
    key: body.key,
    scope: body.scope,
    scopeId: body.scope === 'PLATFORM' ? undefined : body.scopeId,
    type: body.type,
    value: body.value,
    defaultValue: body.defaultValue,
    required: body.required,
    schema: body.schema,
    version: toSemver(body.version),
  };
  return apiClient.post('/api/platform/config', backendBody);
}

export function updateConfig(id, body) {
  const backendBody = {
    key: body.key,
    value: body.value,
    defaultValue: body.defaultValue,
    required: body.required,
    schema: body.schema,
  };
  return apiClient.patch(`/api/platform/config/${id}`, backendBody);
}

export function getEffective(params) {
  const { applicationId, applicationVersionId, environmentId } = params;
  return apiClient.get(`/api/platform/config/effective/${applicationId}/${applicationVersionId}/${environmentId}`);
}
