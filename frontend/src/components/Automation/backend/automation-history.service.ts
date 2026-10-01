// WF-CDC-07 : Executions, Historique & Diagnostics

import { Injectable, Logger } from '@nestjs/common';
import {
  AutomationExecutionRecord,
  ExecutionSearchFilter,
  TimelineEntry,
} from '../interfaces/rule.contract';
import type { HistoryQueryDto } from '../dto/history-query.dto';

export interface AutomationMetrics {
  executionsCount: number;
  successRate: number;
  failureRate: number;
  averageDuration: number;
  retryCount: number;
  timeoutCount: number;
  runningCount: number;
  succeededCount: number;
  failedCount: number;
}

export interface HistoryPage {
  items: AutomationExecutionRecord[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function toMillis(value: unknown): number {
  if (value === null || value === undefined || value === '') return NaN;
  return new Date(value as string | number | Date).getTime();
}

function toPositiveInt(value: unknown, fallback: number, max = Number.MAX_SAFE_INTEGER): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}

@Injectable()
export class AutomationHistoryService {
  private readonly logger = new Logger(AutomationHistoryService.name);
  private readonly records: AutomationExecutionRecord[] = [];
  private readonly maxRetention = 10000;

  recordExecution(record: AutomationExecutionRecord): void {
    // La durée n'était jamais renseignée par l'appelant : la moyenne restait à 0.
    const duration = record.duration ?? this.computeDuration(record);
    const stored = duration === undefined ? record : { ...record, duration };

    this.records.push(stored);
    if (this.records.length > this.maxRetention) {
      this.records.shift();
    }
    this.logger.debug(
      `[hist] ${stored.ruleCode || stored.workflowCode || ''} -> ${stored.status} (${stored.duration ?? 0}ms)`,
    );
  }

  /** Recherche historique (comportement inchangé, non filtrée par tenant sauf si demandé). */
  search(filter: ExecutionSearchFilter = {}): AutomationExecutionRecord[] {
    let results = [...this.records];

    if (filter.startDate) results = results.filter((r) => r.startedAt >= filter.startDate!);
    if (filter.endDate) results = results.filter((r) => r.startedAt <= filter.endDate!);
    if (filter.tenantId) results = results.filter((r) => r.tenantId === filter.tenantId);
    if (filter.workflowCode) results = results.filter((r) => r.workflowCode === filter.workflowCode);
    if (filter.ruleCode) results = results.filter((r) => r.ruleCode === filter.ruleCode);
    if (filter.triggerCode) results = results.filter((r) => r.triggerCode === filter.triggerCode);
    if (filter.status) results = results.filter((r) => r.status === filter.status);
    if (filter.errorCode) results = results.filter((r) => r.errorCode === filter.errorCode);
    if (filter.traceId) results = results.filter((r) => r.traceId === filter.traceId);

    const page = filter.page || 1;
    const pageSize = filter.pageSize || 50;
    return results.slice((page - 1) * pageSize, page * pageSize);
  }

  /**
   * Recherche paginée, tenant-scoped, la plus récente d'abord.
   * Le tenantId est obligatoire : il ne peut pas être omis par l'appelant.
   */
  searchPaged(query: HistoryQueryDto, tenantId: string): HistoryPage {
    const page = toPositiveInt(query.page, 1);
    const pageSize = toPositiveInt(query.pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const from = toMillis(query.from);
    const to = toMillis(query.to);
    const q = query.q?.trim().toLowerCase();
    const status = query.status?.trim().toUpperCase();
    const workflowCode = query.workflowCode?.trim();

    const matches = this.records
      .slice()
      .reverse() // à date égale, l'enregistrement le plus récent passe devant (tri stable)
      .filter((r) => {
        if (r.tenantId !== tenantId) return false;
        if (status && String(r.status).toUpperCase() !== status) return false;
        if (workflowCode && r.workflowCode !== workflowCode) return false;
        const started = toMillis(r.startedAt);
        if (!Number.isNaN(from) && !(started >= from)) return false;
        if (!Number.isNaN(to) && !(started <= to)) return false;
        if (q) {
          const haystack = [r.executionId, r.workflowCode, r.ruleCode, r.triggerCode, r.traceId]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => (toMillis(b.startedAt) || 0) - (toMillis(a.startedAt) || 0));

    return {
      items: matches.slice((page - 1) * pageSize, page * pageSize),
      total: matches.length,
      page,
      pageSize,
    };
  }

  /** Détail d'une exécution, uniquement si elle appartient au tenant. */
  getById(executionId: string, tenantId: string): AutomationExecutionRecord | undefined {
    for (let i = this.records.length - 1; i >= 0; i--) {
      const r = this.records[i];
      if (r.executionId === executionId && r.tenantId === tenantId) return r;
    }
    return undefined;
  }

  getByTraceId(traceId: string): AutomationExecutionRecord[] {
    return this.records.filter((r) => r.traceId === traceId);
  }

  getTimeline(executionId: string): TimelineEntry[] {
    return this.records
      .filter((r) => r.executionId === executionId)
      .flatMap((r) => [{ timestamp: r.startedAt, event: 'EXECUTION_START', status: 'RUNNING' }]);
  }

  /** Sans tenantId : métriques globales (usage interne). Avec tenantId : métriques du tenant. */
  getMetrics(tenantId?: string): AutomationMetrics {
    const source =
      tenantId === undefined ? this.records : this.records.filter((r) => r.tenantId === tenantId);
    const total = source.length;
    if (total === 0) {
      return {
        executionsCount: 0,
        successRate: 0,
        failureRate: 0,
        averageDuration: 0,
        retryCount: 0,
        timeoutCount: 0,
        runningCount: 0,
        succeededCount: 0,
        failedCount: 0,
      };
    }

    const succeeded = source.filter((r) => r.status === 'SUCCEEDED').length;
    const failed = source.filter((r) => r.status === 'FAILED').length;
    const running = source.filter((r) => r.status === 'RUNNING').length;
    const timeouts = source.filter((r) => r.status === 'TIMEOUT').length;
    const retries = source.reduce((sum, r) => sum + r.retryCount, 0);
    const durations = source.filter((r) => r.duration != null).map((r) => r.duration!);
    const avg = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    return {
      executionsCount: total,
      successRate: (succeeded / total) * 100,
      failureRate: (failed / total) * 100,
      averageDuration: avg,
      retryCount: retries,
      timeoutCount: timeouts,
      runningCount: running,
      succeededCount: succeeded,
      failedCount: failed,
    };
  }

  clear(): void {
    this.records.length = 0;
  }

  private computeDuration(record: AutomationExecutionRecord): number | undefined {
    const start = toMillis(record.startedAt);
    const end = toMillis(record.finishedAt);
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) return undefined;
    return end - start;
  }
}
