import { createSlice } from '@reduxjs/toolkit';

const initialReleases = [
  {
    id: 'rel-01',
    code: 'REL-2026-0901',
    appId: 'app-0001',
    appName: 'Commerce Core Engine',
    version: 'v2.4.0',
    status: 'ACTIVE_PROD',
    targetEnv: 'PRODUCTION',
    manifestHash: 'sha256:7f83b1657ff1fc53b92ccdc8ab5b4772d523651104786d5fb43d78c160cb0e58',
    sealedAt: '2026-09-02T16:20:00Z',
    strategy: 'BLUE_GREEN',
    activeSlot: 'BLUE',
    trafficWeight: 100,
    approvedBy: 'SecOps (Elena V.) & Release Master',
    artifactsCount: 14,
    sizeMb: 42.6,
    releaseNotes: 'Performance boost sur le checkout, conformité API-03 contractuelle et durcissement des rate limits.',
  },
  {
    id: 'rel-02',
    code: 'REL-2026-0902',
    appId: 'app-0002',
    appName: 'Restaurant & Hospitality Suite',
    version: 'v2.5.0-rc1',
    status: 'IN_STAGING',
    targetEnv: 'STAGING',
    manifestHash: 'sha256:4a5c8910ebf712908fae08924bce00918cf230018a9018e0018ff90192837482',
    sealedAt: '2026-09-03T10:15:00Z',
    strategy: 'CANARY',
    activeSlot: 'GREEN',
    trafficWeight: 20,
    approvedBy: 'Lead QA (Thomas B.)',
    artifactsCount: 18,
    sizeMb: 58.2,
    releaseNotes: 'Intégration du système de commande tactile et conciliation temps réel avec ERP Adapter.',
  },
  {
    id: 'rel-03',
    code: 'REL-2026-0903',
    appId: 'app-0003',
    appName: 'Automotive & Fleet Hub',
    version: 'v1.8.4',
    status: 'ACTIVE_PROD',
    targetEnv: 'PRODUCTION',
    manifestHash: 'sha256:c18b76023d8721ef9a128e470098f451000109283fa716091823746190283471',
    sealedAt: '2026-09-01T14:40:00Z',
    strategy: 'ROLLING',
    activeSlot: 'DEFAULT',
    trafficWeight: 100,
    approvedBy: 'DevOps Lead (Sarah C.)',
    artifactsCount: 9,
    sizeMb: 31.0,
    releaseNotes: 'Correctif télématique OBD-II et compression d\'historique des trajets.',
  },
  {
    id: 'rel-04',
    code: 'REL-2026-0904',
    appId: 'app-0004',
    appName: 'Enterprise Logistics & Supply',
    version: 'v3.0.0-beta',
    status: 'TESTING',
    targetEnv: 'TEST',
    manifestHash: 'sha256:e83921008f102938475610293847561029384756102938475610293847561029',
    sealedAt: '2026-09-04T02:00:00Z',
    strategy: 'ROLLING',
    activeSlot: 'DEFAULT',
    trafficWeight: 100,
    approvedBy: 'En cours de validation QA',
    artifactsCount: 22,
    sizeMb: 74.5,
    releaseNotes: 'Refonte de l\'algorithme de tournée et dispatch multi-dépôts.',
  },
];

const initialDeployments = [
  {
    id: 'dep-101',
    traceId: 'dep-trace-2026-9901',
    releaseCode: 'REL-2026-0901',
    version: 'v2.4.0',
    appName: 'Commerce Core Engine',
    environment: 'PRODUCTION',
    strategy: 'BLUE_GREEN',
    status: 'SUCCEEDED',
    startedAt: '2026-09-02T16:22:00Z',
    durationSeconds: 42,
    deployedBy: 'pipeline-runner-prod',
    rollbackReady: true,
    snapshotRef: 'snap-2026-09-02-prod-base',
  },
  {
    id: 'dep-102',
    traceId: 'dep-trace-2026-9902',
    releaseCode: 'REL-2026-0902',
    version: 'v2.5.0-rc1',
    appName: 'Restaurant & Hospitality Suite',
    environment: 'STAGING',
    strategy: 'CANARY',
    status: 'RUNNING',
    startedAt: '2026-09-04T05:30:00Z',
    durationSeconds: 110,
    deployedBy: 'thomas.qa@techzone.cloud',
    rollbackReady: true,
    snapshotRef: 'snap-2026-09-03-staging-pre',
  },
  {
    id: 'dep-103',
    traceId: 'dep-trace-2026-9903',
    releaseCode: 'REL-2026-0899',
    version: 'v2.3.9',
    appName: 'Commerce Core Engine',
    environment: 'PRODUCTION',
    strategy: 'BLUE_GREEN',
    status: 'ROLLED_BACK',
    startedAt: '2026-08-30T11:00:00Z',
    durationSeconds: 18,
    deployedBy: 'auto-remediation-bot',
    rollbackReady: false,
    snapshotRef: 'snap-2026-08-30-rollback',
  },
];

const initialPromotionGates = [
  {
    id: 'gate-01',
    releaseId: 'rel-02',
    version: 'v2.5.0-rc1',
    appName: 'Restaurant & Hospitality Suite',
    fromEnv: 'STAGING',
    toEnv: 'PRODUCTION',
    status: 'PENDING_APPROVAL',
    requestedAt: '2026-09-04T05:45:00Z',
    requester: 'thomas.qa@techzone.cloud',
    checklist: {
      e2eTestsPassed: true,
      performanceSlaMet: true,
      securitySignOff: false,
      immutableSnapshotTaken: true,
      cabApproval: false,
    },
    metrics: {
      testPassRate: '100% (480/480)',
      p99LatencyMs: 142,
      errorRate: '0.00%',
    },
  },
  {
    id: 'gate-02',
    releaseId: 'rel-04',
    version: 'v3.0.0-beta',
    appName: 'Enterprise Logistics & Supply',
    fromEnv: 'TEST',
    toEnv: 'STAGING',
    status: 'APPROVED',
    requestedAt: '2026-09-03T18:30:00Z',
    requester: 'marc.dev@techzone.cloud',
    checklist: {
      e2eTestsPassed: true,
      performanceSlaMet: true,
      securitySignOff: true,
      immutableSnapshotTaken: true,
      cabApproval: true,
    },
    metrics: {
      testPassRate: '99.4% (318/320)',
      p99LatencyMs: 195,
      errorRate: '0.02%',
    },
  },
];

const initialRollbackCheckpoints = [
  {
    id: 'rb-01',
    snapshotId: 'snap-2026-09-02-prod-base',
    app: 'Commerce Core Engine',
    version: 'v2.3.8',
    environment: 'PRODUCTION',
    timestamp: '2026-09-02T16:20:00Z',
    hash: 'sha256:7f83b1657ff1fc53b92ccdc8ab5b4772d523651104786d5fb43d78c160cb0e58',
    status: 'VALIDATED',
    restoreTimeEstSeconds: 6.2,
    testedOn: '2026-09-03T02:00:00Z',
  },
  {
    id: 'rb-02',
    snapshotId: 'snap-2026-09-01-auto-prod',
    app: 'Automotive & Fleet Hub',
    version: 'v1.8.3',
    environment: 'PRODUCTION',
    timestamp: '2026-09-01T14:35:00Z',
    hash: 'sha256:91823746190283471c18b76023d8721ef9a128e470098f451000109283fa7160',
    status: 'VALIDATED',
    restoreTimeEstSeconds: 5.8,
    testedOn: '2026-09-02T10:00:00Z',
  },
];

const initialLogs = [
  {
    id: 'dlog-01',
    timestamp: '2026-09-04T05:30:15Z',
    traceId: 'dep-trace-2026-9902',
    level: 'INFO',
    stage: 'PRE_FLIGHT',
    message: 'Validation du manifeste scellé SHA-256 réussi. 18 artefacts vérifiés.',
  },
  {
    id: 'dlog-02',
    timestamp: '2026-09-04T05:30:22Z',
    traceId: 'dep-trace-2026-9902',
    level: 'INFO',
    stage: 'CONTAINER_ROLLOUT',
    message: 'Déploiement des 2 répliques Canary (Green cluster) sur STAGING.',
  },
  {
    id: 'dlog-03',
    timestamp: '2026-09-04T05:30:45Z',
    traceId: 'dep-trace-2026-9902',
    level: 'SUCCESS',
    stage: 'HEALTH_PROBE',
    message: 'Health probe HTTP 200 reçu sur /api/health (latence: 18ms).',
  },
  {
    id: 'dlog-04',
    timestamp: '2026-09-04T05:31:00Z',
    traceId: 'dep-trace-2026-9902',
    level: 'INFO',
    stage: 'TRAFFIC_SPLIT',
    message: 'Routage Canary activé : 20% du trafic dirigé vers Green (v2.5.0-rc1).',
  },
];

const initialState = {
  activeTab: 'cockpit', // 'contracts-v1' | 'cockpit' | 'releases' | 'pipelines' | 'promotions' | 'rollback' | 'diagnostics' | 'specifications'
  contractV1Locked: true,
  releases: initialReleases,
  deployments: initialDeployments,
  promotionGates: initialPromotionGates,
  rollbackCheckpoints: initialRollbackCheckpoints,
  logs: initialLogs,
  canaryTrafficWeight: 20,
  activeBlueGreenSlot: 'BLUE', // 'BLUE' (Live) or 'GREEN' (Standby)
  activeDeploymentExecution: {
    isRunning: false,
    progress: 100,
    currentStep: 'Complété',
    targetEnv: 'PRODUCTION',
    releaseCode: 'REL-2026-0901',
  },
};

export const deploymentSlice = createSlice({
  name: 'deployment',
  initialState,
  reducers: {
    setActiveDeploymentTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setCanaryTrafficWeight: (state, action) => {
      state.canaryTrafficWeight = action.payload;
      // Update in active release
      const rel = state.releases.find((r) => r.strategy === 'CANARY' && r.status === 'IN_STAGING');
      if (rel) {
        rel.trafficWeight = action.payload;
      }
    },
    switchBlueGreenSlot: (state) => {
      state.activeBlueGreenSlot = state.activeBlueGreenSlot === 'BLUE' ? 'GREEN' : 'BLUE';
      const rel = state.releases.find((r) => r.strategy === 'BLUE_GREEN' && r.status === 'ACTIVE_PROD');
      if (rel) {
        rel.activeSlot = state.activeBlueGreenSlot;
      }
      state.logs.unshift({
        id: `dlog-${Date.now()}`,
        timestamp: new Date().toISOString(),
        traceId: `bg-switch-${Date.now()}`,
        level: 'WARN',
        stage: 'TRAFFIC_CUTOVER',
        message: `Bascule Blue/Green effectuée en production : le slot ${state.activeBlueGreenSlot} est désormais en ligne à 100%.`,
      });
    },
    approvePromotionGate: (state, action) => {
      const { gateId, approverName } = action.payload;
      const gate = state.promotionGates.find((g) => g.id === gateId);
      if (gate) {
        gate.status = 'APPROVED';
        gate.checklist.securitySignOff = true;
        gate.checklist.cabApproval = true;
        state.logs.unshift({
          id: `dlog-${Date.now()}`,
          timestamp: new Date().toISOString(),
          traceId: `gate-app-${Date.now()}`,
          level: 'SUCCESS',
          stage: 'PROMOTION_APPROVAL',
          message: `Promotion vers ${gate.toEnv} approuvée pour ${gate.releaseId} (${gate.version}) par ${approverName}.`,
        });
      }
    },
    executeEmergencyRollback: (state, action) => {
      const { checkpointId, reason } = action.payload;
      const cp = state.rollbackCheckpoints.find((c) => c.id === checkpointId);
      if (cp) {
        state.deployments.unshift({
          id: `dep-${Date.now().toString().slice(-4)}`,
          traceId: `rollback-${Date.now()}`,
          releaseCode: `ROLLBACK-${cp.version}`,
          version: cp.version,
          appName: cp.app,
          environment: cp.environment,
          strategy: 'INSTANT_SNAPSHOT_RESTORE',
          status: 'SUCCEEDED',
          startedAt: new Date().toISOString(),
          durationSeconds: 5.4,
          deployedBy: 'emergency-rollback-trigger',
          rollbackReady: false,
          snapshotRef: cp.snapshotId,
        });

        state.logs.unshift({
          id: `dlog-${Date.now()}`,
          timestamp: new Date().toISOString(),
          traceId: `rollback-${Date.now()}`,
          level: 'ERROR',
          stage: 'ROLLBACK_EXECUTION',
          message: `ROLLBACK D'URGENCE EXÉCUTÉ avec succès sur ${cp.environment} vers le snapshot ${cp.snapshotId} (${cp.version}) en 5.4s. Raison : ${reason}`,
        });
      }
    },
    triggerNewDeployment: (state, action) => {
      const { releaseId, targetEnv, strategy } = action.payload;
      const rel = state.releases.find((r) => r.id === releaseId);
      if (rel) {
        const newDep = {
          id: `dep-${Date.now().toString().slice(-4)}`,
          traceId: `dep-trace-${Date.now()}`,
          releaseCode: rel.code,
          version: rel.version,
          appName: rel.appName,
          environment: targetEnv,
          strategy: strategy || rel.strategy,
          status: 'SUCCEEDED',
          startedAt: new Date().toISOString(),
          durationSeconds: 28,
          deployedBy: 'console-operator',
          rollbackReady: true,
          snapshotRef: `snap-${Date.now()}-auto`,
        };
        state.deployments.unshift(newDep);

        state.logs.unshift({
          id: `dlog-${Date.now()}`,
          timestamp: new Date().toISOString(),
          traceId: newDep.traceId,
          level: 'SUCCESS',
          stage: 'DEPLOYMENT_COMPLETE',
          message: `Déploiement de ${rel.appName} (${rel.version}) achevé avec succès sur ${targetEnv} en 28s.`,
        });
      }
    },
  },
});

export const {
  setActiveDeploymentTab,
  setCanaryTrafficWeight,
  switchBlueGreenSlot,
  approvePromotionGate,
  executeEmergencyRollback,
  triggerNewDeployment,
} = deploymentSlice.actions;

export default deploymentSlice.reducer;
