import { createSlice } from '@reduxjs/toolkit';

const initialContracts = [
  {
    id: 'PF-CONTR-001',
    contractCode: 'PLATFORM-CONTRACT',
    contractVersion: '1.0.0',
    name: 'Platform Contract v1 (Socle transverse)',
    ownerTeam: 'Team 4 — Platform, API & Deployment',
    status: 'LOCKED', // LOCKED & ACTIVE
    compatibilityPolicy: 'BACKWARD_COMPATIBLE',
    publishedAt: '2026-06-01T00:00:00Z',
    deprecatedAt: null,
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    providers: ['Team 4 Platform Foundation'],
    consumers: ['Team 1 IAM', 'Team 2 ERP/Data', 'Team 3 Automation', 'Team 5 Business Manager'],
    spec: {
      type: 'object',
      required: ['id', 'code', 'version', 'tenantId', 'createdAt'],
      lifecycle: ['DRAFT', 'VALIDATING', 'READY', 'ACTIVE', 'SUPERSEDED', 'DEPRECATED', 'ARCHIVED'],
      environments: ['DEVELOPMENT', 'TEST', 'STAGING', 'PRODUCTION'],
      errorCatalog: 'PF-CDC-00 Section 11',
    },
    description: 'Contrat pivot garantissant que toutes les équipes s’interfacent avec Platform Foundation sans dépendre des détails internes.',
  },
  {
    id: 'IAM-CONTR-002',
    contractCode: 'IAM-CONTEXT-CONTRACT',
    contractVersion: '2.1.0',
    name: 'IAM Context & Security Token Contract',
    ownerTeam: 'Team 1 — IAM & Security Governance',
    status: 'ACTIVE',
    compatibilityPolicy: 'SEMVER_STRICT',
    publishedAt: '2026-03-10T11:00:00Z',
    deprecatedAt: null,
    hash: '4a6f8b919318b76dfa12b4421d0f5e71829e01938501237a6bca2384918e3810',
    providers: ['Team 1 IAM'],
    consumers: ['Team 4 Platform Foundation', 'Team 5 Business Manager'],
    spec: {
      headers: ['X-Tenant-Id', 'X-IAM-User-Id', 'X-IAM-Roles', 'X-Trace-Id'],
      signingAlgorithm: 'Ed25519',
      tokenTTL: '3600s',
    },
    description: 'Fournit le contexte d’authentification, l’isolation multi-tenant et la vérification des autorisations administratives.',
  },
  {
    id: 'ERP-CONTR-003',
    contractCode: 'ERP-ADAPTER-CONTRACT',
    contractVersion: '1.4.0',
    name: 'ERP Adapter & Data Pipeline Contract',
    ownerTeam: 'Team 2 — ERP & Data Platform',
    status: 'ACTIVE',
    compatibilityPolicy: 'BACKWARD_COMPATIBLE',
    publishedAt: '2026-05-15T09:30:00Z',
    deprecatedAt: null,
    hash: '9f83a21908234beba8210398f827103847192837461982736410982374619283',
    providers: ['Team 2 ERP/Data'],
    consumers: ['Team 4 Platform Foundation (app-erp-connector)'],
    spec: {
      schemas: ['InventorySyncMessage', 'OrderConfirmationEvent'],
      protocols: ['gRPC', 'Kafka-AVRO'],
      batchMaxSize: 5000,
    },
    description: 'Régit les échanges bidirectionnels et les schémas canoniques des transactions ERP et inventaires retail.',
  },
  {
    id: 'DATA-CONTR-004',
    contractCode: 'DATA-RUNTIME-CONTRACT',
    contractVersion: '2.0.0',
    name: 'Data Runtime & Telemetry Ingestion Contract',
    ownerTeam: 'Team 2 — ERP & Data Platform',
    status: 'VALIDATING',
    compatibilityPolicy: 'SEMVER_STRICT',
    publishedAt: null,
    deprecatedAt: null,
    hash: '1283918237461928374619827364918273641928374619283746192837461928',
    providers: ['Team 2 Data Runtime'],
    consumers: ['Team 4 Platform Foundation'],
    spec: {
      streamingProtocol: 'OpenTelemetry-gRPC',
      metrics: ['p99_latency_ms', 'error_rate_percent', 'memory_usage_mb'],
      compression: 'zstd',
    },
    description: 'En cours de validation pour la standardisation des métriques temps réel du cockpit Platform Foundation.',
  },
  {
    id: 'AUTO-CONTR-005',
    contractCode: 'AUTOMATION-CONTRACT',
    contractVersion: '1.0.0',
    name: 'Automation & Workflow Execution Contract',
    ownerTeam: 'Team 3 — Automation & Scheduling',
    status: 'DRAFT',
    compatibilityPolicy: 'SEMVER_STRICT',
    publishedAt: null,
    deprecatedAt: null,
    hash: '7162534127839102837461928374619283746192837461928374619283746192',
    providers: ['Team 3 Automation'],
    consumers: ['Team 4 Platform Foundation'],
    spec: {
      triggerModes: ['CRON', 'WEBHOOK', 'MANUAL'],
      concurrencyLimit: 20,
    },
    description: 'Contrat en brouillon régissant l’exécution automatique des snapshots planifiés et des tests de charge.',
  },
  {
    id: 'BUS-CONTR-006',
    contractCode: 'BUSINESS-CONTRACT',
    contractVersion: '1.2.0',
    name: 'Business Context & Tenant Organization Contract',
    ownerTeam: 'Team 5 — Business Management',
    status: 'ACTIVE',
    compatibilityPolicy: 'BACKWARD_COMPATIBLE',
    publishedAt: '2026-04-10T14:00:00Z',
    deprecatedAt: null,
    hash: '8392019283746192837461928374619283746192837461928374619283746192',
    providers: ['Team 5 Business'],
    consumers: ['Team 4 Platform Foundation', 'Team 1 IAM'],
    spec: {
      hierarchy: ['Organization', 'Tenant', 'StoreUnit', 'Terminal'],
      currencySupported: ['EUR', 'USD', 'GBP'],
    },
    description: 'Définit les attributs organisationnels des tenants pour l’héritage de configuration.',
  },
  {
    id: 'PACK-CONTR-007',
    contractCode: 'PACK-MANIFEST-CONTRACT',
    contractVersion: '1.1.0',
    name: 'Pack Manifest Standard Contract',
    ownerTeam: 'Team 4 — Platform, API & Deployment',
    status: 'ACTIVE',
    compatibilityPolicy: 'BACKWARD_COMPATIBLE',
    publishedAt: '2026-05-01T08:00:00Z',
    deprecatedAt: null,
    hash: '556677889900aabbccddeeff11223344556677889900aabbccddeeff11223344',
    providers: ['Team 4 Platform Foundation'],
    consumers: ['Team 1', 'Team 2', 'Team 3', 'Team 5'],
    spec: {
      structure: ['packId', 'entrypoints', 'dependencies', 'exposedContracts'],
      validator: 'PlatformManifestValidator-v1',
    },
    description: 'Manifeste d’empaquetage standardisé permettant le déploiement cohérent de tous les packs Techzone.',
  },
  {
    id: 'RUN-CONTR-008',
    contractCode: 'RUNTIME-MANIFEST-CONTRACT',
    contractVersion: '1.0.0',
    name: 'Effective Runtime Manifest Contract',
    ownerTeam: 'Team 4 — Platform, API & Deployment',
    status: 'LOCKED',
    compatibilityPolicy: 'SEMVER_STRICT',
    publishedAt: '2026-06-15T09:00:00Z',
    deprecatedAt: null,
    hash: '3344556677889900aabbccddeeff11223344556677889900aabbccddeeff1122',
    providers: ['Team 4 Platform Foundation'],
    consumers: ['Runtime Containers / K8s Operator'],
    spec: {
      format: 'JSON-Schema-v2020-12',
      securityProfile: 'RestrictedContainer-v3',
    },
    description: 'Manifeste d’exécution effectif généré à chaque snapshot pour figer les configurations et artefacts.',
  },
];

const contractsSlice = createSlice({
  name: 'contracts',
  initialState: {
    contracts: initialContracts,
    selectedContractId: 'PF-CONTR-001',
    filterStatus: 'ALL',
  },
  reducers: {
    setSelectedContractId: (state, action) => {
      state.selectedContractId = action.payload;
    },
    setFilterStatus: (state, action) => {
      state.filterStatus = action.payload;
    },
    lockContract: (state, action) => {
      const contract = state.contracts.find((c) => c.id === action.payload);
      if (contract) {
        contract.status = 'LOCKED';
      }
    },
    updateContractStatus: (state, action) => {
      const { id, status } = action.payload;
      const contract = state.contracts.find((c) => c.id === id);
      if (contract) {
        contract.status = status;
        if (status === 'ACTIVE' && !contract.publishedAt) {
          contract.publishedAt = new Date().toISOString();
        }
        if (status === 'DEPRECATED' && !contract.deprecatedAt) {
          contract.deprecatedAt = new Date().toISOString();
        }
      }
    },
    addContract: (state, action) => {
      const newContract = {
        id: 'CONTR-' + Date.now().toString(36).toUpperCase(),
        status: 'DRAFT',
        publishedAt: null,
        deprecatedAt: null,
        consumers: [],
        providers: ['Team 4 Platform Foundation'],
        ...action.payload,
      };
      state.contracts.unshift(newContract);
      state.selectedContractId = newContract.id;
    },
  },
});

export const {
  setSelectedContractId,
  setFilterStatus,
  lockContract,
  updateContractStatus,
  addContract,
} = contractsSlice.actions;

export default contractsSlice.reducer;
