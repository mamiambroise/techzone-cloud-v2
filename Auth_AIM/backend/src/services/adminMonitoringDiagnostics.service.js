const observabilityService = require('./observability.service');

function normalizeStatus(status) {
  const value = String(status || '').toUpperCase();
  if (['HEALTHY', 'WARNING', 'DEGRADED', 'CRITICAL', 'UNKNOWN'].includes(value)) return value;
  if (value === 'UNHEALTHY') return 'CRITICAL';
  return 'UNKNOWN';
}

function buildTraceId(prefix = 'admin-monitoring', tenantId = 'global') {
  return `${prefix}-${String(tenantId || 'global').replace(/[^a-zA-Z0-9_-]/g, '-')}-${Date.now()}`;
}

function summarizeStatus(components = []) {
  const statuses = components.map((component) => normalizeStatus(component.status));
  if (statuses.some((status) => status === 'CRITICAL')) return 'CRITICAL';
  if (statuses.some((status) => status === 'DEGRADED') || statuses.some((status) => status === 'WARNING')) return 'WARNING';
  if (statuses.some((status) => status === 'HEALTHY')) return 'HEALTHY';
  return 'UNKNOWN';
}

function getGlobalHealth({ tenantId } = {}) {
  const safeTenantId = tenantId || 'global';
  const health = observabilityService.getHealth({ tenantId: safeTenantId });
  const dashboard = observabilityService.getDashboard({ tenantId: safeTenantId });

  return {
    tenantId: safeTenantId,
    traceId: buildTraceId('health-overview', safeTenantId),
    checkedAt: new Date().toISOString(),
    status: summarizeStatus(health.components || []),
    overview: {
      serviceCount: (health.components || []).length,
      healthyServices: (health.components || []).filter((item) => normalizeStatus(item.status) === 'HEALTHY').length,
      degradedServices: (health.components || []).filter((item) => ['WARNING', 'DEGRADED'].includes(normalizeStatus(item.status))).length,
      criticalServices: (health.components || []).filter((item) => normalizeStatus(item.status) === 'CRITICAL').length,
    },
    alerts: (dashboard.alerts || []).map((alert) => ({
      id: alert.id,
      title: alert.title,
      severity: alert.severity,
      status: alert.status,
      component: alert.component,
    })),
    summary: dashboard.kpis || {},
  };
}

function getServiceHealth({ tenantId } = {}) {
  const safeTenantId = tenantId || 'global';
  const health = observabilityService.getHealth({ tenantId: safeTenantId });

  return {
    tenantId: safeTenantId,
    traceId: buildTraceId('service-health', safeTenantId),
    checkedAt: new Date().toISOString(),
    components: (health.components || []).map((component) => ({
      service: component.service,
      component: component.component,
      status: normalizeStatus(component.status),
      latency: component.latency,
      dependencies: component.dependencies || [],
      detailsSafe: component.detailsSafe,
    })),
  };
}

function getCriticalErrors({ tenantId } = {}) {
  const safeTenantId = tenantId || 'global';
  const dashboard = observabilityService.getDashboard({ tenantId: safeTenantId });

  return (dashboard.recentErrors || []).filter((error) => ['CRITICAL', 'ERROR'].includes(String(error.severity || '').toUpperCase())).map((error) => ({
    id: error.id,
    service: error.service,
    component: error.component,
    severity: String(error.severity || '').toUpperCase(),
    message: error.message,
    traceId: error.traceId,
    occurredAt: error.occurredAt,
    tenantId: safeTenantId,
  }));
}

function getLatencyOverview({ tenantId } = {}) {
  const safeTenantId = tenantId || 'global';
  const health = observabilityService.getHealth({ tenantId: safeTenantId });
  const metrics = observabilityService.getServiceMetrics({ tenantId: safeTenantId });
  const components = health.components || [];
  const avgLatency = components.length
    ? Math.round(components.reduce((sum, component) => sum + Number(component.latency || 0), 0) / components.length)
    : 0;

  return {
    tenantId: safeTenantId,
    traceId: buildTraceId('latency-overview', safeTenantId),
    checkedAt: new Date().toISOString(),
    overall: avgLatency > 400 ? 'CRITICAL' : avgLatency > 250 ? 'WARNING' : 'HEALTHY',
    averageLatencyMs: avgLatency,
    appLatencyMs: Number(metrics.metrics?.latencyMs || avgLatency),
    services: components.map((component) => ({
      service: component.service,
      component: component.component,
      latencyMs: Number(component.latency || 0),
      status: normalizeStatus(component.status),
    })),
  };
}

function getDegradedDependencies({ tenantId } = {}) {
  const safeTenantId = tenantId || 'global';
  const health = observabilityService.getHealth({ tenantId: safeTenantId });

  return (health.dependencies || []).filter((dependency) => normalizeStatus(dependency.status) !== 'HEALTHY').map((dependency) => ({
    service: dependency.service,
    status: normalizeStatus(dependency.status),
    latencyMs: dependency.latencyMs,
    detailsSafe: dependency.detailsSafe,
    checkedAt: dependency.checkedAt,
  }));
}

function getRecentIncidents({ tenantId } = {}) {
  const safeTenantId = tenantId || 'global';
  const dashboard = observabilityService.getDashboard({ tenantId: safeTenantId });

  const incidents = [
    ...(dashboard.alerts || []).map((alert) => ({
      type: 'ALERT',
      id: alert.id,
      title: alert.title,
      severity: alert.severity,
      status: alert.status,
      component: alert.component,
      createdAt: alert.createdAt,
      traceId: alert.traceId || null,
    })),
    ...(dashboard.recentErrors || []).map((error) => ({
      type: 'ERROR',
      id: error.id,
      title: error.message,
      severity: error.severity,
      status: 'OPEN',
      component: error.component,
      createdAt: error.occurredAt,
      traceId: error.traceId,
    })),
  ].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return incidents.slice(0, 10);
}

function getTraceDiagnostics({ tenantId, traceId } = {}) {
  const safeTenantId = tenantId || 'global';
  const targetTraceId = traceId || 'obs-trace-001';
  const dashboard = observabilityService.getDashboard({ tenantId: safeTenantId });
  const activity = observabilityService.getActivity({ tenantId: safeTenantId });

  const events = [
    ...(dashboard.recentErrors || []),
    ...(dashboard.securityEvents || []),
    ...(dashboard.auditTrail || []),
    ...(activity.items || []),
  ].filter((item) => {
    const candidate = item.traceId || item.id || '';
    return !traceId || candidate === targetTraceId || String(item.traceId || '').includes(targetTraceId) || String(item.id || '').includes(targetTraceId);
  });

  const related = [
    ...new Map(
      (dashboard.alerts || []).map((alert) => [alert.id, { type: 'ALERT', id: alert.id, severity: alert.severity, title: alert.title, traceId: alert.traceId || null }])
    ).values(),
    ...new Map(
      (dashboard.recentErrors || []).map((error) => [error.id, { type: 'ERROR', id: error.id, severity: error.severity, title: error.message, traceId: error.traceId || null }])
    ).values(),
  ];

  return {
    tenantId: safeTenantId,
    traceId: targetTraceId,
    checkedAt: new Date().toISOString(),
    status: events.some((event) => String(event.severity || '').toUpperCase() === 'CRITICAL') ? 'CRITICAL' : events.length ? 'HEALTHY' : 'UNKNOWN',
    events: events.map((event) => ({
      type: event.type || event.source || event.action || 'OBSERVABILITY_EVENT',
      id: event.id,
      traceId: event.traceId || targetTraceId,
      severity: event.severity || event.level || 'INFO',
      occurredAt: event.occurredAt || event.createdAt,
      detailsSafe: event.message || event.action || event.title || 'Event traced without sensitive payload',
    })),
    related: related.slice(0, 10),
  };
}

module.exports = {
  getGlobalHealth,
  getServiceHealth,
  getCriticalErrors,
  getLatencyOverview,
  getDegradedDependencies,
  getRecentIncidents,
  getTraceDiagnostics,
};
