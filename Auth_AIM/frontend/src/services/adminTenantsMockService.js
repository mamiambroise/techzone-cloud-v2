import { adminTenants as initialAdminTenants } from '../data/mock';

let store = initialAdminTenants.map((t) => ({ ...t }));
let _nextId = store.reduce((max, t) => Math.max(max, t.id), 0) + 1;

export function listAdminTenants() {
  return store.map((t) => ({ ...t }));
}

export function getAdminTenant(id) {
  const found = store.find((t) => t.id === id);
  return found ? { ...found } : null;
}

export function setAdminTenantStatus(id, status) {
  store = store.map((t) => (t.id === id ? { ...t, status } : t));
  const updated = store.find((t) => t.id === id);
  return updated ? { ...updated } : null;
}

export function resetStore() {
  store = initialAdminTenants.map((t) => ({ ...t }));
  _nextId = store.reduce((max, t) => Math.max(max, t.id), 0) + 1;
}
