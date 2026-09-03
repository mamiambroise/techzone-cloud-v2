import { describe, expect, it } from '@jest/globals';
import { PackRuntimeService } from './pack-runtime.service';
import type { PrismaService } from '../../prisma/prisma.service';
import type { RuntimeBridgeService } from '../business-manager/runtime/runtime-bridge.service';
import { RuntimeCacheService } from './runtime-cache.service';

function service() {
  return new PackRuntimeService(
    {} as PrismaService,
    {} as RuntimeBridgeService,
    new RuntimeCacheService(),
  ) as PackRuntimeService & {
    sanitize(value: unknown): unknown;
    matches(expression: unknown, context: Record<string, unknown>): boolean;
  };
}

describe('PackRuntimeService contract guards', () => {
  it('rejects a tenant supplied by the caller when it differs from the JWT', async () => {
    await expect(
      service().resolve(
        {
          tenantId: 'tenant-b',
          applicationId: 'app',
          packCode: 'stock',
          packVersion: '1.0.0',
          environment: 'PROD',
        },
        { id: 'user', tenantId: 'tenant-a' },
      ),
    ).rejects.toThrow('TENANT_CONTEXT_MISMATCH');
  });

  it('redacts credentials recursively from the runtime context', () => {
    expect(
      service().sanitize({
        locale: 'fr',
        accessToken: 'forbidden',
        nested: { databaseCredentials: 'forbidden', value: 2 },
      }),
    ).toEqual({ locale: 'fr', nested: { value: 2 } });
  });

  it('evaluates only registered context fields', () => {
    const runtime = service();
    const context = { subscription: { plan: 'PRO' } };
    expect(
      runtime.matches(
        { field: 'subscription.plan', operator: 'EQ', value: 'PRO' },
        context,
      ),
    ).toBe(true);
    expect(
      runtime.matches(
        { field: 'accessToken', operator: 'EXISTS' },
        { accessToken: 'x' },
      ),
    ).toBe(false);
  });
});
