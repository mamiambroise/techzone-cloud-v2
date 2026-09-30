import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';

type CacheMetadata = {
  tenantId: string;
  applicationId?: string;
  packCode?: string;
  provider?: string;
};

type CacheEntry<T = unknown> = CacheMetadata & {
  key: string;
  value: T;
  valueHash: string;
  createdAt: number;
  expiresAt: number;
  sourceRevision: string;
  contractVersion: string;
};

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`)
      .join(',')}}`;
  return JSON.stringify(value);
}

function digest(value: unknown): string {
  return `sha256:${createHash('sha256').update(stable(value)).digest('hex')}`;
}

@Injectable()
export class RuntimeCacheService {
  private readonly logger = new Logger(RuntimeCacheService.name);
  private readonly entries = new Map<string, CacheEntry>();
  private readonly flights = new Map<string, Promise<unknown>>();
  private readonly ttlMs = Math.max(
    1,
    Number(process.env.RUNTIME_CACHE_TTL_MS ?? 30_000),
  );
  private readonly maxEntries = Math.max(
    10,
    Number(process.env.RUNTIME_CACHE_MAX_ENTRIES ?? 1_000),
  );
  private readonly tenantCounters = new Map<string, { hit:number; miss:number; expired:number; integrityFailure:number; invalidated:number; singleFlightJoined:number }>();
  private metrics(tenantId: string) {
    if (!this.tenantCounters.has(tenantId)) this.tenantCounters.set(tenantId, {
    hit: 0,
    miss: 0,
    expired: 0,
    integrityFailure: 0,
    invalidated: 0,
    singleFlightJoined: 0,
    });
    return this.tenantCounters.get(tenantId)!;
  }

  key(
    tenantId: string,
    scope: string,
    identity: Record<string, unknown>,
  ): string {
    return `runtime:v1:${tenantId}:${scope}:${digest(identity)}`;
  }

  get<T>(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) {
      this.metrics(key.split(':')[2]).miss += 1;
      return undefined;
    }
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      this.metrics(key.split(':')[2]).expired += 1;
      this.metrics(key.split(':')[2]).miss += 1;
      return undefined;
    }
    if (digest(entry.value) !== entry.valueHash) {
      this.entries.delete(key);
      this.metrics(key.split(':')[2]).integrityFailure += 1;
      this.metrics(key.split(':')[2]).miss += 1;
      this.logger.warn(`RUNTIME_CACHE_INTEGRITY_FAILED key=${key}`);
      return undefined;
    }
    this.metrics(key.split(':')[2]).hit += 1;
    return structuredClone(entry.value) as T;
  }

  set<T>(
    key: string,
    value: T,
    metadata: CacheMetadata,
    sourceRevision: string,
  ): void {
    if (this.entries.size >= this.maxEntries) {
      const oldest = [...this.entries.values()].sort(
        (a, b) => a.createdAt - b.createdAt,
      )[0];
      if (oldest) this.entries.delete(oldest.key);
    }
    const now = Date.now();
    const safeValue = structuredClone(value);
    this.entries.set(key, {
      ...metadata,
      key,
      value: safeValue,
      valueHash: digest(safeValue),
      createdAt: now,
      expiresAt: now + this.ttlMs,
      sourceRevision,
      contractVersion: 'v1',
    });
  }

  async singleFlight<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const existing = this.flights.get(key);
    if (existing) {
      this.metrics(key.split(':')[2]).singleFlightJoined += 1;
      return existing as Promise<T>;
    }
    const flight = loader().finally(() => this.flights.delete(key));
    this.flights.set(key, flight);
    return flight;
  }

  invalidate(
    tenantId: string,
    scope: string,
    selector: Record<string, unknown> = {},
    global = false,
  ): number {
    let removed = 0;
    for (const [key, entry] of this.entries) {
      const matchesTenant = global || entry.tenantId === tenantId;
      const matches =
        scope === 'GLOBAL' ||
        scope === 'TENANT' ||
        (scope === 'ENTRY' && selector.key === key) ||
        (scope === 'APPLICATION' &&
          selector.applicationId === entry.applicationId) ||
        (scope === 'PACK' && selector.packCode === entry.packCode) ||
        (scope === 'PROVIDER' && selector.provider === entry.provider);
      if (matchesTenant && matches) {
        this.entries.delete(key);
        removed += 1;
      }
    }
    this.metrics(tenantId).invalidated += removed;
    return removed;
  }

  status(tenantId: string, global = false) {
    const visible = [...this.entries.values()].filter(
      (entry) => global || entry.tenantId === tenantId,
    );
    return {
      layer: 'L1_MEMORY',
      available: true,
      redisConfigured: false,
      ttlMs: this.ttlMs,
      maxEntries: this.maxEntries,
      entries: visible.length,
      inFlight: [...this.flights.keys()].filter(key => key.startsWith(`runtime:v1:${tenantId}:`)).length,
      metrics: { ...this.metrics(tenantId) },
    };
  }

  list(tenantId: string, global = false) {
    return [...this.entries.values()]
      .filter((entry) => global || entry.tenantId === tenantId)
      .map(({ value: _value, ...metadata }) => ({
        ...metadata,
        state: metadata.expiresAt > Date.now() ? 'FRESH' : 'EXPIRED',
      }));
  }

  /** Test-only corruption hook; never exposes cached values. */
  corruptForTest(key: string): void {
    const item = this.entries.get(key);
    if (item) item.valueHash = 'sha256:corrupted';
  }
}
