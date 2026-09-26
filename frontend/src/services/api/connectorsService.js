import { api } from '../apiClient.js';

const unwrap = (res) => res.data;

const toBackendCapabilities = (caps) => {
  if (!Array.isArray(caps)) return caps;
  return caps.reduce((acc, cap) => { acc[cap] = true; return acc; }, {});
};

const toFrontendCapabilities = (caps) => {
  if (!caps || typeof caps !== 'object') return [];
  return Object.keys(caps);
};

export function getConnectors() {
  return api.get('/api/integrations/connectors').then(unwrap).then((res) => {
    const items = Array.isArray(res) ? res : res.data || [];
    return items.map((c) => ({ ...c, capabilities: toFrontendCapabilities(c.capabilities) }));
  });
}
export function createConnector(body) {
  return api.post('/api/integrations/connectors', { ...body, capabilities: toBackendCapabilities(body.capabilities) }).then(unwrap);
}
export function updateConnector(id, body) {
  return api.patch(`/api/integrations/connectors/${id}`, { ...body, capabilities: toBackendCapabilities(body.capabilities) }).then(unwrap);
}
export function validateConnector(id, body) {
  return api.post(`/api/integrations/connectors/${id}/validate`, body).then(unwrap);
}
export function checkConnectorHealth(id) {
  return api.post(`/api/integrations/connectors/${id}/health`).then(unwrap);
}
export function activateConnector(id) {
  return api.post(`/api/integrations/connectors/${id}/activate`).then(unwrap);
}
export function disableConnector(id) {
  return api.post(`/api/integrations/connectors/${id}/disable`).then(unwrap);
}
export function archiveConnector(id) {
  return api.post(`/api/integrations/connectors/${id}/archive`).then(unwrap);
}
