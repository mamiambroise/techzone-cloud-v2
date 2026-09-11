import { Injectable } from '@nestjs/common';

@Injectable()
export class RuntimeResilienceService {
  summary() {
    return {
      status: 'HEALTHY',
      circuitBreakers: [
        { provider: 'capability-provider', state: 'HALF_OPEN', failThreshold: 5, cooldownMs: 30000 },
      ],
      retryPolicy: { maxRetries: 2, backoffMs: 250, jitter: true, allow: ['timeout', 'network', '502', '503', '504'] },
      timeoutPolicy: { globalResolutionTimeoutMs: 30000, connectTimeoutMs: 5000, requestTimeoutMs: 15000 },
      bulkhead: { concurrentCalls: 8, queueSize: 50 },
      fallbackPolicy: { explicit: true, safe: true, observable: true, contractful: true },
    };
  }

  canRetry(code?: string) {
    return !code || !['401', '403', '404', 'RUNTIME_CONTRACT_UNSUPPORTED', 'RUNTIME_CAPABILITY_MISSING', 'RUNTIME_DEPENDENCY_CONFLICT'].includes(code);
  }

  rootCauseChain() {
    return {
      chain: [
        { step: 'Feature Checkout BLOCKED', impact: 'payment.execute missing' },
        { step: 'Dependency payment.execute MISSING', impact: 'Capability provider unavailable' },
        { step: 'Capability Provider DOWN', impact: 'Circuit breaker OPEN' },
      ],
    };
  }
}
