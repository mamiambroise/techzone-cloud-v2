import { delegations as initialDelegations } from '../data/mock';

let store = initialDelegations.map((d) => ({ ...d }));
let _nextId = store.reduce((max, d) => Math.max(max, d.id), 0) + 1;

const permissionHierarchy = ['reports.read', 'reports.write', 'reports.admin', 'users.read', 'users.write', 'users.admin'];

function permissionLevel(permission) {
  const idx = permissionHierarchy.indexOf(permission);
  return idx === -1 ? -1 : idx;
}

export function listDelegations() {
  return store.map((d) => ({ ...d }));
}

export function getDelegation(id) {
  const found = store.find((d) => d.id === id);
  return found ? { ...found } : null;
}

export function createDelegation(payload) {
  const delegatorMax = payload.delegatorMaxPermission || 'users.read';
  const requested = Array.isArray(payload.permissions) ? payload.permissions : [];
  const invalid = requested.find((p) => permissionLevel(p) > permissionLevel(delegatorMax));
  if (invalid) {
    throw new Error(`Permission trop élevée : ${invalid} > ${delegatorMax}`);
  }

  const created = {
    id: _nextId++,
    delegationId: `DEL-${String(_nextId).padStart(3, '0')}`,
    grantedTo: payload.grantedTo || '—',
    scopeType: payload.scopeType || 'tenant',
    scopeId: payload.scopeId || 1,
    permissions: requested,
    startsAt: payload.startsAt || new Date().toISOString().slice(0, 16),
    endsAt: payload.endsAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    status: 'ACTIVE',
    grantedBy: payload.grantedBy || 'Alice Admin',
    delegatorMaxPermission: delegatorMax,
  };

  store = [created, ...store];
  return { ...created };
}

export function revokeDelegation(id) {
  store = store.map((d) => (d.id === id ? { ...d, status: 'REVOKED' } : d));
  const updated = store.find((d) => d.id === id);
  return updated ? { ...updated } : null;
}

export function resetStore() {
  store = initialDelegations.map((d) => ({ ...d }));
  _nextId = store.reduce((max, d) => Math.max(max, d.id), 0) + 1;
}
