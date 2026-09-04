import { users as initialUsers } from '../data/mock';

let store = initialUsers.map((u) => ({ ...u }));
let nextId = store.reduce((max, u) => Math.max(max, u.id), 0) + 1;

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

export function listUsers() {
  return store.map((u) => ({ ...u }));
}

export function getUser(id) {
  const found = store.find((u) => u.id === id);
  return found ? { ...found } : null;
}

export function createUser(payload) {
  const firstName = (payload.firstName || '').trim();
  const lastName = (payload.lastName || '').trim();
  const email = (payload.email || '').trim();
  const tenant = payload.tenant || 'Boutique A';
  const roles = Array.isArray(payload.roles) && payload.roles.length > 0 ? payload.roles : ['Viewer'];
  const status = payload.status === 'suspended' ? 'suspended' : 'active';
  const identityType = payload.identityType || 'EMAIL';

  const created = {
    id: nextId++,
    firstName,
    lastName,
    email,
    avatarInitials: makeInitials(firstName, lastName),
    identityType,
    roles,
    tenant,
    status,
    lastActivity: nowString(),
    isOnline: true,
    phone: payload.phone || '',
    createdAt: nowString().slice(0, 10),
    lastLogin: nowString(),
    language: payload.language || 'fr',
    timezone: payload.timezone || 'Europe/Paris',
    preferences: payload.preferences || 'Notifications activées',
    activeSessions: 1,
    connections24h: 0,
    recentActivity: [
      { time: nowString().slice(11), title: 'Compte créé', description: 'Utilisateur ajouté manuellement', type: 'success' },
    ],
  };

  store = [created, ...store];
  return { ...created };
}

export function updateUser(id, patch) {
  let updated = null;
  store = store.map((u) => {
    if (u.id !== id) return u;
    const merged = { ...u, ...patch };
    if ('firstName' in patch || 'lastName' in patch) {
      merged.avatarInitials = makeInitials(merged.firstName, merged.lastName);
    }
    updated = merged;
    return merged;
  });
  return updated ? { ...updated } : null;
}

export function setUserStatus(id, status) {
  const next = status === 'active' ? 'active' : 'suspended';
  return updateUser(id, { status: next });
}

export function deleteUser(id) {
  const before = store.length;
  store = store.filter((u) => u.id !== id);
  return store.length < before;
}

export function resetStore() {
  store = initialUsers.map((u) => ({ ...u }));
  nextId = store.reduce((max, u) => Math.max(max, u.id), 0) + 1;
}