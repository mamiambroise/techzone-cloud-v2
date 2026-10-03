import { createSlice } from '@reduxjs/toolkit';

// REAL DATA ONLY : les snapshots proviennent exclusivement de l'API réelle
// (GET /business-manager/snapshots). Aucun snapshot de démonstration.
const initialSnapshots = [];

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
    selectedSnapshotId: null,
    compareLeftId: null,
    compareRightId: null,
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
