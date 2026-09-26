import { adminUsers as initialAdminUsers } from '../data/mock';

let store = initialAdminUsers.map((u) => ({ ...u }));
let _nextId = store.reduce((max, u) => Math.max(max, u.id), 0) + 1;

export function listAdminUsers() {
  return store.map((u) => ({ ...u }));
}

export function getAdminUser(id) {
  const found = store.find((u) => u.id === id);
  return found ? { ...found } : null;
}

export function setAdminUserStatus(id, status) {
  store = store.map((u) => (u.id === id ? { ...u, status } : u));
  const updated = store.find((u) => u.id === id);
  return updated ? { ...updated } : null;
}

export function setAdminUserLock(id, isLocked) {
  store = store.map((u) => (u.id === id ? { ...u, isLocked } : u));
  const updated = store.find((u) => u.id === id);
  return updated ? { ...updated } : null;
}

export function resetStore() {
  store = initialAdminUsers.map((u) => ({ ...u }));
  _nextId = store.reduce((max, u) => Math.max(max, u.id), 0) + 1;
}
