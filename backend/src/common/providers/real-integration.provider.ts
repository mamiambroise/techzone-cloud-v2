import { Injectable } from '@nestjs/common';
import { IntegrationProvider } from './integration-provider.interface';
import { IntegrationResilienceService } from '../resilience/integration-resilience.service';
import { IdempotencyService } from '../resilience/idempotency.service';

@Injectable()
export class RealIntegrationProvider implements IntegrationProvider {
  readonly type = 'REST';
  private baseUrl: string | null = null;

  constructor(
    private readonly resilienceService: IntegrationResilienceService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  async connect(config: Record<string, unknown>): Promise<void> {
    const { baseUrl, apiKey, timeoutMs } = config as {
      baseUrl?: string;
      apiKey?: string;
      timeoutMs?: number;
    };

    if (!baseUrl) {
      throw new Error('baseUrl is required for RealIntegrationProvider');
    }

    this.baseUrl = baseUrl;

    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey ?? ''}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(timeoutMs ?? 5000),
    });

    if (!response.ok) {
      throw new Error(
        `Connection failed: ${response.status} ${response.statusText}`,
      );
    }
  }

  async disconnect(): Promise<void> {
    this.baseUrl = null;
  }

  async healthCheck() {
    if (!this.baseUrl) {
      return { status: 'UNKNOWN' as const, message: 'Not connected' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        return { status: 'HEALTHY' as const, message: 'Provider is healthy' };
      }

      if (response.status === 429) {
        return { status: 'DEGRADED' as const, message: 'Rate limited' };
      }

      return {
        status: 'CRITICAL' as const,
        message: `HTTP ${response.status}`,
      };
    } catch (error) {
      const err = error as Error;

      if (err.name === 'TimeoutError') {
        return {
          status: 'DEGRADED' as const,
          message: 'Health check timed out',
        };
      }

      return {
        status: 'CRITICAL' as const,
        message: `Health check failed: ${err.message}`,
      };
    }
  }

  async execute(operation: string, payload?: unknown): Promise<unknown> {
    if (!this.baseUrl) {
      throw new Error('Provider is not connected');
    }

    const idempotencyKey =
      typeof payload === 'object' &&
      payload !== null &&
      'idempotencyKey' in payload
        ? String((payload as { idempotencyKey: unknown }).idempotencyKey)
        : undefined;

    const executeOperation = () =>
      this.resilienceService.execute(
        async () => {
          const response = await fetch(`${this.baseUrl}${operation}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload ?? {}),
            signal: AbortSignal.timeout(10000),
          });

          if (!response.ok) {
            throw new Error(
              `Operation failed: ${response.status} ${response.statusText}`,
            );
          }

          const result = await response.json();

          return {
            success: true,
            provider: this.type,
            operation,
            payload: result,
          };
        },
        {
          timeout: { timeoutMs: 10000 },
          retry: {
            maxAttempts: 3,
            initialDelayMs: 500,
            maxDelayMs: 10000,
            backoffMultiplier: 2,
          },
          circuitBreaker: { failureThreshold: 5, resetTimeoutMs: 30000 },
        },
      );

    if (!idempotencyKey) {
      return executeOperation();
    }

    return this.idempotencyService.execute(idempotencyKey, executeOperation);
  }
}
