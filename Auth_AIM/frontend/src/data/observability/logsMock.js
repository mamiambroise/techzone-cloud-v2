export const obsLogs = [
  { id: 'log-001', timestamp: '2026-09-08 20:32:00', level: 'ERROR', service: 'api-gateway', component: 'router', message: 'Timeout sur /users après 5000ms', traceId: 'trace-001', requestId: 'req-001', tenantId: 1, userId: 1, environmentId: 'prod', errorCode: 'TIMEOUT', metadataSafe: { method: 'GET', path: '/users', duration: 5234 } },
  { id: 'log-002', timestamp: '2026-09-08 20:31:45', level: 'WARN', service: 'auth-service', component: 'token', message: 'Refresh token réutilisé détecté', traceId: 'trace-002', requestId: 'req-002', tenantId: 1, userId: 1, environmentId: 'prod', errorCode: null, metadataSafe: { action: 'refresh', ip: '192.168.1.42' } },
  { id: 'log-003', timestamp: '2026-09-08 20:30:12', level: 'INFO', service: 'identity-service', component: 'user', message: 'Utilisateur Mami Admin connecté', traceId: 'trace-003', requestId: 'req-003', tenantId: 1, userId: 1, environmentId: 'prod', errorCode: null, metadataSafe: { method: 'POST', path: '/auth/login' } },
  { id: 'log-004', timestamp: '2026-09-08 20:28:55', level: 'ERROR', service: 'session-service', component: 'validator', message: 'Session révoquée lors de la validation', traceId: 'trace-004', requestId: 'req-004', tenantId: 2, userId: 5, environmentId: 'prod', errorCode: 'SESSION_REVOKED', metadataSafe: { sessionId: 8, reason: 'ADMIN_REVOKE' } },
  { id: 'log-005', timestamp: '2026-09-08 20:25:00', level: 'INFO', service: 'context-engine', component: 'resolver', message: 'Contexte résolu pour user #1', traceId: 'trace-005', requestId: 'req-005', tenantId: 1, userId: 1, environmentId: 'prod', errorCode: null, metadataSafe: { contextId: 'ctx-001', state: 'RESOLVED' } },
  { id: 'log-006', timestamp: '2026-09-08 20:20:30', level: 'WARN', service: 'policy-engine', component: 'evaluator', message: 'Policy evaluation lente: 340ms', traceId: 'trace-006', requestId: 'req-006', tenantId: 1, userId: 1, environmentId: 'prod', errorCode: null, metadataSafe: { policyId: 2, duration: 340 } },
  { id: 'log-007', timestamp: '2026-09-08 20:15:00', level: 'ERROR', service: 'api-gateway', component: 'middleware', message: 'Rate limit atteint pour IP 10.0.0.45', traceId: 'trace-007', requestId: 'req-007', tenantId: 3, userId: 9, environmentId: 'prod', errorCode: 'RATE_LIMIT', metadataSafe: { ip: '10.0.0.45', limit: 100, window: '1m' } },
  { id: 'log-008', timestamp: '2026-09-08 20:10:00', level: 'INFO', service: 'erp-adapter', component: 'dolibarr', message: 'Sync ERP terminée: 3 entités mises à jour', traceId: 'trace-008', requestId: 'req-008', tenantId: 1, userId: 1, environmentId: 'prod', errorCode: null, metadataSafe: { entity: 'user', count: 3 } },
  { id: 'log-009', timestamp: '2026-09-08 20:05:00', level: 'WARN', service: 'auth-service', component: 'mfa', message: 'Échec MFA pour user #2 (3 tentatives)', traceId: 'trace-009', requestId: 'req-009', tenantId: 1, userId: 2, environmentId: 'prod', errorCode: 'MFA_FAILURE', metadataSafe: { attempts: 3, method: 'TOTP' } },
  { id: 'log-010', timestamp: '2026-09-08 20:00:00', level: 'INFO', service: 'session-service', component: 'cleaner', message: 'Nettoyage de 2 sessions expirées', traceId: 'trace-010', requestId: 'req-010', tenantId: null, userId: null, environmentId: 'prod', errorCode: null, metadataSafe: { expiredCount: 2 } },
];

export const obsLogFilters = {
  levels: ['ERROR', 'WARN', 'INFO', 'DEBUG'],
  services: ['api-gateway', 'auth-service', 'identity-service', 'session-service', 'context-engine', 'policy-engine', 'erp-adapter'],
  components: ['router', 'token', 'user', 'validator', 'resolver', 'evaluator', 'middleware', 'dolibarr', 'mfa', 'cleaner'],
  environments: ['prod', 'staging', 'dev'],
};
