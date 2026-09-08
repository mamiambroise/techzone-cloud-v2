import apiClient from './client.js';

const toBackendSignaturePolicy = (policy) => {
  if (!policy || typeof policy !== 'string') return policy;
  const normalized = policy.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return { algorithm: normalized };
};

const toFrontendSignaturePolicy = (policy) => {
  if (!policy || typeof policy !== 'object') return policy;
  return policy.algorithm || policy;
};

const toBackendRetryPolicy = (policy) => {
  if (!policy || typeof policy !== 'object') return policy;
  const result = { ...policy };
  if (result.backoff && !result.backoffMultiplier) {
    result.backoffMultiplier = result.backoff === 'EXPONENTIAL' ? 2 : result.backoff === 'LINEAR' ? 1 : 2;
    delete result.backoff;
  }
  return result;
};

const toFrontendRetryPolicy = (policy) => {
  if (!policy || typeof policy !== 'object') return policy;
  const result = { ...policy };
  if (result.backoffMultiplier && !result.backoff) {
    result.backoff = result.backoffMultiplier === 2 ? 'EXPONENTIAL' : 'LINEAR';
    delete result.backoffMultiplier;
  }
  return result;
};

export function getWebhooks() {
  return apiClient.get('/api/integrations/webhooks').then((res) => {
    const items = Array.isArray(res) ? res : res.data || [];
    return items.map((webhook) => ({
      ...webhook,
      signaturePolicy: toFrontendSignaturePolicy(webhook.signaturePolicy),
      retryPolicy: toFrontendRetryPolicy(webhook.retryPolicy),
      successRatePct: 100,
      deliveriesCount24h: 0,
    }));
  });
}

export function createWebhook(body) {
  return apiClient.post('/api/integrations/webhooks', {
    ...body,
    signaturePolicy: toBackendSignaturePolicy(body.signaturePolicy),
    retryPolicy: toBackendRetryPolicy(body.retryPolicy),
  });
}

export function updateWebhook(id, body) {
  return apiClient.patch(`/api/integrations/webhooks/${id}`, {
    ...body,
    signaturePolicy: body.signaturePolicy ? toBackendSignaturePolicy(body.signaturePolicy) : undefined,
    retryPolicy: body.retryPolicy ? toBackendRetryPolicy(body.retryPolicy) : undefined,
  });
}

export function transitionWebhookStatus(id, status) {
  return apiClient.post(`/api/integrations/webhooks/${id}/transition`, { status });
}

export function deleteWebhook(id) {
  return apiClient.delete(`/api/integrations/webhooks/${id}`);
}

export function triggerInboundTest(code, payload) {
  return apiClient.post(`/webhooks/inbound/${code}`, payload || { test: true }, {
    headers: {
      'X-Webhook-Signature': 'test-signature',
      'X-Webhook-Event-Id': `evt-test-${Date.now().toString(36)}`,
    },
  });
}

export function getDeliveries(code, status) {
  return apiClient.get(`/webhooks/inbound/${code}/deliveries`, {
    headers: status ? { 'x-delivery-status': status } : {},
  });
}
