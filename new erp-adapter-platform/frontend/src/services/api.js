import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

// Client axios avec configuration de base
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// === Gestion des tokens IAM ===
const STORAGE = { access: 'iam_access_token', refresh: 'iam_refresh_token', user: 'iam_user' };
const getAccessToken = () => localStorage.getItem(STORAGE.access);
const getRefreshToken = () => localStorage.getItem(STORAGE.refresh);

export const iamTokenStore = {
  access: getAccessToken,
  refresh: getRefreshToken,
  setTokens: (access, refresh) => {
    if (access) localStorage.setItem(STORAGE.access, access);
    if (refresh) localStorage.setItem(STORAGE.refresh, refresh);
  },
  setUser: (user) => {
    if (user) localStorage.setItem(STORAGE.user, JSON.stringify(user));
    else localStorage.removeItem(STORAGE.user);
  },
  getUser: () => {
    try { return JSON.parse(localStorage.getItem(STORAGE.user)); } catch { return null; }
  },
  clear: () => {
    localStorage.removeItem(STORAGE.access);
    localStorage.removeItem(STORAGE.refresh);
    localStorage.removeItem(STORAGE.user);
  },
};

// Attache automatiquement le token d'acces
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Rafraichit le token d'acces via le refresh token si 401
let isRefreshing = false;
let waiters = [];
const onRefreshed = (token) => waiters.forEach((cb) => cb(token));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response = {}, config = {} } = error;
    const url = config.url || '';

    if (response.status !== 401) {
      const message = response.data?.message || error.message || 'Erreur reseau';
      console.error(`[API Error] ${message}`);
      return Promise.reject(error);
    }

    const isAuthEndpoint = url.includes('/iam/auth/');
    if (isAuthEndpoint || !getRefreshToken()) {
      if (!isAuthEndpoint) window.dispatchEvent(new CustomEvent('iam:unauthorized'));
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        waiters.push((token) => {
          if (!token) return reject(error);
          config.headers.Authorization = `Bearer ${token}`;
          resolve(api(config));
        });
      });
    }

    isRefreshing = true;
    try {
      const { data } = await api.post('/iam/auth/refresh', { refreshToken: getRefreshToken() });
      const { accessToken, refreshToken } = data?.data || {};
      if (accessToken) {
        iamTokenStore.setTokens(accessToken, refreshToken);
        onRefreshed(accessToken);
        config.headers.Authorization = `Bearer ${accessToken}`;
        return api(config);
      }
    } catch (e) {
      window.dispatchEvent(new CustomEvent('iam:unauthorized'));
    } finally {
      isRefreshing = false;
      waiters = [];
    }
    return Promise.reject(error);
  }
);

// === IAM Auth ===

export const iamAuthService = {
  login: (body) => api.post('/iam/auth/login', body),
  register: (body) => api.post('/iam/auth/register', body),
  refresh: (refreshToken) => api.post('/iam/auth/refresh', { refreshToken }),
  logout: () => api.post('/iam/auth/logout'),
  logoutAll: (keepCurrentSession) => api.post('/iam/auth/logout-all', { keepCurrentSession }),
  changePassword: (body) => api.post('/iam/auth/change-password', body),
  me: () => api.get('/iam/auth/me'),
  sessions: () => api.get('/iam/auth/sessions'),
};

// === IAM Admin (utilisateurs + sessions) ===

export const iamAdminService = {
  users: (params) => api.get('/iam/users', { params }),
  user: (id) => api.get(`/iam/users/${id}`),
  createUser: (body) => api.post('/iam/users', body),
  updateUserStatus: (id, body) => api.patch(`/iam/users/${id}/status`, body),
  deleteUser: (id) => api.delete(`/iam/users/${id}`),
  stats: () => api.get('/iam/users/stats'),
  sessions: (params) => api.get('/iam/sessions', { params }),
  revokeSession: (id) => api.delete(`/iam/sessions/${id}`),
};

// === ERP Registry (PostgreSQL) ===

export const erpRegistryService = {
  getAll: () => api.get('/erp-registry'),
  getOne: (id) => api.get(`/erp-registry/${id}`),
  getByCode: (code) => api.get(`/erp-registry/code/${code}`),
  create: (data) => api.post('/erp-registry', data),
  update: (id, data) => api.put(`/erp-registry/${id}`, data),
  delete: (id) => api.delete(`/erp-registry/${id}`),
};

// === ERP Adapter - Clients ===

export const clientService = {
  getAll: (erp = 'DOLIBARR') => api.get('/erp/clients', { params: { erp } }),
  getOne: (id, erp = 'DOLIBARR') => api.get(`/erp/clients/${id}`, { params: { erp } }),
  create: (data, erp = 'DOLIBARR') => api.post('/erp/clients', data, { params: { erp } }),
  update: (id, data, erp = 'DOLIBARR') => api.put(`/erp/clients/${id}`, data, { params: { erp } }),
  delete: (id, erp = 'DOLIBARR') => api.delete(`/erp/clients/${id}`, { params: { erp } }),
};

// === ERP Adapter - Produits ===

export const productService = {
  getAll: (erp = 'DOLIBARR') => api.get('/erp/products', { params: { erp } }),
  getOne: (id, erp = 'DOLIBARR') => api.get(`/erp/products/${id}`, { params: { erp } }),
  create: (data, erp = 'DOLIBARR') => api.post('/erp/products', data, { params: { erp } }),
  update: (id, data, erp = 'DOLIBARR') => api.put(`/erp/products/${id}`, data, { params: { erp } }),
  delete: (id, erp = 'DOLIBARR') => api.delete(`/erp/products/${id}`, { params: { erp } }),
};

// === ERP Adapter - Commandes ===

export const orderService = {
  getAll: (erp = 'DOLIBARR') => api.get('/erp/orders', { params: { erp } }),
  getOne: (id, erp = 'DOLIBARR') => api.get(`/erp/orders/${id}`, { params: { erp } }),
  create: (data, erp = 'DOLIBARR') => api.post('/erp/orders', data, { params: { erp } }),
  update: (id, data, erp = 'DOLIBARR') => api.put(`/erp/orders/${id}`, data, { params: { erp } }),
  delete: (id, erp = 'DOLIBARR') => api.delete(`/erp/orders/${id}`, { params: { erp } }),
};

// === ERP Adapter - Stock ===

export const stockService = {
  get: (productId, erp = 'DOLIBARR') => api.get(`/erp/stock/${productId}`, { params: { erp } }),
  update: (productId, quantity, erp = 'DOLIBARR') =>
    api.put(`/erp/stock/${productId}`, { quantity }, { params: { erp } }),
  getAll: (erp = 'DOLIBARR') => api.get('/erp/stocks', { params: { erp } }),
};

// === ERP Adapter - Fournisseurs ===

export const supplierService = {
  getAll: (erp = 'DOLIBARR') => api.get('/erp/suppliers', { params: { erp } }),
  getOne: (id, erp = 'DOLIBARR') => api.get(`/erp/suppliers/${id}`, { params: { erp } }),
  create: (data, erp = 'DOLIBARR') => api.post('/erp/suppliers', data, { params: { erp } }),
  update: (id, data, erp = 'DOLIBARR') => api.put(`/erp/suppliers/${id}`, data, { params: { erp } }),
  delete: (id, erp = 'DOLIBARR') => api.delete(`/erp/suppliers/${id}`, { params: { erp } }),
};

// === ERP Adapter - Devis ===

export const quoteService = {
  getAll: (erp = 'DOLIBARR') => api.get('/erp/quotes', { params: { erp } }),
  getOne: (id, erp = 'DOLIBARR') => api.get(`/erp/quotes/${id}`, { params: { erp } }),
  create: (data, erp = 'DOLIBARR') => api.post('/erp/quotes', data, { params: { erp } }),
  update: (id, data, erp = 'DOLIBARR') => api.put(`/erp/quotes/${id}`, data, { params: { erp } }),
  delete: (id, erp = 'DOLIBARR') => api.delete(`/erp/quotes/${id}`, { params: { erp } }),
};

// === ERP Adapter - Factures ===

export const invoiceService = {
  getAll: (erp = 'DOLIBARR') => api.get('/erp/invoices', { params: { erp } }),
  getOne: (id, erp = 'DOLIBARR') => api.get(`/erp/invoices/${id}`, { params: { erp } }),
  create: (data, erp = 'DOLIBARR') => api.post('/erp/invoices', data, { params: { erp } }),
  update: (id, data, erp = 'DOLIBARR') => api.put(`/erp/invoices/${id}`, data, { params: { erp } }),
  delete: (id, erp = 'DOLIBARR') => api.delete(`/erp/invoices/${id}`, { params: { erp } }),
};

// === ERP Adapter - Paiements ===

export const paymentService = {
  getAll: (erp = 'DOLIBARR') => api.get('/erp/payments', { params: { erp } }),
  getOne: (id, erp = 'DOLIBARR') => api.get(`/erp/payments/${id}`, { params: { erp } }),
  create: (data, erp = 'DOLIBARR') => api.post('/erp/payments', data, { params: { erp } }),
};

// === ERP Adapter - Entrepots ===

export const warehouseService = {
  getAll: (erp = 'DOLIBARR') => api.get('/erp/warehouses', { params: { erp } }),
  getOne: (id, erp = 'DOLIBARR') => api.get(`/erp/warehouses/${id}`, { params: { erp } }),
  create: (data, erp = 'DOLIBARR') => api.post('/erp/warehouses', data, { params: { erp } }),
  update: (id, data, erp = 'DOLIBARR') => api.put(`/erp/warehouses/${id}`, data, { params: { erp } }),
  delete: (id, erp = 'DOLIBARR') => api.delete(`/erp/warehouses/${id}`, { params: { erp } }),
};

// === ERP Adapter - Expeditions ===

export const shipmentService = {
  getAll: (erp = 'DOLIBARR') => api.get('/erp/shipments', { params: { erp } }),
  getOne: (id, erp = 'DOLIBARR') => api.get(`/erp/shipments/${id}`, { params: { erp } }),
  create: (data, erp = 'DOLIBARR') => api.post('/erp/shipments', data, { params: { erp } }),
  update: (id, data, erp = 'DOLIBARR') => api.put(`/erp/shipments/${id}`, data, { params: { erp } }),
};

// === ERP Adapter - Documents ===

export const documentService = {
  getAll: (erp = 'DOLIBARR') => api.get('/erp/documents', { params: { erp } }),
  getOne: (id, erp = 'DOLIBARR') => api.get(`/erp/documents/${id}`, { params: { erp } }),
  create: (data, erp = 'DOLIBARR') => api.post('/erp/documents', data, { params: { erp } }),
  delete: (id, erp = 'DOLIBARR') => api.delete(`/erp/documents/${id}`, { params: { erp } }),
};

// === ERP Adapter - Mouvements de stock ===

export const stockMovementService = {
  getAll: (erp = 'DOLIBARR') => api.get('/erp/stock-movements', { params: { erp } }),
  create: (data, erp = 'DOLIBARR') => api.post('/erp/stock-movements', data, { params: { erp } }),
};

// === ERP Adapter - Achats (bons de commande fournisseurs) ===

export const purchaseService = {
  getAll: (erp = 'DOLIBARR') => api.get('/erp/purchases', { params: { erp } }),
  getOne: (id, erp = 'DOLIBARR') => api.get(`/erp/purchases/${id}`, { params: { erp } }),
  create: (data, erp = 'DOLIBARR') => api.post('/erp/purchases', data, { params: { erp } }),
  update: (id, data, erp = 'DOLIBARR') => api.put(`/erp/purchases/${id}`, data, { params: { erp } }),
};

// === ERP Adapter - Variantes de produits ===

export const productVariantService = {
  getAll: (erp = 'DOLIBARR', productId) => api.get('/erp/product-variants', { params: { erp, productId } }),
  create: (data, erp = 'DOLIBARR') => api.post('/erp/product-variants', data, { params: { erp } }),
  update: (id, data, erp = 'DOLIBARR') => api.put(`/erp/product-variants/${id}`, data, { params: { erp } }),
  delete: (id, erp = 'DOLIBARR') => api.delete(`/erp/product-variants/${id}`, { params: { erp } }),
};

// === ERP Adapter - Services ===

export const serviceService = {
  getAll: (erp = 'DOLIBARR') => api.get('/erp/services', { params: { erp } }),
  getOne: (id, erp = 'DOLIBARR') => api.get(`/erp/services/${id}`, { params: { erp } }),
  create: (data, erp = 'DOLIBARR') => api.post('/erp/services', data, { params: { erp } }),
  update: (id, data, erp = 'DOLIBARR') => api.put(`/erp/services/${id}`, data, { params: { erp } }),
  delete: (id, erp = 'DOLIBARR') => api.delete(`/erp/services/${id}`, { params: { erp } }),
};

// === ERP Adapter - Transferts de stock ===

export const stockTransferService = {
  getAll: (erp = 'DOLIBARR') => api.get('/erp/stock-transfers', { params: { erp } }),
  create: (data, erp = 'DOLIBARR') => api.post('/erp/stock-transfers', data, { params: { erp } }),
  update: (id, data, erp = 'DOLIBARR') => api.put(`/erp/stock-transfers/${id}`, data, { params: { erp } }),
};

// === ERP Adapter - Inventaires ===

export const inventoryService = {
  getAll: (erp = 'DOLIBARR') => api.get('/erp/inventories', { params: { erp } }),
  getOne: (id, erp = 'DOLIBARR') => api.get(`/erp/inventories/${id}`, { params: { erp } }),
  create: (data, erp = 'DOLIBARR') => api.post('/erp/inventories', data, { params: { erp } }),
  update: (id, data, erp = 'DOLIBARR') => api.put(`/erp/inventories/${id}`, data, { params: { erp } }),
};

// === ERP Adapter - Alertes de stock ===

export const stockAlertService = {
  getAll: (erp = 'DOLIBARR') => api.get('/erp/stock-alerts', { params: { erp } }),
  create: (data, erp = 'DOLIBARR') => api.post('/erp/stock-alerts', data, { params: { erp } }),
};

// === ERP Adapter - Retours ===

export const returnService = {
  getAll: (erp = 'DOLIBARR') => api.get('/erp/returns', { params: { erp } }),
  getOne: (id, erp = 'DOLIBARR') => api.get(`/erp/returns/${id}`, { params: { erp } }),
  create: (data, erp = 'DOLIBARR') => api.post('/erp/returns', data, { params: { erp } }),
  update: (id, data, erp = 'DOLIBARR') => api.put(`/erp/returns/${id}`, data, { params: { erp } }),
};

// === ERP Adapter - Promotions ===

export const promotionService = {
  getAll: (erp = 'DOLIBARR') => api.get('/erp/promotions', { params: { erp } }),
  getOne: (id, erp = 'DOLIBARR') => api.get(`/erp/promotions/${id}`, { params: { erp } }),
  create: (data, erp = 'DOLIBARR') => api.post('/erp/promotions', data, { params: { erp } }),
  update: (id, data, erp = 'DOLIBARR') => api.put(`/erp/promotions/${id}`, data, { params: { erp } }),
  delete: (id, erp = 'DOLIBARR') => api.delete(`/erp/promotions/${id}`, { params: { erp } }),
};

// === ERP Adapter - Caisses (POS) ===

export const cashRegisterService = {
  getAll: (erp = 'DOLIBARR') => api.get('/erp/cash-registers', { params: { erp } }),
  getOne: (id, erp = 'DOLIBARR') => api.get(`/erp/cash-registers/${id}`, { params: { erp } }),
  create: (data, erp = 'DOLIBARR') => api.post('/erp/cash-registers', data, { params: { erp } }),
  update: (id, data, erp = 'DOLIBARR') => api.put(`/erp/cash-registers/${id}`, data, { params: { erp } }),
};

// === ERP Adapter - Depenses ===

export const expenseService = {
  getAll: (erp = 'DOLIBARR') => api.get('/erp/expenses', { params: { erp } }),
  getOne: (id, erp = 'DOLIBARR') => api.get(`/erp/expenses/${id}`, { params: { erp } }),
  create: (data, erp = 'DOLIBARR') => api.post('/erp/expenses', data, { params: { erp } }),
  delete: (id, erp = 'DOLIBARR') => api.delete(`/erp/expenses/${id}`, { params: { erp } }),
};

// === ERP Adapter - Reservations ===

export const reservationService = {
  getAll: (erp = 'DOLIBARR') => api.get('/erp/reservations', { params: { erp } }),
  getOne: (id, erp = 'DOLIBARR') => api.get(`/erp/reservations/${id}`, { params: { erp } }),
  create: (data, erp = 'DOLIBARR') => api.post('/erp/reservations', data, { params: { erp } }),
  update: (id, data, erp = 'DOLIBARR') => api.put(`/erp/reservations/${id}`, data, { params: { erp } }),
};

// === ERP Adapter - Projets ===

export const projectService = {
  getAll: (erp = 'DOLIBARR') => api.get('/erp/projects', { params: { erp } }),
  getOne: (id, erp = 'DOLIBARR') => api.get(`/erp/projects/${id}`, { params: { erp } }),
  create: (data, erp = 'DOLIBARR') => api.post('/erp/projects', data, { params: { erp } }),
  update: (id, data, erp = 'DOLIBARR') => api.put(`/erp/projects/${id}`, data, { params: { erp } }),
};

// === ERP Adapter - Agenda ===

export const agendaService = {
  getAll: (erp = 'DOLIBARR') => api.get('/erp/agenda', { params: { erp } }),
  create: (data, erp = 'DOLIBARR') => api.post('/erp/agenda', data, { params: { erp } }),
  update: (id, data, erp = 'DOLIBARR') => api.put(`/erp/agenda/${id}`, data, { params: { erp } }),
  delete: (id, erp = 'DOLIBARR') => api.delete(`/erp/agenda/${id}`, { params: { erp } }),
};

// === ERP Adapter - Statistiques ===

export const statsService = {
  get: (erp = 'DOLIBARR') => api.get('/erp/stats', { params: { erp } }),
};

// === ERP Adapter - Health ===

export const healthService = {
  check: (erp = 'DOLIBARR') => api.get('/erp/health', { params: { erp } }),
};

// === ERP Adapter - Utilisateurs ===

export const userService = {
  getAll: (erp = 'DOLIBARR') => api.get('/erp/users', { params: { erp } }),
  getOne: (id, erp = 'DOLIBARR') => api.get(`/erp/users/${id}`, { params: { erp } }),
  getMe: (erp = 'DOLIBARR') => api.get('/erp/users/me', { params: { erp } }),
};

// === Data Runtime ===

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

// === Automation ===

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
