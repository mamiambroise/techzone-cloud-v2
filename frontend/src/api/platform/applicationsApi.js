import apiClient from '../client.js';

const BACKEND_TO_FRONTEND_STATUS = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVÉE',
  DISABLED: 'SUSPENDUE',
};

const FRONTEND_TO_BACKEND_STATUS = {
  ACTIVE: 'ACTIVE',
  'EN TEST': 'ACTIVE',
  BROUILLON: 'ACTIVE',
  SUSPENDUE: 'DISABLED',
  ARCHIVÉE: 'ARCHIVED',
};

export function getApplications() {
  return apiClient.get('/api/platform/applications').then((res) => {
    const items = Array.isArray(res) ? res : res.data || [];
    return items.map((app) => ({
      ...app,
      status: BACKEND_TO_FRONTEND_STATUS[app.status] || app.status,
      appNumber: app.code,
      activeVersion: '—',
      workspaceState: '—',
      workspaceVersion: '—',
      workspaceConfigPct: 0,
      owner: '—',
      ownerInitials: '—',
      team: [],
      teamExtraCount: 0,
      lastModifiedBy: '—',
      lastModifiedUserInitials: '—',
      lastModifiedDate: app.updatedAt ? new Date(app.updatedAt).toLocaleString('fr-FR') : '—',
      lastModifiedText: '—',
      iconType: 'Boxes',
      tags: [],
      category: '—',
      categoryColor: 'bg-slate-50 text-slate-600 border-slate-200',
    }));
  });
}

export function createApplication(body) {
  const { status, ...uiOnly } = body;
  const backendStatus = FRONTEND_TO_BACKEND_STATUS[status] || 'ACTIVE';
  return apiClient.post('/api/platform/applications', {
    code: body.code,
    name: body.name,
    description: body.description || null,
    tenantScope: body.tenantScope,
  });
}

export function updateApplication(id, body) {
  const backendBody = {
    name: body.name,
    description: body.description,
    tenantScope: body.tenantScope,
  };
  return apiClient.patch(`/api/platform/applications/${id}`, backendBody);
}

export function archiveApplication(id) {
  return apiClient.post(`/api/platform/applications/${id}/archive`);
}
