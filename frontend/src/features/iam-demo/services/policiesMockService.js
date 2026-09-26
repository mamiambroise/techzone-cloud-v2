import { policies as initialPolicies } from '../data/mock';

let policyStore = initialPolicies.map((p) => ({ ...p }));
let policyNextId = policyStore.reduce((max, p) => Math.max(max, p.id), 0) + 1;

function nowDate() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function listPolicies() {
  return policyStore.map((p) => ({ ...p }));
}

export function getPolicy(id) {
  const found = policyStore.find((p) => p.id === id);
  return found ? { ...found } : null;
}

export function createPolicy(payload) {
  const created = {
    id: policyNextId++,
    name: (payload.name || '').trim(),
    type: payload.type || 'custom',
    effect: payload.effect || 'ALLOW',
    priority: Number(payload.priority) || 100,
    status: payload.status || 'active',
    description: (payload.description || '').trim(),
    subject: payload.subject || '',
    resource: payload.resource || '',
    action: payload.action || '',
    conditions: payload.conditions || '',
    createdAt: nowDate(),
  };

  policyStore = [created, ...policyStore];
  return { ...created };
}

export function updatePolicy(id, patch) {
  let updated = null;
  policyStore = policyStore.map((p) => {
    if (p.id !== id) return p;
    const merged = { ...p, ...patch };
    if ('priority' in patch) {
      merged.priority = Number(merged.priority) || 0;
    }
    updated = merged;
    return merged;
  });
  return updated ? { ...updated } : null;
}

export function setPolicyStatus(id, status) {
  const next = status === 'active' ? 'active' : status === 'inactive' ? 'inactive' : status;
  return updatePolicy(id, { status: next });
}

export function deletePolicy(id) {
  const before = policyStore.length;
  policyStore = policyStore.filter((p) => p.id !== id);
  return policyStore.length < before;
}

export function resetStore() {
  policyStore = initialPolicies.map((p) => ({ ...p }));
  policyNextId = policyStore.reduce((max, p) => Math.max(max, p.id), 0) + 1;
}
