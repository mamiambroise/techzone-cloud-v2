import { createSlice } from '@reduxjs/toolkit';

// Standard Error Codes defined in API-CDC-00 Section 8 & API-CDC-07 Section 3
export const INTEGRATION_ERROR_CODES = {
  UNAVAILABLE: 'INTEGRATION_PROVIDER_UNAVAILABLE',
  AUTH_FAILED: 'INTEGRATION_AUTH_FAILED',
  TIMEOUT: 'INTEGRATION_TIMEOUT',
  RATE_LIMITED: 'INTEGRATION_RATE_LIMITED',
  PAYLOAD_INVALID: 'INTEGRATION_PAYLOAD_INVALID',
  CONTRACT_UNSUPPORTED: 'INTEGRATION_CONTRACT_UNSUPPORTED',
  WEBHOOK_SIG_FAILED: 'WEBHOOK_SIGNATURE_FAILED',
  SYNC_CONFLICT: 'SYNCHRONIZATION_CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_INTEGRATION_ERROR',
};

// Initial Connectors (API-CDC-02)
const initialConnectors = [
  {
    id: 'conn-sap-erp',
    code: 'SAP-S4HANA-ADAPTER',
    name: 'SAP S/4HANA Enterprise ERP',
    providerType: 'REST', // REST, GRAPHQL, DATABASE_ADAPTER, FILE, MESSAGE_QUEUE, CUSTOM_PROVIDER
    contractVersion: 'v1.2.0',
    status: 'ACTIVE', // DRAFT, CONFIGURING, VALIDATING, READY, ACTIVE, DEGRADED, DISABLED, ARCHIVED
    configurationSchema: {
      endpoint: 'https://gateway.internal.techzone.io/sap/opu/odata',
      timeoutMs: 8000,
      retryCount: 3,
      circuitBreaker: { failureThreshold: 5, resetTimeoutMs: 30000 },
    },
    credentialRef: 'cred-ref-sap-prod-01',
    capabilities: ['read', 'write', 'sync', 'batch'],
    health: {
      status: 'HEALTHY',
      lastChecked: 'Il y a 2 min',
      latencyMs: 142,
      availabilityPct: 99.8,
    },
    mode: 'REAL', // REAL or MOCK
  },
  {
    id: 'conn-stripe-billing',
    code: 'STRIPE-PAYMENTS-API',
    name: 'Stripe Global Payment Gateway',
    providerType: 'REST',
    contractVersion: 'v2023-10-16',
    status: 'ACTIVE',
    configurationSchema: {
      endpoint: 'https://api.stripe.com/v1',
      timeoutMs: 5000,
      rateLimitPerSec: 100,
    },
    credentialRef: 'cred-ref-stripe-live-02',
    capabilities: ['read', 'write', 'webhook'],
    health: {
      status: 'HEALTHY',
      lastChecked: 'Il y a 1 min',
      latencyMs: 89,
      availabilityPct: 99.95,
    },
    mode: 'REAL',
  },
  {
    id: 'conn-salesforce-crm',
    code: 'SALESFORCE-CORE-GRAPHQL',
    name: 'Salesforce Enterprise CRM',
    providerType: 'GRAPHQL',
    contractVersion: 'v1.0.4',
    status: 'DEGRADED',
    configurationSchema: {
      endpoint: 'https://techzone.my.salesforce.com/services/graphql',
      timeoutMs: 12000,
      queryComplexityLimit: 200,
    },
    credentialRef: 'cred-ref-sf-oauth-03',
    capabilities: ['read', 'write', 'sync'],
    health: {
      status: 'DEGRADED',
      lastChecked: 'Il y a 4 min',
      latencyMs: 1240,
      availabilityPct: 96.4,
      issue: 'Latence anormale et taux d\'erreur 429 (Rate Limit)',
    },
    mode: 'REAL',
  },
  {
    id: 'conn-kafka-events',
    code: 'KAFKA-LOGISTICS-BUS',
    name: 'Apache Kafka Event Streaming Bus',
    providerType: 'MESSAGE_QUEUE',
    contractVersion: 'v3.2.0',
    status: 'ACTIVE',
    configurationSchema: {
      brokers: 'kafka-01.internal:9092,kafka-02.internal:9092',
      topicPrefix: 'techzone.integrations.',
      ackMode: 'ALL',
    },
    credentialRef: 'cred-ref-kafka-cert-04',
    capabilities: ['write', 'sync', 'batch'],
    health: {
      status: 'HEALTHY',
      lastChecked: 'Il y a 30 sec',
      latencyMs: 18,
      availabilityPct: 99.99,
    },
    mode: 'REAL',
  },
  {
    id: 'conn-mock-logistics',
    code: 'MOCK-CARRIER-PARTNER',
    name: 'Transporteur Partner Sandbox (Mock)',
    providerType: 'CUSTOM_PROVIDER',
    contractVersion: 'v1.0.0',
    status: 'READY',
    configurationSchema: {
      mockLatencyMs: 250,
      simulatedFailureRate: 0.05,
    },
    credentialRef: 'cred-ref-mock-05',
    capabilities: ['read', 'write', 'webhook'],
    health: {
      status: 'HEALTHY',
      lastChecked: 'Il y a 5 min',
      latencyMs: 45,
      availabilityPct: 100.0,
    },
    mode: 'MOCK',
  },
];

// Initial Exposed APIs (API-CDC-03)
const initialApis = [
  {
    id: 'api-orders-v1',
    apiCode: 'ORDERS-INGESTION-API',
    name: 'Commandes Omnicanal Ingestion',
    version: 'v1.3.0',
    basePath: '/api/v1/orders',
    operations: [
      { method: 'POST', path: '/', summary: 'Créer une commande', idempotencyRequired: true, rateLimit: '150 req/min' },
      { method: 'GET', path: '/:id', summary: 'Obtenir l\'état d\'une commande', rateLimit: '300 req/min' },
      { method: 'GET', path: '/', summary: 'Rechercher et paginer les commandes', rateLimit: '120 req/min' },
    ],
    authentication: 'BEARER_JWT',
    authorization: ['orders.read', 'orders.write', 'tenant.scope'],
    rateLimit: '250 req/min',
    status: 'PUBLISHED', // DRAFT, PUBLISHED, DEPRECATED, RETIRED
    requestSchema: 'OrderPayloadSchema_v1.3',
    responseSchema: 'OrderResponseSchema_v1.3',
    totalRequests24h: 45210,
    errorRatePct: 0.12,
    p95LatencyMs: 115,
  },
  {
    id: 'api-catalog-v2',
    apiCode: 'CATALOG-SYNC-API',
    name: 'Catalogue Produits & Stocks',
    version: 'v2.0.1',
    basePath: '/api/v2/catalog',
    operations: [
      { method: 'GET', path: '/items', summary: 'Lister les articles avec pagination', rateLimit: '500 req/min' },
      { method: 'POST', path: '/items/batch', summary: 'Mise à jour incrémentale de stocks', idempotencyRequired: true, rateLimit: '60 req/min' },
    ],
    authentication: 'API_KEY_SCOPED',
    authorization: ['catalog.read', 'catalog.sync'],
    rateLimit: '500 req/min',
    status: 'PUBLISHED',
    requestSchema: 'CatalogSyncPayloadSchema_v2',
    responseSchema: 'CatalogSyncResponseSchema_v2',
    totalRequests24h: 128450,
    errorRatePct: 0.05,
    p95LatencyMs: 64,
  },
  {
    id: 'api-partner-dispatch',
    apiCode: 'PARTNER-DISPATCH-API',
    name: 'Dispatch Expéditions Partenaires',
    version: 'v1.0.0',
    basePath: '/api/v1/dispatch',
    operations: [
      { method: 'POST', path: '/labels', summary: 'Générer bordereau d\'expédition', idempotencyRequired: true, rateLimit: '60 req/min' },
    ],
    authentication: 'MUTUAL_TLS',
    authorization: ['dispatch.partner'],
    rateLimit: '100 req/min',
    status: 'PUBLISHED',
    requestSchema: 'DispatchOrderSchema_v1',
    responseSchema: 'DispatchLabelSchema_v1',
    totalRequests24h: 8940,
    errorRatePct: 1.4,
    p95LatencyMs: 380,
  },
];

// Initial Webhooks (API-CDC-04)
const initialWebhooks = [
  {
    id: 'wh-order-created',
    code: 'WH-OUT-ORDER-CREATED',
    direction: 'OUTBOUND', // INBOUND or OUTBOUND
    event: 'order.created',
    endpoint: 'https://logistics.partner.eu/webhooks/orders',
    status: 'ACTIVE',
    secretRef: 'cred-ref-wh-secret-01',
    signaturePolicy: 'HMAC-SHA256',
    retryPolicy: { maxAttempts: 5, backoff: 'EXPONENTIAL', initialDelayMs: 1000 },
    timeout: 5000,
    filters: { tenant: 'tenant-retail-fr', priority: 'HIGH' },
    deliveriesCount24h: 3420,
    successRatePct: 99.4,
  },
  {
    id: 'wh-stripe-charge',
    code: 'WH-IN-STRIPE-PAYMENT',
    direction: 'INBOUND',
    event: 'payment_intent.succeeded',
    endpoint: '/api/integrations/webhooks/stripe',
    status: 'ACTIVE',
    secretRef: 'cred-ref-stripe-wh-02',
    signaturePolicy: 'STRIPE-SIGNATURE-V1',
    retryPolicy: { maxAttempts: 3, backoff: 'LINEAR', initialDelayMs: 2000 },
    timeout: 4000,
    filters: {},
    deliveriesCount24h: 1890,
    successRatePct: 100.0,
  },
  {
    id: 'wh-inventory-low',
    code: 'WH-OUT-INVENTORY-ALERT',
    direction: 'OUTBOUND',
    event: 'inventory.threshold_breached',
    endpoint: 'https://erp-webhook.techzone.io/v1/alerts',
    status: 'ACTIVE',
    secretRef: 'cred-ref-erp-wh-03',
    signaturePolicy: 'HMAC-SHA256',
    retryPolicy: { maxAttempts: 3, backoff: 'EXPONENTIAL', initialDelayMs: 3000 },
    timeout: 6000,
    filters: {},
    deliveriesCount24h: 420,
    successRatePct: 98.8,
  },
];

// Initial Webhook Deliveries (API-CDC-04 Section 5)
const initialWebhookDeliveries = [
  {
    deliveryId: 'del-9012',
    webhookCode: 'WH-OUT-ORDER-CREATED',
    eventId: 'evt-ord-88391',
    direction: 'OUTBOUND',
    attempt: 1,
    status: 'SUCCEEDED',
    httpStatus: 200,
    duration: 124,
    timestamp: 'Il y a 3 min',
    traceId: 'tr-int-77a8b9c0',
    payloadExcerpt: '{"orderId":"ORD-2026-9921","amount":349.90,"currency":"EUR"}',
  },
  {
    deliveryId: 'del-9011',
    webhookCode: 'WH-IN-STRIPE-PAYMENT',
    eventId: 'evt-pi-440192',
    direction: 'INBOUND',
    attempt: 1,
    status: 'SUCCEEDED',
    httpStatus: 200,
    duration: 68,
    timestamp: 'Il y a 8 min',
    traceId: 'tr-int-99c0d1e2',
    payloadExcerpt: '{"id":"pi_3MtwL24x","status":"succeeded","amount":12500}',
  },
  {
    deliveryId: 'del-9010',
    webhookCode: 'WH-OUT-ORDER-CREATED',
    eventId: 'evt-ord-88389',
    direction: 'OUTBOUND',
    attempt: 2,
    status: 'FAILED',
    httpStatus: 504,
    duration: 5012,
    timestamp: 'Il y a 18 min',
    traceId: 'tr-int-33e4f5a6',
    nextRetryAt: 'Dans 2 min',
    payloadExcerpt: '{"orderId":"ORD-2026-9918","amount":89.00,"currency":"EUR"}',
  },
];

// Initial Credential References (API-CDC-05) - NO-GO Compliant: NO Real Secrets on Frontend!
const initialCredentials = [
  {
    id: 'cred-ref-sap-prod-01',
    code: 'CRED-SAP-S4HANA-PROD',
    type: 'BASIC_AUTH', // API_KEY, BASIC_AUTH, BEARER_TOKEN, OAUTH_CLIENT, CERTIFICATE_REFERENCE, CUSTOM_SECRET_REFERENCE
    provider: 'VAULT_KMS',
    status: 'ACTIVE',
    associatedConnector: 'conn-sap-erp',
    lastRotatedAt: '2026-08-15',
    expiresAt: '2027-08-15',
    metadataSafe: {
      username: 'techzone_integration_svc',
      maskedSecret: '•••••••••••• (32 octets)',
      vaultKeyId: 'vault/kv/integrations/sap-prod/key-01',
    },
  },
  {
    id: 'cred-ref-stripe-live-02',
    code: 'CRED-STRIPE-LIVE-KEY',
    type: 'API_KEY',
    provider: 'AWS_SECRETS_MANAGER',
    status: 'ACTIVE',
    associatedConnector: 'conn-stripe-billing',
    lastRotatedAt: '2026-07-01',
    expiresAt: '2027-01-01',
    metadataSafe: {
      keyPrefix: 'rk_live_',
      maskedSecret: 'rk_live_••••••••••••9F3c',
      vaultKeyId: 'asm:secret:stripe-restricted-prod',
    },
  },
  {
    id: 'cred-ref-sf-oauth-03',
    code: 'CRED-SALESFORCE-OAUTH2',
    type: 'OAUTH_CLIENT',
    provider: 'GCP_SECRET_MANAGER',
    status: 'ACTIVE',
    associatedConnector: 'conn-salesforce-crm',
    lastRotatedAt: '2026-08-20',
    expiresAt: '2026-11-20',
    metadataSafe: {
      clientId: '3MVG9lKcPeChReE5.techzone.oauth',
      maskedSecret: '•••••••••••• (Client Secret masqué)',
      tokenEndpoint: 'https://login.salesforce.com/services/oauth2/token',
    },
  },
  {
    id: 'cred-ref-kafka-cert-04',
    code: 'CRED-KAFKA-MTLS-CERT',
    type: 'CERTIFICATE_REFERENCE',
    provider: 'HASHICORP_VAULT_PKI',
    status: 'ACTIVE',
    associatedConnector: 'conn-kafka-events',
    lastRotatedAt: '2026-06-10',
    expiresAt: '2027-06-10',
    metadataSafe: {
      certificateFingerprint: 'SHA256:7B:3A:99:C1:...:F4',
      vaultKeyId: 'vault/pki/certs/kafka-client-cert',
    },
  },
  {
    id: 'cred-ref-wh-secret-01',
    code: 'CRED-WEBHOOK-HMAC-SIGNER',
    type: 'CUSTOM_SECRET_REFERENCE',
    provider: 'VAULT_KMS',
    status: 'ACTIVE',
    associatedConnector: 'wh-order-created',
    lastRotatedAt: '2026-08-01',
    expiresAt: '2027-08-01',
    metadataSafe: {
      algorithm: 'HMAC-SHA256',
      maskedSecret: '••••••••••••••••••••',
    },
  },
];

// Initial Synchronizations (API-CDC-06)
const initialSyncJobs = [
  {
    id: 'sync-sap-inventory',
    code: 'SYNC-SAP-INVENTORY-DELTA',
    name: 'Stock Articles SAP -> Techzone Hub',
    connectorId: 'conn-sap-erp',
    source: 'SAP S/4HANA / MaterialStockSet',
    target: 'Techzone Catalog DB / InventoryStock',
    mode: 'INCREMENTAL', // PULL, PUSH, BIDIRECTIONAL, FULL, INCREMENTAL
    schedule: 'Toutes les 15 minutes',
    mappingRef: 'map-sap-tz-stock-v1',
    conflictPolicy: 'SOURCE_WINS', // SOURCE_WINS, TARGET_WINS, NEWEST_WINS, MANUAL_REVIEW
    batchSize: 500,
    status: 'SUCCEEDED', // PENDING, RUNNING, SUCCEEDED, PARTIAL, FAILED, PAUSED, CANCELLED
    lastExecution: {
      startedAt: 'Il y a 14 min',
      duration: '42s',
      recordsRead: 1450,
      recordsWritten: 1448,
      conflicts: 2,
      checkpoint: '2026-09-02T13:45:00Z_REC_1450',
    },
  },
  {
    id: 'sync-sf-customers',
    code: 'SYNC-SF-CUSTOMERS-BI',
    name: 'Comptes Clients Salesforce <-> Retail',
    connectorId: 'conn-salesforce-crm',
    source: 'Salesforce Contact / Account',
    target: 'Techzone CRM Store / Users',
    mode: 'BIDIRECTIONAL',
    schedule: 'Toutes les heures',
    mappingRef: 'map-sf-tz-customer-v2',
    conflictPolicy: 'NEWEST_WINS',
    batchSize: 200,
    status: 'PARTIAL',
    lastExecution: {
      startedAt: 'Il y a 35 min',
      duration: '1m 18s',
      recordsRead: 820,
      recordsWritten: 795,
      conflicts: 25,
      checkpoint: 'SF_MOD_DATE_20260902_1330',
      issue: '25 conflits résolus avec politique NEWEST_WINS',
    },
  },
  {
    id: 'sync-orders-archive',
    code: 'SYNC-ORDERS-COLD-ARCHIVE',
    name: 'Archivage Commandes Clôturées Kafka',
    connectorId: 'conn-kafka-events',
    source: 'Techzone Orders Lake',
    target: 'Kafka Topic orders.archive',
    mode: 'PUSH',
    schedule: 'Quotidien à 02:00 UTC',
    mappingRef: 'map-orders-kafka-v1',
    conflictPolicy: 'TARGET_WINS',
    batchSize: 1000,
    status: 'SUCCEEDED',
    lastExecution: {
      startedAt: 'Il y a 12h',
      duration: '3m 40s',
      recordsRead: 12400,
      recordsWritten: 12400,
      conflicts: 0,
      checkpoint: 'OFFSET_KAFKA_889021',
    },
  },
];

// Initial Diagnostic Logs (API-CDC-07)
const initialDiagnostics = [
  {
    id: 'diag-001',
    traceId: 'tr-int-77a8b9c0',
    tenantId: 'tenant-retail-fr',
    connector: 'STRIPE-PAYMENTS-API',
    operation: 'POST /v1/payment_intents',
    direction: 'OUTBOUND',
    startedAt: '2026-09-02 14:08:12',
    finishedAt: '2026-09-02 14:08:12',
    duration: 89,
    status: 'SUCCESS',
    errorCode: null,
    attempt: 1,
    rootCause: 'Opération nominale - SLA respecté',
  },
  {
    id: 'diag-002',
    traceId: 'tr-int-88b9c0d1',
    tenantId: 'tenant-retail-fr',
    connector: 'SALESFORCE-CORE-GRAPHQL',
    operation: 'QUERY contactsDelta',
    direction: 'OUTBOUND',
    startedAt: '2026-09-02 14:05:40',
    finishedAt: '2026-09-02 14:05:41',
    duration: 1240,
    status: 'WARNING',
    errorCode: INTEGRATION_ERROR_CODES.RATE_LIMITED,
    attempt: 2,
    rootCause: '429 Too Many Requests reçu du provider externe. Backoff exponentiel appliqué avec succès.',
  },
  {
    id: 'diag-003',
    traceId: 'tr-int-33e4f5a6',
    tenantId: 'tenant-logistics-de',
    connector: 'WH-OUT-ORDER-CREATED',
    operation: 'POST https://logistics.partner.eu/webhooks/orders',
    direction: 'OUTBOUND',
    startedAt: '2026-09-02 13:52:10',
    finishedAt: '2026-09-02 13:52:15',
    duration: 5012,
    status: 'FAILURE',
    errorCode: INTEGRATION_ERROR_CODES.TIMEOUT,
    attempt: 2,
    rootCause: 'Le endpoint partenaire distant n\'a pas répondu dans le délai imparti de 5000ms. Tentative de retry planifiée.',
  },
  {
    id: 'diag-004',
    traceId: 'tr-int-44f5a6b7',
    tenantId: 'tenant-core-global',
    connector: 'SAP-S4HANA-ADAPTER',
    operation: 'BATCH POST /MaterialStockSet',
    direction: 'INBOUND',
    startedAt: '2026-09-02 13:46:12',
    finishedAt: '2026-09-02 13:46:13',
    duration: 142,
    status: 'SUCCESS',
    errorCode: null,
    attempt: 1,
    rootCause: 'Pipeline de synchronisation incrémentale validé.',
  },
  {
    id: 'diag-005',
    traceId: 'tr-int-11c2d3e4',
    tenantId: 'tenant-retail-fr',
    connector: 'MOCK-CARRIER-PARTNER',
    operation: 'POST /v1/shipments/verify',
    direction: 'OUTBOUND',
    startedAt: '2026-09-02 13:30:00',
    finishedAt: '2026-09-02 13:30:00',
    duration: 45,
    status: 'SUCCESS',
    errorCode: null,
    attempt: 1,
    rootCause: 'MockIntegrationProvider conforme au contrat v1.',
  },
];

const initialState = {
  activePack: 'integration', // 'platform' | 'integration'
  activeIntegrationTab: 'cockpit', // 'cockpit' | 'connectors' | 'apis' | 'webhooks' | 'credentials' | 'sync' | 'diagnostics' | 'contracts-v1'
  providerMode: 'REAL', // 'REAL' | 'MOCK'
  contractV1Locked: true,
  healthStatus: 'HEALTHY', // HEALTHY, WARNING, DEGRADED, CRITICAL, UNKNOWN
  connectors: initialConnectors,
  apis: initialApis,
  webhooks: initialWebhooks,
  webhookDeliveries: initialWebhookDeliveries,
  credentials: initialCredentials,
  syncJobs: initialSyncJobs,
  diagnostics: initialDiagnostics,
  selectedConnectorId: initialConnectors[0].id,
  selectedApiId: initialApis[0].id,
  selectedWebhookId: initialWebhooks[0].id,
  selectedSyncId: initialSyncJobs[0].id,
  selectedTraceId: null,
  activePipelineRun: null, // For interactive sync pipeline simulator
};

const integrationSlice = createSlice({
  name: 'integration',
  initialState,
  reducers: {
    setActivePack: (state, action) => {
      state.activePack = action.payload;
    },
    setActiveIntegrationTab: (state, action) => {
      state.activeIntegrationTab = action.payload;
    },
    setProviderMode: (state, action) => {
      state.providerMode = action.payload;
    },
    toggleContractV1Lock: (state) => {
      state.contractV1Locked = !state.contractV1Locked;
    },
    setSelectedConnectorId: (state, action) => {
      state.selectedConnectorId = action.payload;
    },
    setSelectedApiId: (state, action) => {
      state.selectedApiId = action.payload;
    },
    setSelectedWebhookId: (state, action) => {
      state.selectedWebhookId = action.payload;
    },
    setSelectedSyncId: (state, action) => {
      state.selectedSyncId = action.payload;
    },
    setSelectedSyncJobId: (state, action) => {
      state.selectedSyncId = action.payload;
    },
    setSelectedTraceId: (state, action) => {
      state.selectedTraceId = action.payload;
    },
    // Connector Actions
    addConnector: (state, action) => {
      state.connectors.push(action.payload);
      state.selectedConnectorId = action.payload.id;
    },
    updateConnectorStatus: (state, action) => {
      const { id, status } = action.payload;
      const conn = state.connectors.find((c) => c.id === id);
      if (conn) {
        conn.status = status;
      }
    },
    pingConnector: (state, action) => {
      const conn = state.connectors.find((c) => c.id === action.payload);
      if (conn) {
        conn.health.lastChecked = 'À l\'instant';
        conn.health.latencyMs = Math.floor(Math.random() * 80) + 40;
        conn.health.status = 'HEALTHY';
      }
    },
    // API Actions
    addApi: (state, action) => {
      state.apis.push(action.payload);
      state.selectedApiId = action.payload.id;
    },
    updateApiStatus: (state, action) => {
      const { id, status } = action.payload;
      const api = state.apis.find((a) => a.id === id);
      if (api) {
        api.status = status;
      }
    },
    // Webhook Actions
    addWebhook: (state, action) => {
      state.webhooks.push(action.payload);
      state.selectedWebhookId = action.payload.id;
    },
    triggerTestWebhook: (state, action) => {
      const { webhookId, event, simulatedStatus } = action.payload;
      const wh = state.webhooks.find((w) => w.id === webhookId);
      const newDelivery = {
        deliveryId: 'del-' + Math.floor(1000 + Math.random() * 9000),
        webhookCode: wh?.code || 'WH-TEST',
        eventId: 'evt-test-' + Date.now().toString(36),
        direction: wh?.direction || 'OUTBOUND',
        attempt: 1,
        status: simulatedStatus || 'SUCCEEDED',
        httpStatus: simulatedStatus === 'FAILED' ? 500 : 200,
        duration: Math.floor(Math.random() * 120) + 45,
        timestamp: 'À l\'instant',
        traceId: 'tr-int-' + Math.random().toString(36).substr(2, 8),
        payloadExcerpt: JSON.stringify({ testEvent: event || 'ping.test', triggeredAt: new Date().toISOString() }),
      };
      state.webhookDeliveries.unshift(newDelivery);
    },
    // Credential Actions (API-CDC-05)
    addCredentialReference: (state, action) => {
      state.credentials.push(action.payload);
    },
    rotateCredential: (state, action) => {
      const { id } = action.payload;
      const cred = state.credentials.find((c) => c.id === id);
      if (cred) {
        cred.lastRotatedAt = new Date().toISOString().split('T')[0];
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        cred.expiresAt = nextYear.toISOString().split('T')[0];
      }
    },
    // Synchronization Pipeline Simulator (API-CDC-06)
    addSyncJob: (state, action) => {
      state.syncJobs.push(action.payload);
    },
    startSyncPipeline: (state, action) => {
      const syncId = typeof action.payload === 'object' ? action.payload.jobId || action.payload.syncId : action.payload;
      const sync = state.syncJobs.find((s) => s.id === syncId);
      if (sync) {
        sync.status = 'RUNNING';
        state.activePipelineRun = {
          jobId: syncId,
          syncId,
          step: 'INITIALIZING',
          stage: 'LOAD_CONFIG',
          progress: 15,
          progressPct: 15,
          logs: ['[0.0s] Démarrage du pipeline orchestré... Chargement de la configuration validée'],
        };
      }
    },
    updatePipelineProgress: (state, action) => {
      const { step, progress, log } = action.payload;
      if (state.activePipelineRun) {
        if (step) {
          state.activePipelineRun.step = step;
          state.activePipelineRun.stage = step;
        }
        if (progress !== undefined) {
          state.activePipelineRun.progress = progress;
          state.activePipelineRun.progressPct = progress;
        }
        if (log) {
          state.activePipelineRun.logs.push(log);
        }
      }
    },
    finishSyncPipeline: (state, action) => {
      if (state.activePipelineRun) {
        const syncId = state.activePipelineRun.jobId || state.activePipelineRun.syncId;
        const sync = state.syncJobs.find((s) => s.id === syncId);
        if (sync) {
          sync.status = 'SUCCEEDED';
          sync.lastExecution = {
            startedAt: 'À l\'instant',
            durationMs: 1240,
            recordsRead: action.payload?.recordsRead || 154,
            recordsWritten: action.payload?.recordsWritten || 152,
            conflictsCount: action.payload?.conflictsCount || 2,
            status: 'SUCCEEDED',
          };
        }
        state.activePipelineRun = null;
      }
    },
    advanceSyncPipeline: (state, action) => {
      const { syncId, stage, progressPct, log, isComplete } = action.payload;
      if (state.activePipelineRun && (state.activePipelineRun.syncId === syncId || state.activePipelineRun.jobId === syncId)) {
        state.activePipelineRun.stage = stage;
        state.activePipelineRun.step = stage;
        state.activePipelineRun.progressPct = progressPct;
        state.activePipelineRun.progress = progressPct;
        state.activePipelineRun.logs.push(log);
        if (isComplete) {
          const sync = state.syncJobs.find((s) => s.id === syncId);
          if (sync) {
            sync.status = 'SUCCEEDED';
            sync.lastExecution = {
              startedAt: 'À l\'instant',
              duration: '12s',
              recordsRead: Math.floor(Math.random() * 500) + 200,
              recordsWritten: Math.floor(Math.random() * 500) + 198,
              conflicts: 2,
              checkpoint: 'CP_' + Date.now(),
            };
          }
          state.activePipelineRun = null;
        }
      }
    },
    resetSyncPipeline: (state) => {
      state.activePipelineRun = null;
    },
    // Diagnostics Actions
    addDiagnosticLog: (state, action) => {
      state.diagnostics.unshift({
        id: 'diag-' + Date.now(),
        ...action.payload,
      });
    },
  },
});

export const {
  setActivePack,
  setActiveIntegrationTab,
  setProviderMode,
  toggleContractV1Lock,
  setSelectedConnectorId,
  setSelectedApiId,
  setSelectedWebhookId,
  setSelectedSyncId,
  setSelectedSyncJobId,
  setSelectedTraceId,
  addConnector,
  updateConnectorStatus,
  pingConnector,
  addApi,
  updateApiStatus,
  addWebhook,
  triggerTestWebhook,
  addCredentialReference,
  rotateCredential,
  addSyncJob,
  startSyncPipeline,
  updatePipelineProgress,
  finishSyncPipeline,
  advanceSyncPipeline,
  resetSyncPipeline,
  addDiagnosticLog,
} = integrationSlice.actions;

export default integrationSlice.reducer;
