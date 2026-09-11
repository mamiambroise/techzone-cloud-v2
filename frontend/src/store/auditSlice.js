import { createSlice } from '@reduxjs/toolkit';

const initialLogs = [
  {
    id: 'aud-101',
    traceId: 'trc-9823-4410',
    actor: 'alex.admin@techzone.io',
    role: 'PLATFORM_SUPER_ADMIN',
    action: 'LOCK_CONTRACT',
    resourceType: 'CONTRACT',
    resourceId: 'PF-CONTR-001@1.0.0',
    details: 'Verrouillage officiel du Platform Contract v1 pour Team 4 et consommateurs.',
    tenantId: 'tenant-core-global',
    status: 'SUCCESS',
    timestamp: '2026-06-15T09:00:00Z',
  },
  {
    id: 'aud-102',
    traceId: 'trc-7721-3912',
    actor: 'alex.admin@techzone.io',
    role: 'PLATFORM_SUPER_ADMIN',
    action: 'CREATE_SNAPSHOT',
    resourceType: 'SNAPSHOT',
    resourceId: 'SNP-PROD-2026-06',
    details: 'Génération du snapshot de référence production avec calcul de hash canonique.',
    tenantId: 'tenant-core-global',
    status: 'SUCCESS',
    timestamp: '2026-06-15T02:00:00Z',
  },
  {
    id: 'aud-103',
    traceId: 'trc-5541-8890',
    actor: 'c.leroy@techzone.io',
    role: 'TEAM4_DEVELOPER',
    action: 'CREATE_VERSION',
    resourceType: 'APPLICATION_VERSION',
    resourceId: 'ver-core-1.2.0-rc1',
    details: 'Création de la version candidate avec support OpenTelemetry.',
    tenantId: 'tenant-core-global',
    status: 'SUCCESS',
    timestamp: '2026-08-25T11:30:00Z',
  },
  {
    id: 'aud-104',
    traceId: 'trc-3319-2041',
    actor: 'n.blanc@techzone.io',
    role: 'QA_AUTOMATION_LEAD',
    action: 'DEPLOY_ENV',
    resourceType: 'ENVIRONMENT',
    resourceId: 'TEST',
    details: 'Déploiement de ver-core-1.2.0-rc1 sur TEST pour exécution des tests de régression.',
    tenantId: 'tenant-core-global',
    status: 'SUCCESS',
    timestamp: '2026-08-26T09:00:00Z',
  },
  {
    id: 'aud-105',
    traceId: 'trc-1190-4492',
    actor: 'c.leroy@techzone.io',
    role: 'TEAM4_DEVELOPER',
    action: 'UPDATE_CONFIG',
    resourceType: 'CONFIG',
    resourceId: 'cfg-tenant-2',
    details: 'Définition d’un override de débit spécifique pour tenant-logistics-de.',
    tenantId: 'tenant-logistics-de',
    status: 'SUCCESS',
    timestamp: '2026-08-01T09:40:00Z',
  },
];

const auditSlice = createSlice({
  name: 'audit',
  initialState: {
    logs: initialLogs,
    filterAction: 'ALL',
  },
  reducers: {
    logAuditAction: (state, action) => {
      state.logs.unshift({
        id: 'aud-' + Date.now(),
        traceId: 'trc-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000),
        timestamp: new Date().toISOString(),
        status: action.payload.status || 'SUCCESS',
        ...action.payload,
      });
    },
    setFilterAction: (state, action) => {
      state.filterAction = action.payload;
    },
    clearAuditLogs: (state) => {
      state.logs = [];
    },
  },
});

export const { logAuditAction, setFilterAction, clearAuditLogs } = auditSlice.actions;
export default auditSlice.reducer;
