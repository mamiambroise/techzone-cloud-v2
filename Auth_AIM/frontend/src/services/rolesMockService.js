import { roles as initialRoles, permissions as initialPermissions, rolePermissions as initialRolePermissions, userRoles as initialUserRoles } from '../data/mock';

let roleStore = initialRoles.map((r) => ({ ...r }));
let permissionStore = initialPermissions.map((p) => ({ ...p }));
let rolePermissionStore = initialRolePermissions.map((rp) => ({ ...rp }));
let userRoleStore = initialUserRoles.map((ur) => ({ ...ur }));
let roleNextId = roleStore.reduce((max, r) => Math.max(max, r.id), 0) + 1;

function nowDate() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function listRoles() {
  return roleStore.map((r) => ({ ...r }));
}

export function getRole(id) {
  const found = roleStore.find((r) => r.id === id);
  return found ? { ...found } : null;
}

export function createRole(payload) {
  const created = {
    id: roleNextId++,
    name: (payload.name || '').trim(),
    type: payload.type || 'custom',
    scope: payload.scope || 'global',
    description: (payload.description || '').trim(),
    status: 'active',
    createdAt: nowDate(),
    isSystem: false,
  };

  roleStore = [created, ...roleStore];
  return { ...created };
}

export function updateRole(id, patch) {
  let updated = null;
  roleStore = roleStore.map((r) => {
    if (r.id !== id) return r;
    const merged = { ...r, ...patch };
    updated = merged;
    return merged;
  });
  return updated ? { ...updated } : null;
}

export function archiveRole(id) {
  return updateRole(id, { status: 'archived' });
}

export function deleteRole(id) {
  const before = roleStore.length;
  roleStore = roleStore.filter((r) => r.id !== id);
  rolePermissionStore = rolePermissionStore.filter((rp) => rp.roleId !== id);
  userRoleStore = userRoleStore.filter((ur) => ur.roleId !== id);
  return roleStore.length < before;
}

export function listPermissions() {
  return permissionStore.map((p) => ({ ...p }));
}

export function getPermission(id) {
  const found = permissionStore.find((p) => p.id === id);
  return found ? { ...found } : null;
}

export function listRolePermissions(roleId) {
  return rolePermissionStore
    .filter((rp) => rp.roleId === roleId)
    .map((rp) => {
      const perm = permissionStore.find((p) => p.id === rp.permissionId);
      return perm ? { ...perm } : null;
    })
    .filter(Boolean);
}

export function assignPermission(roleId, permissionId) {
  const exists = rolePermissionStore.some((rp) => rp.roleId === roleId && rp.permissionId === permissionId);
  if (!exists) {
    rolePermissionStore = [...rolePermissionStore, { roleId, permissionId }];
  }
  return listRolePermissions(roleId);
}

export function removePermission(roleId, permissionId) {
  rolePermissionStore = rolePermissionStore.filter((rp) => !(rp.roleId === roleId && rp.permissionId === permissionId));
  return listRolePermissions(roleId);
}

export function getRoleAssignmentCount(roleId) {
  return userRoleStore.filter((ur) => ur.roleId === roleId).length;
}

export function getUserRoles(userId) {
  return userRoleStore.filter((ur) => ur.userId === userId).map((ur) => ur.roleId);
}

export function resetStore() {
  roleStore = initialRoles.map((r) => ({ ...r }));
  permissionStore = initialPermissions.map((p) => ({ ...p }));
  rolePermissionStore = initialRolePermissions.map((rp) => ({ ...rp }));
  userRoleStore = initialUserRoles.map((ur) => ({ ...ur }));
  roleNextId = roleStore.reduce((max, r) => Math.max(max, r.id), 0) + 1;
}
