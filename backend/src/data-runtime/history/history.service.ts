// DATA-CDC-06 : History, Diagnostics & Observability

import { Injectable, Logger } from '@nestjs/common';
import {
  HistoryRecord,
  HistoryFilter,
  DiagnosticEntry,
  DataMetrics,
  TimelineEntry,
} from '../interfaces/history.contract';
import { ExecutionStatus } from '../interfaces';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);
  private readonly records: HistoryRecord[] = [];
  private readonly diagnostics: DiagnosticEntry[] = [];
  private readonly maxRecords = 10000;
  private readonly maxDiagnostics = 5000;
  private readonly maxRetentionDays = 30;

  recordExecution(record: HistoryRecord): void {
    this.records.push(record);
    if (this.records.length > this.maxRecords) {
      this.records.shift();
    }
    this.logger.debug(
      `[hist] ${record.operation} ${record.resource} → ${record.status} (${record.duration}ms)`,
    );
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

  getMetrics(): DataMetrics {
    const total = this.records.length;
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

    const successCount = this.records.filter((r) => r.status === 'SUCCESS').length;
    const timeouts = this.records.filter((r) => r.status === 'TIMEOUT').length;
    const denied = this.records.filter((r) => r.status === 'DENIED').length;

    const latencies = this.records.map((r) => r.duration).sort((a, b) => a - b);
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;

    const running = this.records.filter((r) => r.status === 'SUCCESS').length;

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
