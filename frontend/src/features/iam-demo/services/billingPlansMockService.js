import { billingPlans as initialPlans } from '../data/mock';

let store = initialPlans.map((p) => ({ ...p, quotas: p.quotas?.map((q) => ({ ...q })), features: [...(p.features || [])], modules: [...(p.modules || [])], capabilities: [...(p.capabilities || [])] }));
let _nextId = store.reduce((max, p) => Math.max(max, p.id), 0) + 1;

export function listPlans() {
  return store.map((p) => ({ ...p, quotas: p.quotas?.map((q) => ({ ...q })), features: [...(p.features || [])], modules: [...(p.modules || [])], capabilities: [...(p.capabilities || [])] }));
}

export function getPlan(id) {
  const found = store.find((p) => p.id === id);
  return found ? { ...found, quotas: found.quotas?.map((q) => ({ ...q })), features: [...(found.features || [])] } : null;
}

export function createPlan(data) {
  const plan = { id: _nextId++, ...data, status: 'DRAFT', version: 1, createdAt: new Date().toISOString().slice(0, 10), updatedAt: new Date().toISOString().slice(0, 10) };
  store = [...store, plan];
  return { ...plan };
}

export function updatePlan(id, data) {
  const idx = store.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  store = store.map((p, i) => (i === idx ? { ...p, ...data, updatedAt: new Date().toISOString().slice(0, 10) } : p));
  return getPlan(id);
}

export function changePlanStatus(id, status) {
  const found = getPlan(id);
  if (!found) return null;
  store = store.map((p) => (p.id === id ? { ...p, status, updatedAt: new Date().toISOString().slice(0, 10) } : p));
  return getPlan(id);
}

export function resetStore() {
  store = initialPlans.map((p) => ({ ...p, quotas: p.quotas?.map((q) => ({ ...q })), features: [...(p.features || [])], modules: [...(p.modules || [])], capabilities: [...(p.capabilities || [])] }));
  _nextId = store.reduce((max, p) => Math.max(max, p.id), 0) + 1;
}
