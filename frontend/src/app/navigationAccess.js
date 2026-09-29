// Existing IAM grants; never use the demo Redux profiles for navigation access.
const userGrants = ['erp:read', 'automation:read', 'data-runtime:read', 'data-runtime:query', 'config:read'];
const adminGrants = [...userGrants, 'erp:write', 'automation:execute', 'data-runtime:execute', 'iam:admin'];
export function canAccess(entry, session) {
  const user = session?.user ?? session;
  if (!user || !entry) return false;
  const permissions = user.permissions ?? session?.permissions ?? (user.isAdmin ? adminGrants : userGrants);
  const roles = user.roles ?? [user.isAdmin ? 'admin' : 'user'];
  const required = [...(entry.permissions ?? []), ...(entry.permission ? [entry.permission] : [])];
  if (!required.every(p => permissions.includes(p) || permissions.includes('*'))) return false;
  if (entry.roles?.length && !entry.roles.some(role => roles.includes(role))) return false;
  if (entry.entitlement && !(user.entitlements ?? []).includes(entry.entitlement)) return false;
  return true;
}
