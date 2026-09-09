export const obsGlobalStatus = {
  platformHealth: { status: 'WARNING', score: 72, label: 'À surveiller', trend: 'down', details: '3 services en latence élevée' },
  securityPosture: { status: 'HIGH_RISK', score: 58, label: 'Risque élevé', trend: 'down', details: '5 comptes sans MFA, 2 sessions suspectes' },
  iamReadiness: { status: 'SECURE', score: 91, label: 'Sécurisé', trend: 'up', details: 'Toutes les policies sont appliquées' },
  contextIntegrity: { status: 'PARTIAL', score: 65, label: 'Partiel', trend: 'flat', details: '1 conflit détecté sur Boutique C' },
};

export const obsCoreMetrics = {
  users: 142,
  identities: 142,
  tenants: 8,
  roles: 8,
  permissions: 12,
  sessions: 37,
  contexts: 4,
};

export const obsAlerts = [
  { id: 'obs-al-001', severity: 'CRITICAL', title: 'Connexion depuis un pays inhabituel', description: 'IP 92.184.102.55 (Moscou, RU) — utilisateur Mami Admin', module: 'Sessions', createdAt: '2026-09-08 19:48', link: '/sessions', status: 'OPEN' },
  { id: 'obs-al-002', severity: 'HIGH', title: '5 comptes sans MFA activée', description: 'Comptes privilégiés sans second facteur — Boutique B, Boutique C', module: 'Identités', createdAt: '2026-09-08 18:12', link: '/identities', status: 'OPEN' },
  { id: 'obs-al-003', severity: 'HIGH', title: 'Conflit de contexte détecté', description: 'Léa Fontaine active sur 2 tenants simultanément', module: 'Contextes', createdAt: '2026-09-08 16:05', link: '/contexts', status: 'ACKNOWLEDGED' },
  { id: 'obs-al-004', severity: 'WARNING', title: 'Latence API > 2s', description: 'Endpoint /users temps de réponse moyen 2.3s sur 5 min', module: 'API', createdAt: '2026-09-08 14:30', link: null, status: 'OPEN' },
  { id: 'obs-al-005', severity: 'WARNING', title: 'Politique MFA non appliquée', description: 'Brouillon MFA obligatoire Super Admin en attente depuis 3 j', module: 'Policies', createdAt: '2026-09-07 11:20', link: '/policies', status: 'INVESTIGATING' },
  { id: 'obs-al-006', severity: 'INFO', title: 'Mise à jour de rôle effectuée', description: 'Hugo Mercier promu Manager sur Boutique A - Paris', module: 'Rôles', createdAt: '2026-09-08 09:15', link: '/roles', status: 'RESOLVED' },
  { id: 'obs-al-007', severity: 'INFO', title: 'Nouveau tenant provisionné', description: 'Boutique D - Paris créé par Mami Admin', module: 'Tenants', createdAt: '2026-09-07 17:45', link: '/tenants', status: 'RESOLVED' },
  { id: 'obs-al-008', severity: 'CRITICAL', title: 'Tentative de brute-force détectée', description: '15 tentatives échouées depuis 10.0.0.45 en 2 min', module: 'Security', createdAt: '2026-09-08 20:01', link: null, status: 'OPEN' },
];

export const obsContextExplorer = {
  user: { id: 1, name: 'Mami Admin' },
  tenant: { id: 1, name: 'Boutique A - Paris' },
  application: 'Boutique Mode & Chaussures',
  pack: 'Premium',
  environment: 'PRODUCTION',
  erp: 'Dolibarr',
  role: 'Super Admin',
  permissions: ['users.read', 'users.write', 'roles.read', 'policies.write'],
  policies: 6,
  contextState: 'RESOLVED',
  contextId: 'ctx-001',
  contextHash: 'a3f9c2',
};

export const obsAccessDecisions = {
  allow: 1284,
  deny: 73,
  last24h: [
    { hour: '00h', allow: 22, deny: 1 }, { hour: '02h', allow: 18, deny: 2 }, { hour: '04h', allow: 12, deny: 0 },
    { hour: '06h', allow: 35, deny: 3 }, { hour: '08h', allow: 124, deny: 6 }, { hour: '10h', allow: 198, deny: 9 },
    { hour: '12h', allow: 156, deny: 7 }, { hour: '14h', allow: 187, deny: 11 }, { hour: '16h', allow: 165, deny: 8 },
    { hour: '18h', allow: 142, deny: 9 }, { hour: '20h', allow: 121, deny: 7 }, { hour: '22h', allow: 104, deny: 10 },
  ],
};

export const obsCoverage = {
  percent: 86,
  coveredModules: ['Utilisateurs', 'Identités', 'Organisations', 'Tenants', 'Sessions', 'Rôles'],
  uncoveredModules: ['Policies', 'Audit'],
};

export const obsPrivilegedAccounts = [
  { userId: 1, name: 'Mami Admin', role: 'Super Admin', lastActivity: '2026-09-08 20:25' },
  { userId: 2, name: 'Sophie Martin', role: 'Admin', lastActivity: '2026-09-08 18:42' },
  { userId: 3, name: 'Thomas Bernard', role: 'Manager', lastActivity: '2026-09-08 16:10' },
  { userId: 9, name: 'Hugo Mercier', role: 'Manager', lastActivity: '2026-09-08 14:00' },
];

export const obsSensitiveChanges = [
  { id: 'obs-sc-01', actor: 'Mami Admin', action: 'a modifié le rôle de', target: 'Hugo Mercier → Manager', timestamp: '2026-09-08 09:15', before: 'Éditeur', after: 'Manager' },
  { id: 'obs-sc-02', actor: 'Sophie Martin', action: 'a révoqué la session de', target: 'Lucas Moreau (iPad)', timestamp: '2026-09-08 08:50', before: 'ACTIVE', after: 'REVOKED' },
  { id: 'obs-sc-03', actor: 'Mami Admin', action: 'a suspendu le compte de', target: 'Inès Blanc', timestamp: '2026-09-07 17:22', before: 'ACTIVE', after: 'SUSPENDED' },
  { id: 'obs-sc-04', actor: 'Mami Admin', action: 'a archivé l\'organisation', target: 'Boutique E (EI)', timestamp: '2026-09-07 11:05', before: 'ACTIVE', after: 'ARCHIVED' },
  { id: 'obs-sc-05', actor: 'Sophie Martin', action: 'a créé la politique', target: 'Accès Support Restreint', timestamp: '2026-09-06 14:40', before: null, after: 'ACTIVE' },
];

export const obsRiskySessions = [
  { sessionId: 5, userId: 3, reason: 'IP inhabituelle', ip: '10.0.0.31', location: 'Berlin, Allemagne', detectedAt: '2026-09-08 20:15' },
  { sessionId: 8, userId: 7, reason: 'Localisation inhabituelle', ip: '10.0.0.72', location: 'Toronto, Canada', detectedAt: '2026-09-08 18:48' },
  { sessionId: 3, userId: 2, reason: 'Plusieurs échecs MFA', ip: '10.0.0.15', location: 'Paris, France', detectedAt: '2026-09-08 12:20' },
];

export const obsConnectionsTrend = [
  12, 15, 10, 8, 14, 18, 22, 25, 20, 18, 15, 12,
  10, 14, 18, 22, 26, 28, 24, 20, 18, 15, 12, 10,
];

export const obsRoleDistribution = [
  { name: 'Super Admin', value: 5, color: '#dc2626' },
  { name: 'Admin', value: 24, color: '#7c3aed' },
  { name: 'Manager', value: 37, color: '#2563eb' },
  { name: 'Éditeur', value: 52, color: '#16a34a' },
  { name: 'Viewer', value: 42, color: '#6b7280' },
  { name: 'Autres', value: 8, color: '#ec4899' },
];

export const obsTenantActivity = [
  { tenantId: 1, tenantName: 'Boutique A - Paris', activityScore: 87, trend: 'up' },
  { tenantId: 2, tenantName: 'Boutique A - Lyon', activityScore: 64, trend: 'up' },
  { tenantId: 3, tenantName: 'Boutique A - Bordeaux', activityScore: 45, trend: 'down' },
  { tenantId: 6, tenantName: 'Boutique C - Montreal', activityScore: 72, trend: 'up' },
  { tenantId: 7, tenantName: 'Boutique C - Toronto', activityScore: 38, trend: 'down' },
  { tenantId: 8, tenantName: 'Boutique D - Paris', activityScore: 12, trend: 'down' },
];

export const obsRecentActivity = [
  { id: 'e1', time: "À l'instant", type: 'success', title: 'Connexion réussie', actor: 'Mami Admin', detail: 'Paris, France · Chrome' },
  { id: 'e2', time: 'Il y a 5 min', type: 'warning', title: 'Mot de passe modifié', actor: 'Sophie Martin', detail: 'Action utilisateur' },
  { id: 'e3', time: 'Il y a 12 min', type: 'error', title: 'Tentative refusée', actor: 'IP 92.184.*.*', detail: 'Ressource protégée · Boutique C' },
  { id: 'e4', time: 'Il y a 24 min', type: 'info', title: 'Rôle attribué', actor: 'Hugo Mercier → Manager', detail: 'Boutique A' },
  { id: 'e5', time: 'Il y a 1 h', type: 'success', title: 'Identité liée à ERP', actor: 'Dolibarr PROD', detail: 'Claire Moreau' },
  { id: 'e6', time: 'Hier', type: 'info', title: 'Connexion API', actor: 'Service Bot', detail: 'Token utilisé' },
];

export const obsComponentHealth = [
  { componentId: 'api-gateway', name: 'API Gateway', status: 'DEGRADED', latency: 230, dependencies: ['auth', 'identity', 'session'], checkedAt: '2026-09-08 20:30:00Z', details: 'Latence élevée sur /users' },
  { componentId: 'auth-service', name: 'Auth Service', status: 'HEALTHY', latency: 45, dependencies: ['database'], checkedAt: '2026-09-08 20:30:00Z', details: 'Opérationnel' },
  { componentId: 'identity-service', name: 'Identity Service', status: 'HEALTHY', latency: 62, dependencies: ['database', 'cache'], checkedAt: '2026-09-08 20:30:00Z', details: 'Opérationnel' },
  { componentId: 'session-service', name: 'Session Service', status: 'HEALTHY', latency: 38, dependencies: ['database', 'redis'], checkedAt: '2026-09-08 20:30:00Z', details: 'Opérationnel' },
  { componentId: 'context-engine', name: 'Context Engine', status: 'WARNING', latency: 180, dependencies: ['database', 'policy'], checkedAt: '2026-09-08 20:30:00Z', details: 'Résolution contexte lente' },
  { componentId: 'policy-engine', name: 'Policy Engine', status: 'HEALTHY', latency: 25, dependencies: ['database'], checkedAt: '2026-09-08 20:30:00Z', details: 'Opérationnel' },
];

export const obsModeData = {
  STANDARD: {
    sections: ['globalStatus', 'coreMetrics', 'alerts', 'contextExplorer', 'accessDecisions', 'activityTrends'],
  },
  EXPERT: {
    sections: ['globalStatus', 'coreMetrics', 'alerts', 'componentHealth', 'contextExplorer', 'accessDecisions', 'activityTrends'],
    extras: ['componentId', 'contractVersion', 'contextId', 'contextHash', 'latency', 'eventCount', 'cacheState', 'policyCount', 'snapshotId'],
  },
  DIAGNOSTIC: {
    sections: ['globalStatus', 'coreMetrics', 'alerts', 'componentHealth', 'contextExplorer', 'accessDecisions', 'activityTrends', 'diagnostics'],
    extras: ['traceId', 'errorCodes', 'failedChecks', 'sessionAnomalies', 'contextConflicts', 'ERPLinkFailures', 'dependencyFailures'],
  },
};

export const obsDiagnostics = {
  traceId: 'trace-obs-2026-09-08-001',
  errorCodes: ['DB_TIMEOUT', 'CACHE_MISS', 'RATE_LIMIT'],
  failedChecks: 2,
  sessionAnomalies: 1,
  contextConflicts: 1,
  ERPLinkFailures: 0,
  dependencyFailures: 1,
};

export const obsRefreshInterval = {
  MANUAL: 0,
  '30s': 30000,
  '1m': 60000,
  '5m': 300000,
  OFF: 0,
};
