import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MetricRecorderService } from './metric-recorder.service';
import { NotificationRouterService } from './notification-router.service';

type Condition = { source?: 'METRIC' | 'SECURITY_EVENT'; metric?: string; eventType?: string; operator?: 'GT' | 'GTE' | 'LT' | 'LTE' | 'EQ'; threshold: number; windowMinutes?: number; fingerprint?: string; resource?: string };

@Injectable()
export class AlertEvaluatorService {
  private readonly logger = new Logger(AlertEvaluatorService.name);
  constructor(private readonly prisma: PrismaService, private readonly metrics: MetricRecorderService, private readonly notifications: NotificationRouterService) {}

  async evaluateAll() {
    const rules = await this.prisma.observabilityAlertRule.findMany({ where: { enabled: true } });
    const results = [];
    for (const rule of rules) results.push(await this.evaluateRule(rule));
    return results;
  }

  async evaluateRule(rule: { id: string; tenantId: string | null; code: string; severity: string; cooldownSec: number; condition: unknown }) {
    const condition = rule.condition as Condition;
    if (!condition || !Number.isFinite(condition.threshold)) return { ruleId: rule.id, status: 'INVALID_CONDITION' };
    const windowMinutes = Math.min(Math.max(condition.windowMinutes ?? 5, 1), 1440);
    const since = new Date(Date.now() - windowMinutes * 60_000);
    let value: number;
    if (condition.source === 'SECURITY_EVENT') {
      value = await this.prisma.securityEvent.count({ where: { ...(rule.tenantId ? { tenantId: rule.tenantId } : {}), ...(condition.eventType ? { type: condition.eventType } : {}), occurredAt: { gte: since } } });
    } else {
      if (!condition.metric?.startsWith('techzone_')) return { ruleId: rule.id, status: 'INVALID_METRIC' };
      value = (await this.metrics.queryPersisted(condition.metric as `techzone_${string}`, since, rule.tenantId ?? undefined, !rule.tenantId))
        .filter((point) => !rule.tenantId || point.labels.tenantId === rule.tenantId)
        .reduce((sum, point) => sum + point.value, 0);
    }
    if (!this.matches(value, condition.operator ?? 'GTE', condition.threshold)) return { ruleId: rule.id, status: 'NOT_TRIGGERED', value };

    const scopeKey = rule.tenantId ?? 'PLATFORM';
    const fingerprint = condition.fingerprint ?? `${condition.source ?? 'METRIC'}:${condition.metric ?? condition.eventType ?? 'all'}:${condition.resource ?? 'global'}`;
    const now = new Date();
    const existing = await this.prisma.observabilityAlert.findUnique({ where: { ruleId_scopeKey_fingerprint: { ruleId: rule.id, scopeKey, fingerprint } } });
    if (existing) {
      const cooling = existing.lastOccurredAt.getTime() + rule.cooldownSec * 1000 > now.getTime();
      const alert = await this.prisma.observabilityAlert.update({ where: { id: existing.id }, data: { lastOccurredAt: now, occurrences: { increment: 1 }, status: existing.status === 'RESOLVED' ? 'OPEN' : existing.status } });
      if (!cooling) await this.notifications.dispatch(alert.id);
      return { ruleId: rule.id, status: cooling ? 'COOLDOWN' : 'DEDUPLICATED', value, alertId: alert.id };
    }
    try {
      const alert = await this.prisma.observabilityAlert.create({ data: { ruleId: rule.id, tenantId: rule.tenantId, scopeKey, fingerprint, severity: rule.severity, summary: `${rule.code} threshold reached`, description: `Observed ${value}; threshold ${condition.threshold} over ${windowMinutes} minute(s).`, resource: condition.resource, metadata: { source: condition.source ?? 'METRIC', value, threshold: condition.threshold, windowMinutes } } });
      await this.notifications.dispatch(alert.id);
      return { ruleId: rule.id, status: 'OPENED', value, alertId: alert.id };
    } catch (error) {
      if ((error as { code?: string })?.code !== 'P2002') throw error;
      // A concurrent evaluator may have won the unique-key race; retrying a
      // full evaluation would double-count, so report a safe deduplicated result.
      this.logger.warn(`Alert create raced for rule ${rule.id}: ${error instanceof Error ? error.message : String(error)}`);
      return { ruleId: rule.id, status: 'DEDUPLICATED', value };
    }
  }

  private matches(value: number, operator: NonNullable<Condition['operator']>, threshold: number) {
    return operator === 'GT' ? value > threshold : operator === 'GTE' ? value >= threshold : operator === 'LT' ? value < threshold : operator === 'LTE' ? value <= threshold : value === threshold;
  }
}
