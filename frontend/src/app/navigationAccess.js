const list = (value) => (Array.isArray(value) ? value : []);

export function canAccess(entry, session) {
  const user = session?.user ?? session;
  if (!user || !entry) return false;
  const permissions = list(user.permissions ?? session?.permissions);
  const roles = list(user.roles ?? session?.roles);
  const effectiveRoles = roles.length ? roles : [user.isAdmin ? "admin" : "user"];
  const required = [...list(entry.permissions), ...(entry.permission ? [entry.permission] : [])];
  const privileged = user.isSuperAdmin === true || permissions.includes("*");
  if (!required.every((p) => privileged || permissions.includes(p))) return false;
  if (entry.roles?.length && !entry.roles.some((r) => effectiveRoles.includes(r))) return false;
  if (entry.entitlement && !list(user.entitlements ?? session?.entitlements).includes(entry.entitlement)) return false;
  if (entry.feature && !list(user.features ?? session?.features).includes(entry.feature)) return false;
  if (entry.capability && !list(user.capabilities ?? session?.capabilities).includes(entry.capability)) return false;
  return true;
}
