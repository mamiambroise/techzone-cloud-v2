import { Injectable } from '@nestjs/common';
import { IntegrationProvider } from './integration-provider.interface';
import { IntegrationResilienceService } from '../resilience/integration-resilience.service';
import { IdempotencyService } from '../resilience/idempotency.service';

@Injectable()
export class MockIntegrationProvider implements IntegrationProvider {
  readonly type = 'MOCK';

  constructor(
    private readonly resilienceService: IntegrationResilienceService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  async connect(_config: Record<string, unknown>): Promise<void> {
    // Mock connection: no external system is contacted.
  }

  async disconnect(): Promise<void> {
    // Nothing to disconnect.
  }

  async healthCheck() {
    return {
      status: 'HEALTHY' as const,
      message: 'Mock integration provider is available',
    };
  }

  async execute(operation: string, payload?: unknown): Promise<unknown> {
    const idempotencyKey =
      typeof payload === 'object' &&
      payload !== null &&
      'idempotencyKey' in payload
        ? String((payload as { idempotencyKey: unknown }).idempotencyKey)
        : undefined;

    const executeOperation = () =>
      this.resilienceService.execute(
        async () => ({
          success: true,
          provider: this.type,
          operation,
          payload: payload ?? null,
        }),
        {
          timeout: {
            timeoutMs: 5000,
          },
          retry: {
            maxAttempts: 3,
            initialDelayMs: 500,
            maxDelayMs: 5000,
            backoffMultiplier: 2,
          },
          circuitBreaker: {
            failureThreshold: 5,
            resetTimeoutMs: 10_000,
          },
        },
      );

    if (!idempotencyKey) {
      return executeOperation();
    }

    return this.idempotencyService.execute(idempotencyKey, executeOperation);
  }
}
