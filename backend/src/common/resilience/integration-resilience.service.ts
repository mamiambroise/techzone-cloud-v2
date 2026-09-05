import { Injectable } from '@nestjs/common';
import {
  CircuitBreakerPolicy,
  CircuitBreakerState,
  IntegrationResiliencePolicy,
  RetryPolicy,
} from '../types/integration.types';

@Injectable()
export class IntegrationResilienceService {
  private circuitState: CircuitBreakerState = 'CLOSED';
  private failureCount = 0;
  private openedAt?: number;

  async execute<T>(
    operation: () => Promise<T>,
    policy: IntegrationResiliencePolicy = {},
  ): Promise<T> {
    this.checkCircuit(policy.circuitBreaker);

    const retryPolicy = policy.retry;

    try {
      const result = retryPolicy
        ? await this.executeWithRetry(
            operation,
            retryPolicy,
            policy.timeout?.timeoutMs,
          )
        : await this.executeWithTimeout(operation, policy.timeout?.timeoutMs);

      this.recordSuccess();

      return result;
    } catch (error) {
      this.recordFailure(policy.circuitBreaker);
      throw error;
    }
  }

  private checkCircuit(policy?: CircuitBreakerPolicy): void {
    if (!policy || this.circuitState === 'CLOSED') {
      return;
    }

    if (this.circuitState === 'OPEN') {
      const elapsed = Date.now() - (this.openedAt ?? Date.now());

      if (elapsed >= policy.resetTimeoutMs) {
        this.circuitState = 'HALF_OPEN';
        return;
      }

      throw new Error('Integration circuit breaker is open');
    }
  }

  private recordSuccess(): void {
    this.failureCount = 0;
    this.circuitState = 'CLOSED';
    this.openedAt = undefined;
  }

  private recordFailure(policy?: CircuitBreakerPolicy): void {
    if (!policy) {
      return;
    }

    this.failureCount++;

    if (this.failureCount >= policy.failureThreshold) {
      this.circuitState = 'OPEN';
      this.openedAt = Date.now();
    }
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    retryPolicy: RetryPolicy,
    timeoutMs?: number,
  ): Promise<T> {
    let attempt = 0;
    let lastError: unknown;

    while (attempt < retryPolicy.maxAttempts) {
      attempt++;

      try {
        return await this.executeWithTimeout(operation, timeoutMs);
      } catch (error) {
        lastError = error;

        if (attempt >= retryPolicy.maxAttempts) {
          throw lastError;
        }

        const multiplier = retryPolicy.backoffMultiplier ?? 2;

        const delay = Math.min(
          retryPolicy.initialDelayMs * Math.pow(multiplier, attempt - 1),
          retryPolicy.maxDelayMs ??
            retryPolicy.initialDelayMs * Math.pow(multiplier, attempt - 1),
        );

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs?: number,
  ): Promise<T> {
    if (!timeoutMs) {
      return operation();
    }

    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    try {
      return await Promise.race([
        operation(),
        new Promise<T>((_, reject) => {
          timeoutHandle = setTimeout(() => {
            reject(new Error('Integration operation timeout'));
          }, timeoutMs);
        }),
      ]);
    } finally {
      if (timeoutHandle !== undefined) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
