// Existing IAM grants; never use the demo Redux profiles for navigation access.
export function canAccess(entry, session) {
  const user = session?.user ?? session;
  if (!user || !entry) return false;
  const permissions = user.permissions ?? session?.permissions ?? [];
  const roles = user.roles ?? [user.isAdmin ? 'admin' : 'user'];
  const required = [...(entry.permissions ?? []), ...(entry.permission ? [entry.permission] : [])];
  if (!required.every(p => permissions.includes(p) || permissions.includes('*') || user.isSuperAdmin === true)) return false;
  if (entry.roles?.length && !entry.roles.some(role => roles.includes(role))) return false;
  if (entry.entitlement && !(user.entitlements ?? []).includes(entry.entitlement)) return false;
  return true;
}
