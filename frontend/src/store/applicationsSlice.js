import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  getApplications as getApplicationsApi,
  createApplication as createApplicationApi,
  updateApplication as updateApplicationApi,
  archiveApplication as archiveApplicationApi,
} from '../api/platform/applicationsApi.js';

export const VERSION_LIFECYCLE = [
  'DRAFT',
  'CONFIGURING',
  'VALIDATING',
  'READY',
  'ACTIVE',
  'SUPERSEDED',
  'DEPRECATED',
  'ARCHIVED',
];

const initialApplications = [
  {
    id: 'app-0003',
    appNumber: 'APP-0003',
    code: 'boutique-mode-accessoires',
    name: 'Boutique Mode & Accessoires',
    category: 'Commerce & Vente',
    categoryColor: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Gestion boutique, commandes, stock, clients et rapports.',
    status: 'ACTIVE',
    activeVersion: 'v1.0.0',
    hasStarVersion: true,
    targetEnvironment: 'PRODUCTION',
    workspaceEnvironment: 'STAGING',
    workspaceVersion: 'v1.1.0 (DRAFT)',
    workspaceState: 'CONFIGURÉ',
    workspaceConfigPct: 100,
    owner: 'Ranja Avo Efraim',
    ownerInitials: 'RA',
    team: [
      { initials: 'RA', name: 'Ranja Avo Efraim' },
      { initials: 'AD', name: 'Alexandre D.' },
      { initials: 'JM', name: 'Jean Mbolo' },
    ],
    teamExtraCount: 3,
    lastModifiedBy: 'Ranja Avo Efraim',
    lastModifiedUserInitials: 'RA',
    lastModifiedDate: '25/08/2026 09:57',
    lastModifiedText: 'Aujourd\'hui à 09:57',
    iconType: 'ShoppingBag',
    tenantScope: 'tenant-enterprise',
    createdAt: '2026-08-10T08:00:00Z',
    updatedAt: '2026-08-25T09:57:00Z',
    tags: ['E-Commerce', 'Boutique', 'Vente'],
  },
  {
    id: 'app-0002',
    appNumber: 'APP-0002',
    code: 'le-bistro-gourmand',
    name: 'Le Bistro Gourmand',
    category: 'Restauration',
    categoryColor: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Restaurant & gestion des réservations',
    status: 'EN TEST',
    activeVersion: 'v0.9.0',
    hasStarVersion: false,
    targetEnvironment: 'STAGING',
    workspaceEnvironment: 'STAGING',
    workspaceVersion: 'v0.9.5 (DRAFT)',
    workspaceState: 'CONFIGURING',
    workspaceConfigPct: 80,
    owner: 'Alexandre D.',
    ownerInitials: 'AD',
    team: [
      { initials: 'AD', name: 'Alexandre D.' },
      { initials: 'RA', name: 'Ranja Avo Efraim' },
    ],
    teamExtraCount: 1,
    lastModifiedBy: 'Alexandre D.',
    lastModifiedUserInitials: 'AD',
    lastModifiedDate: '24/08/2026 16:42',
    lastModifiedText: 'Hier à 16:42',
    iconType: 'Utensils',
    tenantScope: 'tenant-enterprise',
    createdAt: '2026-08-12T10:00:00Z',
    updatedAt: '2026-08-24T16:42:00Z',
    tags: ['Restaurant', 'Réservations'],
  },
  {
    id: 'app-0001',
    appNumber: 'APP-0001',
    code: 'auto-express-services',
    name: 'Auto Express Services',
    category: 'Automobile',
    categoryColor: 'bg-sky-50 text-sky-700 border-sky-200',
    description: 'Garage, réparations et entretien',
    status: 'BROUILLON',
    activeVersion: 'v0.1.0',
    hasStarVersion: false,
    targetEnvironment: 'DEVELOPPEMENT',
    workspaceEnvironment: 'DEVELOPPEMENT',
    workspaceVersion: 'v0.1.0 (DRAFT)',
    workspaceState: 'DRAFT',
    workspaceConfigPct: 40,
    owner: 'Jean Mbolo',
    ownerInitials: 'JM',
    team: [{ initials: 'JM', name: 'Jean Mbolo' }],
    teamExtraCount: 0,
    lastModifiedBy: 'Jean Mbolo',
    lastModifiedUserInitials: 'JM',
    lastModifiedDate: '23/08/2026 11:21',
    lastModifiedText: 'Il y a 3 jours',
    iconType: 'Car',
    tenantScope: 'tenant-enterprise',
    createdAt: '2026-08-15T09:00:00Z',
    updatedAt: '2026-08-23T11:21:00Z',
    tags: ['Auto', 'Atelier'],
  },
  {
    id: 'app-0004',
    appNumber: 'APP-0004',
    code: 'ecole-centre-formation',
    name: 'École & Centre de Formation',
    category: 'Éducation',
    categoryColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Gestion des élèves, cours et emplois du temps',
    status: 'ACTIVE',
    activeVersion: 'v1.2.0',
    hasStarVersion: true,
    targetEnvironment: 'PRODUCTION',
    workspaceEnvironment: 'PRODUCTION',
    workspaceVersion: 'v1.2.0',
    workspaceState: 'CONFIGURÉ',
    workspaceConfigPct: 100,
    owner: 'Ranja Avo Efraim',
    ownerInitials: 'RA',
    team: [{ initials: 'RA', name: 'Ranja Avo Efraim' }],
    teamExtraCount: 2,
    lastModifiedBy: 'Ranja Avo Efraim',
    lastModifiedUserInitials: 'RA',
    lastModifiedDate: '22/08/2026 14:10',
    lastModifiedText: 'Il y a 4 jours',
    iconType: 'GraduationCap',
    tenantScope: 'tenant-enterprise',
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-22T14:10:00Z',
    tags: ['Éducation', 'Formation'],
  },
  {
    id: 'app-0005',
    appNumber: 'APP-0005',
    code: 'pharmacie-espace-sante',
    name: 'Pharmacie & Espace Santé',
    category: 'Santé',
    categoryColor: 'bg-teal-50 text-teal-700 border-teal-200',
    description: 'Ordonnances, stock et tiers payant',
    status: 'ACTIVE',
    activeVersion: 'v1.1.0',
    hasStarVersion: false,
    targetEnvironment: 'PRODUCTION',
    workspaceEnvironment: 'PRODUCTION',
    workspaceVersion: 'v1.1.0',
    workspaceState: 'CONFIGURÉ',
    workspaceConfigPct: 100,
    owner: 'Marc Marius',
    ownerInitials: 'MM',
    team: [{ initials: 'MM', name: 'Marc Marius' }],
    teamExtraCount: 1,
    lastModifiedBy: 'Marc Marius',
    lastModifiedUserInitials: 'MM',
    lastModifiedDate: '21/08/2026 08:33',
    lastModifiedText: 'Il y a 5 jours',
    iconType: 'Pill',
    tenantScope: 'tenant-enterprise',
    createdAt: '2026-07-20T10:00:00Z',
    updatedAt: '2026-08-21T08:33:00Z',
    tags: ['Santé', 'Pharmacie'],
  },
  {
    id: 'app-0006',
    appNumber: 'APP-0006',
    code: 'gestion-stock-entrepot',
    name: 'Gestion de Stock & Entrepôt',
    category: 'Stock & Logistique',
    categoryColor: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'Inventaires, mouvements et expéditions',
    status: 'SUSPENDUE',
    activeVersion: 'v0.8.0',
    hasStarVersion: false,
    targetEnvironment: 'PRODUCTION',
    workspaceEnvironment: 'STAGING',
    workspaceVersion: 'v0.8.1',
    workspaceState: 'MAINTENANCE',
    workspaceConfigPct: 85,
    owner: 'Kolo Baptiste',
    ownerInitials: 'KB',
    team: [{ initials: 'KB', name: 'Kolo Baptiste' }],
    teamExtraCount: 1,
    lastModifiedBy: 'Kolo Baptiste',
    lastModifiedUserInitials: 'KB',
    lastModifiedDate: '20/08/2026 10:15',
    lastModifiedText: 'Il y a 6 jours',
    iconType: 'Boxes',
    tenantScope: 'tenant-enterprise',
    createdAt: '2026-07-15T09:00:00Z',
    updatedAt: '2026-08-20T10:15:00Z',
    tags: ['Logistique', 'Stock'],
  },
  {
    id: 'app-0007',
    appNumber: 'APP-0007',
    code: 'hotel-hebergement',
    name: 'Hôtel & Hébergement',
    category: 'Hôtellerie',
    categoryColor: 'bg-orange-50 text-orange-700 border-orange-200',
    description: 'Gestion des séjours et facturation',
    status: 'ARCHIVÉE',
    activeVersion: 'v1.0.0',
    hasStarVersion: false,
    targetEnvironment: 'PRODUCTION',
    workspaceEnvironment: 'ARCHIVE',
    workspaceVersion: 'v1.0.0',
    workspaceState: 'ARCHIVÉ',
    workspaceConfigPct: 100,
    owner: 'Ranja Avo Efraim',
    ownerInitials: 'RA',
    team: [{ initials: 'RA', name: 'Ranja Avo Efraim' }],
    teamExtraCount: 0,
    lastModifiedBy: 'Ranja Avo Efraim',
    lastModifiedUserInitials: 'RA',
    lastModifiedDate: '18/08/2026 17:05',
    lastModifiedText: 'Il y a 8 jours',
    iconType: 'Building2',
    tenantScope: 'tenant-enterprise',
    createdAt: '2026-06-10T14:00:00Z',
    updatedAt: '2026-08-18T17:05:00Z',
    tags: ['Hôtellerie', 'Séjours'],
  },
];

const initialVersions = [
  {
    id: 'ver-core-1.0.0',
    applicationId: 'app-core-api',
    version: '1.0.0',
    status: 'SUPERSEDED',
    releaseNotes: 'Version initiale avec contrats Platform Contract v0.9.',
    createdFrom: null,
    createdAt: '2026-01-15T10:00:00Z',
    publishedAt: '2026-01-20T12:00:00Z',
    contractsUsed: ['PF-CONTR-001@1.0.0'],
  },
  {
    id: 'ver-core-1.1.0',
    applicationId: 'app-core-api',
    version: '1.1.0',
    status: 'ACTIVE',
    releaseNotes: 'Migration complète vers Platform Contract v1 et renforcement du rate-limiting.',
    createdFrom: 'ver-core-1.0.0',
    createdAt: '2026-06-01T09:00:00Z',
    publishedAt: '2026-06-10T14:00:00Z',
    contractsUsed: ['PF-CONTR-001@1.0.0', 'IAM-CONTR-002@2.1.0'],
  },
  {
    id: 'ver-core-1.2.0-rc1',
    applicationId: 'app-core-api',
    version: '1.2.0-rc1',
    status: 'VALIDATING',
    releaseNotes: 'Support des métriques de tracing OpenTelemetry et nouveaux filtres tenant.',
    createdFrom: 'ver-core-1.1.0',
    createdAt: '2026-08-25T11:30:00Z',
    publishedAt: null,
    contractsUsed: ['PF-CONTR-001@1.0.0', 'IAM-CONTR-002@2.1.0', 'DATA-CONTR-004@2.0.0'],
  },
  {
    id: 'ver-id-2.1.0',
    applicationId: 'app-identity-bridge',
    version: '2.1.0',
    status: 'ACTIVE',
    releaseNotes: 'Intégration du contrat IAM Context v2.1 avec jetons signés Ed25519.',
    createdFrom: null,
    createdAt: '2026-03-01T10:00:00Z',
    publishedAt: '2026-03-15T16:00:00Z',
    contractsUsed: ['IAM-CONTR-002@2.1.0'],
  },
  {
    id: 'ver-erp-1.4.2',
    applicationId: 'app-erp-connector',
    version: '1.4.2',
    status: 'ACTIVE',
    releaseNotes: 'Optimisation du débit de synchronisation des stocks magasins.',
    createdFrom: null,
    createdAt: '2026-05-12T08:30:00Z',
    publishedAt: '2026-05-20T10:00:00Z',
    contractsUsed: ['ERP-CONTR-003@1.4.0'],
  },
  {
    id: 'ver-erp-1.5.0-draft',
    applicationId: 'app-erp-connector',
    version: '1.5.0-draft',
    status: 'DRAFT',
    releaseNotes: 'Brouillon pour gestion multi-devises automatique.',
    createdFrom: 'ver-erp-1.4.2',
    createdAt: '2026-09-01T15:00:00Z',
    publishedAt: null,
    contractsUsed: ['ERP-CONTR-003@1.4.0'],
  },
  {
    id: 'ver-boutique-1.0.0',
    applicationId: 'app-0003',
    version: '1.0.0',
    status: 'ACTIVE',
    releaseNotes: 'Version initiale stable en production.',
    createdFrom: null,
    createdAt: '2026-08-10T09:00:00Z',
    publishedAt: '2026-08-20T14:00:00Z',
    contractsUsed: ['COMMERCE-CONTR-001@1.0.0', 'PAYMENT-CONTR-002@1.0.0'],
  },
  {
    id: 'ver-boutique-1.1.0-draft',
    applicationId: 'app-0003',
    version: '1.1.0 (DRAFT)',
    status: 'DRAFT',
    releaseNotes: 'Workspace en cours de configuration par Alexandre D.',
    createdFrom: 'ver-boutique-1.0.0',
    createdAt: '2026-08-24T10:15:00Z',
    publishedAt: null,
    contractsUsed: ['COMMERCE-CONTR-001@1.1.0', 'PAYMENT-CONTR-002@1.1.0'],
  },
  {
    id: 'ver-boutique-1.2.0',
    applicationId: 'app-0003',
    version: 'v1.2.0',
    status: 'ACTIVE',
    type: 'MAJOR',
    isLatest: true,
    isStable: true,
    reference: '#a1b2c3d',
    releaseNotes: 'Version majeure incluant un nouveau moteur de panier, la gestion avancée des promotions et une amélioration des performances de paiement.',
    keyChanges: [
      'Nouveau moteur de panier multi-entrepôts',
      'Gestion avancée des codes promotionnels',
      'Paiement en plusieurs étapes sécurisé',
      'Optimisations des performances (API & Front)',
      'Tableau de bord analytique amélioré',
    ],
    notes: 'Cette version remplace la v1.1.0 en production sans interruption de service.',
    tags: ['ecommerce', 'premium', 'production', 'paiement', 'panier', 'promo'],
    testCoverage: 87,
    unitTests: '452 / 520',
    validations: '5 / 5',
    issues: 0,
    createdFrom: 'ver-boutique-1.1.0-draft',
    createdAt: '2024-05-25T09:00:00Z',
    publishedAt: '2024-05-25T09:00:00Z',
    contractsUsed: ['COMMERCE-CONTR-001@1.2.0', 'PAYMENT-CONTR-002@1.2.0'],
  },
];

export const fetchApplicationsAsync = createAsyncThunk(
  'applications/fetchApplications',
  async (_, { getState }) => {
    const { providerMode } = getState().integration;
    if (providerMode === 'MOCK') {
      return { skipped: true };
    }
    return getApplicationsApi();
  }
);

export const addApplicationAsync = createAsyncThunk(
  'applications/addApplication',
  async (body, { getState }) => {
    const { providerMode } = getState().integration;
    if (providerMode === 'MOCK') {
      return { skipped: true };
    }
    return createApplicationApi(body);
  }
);

export const updateApplicationAsync = createAsyncThunk(
  'applications/updateApplication',
  async ({ id, body }, { getState }) => {
    const { providerMode } = getState().integration;
    if (providerMode === 'MOCK') {
      return { skipped: true };
    }
    return updateApplicationApi(id, body);
  }
);

export const archiveApplicationAsync = createAsyncThunk(
  'applications/archiveApplication',
  async (id, { getState }) => {
    const { providerMode } = getState().integration;
    if (providerMode === 'MOCK') {
      return { skipped: true };
    }
    return archiveApplicationApi(id);
  }
);

const applicationsSlice = createSlice({
  name: 'applications',
  initialState: {
    applications: initialApplications,
    versions: initialVersions,
    selectedAppId: 'app-0003',
  },
  reducers: {
    setSelectedAppId: (state, action) => {
      state.selectedAppId = action.payload;
    },
    addApplication: (state, action) => {
      const newApp = {
        id: 'app-' + action.payload.code.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'ACTIVE',
        tags: action.payload.tags || ['Custom'],
        ...action.payload,
      };
      state.applications.unshift(newApp);
      state.selectedAppId = newApp.id;

      // Also create an initial DRAFT version 1.0.0
      state.versions.unshift({
        id: `ver-${newApp.code.toLowerCase()}-1.0.0`,
        applicationId: newApp.id,
        version: '1.0.0-draft',
        status: 'DRAFT',
        releaseNotes: 'Version initiale DRAFT générée automatiquement.',
        createdFrom: null,
        createdAt: new Date().toISOString(),
        publishedAt: null,
        contractsUsed: ['PF-CONTR-001@1.0.0'],
      });
    },
    updateApplication: (state, action) => {
      const idx = state.applications.findIndex((a) => a.id === action.payload.id);
      if (idx !== -1) {
        state.applications[idx] = {
          ...state.applications[idx],
          ...action.payload,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    archiveApplication: (state, action) => {
      const app = state.applications.find((a) => a.id === action.payload);
      if (app) {
        app.status = 'ARCHIVED';
        app.updatedAt = new Date().toISOString();
      }
    },
    addVersion: (state, action) => {
      state.versions.unshift({
        id: 'ver-' + Date.now(),
        createdAt: new Date().toISOString(),
        publishedAt: action.payload.status === 'ACTIVE' ? new Date().toISOString() : null,
        ...action.payload,
      });
    },
    updateVersionStatus: (state, action) => {
      const { versionId, newStatus } = action.payload;
      const ver = state.versions.find((v) => v.id === versionId);
      if (ver) {
        ver.status = newStatus;
        if (newStatus === 'ACTIVE') {
          ver.publishedAt = new Date().toISOString();
          // Supersede older active versions of this app
          state.versions.forEach((v) => {
            if (v.applicationId === ver.applicationId && v.id !== ver.id && v.status === 'ACTIVE') {
              v.status = 'SUPERSEDED';
            }
          });
        }
      }
    },
    cloneVersion: (state, action) => {
      const { sourceVersionId, newVersionNumber, releaseNotes } = action.payload;
      const source = state.versions.find((v) => v.id === sourceVersionId);
      if (source) {
        const cloned = {
          id: `ver-${source.applicationId}-${newVersionNumber.replace(/[^a-zA-Z0-9.-]/g, '')}`,
          applicationId: source.applicationId,
          version: newVersionNumber,
          status: 'DRAFT',
          releaseNotes: releaseNotes || `Cloné depuis ${source.version}.`,
          createdFrom: source.id,
          createdAt: new Date().toISOString(),
          publishedAt: null,
          contractsUsed: [...source.contractsUsed],
        };
        state.versions.unshift(cloned);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchApplicationsAsync.fulfilled, (state, action) => {
        if (!action.payload.skipped && action.payload) {
          state.applications = action.payload;
        }
      })
      .addCase(addApplicationAsync.fulfilled, (state, action) => {
        if (!action.payload.skipped && action.payload) {
          const newApp = {
            ...action.payload,
            appNumber: action.payload.code,
            activeVersion: '—',
            workspaceState: '—',
            workspaceVersion: '—',
            workspaceConfigPct: 0,
            owner: '—',
            ownerInitials: '—',
            team: [],
            teamExtraCount: 0,
            lastModifiedBy: '—',
            lastModifiedUserInitials: '—',
            lastModifiedDate: action.payload.updatedAt ? new Date(action.payload.updatedAt).toLocaleString('fr-FR') : '—',
            lastModifiedText: '—',
            iconType: 'Boxes',
            tags: [],
            category: '—',
            categoryColor: 'bg-slate-50 text-slate-600 border-slate-200',
          };
          state.applications.unshift(newApp);
          state.selectedAppId = newApp.id;
        }
      })
      .addCase(updateApplicationAsync.fulfilled, (state, action) => {
        if (!action.payload.skipped && action.payload) {
          const idx = state.applications.findIndex((a) => a.id === action.payload.id);
          if (idx !== -1) {
            state.applications[idx] = {
              ...state.applications[idx],
              ...action.payload,
              lastModifiedDate: action.payload.updatedAt ? new Date(action.payload.updatedAt).toLocaleString('fr-FR') : state.applications[idx].lastModifiedDate,
            };
          }
        }
      })
      .addCase(archiveApplicationAsync.fulfilled, (state, action) => {
        if (!action.payload.skipped && action.payload) {
          const idx = state.applications.findIndex((a) => a.id === action.payload.id);
          if (idx !== -1) {
            state.applications[idx].status = 'ARCHIVÉE';
          }
        }
      });
  },
});

export const {
  setSelectedAppId,
  addApplication,
  updateApplication,
  archiveApplication,
  addVersion,
  updateVersionStatus,
  cloneVersion,
} = applicationsSlice.actions;

export default applicationsSlice.reducer;
