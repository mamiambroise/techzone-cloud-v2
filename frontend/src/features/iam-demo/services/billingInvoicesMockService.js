import { billingInvoices as initialInvoices } from '../data/mock';

let store = initialInvoices.map((inv) => ({ ...inv }));
let _nextId = store.reduce((max, inv) => Math.max(max, inv.id), 0) + 1;

export function listInvoices() {
  return store.map((inv) => ({ ...inv }));
}

export function getInvoice(id) {
  const found = store.find((inv) => inv.id === id);
  return found ? { ...found } : null;
}

export function markInvoicePaid(id) {
  const found = getInvoice(id);
  if (!found) return null;
  store = store.map((inv) => (inv.id === id ? { ...inv, status: 'PAID', updatedAt: new Date().toISOString().slice(0, 10) } : inv));
  return getInvoice(id);
}

export function cancelInvoice(id) {
  const found = getInvoice(id);
  if (!found) return null;
  store = store.map((inv) => (inv.id === id ? { ...inv, status: 'VOID', updatedAt: new Date().toISOString().slice(0, 10) } : inv));
  return getInvoice(id);
}

export function resetStore() {
  store = initialInvoices.map((inv) => ({ ...inv }));
  _nextId = store.reduce((max, inv) => Math.max(max, inv.id), 0) + 1;
}
