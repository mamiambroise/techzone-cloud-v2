import { configureStore } from '@reduxjs/toolkit';
import platformReducer from './platformSlice.js';
import applicationsReducer from './applicationsSlice.js';
import environmentsReducer from './environmentsSlice.js';
import contractsReducer from './contractsSlice.js';
import configReducer from './configSlice.js';
import snapshotsReducer from './snapshotsSlice.js';
import auditReducer from './auditSlice.js';
import integrationReducer from './integrationSlice.js';
import deploymentReducer from './deploymentSlice.js';

export const store = configureStore({
  reducer: {
    platform: platformReducer,
    applications: applicationsReducer,
    environments: environmentsReducer,
    contracts: contractsReducer,
    config: configReducer,
    snapshots: snapshotsReducer,
    audit: auditReducer,
    integration: integrationReducer,
    deployment: deploymentReducer,
  },
});

export default store;
