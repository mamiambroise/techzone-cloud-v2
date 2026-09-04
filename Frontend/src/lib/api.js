// Techzone Cloud — REST API client (Backend NestJS).
// Base URL is proxied by Vite at "/api" → backend in dev.
// Auth: signed JWT (HS256) generated client-side; the backend's AuthGuard
// verifies it with the shared JWT_SECRET. No backend /auth endpoint is used.

import { signJwt, getSharedSecret, isJwtExpired } from './jwt';

const ACCESS_TOKEN_KEY = 'bm_api_access_token';
const TOKEN_PAYLOAD_KEY = 'bm_api_token_payload';

const ROLE_PERMISSIONS = {
  ADMIN: [
    'business.application.read', 'business.application.create', 'business.application.update',
    'business.application.clone', 'business.application.archive',
    'business.application.version.read', 'business.application.version.create',
    'business.application.validate', 'business.application.publish', 'business.application.rollback',
    'business.application.audit.read',
    'business.application.data-model.read', 'business.application.data-model.write',
    'business.application.data-model.validate',
    'business.feature.read', 'business.feature.create', 'business.feature.update', 'business.feature.archive',
    'business.capability.read', 'business.capability.create', 'business.capability.update', 'business.capability.archive',
    'business.feature.mapping.manage', 'business.capability.dependency.manage', 'business.capability.requirement.manage',
    'business.version.feature.manage', 'business.version.capability.manage',
    'business.feature.impact.read', 'business.feature.validation.run', 'business.feature.snapshot.read',
  ],
  BUILDER: [
    'business.application.read', 'business.application.create', 'business.application.update',
    'business.application.version.read', 'business.application.version.create',
    'business.application.data-model.read', 'business.application.data-model.write',
    'business.feature.read', 'business.feature.create', 'business.feature.update',
    'business.capability.read',
    'business.version.feature.manage', 'business.version.capability.manage',
  ],
  VIEWER: [
    'business.application.read',
    'business.application.version.read',
    'business.application.audit.read',
    'business.application.data-model.read',
    'business.feature.read',
    'business.capability.read',
    'business.feature.snapshot.read',
  ],
};

const DEMO_USERS = {
  'admin@techzone.io': { id: 'usr_admin_01', name: 'Super Administrateur', role: 'ADMIN' },
  'builder@techzone.io': { id: 'usr_builder_02', name: 'Studio Builder Techzone', role: 'BUILDER' },
  'guest@techzone.io': { id: 'usr_viewer_03', name: 'Lecteur Invité Entreprise', role: 'VIEWER' },
};

export function resolveRoleFromEmail(email) {
  const norm = (email || '').toLowerCase().trim();
  if (DEMO_USERS[norm]) return DEMO_USERS[norm].role;
  if (norm.includes('builder')) return 'BUILDER';
  if (norm.includes('viewer') || norm.includes('guest')) return 'VIEWER';
  return 'ADMIN';
}

export function resolveUserFromEmail(email, name) {
  const norm = (email || '').toLowerCase().trim();
  const known = DEMO_USERS[norm];
  if (known) return { id: known.id, email: norm, name: name || known.name, role: known.role };
  return {
    id: `usr_${norm.replace(/[^a-z0-9]/g, '').slice(0, 12) || 'local'}`,
    email: norm,
    name: name || norm.split('@')[0],
    role: resolveRoleFromEmail(norm),
  };
}

function safeRead(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key, value) {
  try {
    if (value === null || value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function setSession({ email, name, role }) {
  const user = resolveUserFromEmail(email, name);
  const finalRole = role || user.role;
  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: finalRole,
    permissions: ROLE_PERMISSIONS[finalRole] || [],
    tenantId: 'tenant-techzone-01',
  };
  return signJwt(payload, { secret: getSharedSecret() }).then((accessToken) => {
    safeWrite(ACCESS_TOKEN_KEY, accessToken);
    safeWrite(TOKEN_PAYLOAD_KEY, JSON.stringify(payload));
    return { accessToken, user: { ...user, role: finalRole, permissions: payload.permissions, tenantId: payload.tenantId } };
  });
}

export function getAccessToken() {
  const token = safeRead(ACCESS_TOKEN_KEY);
  if (!token) return null;
  if (isJwtExpired(token)) {
    clearAccessToken();
    return null;
  }
  return token;
}

export function getTokenPayload() {
  const raw = safeRead(TOKEN_PAYLOAD_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAccessToken() {
  safeWrite(ACCESS_TOKEN_KEY, null);
  safeWrite(TOKEN_PAYLOAD_KEY, null);
}

export function setServerSession({ accessToken, user }) {
  safeWrite(ACCESS_TOKEN_KEY, accessToken);
  safeWrite(TOKEN_PAYLOAD_KEY, JSON.stringify({ ...user, sub: user.id }));
  return { accessToken, user };
}

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL || '/api';
}

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

async function request(path, { method = 'GET', body, headers = {}, query, signal } = {}) {
  const base = getApiBaseUrl();
  let url = `${base}${path.startsWith('/') ? path : `/${path}`}`;

  if (query) {
    const qs = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      qs.append(k, String(v));
    });
    const search = qs.toString();
    if (search) url += `?${search}`;
  }

  const finalHeaders = {
    Accept: 'application/json',
    ...headers,
  };

  const token = getAccessToken();
  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  let payload;
  if (body !== undefined && body !== null) {
    finalHeaders['Content-Type'] = finalHeaders['Content-Type'] || 'application/json';
    payload = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: payload,
    signal,
    credentials: 'include',
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      (data && (data.message || (Array.isArray(data.message) ? data.message.join(', ') : null))) ||
      res.statusText ||
      `HTTP ${res.status}`;
    throw new ApiError(message, res.status, data);
  }

  return data;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  del: (path, options) => request(path, { ...options, method: 'DELETE' }),

  // Server authentication and IAM
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  listUsers: () => request('/auth/users'),
  createUser: (payload) => request('/auth/users', { method: 'POST', body: payload }),

  // Persistent Pack Manager aggregate
  listPacks: () => request('/v1/pack-manager/packs'),
  getPack: (packId) => request(`/v1/pack-manager/packs/${packId}`),
  createPack: (payload) => request('/v1/pack-manager/packs', { method: 'POST', body: payload }),
  updatePack: (packId, payload) => request(`/v1/pack-manager/packs/${packId}`, { method: 'PATCH', body: payload }),
  listPackVersions: (packId) => request(`/v1/pack-manager/packs/${packId}/versions`),
  createPackVersion: (packId, payload) => request(`/v1/pack-manager/packs/${packId}/versions`, { method: 'POST', body: payload }),
  getPackVersion: (versionId) => request(`/v1/pack-manager/versions/${versionId}`),
  updatePackVersion: (versionId, payload) => request(`/v1/pack-manager/versions/${versionId}`, { method: 'PATCH', body: payload }),
  replacePackVersionState: (versionId, payload) => request(`/v1/pack-manager/versions/${versionId}/state`, { method: 'PATCH', body: payload }),

  // Applications
  listApplications: (query = {}) => request('/v1/business-manager/applications', { query }),
  getApplication: (id) => request(`/v1/business-manager/applications/${id}`),
  createApplication: (payload) => request('/v1/business-manager/applications', { method: 'POST', body: payload }),
  updateApplication: (id, payload) => request(`/v1/business-manager/applications/${id}`, { method: 'PATCH', body: payload }),
  archiveApplication: (id, payload = {}) => request(`/v1/business-manager/applications/${id}/archive`, { method: 'POST', body: payload }),
  dashboardStats: () => request('/v1/business-manager/applications/stats'),
  recentApplications: () => request('/v1/business-manager/applications/recent'),

  // Lifecycle
  getApplicationTransitions: (applicationId) => request(`/v1/business-manager/applications/${applicationId}/transitions`),
  transitionApplication: (applicationId, payload) => request(`/v1/business-manager/applications/${applicationId}/transition`, { method: 'POST', body: payload }),

  // Versions
  listVersions: (applicationId, query = {}) =>
    request(`/v1/business-manager/applications/${applicationId}/versions`, { query }),
  createVersion: (applicationId, payload) => request(`/v1/business-manager/applications/${applicationId}/versions`, { method: 'POST', body: payload }),
  getPublishedVersion: (applicationId) => request(`/v1/business-manager/applications/${applicationId}/versions/published`),
  getDraftVersion: (applicationId) => request(`/v1/business-manager/applications/${applicationId}/versions/draft`),
  getVersion: (applicationId, versionId) =>
    request(`/v1/business-manager/applications/${applicationId}/versions/${versionId}`),
  getVersionSnapshot: (applicationId, versionId) =>
    request(`/v1/business-manager/applications/${applicationId}/versions/${versionId}/snapshot`),
  compareVersions: (applicationId, versionId, otherVersionId) =>
    request(`/v1/business-manager/applications/${applicationId}/versions/${versionId}/compare/${otherVersionId}`),

  // Validation, publication and rollback
  validateVersion: (applicationId, versionId, payload = {}) => request(`/v1/business-manager/applications/${applicationId}/versions/${versionId}/validate`, { method: 'POST', body: payload }),
  publishVersion: (applicationId, versionId, payload = {}) => request(`/v1/business-manager/applications/${applicationId}/versions/${versionId}/publish`, { method: 'POST', body: payload }),
  listPublications: (applicationId, query = {}) => request(`/v1/business-manager/applications/${applicationId}/publications`, { query }),
  rollbackApplication: (applicationId, payload) => request(`/v1/business-manager/applications/${applicationId}/rollback`, { method: 'POST', body: payload }),

  // Activity / Audit
  listActivity: (applicationId, query = {}) =>
    request(`/v1/business-manager/applications/${applicationId}/activity`, { query }),
  recentActivity: (applicationId) =>
    request(`/v1/business-manager/applications/${applicationId}/activity/recent`),

  // Data models
  createDataModel: (applicationId, versionId, payload) => request(`/v1/business-manager/applications/${applicationId}/versions/${versionId}/models`, { method: 'POST', body: payload }),
  listDataModels: (applicationId, versionId) => request(`/v1/business-manager/applications/${applicationId}/versions/${versionId}/models`),
  getDataModel: (applicationId, versionId, modelId) => request(`/v1/business-manager/applications/${applicationId}/versions/${versionId}/models/${modelId}`),
  validateDataModel: (applicationId, versionId, modelId, payload = {}) => request(`/v1/business-manager/applications/${applicationId}/versions/${versionId}/models/${modelId}/validate`, { method: 'POST', body: payload }),
  getDataModelDependencies: (applicationId, versionId, modelId) => request(`/v1/business-manager/applications/${applicationId}/versions/${versionId}/models/${modelId}/dependencies`),
  getDataModelImpact: (applicationId, versionId, modelId, field) => request(`/v1/business-manager/applications/${applicationId}/versions/${versionId}/models/${modelId}/impact`, { query: { field } }),

  // Features and capabilities
  listFeatures: (query = {}) => request('/v1/business-manager/features', { query }),
  createFeature: (payload) => request('/v1/business-manager/features', { method: 'POST', body: payload }),
  getFeature: (featureId) => request(`/v1/business-manager/features/${featureId}`),
  updateFeature: (featureId, payload) => request(`/v1/business-manager/features/${featureId}`, { method: 'PATCH', body: payload }),
  deprecateFeature: (featureId, payload = {}) => request(`/v1/business-manager/features/${featureId}/deprecate`, { method: 'POST', body: payload }),
  archiveFeature: (featureId, payload = {}) => request(`/v1/business-manager/features/${featureId}/archive`, { method: 'POST', body: payload }),
  getFeatureCapabilities: (featureId) => request(`/v1/business-manager/features/${featureId}/capabilities`),
  attachFeatureCapability: (featureId, payload) => request(`/v1/business-manager/features/${featureId}/capabilities`, { method: 'POST', body: payload }),
  detachFeatureCapability: (featureId, capabilityId) => request(`/v1/business-manager/features/${featureId}/capabilities/${capabilityId}`, { method: 'DELETE' }),
  listCapabilities: (query = {}) => request('/v1/business-manager/capabilities', { query }),
  createCapability: (payload) => request('/v1/business-manager/capabilities', { method: 'POST', body: payload }),
  getCapability: (capabilityId) => request(`/v1/business-manager/capabilities/${capabilityId}`),
  updateCapability: (capabilityId, payload) => request(`/v1/business-manager/capabilities/${capabilityId}`, { method: 'PATCH', body: payload }),
  deprecateCapability: (capabilityId, payload = {}) => request(`/v1/business-manager/capabilities/${capabilityId}/deprecate`, { method: 'POST', body: payload }),
  archiveCapability: (capabilityId, payload = {}) => request(`/v1/business-manager/capabilities/${capabilityId}/archive`, { method: 'POST', body: payload }),
  getCapabilityDependencies: (capabilityId) => request(`/v1/business-manager/capabilities/${capabilityId}/dependencies`),
  addCapabilityDependency: (capabilityId, payload) => request(`/v1/business-manager/capabilities/${capabilityId}/dependencies`, { method: 'POST', body: payload }),
  removeCapabilityDependency: (capabilityId, dependencyId) => request(`/v1/business-manager/capabilities/${capabilityId}/dependencies/${dependencyId}`, { method: 'DELETE' }),
  getCapabilityRequirements: (capabilityId) => request(`/v1/business-manager/capabilities/${capabilityId}/requirements`),
  addCapabilityRequirement: (capabilityId, payload) => request(`/v1/business-manager/capabilities/${capabilityId}/requirements`, { method: 'POST', body: payload }),
  removeCapabilityRequirement: (capabilityId, requirementId) => request(`/v1/business-manager/capabilities/${capabilityId}/requirements/${requirementId}`, { method: 'DELETE' }),
  listVersionFeatures: (versionId) => request(`/v1/business-manager/application-versions/${versionId}/features`),
  enableVersionFeature: (versionId, featureId, payload = {}) => request(`/v1/business-manager/application-versions/${versionId}/features/${featureId}/enable`, { method: 'POST', body: payload }),
  disableVersionFeature: (versionId, featureId, payload = {}) => request(`/v1/business-manager/application-versions/${versionId}/features/${featureId}/disable`, { method: 'POST', body: payload }),
  setVersionFeatureExperimental: (versionId, featureId, payload = {}) => request(`/v1/business-manager/application-versions/${versionId}/features/${featureId}/experimental`, { method: 'POST', body: payload }),
  listVersionCapabilities: (versionId) => request(`/v1/business-manager/application-versions/${versionId}/capabilities`),
  enableVersionCapability: (versionId, capabilityId, payload = {}) => request(`/v1/business-manager/application-versions/${versionId}/capabilities/${capabilityId}/enable`, { method: 'POST', body: payload }),
  disableVersionCapability: (versionId, capabilityId, payload = {}) => request(`/v1/business-manager/application-versions/${versionId}/capabilities/${capabilityId}/disable`, { method: 'POST', body: payload }),
  cloneVersionFeatures: (versionId, payload) => request(`/v1/business-manager/application-versions/${versionId}/features/clone`, { method: 'POST', body: payload }),
  validateVersionFeatures: (versionId, payload = {}) => request(`/v1/business-manager/application-versions/${versionId}/features/validate`, { method: 'POST', body: payload }),
  getVersionFeatureSnapshot: (versionId) => request(`/v1/business-manager/application-versions/${versionId}/features/snapshot`),
  createVersionFeatureSnapshot: (versionId, payload = {}) => request(`/v1/business-manager/application-versions/${versionId}/features/snapshot`, { method: 'POST', body: payload }),
  getCapabilityDisableImpact: (versionId, capabilityId) => request(`/v1/business-manager/application-versions/${versionId}/capabilities/${capabilityId}/disable-impact`),

  // Menus and navigation
  listMenus: (query = {}) => request('/v1/business-manager/menus', { query }),
  createMenu: (payload) => request('/v1/business-manager/menus', { method: 'POST', body: payload }),
  getMenu: (id) => request(`/v1/business-manager/menus/${id}`),
  updateMenu: (id, payload) => request(`/v1/business-manager/menus/${id}`, { method: 'PATCH', body: payload }),
  archiveMenu: (id, payload = {}) => request(`/v1/business-manager/menus/${id}/archive`, { method: 'POST', body: payload }),
  listMenuItems: (menuId) => request(`/v1/business-manager/menus/${menuId}/items`),
  createMenuItem: (menuId, payload) => request(`/v1/business-manager/menus/${menuId}/items`, { method: 'POST', body: payload }),
  updateMenuItem: (id, payload) => request(`/v1/business-manager/menu-items/${id}`, { method: 'PATCH', body: payload }),
  moveMenuItem: (id, payload) => request(`/v1/business-manager/menu-items/${id}/move`, { method: 'POST', body: payload }),
  reorderMenuItems: (menuId, payload) => request(`/v1/business-manager/menus/${menuId}/items/reorder`, { method: 'POST', body: payload }),
  getMenuItemRequirements: (id) => request(`/v1/business-manager/menu-items/${id}/requirements`),
  addMenuItemFeature: (id, payload) => request(`/v1/business-manager/menu-items/${id}/features`, { method: 'POST', body: payload }),
  addMenuItemCapability: (id, payload) => request(`/v1/business-manager/menu-items/${id}/capabilities`, { method: 'POST', body: payload }),
  enableVersionMenu: (versionId, menuId) => request(`/v1/business-manager/application-versions/${versionId}/menus/${menuId}/enable`, { method: 'POST' }),
  disableVersionMenu: (versionId, menuId) => request(`/v1/business-manager/application-versions/${versionId}/menus/${menuId}/disable`, { method: 'POST' }),
  previewNavigation: (versionId, location) => request(`/v1/business-manager/application-versions/${versionId}/navigation/preview`, { query: { location } }),
  validateNavigation: (versionId, payload = {}) => request(`/v1/business-manager/application-versions/${versionId}/navigation/validate`, { method: 'POST', body: payload }),
  getNavigationSnapshot: (versionId) => request(`/v1/business-manager/application-versions/${versionId}/navigation/snapshot`),

  // Runtime integrations
  listIntegrations: () => request('/v1/business-manager/integrations'),
  createIntegration: (payload) => request('/v1/business-manager/integrations', { method: 'POST', body: payload }),
  listIntegrationBindings: (versionId) => request(`/v1/business-manager/application-versions/${versionId}/integration-bindings`),
  createIntegrationBinding: (versionId, payload) => request(`/v1/business-manager/application-versions/${versionId}/integration-bindings`, { method: 'POST', body: payload }),
  updateIntegrationBinding: (id, payload) => request(`/v1/business-manager/integration-bindings/${id}`, { method: 'PATCH', body: payload }),
  validateIntegrationBinding: (id, payload = {}) => request(`/v1/business-manager/integration-bindings/${id}/validate`, { method: 'POST', body: payload }),
  testIntegrationBinding: (id, payload = {}) => request(`/v1/business-manager/integration-bindings/${id}/test`, { method: 'POST', body: payload }),
  enableIntegrationBinding: (id) => request(`/v1/business-manager/integration-bindings/${id}/enable`, { method: 'POST' }),
  disableIntegrationBinding: (id) => request(`/v1/business-manager/integration-bindings/${id}/disable`, { method: 'POST' }),

  // Configuration and metadata
  listConfigDefinitions: (query = {}) => request('/v1/business-manager/configuration/definitions', { query }),
  createConfigDefinition: (payload) => request('/v1/business-manager/configuration/definitions', { method: 'POST', body: payload }),
  updateConfigDefinition: (id, payload) => request(`/v1/business-manager/configuration/definitions/${id}`, { method: 'PATCH', body: payload }),
  setApplicationConfig: (applicationId, code, payload) => request(`/v1/business-manager/applications/${applicationId}/configuration/${code}`, { method: 'PUT', body: payload }),
  setVersionConfig: (versionId, code, payload) => request(`/v1/business-manager/application-versions/${versionId}/configuration/${code}`, { method: 'PUT', body: payload }),
  removeVersionConfig: (versionId, code) => request(`/v1/business-manager/application-versions/${versionId}/configuration/${code}`, { method: 'DELETE' }),
  resolveVersionConfig: (versionId, query = {}) => request(`/v1/business-manager/application-versions/${versionId}/configuration/resolved`, { query }),
  explainVersionConfig: (versionId, code, query = {}) => request(`/v1/business-manager/application-versions/${versionId}/configuration/${code}/explain`, { query }),
  validateVersionConfig: (versionId, payload = {}) => request(`/v1/business-manager/application-versions/${versionId}/configuration/validate`, { method: 'POST', body: payload }),
  diffConfig: (sourceVersionId, targetVersionId) => request(`/v1/business-manager/application-versions/${sourceVersionId}/configuration/diff/${targetVersionId}`),
  snapshotVersionConfig: (versionId, payload = {}) => request(`/v1/business-manager/application-versions/${versionId}/configuration/snapshot`, { method: 'POST', body: payload }),
  listMetadataDefinitions: () => request('/v1/business-manager/metadata/definitions'),
  createMetadataDefinition: (payload) => request('/v1/business-manager/metadata/definitions', { method: 'POST', body: payload }),
  getResourceMetadata: (type, id) => request(`/v1/business-manager/resources/${type}/${id}/metadata`),
  setResourceMetadata: (type, id, code, payload) => request(`/v1/business-manager/resources/${type}/${id}/metadata/${code}`, { method: 'PUT', body: payload }),

  // Runtime bridge
  getRuntimeManifest: (versionId) => request(`/v1/business-manager/application-versions/${versionId}/runtime-manifest`),
  getRuntimeReadiness: (versionId) => request(`/v1/business-manager/application-versions/${versionId}/runtime-readiness`),
  validateRuntimeReadiness: (versionId, payload = {}) => request(`/v1/business-manager/application-versions/${versionId}/runtime-readiness/validate`, { method: 'POST', body: payload }),
  generateContracts: (versionId, payload = {}) => request(`/v1/business-manager/application-versions/${versionId}/contracts`, { method: 'POST', body: payload }),
  listContracts: (versionId) => request(`/v1/business-manager/application-versions/${versionId}/contracts`),
  getContract: (versionId, type) => request(`/v1/business-manager/application-versions/${versionId}/contracts/${type}`),
  createRuntimeSnapshot: (versionId, query = {}) => request(`/v1/business-manager/application-versions/${versionId}/runtime-snapshot`, { method: 'POST', query }),
  getRuntimeSnapshot: (versionId, query = {}) => request(`/v1/business-manager/application-versions/${versionId}/runtime-snapshot`, { query }),

  // Quality
  runQualityCampaign: (versionId, payload) => request(`/v1/business-manager/application-versions/${versionId}/quality/campaigns`, { method: 'POST', body: payload }),
  listQualityCampaigns: (versionId) => request(`/v1/business-manager/application-versions/${versionId}/quality/campaigns`),
  getQualityReport: (campaignId) => request(`/v1/business-manager/quality/campaigns/${campaignId}/report`),
  getQualityGate: (versionId) => request(`/v1/business-manager/application-versions/${versionId}/quality/gate`),
  requestQualityWaiver: (versionId, payload) => request(`/v1/business-manager/application-versions/${versionId}/quality/waivers`, { method: 'POST', body: payload }),
  approveQualityWaiver: (waiverId, payload = {}) => request(`/v1/business-manager/quality/waivers/${waiverId}/approve`, { method: 'POST', body: payload }),
};

export default api;

export { ACCESS_TOKEN_KEY, TOKEN_PAYLOAD_KEY };