export const obsSecurityEvents = [
  { id: 'sec-001', timestamp: '2026-09-08 20:32:00', eventType: 'AUTH_FAILURE', severity: 'HIGH', tenantId: 1, userId: 2, source: 'api-gateway', resource: '/auth/login', ipSafe: '92.184.102.55', traceId: 'trace-101', status: 'OPEN', detailsSafe: '3 tentatives échouées' },
  { id: 'sec-002', timestamp: '2026-09-08 20:30:00', eventType: 'BRUTE_FORCE_DETECTED', severity: 'CRITICAL', tenantId: 3, userId: 9, source: 'api-gateway', resource: '/auth/login', ipSafe: '10.0.0.45', traceId: 'trace-102', status: 'INVESTIGATING', detailsSafe: '15 tentatives en 2 min' },
  { id: 'sec-003', timestamp: '2026-09-08 18:12:00', eventType: 'ACCOUNT_LOCKED', severity: 'MEDIUM', tenantId: 2, userId: 10, source: 'auth-service', resource: 'account', ipSafe: '10.0.0.22', traceId: 'trace-103', status: 'OPEN', detailsSafe: 'Compte verrouillé après 5 échecs MFA' },
  { id: 'sec-004', timestamp: '2026-09-08 16:05:00', eventType: 'MFA_FAILURE', severity: 'MEDIUM', tenantId: 1, userId: 2, source: 'auth-service', resource: '/auth/mfa', ipSafe: '10.0.0.15', traceId: 'trace-104', status: 'ACKNOWLEDGED', detailsSafe: 'Code MFA incorrect' },
  { id: 'sec-005', timestamp: '2026-09-08 14:30:00', eventType: 'PERMISSION_DENIED', severity: 'LOW', tenantId: 1, userId: 5, source: 'policy-engine', resource: '/admin/settings', ipSafe: '192.168.1.50', traceId: 'trace-105', status: 'RESOLVED', detailsSafe: 'Accès refusé: Viewer ne peut pas accéder à /admin/settings' },
  { id: 'sec-006', timestamp: '2026-09-08 12:00:00', eventType: 'TENANT_VIOLATION', severity: 'HIGH', tenantId: 1, userId: 1, source: 'context-engine', resource: 'tenant-switch', ipSafe: '192.168.1.42', traceId: 'trace-106', status: 'RESOLVED', detailsSafe: 'Tentative d\'accès cross-tenant bloquée' },
  { id: 'sec-007', timestamp: '2026-09-08 10:00:00', eventType: 'SUSPICIOUS_SESSION', severity: 'HIGH', tenantId: 1, userId: 3, source: 'session-service', resource: 'session', ipSafe: '10.0.0.31', traceId: 'trace-107', status: 'ACKNOWLEDGED', detailsSafe: 'Nouvelle localisation: Berlin, DE' },
  { id: 'sec-008', timestamp: '2026-09-08 08:00:00', eventType: 'TOKEN_REJECTED', severity: 'MEDIUM', tenantId: 2, userId: null, source: 'api-gateway', resource: '/api/iam/*', ipSafe: '10.0.0.45', traceId: 'trace-108', status: 'RESOLVED', detailsSafe: 'Refresh token réutilisé' },
  { id: 'sec-009', timestamp: '2026-09-07 22:00:00', eventType: 'RATE_LIMIT_TRIGGERED', severity: 'LOW', tenantId: 3, userId: 9, source: 'api-gateway', resource: '/api/iam/users', ipSafe: '10.0.0.45', traceId: 'trace-109', status: 'RESOLVED', detailsSafe: '100 requêtes/min atteintes' },
  { id: 'sec-010', timestamp: '2026-09-07 18:00:00', eventType: 'WEBHOOK_SIGNATURE_FAILURE', severity: 'MEDIUM', tenantId: 1, userId: null, source: 'erp-adapter', resource: '/webhooks/dolibarr', ipSafe: null, traceId: 'trace-110', status: 'OPEN', detailsSafe: 'Signature HMAC invalide' },
  { id: 'sec-011', timestamp: '2026-09-07 15:00:00', eventType: 'CREDENTIAL_FAILURE', severity: 'HIGH', tenantId: 1, userId: 11, source: 'auth-service', resource: '/auth/login', ipSafe: '10.0.0.18', traceId: 'trace-111', status: 'RESOLVED', detailsSafe: 'Mot de passe incorrect (5 tentatives)' },
  { id: 'sec-012', timestamp: '2026-09-07 12:00:00', eventType: 'ADMIN_SENSITIVE_ACTION', severity: 'INFO', tenantId: 1, userId: 1, source: 'iam-console', resource: '/admin/orgs/5/archive', ipSafe: '192.168.1.42', traceId: 'trace-112', status: 'RESOLVED', detailsSafe: 'Organisation Boutique E archivée' },
];

export const obsSecurityEventTypes = [
  'AUTH_FAILURE', 'BRUTE_FORCE_DETECTED', 'ACCOUNT_LOCKED', 'MFA_FAILURE',
  'PERMISSION_DENIED', 'TENANT_VIOLATION', 'SUSPICIOUS_SESSION', 'TOKEN_REJECTED',
  'RATE_LIMIT_TRIGGERED', 'WEBHOOK_SIGNATURE_FAILURE', 'CREDENTIAL_FAILURE', 'ADMIN_SENSITIVE_ACTION'
];

export const obsSecuritySeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
export const obsSecurityStatuses = ['OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'];
