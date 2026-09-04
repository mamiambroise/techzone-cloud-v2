export interface IntegrationProvider {
  readonly type: string;

  connect(config: Record<string, unknown>): Promise<void>;

  disconnect(): Promise<void>;

  healthCheck(): Promise<{
    status: 'HEALTHY' | 'WARNING' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
    message?: string;
  }>;

  execute(operation: string, payload?: unknown): Promise<unknown>;
}
