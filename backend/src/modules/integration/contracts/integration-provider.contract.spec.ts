import { MockIntegrationProvider } from '../../../common/providers/mock-integration.provider';
import { IntegrationResilienceService } from '../../../common/resilience/integration-resilience.service';
import { IdempotencyService } from '../../../common/resilience/idempotency.service';

describe('IntegrationProvider Contract', () => {
  let provider: MockIntegrationProvider;

  beforeEach(() => {
    provider = new MockIntegrationProvider(
      new IntegrationResilienceService(),
      new IdempotencyService(),
    );
  });

  it('should expose a provider type', () => {
    expect(provider.type).toBeDefined();
    expect(typeof provider.type).toBe('string');
  });

  it('should connect successfully', async () => {
    await expect(provider.connect({})).resolves.toBeUndefined();
  });

  it('should disconnect successfully', async () => {
    await expect(provider.disconnect()).resolves.toBeUndefined();
  });

  it('should return a valid health status', async () => {
    const health = await provider.healthCheck();

    expect(['HEALTHY', 'WARNING', 'DEGRADED', 'CRITICAL', 'UNKNOWN']).toContain(
      health.status,
    );
  });

  it('should execute an operation', async () => {
    const result = await provider.execute('test.operation', {
      value: 'test',
    });

    expect(result).toEqual({
      success: true,
      provider: 'MOCK',
      operation: 'test.operation',
      payload: {
        value: 'test',
      },
    });
  });

  it('should support idempotent execution', async () => {
    const payload = {
      idempotencyKey: 'contract-test-001',
      value: 'test',
    };

    const first = await provider.execute('test.operation', payload);

    const second = await provider.execute('test.operation', payload);

    expect(second).toEqual(first);
  });
});
