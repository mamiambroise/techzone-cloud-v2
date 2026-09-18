// WF-CDC-07 : Executions, Historique & Diagnostics

import { Injectable, Logger } from '@nestjs/common';
import {
  AutomationExecutionRecord,
  ExecutionSearchFilter,
  TimelineEntry,
} from '../interfaces/rule.contract';
import { AutomationExecutionStatus } from '../interfaces/automation.contract';

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

@Injectable()
export class AutomationHistoryService {
  private readonly logger = new Logger(AutomationHistoryService.name);
  private readonly records: AutomationExecutionRecord[] = [];
  private readonly maxRetention = 10000;

  recordExecution(record: AutomationExecutionRecord): void {
    this.records.push(record);
    if (this.records.length > this.maxRetention) {
      this.records.shift();
    }
    this.logger.debug(
      `[hist] ${record.ruleCode || record.workflowCode || ''} -> ${record.status} (${record.duration ?? 0}ms)`,
    );
  }

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

  getByTraceId(traceId: string): AutomationExecutionRecord[] {
    return this.records.filter((r) => r.traceId === traceId);
  }

  getTimeline(executionId: string): TimelineEntry[] {
    return this.records
      .filter((r) => r.executionId === executionId)
      .flatMap((r) => [{ timestamp: r.startedAt, event: 'EXECUTION_START', status: 'RUNNING' }]);
  }

  getMetrics(): AutomationMetrics {
    const total = this.records.length;
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

    const succeeded = this.records.filter((r) => r.status === 'SUCCEEDED').length;
    const failed = this.records.filter((r) => r.status === 'FAILED').length;
    const running = this.records.filter((r) => r.status === 'RUNNING').length;
    const timeouts = this.records.filter((r) => r.status === 'TIMEOUT').length;
    const retries = this.records.reduce((sum, r) => sum + r.retryCount, 0);
    const durations = this.records.filter((r) => r.duration != null).map((r) => r.duration!);
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
}
