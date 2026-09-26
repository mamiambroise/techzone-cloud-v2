export const obsLogs = [
  { id: 'log-001', timestamp: '2026-09-08T20:32:00Z', level: 'ERROR', service: 'api-gateway', component: 'router', message: 'Timeout sur /users après 5000ms', traceId: 'trace-001', requestId: 'req-001', tenantId: 1, userId: 1, environmentId: 'prod', errorCode: 'TIMEOUT', metadataSafe: { method: 'GET', path: '/users', duration: 5234 } },
  { id: 'log-002', timestamp: '2026-09-08T20:31:45Z', level: 'WARN', service: 'auth-service', component: 'token', message: 'Refresh token réutilisé détecté', traceId: 'trace-002', requestId: 'req-002', tenantId: 1, userId: 1, environmentId: 'prod', errorCode: null, metadataSafe: { action: 'refresh', ip: '192.168.1.42' } },
  { id: 'log-003', timestamp: '2026-09-08T20:30:12Z', level: 'INFO', service: 'identity-service', component: 'user', message: 'Utilisateur Mami Admin connecté', traceId: 'trace-003', requestId: 'req-003', tenantId: 1, userId: 1, environmentId: 'prod', errorCode: null, metadataSafe: { method: 'POST', path: '/auth/login' } },
  { id: 'log-004', timestamp: '2026-09-08T20:28:55Z', level: 'ERROR', service: 'session-service', component: 'validator', message: 'Session révoquée lors de la validation', traceId: 'trace-004', requestId: 'req-004', tenantId: 2, userId: 5, environmentId: 'prod', errorCode: 'SESSION_REVOKED', metadataSafe: { sessionId: 8, reason: 'ADMIN_REVOKE' } },
  { id: 'log-005', timestamp: '2026-09-08T20:25:00Z', level: 'INFO', service: 'context-engine', component: 'resolver', message: 'Contexte résolu pour user #1', traceId: 'trace-005', requestId: 'req-005', tenantId: 1, userId: 1, environmentId: 'prod', errorCode: null, metadataSafe: { contextId: 'ctx-001', state: 'RESOLVED' } },
  { id: 'log-006', timestamp: '2026-09-08T20:20:30Z', level: 'WARN', service: 'policy-engine', component: 'evaluator', message: 'Policy evaluation lente: 340ms', traceId: 'trace-006', requestId: 'req-006', tenantId: 1, userId: 1, environmentId: 'prod', errorCode: null, metadataSafe: { policyId: 2, duration: 340 } },
  { id: 'log-007', timestamp: '2026-09-08T20:15:00Z', level: 'ERROR', service: 'api-gateway', component: 'middleware', message: 'Rate limit atteint pour IP 10.0.0.45', traceId: 'trace-007', requestId: 'req-007', tenantId: 3, userId: 9, environmentId: 'prod', errorCode: 'RATE_LIMIT', metadataSafe: { ip: '10.0.0.45', limit: 100, window: '1m' } },
  { id: 'log-008', timestamp: '2026-09-08T20:10:00Z', level: 'INFO', service: 'erp-adapter', component: 'dolibarr', message: 'Sync ERP terminée: 3 entités mises à jour', traceId: 'trace-008', requestId: 'req-008', tenantId: 1, userId: 1, environmentId: 'prod', errorCode: null, metadataSafe: { entity: 'user', count: 3 } },
  { id: 'log-009', timestamp: '2026-09-08T20:05:00Z', level: 'WARN', service: 'auth-service', component: 'mfa', message: 'Échec MFA pour user #2 (3 tentatives)', traceId: 'trace-009', requestId: 'req-009', tenantId: 1, userId: 2, environmentId: 'prod', errorCode: 'MFA_FAILURE', metadataSafe: { attempts: 3, method: 'TOTP' } },
  { id: 'log-010', timestamp: '2026-09-08T20:00:00Z', level: 'INFO', service: 'session-service', component: 'cleaner', message: 'Nettoyage de 2 sessions expirées', traceId: 'trace-010', requestId: 'req-010', tenantId: null, userId: null, environmentId: 'prod', errorCode: null, metadataSafe: { expiredCount: 2 } },
];

export const obsLogFilters = {
  levels: ['ERROR', 'WARN', 'INFO', 'DEBUG'],
  services: ['api-gateway', 'auth-service', 'identity-service', 'session-service', 'context-engine', 'policy-engine', 'erp-adapter'],
  components: ['router', 'token', 'user', 'validator', 'resolver', 'evaluator', 'middleware', 'dolibarr', 'mfa', 'cleaner'],
  environments: ['prod', 'staging', 'dev'],
};

export const obsAuditLogs = [
  { id: 'audit-001', timestamp: '2026-09-08T20:32:00Z', actorType: 'USER', actorId: 1, tenantId: 1, applicationId: 'iam-console', action: 'SESSION_REVOKE', resourceType: 'session', resourceId: 5, result: 'SUCCESS', reason: 'ADMIN_REVOKE', traceId: 'trace-011', metadataSafe: { userId: 3, ip: '192.168.1.42' } },
  { id: 'audit-002', timestamp: '2026-09-08T18:12:00Z', actorType: 'USER', actorId: 2, tenantId: 2, applicationId: 'iam-console', action: 'USER_SUSPEND', resourceType: 'user', resourceId: 10, result: 'SUCCESS', reason: 'ADMIN_SUSPEND', traceId: 'trace-012', metadataSafe: { targetUser: 'Inès Blanc' } },
  { id: 'audit-003', timestamp: '2026-09-08T16:05:00Z', actorType: 'SYSTEM', actorId: null, tenantId: 1, applicationId: 'context-engine', action: 'CONTEXT_RESOLVE', resourceType: 'context', resourceId: 'ctx-001', result: 'SUCCESS', reason: null, traceId: 'trace-013', metadataSafe: { userId: 1, tenantId: 1 } },
  { id: 'audit-004', timestamp: '2026-09-08T14:30:00Z', actorType: 'USER', actorId: 1, tenantId: 1, applicationId: 'iam-console', action: 'ROLE_UPDATE', resourceType: 'role', resourceId: 3, result: 'SUCCESS', reason: 'Promotion Manager', traceId: 'trace-014', metadataSafe: { targetUser: 'Hugo Mercier', oldRole: 'Éditeur', newRole: 'Manager' } },
  { id: 'audit-005', timestamp: '2026-09-08T09:15:00Z', actorType: 'USER', actorId: 1, tenantId: 1, applicationId: 'iam-console', action: 'TENANT_CREATE', resourceType: 'tenant', resourceId: 8, result: 'SUCCESS', reason: 'Nouveau tenant', traceId: 'trace-015', metadataSafe: { tenantName: 'Boutique D - Paris' } },
  { id: 'audit-006', timestamp: '2026-09-08T08:50:00Z', actorType: 'USER', actorId: 2, tenantId: 2, applicationId: 'iam-console', action: 'SESSION_REVOKE', resourceType: 'session', resourceId: 7, result: 'SUCCESS', reason: 'ADMIN_REVOKE', traceId: 'trace-016', metadataSafe: { userId: 5, device: 'iPad' } },
  { id: 'audit-007', timestamp: '2026-09-07T17:22:00Z', actorType: 'USER', actorId: 1, tenantId: 1, applicationId: 'iam-console', action: 'ORG_ARCHIVE', resourceType: 'organisation', resourceId: 5, result: 'SUCCESS', reason: 'ADMIN_ARCHIVE', traceId: 'trace-017', metadataSafe: { orgName: 'Boutique E' } },
  { id: 'audit-008', timestamp: '2026-09-07T14:40:00Z', actorType: 'USER', actorId: 2, tenantId: 2, applicationId: 'iam-console', action: 'POLICY_CREATE', resourceType: 'policy', resourceId: 4, result: 'SUCCESS', reason: 'Nouvelle politique', traceId: 'trace-018', metadataSafe: { policyName: 'Accès Support Restreint' } },
  { id: 'audit-009', timestamp: '2026-09-07T11:05:00Z', actorType: 'USER', actorId: 1, tenantId: 1, applicationId: 'iam-console', action: 'USER_UPDATE', resourceType: 'user', resourceId: 8, result: 'SUCCESS', reason: 'Update profil', traceId: 'trace-019', metadataSafe: { targetUser: 'Léa Fontaine', fields: ['phone', 'timezone'] } },
  { id: 'audit-010', timestamp: '2026-09-06T09:00:00Z', actorType: 'SYSTEM', actorId: null, tenantId: null, applicationId: 'batch-job', action: 'BATCH_CLEANUP', resourceType: 'session', resourceId: null, result: 'SUCCESS', reason: 'Nettoyage automatique', traceId: 'trace-020', metadataSafe: { expiredCount: 12 } },
];

export const obsAuditFilters = {
  actorTypes: ['USER', 'SYSTEM', 'SERVICE'],
  actions: ['SESSION_REVOKE', 'USER_SUSPEND', 'CONTEXT_RESOLVE', 'ROLE_UPDATE', 'TENANT_CREATE', 'ORG_ARCHIVE', 'POLICY_CREATE', 'USER_UPDATE', 'BATCH_CLEANUP'],
  resourceTypes: ['session', 'user', 'context', 'role', 'tenant', 'organisation', 'policy'],
  results: ['SUCCESS', 'FAILURE', 'PARTIAL'],
};

export const obsSecurityEvents = [
  { id: 'sec-001', timestamp: '2026-09-08T20:32:00Z', eventType: 'AUTH_FAILURE', severity: 'HIGH', tenantId: 1, userId: 2, source: 'api-gateway', resource: '/auth/login', ipSafe: '92.184.102.55', traceId: 'trace-101', status: 'OPEN', detailsSafe: '3 tentatives échouées' },
  { id: 'sec-002', timestamp: '2026-09-08T20:30:00Z', eventType: 'BRUTE_FORCE_DETECTED', severity: 'CRITICAL', tenantId: 3, userId: 9, source: 'api-gateway', resource: '/auth/login', ipSafe: '10.0.0.45', traceId: 'trace-102', status: 'INVESTIGATING', detailsSafe: '15 tentatives en 2 min' },
  { id: 'sec-003', timestamp: '2026-09-08T18:12:00Z', eventType: 'ACCOUNT_LOCKED', severity: 'MEDIUM', tenantId: 2, userId: 10, source: 'auth-service', resource: 'account', ipSafe: '10.0.0.22', traceId: 'trace-103', status: 'OPEN', detailsSafe: 'Compte verrouillé après 5 échecs MFA' },
  { id: 'sec-004', timestamp: '2026-09-08T16:05:00Z', eventType: 'MFA_FAILURE', severity: 'MEDIUM', tenantId: 1, userId: 2, source: 'auth-service', resource: '/auth/mfa', ipSafe: '10.0.0.15', traceId: 'trace-104', status: 'ACKNOWLEDGED', detailsSafe: 'Code MFA incorrect' },
  { id: 'sec-005', timestamp: '2026-09-08T14:30:00Z', eventType: 'PERMISSION_DENIED', severity: 'LOW', tenantId: 1, userId: 5, source: 'policy-engine', resource: '/admin/settings', ipSafe: '192.168.1.50', traceId: 'trace-105', status: 'RESOLVED', detailsSafe: 'Accès refusé: Viewer ne peut pas accéder à /admin/settings' },
  { id: 'sec-006', timestamp: '2026-09-08T12:00:00Z', eventType: 'TENANT_VIOLATION', severity: 'HIGH', tenantId: 1, userId: 1, source: 'context-engine', resource: 'tenant-switch', ipSafe: '192.168.1.42', traceId: 'trace-106', status: 'RESOLVED', detailsSafe: 'Tentative d\'accès cross-tenant bloquée' },
  { id: 'sec-007', timestamp: '2026-09-08T10:00:00Z', eventType: 'SUSPICIOUS_SESSION', severity: 'HIGH', tenantId: 1, userId: 3, source: 'session-service', resource: 'session', ipSafe: '10.0.0.31', traceId: 'trace-107', status: 'ACKNOWLEDGED', detailsSafe: 'Nouvelle localisation: Berlin, DE' },
  { id: 'sec-008', timestamp: '2026-09-08T08:00:00Z', eventType: 'TOKEN_REJECTED', severity: 'MEDIUM', tenantId: 2, userId: null, source: 'api-gateway', resource: '/api/iam/*', ipSafe: '10.0.0.45', traceId: 'trace-108', status: 'RESOLVED', detailsSafe: 'Refresh token réutilisé' },
  { id: 'sec-009', timestamp: '2026-09-07T22:00:00Z', eventType: 'RATE_LIMIT_TRIGGERED', severity: 'LOW', tenantId: 3, userId: 9, source: 'api-gateway', resource: '/api/iam/users', ipSafe: '10.0.0.45', traceId: 'trace-109', status: 'RESOLVED', detailsSafe: '100 requêtes/min atteintes' },
  { id: 'sec-010', timestamp: '2026-09-07T18:00:00Z', eventType: 'WEBHOOK_SIGNATURE_FAILURE', severity: 'MEDIUM', tenantId: 1, userId: null, source: 'erp-adapter', resource: '/webhooks/dolibarr', ipSafe: null, traceId: 'trace-110', status: 'OPEN', detailsSafe: 'Signature HMAC invalide' },
  { id: 'sec-011', timestamp: '2026-09-07T15:00:00Z', eventType: 'CREDENTIAL_FAILURE', severity: 'HIGH', tenantId: 1, userId: 11, source: 'auth-service', resource: '/auth/login', ipSafe: '10.0.0.18', traceId: 'trace-111', status: 'RESOLVED', detailsSafe: 'Mot de passe incorrect (5 tentatives)' },
  { id: 'sec-012', timestamp: '2026-09-07T12:00:00Z', eventType: 'ADMIN_SENSITIVE_ACTION', severity: 'INFO', tenantId: 1, userId: 1, source: 'iam-console', resource: '/admin/orgs/5/archive', ipSafe: '192.168.1.42', traceId: 'trace-112', status: 'RESOLVED', detailsSafe: 'Organisation Boutique E archivée' },
];

export const obsSecurityEventTypes = [
  'AUTH_FAILURE', 'BRUTE_FORCE_DETECTED', 'ACCOUNT_LOCKED', 'MFA_FAILURE',
  'PERMISSION_DENIED', 'TENANT_VIOLATION', 'SUSPICIOUS_SESSION', 'TOKEN_REJECTED',
  'RATE_LIMIT_TRIGGERED', 'WEBHOOK_SIGNATURE_FAILURE', 'CREDENTIAL_FAILURE', 'ADMIN_SENSITIVE_ACTION',
];

export const obsSecuritySeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
export const obsSecurityStatuses = ['OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'];

export const obsSecurityEventsPageMock = {
  events: obsSecurityEvents,
  totalCount: obsSecurityEvents.length,
};

export const obsMonitoring = {
  services: [
    { service: 'api-gateway', component: 'router', status: 'DEGRADED', checkedAt: '2026-09-08T20:30:00Z', latency: 230, dependencies: ['auth-service', 'identity-service', 'session-service'], detailsSafe: 'Latence élevée sur /users', availability: 99.2, errorRate: 1.3, requestCount: 45200, timeoutCount: 12, queueBacklog: 5, cacheHitRate: 94 },
    { service: 'auth-service', component: 'login', status: 'HEALTHY', checkedAt: '2026-09-08T20:30:00Z', latency: 45, dependencies: ['database', 'redis'], detailsSafe: 'Opérationnel', availability: 99.9, errorRate: 0.1, requestCount: 12800, timeoutCount: 0, queueBacklog: 0, cacheHitRate: 98 },
    { service: 'identity-service', component: 'user', status: 'HEALTHY', checkedAt: '2026-09-08T20:30:00Z', latency: 62, dependencies: ['database', 'cache'], detailsSafe: 'Opérationnel', availability: 99.8, errorRate: 0.2, requestCount: 22100, timeoutCount: 1, queueBacklog: 0, cacheHitRate: 96 },
    { service: 'session-service', component: 'validator', status: 'HEALTHY', checkedAt: '2026-09-08T20:30:00Z', latency: 38, dependencies: ['database', 'redis'], detailsSafe: 'Opérationnel', availability: 99.9, errorRate: 0.05, requestCount: 31500, timeoutCount: 0, queueBacklog: 0, cacheHitRate: 99 },
    { service: 'context-engine', component: 'resolver', status: 'WARNING', checkedAt: '2026-09-08T20:30:00Z', latency: 180, dependencies: ['database', 'policy-engine'], detailsSafe: 'Résolution contexte lente', availability: 98.5, errorRate: 0.8, requestCount: 8900, timeoutCount: 3, queueBacklog: 2, cacheHitRate: 88 },
    { service: 'policy-engine', component: 'evaluator', status: 'HEALTHY', checkedAt: '2026-09-08T20:30:00Z', latency: 25, dependencies: ['database'], detailsSafe: 'Opérationnel', availability: 100, errorRate: 0, requestCount: 56000, timeoutCount: 0, queueBacklog: 0, cacheHitRate: 100 },
  ],
  periods: {
    '1h': { requestCount: 12400, errorRate: 0.4, latency: 85, timeoutCount: 2 },
    '24h': { requestCount: 89200, errorRate: 0.6, latency: 72, timeoutCount: 8 },
    '7d': { requestCount: 624000, errorRate: 0.5, latency: 68, timeoutCount: 45 },
    '30d': { requestCount: 2680000, errorRate: 0.4, latency: 65, timeoutCount: 180 },
  },
};

export const obsHealthStatuses = ['HEALTHY', 'DEGRADED', 'UNHEALTHY', 'UNKNOWN'];

export const obsMonitoringPageMock = {
  services: obsMonitoring.services,
  periods: obsMonitoring.periods,
  healthStatuses: obsHealthStatuses,
};

export const obsAlertRules = [
  { id: 'rule-001', code: 'ALERT-HIGH-LATENCY', sourceType: 'METRIC', condition: 'latency > 2000ms', severity: 'HIGH', window: '5m', threshold: 2000, cooldown: '10m', scope: 'api-gateway', enabled: true, notificationPolicyRef: 'np-001' },
  { id: 'rule-002', code: 'ALERT-AUTH-FAILURES', sourceType: 'LOG_PATTERN', condition: 'count(auth_failure) > 10', severity: 'CRITICAL', window: '2m', threshold: 10, cooldown: '5m', scope: 'global', enabled: true, notificationPolicyRef: 'np-001' },
  { id: 'rule-003', code: 'ALERT-SESSION-ANOMALY', sourceType: 'SECURITY_EVENT', condition: 'suspicious_session == true', severity: 'HIGH', window: '1m', threshold: 1, cooldown: '15m', scope: 'global', enabled: true, notificationPolicyRef: 'np-002' },
  { id: 'rule-004', code: 'ALERT-ERROR-RATE', sourceType: 'ERROR_RATE', condition: 'error_rate > 1%', severity: 'MEDIUM', window: '5m', threshold: 1, cooldown: '10m', scope: 'api-gateway', enabled: true, notificationPolicyRef: 'np-001' },
  { id: 'rule-005', code: 'ALERT-TIMEOUT-RATE', sourceType: 'TIMEOUT_RATE', condition: 'timeout_count > 5', severity: 'MEDIUM', window: '5m', threshold: 5, cooldown: '10m', scope: 'api-gateway', enabled: false, notificationPolicyRef: 'np-001' },
  { id: 'rule-006', code: 'ALERT-CUSTOM-SIGNAL', sourceType: 'CUSTOM_REGISTERED_SIGNAL', condition: 'custom_signal == true', severity: 'LOW', window: '1h', threshold: 1, cooldown: '1h', scope: 'tenant:Boutique A', enabled: true, notificationPolicyRef: 'np-003' },
];

export const obsAlertInstances = [
  { id: 'alert-001', ruleId: 'rule-001', code: 'ALERT-HIGH-LATENCY', sourceType: 'METRIC', severity: 'HIGH', status: 'OPEN', condition: 'latency > 2000ms', currentValue: '2300ms', threshold: '2000ms', window: '5m', scope: 'api-gateway', triggeredAt: '2026-09-08T20:30:00Z', acknowledgedAt: null, resolvedAt: null },
  { id: 'alert-002', ruleId: 'rule-002', code: 'ALERT-AUTH-FAILURES', sourceType: 'LOG_PATTERN', severity: 'CRITICAL', status: 'ACKNOWLEDGED', condition: 'count(auth_failure) > 10', currentValue: '15', threshold: '10', window: '2m', scope: 'global', triggeredAt: '2026-09-08T20:01:00Z', acknowledgedAt: '2026-09-08T20:05:00Z', resolvedAt: null },
  { id: 'alert-003', ruleId: 'rule-003', code: 'ALERT-SESSION-ANOMALY', sourceType: 'SECURITY_EVENT', severity: 'HIGH', status: 'OPEN', condition: 'suspicious_session == true', currentValue: '1', threshold: '1', window: '1m', scope: 'global', triggeredAt: '2026-09-08T18:48:00Z', acknowledgedAt: null, resolvedAt: null },
  { id: 'alert-004', ruleId: 'rule-004', code: 'ALERT-ERROR-RATE', sourceType: 'ERROR_RATE', severity: 'MEDIUM', status: 'RESOLVED', condition: 'error_rate > 1%', currentValue: '0.6%', threshold: '1%', window: '5m', scope: 'api-gateway', triggeredAt: '2026-09-08T14:00:00Z', acknowledgedAt: '2026-09-08T14:10:00Z', resolvedAt: '2026-09-08T14:25:00Z' },
  { id: 'alert-005', ruleId: 'rule-005', code: 'ALERT-TIMEOUT-RATE', sourceType: 'TIMEOUT_RATE', severity: 'MEDIUM', status: 'SUPPRESSED', condition: 'timeout_count > 5', currentValue: '0', threshold: '5', window: '5m', scope: 'api-gateway', triggeredAt: '2026-09-08T10:00:00Z', acknowledgedAt: null, resolvedAt: null },
  { id: 'alert-006', ruleId: 'rule-006', code: 'ALERT-CUSTOM-SIGNAL', sourceType: 'CUSTOM_REGISTERED_SIGNAL', severity: 'LOW', status: 'OPEN', condition: 'custom_signal == true', currentValue: '1', threshold: '1', window: '1h', scope: 'tenant:Boutique A', triggeredAt: '2026-09-08T16:00:00Z', acknowledgedAt: null, resolvedAt: null },
];

export const obsAlertStatuses = ['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'SUPPRESSED'];
export const obsAlertSources = ['METRIC', 'HEALTH', 'LOG_PATTERN', 'SECURITY_EVENT', 'ERROR_RATE', 'TIMEOUT_RATE', 'CUSTOM_REGISTERED_SIGNAL'];

export const obsAlertManagerPageMock = {
  rules: obsAlertRules,
  instances: obsAlertInstances,
};

export const obsCockpitMock = {
  overview: {
    totalUsers: 132,
    activeUsers: 98,
    activeSessions: 15,
    securityEventsOpen: 4,
    criticalAlerts: 1,
    requests24h: 89200,
    errorRate24h: 0.6,
    avgLatency: 68,
  },
  recentLogs: obsLogs.slice(0, 5),
  recentSecurityEvents: obsSecurityEvents.slice(0, 5),
  recentAudit: obsAuditLogs.slice(0, 5),
  activeAlerts: obsAlertInstances.filter((a) => a.status === 'OPEN' || a.status === 'ACKNOWLEDGED'),
  monitoringServices: obsMonitoring.services,
};
