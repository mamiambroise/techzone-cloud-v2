import { api } from '../apiClient.js';

const unwrap = (res) => res.data;

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
  return api.get('/integrations/webhooks').then(unwrap).then((res) => {
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
  return api.post('/integrations/webhooks', {
    ...body,
    signaturePolicy: toBackendSignaturePolicy(body.signaturePolicy),
    retryPolicy: toBackendRetryPolicy(body.retryPolicy),
  }).then(unwrap);
}
export function updateWebhook(id, body) {
  return api.patch(`/integrations/webhooks/${id}`, {
    ...body,
    signaturePolicy: body.signaturePolicy ? toBackendSignaturePolicy(body.signaturePolicy) : undefined,
    retryPolicy: body.retryPolicy ? toBackendRetryPolicy(body.retryPolicy) : undefined,
  }).then(unwrap);
}
export function transitionWebhookStatus(id, status) {
  return api.post(`/integrations/webhooks/${id}/transition`, { status }).then(unwrap);
}
export function deleteWebhook(id) {
  return api.delete(`/integrations/webhooks/${id}`).then(unwrap);
}
export function triggerInboundTest(code, payload) {
  return api.post(`/webhooks/inbound/${code}`, payload || { test: true }, {
    headers: { 'X-Webhook-Signature': 'test-signature', 'X-Webhook-Event-Id': `evt-test-${Date.now().toString(36)}` },
  }).then(unwrap);
}
export function getDeliveries(code, status) {
  return api.get(`/webhooks/inbound/${code}/deliveries`, {
    headers: status ? { 'x-delivery-status': status } : {},
  }).then(unwrap);
}
