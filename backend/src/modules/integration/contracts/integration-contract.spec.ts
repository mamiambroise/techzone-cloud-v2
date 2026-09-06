import { MockIntegrationProvider } from '../../../common/providers/mock-integration.provider';
import { RealIntegrationProvider } from '../../../common/providers/real-integration.provider';
import { IntegrationProvider } from '../../../common/providers/integration-provider.interface';
import { IntegrationResilienceService } from '../../../common/resilience/integration-resilience.service';
import { IdempotencyService } from '../../../common/resilience/idempotency.service';

describe('IntegrationContract', () => {
  const providers: IntegrationProvider[] = [
    new MockIntegrationProvider(
      new IntegrationResilienceService(),
      new IdempotencyService(),
    ),
    new RealIntegrationProvider(
      new IntegrationResilienceService(),
      new IdempotencyService(),
    ),
  ];

  describe.each(providers.filter((p) => p.type === 'MOCK'))(
    'MockIntegrationProvider (type=$type)',
    (provider) => {
      it('should expose a type property', () => {
        expect(provider.type).toBeDefined();
        expect(typeof provider.type).toBe('string');
      });

      it('should connect successfully', async () => {
        await expect(provider.connect({})).resolves.toBeUndefined();
      });

      it('should disconnect successfully', async () => {
        await expect(provider.disconnect()).resolves.toBeUndefined();
      });

      it('should return valid health status', async () => {
        const health = await provider.healthCheck();
        expect(['HEALTHY', 'WARNING', 'DEGRADED', 'CRITICAL', 'UNKNOWN']).toContain(
          health.status,
        );
      });

      it('should execute an operation with success response', async () => {
        const result = await provider.execute('test.operation', { value: 'test' });

        expect(result).toEqual({
          success: true,
          provider: provider.type,
          operation: 'test.operation',
          payload: { value: 'test' },
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
    },
  );
});
