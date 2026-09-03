import { describe, expect, it, jest } from '@jest/globals';
import { RuntimeCacheService } from './runtime-cache.service';

describe('RuntimeCacheService', () => {
  it('namespaces every key by tenant', () => {
    const cache = new RuntimeCacheService();
    expect(cache.key('tenant-a', 'resolution', { id: 1 })).not.toBe(
      cache.key('tenant-b', 'resolution', { id: 1 }),
    );
  });

  it('expires entries after the configured TTL', () => {
    process.env.RUNTIME_CACHE_TTL_MS = '10';
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_000);
    const cache = new RuntimeCacheService();
    const key = cache.key('tenant-a', 'resolution', { id: 1 });
    cache.set(key, { result: true }, { tenantId: 'tenant-a' }, 'v1');
    now.mockReturnValue(1_011);
    expect(cache.get(key)).toBeUndefined();
    now.mockRestore();
    delete process.env.RUNTIME_CACHE_TTL_MS;
  });

  it('invalidates only the requested tenant and application', () => {
    const cache = new RuntimeCacheService();
    const a = cache.key('tenant-a', 'resolution', { id: 1 });
    const b = cache.key('tenant-b', 'resolution', { id: 1 });
    cache.set(
      a,
      { result: 'a' },
      { tenantId: 'tenant-a', applicationId: 'app-a' },
      'v1',
    );
    cache.set(
      b,
      { result: 'b' },
      { tenantId: 'tenant-b', applicationId: 'app-a' },
      'v1',
    );
    expect(
      cache.invalidate('tenant-a', 'APPLICATION', {
        applicationId: 'app-a',
      }),
    ).toBe(1);
    expect(cache.list('tenant-a')).toHaveLength(0);
    expect(cache.list('tenant-b')).toHaveLength(1);
  });

  it('discards an entry whose integrity hash no longer matches', () => {
    const cache = new RuntimeCacheService();
    const key = cache.key('tenant-a', 'resolution', { id: 1 });
    cache.set(key, { result: true }, { tenantId: 'tenant-a' }, 'v1');
    cache.corruptForTest(key);
    expect(cache.get(key)).toBeUndefined();
    expect(cache.status('tenant-a').metrics.integrityFailure).toBe(1);
  });

  it('joins concurrent loads for the same key', async () => {
    const cache = new RuntimeCacheService();
    let calls = 0;
    const loader = async () => {
      calls += 1;
      await Promise.resolve();
      return { value: 42 };
    };
    const [first, second] = await Promise.all([
      cache.singleFlight('same', loader),
      cache.singleFlight('same', loader),
    ]);
    expect(first).toEqual(second);
    expect(calls).toBe(1);
    expect(cache.status('tenant-a').metrics.singleFlightJoined).toBe(1);
  });
});
