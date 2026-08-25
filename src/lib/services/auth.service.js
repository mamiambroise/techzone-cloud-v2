import { ROLE_PERMISSIONS } from "../types/domain";
export function getActorFromRequest(request) {
  const roleHeader = request.headers.get("x-user-role");
  const actorId = request.headers.get("x-actor-id") || "usr_admin_01";
  const actorName = request.headers.get("x-actor-name") || "Administrateur Business";
  const actorEmail = request.headers.get("x-actor-email") || "admin@businessmanager.io";
  const validRole = roleHeader === "VIEWER" || roleHeader === "BUILDER" || roleHeader === "ADMIN" ? roleHeader : "ADMIN";
  return {
    id: actorId,
    name: actorName,
    email: actorEmail,
    role: validRole
  };
}
export function hasPermission(actor, permission) {
  const permissions = ROLE_PERMISSIONS[actor.role] || [];
  return permissions.includes(permission);
}