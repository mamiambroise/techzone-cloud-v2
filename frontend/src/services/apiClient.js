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
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
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

  window.dispatchEvent(new CustomEvent('api:error', { detail: normalized }));
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
        window.dispatchEvent(new CustomEvent('api:error', { detail: normalized }));
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
  getAll: () => api.get('/erp-registry'),
  getOne: (id) => api.get(`/erp-registry/${id}`),
  getByCode: (code) => api.get(`/erp-registry/code/${code}`),
  create: (data) => api.post('/erp-registry', data),
  update: (id, data) => api.put(`/erp-registry/${id}`, data),
  delete: (id) => api.delete(`/erp-registry/${id}`),
};

export const clientService = {
  getAll: () => api.get('/erp/clients'),
  getOne: (id) => api.get(`/erp/clients/${id}`),
  create: (data) => api.post('/erp/clients', data),
  update: (id, data) => api.put(`/erp/clients/${id}`, data),
  delete: (id) => api.delete(`/erp/clients/${id}`),
};

export const productService = {
  getAll: () => api.get('/erp/products'),
  getOne: (id) => api.get(`/erp/products/${id}`),
  create: (data) => api.post('/erp/products', data),
  update: (id, data) => api.put(`/erp/products/${id}`, data),
  delete: (id) => api.delete(`/erp/products/${id}`),
};

export const orderService = {
  getAll: () => api.get('/erp/orders'),
  getOne: (id) => api.get(`/erp/orders/${id}`),
  create: (data) => api.post('/erp/orders', data),
  update: (id, data) => api.put(`/erp/orders/${id}`, data),
  delete: (id) => api.delete(`/erp/orders/${id}`),
};

export const supplierService = {
  getAll: () => api.get('/erp/suppliers'),
  getOne: (id) => api.get(`/erp/suppliers/${id}`),
  create: (data) => api.post('/erp/suppliers', data),
  update: (id, data) => api.put(`/erp/suppliers/${id}`, data),
  delete: (id) => api.delete(`/erp/suppliers/${id}`),
};

export const quoteService = {
  getAll: () => api.get('/erp/quotes'),
  getOne: (id) => api.get(`/erp/quotes/${id}`),
  create: (data) => api.post('/erp/quotes', data),
  update: (id, data) => api.put(`/erp/quotes/${id}`, data),
  delete: (id) => api.delete(`/erp/quotes/${id}`),
};

export const invoiceService = {
  getAll: () => api.get('/erp/invoices'),
  getOne: (id) => api.get(`/erp/invoices/${id}`),
  create: (data) => api.post('/erp/invoices', data),
  update: (id, data) => api.put(`/erp/invoices/${id}`, data),
  delete: (id) => api.delete(`/erp/invoices/${id}`),
};

export const paymentService = {
  getAll: () => api.get('/erp/payments'),
  getOne: (id) => api.get(`/erp/payments/${id}`),
  create: (data) => api.post('/erp/payments', data),
};

export const warehouseService = {
  getAll: () => api.get('/erp/warehouses'),
  getOne: (id) => api.get(`/erp/warehouses/${id}`),
  create: (data) => api.post('/erp/warehouses', data),
  update: (id, data) => api.put(`/erp/warehouses/${id}`, data),
  delete: (id) => api.delete(`/erp/warehouses/${id}`),
};

export const shipmentService = {
  getAll: () => api.get('/erp/shipments'),
  getOne: (id) => api.get(`/erp/shipments/${id}`),
  create: (data) => api.post('/erp/shipments', data),
  update: (id, data) => api.put(`/erp/shipments/${id}`, data),
};

export const documentService = {
  getAll: () => api.get('/erp/documents'),
  getOne: (id) => api.get(`/erp/documents/${id}`),
  create: (data) => api.post('/erp/documents', data),
  delete: (id) => api.delete(`/erp/documents/${id}`),
};

export const stockMovementService = {
  getAll: () => api.get('/erp/stock-movements'),
  create: (data) => api.post('/erp/stock-movements', data),
};

export const purchaseService = {
  getAll: () => api.get('/erp/purchases'),
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
  getAll: () => api.get('/erp/services'),
  getOne: (id) => api.get(`/erp/services/${id}`),
  create: (data) => api.post('/erp/services', data),
  update: (id, data) => api.put(`/erp/services/${id}`, data),
  delete: (id) => api.delete(`/erp/services/${id}`),
};

export const stockTransferService = {
  getAll: () => api.get('/erp/stock-transfers'),
  create: (data) => api.post('/erp/stock-transfers', data),
  update: (id, data) => api.put(`/erp/stock-transfers/${id}`, data),
};

export const inventoryService = {
  getAll: () => api.get('/erp/inventories'),
  getOne: (id) => api.get(`/erp/inventories/${id}`),
  create: (data) => api.post('/erp/inventories', data),
  update: (id, data) => api.put(`/erp/inventories/${id}`, data),
};

export const stockAlertService = {
  getAll: () => api.get('/erp/stock-alerts'),
  create: (data) => api.post('/erp/stock-alerts', data),
};

export const returnService = {
  getAll: () => api.get('/erp/returns'),
  getOne: (id) => api.get(`/erp/returns/${id}`),
  create: (data) => api.post('/erp/returns', data),
  update: (id, data) => api.put(`/erp/returns/${id}`, data),
};

export const promotionService = {
  getAll: () => api.get('/erp/promotions'),
  getOne: (id) => api.get(`/erp/promotions/${id}`),
  create: (data) => api.post('/erp/promotions', data),
  update: (id, data) => api.put(`/erp/promotions/${id}`, data),
  delete: (id) => api.delete(`/erp/promotions/${id}`),
};

export const cashRegisterService = {
  getAll: () => api.get('/erp/cash-registers'),
  getOne: (id) => api.get(`/erp/cash-registers/${id}`),
  create: (data) => api.post('/erp/cash-registers', data),
  update: (id, data) => api.put(`/erp/cash-registers/${id}`, data),
};

export const expenseService = {
  getAll: () => api.get('/erp/expenses'),
  getOne: (id) => api.get(`/erp/expenses/${id}`),
  create: (data) => api.post('/erp/expenses', data),
  delete: (id) => api.delete(`/erp/expenses/${id}`),
};

export const reservationService = {
  getAll: () => api.get('/erp/reservations'),
  getOne: (id) => api.get(`/erp/reservations/${id}`),
  create: (data) => api.post('/erp/reservations', data),
  update: (id, data) => api.put(`/erp/reservations/${id}`, data),
};

export const projectService = {
  getAll: () => api.get('/erp/projects'),
  getOne: (id) => api.get(`/erp/projects/${id}`),
  create: (data) => api.post('/erp/projects', data),
  update: (id, data) => api.put(`/erp/projects/${id}`, data),
};

export const agendaService = {
  getAll: () => api.get('/erp/agenda'),
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

export const iamBillingService = {
  plans: (params) => authApi.get('/billing/plans', { params }),
  plan: (id) => authApi.get(`/billing/plans/${id}`),
  createPlan: (body) => authApi.post('/billing/plans', body),
  updatePlan: (id, body) => authApi.patch(`/billing/plans/${id}`, body),
  activatePlan: (id) => authApi.post(`/billing/plans/${id}/activate`),
  deprecatePlan: (id) => authApi.post(`/billing/plans/${id}/deprecate`),
  archivePlan: (id) => authApi.post(`/billing/plans/${id}/archive`),
  newPlanVersion: (id, body) => authApi.post(`/billing/plans/${id}/new-version`, body),
  addPlanEntitlement: (id, body) => authApi.post(`/billing/plans/${id}/entitlements`, body),
  removePlanEntitlement: (planId, entitlementId) => authApi.delete(`/billing/plans/${planId}/entitlements/${entitlementId}`),

  subscriptions: (params) => authApi.get('/billing/subscriptions', { params }),
  subscription: (id) => authApi.get(`/billing/subscriptions/${id}`),
  createSubscription: (body) => authApi.post('/billing/subscriptions', body),
  activateSubscription: (id) => authApi.post(`/billing/subscriptions/${id}/activate`),
  changeSubscriptionPlan: (id, body) => authApi.post(`/billing/subscriptions/${id}/change-plan`, body),
  suspendSubscription: (id, body) => authApi.post(`/billing/subscriptions/${id}/suspend`, body),
  resumeSubscription: (id) => authApi.post(`/billing/subscriptions/${id}/resume`),
  cancelSubscription: (id, body) => authApi.post(`/billing/subscriptions/${id}/cancel`, body),
  renewSubscription: (id) => authApi.post(`/billing/subscriptions/${id}/renew`),

  invoices: (params) => authApi.get('/billing/invoices', { params }),
  invoice: (id) => authApi.get(`/billing/invoices/${id}`),
  generateInvoice: (body) => authApi.post('/billing/invoices', body),
  issueInvoice: (id) => authApi.post(`/billing/invoices/${id}/issue`),
  applyPaymentToInvoice: (id, body) => authApi.post(`/billing/invoices/${id}/payments`, body),
  markInvoiceOverdue: (id) => authApi.post(`/billing/invoices/${id}/mark-overdue`),
  voidInvoice: (id, body) => authApi.post(`/billing/invoices/${id}/void`, body),

  payments: (params) => authApi.get('/billing/payments', { params }),
  payment: (id) => authApi.get(`/billing/payments/${id}`),
  paymentsForInvoice: (invoiceId, params) => authApi.get(`/billing/payments/invoice/${invoiceId}`, { params }),
  initiatePayment: (body) => authApi.post('/billing/payments', body),
  markPaymentProcessing: (id) => authApi.post(`/billing/payments/${id}/processing`),
  markPaymentSucceeded: (id, body) => authApi.post(`/billing/payments/${id}/succeed`, body),
  markPaymentFailed: (id, body) => authApi.post(`/billing/payments/${id}/fail`, body),
  refundPayment: (id, body) => authApi.post(`/billing/payments/${id}/refund`, body),

  entitlements: (subscriptionId) => authApi.get(`/billing/entitlements/${subscriptionId}`),
  entitlement: (subscriptionId, featureCode) => authApi.get(`/billing/entitlements/${subscriptionId}/${featureCode}`),
  createEntitlementOverride: (subscriptionId, featureCode, body) => authApi.post(`/billing/entitlements/${subscriptionId}/${featureCode}/override`, body),
  removeEntitlementOverride: (subscriptionId, featureCode) => authApi.delete(`/billing/entitlements/${subscriptionId}/${featureCode}/override`),
  entitlementQuota: (subscriptionId, featureCode) => authApi.get(`/billing/entitlements/${subscriptionId}/${featureCode}/quota`),
  consumeEntitlementQuota: (subscriptionId, featureCode, body) => authApi.post(`/billing/entitlements/${subscriptionId}/${featureCode}/quota/consume`, body),

  features: (params) => authApi.get('/billing/features', { params }),
  feature: (code) => authApi.get(`/billing/features/${code}`),
  createFeature: (body) => authApi.post('/billing/features', body),
  updateFeature: (code, body) => authApi.patch(`/billing/features/${code}`, body),
  deprecateFeature: (code) => authApi.post(`/billing/features/${code}/deprecate`),
  checkAccess: (body) => authApi.post('/billing/access/decide', body),
};

export const erpUserService = { getAll: () => api.get('/erp/users') };
