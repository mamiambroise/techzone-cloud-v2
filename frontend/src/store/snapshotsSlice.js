import { createSlice } from '@reduxjs/toolkit';

const initialSnapshots = [
  {
    id: 'snp-prod-baseline-202606',
    code: 'SNP-PROD-2026-06',
    name: 'Production Stable Baseline (Platform Contract v1)',
    applicationId: 'app-core-api',
    applicationCode: 'CORE-API',
    applicationVersionId: 'ver-core-1.1.0',
    applicationVersion: '1.1.0',
    environmentId: 'env-prod',
    environmentCode: 'PRODUCTION',
    contractsIncluded: [
      { id: 'PF-CONTR-001', version: '1.0.0', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
      { id: 'IAM-CONTR-002', version: '2.1.0', hash: '4a6f8b919318b76dfa12b4421d0f5e71829e01938501237a6bca2384918e3810' },
      { id: 'ERP-CONTR-003', version: '1.4.0', hash: '9f83a21908234beba8210398f827103847192837461982736410982374619283' },
    ],
    configurations: [
      { key: 'platform.http.timeout_ms', value: '5000' },
      { key: 'gateway.rate_limit.max_rps', value: '2500' },
      { key: 'platform.logging.level', value: 'WARN' },
    ],
    createdBy: 'alex.admin@techzone.io',
    createdAt: '2026-06-15T02:00:00Z',
    hash: 'sha256_9c2a11b84931e3d09a8f273b4510cae78394112e4b8301fa9173024982736410',
    status: 'BASELINE',
    description: 'Snapshot officiel de référence certifiant le jalon Platform Foundation v1 en production.',
  },
  {
    id: 'snp-staging-pre-release',
    code: 'SNP-STG-2026-08',
    name: 'Staging Release Candidate Core 1.2.0-rc1',
    applicationId: 'app-core-api',
    applicationCode: 'CORE-API',
    applicationVersionId: 'ver-core-1.2.0-rc1',
    applicationVersion: '1.2.0-rc1',
    environmentId: 'env-staging',
    environmentCode: 'STAGING',
    contractsIncluded: [
      { id: 'PF-CONTR-001', version: '1.0.0', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
      { id: 'IAM-CONTR-002', version: '2.1.0', hash: '4a6f8b919318b76dfa12b4421d0f5e71829e01938501237a6bca2384918e3810' },
      { id: 'ERP-CONTR-003', version: '1.4.0', hash: '9f83a21908234beba8210398f827103847192837461982736410982374619283' },
      { id: 'DATA-CONTR-004', version: '2.0.0', hash: '1283918237461928374619827364918273641928374619283746192837461928' },
    ],
    configurations: [
      { key: 'platform.http.timeout_ms', value: '5000' },
      { key: 'gateway.rate_limit.max_rps', value: '3000' },
      { key: 'gateway.opentelemetry.enabled', value: 'true' },
      { key: 'platform.logging.level', value: 'INFO' },
    ],
    createdBy: 'c.leroy@techzone.io',
    createdAt: '2026-08-25T15:00:00Z',
    hash: 'sha256_b31498e72c81f028374619283746198273649182736419283746192837461928',
    status: 'VALIDATED',
    description: 'Snapshot de staging incluant le nouveau contrat Data Runtime et télémétrie.',
  },
  {
    id: 'snp-dev-sandbox-erp',
    code: 'SNP-DEV-ERP-SYNC',
    name: 'Dev Sandbox ERP Connector v1.5.0-draft',
    applicationId: 'app-erp-connector',
    applicationCode: 'ERP-SYNC',
    applicationVersionId: 'ver-erp-1.5.0-draft',
    applicationVersion: '1.5.0-draft',
    environmentId: 'env-dev',
    environmentCode: 'DEVELOPMENT',
    contractsIncluded: [
      { id: 'PF-CONTR-001', version: '1.0.0', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
      { id: 'ERP-CONTR-003', version: '1.4.0', hash: '9f83a21908234beba8210398f827103847192837461982736410982374619283' },
    ],
    configurations: [
      { key: 'erp.sync.batch_size', value: '1000' },
      { key: 'platform.logging.level', value: 'DEBUG' },
    ],
    createdBy: 'c.leroy@techzone.io',
    createdAt: '2026-09-01T16:00:00Z',
    hash: 'sha256_82f1092837461928374619827364918273641928374619283746192837461928',
    status: 'VALIDATED',
    description: 'Prise d’état ponctuelle pour tests de performance du lot de synchronisation.',
  },
];

// Snapshot diff comparison helper (PF-CDC-06 Section 6)
export function compareSnapshotsData(left, right) {
  if (!left || !right) return null;

  const diff = {
    metadata: {
      leftName: left.name,
      rightName: right.name,
      leftHash: left.hash,
      rightHash: right.hash,
    },
    application: {
      changed: left.applicationCode !== right.applicationCode || left.applicationVersion !== right.applicationVersion,
      left: `${left.applicationCode} (${left.applicationVersion})`,
      right: `${right.applicationCode} (${right.applicationVersion})`,
    },
    environment: {
      changed: left.environmentCode !== right.environmentCode,
      left: left.environmentCode,
      right: right.environmentCode,
    },
    contracts: [],
    configurations: [],
  };

  // Compare contracts
  const leftContrMap = new Map((left.contractsIncluded || []).map((c) => [c.id, c]));
  const rightContrMap = new Map((right.contractsIncluded || []).map((c) => [c.id, c]));

  const allContrIds = new Set([...leftContrMap.keys(), ...rightContrMap.keys()]);
  allContrIds.forEach((id) => {
    const l = leftContrMap.get(id);
    const r = rightContrMap.get(id);
    if (l && !r) {
      diff.contracts.push({ id, status: 'REMOVED', left: `${l.version} (${l.hash?.slice(0, 10)}...)`, right: '—' });
    } else if (!l && r) {
      diff.contracts.push({ id, status: 'ADDED', left: '—', right: `${r.version} (${r.hash?.slice(0, 10)}...)` });
    } else if (l.version !== r.version || l.hash !== r.hash) {
      diff.contracts.push({ id, status: 'CHANGED', left: `${l.version}`, right: `${r.version}` });
    } else {
      diff.contracts.push({ id, status: 'UNCHANGED', left: `${l.version}`, right: `${r.version}` });
    }
  });

  // Compare configurations
  const leftCfgMap = new Map((left.configurations || []).map((c) => [c.key, c.value]));
  const rightCfgMap = new Map((right.configurations || []).map((c) => [c.key, c.value]));

  const allCfgKeys = new Set([...leftCfgMap.keys(), ...rightCfgMap.keys()]);
  allCfgKeys.forEach((key) => {
    const lVal = leftCfgMap.get(key);
    const rVal = rightCfgMap.get(key);
    if (lVal !== undefined && rVal === undefined) {
      diff.configurations.push({ key, status: 'REMOVED', left: lVal, right: '—' });
    } else if (lVal === undefined && rVal !== undefined) {
      diff.configurations.push({ key, status: 'ADDED', left: '—', right: rVal });
    } else if (lVal !== rVal) {
      diff.configurations.push({ key, status: 'CHANGED', left: lVal, right: rVal });
    } else {
      diff.configurations.push({ key, status: 'UNCHANGED', left: lVal, right: rVal });
    }
  });

  return diff;
}

const snapshotsSlice = createSlice({
  name: 'snapshots',
  initialState: {
    snapshots: initialSnapshots,
    selectedSnapshotId: 'snp-prod-baseline-202606',
    compareLeftId: 'snp-prod-baseline-202606',
    compareRightId: 'snp-staging-pre-release',
  },
  reducers: {
    setSelectedSnapshotId: (state, action) => {
      state.selectedSnapshotId = action.payload;
    },
    setCompareSelection: (state, action) => {
      if (action.payload.leftId) state.compareLeftId = action.payload.leftId;
      if (action.payload.rightId) state.compareRightId = action.payload.rightId;
    },
    addSnapshot: (state, action) => {
      state.snapshots.unshift({
        id: 'snp-' + Date.now().toString(36),
        createdAt: new Date().toISOString(),
        status: 'VALIDATED',
        ...action.payload,
      });
    },
    setBaselineSnapshot: (state, action) => {
      const snap = state.snapshots.find((s) => s.id === action.payload);
      if (snap) {
        state.snapshots.forEach((s) => {
          if (s.environmentId === snap.environmentId && s.status === 'BASELINE') {
            s.status = 'VALIDATED';
          }
        });
        snap.status = 'BASELINE';
      }
    },
  },
});

export const { setSelectedSnapshotId, setCompareSelection, addSnapshot, setBaselineSnapshot } =
  snapshotsSlice.actions;

export default snapshotsSlice.reducer;
