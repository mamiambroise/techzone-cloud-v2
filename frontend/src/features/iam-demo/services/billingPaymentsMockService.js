import { billingPayments as initialPayments } from '../data/mock';

let store = initialPayments.map((p) => ({ ...p, timeline: [...(p.timeline || [])] }));
let _nextId = store.reduce((max, p) => Math.max(max, p.id), 0) + 1;

export function listPayments() {
  return store.map((p) => ({ ...p, timeline: [...(p.timeline || [])] }));
}

export function getPayment(id) {
  const found = store.find((p) => p.id === id);
  return found ? { ...found, timeline: [...(found.timeline || [])] } : null;
}

export function refundPayment(id) {
  const found = getPayment(id);
  if (!found) return null;
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  store = store.map((p) => {
    if (p.id !== id) return p;
    return {
      ...p,
      status: 'REFUNDED',
      updatedAt: now,
      timeline: [...p.timeline, { event: 'REFUND_SUCCEEDED', timestamp: now }],
    };
  });
  return getPayment(id);
}

export function resetStore() {
  store = initialPayments.map((p) => ({ ...p, timeline: [...(p.timeline || [])] }));
  _nextId = store.reduce((max, p) => Math.max(max, p.id), 0) + 1;
}
