/**
 * LEGACY_NAVIGATION_BRIDGE:
 * activeTab is synchronized FROM the URL by app/RouteToTabSync.jsx.
 * React Router (BrowserRouter) is the navigation authority (Phase 2.2).
 * Sidebar and SubNavBar use navigate() to change routes.
 * RouteToTabSync dispatches setActiveTab here so existing components
 * that read Redux state continue to work during the migration phase.
 */
import { createSlice } from '@reduxjs/toolkit';
// REAL DATA ONLY : plus aucun profil/tenant de démonstration.
// L'utilisateur actif et le tenant actif proviennent exclusivement
// d'AuthProvider / TenantProvider (IAM réel, cookies HttpOnly).

const initialState = {
  activeTab: 'workspace',
  activeUser: null,
  activeTenant: null,
  searchQuery: '',
  apiStatus: 'CONNECTING',
  activeModuleId: '01',
  sidebarCollapsed: false,
  providerMode: 'REAL',
  toasts: [],
  alerts: [],
};

const platformSlice = createSlice({
  name: 'platform',
  initialState,
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setActiveUser: (state, action) => {
      state.activeUser = action.payload;
    },
    setActiveTenant: (state, action) => {
      state.activeTenant = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setApiStatus: (state, action) => {
      state.apiStatus = action.payload;
    },
    setProviderMode: (state, action) => {
      state.providerMode = action.payload;
    },
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
    },
    setActiveModuleId: (state, action) => {
      state.activeModuleId = action.payload;
    },
    addAlert: (state, action) => {
      state.alerts.unshift({
        id: 'alt-' + Date.now(),
        timestamp: 'À l\'instant',
        ...action.payload,
      });
    },
    dismissAlert: (state, action) => {
      state.alerts = state.alerts.filter((a) => a.id !== action.payload);
    },
    addToast: (state, action) => {
      state.toasts.push({
        id: 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        type: action.payload.type || 'info', // 'success', 'error', 'info', 'warning'
        title: action.payload.title,
        message: action.payload.message,
      });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const {
  setActiveTab,
  setActiveUser,
  setActiveTenant,
  setSearchQuery,
  setApiStatus,
  setProviderMode,
  toggleSidebarCollapsed,
  setSidebarCollapsed,
  setActiveModuleId,
  addAlert,
  dismissAlert,
  addToast,
  removeToast,
} = platformSlice.actions;

export default platformSlice.reducer;
