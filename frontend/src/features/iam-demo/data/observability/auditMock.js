export const obsAuditLogs = [
  { id: 'audit-001', timestamp: '2026-09-08 20:32:00', actorType: 'USER', actorId: 1, tenantId: 1, applicationId: 'iam-console', action: 'SESSION_REVOKE', resourceType: 'session', resourceId: 5, result: 'SUCCESS', reason: 'ADMIN_REVOKE', traceId: 'trace-011', metadataSafe: { userId: 3, ip: '192.168.1.42' } },
  { id: 'audit-002', timestamp: '2026-09-08 18:12:00', actorType: 'USER', actorId: 2, tenantId: 2, applicationId: 'iam-console', action: 'USER_SUSPEND', resourceType: 'user', resourceId: 10, result: 'SUCCESS', reason: 'ADMIN_SUSPEND', traceId: 'trace-012', metadataSafe: { targetUser: 'Inès Blanc' } },
  { id: 'audit-003', timestamp: '2026-09-08 16:05:00', actorType: 'SYSTEM', actorId: null, tenantId: 1, applicationId: 'context-engine', action: 'CONTEXT_RESOLVE', resourceType: 'context', resourceId: 'ctx-001', result: 'SUCCESS', reason: null, traceId: 'trace-013', metadataSafe: { userId: 1, tenantId: 1 } },
  { id: 'audit-004', timestamp: '2026-09-08 14:30:00', actorType: 'USER', actorId: 1, tenantId: 1, applicationId: 'iam-console', action: 'ROLE_UPDATE', resourceType: 'role', resourceId: 3, result: 'SUCCESS', reason: 'Promotion Manager', traceId: 'trace-014', metadataSafe: { targetUser: 'Hugo Mercier', oldRole: 'Éditeur', newRole: 'Manager' } },
  { id: 'audit-005', timestamp: '2026-09-08 09:15:00', actorType: 'USER', actorId: 1, tenantId: 1, applicationId: 'iam-console', action: 'TENANT_CREATE', resourceType: 'tenant', resourceId: 8, result: 'SUCCESS', reason: 'Nouveau tenant', traceId: 'trace-015', metadataSafe: { tenantName: 'Boutique D - Paris' } },
  { id: 'audit-006', timestamp: '2026-09-08 08:50:00', actorType: 'USER', actorId: 2, tenantId: 2, applicationId: 'iam-console', action: 'SESSION_REVOKE', resourceType: 'session', resourceId: 7, result: 'SUCCESS', reason: 'ADMIN_REVOKE', traceId: 'trace-016', metadataSafe: { userId: 5, device: 'iPad' } },
  { id: 'audit-007', timestamp: '2026-09-07 17:22:00', actorType: 'USER', actorId: 1, tenantId: 1, applicationId: 'iam-console', action: 'ORG_ARCHIVE', resourceType: 'organisation', resourceId: 5, result: 'SUCCESS', reason: 'ADMIN_ARCHIVE', traceId: 'trace-017', metadataSafe: { orgName: 'Boutique E' } },
  { id: 'audit-008', timestamp: '2026-09-07 14:40:00', actorType: 'USER', actorId: 2, tenantId: 2, applicationId: 'iam-console', action: 'POLICY_CREATE', resourceType: 'policy', resourceId: 4, result: 'SUCCESS', reason: 'Nouvelle politique', traceId: 'trace-018', metadataSafe: { policyName: 'Accès Support Restreint' } },
  { id: 'audit-009', timestamp: '2026-09-07 11:05:00', actorType: 'USER', actorId: 1, tenantId: 1, applicationId: 'iam-console', action: 'USER_UPDATE', resourceType: 'user', resourceId: 8, result: 'SUCCESS', reason: 'Update profil', traceId: 'trace-019', metadataSafe: { targetUser: 'Léa Fontaine', fields: ['phone', 'timezone'] } },
  { id: 'audit-010', timestamp: '2026-09-06 09:00:00', actorType: 'SYSTEM', actorId: null, tenantId: null, applicationId: 'batch-job', action: 'BATCH_CLEANUP', resourceType: 'session', resourceId: null, result: 'SUCCESS', reason: 'Nettoyage automatique', traceId: 'trace-020', metadataSafe: { expiredCount: 12 } },
];

export const obsAuditFilters = {
  actorTypes: ['USER', 'SYSTEM', 'SERVICE'],
  actions: ['SESSION_REVOKE', 'USER_SUSPEND', 'CONTEXT_RESOLVE', 'ROLE_UPDATE', 'TENANT_CREATE', 'ORG_ARCHIVE', 'POLICY_CREATE', 'USER_UPDATE', 'BATCH_CLEANUP'],
  resourceTypes: ['session', 'user', 'context', 'role', 'tenant', 'organisation', 'policy'],
  results: ['SUCCESS', 'FAILURE', 'PARTIAL'],
};
