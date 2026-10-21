import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { MetricPoint } from './observability.contracts';

const HIGH_CARDINALITY = /(?:user|request|trace|correlation|session|record)(?:id)?$/i;
const MAX_POINTS = 20_000;

/**
 * Bounded PostgreSQL telemetry provider. Writes deliberately remain fire-and-
 * forget so telemetry can never alter a business response; reads use durable
 * rows and never substitute invented values when the provider is unavailable.
 */
@Injectable()
export class MetricRecorderService {
  private readonly points: MetricPoint[] = [];
  private readonly enabled = (process.env.OBSERVABILITY_TELEMETRY_PROVIDER ?? 'postgres').toLowerCase() === 'postgres';
  private lastError: string | null = null;

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  increment(name: MetricPoint['name'], labels: Record<string, string> = {}, value = 1) {
    this.assertLabels(labels);
    this.push({ name, type: 'COUNTER', value, timestamp: new Date().toISOString(), labels: this.normaliseLabels(labels) });
  }

  observe(name: MetricPoint['name'], value: number, labels: Record<string, string> = {}) {
    this.assertLabels(labels);
    this.push({ name, type: 'HISTOGRAM', value, timestamp: new Date().toISOString(), labels: this.normaliseLabels(labels) });
  }

  gauge(name: MetricPoint['name'], value: number, labels: Record<string, string> = {}) {
    this.assertLabels(labels);
    this.push({ name, type: 'GAUGE', value, timestamp: new Date().toISOString(), labels: this.normaliseLabels(labels) });
  }

  /** In-process view is retained only for tests and immediate non-durable diagnostics. */
  query(name?: string, since?: Date) {
    return this.points.filter((point) => (!name || point.name === name) && (!since || new Date(point.timestamp) >= since));
  }

  async queryPersisted(name?: string, since?: Date, tenantId?: string, isSuperAdmin = false): Promise<MetricPoint[]> {
    this.requireProvider();
    try {
      const rows = await this.prisma!.observabilityMetric.findMany({
        where: { ...(name ? { name } : {}), ...(since ? { timestamp: { gte: since } } : {}), ...(isSuperAdmin ? {} : { tenantId: tenantId ?? '__no_tenant__' }) },
        orderBy: { timestamp: 'asc' }, take: MAX_POINTS,
      });
      this.lastError = null;
      return rows.map((row) => ({ name: row.name as MetricPoint['name'], type: row.type as MetricPoint['type'], value: row.value, timestamp: row.timestamp.toISOString(), labels: row.labels as Record<string, string> }));
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      throw new Error('OBS_SOURCE_UNAVAILABLE');
    }
  }

  providerStatus() { return { provider: this.enabled ? 'postgres' : 'disabled', available: this.enabled && Boolean(this.prisma) && !this.lastError, lastError: this.lastError }; }

  private assertLabels(labels: Record<string, string>) {
    if (Object.keys(labels).some((key) => HIGH_CARDINALITY.test(key))) throw new Error('OBS_METRIC_LABEL_FORBIDDEN');
  }

  private normaliseLabels(labels: Record<string, string>) { return Object.fromEntries(Object.entries(labels).sort(([a], [b]) => a.localeCompare(b))); }

  private push(point: MetricPoint) {
    this.points.push(point);
    if (this.points.length > MAX_POINTS) this.points.splice(0, this.points.length - MAX_POINTS);
    if (!this.enabled || !this.prisma) return;
    void this.prisma.observabilityMetric.create({ data: { timestamp: new Date(point.timestamp), tenantId: point.labels.tenantId ?? null, name: point.name, type: point.type, value: point.value, labels: point.labels } })
      .then(() => { this.lastError = null; })
      .catch((error) => { this.lastError = error instanceof Error ? error.message : String(error); });
  }

  private requireProvider() {
    if (!this.enabled || !this.prisma) throw new Error('OBS_SOURCE_UNAVAILABLE');
  }
}
