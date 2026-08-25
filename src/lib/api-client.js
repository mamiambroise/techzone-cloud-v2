let currentRole = "ADMIN";
let currentActor = {
  id: "usr_admin_01",
  name: "Administrateur Business",
  email: "admin@businessmanager.io"
};
export function setCurrentUserRole(role) {
  currentRole = role;
  if (role === "BUILDER") {
    currentActor = {
      id: "usr_builder_02",
      name: "Builder Studio",
      email: "builder@businessmanager.io"
    };
  } else if (role === "VIEWER") {
    currentActor = {
      id: "usr_viewer_03",
      name: "Lecteur Invité",
      email: "guest@businessmanager.io"
    };
  } else {
    currentActor = {
      id: "usr_admin_01",
      name: "Administrateur Business",
      email: "admin@businessmanager.io"
    };
  }
}
export function getCurrentUserRole() {
  return currentRole;
}
export function getCurrentActor() {
  return {
    ...currentActor,
    role: currentRole
  };
}
async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  headers.set("x-user-role", currentRole);
  headers.set("x-actor-id", currentActor.id);
  headers.set("x-actor-name", currentActor.name);
  headers.set("x-actor-email", currentActor.email);
  try {
    const res = await fetch(path, {
      ...options,
      headers
    });
    const data = await res.json();
    return data;
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        code: "NETWORK_ERROR",
        message: error.message || "Échec de la communication avec le serveur"
      },
      meta: {
        trace_id: "client_err"
      }
    };
  }
}
export const api = {
  // Stats
  getDashboardStats: () => request("/api/v1/business-manager/stats"),
  seedDemo: () => request("/api/v1/business-manager/seed", {
    method: "POST"
  }),
  // Applications
  listApplications: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.set(k, String(v));
    });
    return request(`/api/v1/business-manager/applications?${query.toString()}`);
  },
  getApplication: id => request(`/api/v1/business-manager/applications/${id}`),
  createApplication: payload => request("/api/v1/business-manager/applications", {
    method: "POST",
    body: JSON.stringify(payload)
  }),
  updateApplication: (id, payload) => request(`/api/v1/business-manager/applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  }),
  archiveApplication: id => request(`/api/v1/business-manager/applications/${id}/archive`, {
    method: "POST"
  }),
  // Lifecycle
  getTransitions: id => request(`/api/v1/business-manager/applications/${id}/transitions`),
  transitionStatus: (id, targetStatus, comment, expectedVersion) => request(`/api/v1/business-manager/applications/${id}/transition`, {
    method: "POST",
    body: JSON.stringify({
      targetStatus,
      comment,
      expectedVersion
    })
  }),
  // Clone
  cloneApplication: (id, payload) => request(`/api/v1/business-manager/applications/${id}/clone`, {
    method: "POST",
    body: JSON.stringify(payload)
  }),
  // Versions
  listVersions: appId => request(`/api/v1/business-manager/applications/${appId}/versions`),
  getVersion: (appId, versionId) => request(`/api/v1/business-manager/applications/${appId}/versions/${versionId}`),
  createVersion: (appId, payload) => request(`/api/v1/business-manager/applications/${appId}/versions`, {
    method: "POST",
    body: JSON.stringify(payload)
  }),
  compareVersions: (appId, v1, v2) => request(`/api/v1/business-manager/applications/${appId}/versions/${v1}/compare/${v2}`),
  // Validation
  validateVersion: (appId, versionId) => request(`/api/v1/business-manager/applications/${appId}/versions/${versionId}/validate`, {
    method: "POST"
  }),
  // Publication
  publishVersion: (appId, versionId, environment) => request(`/api/v1/business-manager/applications/${appId}/versions/${versionId}/publish`, {
    method: "POST",
    body: JSON.stringify({
      environment
    })
  }),
  // Rollback
  rollbackVersion: (appId, targetVersionId, environment) => request(`/api/v1/business-manager/applications/${appId}/rollback`, {
    method: "POST",
    body: JSON.stringify({
      targetVersionId,
      environment
    })
  }),
  // Activity
  getApplicationActivity: (appId, params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.set(k, String(v));
    });
    return request(`/api/v1/business-manager/applications/${appId}/activity?${query.toString()}`);
  },
  getGlobalActivity: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.set(k, String(v));
    });
    return request(`/api/v1/business-manager/activity?${query.toString()}`);
  }
};