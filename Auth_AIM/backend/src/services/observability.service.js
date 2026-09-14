function buildTraceId(prefix = 'obs', tenantId = 'global') {
  return `${prefix}-${(tenantId || 'global').replace(/[^a-zA-Z0-9_-]/g, '-')}-${Date.now()}`;
}

function normalizeTenantId(tenantId) {
  return tenantId || 'global';
}

function normalizeHealthStatus(status) {
  const value = String(status || '').toUpperCase();
  return ['HEALTHY', 'DEGRADED', 'UNHEALTHY', 'UNKNOWN'].includes(value) ? value : 'UNKNOWN';
}

function buildServiceStatus(tenantId) {
  return [
    {
      name: 'Auth API',
      component: 'auth-service',
      status: 'HEALTHY',
      severity: 'INFO',
      uptime: 99.92,
      latencyMs: 142,
      tenantId,
      dependencies: ['database', 'token-provider'],
      detailsSafe: 'No critical degradation detected.',
      checkedAt: new Date().toISOString(),
    },
    {
      name: 'Identity Provider',
      component: 'identity-provider',
      status: 'DEGRADED',
      severity: 'WARNING',
      uptime: 98.7,
      latencyMs: 240,
      tenantId,
      dependencies: ['database', 'credential-store'],
      detailsSafe: 'Credential lookup latency elevated.',
      checkedAt: new Date().toISOString(),
    },
    {
      name: 'Context Resolver',
      component: 'context-resolver',
      status: 'DEGRADED',
      severity: 'WARNING',
      uptime: 97.8,
      latencyMs: 380,
      tenantId,
      dependencies: ['identity-provider', 'policy-engine'],
      detailsSafe: 'Context resolution delayed for some requests.',
      checkedAt: new Date().toISOString(),
    },
    {
      name: 'Security Event Stream',
      component: 'security-event-stream',
      status: 'UNHEALTHY',
      severity: 'CRITICAL',
      uptime: 96.2,
      latencyMs: 620,
      tenantId,
      dependencies: ['database', 'event-bus'],
      detailsSafe: 'Event stream backlog above target threshold.',
      checkedAt: new Date().toISOString(),
    },
  ].map((item) => ({ ...item, status: normalizeHealthStatus(item.status) }));
}

function buildRecentErrors(tenantId) {
  return [
    {
      id: 'ERR-101',
      service: 'Auth API',
      component: 'auth-service',
      severity: 'ERROR',
      message: 'MFA verification timeout',
      traceId: buildTraceId('err', tenantId),
      occurredAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      tenantId,
    },
    {
      id: 'ERR-102',
      service: 'Context Resolver',
      component: 'context-resolver',
      severity: 'CRITICAL',
      message: 'Tenant context resolution failed for a batch request',
      traceId: buildTraceId('err', tenantId),
      occurredAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      tenantId,
    },
  ];
}

function buildSecurityEvents(tenantId) {
  return [
    {
      id: 'SEC-301',
      type: 'LOGIN_FAILURE',
      severity: 'HIGH',
      source: 'auth-service',
      userId: 'user-42',
      tenantId,
      traceId: buildTraceId('sec', tenantId),
      occurredAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      status: 'OPEN',
    },
    {
      id: 'SEC-302',
      type: 'ACCOUNT_LOCKED',
      severity: 'CRITICAL',
      source: 'identity-provider',
      userId: 'user-42',
      tenantId,
      traceId: buildTraceId('sec', tenantId),
      occurredAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      status: 'ACKNOWLEDGED',
    },
  ];
}

function buildAuditTrail(tenantId) {
  return [
    {
      id: 'AUD-201',
      actorId: 'admin-7',
      action: 'PASSWORD_RESET',
      targetType: 'USER',
      targetId: 'user-42',
      result: 'SUCCESS',
      tenantId,
      traceId: buildTraceId('aud', tenantId),
      createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    },
    {
      id: 'AUD-202',
      actorId: 'system',
      action: 'ROLE_ASSIGNMENT',
      targetType: 'ROLE',
      targetId: 'ROLE_ADMIN',
      result: 'SUCCESS',
      tenantId,
      traceId: buildTraceId('aud', tenantId),
      createdAt: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
    },
  ];
}

function buildAlertList(tenantId) {
  return [
    {
      id: 'ALT-001',
      title: 'Security event stream delay',
      severity: 'CRITICAL',
      status: 'ACTIVE',
      component: 'security-event-stream',
      tenantId,
      createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    },
    {
      id: 'ALT-002',
      title: 'Identity resolution latency',
      severity: 'WARNING',
      status: 'ACTIVE',
      component: 'context-resolver',
      tenantId,
      createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    },
  ];
}

function getDashboard({ tenantId } = {}) {
  const safeTenantId = normalizeTenantId(tenantId);
  const services = buildServiceStatus(safeTenantId);
  const alerts = buildAlertList(safeTenantId);
  const securityEvents = buildSecurityEvents(safeTenantId);
  const recentErrors = buildRecentErrors(safeTenantId);
  const auditTrail = buildAuditTrail(safeTenantId);
  const healthyCount = services.filter((service) => service.status === 'HEALTHY').length;
  const degradedCount = services.filter((service) => service.status !== 'HEALTHY').length;

  return {
    tenantId: safeTenantId,
    traceId: buildTraceId('dash', safeTenantId),
    generatedAt: new Date().toISOString(),
    kpis: {
      PlatformHealth: 'WARNING',
      ServicesHealthy: healthyCount,
      ServicesDegraded: degradedCount,
      ErrorsToday: recentErrors.length,
      CriticalErrors: recentErrors.filter((error) => error.severity === 'CRITICAL').length,
      SecurityEvents: securityEvents.length,
      CriticalSecurityEvents: securityEvents.filter((event) => event.severity === 'CRITICAL').length,
      ActiveAlerts: alerts.filter((alert) => alert.status === 'ACTIVE').length,
      UnresolvedAlerts: alerts.length,
    },
    services,
    alerts,
    recentErrors,
    securityEvents,
    auditTrail,
  };
}

function buildDependencyHealth(tenantId) {
  return [
    { service: 'database', status: 'HEALTHY', latencyMs: 18, detailsSafe: 'Primary DB healthy.' },
    { service: 'token-provider', status: 'HEALTHY', latencyMs: 26, detailsSafe: 'Token validation healthy.' },
    { service: 'identity-provider', status: 'DEGRADED', latencyMs: 132, detailsSafe: 'Identity checks elevated latency.' },
    { service: 'event-bus', status: 'UNHEALTHY', latencyMs: 420, detailsSafe: 'Backlog over threshold.' },
  ].map((dep) => ({ ...dep, tenantId, checkedAt: new Date().toISOString(), status: normalizeHealthStatus(dep.status) }));
}

function getHealth({ tenantId } = {}) {
  const safeTenantId = normalizeTenantId(tenantId);
  const services = buildServiceStatus(safeTenantId);
  const dependencyHealth = buildDependencyHealth(safeTenantId);
  const status = services.some((service) => service.status === 'UNHEALTHY') ? 'UNHEALTHY' : services.some((service) => service.status === 'DEGRADED') ? 'DEGRADED' : 'HEALTHY';

  return {
    tenantId: safeTenantId,
    traceId: buildTraceId('health', safeTenantId),
    status: normalizeHealthStatus(status),
    checkedAt: new Date().toISOString(),
    components: services.map((service) => ({
      service: service.name,
      component: service.component,
      status: service.status,
      checkedAt: service.checkedAt,
      latency: service.latencyMs,
      dependencies: service.dependencies,
      detailsSafe: service.detailsSafe,
    })),
    dependencies: dependencyHealth,
  };
}

function getComponentHealth({ tenantId } = {}) {
  const safeTenantId = normalizeTenantId(tenantId);
  const services = buildServiceStatus(safeTenantId);

  return {
    tenantId: safeTenantId,
    traceId: buildTraceId('component-health', safeTenantId),
    checkedAt: new Date().toISOString(),
    components: services.map((service) => ({
      service: service.name,
      component: service.component,
      status: service.status,
      checkedAt: service.checkedAt,
      latency: service.latencyMs,
      dependencies: service.dependencies,
      detailsSafe: service.detailsSafe,
    })),
  };
}

function getServiceMetrics({ tenantId } = {}) {
  const safeTenantId = normalizeTenantId(tenantId);
  const dimensions = ['tenant', 'service', 'component', 'environment'];
  const metrics = {
    requestCount: 18420,
    errorRate: 2.4,
    latencyMs: 221,
    timeoutCount: 15,
    availability: 99.15,
    queueDepth: 47,
    cacheHitRate: 91.3,
    dbHealth: 'HEALTHY',
  };

  return {
    tenantId: safeTenantId,
    traceId: buildTraceId('metrics', safeTenantId),
    checkedAt: new Date().toISOString(),
    dimensions,
    metrics,
  };
}

function getActivity({ tenantId } = {}) {
  const safeTenantId = normalizeTenantId(tenantId);
  const dashboard = getDashboard({ tenantId: safeTenantId });

  return {
    tenantId: safeTenantId,
    traceId: buildTraceId('activity', safeTenantId),
    items: [
      ...dashboard.recentErrors.map((item) => ({ ...item, type: 'error' })),
      ...dashboard.securityEvents.map((item) => ({ ...item, type: 'security' })),
      ...dashboard.auditTrail.map((item) => ({ ...item, type: 'audit' })),
    ].sort((a, b) => new Date(b.occurredAt || b.createdAt).getTime() - new Date(a.occurredAt || a.createdAt).getTime()),
  };
}

function getAttention({ tenantId } = {}) {
  const safeTenantId = normalizeTenantId(tenantId);
  const dashboard = getDashboard({ tenantId: safeTenantId });

  return {
    tenantId: safeTenantId,
    traceId: buildTraceId('attention', safeTenantId),
    alerts: dashboard.alerts,
    criticalEvents: dashboard.securityEvents.filter((event) => event.severity === 'CRITICAL'),
    criticalErrors: dashboard.recentErrors.filter((error) => error.severity === 'CRITICAL'),
  };
}

module.exports = {
  getDashboard,
  getHealth,
  getComponentHealth,
  getServiceMetrics,
  getActivity,
  getAttention,
};
