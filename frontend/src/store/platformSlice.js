import { createSlice } from '@reduxjs/toolkit';

export const IAM_ROLES = {
  ADMIN: {
    id: 'admin',
    name: 'Ranja Avo Efraim',
    initials: 'RA',
    email: 'ranja.avo@techzone.io',
    role: 'Administrateur',
    permissions: ['*'],
    canWriteProd: true,
  },
  SUPER_ADMIN: {
    id: 'super_admin',
    name: 'Super Administrateur',
    initials: 'SA',
    email: 'superadmin@techzone.io',
    role: 'Super Administrateur',
    permissions: ['*'],
    canWriteProd: true,
  },
  DEVELOPER: {
    id: 'dev',
    name: 'Alexandre D.',
    initials: 'AD',
    email: 'alexandre.d@techzone.io',
    role: 'Éditeur Lead',
    permissions: ['APP_READ', 'APP_WRITE', 'DEV_DEPLOY', 'CONFIG_DEV'],
    canWriteProd: false,
  },
  QA: {
    id: 'qa',
    name: 'Jean Mbolo',
    initials: 'JM',
    email: 'jean.mbolo@techzone.io',
    role: 'QA Automation Lead',
    permissions: ['APP_READ', 'TEST_DEPLOY', 'VALIDATE_CONTRACT'],
    canWriteProd: false,
  },
  AUDITOR: {
    id: 'auditor',
    name: 'Sophie Germain',
    initials: 'SG',
    email: 's.germain@techzone.io',
    role: 'Auditeur Sécurité',
    permissions: ['READ_ONLY', 'AUDIT_EXPORT'],
    canWriteProd: false,
  },
};

export const TENANTS = [
  { id: 'all', name: 'Tous les Tenants (Vue Plateforme)', code: 'ALL' },
  { id: 'tenant-enterprise', name: 'Techzone Cloud Enterprise', code: 'TZ-ENTERPRISE' },
  { id: 'tenant-core-global', name: 'Techzone Global Core', code: 'TZ-GLOBAL' },
  { id: 'tenant-retail-fr', name: 'Techzone Retail France', code: 'TZ-RET-FR' },
  { id: 'tenant-logistics-de', name: 'Techzone Logistics DACH', code: 'TZ-LOG-DE' },
];

const initialState = {
  activeTab: 'workspace', // 'overview', 'applications', 'workspace', 'versions', 'validation', 'publication', 'history', 'specifications', 'integrations', etc.
  activeUser: IAM_ROLES.ADMIN,
  activeTenant: 'tenant-enterprise',
  searchQuery: '',
  platformHealth: 'HEALTHY',
  apiStatus: 'CONNECTING',
  platformContractLocked: true,
  activeModuleId: '01', // 01 Application / Pack Manager
  sidebarCollapsed: false,
  toasts: [],
  alerts: [
    {
      id: 'alt-1',
      type: 'warning',
      title: 'Configuration incomplète sur TEST',
      message: 'La clé platform.metrics.sample_rate est absente sur le scope TEST.',
      timestamp: 'Il y a 12 min',
      code: 'PLATFORM_CONFIG_INVALID',
    },
    {
      id: 'alt-2',
      type: 'info',
      title: 'Platform Contract v1 verrouillé 🔒',
      message: 'Intégrité certifiée par Team 4. Aucune rupture détectée.',
      timestamp: 'Il y a 45 min',
      code: 'PLATFORM_CONTRACT_LOCKED',
    },
  ],
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
    setPlatformHealth: (state, action) => {
      state.platformHealth = action.payload;
    },
    setApiStatus: (state, action) => {
      state.apiStatus = action.payload;
    },
    togglePlatformContractLock: (state) => {
      state.platformContractLocked = !state.platformContractLocked;
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
  setPlatformHealth,
  setApiStatus,
  togglePlatformContractLock,
  toggleSidebarCollapsed,
  setSidebarCollapsed,
  setActiveModuleId,
  addAlert,
  dismissAlert,
  addToast,
  removeToast,
} = platformSlice.actions;

export default platformSlice.reducer;
