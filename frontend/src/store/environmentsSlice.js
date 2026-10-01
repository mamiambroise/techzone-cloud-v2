import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  getEnvironments,
  createEnvironment,
  updateEnvironment,
  getEnvironmentHistory,
} from '../services/api/platformEnvironmentsService.js';

// REAL DATA ONLY : les environnements affichés proviennent exclusivement
// de l'API réelle (fetchEnvironmentsAsync → /business-manager/environments).
// Aucun DEV/STAGING/PROD inventé côté client.
const initialEnvironments = [];

export const fetchEnvironmentsAsync = createAsyncThunk(
  'environments/fetchEnvironments',
  async (_, { getState }) => {
    const { providerMode } = getState().integration;
    if (providerMode === 'MOCK') {
      return { skipped: true };
    }
    return getEnvironments();
  }
);

export const addEnvironmentAsync = createAsyncThunk(
  'environments/addEnvironment',
  async (body, { getState }) => {
    const { providerMode } = getState().integration;
    if (providerMode === 'MOCK') {
      return { skipped: true };
    }
    return createEnvironment(body);
  }
);

export const updateEnvironmentAsync = createAsyncThunk(
  'environments/updateEnvironment',
  async ({ id, body }, { getState }) => {
    const { providerMode } = getState().integration;
    if (providerMode === 'MOCK') {
      return { skipped: true };
    }
    return updateEnvironment(id, body);
  }
);

export const setEnvironmentStatusAsync = createAsyncThunk(
  'environments/setEnvironmentStatus',
  async ({ id, status }, { getState }) => {
    const { providerMode } = getState().integration;
    if (providerMode === 'MOCK') {
      return { skipped: true };
    }
    return updateEnvironment(id, { status });
  }
);

const environmentsSlice = createSlice({
  name: 'environments',
  initialState: {
    environments: initialEnvironments,
    selectedEnvId: null,
  },
  reducers: {
    setSelectedEnvId: (state, action) => {
      state.selectedEnvId = action.payload;
    },
    setEnvironmentStatus: (state, action) => {
      const { envId, status, reason, user } = action.payload;
      const env = state.environments.find((e) => e.id === envId);
      if (env) {
        const oldStatus = env.status;
        env.status = status;
        env.history.unshift({
          id: 'h-' + Date.now(),
          action: 'STATUS_CHANGE',
          details: `Changement de statut: ${oldStatus} -> ${status}. Motif: ${reason || 'Non spécifié'}`,
          timestamp: new Date().toISOString(),
          user: user || 'system',
        });
      }
    },
    deployAppVersion: (state, action) => {
      const { envId, appId, appCode, versionId, versionNumber, user } = action.payload;
      const env = state.environments.find((e) => e.id === envId);
      if (env) {
        const existingIdx = env.deployedApps.findIndex((a) => a.appId === appId);
        const deployRecord = {
          appId,
          appCode,
          versionId,
          versionNumber,
          deployedAt: new Date().toISOString(),
        };
        if (existingIdx !== -1) {
          env.deployedApps[existingIdx] = deployRecord;
        } else {
          env.deployedApps.push(deployRecord);
        }
        env.history.unshift({
          id: 'h-' + Date.now(),
          action: 'DEPLOY',
          details: `Déploiement de ${appCode} (${versionNumber})`,
          timestamp: new Date().toISOString(),
          user: user || 'system',
        });
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEnvironmentsAsync.fulfilled, (state, action) => {
        if (!action.payload.skipped && action.payload) {
          state.environments = action.payload;
        }
      })
      .addCase(addEnvironmentAsync.fulfilled, (state, action) => {
        if (!action.payload.skipped && action.payload) {
          state.environments.unshift({
            ...action.payload,
            securityTier: action.payload.region === 'fr-par-1' ? 'TIER1' : action.payload.region === 'eu-west-1' ? 'TIER2' : 'TIER3',
            accessRule: 'IAM_RESTRICTED',
            allowedRoles: ['PLATFORM_SUPER_ADMIN', 'TEAM4_DEVELOPER', 'TEAM4_OPERATOR'],
            deployedApps: [],
            history: [],
          });
        }
      })
      .addCase(updateEnvironmentAsync.fulfilled, (state, action) => {
        if (!action.payload.skipped && action.payload) {
          const idx = state.environments.findIndex((e) => e.id === action.payload.id);
          if (idx !== -1) {
            state.environments[idx] = { ...state.environments[idx], ...action.payload };
          }
        }
      })
      .addCase(setEnvironmentStatusAsync.fulfilled, (state, action) => {
        if (!action.payload.skipped && action.payload) {
          const idx = state.environments.findIndex((e) => e.id === action.payload.id);
          if (idx !== -1) {
            state.environments[idx].status = action.payload.status;
          }
        }
      });
  },
});

export const { setSelectedEnvId, setEnvironmentStatus, deployAppVersion } = environmentsSlice.actions;
export default environmentsSlice.reducer;
