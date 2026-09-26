import { billingSubscriptions as initialSubs } from '../data/mock';

let store = initialSubs.map((s) => ({ ...s }));
let _nextId = store.reduce((max, s) => Math.max(max, s.id), 0) + 1;

export function listSubscriptions() {
  return store.map((s) => ({ ...s }));
}

export function getSubscription(id) {
  const found = store.find((s) => s.id === id);
  return found ? { ...found } : null;
}

export function createSubscription(data) {
  const sub = { id: _nextId++, ...data, currentPeriodStart: data.currentPeriodStart || null, currentPeriodEnd: data.currentPeriodEnd || null, createdAt: new Date().toISOString().slice(0, 10), updatedAt: new Date().toISOString().slice(0, 10) };
  store = [...store, sub];
  return { ...sub };
}

export function updateSubscription(id, data) {
  const idx = store.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  store = store.map((s, i) => (i === idx ? { ...s, ...data, updatedAt: new Date().toISOString().slice(0, 10) } : s));
  return getSubscription(id);
}

export function changeSubscriptionStatus(id, status) {
  const found = getSubscription(id);
  if (!found) return null;
  store = store.map((s) => (s.id === id ? { ...s, status, updatedAt: new Date().toISOString().slice(0, 10) } : s));
  return getSubscription(id);
}

export function resetStore() {
  store = initialSubs.map((s) => ({ ...s }));
  _nextId = store.reduce((max, s) => Math.max(max, s.id), 0) + 1;
}
