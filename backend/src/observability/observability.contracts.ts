/** Versioned, transport-neutral contracts used at the observability boundary. */
export const OBSERVABILITY_CONTRACT_VERSION = '1.0';

export type ObservabilitySeverity = 'DEBUG' | 'INFO' | 'NOTICE' | 'WARNING' | 'ERROR' | 'CRITICAL';
export type ObservabilityHealth = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN' | 'MAINTENANCE';
export type ObservabilityDiagnosticStatus = 'PASS' | 'WARNING' | 'ERROR' | 'UNAVAILABLE' | 'UNKNOWN';

export interface TraceContext {
  traceId: string;
  requestId: string;
  correlationId?: string;
  tenantId?: string;
  identityId?: string;
  applicationId?: string;
  environmentId?: string;
}

export interface ObservabilityEvent extends Partial<TraceContext> {
  version: typeof OBSERVABILITY_CONTRACT_VERSION;
  timestamp: string;
  module: string;
  service: string;
  operation?: string;
  severity: ObservabilitySeverity;
  status?: string;
  durationMs?: number;
}

export interface LogEvent extends ObservabilityEvent {
  category: 'APPLICATION' | 'SECURITY' | 'AUDIT' | 'RUNTIME' | 'DEPLOYMENT' | 'DATA' | 'INTEGRATION' | 'BILLING' | 'ADMIN' | 'SYSTEM';
  event: string;
  message: string;
  attributes?: Record<string, unknown>;
}

export interface MetricPoint {
  name: `techzone_${string}`;
  type: 'COUNTER' | 'GAUGE' | 'HISTOGRAM';
  value: number;
  timestamp: string;
  labels: Record<string, string>;
}
