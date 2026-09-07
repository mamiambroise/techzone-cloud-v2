import apiClient from './client.js';

const toBackendCapabilities = (caps) => {
  if (!Array.isArray(caps)) return caps;
  return caps.reduce((acc, cap) => {
    acc[cap] = true;
    return acc;
  }, {});
};

const toFrontendCapabilities = (caps) => {
  if (!caps || typeof caps !== 'object') return [];
  return Object.keys(caps);
};

export function getConnectors() {
  return apiClient.get('/api/integrations/connectors').then((res) => {
    const items = Array.isArray(res) ? res : res.data || [];
    return items.map((connector) => ({
      ...connector,
      capabilities: toFrontendCapabilities(connector.capabilities),
    }));
  });
}

export function createConnector(body) {
  return apiClient.post('/api/integrations/connectors', {
    ...body,
    capabilities: toBackendCapabilities(body.capabilities),
  });
}

export function updateConnector(id, body) {
  return apiClient.patch(`/api/integrations/connectors/${id}`, {
    ...body,
    capabilities: toBackendCapabilities(body.capabilities),
  });
}

export function validateConnector(id, body) {
  return apiClient.post(`/api/integrations/connectors/${id}/validate`, body);
}

export function checkConnectorHealth(id) {
  return apiClient.post(`/api/integrations/connectors/${id}/health`);
}

export function activateConnector(id) {
  return apiClient.post(`/api/integrations/connectors/${id}/activate`);
}

export function disableConnector(id) {
  return apiClient.post(`/api/integrations/connectors/${id}/disable`);
}

export function archiveConnector(id) {
  return apiClient.post(`/api/integrations/connectors/${id}/archive`);
}
