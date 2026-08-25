import {
  ApiResponse,
  ApplicationModel,
  ApplicationStatus,
  ApplicationVersionModel,
  Environment,
  PublicationModel,
  ActivityEventModel,
  ValidationResult,
  UserRole,
} from "./types/domain";

let currentRole: UserRole = "ADMIN";
let currentActor = {
  id: "usr_admin_01",
  name: "Administrateur Business",
  email: "admin@businessmanager.io",
};

export function setCurrentUserRole(role: UserRole) {
  currentRole = role;
  if (role === "BUILDER") {
    currentActor = {
      id: "usr_builder_02",
      name: "Builder Studio",
      email: "builder@businessmanager.io",
    };
  } else if (role === "VIEWER") {
    currentActor = {
      id: "usr_viewer_03",
      name: "Lecteur Invité",
      email: "guest@businessmanager.io",
    };
  } else {
    currentActor = {
      id: "usr_admin_01",
      name: "Administrateur Business",
      email: "admin@businessmanager.io",
    };
  }
}

export function getCurrentUserRole(): UserRole {
  return currentRole;
}

export function getCurrentActor() {
  return { ...currentActor, role: currentRole };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  headers.set("x-user-role", currentRole);
  headers.set("x-actor-id", currentActor.id);
  headers.set("x-actor-name", currentActor.name);
  headers.set("x-actor-email", currentActor.email);

  try {
    const res = await fetch(path, {
      ...options,
      headers,
    });
    const data: ApiResponse<T> = await res.json();
    return data;
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: {
        code: "NETWORK_ERROR",
        message: error.message || "Échec de la communication avec le serveur",
      },
      meta: {
        trace_id: "client_err",
      },
    };
  }
}

export const api = {
  // Stats
  getDashboardStats: () => request<any>("/api/v1/business-manager/stats"),
  seedDemo: () => request<any>("/api/v1/business-manager/seed", { method: "POST" }),

  // Applications
  listApplications: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.set(k, String(v));
    });
    return request<ApplicationModel[]>(`/api/v1/business-manager/applications?${query.toString()}`);
  },

  getApplication: (id: string) =>
    request<ApplicationModel>(`/api/v1/business-manager/applications/${id}`),

  createApplication: (payload: any) =>
    request<ApplicationModel>("/api/v1/business-manager/applications", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateApplication: (id: string, payload: any) =>
    request<ApplicationModel>(`/api/v1/business-manager/applications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  archiveApplication: (id: string) =>
    request<ApplicationModel>(`/api/v1/business-manager/applications/${id}/archive`, {
      method: "POST",
    }),

  // Lifecycle
  getTransitions: (id: string) =>
    request<{ currentStatus: ApplicationStatus; allowedTransitions: ApplicationStatus[] }>(
      `/api/v1/business-manager/applications/${id}/transitions`
    ),

  transitionStatus: (id: string, targetStatus: ApplicationStatus, comment?: string, expectedVersion?: number) =>
    request<ApplicationModel>(`/api/v1/business-manager/applications/${id}/transition`, {
      method: "POST",
      body: JSON.stringify({ targetStatus, comment, expectedVersion }),
    }),

  // Clone
  cloneApplication: (id: string, payload: { newName: string; newCode: string; description?: string; category?: string; icon?: string }) =>
    request<ApplicationModel>(`/api/v1/business-manager/applications/${id}/clone`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Versions
  listVersions: (appId: string) =>
    request<ApplicationVersionModel[]>(`/api/v1/business-manager/applications/${appId}/versions`),

  getVersion: (appId: string, versionId: string) =>
    request<ApplicationVersionModel>(`/api/v1/business-manager/applications/${appId}/versions/${versionId}`),

  createVersion: (appId: string, payload: { versionNumber: string; comment?: string; sourceVersionId?: string; snapshot?: any }) =>
    request<ApplicationVersionModel>(`/api/v1/business-manager/applications/${appId}/versions`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  compareVersions: (appId: string, v1: string, v2: string) =>
    request<any>(`/api/v1/business-manager/applications/${appId}/versions/${v1}/compare/${v2}`),

  listPublications: (appId: string) =>
    request<PublicationModel[]>(`/api/v1/business-manager/applications/${appId}/publications`),

  discardVersion: (appId: string, versionId: string) =>
    request<any>(`/api/v1/business-manager/applications/${appId}/versions/${versionId}/discard`, {
      method: "POST",
    }),

  // Validation
  validateVersion: (appId: string, versionId: string) =>
    request<ValidationResult>(`/api/v1/business-manager/applications/${appId}/versions/${versionId}/validate`, {
      method: "POST",
    }),

  // Publication
  publishVersion: (appId: string, versionId: string, environment?: Environment) =>
    request<any>(`/api/v1/business-manager/applications/${appId}/versions/${versionId}/publish`, {
      method: "POST",
      body: JSON.stringify({ environment }),
    }),

  // Rollback
  rollbackVersion: (appId: string, targetVersionId: string, environment?: Environment) =>
    request<any>(`/api/v1/business-manager/applications/${appId}/rollback`, {
      method: "POST",
      body: JSON.stringify({ targetVersionId, environment }),
    }),

  // Activity
  getApplicationActivity: (appId: string, params: { page?: number; limit?: number; eventType?: string } = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.set(k, String(v));
    });
    return request<ActivityEventModel[]>(`/api/v1/business-manager/applications/${appId}/activity?${query.toString()}`);
  },

  getGlobalActivity: (params: { page?: number; limit?: number; eventType?: string } = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.set(k, String(v));
    });
    return request<ActivityEventModel[]>(`/api/v1/business-manager/activity?${query.toString()}`);
  },
};

// ============================================================
// P0.2 — Data Model Manager API client
// ============================================================
const dmBase = (appId: string, versionId: string) =>
  `/api/v1/business-manager/applications/${appId}/versions/${versionId}/data-model`;

export const dm = {
  // Entities
  listEntities: (a: string, v: string, search?: string) =>
    request<any[]>(`${dmBase(a, v)}/entities${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  createEntity: (a: string, v: string, payload: any) =>
    request<any>(`${dmBase(a, v)}/entities`, { method: "POST", body: JSON.stringify(payload) }),
  getEntity: (a: string, v: string, e: string) => request<any>(`${dmBase(a, v)}/entities/${e}`),
  updateEntity: (a: string, v: string, e: string, payload: any) =>
    request<any>(`${dmBase(a, v)}/entities/${e}`, { method: "PATCH", body: JSON.stringify(payload) }),
  duplicateEntity: (a: string, v: string, e: string) =>
    request<any>(`${dmBase(a, v)}/entities/${e}/duplicate`, { method: "POST" }),
  archiveEntity: (a: string, v: string, e: string) =>
    request<any>(`${dmBase(a, v)}/entities/${e}/archive`, { method: "POST" }),

  // Fields
  listFields: (a: string, v: string, e: string) => request<any[]>(`${dmBase(a, v)}/entities/${e}/fields`),
  createField: (a: string, v: string, e: string, payload: any) =>
    request<any>(`${dmBase(a, v)}/entities/${e}/fields`, { method: "POST", body: JSON.stringify(payload) }),
  updateField: (a: string, v: string, e: string, fieldId: string, payload: any) =>
    request<any>(`${dmBase(a, v)}/entities/${e}/fields/update`, { method: "POST", body: JSON.stringify({ fieldId, ...payload }) }),
  archiveField: (a: string, v: string, e: string, fieldId: string) =>
    request<any>(`${dmBase(a, v)}/entities/${e}/fields/archive`, { method: "POST", body: JSON.stringify({ fieldId }) }),
  reorderFields: (a: string, v: string, e: string, orderedIds: string[]) =>
    request<any>(`${dmBase(a, v)}/entities/${e}/fields/reorder`, { method: "POST", body: JSON.stringify({ orderedIds }) }),

  // Relations
  listRelations: (a: string, v: string) => request<any[]>(`${dmBase(a, v)}/relations`),
  createRelation: (a: string, v: string, payload: any) =>
    request<any>(`${dmBase(a, v)}/relations`, { method: "POST", body: JSON.stringify(payload) }),
  updateRelation: (a: string, v: string, relationId: string, payload: any) =>
    request<any>(`${dmBase(a, v)}/relations/update`, { method: "POST", body: JSON.stringify({ relationId, ...payload }) }),
  removeRelation: (a: string, v: string, relationId: string) =>
    request<any>(`${dmBase(a, v)}/relations/update`, { method: "POST", body: JSON.stringify({ relationId, action: "remove" }) }),

  // Constraints / Indexes / Validations
  listConstraints: (a: string, v: string, entityId: string) => request<any[]>(`${dmBase(a, v)}/constraints?entityId=${entityId}`),
  saveConstraint: (a: string, v: string, payload: any) =>
    request<any>(`${dmBase(a, v)}/constraints`, { method: "POST", body: JSON.stringify(payload) }),
  listIndexes: (a: string, v: string, entityId: string) => request<any[]>(`${dmBase(a, v)}/indexes?entityId=${entityId}`),
  saveIndex: (a: string, v: string, payload: any) =>
    request<any>(`${dmBase(a, v)}/indexes`, { method: "POST", body: JSON.stringify(payload) }),
  listValidations: (a: string, v: string, fieldId?: string) =>
    request<any[]>(`${dmBase(a, v)}/validations${fieldId ? `?fieldId=${fieldId}` : ""}`),
  saveValidation: (a: string, v: string, payload: any) =>
    request<any>(`${dmBase(a, v)}/validations`, { method: "POST", body: JSON.stringify(payload) }),

  // Registry & Schema
  getDataTypes: (a: string, v: string) => request<any[]>(`${dmBase(a, v)}/data-types`),
  getSchema: (a: string, v: string) => request<any>(`${dmBase(a, v)}/schema`),
  validateSchema: (a: string, v: string) => request<any>(`${dmBase(a, v)}/schema/validate`, { method: "POST" }),
  getDependencies: (a: string, v: string) => request<any>(`${dmBase(a, v)}/schema/dependencies`),
  getDependenciesOf: (a: string, v: string, objectType: string, objectId: string) =>
    request<any>(`${dmBase(a, v)}/schema/dependencies?objectType=${objectType}&objectId=${objectId}`),
  impactAnalysis: (a: string, v: string, change: any) =>
    request<any>(`${dmBase(a, v)}/schema/impact`, { method: "POST", body: JSON.stringify(change) }),
  getChanges: (a: string, v: string, base?: string) =>
    request<any>(`${dmBase(a, v)}/schema/changes${base ? `?base=${base}` : ""}`),

  // Migration / Templates / Export
  createMigrationPlan: (a: string, v: string, sourceVersionId: string) =>
    request<any>(`${dmBase(a, v)}/migration-plans`, { method: "POST", body: JSON.stringify({ sourceVersionId }) }),
  listTemplates: (a: string, v: string) => request<any[]>(`${dmBase(a, v)}/templates`),
  applyTemplate: (a: string, v: string, templateId: string) =>
    request<any>(`${dmBase(a, v)}/templates`, { method: "POST", body: JSON.stringify({ templateId }) }),
  exportSchema: (a: string, v: string) => request<any>(`${dmBase(a, v)}/export`),
};
