import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const IAM_URL = import.meta.env.VITE_IAM_URL || '/api/iam';

let refreshPromise = null;
export function refreshSession() {
  if (!refreshPromise) refreshPromise = authApi.post('/auth/refresh').finally(() => { refreshPromise = null; });
  return refreshPromise;
}

function normalizeResponse(response) {
  const body = response.data;
  if (!response.config?.preserveEnvelope && body && typeof body === 'object' && 'success' in body && 'data' in body) {
    response.data = body.data;
  }
  return response;
}

function buildNormalizedError(response, config, error) {
  const statusCode = response?.status;
  const data = response?.data || {};
  const traceId =
    response?.headers?.['x-trace-id'] ||
    response?.headers?.['x-request-id'] ||
    data.traceId ||
    config?.headers?.['X-Trace-Id'] ||
    null;
  const message = data?.message || error.message || 'Network error';
  const code = data?.code;

  let type = 'ERROR';
  if (statusCode === 401) type = 'UNAUTHORIZED';
  else if (statusCode === 403) type = 'FORBIDDEN';
  else if (code === 'ERP_INSTANCE_NOT_CONFIGURED') type = 'ERP_NOT_CONFIGURED';
  else if (code === 'ERP_UNAVAILABLE') type = 'ERP_UNAVAILABLE';
  else if (code === 'ERP_PROVIDER_REQUIRED') type = 'ERP_PROVIDER_REQUIRED';
  else if (code === 'ERP_PROVIDER_UNSUPPORTED') type = 'ERP_PROVIDER_UNSUPPORTED';
  else if (code === 'TENANT_REQUIRED') type = 'TENANT_REQUIRED';
  else if (code === 'USER_REQUIRED') type = 'USER_REQUIRED';

  const normalized = {
    type,
    statusCode: statusCode || 500,
    code,
    message,
    traceId,
    details: data?.details,
  };

  if (type === 'UNAUTHORIZED') {
    window.dispatchEvent(new CustomEvent('iam:unauthorized'));
  }

  if (code === 'TENANT_REQUIRED') {
    window.dispatchEvent(new CustomEvent('tenant:required', { detail: normalized }));
  }

  if (config?.errorHandling !== 'local') window.dispatchEvent(new CustomEvent('api:error', { detail: normalized }));
  return normalized;
}

function createApiClient(baseURL) {
  const instance = axios.create({
    baseURL,
    timeout: 15000,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.response.use(normalizeResponse, (error) => {
    if (axios.isCancel(error)) return Promise.reject(error);
    const { response, config = {} } = error;
    const statusCode = response?.status;

    if (!response || statusCode === 401) {
      const isAuthEndpoint = config.url?.includes('/auth/refresh') ||
        config.url?.includes('/auth/login') ||
        config.url?.includes('/auth/register') ||
        config.url?.includes('/auth/login/mfa') ||
        config.url?.includes('/auth/forgot') ||
        config.url?.includes('/auth/reset');

      if (isAuthEndpoint) {
        const normalized = buildNormalizedError(response, config, error);
        error.normalized = normalized;
        return Promise.reject(error);
      }

      if (!response) {
        const normalized = {
          type: 'ERROR',
          statusCode: 500,
          code: null,
          message: error.message || 'Network error',
          traceId: null,
          details: null,
        };
        if (config?.errorHandling !== 'local') window.dispatchEvent(new CustomEvent('api:error', { detail: normalized }));
        error.normalized = normalized;
        return Promise.reject(error);
      }

      if (config._retriedAfterRefresh) {
        error.normalized = buildNormalizedError(response, config, error);
        return Promise.reject(error);
      }
      config._retriedAfterRefresh = true;
      return refreshSession().then(() => instance(config));
    }

    const normalized = buildNormalizedError(response, config, error);
    error.normalized = normalized;
    return Promise.reject(error);
  });

  return instance;
}

const api = createApiClient(API_BASE_URL);
const authApi = createApiClient(IAM_URL);

export { api, authApi };
export default api;

export const iamTokenStore = {
  access: () => null,
  refresh: () => null,
  setTokens: () => {},
  setUser: (user) => {
    if (user) localStorage.setItem('iam_user', JSON.stringify(user));
    else localStorage.removeItem('iam_user');
  },
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem('iam_user'));
    } catch {
      return null;
    }
  },
  clear: () => {
    localStorage.removeItem('iam_user');
  },
};

export const erpRegistryService = {
  getAll: (config) => api.get('/erp-registry', config),
  getOne: (id) => api.get(`/erp-registry/${id}`),
  getByCode: (code) => api.get(`/erp-registry/code/${code}`),
  create: (data) => api.post('/erp-registry', data),
  update: (id, data) => api.put(`/erp-registry/${id}`, data),
  delete: (id) => api.delete(`/erp-registry/${id}`),
};

export const clientService = {
  getAll: (config) => api.get('/erp/clients', config),
  getOne: (id) => api.get(`/erp/clients/${id}`),
  create: (data) => api.post('/erp/clients', data),
  update: (id, data) => api.put(`/erp/clients/${id}`, data),
  delete: (id) => api.delete(`/erp/clients/${id}`),
};

export const productService = {
  getAll: (config) => api.get('/erp/products', config),
  getOne: (id) => api.get(`/erp/products/${id}`),
  create: (data) => api.post('/erp/products', data),
  update: (id, data) => api.put(`/erp/products/${id}`, data),
  delete: (id) => api.delete(`/erp/products/${id}`),
};

export const orderService = {
  getAll: (config) => api.get('/erp/orders', config),
  getOne: (id) => api.get(`/erp/orders/${id}`),
  create: (data) => api.post('/erp/orders', data),
  update: (id, data) => api.put(`/erp/orders/${id}`, data),
  delete: (id) => api.delete(`/erp/orders/${id}`),
};

export const supplierService = {
  getAll: (config) => api.get('/erp/suppliers', config),
  getOne: (id) => api.get(`/erp/suppliers/${id}`),
  create: (data) => api.post('/erp/suppliers', data),
  update: (id, data) => api.put(`/erp/suppliers/${id}`, data),
  delete: (id) => api.delete(`/erp/suppliers/${id}`),
};

export const quoteService = {
  getAll: (config) => api.get('/erp/quotes', config),
  getOne: (id) => api.get(`/erp/quotes/${id}`),
  create: (data) => api.post('/erp/quotes', data),
  update: (id, data) => api.put(`/erp/quotes/${id}`, data),
  delete: (id) => api.delete(`/erp/quotes/${id}`),
};

export const invoiceService = {
  getAll: (config) => api.get('/erp/invoices', config),
  getOne: (id) => api.get(`/erp/invoices/${id}`),
  create: (data) => api.post('/erp/invoices', data),
  update: (id, data) => api.put(`/erp/invoices/${id}`, data),
  delete: (id) => api.delete(`/erp/invoices/${id}`),
};

export const paymentService = {
  getAll: (config) => api.get('/erp/payments', config),
  getOne: (id) => api.get(`/erp/payments/${id}`),
  create: (data) => api.post('/erp/payments', data),
};

export const warehouseService = {
  getAll: (config) => api.get('/erp/warehouses', config),
  getOne: (id) => api.get(`/erp/warehouses/${id}`),
  create: (data) => api.post('/erp/warehouses', data),
  update: (id, data) => api.put(`/erp/warehouses/${id}`, data),
  delete: (id) => api.delete(`/erp/warehouses/${id}`),
};

export const shipmentService = {
  getAll: (config) => api.get('/erp/shipments', config),
  getOne: (id) => api.get(`/erp/shipments/${id}`),
  create: (data) => api.post('/erp/shipments', data),
  update: (id, data) => api.put(`/erp/shipments/${id}`, data),
};

export const documentService = {
  getAll: (config) => api.get('/erp/documents', config),
  getOne: (id) => api.get(`/erp/documents/${id}`),
  create: (data) => api.post('/erp/documents', data),
  delete: (id) => api.delete(`/erp/documents/${id}`),
};

export const stockMovementService = {
  getAll: (config) => api.get('/erp/stock-movements', config),
  create: (data) => api.post('/erp/stock-movements', data),
};

export const purchaseService = {
  getAll: (config) => api.get('/erp/purchases', config),
  getOne: (id) => api.get(`/erp/purchases/${id}`),
  create: (data) => api.post('/erp/purchases', data),
  update: (id, data) => api.put(`/erp/purchases/${id}`, data),
};

export const productVariantService = {
  getAll: (productId) => api.get('/erp/product-variants', { params: { productId: productId ?? undefined } }),
  create: (data) => api.post('/erp/product-variants', data),
  update: (id, data) => api.put(`/erp/product-variants/${id}`, data),
  delete: (id) => api.delete(`/erp/product-variants/${id}`),
};

export const serviceService = {
  getAll: (config) => api.get('/erp/services', config),
  getOne: (id) => api.get(`/erp/services/${id}`),
  create: (data) => api.post('/erp/services', data),
  update: (id, data) => api.put(`/erp/services/${id}`, data),
  delete: (id) => api.delete(`/erp/services/${id}`),
};

export const stockTransferService = {
  getAll: (config) => api.get('/erp/stock-transfers', config),
  create: (data) => api.post('/erp/stock-transfers', data),
  update: (id, data) => api.put(`/erp/stock-transfers/${id}`, data),
};

export const inventoryService = {
  getAll: (config) => api.get('/erp/inventories', config),
  getOne: (id) => api.get(`/erp/inventories/${id}`),
  create: (data) => api.post('/erp/inventories', data),
  update: (id, data) => api.put(`/erp/inventories/${id}`, data),
};

export const stockAlertService = {
  getAll: (config) => api.get('/erp/stock-alerts', config),
  create: (data) => api.post('/erp/stock-alerts', data),
};

export const returnService = {
  getAll: (config) => api.get('/erp/returns', config),
  getOne: (id) => api.get(`/erp/returns/${id}`),
  create: (data) => api.post('/erp/returns', data),
  update: (id, data) => api.put(`/erp/returns/${id}`, data),
};

export const promotionService = {
  getAll: (config) => api.get('/erp/promotions', config),
  getOne: (id) => api.get(`/erp/promotions/${id}`),
  create: (data) => api.post('/erp/promotions', data),
  update: (id, data) => api.put(`/erp/promotions/${id}`, data),
  delete: (id) => api.delete(`/erp/promotions/${id}`),
};

export const cashRegisterService = {
  getAll: (config) => api.get('/erp/cash-registers', config),
  getOne: (id) => api.get(`/erp/cash-registers/${id}`),
  create: (data) => api.post('/erp/cash-registers', data),
  update: (id, data) => api.put(`/erp/cash-registers/${id}`, data),
};

export const expenseService = {
  getAll: (config) => api.get('/erp/expenses', config),
  getOne: (id) => api.get(`/erp/expenses/${id}`),
  create: (data) => api.post('/erp/expenses', data),
  delete: (id) => api.delete(`/erp/expenses/${id}`),
};

export const reservationService = {
  getAll: (config) => api.get('/erp/reservations', config),
  getOne: (id) => api.get(`/erp/reservations/${id}`),
  create: (data) => api.post('/erp/reservations', data),
  update: (id, data) => api.put(`/erp/reservations/${id}`, data),
};

export const projectService = {
  getAll: (config) => api.get('/erp/projects', config),
  getOne: (id) => api.get(`/erp/projects/${id}`),
  create: (data) => api.post('/erp/projects', data),
  update: (id, data) => api.put(`/erp/projects/${id}`, data),
};

export const agendaService = {
  getAll: (config) => api.get('/erp/agenda', config),
  create: (data) => api.post('/erp/agenda', data),
  update: (id, data) => api.put(`/erp/agenda/${id}`, data),
  delete: (id) => api.delete(`/erp/agenda/${id}`),
};

export const statsService = {
  get: () => api.get('/erp/stats'),
};

export const erpHealthService = {
  check: () => api.get('/erp/health'),
};

export const dataRuntimeService = {
  contract: () => api.get('/data-runtime/contract'),
  resources: () => api.get('/data-runtime/resources'),
  listResource: (resource) => api.get(`/data-runtime/resources/${resource}`),
  getResource: (resource, id) => api.get(`/data-runtime/resources/${resource}/${id}`),
  query: (body) => api.post('/data-runtime/query', body),
  execute: (body) => api.post('/data-runtime/execute', body),
  validate: (resource, data) => api.post('/data-runtime/validate', { resource, data }),
  history: () => api.get('/data-runtime/history'),
  historyByTrace: (traceId) => api.get(`/data-runtime/history/${traceId}`),
  metrics: () => api.get('/data-runtime/metrics'),
  resolveBinding: (bindingId, ctx) => api.post(`/data-runtime/bindings/${bindingId}/resolve`, { ctx }),
  bindingState: (bindingId) => api.get(`/data-runtime/bindings/${bindingId}/state`),
};

export const automationService = {
  cockpit: () => api.get('/automation/cockpit'),
  contract: () => api.get('/automation/contract'),
  rules: () => api.get('/automation/rules'),
  activeRules: () => api.get('/automation/rules/active'),
  rule: (code) => api.get(`/automation/rules/${code}`),
  evaluateRules: (context) => api.post('/automation/rules/evaluate', { context }),
  simulateRule: (ruleCode, context) => api.post(`/automation/rules/simulate`, { ruleCode, context }),
  workflows: () => api.get('/automation/workflows'),
  startWorkflow: (workflowCode, variables) => api.post('/automation/workflows/start', { workflowCode, variables }),
  executions: () => api.get('/automation/workflows/executions'),
  triggers: () => api.get('/automation/triggers'),
  processEvent: (payload) => api.post('/automation/triggers/event', payload),
  fireTrigger: (triggerCode, variables) => api.post('/automation/triggers/fire', { triggerCode, variables }),
  evaluateCondition: (condition, context) => api.post('/automation/conditions/evaluate', { condition, context }),
  simulateCondition: (condition, context) => api.post('/automation/conditions/simulate', { condition, context }),
  history: () => api.get('/automation/history'),
  metrics: () => api.get('/automation/history/metrics'),
};

export const iamAdminService = {
  users: (params) => authApi.get('/users', { params }),
  user: (id) => authApi.get(`/users/${id}`),
  createUser: (body) => authApi.post('/users', body),
  updateUserStatus: (id, body) => authApi.post(`/admin/users/${id}/status`, { ...body, reason: body.reason || 'Modifié par un administrateur' }),
  deleteUser: (id) => authApi.delete(`/users/${id}`),
  sessions: (params) => authApi.get('/sessions', { params }),
  revokeSession: (id, body = {}) => authApi.post(`/sessions/${id}/revoke`, body),
  identities: (params) => authApi.get('/identities', { params }),
  identity: (id) => authApi.get(`/identities/${id}`),
  createIdentity: (body) => authApi.post('/identities', body),
  updateIdentity: (id, body) => authApi.patch(`/identities/${id}`, body),
  deleteIdentity: (id) => authApi.delete(`/identities/${id}`),
  roles: (params) => authApi.get('/admin/governance/roles', { params }),
  role: (id) => authApi.get(`/admin/governance/roles/${id}`),
  createRole: (body) => authApi.post('/admin/governance/roles', body),
  updateRole: (id, body) => authApi.patch(`/admin/governance/roles/${id}`, body),
  deleteRole: (id) => authApi.delete(`/admin/governance/roles/${id}`),
  policies: (params) => authApi.get('/policies', { params }),
  policy: (id) => authApi.get(`/policies/${id}`),
  createPolicy: (body) => authApi.post('/policies', body),
  updatePolicy: (id, body) => authApi.patch(`/policies/${id}`, body),
  deletePolicy: (id) => authApi.delete(`/policies/${id}`),
  tenants: (params) => authApi.get('/admin/tenants', { params }),
  tenant: (id) => authApi.get(`/admin/tenants/${id}`),
  createTenant: (body) => authApi.post('/admin/tenants', body),
  updateTenant: (id, body) => authApi.post(`/admin/tenants/${id}/status`, { ...body, reason: body.reason || 'Modifié par un administrateur' }),
  deleteTenant: (id) => authApi.delete(`/admin/tenants/${id}`),
};

export const iamObservabilityService = {
  securityEvents: (params) => authApi.get('/security/events', { params }),
  updateSecurityEvent: (id, body) => authApi.patch(`/security/events/${id}`, body),
  monitoring: () => authApi.get('/observability/dashboard'),
  logs: (params) => authApi.get('/logs/search', { params }),
  auditLogs: (params) => authApi.get('/audit/search', { params }),
  alertRules: (params) => authApi.get('/alerts/rules', { params }),
  alertInstances: (params) => authApi.get('/alerts', { params }),
  toggleAlertRule: (id, body) => authApi.patch(`/alerts/rules/${id}`, body),
  updateAlertInstance: (id, body) => {
    const action = { ACKNOWLEDGED: 'acknowledge', RESOLVED: 'resolve' }[body.status];
    if (!action) return Promise.reject(new Error('Action non disponible dans le contrat Alert Manager.'));
    return authApi.post(`/alerts/${id}/${action}`, body);
  },
};

/**
 * Billing CDC 15 V2 — moteur `/api/billing/*`.
 *
 * L'ancien `iamBillingService` (/api/iam/billing) est retire : il exposait un
 * contrat IAM pour une logique metier Billing, ne commencait aucun tenant et
 * calculait en flottant. Deux surfaces distinctes :
 *  - `billingService`      : tenant courant (lecture + ecriture strictement scopee) ;
 *  - `billingAdminService` : administration plateforme cross-tenant.
 */
export const billingService = {
  context: () => api.get('/billing/context'),
  health: () => api.get('/billing/health'),

  plans: (params) => api.get('/billing/catalog/plans', { params }),
  plan: (id) => api.get(`/billing/catalog/plans/${id}`),
  prices: (params) => api.get('/billing/catalog/prices', { params }),
  intervals: () => api.get('/billing/catalog/intervals'),
  providers: () => api.get('/billing/providers'),

  entitlements: (params) => api.get('/billing/entitlements', { params }),
  entitlement: (key) => api.get(`/billing/entitlements/${key}`),
  entitlementLimit: (key) => api.get(`/billing/entitlements/limits/${key}`),

  subscription: () => api.get('/billing/subscription'),
  subscribe: (body) => api.post('/billing/subscription', body),
  activateSubscription: (body) => api.post('/billing/subscription/activate', body),
  changePlan: (body) => api.post('/billing/subscription/change-plan', body),
  cancelSubscription: (body) => api.post('/billing/subscription/cancel', body),
  reactivateSubscription: (body) => api.post('/billing/subscription/reactivate', body),
  upsertOverride: (body) => api.post('/billing/subscription/overrides', body),

  billingAccount: () => api.get('/billing/billing-account'),
  saveBillingAccount: (body) => api.post('/billing/billing-account', body),

  invoices: (params) => api.get('/billing/invoices', { params }),
  invoice: (id) => api.get(`/billing/invoices/${id}`),

  payments: () => api.get('/billing/payments'),
  recordManualPayment: (body) => api.post('/billing/payments/manual', body),
  validatePayment: (id, body) => api.post(`/billing/payments/${id}/validate`, body),
  refundPayment: (id, body) => api.post(`/billing/payments/${id}/refund`, body),

  usage: () => api.get('/billing/usage'),
  usageEvents: (params) => api.get('/billing/usage/events', { params }),
};

export const billingAdminService = {
  products: (params) => api.get('/billing/catalog/products', { params }),
  createProduct: (body) => api.post('/billing/catalog/products', body),
  features: (params) => api.get('/billing/catalog/features', { params }),
  createFeature: (body) => api.post('/billing/catalog/features', body),
  createPlan: (body) => api.post('/billing/catalog/plans', body),
  setPlanStatus: (id, body) => api.post(`/billing/catalog/plans/${id}/status`, body),
  setPlanEntitlement: (id, body) => api.post(`/billing/catalog/plans/${id}/entitlements`, body),
  createPrice: (body) => api.post('/billing/catalog/prices', body),
  deactivatePrice: (id) => api.post(`/billing/catalog/prices/${id}/deactivate`),

  subscriptions: (params) => api.get('/billing/admin/subscriptions', { params }),
  invoices: (params) => api.get('/billing/admin/invoices', { params }),
  invoice: (id) => api.get(`/billing/admin/invoices/${id}`),
  generateInvoice: (body) => api.post('/billing/admin/invoices/generate', body),
  issueInvoice: (id, body) => api.post(`/billing/admin/invoices/${id}/issue`, body),
  markInvoiceOverdue: (id) => api.post(`/billing/admin/invoices/${id}/overdue`),
  voidInvoice: (id, body) => api.post(`/billing/admin/invoices/${id}/void`, body),
  adjustInvoice: (id, body) => api.post(`/billing/admin/invoices/${id}/adjustments`, body),

  payments: (params) => api.get('/billing/admin/payments', { params }),
  recordPayment: (body) => api.post('/billing/admin/payments/manual', body),
  failPayment: (id, body) => api.post(`/billing/admin/payments/${id}/fail`, body),
  refundPayment: (id, body) => api.post(`/billing/admin/payments/${id}/refund`, body),

  usageEvents: (params) => api.get('/billing/admin/usage/events', { params }),
  diagnostics: (params) => api.get('/billing/admin/diagnostics', { params }),
  webhooks: (params) => api.get('/billing/admin/webhooks', { params }),
  health: () => api.get('/billing/admin/health'),
  runSweeps: () => api.post('/billing/admin/sweeps'),
};

export const erpUserService = { getAll: (config) => api.get('/erp/users', config) };

export const syncService = {
  list: (params) => api.get('/integrations/synchronizations', { params }),
  getOne: (id) => api.get(`/integrations/synchronizations/${id}`),
  create: (data) => api.post('/integrations/synchronizations', data),
  update: (id, data) => api.patch(`/integrations/synchronizations/${id}`, data),
  remove: (id) => api.delete(`/integrations/synchronizations/${id}`),
  run: (id) => api.post(`/integrations/synchronizations/${id}/run`),
  resume: (id) => api.post(`/integrations/synchronizations/${id}/resume`),
  pause: (id) => api.post(`/integrations/synchronizations/${id}/pause`),
  cancel: (id) => api.post(`/integrations/synchronizations/${id}/cancel`),
  checkpoint: (id) => api.get(`/integrations/synchronizations/${id}/checkpoint`),
};

export const connectorService = {
  list: (params) => api.get('/integrations/connectors', { params }),
  getOne: (id) => api.get(`/integrations/connectors/${id}`),
  create: (data) => api.post('/integrations/connectors', data),
  update: (id, data) => api.patch(`/integrations/connectors/${id}`, data),
  validate: (id, data) => api.post(`/integrations/connectors/${id}/validate`, data),
  health: (id) => api.post(`/integrations/connectors/${id}/health`),
  activate: (id) => api.post(`/integrations/connectors/${id}/activate`),
  disable: (id) => api.post(`/integrations/connectors/${id}/disable`),
  archive: (id) => api.post(`/integrations/connectors/${id}/archive`),
};
