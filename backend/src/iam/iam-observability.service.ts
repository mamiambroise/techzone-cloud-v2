import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IamError } from './iam-error';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  traceId?: string;
  source?: string;
  userId?: string;
  tenantId?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actorId?: string;
  tenantId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  result: string;
  traceId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export interface AlertRule {
  id: string;
  code: string;
  name: string;
  description?: string;
  enabled: boolean;
  severity: string;
  condition: string;
  action: string;
  createdAt: string;
  updatedAt: string;
  lastTriggeredAt?: string | null;
}

export interface AlertInstance {
  id: string;
  ruleId: string;
  severity: string;
  status: string;
  summary: string;
  description?: string;
  triggeredAt: string;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  assignedTo?: string | null;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class IamObservabilityService {
  private readonly logStore: LogEntry[] = [];
  private readonly auditStore: AuditEntry[] = [];
  private readonly alertRules: AlertRule[] = [
    { id: 'rule-1', code: 'HIGH_RISK_LOGIN', name: 'High-risk login', description: 'Détecte les connexions à risque élevé', enabled: true, severity: 'HIGH', condition: 'riskLevel == HIGH || riskLevel == CRITICAL', action: 'notify_security', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastTriggeredAt: null },
    { id: 'rule-2', code: 'MULTIPLE_FAILED_LOGINS', name: 'Tentatives de connexion multiples', description: 'Plus de 5 échecs consécutifs', enabled: true, severity: 'MEDIUM', condition: 'consecutiveFailures > 5', action: 'notify_user', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastTriggeredAt: null },
    { id: 'rule-3', code: 'UNAUTHORIZED_ACCESS', name: 'Accès non autorisé', description: 'Tentative d accès à une ressource sans autorisation', enabled: true, severity: 'CRITICAL', condition: 'accessDenied == true', action: 'block_ip', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastTriggeredAt: null },
  ];
  private readonly alertStore: AlertInstance[] = [];

  constructor(private readonly prisma: PrismaService) {}

  async listSecurityEvents(params?: {
    severity?: string;
    type?: string;
    userId?: string;
    tenantId?: string;
    page?: number;
    limit?: number;
  }) {
    const where: Record<string, unknown> = {};
    if (params?.severity) where.severity = params.severity as any;
    if (params?.type) where.type = params.type;
    if (params?.userId) where.userId = params.userId;
    if (params?.tenantId) where.tenantId = params.tenantId;

    const take = Math.min(params?.limit ?? 50, 200);
    const skip = params?.page ? (params.page - 1) * take : 0;

    return this.prisma.securityEvent.findMany({
      where,
      skip,
      take,
      orderBy: { occurredAt: 'desc' },
    });
  }

  async updateSecurityEvent(id: string, body: { status?: string; metadata?: Record<string, unknown> }) {
    const event = await this.prisma.securityEvent.findUnique({ where: { id } });
    if (!event) {
      throw new IamError('Événement de sécurité introuvable', 404, 'EVENT_NOT_FOUND');
    }

    const updatedMetadata = event.metadata ? { ...JSON.parse(JSON.stringify(event.metadata)), ...(body.metadata ?? {}) } : body.metadata;

    return this.prisma.securityEvent.update({
      where: { id },
      data: { metadata: updatedMetadata as any },
    });
  }

  async dashboard() {
    const [users, activeSessions, securityEvents, recentAudit, quotas, services, diagnostics] = await Promise.all([
      this.prisma.iamUser.count(),
      this.prisma.iamSession.count({ where: { status: 'ACTIVE' } }),
      this.prisma.securityEvent.count({ where: { occurredAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
      this.prisma.auditEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.quotaUsage.findMany({
        include: { subscription: true },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      this.prisma.platformService.findMany({ orderBy: { status: 'asc' } }),
      this.prisma.platformDiagnostic.findMany({
        orderBy: { checkedAt: 'desc' },
        take: 20,
      }),
    ]);

    return {
      stats: {
        totalUsers: users,
        activeSessions,
        securityEvents24h: securityEvents,
      },
      recentActivity: recentAudit.map((e) => ({
        id: e.id,
        traceId: e.traceId,
        action: e.action,
        result: e.result,
        actorId: e.actorId,
        targetType: e.targetType,
        targetId: e.targetId,
        createdAt: e.createdAt,
      })),
      quotas: quotas.map((q) => ({
        id: q.id,
        featureCode: q.featureCode,
        periodStart: q.periodStart,
        periodEnd: q.periodEnd,
        usedValue: Number(q.usedValue),
        limitValue: q.limitValue ? Number(q.limitValue) : null,
        utilization: q.limitValue ? Number(q.usedValue) / Number(q.limitValue) * 100 : 0,
      })),
      services: services.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        status: s.status,
        version: s.version,
        environment: s.environment,
        lastHealthCheckAt: s.lastHealthCheckAt,
      })),
      diagnostics: diagnostics.slice(0, 10),
    };
  }

  async searchLogs(params?: {
    level?: string;
    source?: string;
    search?: string;
    traceId?: string;
    page?: number;
    limit?: number;
  }): Promise<LogEntry[]> {
    const all = this.logStore;
    let filtered = all;

        if (params?.level) filtered = filtered.filter((l) => l.level === params.level!);
    if (params?.source) { const s = params.source; filtered = filtered.filter((l) => (l.source ?? '').toLowerCase().includes(s)); }
    if (params?.traceId) filtered = filtered.filter((l) => l.traceId === params.traceId);
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((l) => l.message.toLowerCase().includes(q) || (l.traceId ?? '').toLowerCase().includes(q));
    }

    const take = Math.min(params?.limit ?? 50, 200);
    const skip = params?.page ? (params.page - 1) * take : 0;
    return filtered.slice(skip, skip + take);
  }

  async searchAudit(params?: {
    action?: string;
    actorId?: string;
    targetType?: string;
    result?: string;
    traceId?: string;
    page?: number;
    limit?: number;
  }): Promise<AuditEntry[]> {
    const all = [...this.auditStore];
    let filtered = all;

    if (params?.action) { const a = params.action; filtered = filtered.filter((e) => (e.action ?? '').toLowerCase().includes(a)); }
    if (params?.actorId) filtered = filtered.filter((a) => a.actorId === params.actorId);
    if (params?.targetType) filtered = filtered.filter((a) => a.targetType === params.targetType);
    if (params?.result) filtered = filtered.filter((a) => a.result === params.result);
    if (params?.traceId) filtered = filtered.filter((a) => a.traceId === params.traceId);

    const take = Math.min(params?.limit ?? 50, 200);
    const skip = params?.page ? (params.page - 1) * take : 0;
    return filtered.slice(skip, skip + take);
  }

  async listAlertRules(params?: { enabled?: boolean; search?: string; severity?: string }): Promise<AlertRule[]> {
    let filtered = [...this.alertRules];
    if (params?.enabled !== undefined) filtered = filtered.filter((r) => r.enabled === params.enabled);
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((r) => r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q));
    }
    if (params?.severity) filtered = filtered.filter((r) => r.severity === params.severity);
    return filtered;
  }

  async getAlertRule(id: string): Promise<AlertRule | null> {
    return this.alertRules.find((r) => r.id === id) ?? null;
  }

  async toggleAlertRule(id: string, body: { enabled?: boolean }): Promise<AlertRule> {
    const rule = this.alertRules.find((r) => r.id === id);
    if (!rule) {
      throw new IamError('Règle d alerte introuvable', 404, 'ALERT_RULE_NOT_FOUND');
    }
    if (body.enabled !== undefined) {
      rule.enabled = body.enabled;
    } else {
      rule.enabled = !rule.enabled;
    }
    rule.updatedAt = new Date().toISOString();
    return { ...rule };
  }

  async listAlerts(params?: { status?: string; severity?: string; ruleId?: string; page?: number; limit?: number }): Promise<AlertInstance[]> {
    let filtered = [...this.alertStore];
    if (params?.status) filtered = filtered.filter((a) => a.status === params.status);
    if (params?.severity) filtered = filtered.filter((a) => a.severity === params.severity);
    if (params?.ruleId) filtered = filtered.filter((a) => a.ruleId === params.ruleId);
    const take = Math.min(params?.limit ?? 50, 200);
    const skip = params?.page ? (params.page - 1) * take : 0;
    return filtered.slice(skip, skip + take);
  }

  async updateAlertInstance(id: string, action: string): Promise<AlertInstance> {
    const instance = this.alertStore.find((a) => a.id === id);
    if (!instance) {
      throw new IamError('Alerte introuvable', 404, 'ALERT_NOT_FOUND');
    }
    if (action === 'acknowledge') {
      instance.status = 'ACKNOWLEDGED';
      instance.acknowledgedAt = new Date().toISOString();
    } else if (action === 'resolve') {
      instance.status = 'RESOLVED';
      instance.resolvedAt = new Date().toISOString();
    }
    return { ...instance };
  }

  addLogEntry(entry: Omit<LogEntry, 'id'>) {
    const logEntry: LogEntry = { id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, ...entry };
    this.logStore.push(logEntry);
    if (this.logStore.length > 10000) {
      this.logStore.shift();
    }
    return logEntry;
  }

  addAuditEntry(entry: Omit<AuditEntry, 'id'>) {
    const auditEntry: AuditEntry = { id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, ...entry };
    this.auditStore.push(auditEntry);
    if (this.auditStore.length > 10000) {
      this.auditStore.shift();
    }
    return auditEntry;
  }

  createAlertInstance(instance: Omit<AlertInstance, 'id'>) {
    const alert: AlertInstance = { id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, ...instance };
    this.alertStore.push(alert);
    return alert;
  }
}
