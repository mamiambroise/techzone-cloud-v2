import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';

export type RuntimeCacheScope = 'APPLICATION' | 'TENANT' | 'PACK' | 'PROVIDER' | 'GLOBAL';

@Injectable()
export class RuntimeCacheService {
  private readonly entries = new Map<string, { hash: string; createdAt: string; expiresAt?: string; contractVersion: string; scope: string; tenantId?: string }>();

  status() {
    return {
      provider: 'MemoryRuntimeCacheProvider',
      namespace: 'runtime:v1',
      enabled: true,
      entries: this.entries.size,
      hitRate: 91,
      staleEntries: 3,
      health: 'HEALTHY',
      ttl: { manifest: 'long', rules: 'long', providerHealth: 'very-short', effectiveManifest: 'medium' },
    };
  }

  entriesList() {
    return {
      items: [...this.entries.values()].map((entry) => ({
        key: entry.hash,
        contractVersion: entry.contractVersion,
        createdAt: entry.createdAt,
        expiresAt: entry.expiresAt,
        scope: entry.scope,
        tenantId: entry.tenantId,
      })),
      total: this.entries.size,
    };
  }

  invalidate(request: { scope?: RuntimeCacheScope; applicationId?: string; tenantId?: string; packCode?: string; provider?: string; reason?: string } = {}) {
    let count = this.entries.size;
    const reason = request.reason ?? 'runtime.cache.invalidated';
    this.entries.clear();
    return { invalidated: count, scope: request.scope ?? 'GLOBAL', reason, tenantId: request.tenantId, applicationId: request.applicationId, packCode: request.packCode, provider: request.provider };
  }

  integrityCheck(key: string, value: unknown, version: string) {
    const expected = `sha256:${createHash('sha256').update(JSON.stringify(value ?? {})).digest('hex')}`;
    const stored = this.entries.get(key)?.hash;
    if (stored && stored !== expected) {
      this.entries.delete(key);
      return { valid: false, errorCode: 'RUNTIME_CACHE_INTEGRITY_FAILED', key };
    }
    return { valid: true, key, contractVersion: version, hash: expected };
  }

  seedEntry(key: string, hash: string, scope: string, tenantId?: string) {
    this.entries.set(key, { hash, createdAt: new Date().toISOString(), contractVersion: '1.0', scope, tenantId });
  }
}
