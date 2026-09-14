const test = require('node:test');
const assert = require('node:assert/strict');

const adminMonitoringDiagnosticsService = require('../src/services/adminMonitoringDiagnostics.service');

const TENANT_ID = 'dcc6d339-bf1f-4855-8888-c9d592a81753';

test('admin monitoring diagnostics exposes consolidated health and trace-level diagnostics without raw log access', async () => {
  const health = await adminMonitoringDiagnosticsService.getGlobalHealth({ tenantId: TENANT_ID });
  const serviceHealth = await adminMonitoringDiagnosticsService.getServiceHealth({ tenantId: TENANT_ID });
  const criticalErrors = await adminMonitoringDiagnosticsService.getCriticalErrors({ tenantId: TENANT_ID });
  const latency = await adminMonitoringDiagnosticsService.getLatencyOverview({ tenantId: TENANT_ID });
  const degraded = await adminMonitoringDiagnosticsService.getDegradedDependencies({ tenantId: TENANT_ID });
  const incidents = await adminMonitoringDiagnosticsService.getRecentIncidents({ tenantId: TENANT_ID });
  const diagnostics = await adminMonitoringDiagnosticsService.getTraceDiagnostics({ tenantId: TENANT_ID, traceId: 'obs-trace-001' });

  assert.ok(health);
  assert.ok(Array.isArray(serviceHealth.components));
  assert.ok(Array.isArray(criticalErrors));
  assert.ok(Array.isArray(degraded));
  assert.ok(Array.isArray(incidents));
  assert.ok(latency && typeof latency.overall === 'string');
  assert.ok(Array.isArray(diagnostics.events) || Array.isArray(diagnostics.related));
  assert.ok(JSON.stringify(health).includes('HEALTHY') || JSON.stringify(health).includes('WARNING') || JSON.stringify(health).includes('CRITICAL') || JSON.stringify(health).includes('DEGRADED'));
  assert.ok(!JSON.stringify(health).includes('password') && !JSON.stringify(health).includes('secret'));
});
