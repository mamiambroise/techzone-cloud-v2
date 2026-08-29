import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Client axios avec configuration de base
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur pour gerer les erreurs globalement
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Erreur reseau';
    console.error(`[API Error] ${message}`);
    return Promise.reject(error);
  }
);

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
  getAll: (erp = 'MOCK') => api.get('/erp/clients', { params: { erp } }),
  getOne: (id, erp = 'MOCK') => api.get(`/erp/clients/${id}`, { params: { erp } }),
  create: (data, erp = 'MOCK') => api.post('/erp/clients', data, { params: { erp } }),
  update: (id, data, erp = 'MOCK') => api.put(`/erp/clients/${id}`, data, { params: { erp } }),
  delete: (id, erp = 'MOCK') => api.delete(`/erp/clients/${id}`, { params: { erp } }),
};

// === ERP Adapter - Produits ===

export const productService = {
  getAll: (erp = 'MOCK') => api.get('/erp/products', { params: { erp } }),
  getOne: (id, erp = 'MOCK') => api.get(`/erp/products/${id}`, { params: { erp } }),
  create: (data, erp = 'MOCK') => api.post('/erp/products', data, { params: { erp } }),
  update: (id, data, erp = 'MOCK') => api.put(`/erp/products/${id}`, data, { params: { erp } }),
  delete: (id, erp = 'MOCK') => api.delete(`/erp/products/${id}`, { params: { erp } }),
};

// === ERP Adapter - Commandes ===

export const orderService = {
  getAll: (erp = 'MOCK') => api.get('/erp/orders', { params: { erp } }),
  getOne: (id, erp = 'MOCK') => api.get(`/erp/orders/${id}`, { params: { erp } }),
  create: (data, erp = 'MOCK') => api.post('/erp/orders', data, { params: { erp } }),
  update: (id, data, erp = 'MOCK') => api.put(`/erp/orders/${id}`, data, { params: { erp } }),
  delete: (id, erp = 'MOCK') => api.delete(`/erp/orders/${id}`, { params: { erp } }),
};

// === ERP Adapter - Stock ===

export const stockService = {
  get: (productId, erp = 'MOCK') => api.get(`/erp/stock/${productId}`, { params: { erp } }),
  update: (productId, quantity, erp = 'MOCK') =>
    api.put(`/erp/stock/${productId}`, { quantity }, { params: { erp } }),
};

// === ERP Adapter - Health ===

export const healthService = {
  check: (erp = 'MOCK') => api.get('/erp/health', { params: { erp } }),
};

export default api;
