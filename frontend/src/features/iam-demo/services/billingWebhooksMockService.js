import { billingWebhooks as initialWebhooks } from '../data/mock';

let store = initialWebhooks.map((w) => ({ ...w }));
let _nextId = store.reduce((max, w) => Math.max(max, w.id), 0) + 1;

export function listWebhooks() {
  return store.map((w) => ({ ...w }));
}

export function getWebhook(id) {
  const found = store.find((w) => w.id === id);
  return found ? { ...found } : null;
}

export function replayWebhook(id) {
  const found = getWebhook(id);
  if (!found) return null;
  store = store.map((w) => (w.id === id ? { ...w, status: 'PROCESSED', retryCount: (w.retryCount || 0) + 1, updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') } : w));
  return getWebhook(id);
}

export function resetStore() {
  store = initialWebhooks.map((w) => ({ ...w }));
  _nextId = store.reduce((max, w) => Math.max(max, w.id), 0) + 1;
}
