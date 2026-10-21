// DATA-CDC-06 : History, Diagnostics & Observability

import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  HistoryRecord,
  HistoryFilter,
  DiagnosticEntry,
  DataMetrics,
  TimelineEntry,
} from '../interfaces/history.contract';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);
  private readonly records: HistoryRecord[] = [];
  private readonly diagnostics: DiagnosticEntry[] = [];
  private readonly maxRecords = 10000;
  private readonly maxDiagnostics = 5000;
  private readonly maxRetentionDays = 30;

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  recordExecution(record: HistoryRecord): void {
    this.records.push(record);
    if (this.records.length > this.maxRecords) {
      this.records.shift();
    }
    this.logger.debug(
      `[hist] ${record.operation} ${record.resource} → ${record.status} (${record.duration}ms)`,
    );
    void this.persistAudit(record);
  }

  private async persistAudit(record: HistoryRecord): Promise<void> {
    if (!this.prisma || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(record.tenantId)) return;
    try {
      await this.prisma.auditEvent.create({
        data: {
          tenantId: record.tenantId,
          actorId: record.userId || null,
          traceId: record.traceId,
          action: `DATA_RUNTIME_${record.operation}`,
          targetType: 'DATA_RUNTIME_RESOURCE',
          targetId: record.resource,
          result: record.status,
          reason: record.errorCode || null,
          metadata: {
            requestId: record.requestId,
            provider: record.provider,
            duration: record.duration,
            errorMessage: record.errorMessage || undefined,
          },
          createdAt: new Date(record.startTime),
        },
      });
    } catch (error) {
      this.logger.warn(`Impossible de persister l'audit Data Runtime: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  addDiagnostic(entry: DiagnosticEntry): void {
    this.diagnostics.push(entry);
    if (this.diagnostics.length > this.maxDiagnostics) {
      this.diagnostics.shift();
    }
  }

  searchHistory(filter: HistoryFilter = {}): HistoryRecord[] {
    let results = [...this.records];

    if (filter.startDate) {
      results = results.filter((r) => r.startTime >= filter.startDate!);
    }
    if (filter.endDate) {
      results = results.filter((r) => r.startTime <= filter.endDate!);
    }
    if (filter.tenantId) {
      results = results.filter((r) => r.tenantId === filter.tenantId);
    }
    if (filter.resource) {
      results = results.filter((r) => r.resource === filter.resource);
    }
    if (filter.operation) {
      results = results.filter((r) => r.operation === filter.operation);
    }
    if (filter.status) {
      results = results.filter((r) => r.status === filter.status);
    }
    if (filter.provider) {
      results = results.filter((r) => r.provider === filter.provider);
    }
    if (filter.traceId) {
      results = results.filter((r) => r.traceId === filter.traceId);
    }

    const page = filter.page || 1;
    const pageSize = filter.pageSize || 50;
    const start = (page - 1) * pageSize;
    return results.slice(start, start + pageSize);
  }

  searchHistoryByTenant(tenantId: string, filter: HistoryFilter = {}): HistoryRecord[] {
    const filtered: HistoryFilter = { ...filter, tenantId };
    return this.searchHistory(filtered);
  }

  getHistoryByTraceId(traceId: string, tenantId?: string): HistoryRecord[] {
    let results = this.records.filter((r) => r.traceId === traceId);
    if (tenantId) {
      results = results.filter((r) => r.tenantId === tenantId);
    }
    return results;
  }

  buildTimeline(traceId: string, tenantId?: string): TimelineEntry[] {
    const entries: TimelineEntry[] = [];
    const record = tenantId
      ? this.records.find((r) => r.traceId === traceId && r.tenantId === tenantId)
      : this.records.find((r) => r.traceId === traceId);
    if (record) {
      entries.push({
        timestamp: record.startTime,
        event: `${record.operation} ${record.resource}`,
        duration: record.duration,
        status: record.status,
        details: record.errorMessage || undefined,
      });
    }
    return entries;
  }

  getDiagnostics(traceId?: string, tenantId?: string): DiagnosticEntry[] {
    let results = [...this.diagnostics];
    if (traceId) {
      results = results.filter((d) => d.traceId === traceId);
    }
    if (tenantId) {
      results = results.filter((d) => d.metadata?.tenantId === tenantId);
    }
    return results.reverse();
  }

  /**
   * Return metrics for one tenant only. Runtime telemetry is process-local,
   * therefore the caller must always provide the authenticated tenant when
   * exposing it through an HTTP endpoint. Omitting the tenant is retained for
   * internal diagnostics and tests, but must not be used by tenant routes.
   */
  getMetrics(tenantId?: string): DataMetrics {
    const records = tenantId
      ? this.records.filter((record) => record.tenantId === tenantId)
      : this.records;
    const total = records.length;
    if (total === 0) {
      return {
        queryCount: 0,
        executionCount: 0,
        successRate: 0,
        errorRate: 0,
        averageLatency: 0,
        p95Latency: 0,
        p99Latency: 0,
        timeoutCount: 0,
        deniedCount: 0,
        providerAvailability: {},
      };
    }

    const successCount = records.filter((r) => r.status === 'SUCCESS').length;
    const timeouts = records.filter((r) => r.status === 'TIMEOUT').length;
    const denied = records.filter((r) => r.status === 'DENIED').length;

    const latencies = records.map((r) => r.duration).sort((a, b) => a - b);
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;

    return {
      queryCount: total,
      executionCount: total,
      successRate: (successCount / total) * 100,
      errorRate: ((total - successCount) / total) * 100,
      averageLatency: avg,
      p95Latency: p95,
      p99Latency: p99,
      timeoutCount: timeouts,
      deniedCount: denied,
      providerAvailability: {},
    };
  }

  clear(): void {
    this.records.length = 0;
    this.diagnostics.length = 0;
  }

  get retentionDays(): number {
    return this.maxRetentionDays;
  }
}
