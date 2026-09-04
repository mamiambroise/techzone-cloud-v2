export interface RetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
}

export interface TimeoutPolicy {
  timeoutMs: number;
}

export interface IdempotencyOptions {
  key: string;
  ttlMs?: number;
}

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerPolicy {
  failureThreshold: number;
  resetTimeoutMs: number;
}

export type RecoveryStrategy = 'RETRY' | 'FAIL' | 'MANUAL_REVIEW';

export interface IntegrationRecoveryPolicy {
  strategy: RecoveryStrategy;
  maxAttempts?: number;
}

export interface IntegrationResiliencePolicy {
  timeout?: TimeoutPolicy;
  retry?: RetryPolicy;
  idempotency?: IdempotencyOptions;
  circuitBreaker?: CircuitBreakerPolicy;
  recovery?: IntegrationRecoveryPolicy;
}
