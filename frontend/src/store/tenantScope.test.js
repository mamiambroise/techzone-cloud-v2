import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from '@reduxjs/toolkit';

import platformReducer from './platformSlice.js';
import applicationsReducer from './applicationsSlice.js';
import environmentsReducer from './environmentsSlice.js';
import contractsReducer from './contractsSlice.js';
import configReducer from './configSlice.js';
import snapshotsReducer from './snapshotsSlice.js';
import auditReducer from './auditSlice.js';
import integrationReducer from './integrationSlice.js';
import deploymentReducer from './deploymentSlice.js';
import uiBuilderReducer from '../features/ui-builder/store/uiBuilderSlice.js';

import {
  TENANT_SCOPED_SLICES,
  GLOBAL_SLICES,
  resetTenantScopedState,
} from './tenantScope.js';
import { setActiveTenant, toggleSidebarCollapsed, addToast } from './platformSlice.js';

// Même construction de reducer racine que store/index.js : on la rejoue ici
// pour prouver le comportement d'invalidation sans dépendre d'un store global.
const appReducer = combineReducers({
  platform: platformReducer,
  applications: applicationsReducer,
  environments: environmentsReducer,
  contracts: contractsReducer,
  config: configReducer,
  snapshots: snapshotsReducer,
  audit: auditReducer,
  integration: integrationReducer,
  deployment: deploymentReducer,
  uiBuilder: uiBuilderReducer,
});

const tenantScoped = new Set(TENANT_SCOPED_SLICES);

const rootReducer = (state, action) => {
  if (action?.type === 'tenant/scopeReset' && state) {
    const preserved = {};
    for (const key of Object.keys(state)) {
      preserved[key] = tenantScoped.has(key) ? undefined : state[key];
    }
    state = preserved;
  }
  return appReducer(state, action);
};

const makeStore = () => configureStore({ reducer: rootReducer });

/** Charge des données « métier » comme si elles venaient de l'API du tenant. */
const loadTenantData = (store, tenantLabel) => {
  store.dispatch({ type: 'applications/fetchApplications/fulfilled', payload: [
    { id: `app-${tenantLabel}`, name: `Application ${tenantLabel}` },
  ] });
  store.dispatch({ type: 'environments/fetchEnvironments/fulfilled', payload: [
    { id: `env-${tenantLabel}`, code: tenantLabel.toUpperCase() },
  ] });
  store.dispatch({ type: 'integration/fetchConnectors/fulfilled', payload: [
    { id: `conn-${tenantLabel}`, name: `Connecteur ${tenantLabel}` },
  ] });
  store.dispatch({ type: 'deployment/fetchReleases/fulfilled', payload: [
    { id: `rel-${tenantLabel}` },
  ] });
};

const snapshotServerData = (store) => {
  const s = store.getState();
  return JSON.stringify({
    applications: s.applications?.applications ?? s.applications?.items ?? null,
    environments: s.environments?.environments ?? null,
    integration: s.integration?.connectors ?? null,
    deployment: s.deployment?.releases ?? null,
  });
};

describe('invalidation tenant-scoped — construction du reducer racine', () => {
  it('déclare des slices tenant-scoped et globaux disjoints et connus', () => {
    expect(TENANT_SCOPED_SLICES.length).toBeGreaterThan(0);
    const overlap = TENANT_SCOPED_SLICES.filter((s) => GLOBAL_SLICES.includes(s));
    expect(overlap).toEqual([]);
    // platform ne doit jamais être purgé : il porte activeTenant et l'UI.
    expect(TENANT_SCOPED_SLICES).not.toContain('platform');
  });

  it('couvre toutes les slices métier du magasin', () => {
    const all = [
      'platform', 'applications', 'environments', 'contracts', 'config',
      'snapshots', 'audit', 'integration', 'deployment', 'uiBuilder',
    ];
    const covered = [...GLOBAL_SLICES, ...TENANT_SCOPED_SLICES].sort();
    expect(covered).toEqual(all.sort());
  });
});

describe('Tenant A -> Tenant B -> Tenant A', () => {
  let store;
  beforeEach(() => {
    store = makeStore();
  });

  it('purge toutes les données du tenant précédent au changement', () => {
    // --- Tenant A ---
    store.dispatch(setActiveTenant('tenant-a'));
    loadTenantData(store, 'a');
    const stateA = store.getState();
    expect(stateA.applications.applications ?? stateA.applications.items).toBeDefined();
    const dataA = snapshotServerData(store);
    expect(dataA).toContain('a');

    // --- Passage à Tenant B ---
    store.dispatch(setActiveTenant('tenant-b'));
    store.dispatch(resetTenantScopedState('tenant-b'));
    loadTenantData(store, 'b');
    const dataB = snapshotServerData(store);

    // Aucune trace du tenant A ne doit subsister.
    expect(dataB).not.toContain('tenant-a');
    expect(dataB).not.toContain('app-a');
    expect(dataB).toContain('app-b');

    // --- Retour à Tenant A ---
    store.dispatch(setActiveTenant('tenant-a'));
    store.dispatch(resetTenantScopedState('tenant-a'));
    loadTenantData(store, 'a');
    const dataBack = snapshotServerData(store);
    expect(dataBack).not.toContain('app-b');
    expect(dataBack).toContain('app-a');
  });

  it('remet chaque slice tenant-scoped exactement à son état initial', () => {
    const fresh = rootReducer(undefined, { type: '@@INIT' });

    store.dispatch(setActiveTenant('tenant-a'));
    loadTenantData(store, 'a');

    const dirty = store.getState();
    const actuallyDirty = TENANT_SCOPED_SLICES.filter(
      (slice) => JSON.stringify(dirty[slice]) !== JSON.stringify(fresh[slice]),
    );
    // Pré-condition : le test ne vaut que si des slices sont réellement chargées.
    expect(actuallyDirty.length).toBeGreaterThan(0);

    store.dispatch(resetTenantScopedState('tenant-b'));
    const after = store.getState();

    TENANT_SCOPED_SLICES.forEach((slice) => {
      expect(after[slice]).toEqual(fresh[slice]);
    });
  });

  it('conserve l’état global : tenant actif, préférences d’interface, toasts', () => {
    store.dispatch(setActiveTenant('tenant-a'));
    store.dispatch(toggleSidebarCollapsed());
    store.dispatch(addToast({ type: 'success', title: 'T', message: 'M' }));
    loadTenantData(store, 'a');

    store.dispatch(resetTenantScopedState('tenant-b'));

    const s = store.getState();
    // platform est global : rien n'est perdu.
    expect(s.platform.activeTenant).toBe('tenant-a');
    expect(s.platform.sidebarCollapsed).toBe(true);
    expect(s.platform.toasts).toHaveLength(1);
  });

  it('ne fait rien d’autre pour une action normale', () => {
    store.dispatch(setActiveTenant('tenant-a'));
    loadTenantData(store, 'a');
    const before = snapshotServerData(store);
    store.dispatch({ type: 'platform/setActiveTab', payload: 'monitoring' });
    expect(snapshotServerData(store)).toBe(before);
  });
});