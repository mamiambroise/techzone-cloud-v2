import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  getEnvironments,
  createEnvironment,
  updateEnvironment,
  getEnvironmentHistory,
} from '../api/platform/environmentsApi.js';

const initialEnvironments = [
  {
    id: 'env-dev',
    code: 'DEVELOPMENT',
    name: 'Environnement de Développement (DEV)',
    type: 'DEVELOPMENT',
    status: 'ACTIVE',
    region: 'eu-west-3 (Paris)',
    baseUrl: 'https://api.dev.techzone.internal',
    configurationRef: 'cfg-scope-env-dev',
    securityTier: 'LOW',
    accessRule: 'Accès développeur autorisé sans restriction IAM.',
    allowedRoles: ['PLATFORM_SUPER_ADMIN', 'TEAM4_DEVELOPER', 'QA_AUTOMATION_LEAD'],
    deployedApps: [
      { appId: 'app-core-api', appCode: 'CORE-API', versionId: 'ver-core-1.2.0-rc1', versionNumber: '1.2.0-rc1', deployedAt: '2026-08-25T14:00:00Z' },
      { appId: 'app-identity-bridge', appCode: 'ID-BRIDGE', versionId: 'ver-id-2.1.0', versionNumber: '2.1.0', deployedAt: '2026-03-15T16:00:00Z' },
      { appId: 'app-erp-connector', appCode: 'ERP-SYNC', versionId: 'ver-erp-1.5.0-draft', versionNumber: '1.5.0-draft', deployedAt: '2026-09-01T15:30:00Z' },
      { appId: 'app-events-bus', appCode: 'EVT-BUS', versionId: 'ver-evt-1.0.0', versionNumber: '1.0.0', deployedAt: '2026-04-18T09:30:00Z' },
    ],
    history: [
      { id: 'h1', action: 'DEPLOY', details: 'Déploiement de ver-erp-1.5.0-draft', timestamp: '2026-09-01T15:30:00Z', user: 'c.leroy@techzone.io' },
      { id: 'h2', action: 'STATUS_CHANGE', details: 'Passage en ACTIVE suite à maintenance', timestamp: '2026-08-20T08:00:00Z', user: 'alex.admin@techzone.io' },
    ],
  },
  {
    id: 'env-test',
    code: 'TEST',
    name: 'Environnement de Test & QA (TEST)',
    type: 'TEST',
    status: 'ACTIVE',
    region: 'eu-west-3 (Paris)',
    baseUrl: 'https://api.test.techzone.internal',
    configurationRef: 'cfg-scope-env-test',
    securityTier: 'MEDIUM',
    accessRule: 'Accès QA & automatisation de tests d’intégration.',
    allowedRoles: ['PLATFORM_SUPER_ADMIN', 'QA_AUTOMATION_LEAD'],
    deployedApps: [
      { appId: 'app-core-api', appCode: 'CORE-API', versionId: 'ver-core-1.2.0-rc1', versionNumber: '1.2.0-rc1', deployedAt: '2026-08-26T09:00:00Z' },
      { appId: 'app-identity-bridge', appCode: 'ID-BRIDGE', versionId: 'ver-id-2.1.0', versionNumber: '2.1.0', deployedAt: '2026-03-15T16:00:00Z' },
      { appId: 'app-erp-connector', appCode: 'ERP-SYNC', versionId: 'ver-erp-1.4.2', versionNumber: '1.4.2', deployedAt: '2026-05-20T11:00:00Z' },
      { appId: 'app-events-bus', appCode: 'EVT-BUS', versionId: 'ver-evt-1.0.0', versionNumber: '1.0.0', deployedAt: '2026-04-18T09:30:00Z' },
    ],
    history: [
      { id: 'h3', action: 'DEPLOY', details: 'Déploiement de ver-core-1.2.0-rc1 pour suite de tests de non-régression', timestamp: '2026-08-26T09:00:00Z', user: 'n.blanc@techzone.io' },
    ],
  },
  {
    id: 'env-staging',
    code: 'STAGING',
    name: 'Pré-production / Staging Miroir',
    type: 'STAGING',
    status: 'ACTIVE',
    region: 'eu-west-1 (Irlande)',
    baseUrl: 'https://api.staging.techzone.cloud',
    configurationRef: 'cfg-scope-env-staging',
    securityTier: 'HIGH',
    accessRule: 'Accès restreint. Validation finale avant bascule Production.',
    allowedRoles: ['PLATFORM_SUPER_ADMIN'],
    deployedApps: [
      { appId: 'app-core-api', appCode: 'CORE-API', versionId: 'ver-core-1.1.0', versionNumber: '1.1.0', deployedAt: '2026-06-12T10:00:00Z' },
      { appId: 'app-identity-bridge', appCode: 'ID-BRIDGE', versionId: 'ver-id-2.1.0', versionNumber: '2.1.0', deployedAt: '2026-03-15T16:00:00Z' },
      { appId: 'app-erp-connector', appCode: 'ERP-SYNC', versionId: 'ver-erp-1.4.2', versionNumber: '1.4.2', deployedAt: '2026-05-20T11:00:00Z' },
      { appId: 'app-events-bus', appCode: 'EVT-BUS', versionId: 'ver-evt-1.0.0', versionNumber: '1.0.0', deployedAt: '2026-04-18T09:30:00Z' },
    ],
    history: [
      { id: 'h4', action: 'DEPLOY', details: 'Mise en staging de ver-core-1.1.0', timestamp: '2026-06-12T10:00:00Z', user: 'alex.admin@techzone.io' },
    ],
  },
  {
    id: 'env-prod',
    code: 'PRODUCTION',
    name: 'Production Haute Disponibilité (PROD)',
    type: 'PRODUCTION',
    status: 'ACTIVE',
    region: 'eu-west-1 (Irlande multi-AZ)',
    baseUrl: 'https://api.techzone.cloud',
    configurationRef: 'cfg-scope-env-prod',
    securityTier: 'CRITICAL',
    accessRule: 'Accès fortement restreint. Double validation IAM et Snapshot obligatoire.',
    allowedRoles: ['PLATFORM_SUPER_ADMIN'],
    deployedApps: [
      { appId: 'app-core-api', appCode: 'CORE-API', versionId: 'ver-core-1.1.0', versionNumber: '1.1.0', deployedAt: '2026-06-15T02:00:00Z' },
      { appId: 'app-identity-bridge', appCode: 'ID-BRIDGE', versionId: 'ver-id-2.1.0', versionNumber: '2.1.0', deployedAt: '2026-03-20T04:00:00Z' },
      { appId: 'app-erp-connector', appCode: 'ERP-SYNC', versionId: 'ver-erp-1.4.2', versionNumber: '1.4.2', deployedAt: '2026-05-22T03:00:00Z' },
      { appId: 'app-events-bus', appCode: 'EVT-BUS', versionId: 'ver-evt-1.0.0', versionNumber: '1.0.0', deployedAt: '2026-04-20T02:00:00Z' },
    ],
    history: [
      { id: 'h5', action: 'AUDIT', details: 'Audit de sécurité trimestriel validé sans vulnérabilité critique', timestamp: '2026-07-01T10:00:00Z', user: 's.germain@techzone.io' },
    ],
  },
];

export const fetchEnvironmentsAsync = createAsyncThunk(
  'environments/fetchEnvironments',
  async (_, { getState }) => {
    const { providerMode } = getState().platform;
    if (providerMode === 'MOCK') {
      return { skipped: true };
    }
    return getEnvironments();
  }
);

export const addEnvironmentAsync = createAsyncThunk(
  'environments/addEnvironment',
  async (body, { getState }) => {
    const { providerMode } = getState().platform;
    if (providerMode === 'MOCK') {
      return { skipped: true };
    }
    return createEnvironment(body);
  }
);

export const updateEnvironmentAsync = createAsyncThunk(
  'environments/updateEnvironment',
  async ({ id, body }, { getState }) => {
    const { providerMode } = getState().platform;
    if (providerMode === 'MOCK') {
      return { skipped: true };
    }
    return updateEnvironment(id, body);
  }
);

export const setEnvironmentStatusAsync = createAsyncThunk(
  'environments/setEnvironmentStatus',
  async ({ id, status }, { getState }) => {
    const { providerMode } = getState().platform;
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
    selectedEnvId: 'env-prod',
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
