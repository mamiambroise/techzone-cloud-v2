// Techzone Cloud — REST API client (Backend NestJS).
// Base URL is proxied by Vite at "/api" → backend in dev.
// Auth: the NestJS backend is the sole JWT issuer. The browser never receives
// or embeds the signing secret.

import { isJwtExpired } from "./jwt";

let accessTokenInMemory = null;
let tokenPayloadInMemory = null;

export function setSession({ email, name, role }) {
  return request("/v1/auth/session", {
    method: "POST",
    body: { email, name },
  }).then(({ accessToken, user }) => {
    accessTokenInMemory = accessToken;
    tokenPayloadInMemory = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      tenantId: user.tenantId,
    };
    return { accessToken, user };
  });
}

export function getAccessToken() {
  const token = accessTokenInMemory;
  if (!token) return null;
  if (isJwtExpired(token)) {
    clearAccessToken();
    return null;
  }
  return token;
}

export function getTokenPayload() {
  return tokenPayloadInMemory;
}

export function clearAccessToken() {
  accessTokenInMemory = null;
  tokenPayloadInMemory = null;
}

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL || "/api";
}

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

async function request(
  path,
  { method = "GET", body, headers = {}, query, signal } = {},
) {
  const base = getApiBaseUrl();
  let url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  if (query) {
    const qs = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      qs.append(k, String(v));
    });
    const search = qs.toString();
    if (search) url += `?${search}`;
  }

  const finalHeaders = {
    Accept: "application/json",
    ...headers,
  };

  const token = getAccessToken();
  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  let payload;
  if (body !== undefined && body !== null) {
    finalHeaders["Content-Type"] =
      finalHeaders["Content-Type"] || "application/json";
    payload = typeof body === "string" ? body : JSON.stringify(body);
  }

  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: payload,
    signal,
    credentials: "include",
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
      (data &&
        (data.message ||
          (Array.isArray(data.message) ? data.message.join(", ") : null))) ||
      res.statusText ||
      `HTTP ${res.status}`;
    throw new ApiError(message, res.status, data);
  }

  return data;
}

const unwrap = (response) => response?.data ?? response;

export const api = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) =>
    request(path, { ...options, method: "POST", body }),
  patch: (path, body, options) =>
    request(path, { ...options, method: "PATCH", body }),
  put: (path, body, options) =>
    request(path, { ...options, method: "PUT", body }),
  del: (path, options) => request(path, { ...options, method: "DELETE" }),

  // Applications
  listApplications: (query = {}) =>
    request("/v1/business-manager/applications", { query }),
  getApplication: (id) => request(`/v1/business-manager/applications/${id}`),
  createApplication: (payload) =>
    request("/v1/business-manager/applications", {
      method: "POST",
      body: payload,
    }),
  updateApplication: (id, payload) =>
    request(`/v1/business-manager/applications/${id}`, {
      method: "PATCH",
      body: payload,
    }),
  archiveApplication: (id) =>
    request(`/v1/business-manager/applications/${id}/archive`, {
      method: "POST",
    }),
  transitionApplication: (id, targetStatus) =>
    request(`/v1/business-manager/applications/${id}/transition`, {
      method: "POST",
      body: { targetStatus },
    }).then(unwrap),
  dashboardStats: () => request("/v1/business-manager/applications/stats"),
  recentApplications: () => request("/v1/business-manager/applications/recent"),

  // Versions
  listVersions: (applicationId) =>
    request(`/v1/business-manager/applications/${applicationId}/versions`),
  getVersion: (applicationId, versionId) =>
    request(
      `/v1/business-manager/applications/${applicationId}/versions/${versionId}`,
    ),
  getVersionSnapshot: (applicationId, versionId) =>
    request(
      `/v1/business-manager/applications/${applicationId}/versions/${versionId}/snapshot`,
    ),
  createBusinessVersion: (applicationId, payload) =>
    request(`/v1/business-manager/applications/${applicationId}/versions`, {
      method: "POST",
      body: payload,
    }).then(unwrap),
  validateBusinessVersion: (applicationId, versionId) =>
    request(
      `/v1/business-manager/applications/${applicationId}/versions/${versionId}/validate`,
      { method: "POST" },
    ).then(unwrap),
  publishBusinessVersion: (applicationId, versionId, environment) =>
    request(
      `/v1/business-manager/applications/${applicationId}/versions/${versionId}/publish`,
      { method: "POST", body: { environment } },
    ).then(unwrap),
  rollbackBusinessVersion: (applicationId, versionId, environment) =>
    request(`/v1/business-manager/applications/${applicationId}/rollback`, {
      method: "POST",
      body: { versionId, environment },
    }).then(unwrap),

  // Activity / Audit
  listActivity: (applicationId, query = {}) =>
    request(`/v1/business-manager/applications/${applicationId}/activity`, {
      query,
    }),
  recentActivity: (applicationId) =>
    request(
      `/v1/business-manager/applications/${applicationId}/activity/recent`,
    ),

  // Features & Capabilities
  listFeatures: (query = {}) =>
    request("/v1/business-manager/features", { query }),
  listCapabilities: (query = {}) =>
    request("/v1/business-manager/capabilities", { query }),

  // Menus
  listMenus: (query = {}) => request("/v1/business-manager/menus", { query }),

  // Configuration
  listConfigDefinitions: (query = {}) =>
    request("/v1/business-manager/configuration/definitions", { query }),
  listRuntimeIntegrations: () => request("/v1/business-manager/integrations"),

  // Data Model Manager
  listDataModels: (applicationId, versionId) =>
    request(
      `/v1/business-manager/applications/${applicationId}/versions/${versionId}/models`,
    ),
  getDataModel: (applicationId, versionId, modelId) =>
    request(
      `/v1/business-manager/applications/${applicationId}/versions/${versionId}/models/${modelId}`,
    ),
  createDataModel: (applicationId, versionId, payload) =>
    request(
      `/v1/business-manager/applications/${applicationId}/versions/${versionId}/models`,
      { method: "POST", body: payload },
    ).then(unwrap),
  validateDataModel: (applicationId, versionId, modelId) =>
    request(
      `/v1/business-manager/applications/${applicationId}/versions/${versionId}/models/${modelId}/validate`,
      { method: "POST" },
    ).then(unwrap),
  runQualityCampaign: (versionId, mode) =>
    request(
      `/v1/business-manager/application-versions/${versionId}/quality/campaigns`,
      { method: "POST", body: { mode } },
    ).then(unwrap),
  listQualityCampaigns: (versionId) =>
    request(`/v1/business-manager/application-versions/${versionId}/quality/campaigns`).then(unwrap),
  getQualityGate: (versionId) =>
    request(`/v1/business-manager/application-versions/${versionId}/quality/gate`).then(unwrap),
  getQualityReport: (campaignId) =>
    request(`/v1/business-manager/quality/campaigns/${campaignId}/report`).then(unwrap),

  // Pack Manager (PM-CDC-01..07)
  packDashboard: () => request("/pack-manager/dashboard").then(unwrap),
  listPacks: (query = {}) =>
    request("/pack-manager/packs", { query }).then(unwrap),
  getPack: (id) => request(`/pack-manager/packs/${id}`).then(unwrap),
  createPack: (payload) =>
    request("/pack-manager/packs", { method: "POST", body: payload }).then(
      unwrap,
    ),
  updatePack: (id, payload) =>
    request(`/pack-manager/packs/${id}`, {
      method: "PATCH",
      body: payload,
    }).then(unwrap),
  archivePack: (id, reason) =>
    request(`/pack-manager/packs/${id}/archive`, {
      method: "POST",
      body: { reason },
    }).then(unwrap),
  restorePack: (id) =>
    request(`/pack-manager/packs/${id}/restore`, { method: "POST" }).then(
      unwrap,
    ),
  listPackVersions: (packId) =>
    request(`/pack-manager/packs/${packId}/versions`).then(unwrap),
  createPackVersion: (packId, payload) =>
    request(`/pack-manager/packs/${packId}/versions`, {
      method: "POST",
      body: payload,
    }).then(unwrap),
  updatePackVersion: (id, payload) =>
    request(`/pack-manager/versions/${id}`, {
      method: "PATCH",
      body: payload,
    }).then(unwrap),
  addPackModule: (versionId, payload) =>
    request(`/pack-manager/versions/${versionId}/modules`, {
      method: "POST",
      body: payload,
    }).then(unwrap),
  listPackModules: (versionId) =>
    request(`/pack-manager/versions/${versionId}/modules`).then(unwrap),
  addPackFeature: (versionId, payload) =>
    request(`/pack-manager/versions/${versionId}/features`, {
      method: "POST",
      body: payload,
    }).then(unwrap),
  listPackFeatures: (versionId) =>
    request(`/pack-manager/versions/${versionId}/features`).then(unwrap),
  createPackCapability: (payload) =>
    request("/pack-manager/capabilities", {
      method: "POST",
      body: payload,
    }).then(unwrap),
  listPackCapabilities: () =>
    request("/pack-manager/capabilities").then(unwrap),
  addPackDependency: (versionId, payload) =>
    request(`/pack-manager/versions/${versionId}/dependencies`, {
      method: "POST",
      body: payload,
    }).then(unwrap),
  listPackDependencies: (versionId) =>
    request(`/pack-manager/versions/${versionId}/dependencies`).then(unwrap),
  addPackRule: (versionId, payload) =>
    request(`/pack-manager/versions/${versionId}/rules`, {
      method: "POST",
      body: payload,
    }).then(unwrap),
  listPackRules: (versionId) =>
    request(`/pack-manager/versions/${versionId}/rules`).then(unwrap),
  validatePackVersion: (versionId) =>
    request(`/pack-manager/versions/${versionId}/validate`, {
      method: "POST",
    }).then(unwrap),
  generatePackManifest: (versionId) =>
    request(`/pack-manager/versions/${versionId}/manifest`, {
      method: "POST",
    }).then(unwrap),
  publishPackVersion: (versionId) =>
    request(`/pack-manager/versions/${versionId}/publish`, {
      method: "POST",
    }).then(unwrap),

  // Pack Runtime (PR-CDC-00..07)
  resolveRuntime: (payload) =>
    request("/runtime/resolve", { method: "POST", body: payload }).then(unwrap),
  runtimeDashboard: () => request("/runtime/dashboard").then(unwrap),
  listRuntimeResolutions: () => request("/runtime/resolutions").then(unwrap),
  getRuntimeResolution: (id) =>
    request(`/runtime/resolutions/${id}`).then(unwrap),
  getEffectiveManifest: (resolutionId) =>
    request(`/runtime/resolutions/${resolutionId}/effective-manifest`).then(
      unwrap,
    ),
  getRuntimeDiagnostics: (resolutionId) =>
    request(`/runtime/resolutions/${resolutionId}/diagnostics`).then(unwrap),
  getRuntimeCacheStatus: () => request("/runtime/cache/status").then(unwrap),
  listRuntimeCacheEntries: () => request("/runtime/cache/entries").then(unwrap),
  invalidateRuntimeCache: (payload) =>
    request("/runtime/cache/invalidate", {
      method: "POST",
      body: payload,
    }).then(unwrap),
  getRuntimeProvidersHealth: () =>
    request("/runtime/providers/health").then(unwrap),
  getRuntimeResilienceStatus: () =>
    request("/runtime/resilience/status").then(unwrap),
  reresolveRuntime: (id) =>
    request(`/runtime/resolutions/${id}/reresolve`, { method: "POST" }).then(
      unwrap,
    ),
};

export default api;
