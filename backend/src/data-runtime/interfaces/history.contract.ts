// DATA-CDC-06 : History & Diagnostics Contract

import { ExecutionStatus } from './data-runtime.contract';

export interface HistoryRecord {
  traceId: string;
  requestId: string;
  tenantId: string;
  userId: string;
  resource: string;
  operation: string;
  provider: string;
  startTime: string;
  duration: number;
  status: ExecutionStatus;
  errorCode?: string;
  errorMessage?: string;
}

export interface HistoryFilter {
  startDate?: string;
  endDate?: string;
  tenantId?: string;
  resource?: string;
  operation?: string;
  status?: ExecutionStatus;
  provider?: string;
  traceId?: string;
  page?: number;
  pageSize?: number;
}

export interface DiagnosticEntry {
  traceId: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  source: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface DataMetrics {
  queryCount: number;
  executionCount: number;
  successRate: number;
  errorRate: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  timeoutCount: number;
  deniedCount: number;
  providerAvailability: Record<string, boolean>;
}

export interface TimelineEntry {
  timestamp: string;
  event: string;
  duration?: number;
  status: ExecutionStatus;
  details?: string;
}
