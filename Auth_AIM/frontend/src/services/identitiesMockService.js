import { identities as initialIdentities } from '../data/mock';

let store = initialIdentities.map((i) => ({ ...i }));
let nextId = store.reduce((max, i) => Math.max(max, i.id), 0) + 1;

function nowString() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function makeInitials(firstName, lastName) {
  const f = (firstName || '').trim();
  const l = (lastName || '').trim();
  return `${(f[0] || '').toUpperCase()}${(l[0] || '').toUpperCase()}` || 'NU';
}

export function listIdentities() {
  return store.map((i) => ({ ...i }));
}

export function getIdentity(id) {
  const found = store.find((i) => i.id === id);
  return found ? { ...found } : null;
}

export function createIdentity(payload) {
  const firstName = (payload.firstName || '').trim();
  const lastName = (payload.lastName || '').trim();
  const email = (payload.email || '').trim();
  const type = payload.type || 'EMAIL';
  const source = payload.source || 'SIGN_UP';
  const status = payload.status || 'ACTIVE';
  const isPrimary = payload.isPrimary === true || payload.isPrimary === 'true';
  const linkedUser = (payload.linkedUser || '').trim() || null;
  const erpLink = payload.erpLink === true || payload.erpLink === 'true';
  const erpSource = (payload.erpSource || '').trim() || null;

  const created = {
    id: nextId++,
    firstName,
    lastName,
    email,
    avatarInitials: makeInitials(firstName, lastName),
    type,
    source,
    isPrimary,
    linkedUser,
    erpLink,
    erpSource,
    status,
    createdAt: nowString().slice(0, 10),
    lastActivity: nowString(),
  };

  store = [created, ...store];
  return { ...created };
}

export function updateIdentity(id, patch) {
  let updated = null;
  store = store.map((i) => {
    if (i.id !== id) return i;
    const merged = { ...i, ...patch };
    if ('firstName' in patch || 'lastName' in patch) {
      merged.avatarInitials = makeInitials(merged.firstName, merged.lastName);
    }
    updated = merged;
    return merged;
  });
  return updated ? { ...updated } : null;
}

export function setIdentityStatus(id, status) {
  const next = status === 'ACTIVE' ? 'ACTIVE' : status === 'SUSPENDED' ? 'SUSPENDED' : status === 'PENDING' ? 'PENDING' : status === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE';
  return updateIdentity(id, { status: next });
}

export function deleteIdentity(id) {
  const before = store.length;
  store = store.filter((i) => i.id !== id);
  return store.length < before;
}

export function resetStore() {
  store = initialIdentities.map((i) => ({ ...i }));
  nextId = store.reduce((max, i) => Math.max(max, i.id), 0) + 1;
}
