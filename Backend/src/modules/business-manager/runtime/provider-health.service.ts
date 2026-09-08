import { Injectable } from '@nestjs/common';

export type ProviderHealthState = 'UP' | 'DEGRADED' | 'DOWN' | 'UNKNOWN' | 'CIRCUIT_OPEN';

@Injectable()
export class ProviderHealthService {
  private providers = new Map<string, { provider: string; status: ProviderHealthState; latencyMs: number | null; lastSuccessAt?: string; lastFailureAt?: string; errorRate: number; consecutiveFailures: number; circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN'; critical: boolean }>();

  constructor() {
    this.providers.set('iam-context', { provider: 'iam-context', status: 'UP', latencyMs: 12, lastSuccessAt: new Date().toISOString(), errorRate: 0, consecutiveFailures: 0, circuitState: 'CLOSED', critical: true });
    this.providers.set('entitlement-provider', { provider: 'entitlement-provider', status: 'UP', latencyMs: 11, lastSuccessAt: new Date().toISOString(), errorRate: 0, consecutiveFailures: 0, circuitState: 'CLOSED', critical: true });
    this.providers.set('capability-provider', { provider: 'capability-provider', status: 'DEGRADED', latencyMs: 120, lastSuccessAt: new Date().toISOString(), errorRate: 0.2, consecutiveFailures: 1, circuitState: 'HALF_OPEN', critical: true });
  }

  health() {
    return {
      status: 'WARNING',
      providers: [...this.providers.values()],
      generatedAt: new Date().toISOString(),
      summary: { healthy: 2, warning: 1, critical: 0 },
    };
  }

  probe(provider: string) {
    const entry = this.providers.get(provider) ?? { provider, status: 'UP', latencyMs: 0, errorRate: 0, consecutiveFailures: 0, circuitState: 'CLOSED', critical: false };
    return { ...entry, probeAt: new Date().toISOString() };
  }

  set(provider: string, status: ProviderHealthState) {
    const existing = this.providers.get(provider) ?? { provider, status: 'UNKNOWN', latencyMs: null, errorRate: 0, consecutiveFailures: 0, circuitState: 'CLOSED', critical: false };
    this.providers.set(provider, { ...existing, provider, status, circuitState: status === 'CIRCUIT_OPEN' ? 'OPEN' : existing.circuitState, lastFailureAt: status === 'DOWN' || status === 'CIRCUIT_OPEN' ? new Date().toISOString() : existing.lastFailureAt });
    return this.providers.get(provider);
  }
}
