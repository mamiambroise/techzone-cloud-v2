import { useMemo } from 'react';
import { useAuth } from '../../auth/AuthProvider.jsx';

const permissionList = (permissions) => {
  if (Array.isArray(permissions)) return permissions;
  if (typeof permissions === 'string') return [permissions];
  return [];
};

export function can(permissions, permission) {
  const list = permissionList(permissions);
  return list.includes('*') || list.includes(permission);
}

export function canAny(permissions, requiredPermissions) {
  return requiredPermissions.some((permission) => can(permissions, permission));
}

export function useAutomationPermissions() {
  const { user } = useAuth();
  const permissions = permissionList(user?.permissions);

  return useMemo(() => ({
    permissions,
    can: (permission) => user?.isSuperAdmin === true || can(permissions, permission),
    canAny: (required) => user?.isSuperAdmin === true || canAny(permissions, required),
  }), [permissions, user?.isSuperAdmin]);
}
