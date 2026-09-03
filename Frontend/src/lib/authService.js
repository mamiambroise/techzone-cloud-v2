// LEGACY compatibility surface. Authentication is owned by /api/v1/auth/session.
// No user, credential, reset token, audit event or session is persisted locally.
export function getSecurityAuditLogs() {
  return [];
}
