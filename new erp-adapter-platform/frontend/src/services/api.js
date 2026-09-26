import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';
const AUTH_AIM_URL = process.env.REACT_APP_AUTH_AIM_URL || 'http://localhost:5001/api';

const authAimApi = axios.create({
  baseURL: AUTH_AIM_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});


function normalizeError(error) {
  const { response = {}, config = {} } = error;
  const status = response.status;
  const data = response.data || {};
  const traceId = response.headers?.['x-trace-id'] || (config.headers?.['X-Trace-Id'] || null);
  const message = data?.message || error.message || 'Erreur reseau';
  const code = data?.code || undefined;

  if (status === 401) {
    return { type: 'UNAUTHORIZED', status: 401, message, code, traceId };
  }
  if (status === 403) {
    return { type: 'FORBIDDEN', status: 403, message, code, traceId };
  }
  if (code === 'ERP_INSTANCE_NOT_CONFIGURED') {
    return { type: 'ERP_NOT_CONFIGURED', status, message, code, traceId };
  }
  if (code === 'ERP_UNAVAILABLE') {
    return { type: 'ERP_UNAVAILABLE', status, message, code, traceId };
  }
  if (code === 'ERP_PROVIDER_REQUIRED') {
    return { type: 'ERP_PROVIDER_REQUIRED', status, message, code, traceId };
  }
  if (code === 'ERP_PROVIDER_UNSUPPORTED') {
    return { type: 'ERP_PROVIDER_UNSUPPORTED', status, message, code, traceId };
  }
  return { type: 'ERROR', status: status || 500, message, code, traceId };
}

export { normalizeError };

export const iamTokenStore = {
  access: () => null,
  refresh: () => null,
  setTokens: () => {},
  setUser: (user) => {
    if (user) localStorage.setItem('iam_user', JSON.stringify(user));
    else localStorage.removeItem('iam_user');
  },
  getUser: () => {
    try { return JSON.parse(localStorage.getItem('iam_user')); } catch { return null; }
  },
  clear: () => {
    localStorage.removeItem('iam_user');
  },
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response = {}, config = {} } = error;
    const url = config.url || '';

    if (response.status !== 401) {
      const message = response.data?.message || error.message || 'Erreur reseau';
      console.error(`[API Error] ${message}`);
      error.normalized = normalizeError(error);
      return Promise.reject(error);
    }

    const isAuthEndpoint = url.includes('/iam/auth/');
    if (isAuthEndpoint) {
      error.normalized = normalizeError(error);
      return Promise.reject(error);
    }

    window.dispatchEvent(new CustomEvent('iam:unauthorized'));
    error.normalized = normalizeError(error);
    return Promise.reject(error);
  },
);

export const iamAuthService = {
  login: (body) => authAimApi.post('/iam/auth/login', body),
  register: (body) => authAimApi.post('/iam/auth/register', body),
  refresh: () => authAimApi.post('/iam/auth/refresh'),
  logout: () => authAimApi.post('/iam/auth/logout'),
  logoutAll: (keepCurrentSession) => authAimApi.post('/iam/auth/logout-all', { keepCurrentSession }),
  changePassword: (body) => authAimApi.post('/iam/auth/change-password', body),
  forgotPassword: (body) => authAimApi.post('/iam/auth/forgot-password', body),
  resetPassword: (body) => authAimApi.post('/iam/auth/reset-password', body),
  me: () => authAimApi.get('/iam/auth/me'),
  updateProfile: (body) => authAimApi.patch('/iam/auth/profile', body),
  sessions: () => authAimApi.get('/iam/auth/sessions'),
  getPublicConfig: () => api.get('/config/public'),
};

export const iamAdminService = {
  users: (params) => authAimApi.get('/iam/users', { params }),
  user: (id) => authAimApi.get(`/iam/users/${id}`),
  createUser: (body) => authAimApi.post('/iam/users', body),
  updateUserStatus: (id, body) => authAimApi.patch(`/iam/users/${id}/status`, body),
  deleteUser: (id) => authAimApi.delete(`/iam/users/${id}`),
  stats: () => authAimApi.get('/iam/users/stats'),
  sessions: (params) => authAimApi.get('/iam/sessions', { params }),
  revokeSession: (id) => authAimApi.delete(`/iam/sessions/${id}`),
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

export const stockService = {
  get: (productId) => api.get(`/erp/stock/${productId}`),
  update: (productId, quantity) =>
    api.put(`/erp/stock/${productId}`, { quantity }),
  getAll: () => api.get('/erp/stocks'),
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

export const healthService = {
  check: () => api.get('/erp/health'),
};

export const userService = {
  getAll: () => api.get('/erp/users'),
  getOne: (id) => api.get(`/erp/users/${id}`),
  getMe: () => api.get('/erp/users/me'),
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
  simulateRule: (ruleCode, context) => api.post('/automation/rules/simulate', { ruleCode, context }),
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

export default api;
