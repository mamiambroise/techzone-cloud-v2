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

  // Applications
  listApplications: (query = {}) => request('/v1/business-manager/applications', { query }),
  getApplication: (id) => request(`/v1/business-manager/applications/${id}`),
  createApplication: (payload) => request('/v1/business-manager/applications', { method: 'POST', body: payload }),
  updateApplication: (id, payload) => request(`/v1/business-manager/applications/${id}`, { method: 'PATCH', body: payload }),
  archiveApplication: (id) => request(`/v1/business-manager/applications/${id}/archive`, { method: 'POST' }),
  dashboardStats: () => request('/v1/business-manager/applications/stats'),
  recentApplications: () => request('/v1/business-manager/applications/recent'),

  // Versions
  listVersions: (applicationId) =>
    request(`/v1/business-manager/applications/${applicationId}/versions`),
  getVersion: (applicationId, versionId) =>
    request(`/v1/business-manager/applications/${applicationId}/versions/${versionId}`),
  getVersionSnapshot: (applicationId, versionId) =>
    request(`/v1/business-manager/applications/${applicationId}/versions/${versionId}/snapshot`),

  // Activity / Audit
  listActivity: (applicationId, query = {}) =>
    request(`/v1/business-manager/applications/${applicationId}/activity`, { query }),
  recentActivity: (applicationId) =>
    request(`/v1/business-manager/applications/${applicationId}/activity/recent`),

  // Features & Capabilities
  listFeatures: (query = {}) => request('/v1/business-manager/features', { query }),
  listCapabilities: (query = {}) => request('/v1/business-manager/capabilities', { query }),

  // Menus
  listMenus: (query = {}) => request('/v1/business-manager/menus', { query }),

  // Configuration
  listConfigDefinitions: (query = {}) =>
    request('/v1/business-manager/configuration/definitions', { query }),
};

export default api;

export { ACCESS_TOKEN_KEY, TOKEN_PAYLOAD_KEY };