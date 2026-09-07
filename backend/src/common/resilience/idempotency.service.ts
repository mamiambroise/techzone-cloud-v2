import { Injectable } from '@nestjs/common';

interface IdempotencyEntry {
  result: unknown;
  expiresAt: number;
}

@Injectable()
export class IdempotencyService {
  private readonly store = new Map<string, IdempotencyEntry>();

  async execute<T>(
    key: string,
    operation: () => Promise<T>,
    ttlMs = 300_000,
  ): Promise<T> {
    const existing = this.store.get(key);

    if (existing) {
      if (existing.expiresAt > Date.now()) {
        return existing.result as T;
      }

      this.store.delete(key);
    }

    const result = await operation();

    this.store.set(key, {
      result,
      expiresAt: Date.now() + ttlMs,
    });

    return result;
  }

  has(key: string): boolean {
    const entry = this.store.get(key);

    if (!entry) {
      return false;
    }

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}