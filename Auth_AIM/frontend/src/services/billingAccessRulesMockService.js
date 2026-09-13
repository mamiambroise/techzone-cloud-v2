import { billingAccessRules as initialRules } from '../data/mock';

let store = initialRules.map((r) => ({ ...r }));
let _nextId = store.reduce((max, r) => Math.max(max, r.id), 0) + 1;

export function listAccessRules() {
  return store.map((r) => ({ ...r }));
}

export function getAccessRule(id) {
  const found = store.find((r) => r.id === id);
  return found ? { ...found } : null;
}

export function resetStore() {
  store = initialRules.map((r) => ({ ...r }));
  _nextId = store.reduce((max, r) => Math.max(max, r.id), 0) + 1;
}
