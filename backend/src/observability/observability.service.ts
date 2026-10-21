import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { IamAuthContext } from '../iam/decorators/current-user.decorator';
import { MetricRecorderService } from './metric-recorder.service';
import { RedactionService } from './redaction.service';
import type { LogEvent, ObservabilityHealth } from './observability.contracts';

const MAX_PAGE_SIZE = 100;
const MAX_LOG_RANGE_MS = 31 * 24 * 60 * 60 * 1000;
const ACTIVE_ALERTS = ['OPEN', 'ACKNOWLEDGED'];

@Injectable()
export class ObservabilityService {
  private readonly logs: LogEvent[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: MetricRecorderService,
    private readonly redaction: RedactionService,
  ) {}

  recordHttpRequest(input: { method: string; path: string; statusCode: number; durationMs: number; traceId: string; requestId: string; correlationId?: string; tenantId?: string }) {
    const status = String(input.statusCode);
    const module = input.path.split('/').filter(Boolean)[1] ?? 'api';
    const labels = { module, method: input.method, status, ...(input.tenantId ? { tenantId: input.tenantId } : {}) };
    this.metrics.increment('techzone_api_requests_total', labels);
    this.metrics.observe('techzone_api_request_duration_ms', input.durationMs, labels);
    if (input.statusCode >= 400) this.metrics.increment('techzone_api_errors_total', { module, status, ...(input.tenantId ? { tenantId: input.tenantId } : {}) });
    this.recordLog({
      version: '1.0', timestamp: new Date().toISOString(), traceId: input.traceId, requestId: input.requestId, correlationId: input.correlationId,
      tenantId: input.tenantId, module, service: 'api', operation: `${input.method} ${input.path}`,
      severity: input.statusCode >= 500 ? 'ERROR' : input.statusCode >= 400 ? 'WARNING' : 'INFO',
      status, durationMs: input.durationMs, category: 'APPLICATION', event: 'http.request.completed',
      message: `${input.method} ${input.path} completed with ${input.statusCode}`,
    });
  }

  recordLog(event: LogEvent) {
    const safeEvent = this.redaction.redact(event) as LogEvent;
    this.logs.push(safeEvent);
    if (this.logs.length > 10_000) this.logs.splice(0, this.logs.length - 10_000);
    void this.prisma.observabilityLog.create({ data: { timestamp: new Date(safeEvent.timestamp), tenantId: safeEvent.tenantId ?? null, traceId: safeEvent.traceId, requestId: safeEvent.requestId ?? null, correlationId: safeEvent.correlationId ?? null, module: safeEvent.module, service: safeEvent.service, operation: safeEvent.operation ?? null, severity: safeEvent.severity, status: safeEvent.status ?? null, durationMs: safeEvent.durationMs ?? null, category: safeEvent.category, event: safeEvent.event, message: safeEvent.message, attributes: safeEvent.attributes ?? undefined } }).catch(() => undefined);
  }

  async overview(principal: IamAuthContext) {
    const [health, alerts, incidents, securityEvents, requestMetrics] = await Promise.all([
      this.health(),
      this.listAlerts(principal, {}),
      this.prisma.observabilityIncident.count({ where: this.scope(principal) }),
      this.prisma.securityEvent.count({ where: { ...this.scope(principal), occurredAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
      this.metricPoints(principal, 'techzone_api_requests_total', new Date(Date.now() - 60 * 60 * 1000)),
    ]);
    const durations = (await this.metricPoints(principal, 'techzone_api_request_duration_ms', new Date(Date.now() - 24 * 60 * 60 * 1000))).map((point) => point.value).sort((a, b) => a - b);
    const errors = (await this.metricPoints(principal, 'techzone_api_errors_total', new Date(Date.now() - 24 * 60 * 60 * 1000))).reduce((sum, point) => sum + point.value, 0);
    const requests = requestMetrics.reduce((sum, point) => sum + point.value, 0);
    return {
      health,
      kpis: {
        healthyServices: health.filter((entry) => entry.status === 'HEALTHY').length,
        degradedServices: health.filter((entry) => entry.status === 'DEGRADED' || entry.status === 'UNHEALTHY').length,
        activeAlerts: alerts.items.filter((alert) => ACTIVE_ALERTS.includes(alert.status)).length,
        criticalAlerts: alerts.items.filter((alert) => ACTIVE_ALERTS.includes(alert.status) && alert.severity === 'CRITICAL').length,
        requestsPerMinute: Math.round(requests / 60),
        errorRate: requests ? Number(((errors / requests) * 100).toFixed(2)) : null,
        p95LatencyMs: durations.length ? durations[Math.min(durations.length - 1, Math.floor(durations.length * 0.95))] : null,
        openIncidents: incidents,
        securityEvents24h: securityEvents,
      },
    };
  }

  async health() {
    const checkedAt = new Date().toISOString();
    let database: ObservabilityHealth = 'HEALTHY';
    let databaseMessage = 'Database query succeeded';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'UNHEALTHY';
      databaseMessage = 'Database is unavailable';
    }
    const services = await this.prisma.platformService.findMany({ orderBy: { code: 'asc' } }).catch(() => []);
    return [
      { module: 'platform', service: 'api', status: 'HEALTHY' as const, readiness: 'READY', checkedAt, dependencies: ['database'], message: 'Process is accepting requests' },
      { module: 'platform', service: 'database', status: database, readiness: database === 'HEALTHY' ? 'READY' : 'NOT_READY', checkedAt, dependencies: [], message: databaseMessage },
      ...services.map((service) => ({
        module: 'platform', service: service.code, status: this.platformStatus(service.status), readiness: service.status === 'HEALTHY' ? 'READY' : 'NOT_READY',
        checkedAt: service.lastHealthCheckAt?.toISOString() ?? null, dependencies: [], message: service.name,
      })),
    ];
  }

  async searchLogs(principal: IamAuthContext, query: { level?: string; traceId?: string; search?: string; from?: string; to?: string; page?: number; limit?: number }) {
    const page = this.paginate(await this.filteredLogs(principal, query), query);
    return { ...page, items: page.items.map((entry) => ({ ...entry, level: entry.severity, source: entry.service })) };
  }

  /** Request-level summaries from actual correlated log events; not a distributed-span backend. */
  async searchTraces(principal: IamAuthContext, query: { traceId?: string; search?: string; from?: string; to?: string; page?: number; limit?: number }) {
    const summaries = new Map<string, { id: string; traceId: string; timestamp: string; startedAt: string; events: number; errors: number; durationMs: number | null; services: string[]; status: 'OK' | 'ERROR' }>();
    for (const entry of await this.filteredLogs(principal, query)) {
      const current = summaries.get(entry.traceId);
      if (!current) {
        summaries.set(entry.traceId, { id: entry.traceId, traceId: entry.traceId, timestamp: entry.timestamp, startedAt: entry.timestamp, events: 1, errors: entry.severity === 'ERROR' ? 1 : 0, durationMs: entry.durationMs ?? null, services: [entry.service], status: entry.severity === 'ERROR' ? 'ERROR' : 'OK' });
        continue;
      }
      current.events += 1;
      current.errors += entry.severity === 'ERROR' ? 1 : 0;
      current.status = current.errors ? 'ERROR' : 'OK';
      current.startedAt = entry.timestamp < current.startedAt ? entry.timestamp : current.startedAt;
      current.timestamp = entry.timestamp > current.timestamp ? entry.timestamp : current.timestamp;
      current.durationMs = Math.max(current.durationMs ?? 0, entry.durationMs ?? 0) || null;
      if (!current.services.includes(entry.service)) current.services.push(entry.service);
    }
    return this.paginate([...summaries.values()].sort((a, b) => b.timestamp.localeCompare(a.timestamp)), query);
  }

  private async filteredLogs(principal: IamAuthContext, query: { level?: string; traceId?: string; search?: string; from?: string; to?: string }) {
    const from = query.from ? new Date(query.from) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const to = query.to ? new Date(query.to) : new Date();
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to.getTime() - from.getTime() > MAX_LOG_RANGE_MS) throw new Error('OBS_QUERY_RANGE_TOO_LARGE');
    const rows = await this.prisma.observabilityLog.findMany({ where: { timestamp: { gte: from, lte: to }, ...(principal.isSuperAdmin ? {} : { tenantId: principal.tenantId ?? '__no_tenant__' }), ...(query.level ? { severity: query.level } : {}), ...(query.traceId ? { traceId: query.traceId } : {}) }, orderBy: { timestamp: 'desc' }, take: 10_000 }).catch(() => { throw new Error('OBS_SOURCE_UNAVAILABLE'); });
    let items = rows.map((row) => ({ version: '1.0' as const, timestamp: row.timestamp.toISOString(), traceId: row.traceId, requestId: row.requestId ?? undefined, correlationId: row.correlationId ?? undefined, tenantId: row.tenantId ?? undefined, module: row.module, service: row.service, operation: row.operation ?? undefined, severity: row.severity as LogEvent['severity'], status: row.status ?? undefined, durationMs: row.durationMs ?? undefined, category: row.category as LogEvent['category'], event: row.event, message: row.message, attributes: row.attributes as Record<string, unknown> | undefined }));
    if (!principal.isSuperAdmin) items = items.filter((entry) => entry.tenantId === principal.tenantId);
    if (query.search) { const term = query.search.toLowerCase(); items = items.filter((entry) => `${entry.message} ${entry.event}`.toLowerCase().includes(term)); }
    return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  async searchAudit(principal: IamAuthContext, query: { traceId?: string; action?: string; page?: number; limit?: number }) {
    const where: any = this.scope(principal);
    if (query.traceId) where.traceId = query.traceId;
    if (query.action) where.action = { contains: query.action, mode: 'insensitive' };
    const [items, total] = await Promise.all([
      this.prisma.auditEvent.findMany({ where, orderBy: { createdAt: 'desc' }, skip: this.skip(query), take: this.take(query) }),
      this.prisma.auditEvent.count({ where }),
    ]);
    return { items: items.map((event) => ({ ...this.redaction.redact(event), timestamp: event.createdAt })), total, page: this.page(query), limit: this.take(query) };
  }

  async exportData(principal: IamAuthContext, source: string, query: { traceId?: string; action?: string; level?: string; search?: string; from?: string; to?: string; page?: number; limit?: number }) {
    if (source !== 'LOGS' && source !== 'AUDIT') throw new Error('OBS_EXPORT_FORBIDDEN');
    const data = source === 'LOGS'
      ? await this.searchLogs(principal, query)
      : await this.searchAudit(principal, query);
    await this.prisma.auditEvent.create({ data: {
      traceId: randomUUID(), actorId: principal.userId, tenantId: principal.isSuperAdmin ? null : principal.tenantId,
      action: 'OBSERVABILITY_EXPORT', targetType: source, result: 'SUCCESS', metadata: { source, count: data.total, filters: this.redaction.redact(query) },
    } });
    return { source, exportedAt: new Date().toISOString(), count: data.total, items: data.items };
  }

  async securityEvents(principal: IamAuthContext, query: { severity?: string; type?: string; page?: number; limit?: number }) {
    const where: any = this.scope(principal);
    if (query.severity) where.severity = query.severity;
    if (query.type) where.type = query.type;
    const [items, total] = await Promise.all([
      this.prisma.securityEvent.findMany({ where, orderBy: { occurredAt: 'desc' }, skip: this.skip(query), take: this.take(query) }),
      this.prisma.securityEvent.count({ where }),
    ]);
    return { items: items.map((event) => ({ ...this.redaction.redact(event), timestamp: event.occurredAt, eventType: event.type, detailsSafe: (event.metadata as any)?.detailsSafe ?? null })), total, page: this.page(query), limit: this.take(query) };
  }

  async metricsFor(principal: IamAuthContext, name?: string, rangeMinutes = 60) {
    const since = new Date(Date.now() - Math.min(Math.max(rangeMinutes, 1), 43_200) * 60_000);
    return this.metricPoints(principal, name, since);
  }

  async diagnostics(principal: IamAuthContext) {
    const [health, records] = await Promise.all([
      this.health(),
      this.prisma.platformDiagnostic.findMany({ orderBy: { checkedAt: 'desc' }, take: 100 }),
    ]);
    return {
      health,
      diagnostics: records.map((record) => this.redaction.redact({ ...record, details: record.details })),
      scope: principal.isSuperAdmin ? 'PLATFORM' : 'TENANT',
    };
  }

  async listAlerts(principal: IamAuthContext, query: { status?: string; severity?: string; page?: number; limit?: number }) {
    const where: any = this.scope(principal);
    if (query.status) where.status = query.status;
    if (query.severity) where.severity = query.severity;
    const [items, total] = await Promise.all([
      this.prisma.observabilityAlert.findMany({ where, orderBy: { lastOccurredAt: 'desc' }, skip: this.skip(query), take: this.take(query) }),
      this.prisma.observabilityAlert.count({ where }),
    ]);
    return { items: items.map((alert) => ({ ...alert, triggeredAt: alert.openedAt })), total, page: this.page(query), limit: this.take(query) };
  }

  async listAlertRules(principal: IamAuthContext, query: { page?: number; limit?: number }) {
    const where = this.scope(principal);
    const [items, total] = await Promise.all([
      this.prisma.observabilityAlertRule.findMany({ where, orderBy: { updatedAt: 'desc' }, skip: this.skip(query), take: this.take(query) }),
      this.prisma.observabilityAlertRule.count({ where }),
    ]);
    return { items, total, page: this.page(query), limit: this.take(query) };
  }

  async toggleAlertRule(principal: IamAuthContext, id: string, enabled?: boolean) {
    const rule = await this.prisma.observabilityAlertRule.findFirst({ where: { id, ...this.scope(principal) } });
    if (!rule) throw new Error('OBS_ALERT_RULE_NOT_FOUND');
    return this.prisma.observabilityAlertRule.update({ where: { id }, data: { enabled: enabled ?? !rule.enabled } });
  }

  async createAlertRule(principal: IamAuthContext, input: { code: string; name: string; severity: string; condition: Record<string, unknown>; cooldownSec?: number }) {
    const threshold = Number(input.condition?.threshold);
    if (!input.code || !input.name || !Number.isFinite(threshold)) throw new Error('OBS_ALERT_RULE_INVALID');
    return this.prisma.observabilityAlertRule.create({ data: { tenantId: principal.isSuperAdmin ? null : principal.tenantId, code: input.code.slice(0, 120), name: input.name.slice(0, 255), severity: input.severity, condition: input.condition, cooldownSec: Math.min(Math.max(input.cooldownSec ?? 300, 1), 86_400) } });
  }

  async listNotificationRoutes(principal: IamAuthContext) { return this.prisma.observabilityNotificationRoute.findMany({ where: this.scope(principal), orderBy: { createdAt: 'desc' } }); }
  async createNotificationRoute(principal: IamAuthContext, input: { name: string; severity?: string; channel: string; recipients: string[]; cooldownSec?: number }) {
    const allowed = ['EMAIL', 'IN_APP', 'SMS', 'WHATSAPP', 'WEBHOOK'];
    if (!allowed.includes(input.channel) || !input.name || !Array.isArray(input.recipients) || input.recipients.length > 20) throw new Error('OBS_NOTIFICATION_ROUTE_INVALID');
    return this.prisma.observabilityNotificationRoute.create({ data: { tenantId: principal.isSuperAdmin ? null : principal.tenantId, name: input.name.slice(0, 255), severity: input.severity, channel: input.channel, recipients: input.recipients.map((recipient) => recipient.slice(0, 255)), cooldownSec: Math.min(Math.max(input.cooldownSec ?? 300, 1), 86_400) } });
  }

  async listRetentionPolicies(principal: IamAuthContext) { return this.prisma.observabilityRetentionPolicy.findMany({ where: this.scope(principal), include: { runs: { orderBy: { startedAt: 'desc' }, take: 10 } } }); }
  async upsertRetentionPolicy(principal: IamAuthContext, input: { signalType: string; retentionDays: number; enabled?: boolean; archive?: boolean }) {
    const signals = ['AUDIT', 'SECURITY_EVENTS', 'ALERTS', 'INCIDENTS', 'DIAGNOSTICS', 'LOGS', 'METRICS', 'TRACES'];
    if (!signals.includes(input.signalType) || !Number.isInteger(input.retentionDays) || input.retentionDays < 1 || input.retentionDays > 3650) throw new Error('OBS_RETENTION_POLICY_INVALID');
    const tenantId = principal.isSuperAdmin ? null : principal.tenantId;
    const existing = await this.prisma.observabilityRetentionPolicy.findFirst({ where: { tenantId, signalType: input.signalType } });
    return existing ? this.prisma.observabilityRetentionPolicy.update({ where: { id: existing.id }, data: { retentionDays: input.retentionDays, enabled: input.enabled ?? true, archive: input.archive ?? false } }) : this.prisma.observabilityRetentionPolicy.create({ data: { tenantId, signalType: input.signalType, retentionDays: input.retentionDays, enabled: input.enabled ?? true, archive: input.archive ?? false } });
  }

  async transitionAlert(principal: IamAuthContext, id: string, status: 'ACKNOWLEDGED' | 'RESOLVED', note?: string) {
    const alert = await this.prisma.observabilityAlert.findFirst({ where: { id, ...this.scope(principal) } });
    if (!alert) throw new Error('OBS_ALERT_NOT_FOUND');
    const at = new Date();
    return this.prisma.observabilityAlert.update({ where: { id }, data: { status, acknowledgedAt: status === 'ACKNOWLEDGED' ? at : alert.acknowledgedAt, resolvedAt: status === 'RESOLVED' ? at : null, assigneeId: principal.userId, resolutionNote: note } });
  }

  async listIncidents(principal: IamAuthContext, query: { page?: number; limit?: number }) {
    const where = this.scope(principal);
    const [items, total] = await Promise.all([
      this.prisma.observabilityIncident.findMany({ where, orderBy: { updatedAt: 'desc' }, skip: this.skip(query), take: this.take(query), include: { alerts: true, timeline: true } }),
      this.prisma.observabilityIncident.count({ where }),
    ]);
    return { items, total, page: this.page(query), limit: this.take(query) };
  }

  async createIncident(principal: IamAuthContext, input: { title: string; severity: string; alertIds?: string[]; description?: string }) {
    const tenantId = principal.isSuperAdmin ? undefined : principal.tenantId ?? undefined;
    const alertIds = [...new Set(input.alertIds ?? [])];
    if (alertIds.length) {
      const count = await this.prisma.observabilityAlert.count({ where: { id: { in: alertIds }, ...(tenantId ? { tenantId } : {}) } });
      if (count !== alertIds.length) throw new Error('OBS_INCIDENT_ALERT_SCOPE_DENIED');
    }
    return this.prisma.observabilityIncident.create({ data: {
      tenantId, title: input.title.slice(0, 255), severity: input.severity, status: 'OPEN', ownerId: principal.userId, description: input.description,
      alerts: { create: alertIds.map((alertId) => ({ alertId })) },
      timeline: { create: { type: 'CREATED', message: 'Incident created', actorId: principal.userId } },
    }, include: { alerts: true, timeline: true } });
  }

  async updateIncident(principal: IamAuthContext, id: string, input: { status?: string; note?: string; ownerId?: string }) {
    const existing = await this.prisma.observabilityIncident.findFirst({ where: { id, ...this.scope(principal) } });
    if (!existing) throw new Error('OBS_INCIDENT_NOT_FOUND');
    return this.prisma.observabilityIncident.update({ where: { id }, data: {
      status: input.status, ownerId: input.ownerId, resolvedAt: input.status === 'RESOLVED' ? new Date() : undefined,
      timeline: input.note ? { create: { type: 'NOTE', message: input.note.slice(0, 2000), actorId: principal.userId } } : undefined,
    }, include: { alerts: true, timeline: { orderBy: { createdAt: 'asc' } } } });
  }

  private scope(principal: IamAuthContext) { return principal.isSuperAdmin ? {} : { tenantId: principal.tenantId ?? '__no_tenant__' }; }
  private take(query: { limit?: number }) { return Math.min(Math.max(Number(query.limit) || 50, 1), MAX_PAGE_SIZE); }
  private page(query: { page?: number }) { return Math.max(Number(query.page) || 1, 1); }
  private skip(query: { page?: number; limit?: number }) { return (this.page(query) - 1) * this.take(query); }
  private paginate<T>(items: T[], query: { page?: number; limit?: number }) { return { items: items.slice(this.skip(query), this.skip(query) + this.take(query)), total: items.length, page: this.page(query), limit: this.take(query) }; }
  private metricPoints(principal: IamAuthContext, name: `techzone_${string}` | undefined, since: Date) { return this.metrics.queryPersisted(name, since, principal.tenantId, principal.isSuperAdmin); }
  private platformStatus(status: string): ObservabilityHealth { return status === 'HEALTHY' ? 'HEALTHY' : status === 'DEGRADED' ? 'DEGRADED' : status === 'MAINTENANCE' ? 'MAINTENANCE' : status === 'UNAVAILABLE' ? 'UNHEALTHY' : 'UNKNOWN'; }
}
