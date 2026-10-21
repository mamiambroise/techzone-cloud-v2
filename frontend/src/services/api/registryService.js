import { api } from '../apiClient.js';

const unwrap = (response) => response.data;
const get = (path, config) => api.get(`/registry${path}`, config).then(unwrap);

export const registryService = {
  overview: () => get('/overview'),
  namespaces: () => get('/namespaces'),
  sources: () => get('/sources'),
  entries: (params) => get('/entries', { params }),
  entry: (id) => get(`/entries/${encodeURIComponent(id)}`),
  register: (data) => api.post('/registry/entries', data).then(unwrap),
  resolve: (data) => api.post('/registry/resolve', data).then(unwrap),
  capabilities: (params) => get('/capabilities', { params }),
  providers: () => get('/providers'),
  schemas: () => get('/schemas'),
  compatibility: () => get('/compatibility'),
  availability: () => get('/availability'),
  diagnostics: () => get('/diagnostics'),
  audit: () => get('/audit'),
  deprecate: (id, data) =>
    api.post(`/registry/entries/${encodeURIComponent(id)}/deprecate`, data).then(unwrap),
  disable: (id, reason) =>
    api.patch(`/registry/entries/${encodeURIComponent(id)}/disable`, { reason }).then(unwrap),
  remove: (id, reason) =>
    api.delete(`/registry/entries/${encodeURIComponent(id)}`, { data: { reason } }).then(unwrap),
};
