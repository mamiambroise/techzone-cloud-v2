import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.ts';

const url = process.env.TEST_DATABASE_URL;
if (!url || !/test|e2e/i.test(new URL(url).pathname)) throw new Error('TEST_DATABASE_URL must target an isolated test database.');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }, { schema: new URL(url).searchParams.get('schema') ?? 'public' }) });
const suffix = randomUUID();
let rule; let alert; let incident; let route; let policy; let telemetryLog; let telemetryMetric; let telemetryTenantA; let telemetryTenantB;

try {
  await prisma.$connect();
  await prisma.$transaction(async (tx) => {
    rule = await tx.observabilityAlertRule.create({ data: { code: `OBS_TEST_${suffix}`, name: 'Persistence test', severity: 'HIGH', condition: { source: 'METRIC', metric: 'techzone_api_requests_total', operator: 'GTE', threshold: 1 } } });
    alert = await tx.observabilityAlert.create({ data: { ruleId: rule.id, scopeKey: 'PLATFORM', fingerprint: `test:${suffix}`, severity: 'HIGH', summary: 'Persistence test alert' } });
    incident = await tx.observabilityIncident.create({ data: { title: 'Persistence test incident', severity: 'HIGH', alerts: { create: { alertId: alert.id } }, timeline: { create: { type: 'CREATED', message: 'Integration test' } } } });
  });
  const reloaded = await prisma.observabilityIncident.findUnique({ where: { id: incident.id }, include: { alerts: true, timeline: true } });
  if (!reloaded || reloaded.alerts.length !== 1 || reloaded.timeline.length !== 1) throw new Error('Persisted incident relation was not reloaded.');
  await prisma.observabilityAlert.update({ where: { id: alert.id }, data: { status: 'ACKNOWLEDGED', acknowledgedAt: new Date() } });
  route = await prisma.observabilityNotificationRoute.create({ data: { name: 'Test route', channel: 'EMAIL', recipients: ['test@example.invalid'] } });
  await prisma.observabilityNotificationAttempt.create({ data: { alertId: alert.id, routeId: route.id, channel: 'EMAIL', recipient: 'test@example.invalid', status: 'SKIPPED', errorCode: 'PROVIDER_NOT_CONFIGURED' } });
  policy = await prisma.observabilityRetentionPolicy.create({ data: { signalType: `TEST_${suffix}`, retentionDays: 1 } });
  await prisma.observabilityRetentionRun.create({ data: { policyId: policy.id, dryRun: true, status: 'COMPLETED', affected: 0 } });
  const page = await prisma.observabilityAlert.findMany({ where: { id: alert.id }, take: 1, skip: 0 });
  const attempts = await prisma.observabilityNotificationAttempt.count({ where: { alertId: alert.id } });
  const runs = await prisma.observabilityRetentionRun.count({ where: { policyId: policy.id } });
  if (page.length !== 1 || page[0].status !== 'ACKNOWLEDGED' || attempts !== 1 || runs !== 1) throw new Error('Alert update/pagination or operational persistence failed.');
  telemetryTenantA = randomUUID(); telemetryTenantB = randomUUID(); const observedAt = new Date();
  telemetryLog = await prisma.observabilityLog.create({ data: { tenantId: telemetryTenantA, traceId: `trace-${suffix}`, requestId: `request-${suffix}`, module: 'iam', service: 'api', severity: 'INFO', category: 'APPLICATION', event: 'test.persisted', message: 'redacted operational event', attributes: { token: '[REDACTED]' }, timestamp: observedAt } });
  await prisma.observabilityLog.create({ data: { tenantId: telemetryTenantB, traceId: `trace-other-${suffix}`, module: 'iam', service: 'api', severity: 'INFO', category: 'APPLICATION', event: 'test.other', message: 'other tenant', timestamp: observedAt } });
  telemetryMetric = await prisma.observabilityMetric.create({ data: { tenantId: telemetryTenantA, name: 'techzone_api_requests_total', type: 'COUNTER', value: 1, labels: { tenantId: telemetryTenantA, module: 'iam' }, timestamp: observedAt } });
  await prisma.observabilityMetric.create({ data: { tenantId: telemetryTenantB, name: 'techzone_api_requests_total', type: 'COUNTER', value: 99, labels: { tenantId: telemetryTenantB, module: 'iam' }, timestamp: observedAt } });
  await prisma.$disconnect(); await prisma.$connect();
  const persistedLogs = await prisma.observabilityLog.findMany({ where: { tenantId: telemetryTenantA, traceId: telemetryLog.traceId }, take: 1, skip: 0 });
  const persistedMetrics = await prisma.observabilityMetric.findMany({ where: { tenantId: telemetryTenantA, name: telemetryMetric.name }, take: 1, skip: 0 });
  if (persistedLogs.length !== 1 || persistedLogs[0].attributes?.token !== '[REDACTED]' || persistedMetrics.length !== 1 || persistedMetrics[0].value !== 1) throw new Error('Durable telemetry write/read, pagination, tenant isolation, or reconnect persistence failed.');
  console.log('Observability PostgreSQL persistence integration: PASS');
} finally {
  if (incident) await prisma.observabilityIncident.delete({ where: { id: incident.id } });
  if (telemetryTenantA || telemetryTenantB) await prisma.observabilityLog.deleteMany({ where: { tenantId: { in: [telemetryTenantA, telemetryTenantB].filter(Boolean) } } });
  if (telemetryTenantA || telemetryTenantB) await prisma.observabilityMetric.deleteMany({ where: { tenantId: { in: [telemetryTenantA, telemetryTenantB].filter(Boolean) } } });
  if (policy) await prisma.observabilityRetentionPolicy.delete({ where: { id: policy.id } });
  if (route) await prisma.observabilityNotificationRoute.delete({ where: { id: route.id } });
  if (alert) await prisma.observabilityAlert.delete({ where: { id: alert.id } });
  if (rule) await prisma.observabilityAlertRule.delete({ where: { id: rule.id } });
  await prisma.$disconnect();
}
