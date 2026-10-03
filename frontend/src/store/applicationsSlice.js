import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  getApplications as getApplicationsApi,
  createApplication as createApplicationApi,
  updateApplication as updateApplicationApi,
  archiveApplication as archiveApplicationApi,
} from '../services/api/platformApplicationsService.js';

export const VERSION_LIFECYCLE = [
  'DRAFT',
  'CONFIGURING',
  'VALIDATING',
  'READY',
  'ACTIVE',
  'SUPERSEDED',
  'DEPRECATED',
  'ARCHIVED',
];

// REAL DATA ONLY : le catalogue démarre vide et se remplit uniquement
// via l'API réelle (fetchApplicationsAsync → /business-manager/applications).
const initialApplications = [];

const initialVersions = [];

export const fetchApplicationsAsync = createAsyncThunk(
  'applications/fetchApplications',
  async (_, { getState }) => {
    const { providerMode } = getState().integration;
    if (providerMode === 'MOCK') {
      return { skipped: true };
    }
    return getApplicationsApi();
  }
);

export const addApplicationAsync = createAsyncThunk(
  'applications/addApplication',
  async (body, { getState }) => {
    const { providerMode } = getState().integration;
    if (providerMode === 'MOCK') {
      return { skipped: true };
    }
    return createApplicationApi(body);
  }
);

export const updateApplicationAsync = createAsyncThunk(
  'applications/updateApplication',
  async ({ id, body }, { getState }) => {
    const { providerMode } = getState().integration;
    if (providerMode === 'MOCK') {
      return { skipped: true };
    }
    return updateApplicationApi(id, body);
  }
);

export const archiveApplicationAsync = createAsyncThunk(
  'applications/archiveApplication',
  async (id, { getState }) => {
    const { providerMode } = getState().integration;
    if (providerMode === 'MOCK') {
      return { skipped: true };
    }
    return archiveApplicationApi(id);
  }
);

const applicationsSlice = createSlice({
  name: 'applications',
  initialState: {
    applications: initialApplications,
    versions: initialVersions,
    selectedAppId: null,
  },
  reducers: {
    setSelectedAppId: (state, action) => {
      state.selectedAppId = action.payload;
    },
    addApplication: (state, action) => {
      const newApp = {
        id: 'app-' + action.payload.code.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'ACTIVE',
        tags: action.payload.tags || ['Custom'],
        ...action.payload,
      };
      state.applications.unshift(newApp);
      state.selectedAppId = newApp.id;

      // Also create an initial DRAFT version 1.0.0
      state.versions.unshift({
        id: `ver-${newApp.code.toLowerCase()}-1.0.0`,
        applicationId: newApp.id,
        version: '1.0.0-draft',
        status: 'DRAFT',
        releaseNotes: 'Version initiale DRAFT générée automatiquement.',
        createdFrom: null,
        createdAt: new Date().toISOString(),
        publishedAt: null,
        contractsUsed: ['PF-CONTR-001@1.0.0'],
      });
    },
    updateApplication: (state, action) => {
      const idx = state.applications.findIndex((a) => a.id === action.payload.id);
      if (idx !== -1) {
        state.applications[idx] = {
          ...state.applications[idx],
          ...action.payload,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    archiveApplication: (state, action) => {
      const app = state.applications.find((a) => a.id === action.payload);
      if (app) {
        app.status = 'ARCHIVED';
        app.updatedAt = new Date().toISOString();
      }
    },
    addVersion: (state, action) => {
      state.versions.unshift({
        id: 'ver-' + Date.now(),
        createdAt: new Date().toISOString(),
        publishedAt: action.payload.status === 'ACTIVE' ? new Date().toISOString() : null,
        ...action.payload,
      });
    },
    updateVersionStatus: (state, action) => {
      const { versionId, newStatus } = action.payload;
      const ver = state.versions.find((v) => v.id === versionId);
      if (ver) {
        ver.status = newStatus;
        if (newStatus === 'ACTIVE') {
          ver.publishedAt = new Date().toISOString();
          // Supersede older active versions of this app
          state.versions.forEach((v) => {
            if (v.applicationId === ver.applicationId && v.id !== ver.id && v.status === 'ACTIVE') {
              v.status = 'SUPERSEDED';
            }
          });
        }
      }
    },
    cloneVersion: (state, action) => {
      const { sourceVersionId, newVersionNumber, releaseNotes } = action.payload;
      const source = state.versions.find((v) => v.id === sourceVersionId);
      if (source) {
        const cloned = {
          id: `ver-${source.applicationId}-${newVersionNumber.replace(/[^a-zA-Z0-9.-]/g, '')}`,
          applicationId: source.applicationId,
          version: newVersionNumber,
          status: 'DRAFT',
          releaseNotes: releaseNotes || `Cloné depuis ${source.version}.`,
          createdFrom: source.id,
          createdAt: new Date().toISOString(),
          publishedAt: null,
          contractsUsed: [...source.contractsUsed],
        };
        state.versions.unshift(cloned);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchApplicationsAsync.fulfilled, (state, action) => {
        if (!action.payload.skipped && action.payload) {
          state.applications = action.payload;
        }
      })
      .addCase(addApplicationAsync.fulfilled, (state, action) => {
        if (!action.payload.skipped && action.payload) {
          const newApp = {
            ...action.payload,
            appNumber: action.payload.code,
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
            lastModifiedDate: action.payload.updatedAt ? new Date(action.payload.updatedAt).toLocaleString('fr-FR') : '—',
            lastModifiedText: '—',
            iconType: 'Boxes',
            tags: [],
            category: '—',
            categoryColor: 'bg-slate-50 text-slate-600 border-slate-200',
          };
          state.applications.unshift(newApp);
          state.selectedAppId = newApp.id;
        }
      })
      .addCase(updateApplicationAsync.fulfilled, (state, action) => {
        if (!action.payload.skipped && action.payload) {
          const idx = state.applications.findIndex((a) => a.id === action.payload.id);
          if (idx !== -1) {
            state.applications[idx] = {
              ...state.applications[idx],
              ...action.payload,
              lastModifiedDate: action.payload.updatedAt ? new Date(action.payload.updatedAt).toLocaleString('fr-FR') : state.applications[idx].lastModifiedDate,
            };
          }
        }
      })
      .addCase(archiveApplicationAsync.fulfilled, (state, action) => {
        if (!action.payload.skipped && action.payload) {
          const idx = state.applications.findIndex((a) => a.id === action.payload.id);
          if (idx !== -1) {
            state.applications[idx].status = 'ARCHIVÉE';
          }
        }
      });
  },
});

export const {
  setSelectedAppId,
  addApplication,
  updateApplication,
  archiveApplication,
  addVersion,
  updateVersionStatus,
  cloneVersion,
} = applicationsSlice.actions;

export default applicationsSlice.reducer;
