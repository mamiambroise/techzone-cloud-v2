export const obsMonitoring = {
  services: [
    { service: 'api-gateway', component: 'router', status: 'DEGRADED', checkedAt: '2026-09-08 20:30:00Z', latency: 230, dependencies: ['auth-service', 'identity-service', 'session-service'], detailsSafe: 'Latence élevée sur /users', availability: 99.2, errorRate: 1.3, requestCount: 45200, timeoutCount: 12, queueBacklog: 5, cacheHitRate: 94 },
    { service: 'auth-service', component: 'login', status: 'HEALTHY', checkedAt: '2026-09-08 20:30:00Z', latency: 45, dependencies: ['database', 'redis'], detailsSafe: 'Opérationnel', availability: 99.9, errorRate: 0.1, requestCount: 12800, timeoutCount: 0, queueBacklog: 0, cacheHitRate: 98 },
    { service: 'identity-service', component: 'user', status: 'HEALTHY', checkedAt: '2026-09-08 20:30:00Z', latency: 62, dependencies: ['database', 'cache'], detailsSafe: 'Opérationnel', availability: 99.8, errorRate: 0.2, requestCount: 22100, timeoutCount: 1, queueBacklog: 0, cacheHitRate: 96 },
    { service: 'session-service', component: 'validator', status: 'HEALTHY', checkedAt: '2026-09-08 20:30:00Z', latency: 38, dependencies: ['database', 'redis'], detailsSafe: 'Opérationnel', availability: 99.9, errorRate: 0.05, requestCount: 31500, timeoutCount: 0, queueBacklog: 0, cacheHitRate: 99 },
    { service: 'context-engine', component: 'resolver', status: 'WARNING', checkedAt: '2026-09-08 20:30:00Z', latency: 180, dependencies: ['database', 'policy-engine'], detailsSafe: 'Résolution contexte lente', availability: 98.5, errorRate: 0.8, requestCount: 8900, timeoutCount: 3, queueBacklog: 2, cacheHitRate: 88 },
    { service: 'policy-engine', component: 'evaluator', status: 'HEALTHY', checkedAt: '2026-09-08 20:30:00Z', latency: 25, dependencies: ['database'], detailsSafe: 'Opérationnel', availability: 100, errorRate: 0, requestCount: 56000, timeoutCount: 0, queueBacklog: 0, cacheHitRate: 100 },
  ],
  periods: {
    '1h': { requestCount: 12400, errorRate: 0.4, latency: 85, timeoutCount: 2 },
    '24h': { requestCount: 89200, errorRate: 0.6, latency: 72, timeoutCount: 8 },
    '7d': { requestCount: 624000, errorRate: 0.5, latency: 68, timeoutCount: 45 },
    '30d': { requestCount: 2680000, errorRate: 0.4, latency: 65, timeoutCount: 180 },
  },
};

export const obsHealthStatuses = ['HEALTHY', 'DEGRADED', 'UNHEALTHY', 'UNKNOWN'];
