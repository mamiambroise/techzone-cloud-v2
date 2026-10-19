import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IamError } from './iam-error';

/**
 * Brute force protection (LOT 4).
 *
 * Opérant réellement sur : login, MFA, recovery, refresh. Deux niveaux :
 * - `assertNotLocked` : refuse (429 AUTH_TEMP_LOCKED) tant que le verrou
 *   temporaire de sécurité est actif ;
 * - `recordFailure` / `recordSuccess` : compteur par fenêtre glissante
 *   simple ; dépassement du seuil ⇒ verrou TTL + événement `auth.temp_lock`.
 *
 * Store en mémoire de processus : mono-instance (le runtime actuel). Une
 * intégration Redis remplacerait le store sans changer le contrat si le
 * déploiement devient distribué.
 */

export const SECURITY_LOCKOUT = {
  LOGIN_MAX_ATTEMPTS: Number(process.env.LOGIN_MAX_ATTEMPTS || 5),
  LOGIN_WINDOW_MS: Number(process.env.LOGIN_WINDOW_MS || 15 * 60 * 1000),
  LOGIN_LOCK_MS: Number(process.env.LOGIN_LOCK_MS || 10 * 60 * 1000),
  MFA_MAX_ATTEMPTS: Number(process.env.MFA_MAX_ATTEMPTS || 5),
  MFA_WINDOW_MS: Number(process.env.MFA_WINDOW_MS || 15 * 60 * 1000),
  MFA_LOCK_MS: Number(process.env.MFA_LOCK_MS || 10 * 60 * 1000),
  RECOVERY_MAX_ATTEMPTS: Number(process.env.RECOVERY_MAX_ATTEMPTS || 5),
  RECOVERY_WINDOW_MS: Number(process.env.RECOVERY_WINDOW_MS || 30 * 60 * 1000),
  RECOVERY_LOCK_MS: Number(process.env.SECURITY_LOCK_MS || 15 * 60 * 1000),
};

export interface ThrottlePolicy {
  maxAttempts: number;
  windowMs: number;
  lockMs: number;
}

interface ThrottleEntry {
  windowStart: number;
  count: number;
  lockedUntil: number | null;
}

@Injectable()
export class IamThrottleService implements OnModuleDestroy {
  private static readonly logger = new Logger(IamThrottleService.name);
  private readonly store = new Map<string, ThrottleEntry>();
  private gcTimer: ReturnType<typeof setInterval> | null = setInterval(
    () => this.gc(),
    60_000,
  );

  constructor(private readonly prisma: PrismaService) {
    // The interval is only an opportunistic memory cleanup. It must not keep a
    // process alive on its own (notably for a graceful shutdown or a direct
    // service instance in a unit test).
    this.gcTimer.unref?.();
  }

  /**
   * Refuse explicitement si un verrou temporaire est actif pour la clé.
   */
  assertNotLocked(bucket: string, key: string): void {
    const entry = this.get(bucket, key);
    if (!entry?.lockedUntil) return;
    const now = Date.now();
    if (entry.lockedUntil > now) {
      throw new IamError(
        `Trop de tentatives. Réessayez plus tard (${Math.ceil((entry.lockedUntil - now) / 1000)}s).`,
        429,
        'AUTH_TEMP_LOCKED',
      );
    }
    // Verrou expiré : purge, la fenêtre repart à zéro.
    entry.lockedUntil = null;
    entry.count = 0;
    entry.windowStart = now;
  }

  isLocked(bucket: string, key: string): boolean {
    const entry = this.get(bucket, key);
    return Boolean(entry?.lockedUntil && entry.lockedUntil > Date.now());
  }

  /**
   * Enregistre un échec. Retourne true si le verrou a été déclenché
   * (seuil atteint) ; crée alors l'événement de sécurité `auth.temp_lock`.
   */
  async recordFailure(
    bucket: string,
    key: string,
    policy: ThrottlePolicy,
    event?: { userId?: string; metadata?: Record<string, unknown> },
  ): Promise<boolean> {
    const now = Date.now();
    const entry = this.entry(bucket, key);
    if (entry.lockedUntil && entry.lockedUntil > now) {
      return false;
    }
    if (entry.lockedUntil && entry.lockedUntil <= now) {
      // Fin d'un verrou précédent : nouvelle fenêtre.
      entry.lockedUntil = null;
      entry.count = 0;
      entry.windowStart = now;
    }
    if (now - entry.windowStart > policy.windowMs) {
      entry.windowStart = now;
      entry.count = 0;
    }
    entry.count += 1;
    if (entry.count >= policy.maxAttempts) {
      entry.lockedUntil = now + policy.lockMs;
      await this.securityEvent('auth.temp_lock', event, bucket, key, {
        attempts: entry.count,
        lockMs: policy.lockMs,
      });
      return true;
    }
    await this.securityEvent('auth.rate_limit', event, bucket, key, {
      attempts: entry.count,
    });
    return false;
  }

  recordSuccess(bucket: string, key: string): void {
    this.store.delete(this.fullKey(bucket, key));
  }

  private get(bucket: string, key: string): ThrottleEntry | undefined {
    return this.store.get(this.fullKey(bucket, key));
  }

  private entry(bucket: string, key: string): ThrottleEntry {
    const full = this.fullKey(bucket, key);
    let entry = this.store.get(full);
    if (!entry) {
      entry = { windowStart: Date.now(), count: 0, lockedUntil: null };
      this.store.set(full, entry);
    }
    return entry;
  }

  private fullKey(bucket: string, key: string): string {
    return `${bucket}:${key}`;
  }

  private async securityEvent(
    type: 'auth.temp_lock' | 'auth.rate_limit',
    event: { userId?: string; metadata?: Record<string, unknown> } | undefined,
    bucket: string,
    key: string,
    metadata: Record<string, unknown>,
  ) {
    IamThrottleService.logger.warn(
      JSON.stringify({
        event: type.toUpperCase(),
        bucket,
        // Aucun secret ni PII dans les logs : la clé peut contenir un IP/ID.
        key: key.startsWith('ip:') ? '<ip>' : key.slice(0, 12) + '…',
        ...metadata,
      }),
    );
    if (!event?.userId) return;
    await this.prisma.securityEvent.create({
      data: {
        type,
        severity: type === 'auth.temp_lock' ? 'HIGH' : 'MEDIUM',
        userId: event.userId,
        source: 'THROTTLE',
        metadata: { ...metadata, ...(event.metadata ?? {}) } as any,
      },
    });
  }

  private gc(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      const expired = !entry.lockedUntil && now - entry.windowStart > 3600_000;
      const lockExpired =
        entry.lockedUntil !== null && entry.lockedUntil < now - 60_000;
      if (expired || lockExpired) {
        this.store.delete(key);
      }
    }
  }

  onModuleDestroy(): void {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
      this.gcTimer = null;
    }
  }
}
