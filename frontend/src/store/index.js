import { combineReducers, configureStore } from '@reduxjs/toolkit';
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
import { isTenantScopeReset, TENANT_SCOPED_SLICES } from './tenantScope.js';

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

/**
 * Reducer racine.
 *
 * Sur `tenant/scopeReset`, les slices tenant-scoped sont remis à `undefined` :
 * `combineReducers` leur redonne alors leur propre état initial. Les slices
 * globaux sont conservés tels quels (préférences d'affichage, tenant actif,
 * toasts) — on ne vide pas des états qui n'ont pas de portée tenant.
 */
const rootReducer = (state, action) => {
  if (isTenantScopeReset(action) && state) {
    const preserved = {};
    for (const key of Object.keys(state)) {
      preserved[key] = tenantScoped.has(key) ? undefined : state[key];
    }
    state = preserved;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});

export default store;