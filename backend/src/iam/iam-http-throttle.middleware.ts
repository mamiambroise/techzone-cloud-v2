import type { NextFunction, Request, Response } from 'express';

/**
 * LOT 4 — rate limiting HTTP par IP sur les endpoints d'authentification
 * sensibles : login, MFA, refresh, recovery (demande réinitialisation),
 * register.
 *
 * Compteurs en mémoire de processus (fenêtre glissante simple). Le store en
 * mémoire suffit au déploiement mono-instance ; un store Redis remplacerait
 * la Map sans changer le contrat si le runtime devient distribué. Aucun
 * secret ni PII dans les logs ; la clé est remplacée par un placeholder.
 */

interface RouteLimit {
  match: RegExp;
  windowMs: number;
  max: number;
}

const ROUTE_LIMITS: RouteLimit[] = [
  { match: /^\/api\/iam\/auth\/login\/?$/, windowMs: 60_000, max: 30 },
  { match: /^\/api\/iam\/auth\/login\/mfa\/?$/, windowMs: 60_000, max: 20 },
  { match: /^\/api\/iam\/auth\/refresh\/?$/, windowMs: 60_000, max: 60 },
  { match: /^\/api\/iam\/auth\/forgot-password\/?$/, windowMs: 15 * 60_000, max: 5 },
  { match: /^\/api\/iam\/auth\/reset-password\/?$/, windowMs: 15 * 60_000, max: 10 },
  { match: /^\/api\/iam\/auth\/register\/?$/, windowMs: 60 * 60_000, max: 10 },
];

interface Bucket {
  windowStart: number;
  count: number;
}

const buckets = new Map<string, Bucket>();

function cleanup(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > 24 * 3600_000) buckets.delete(key);
  }
}

export function iamHttpThrottle() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const route = req.originalUrl?.split('?')[0] ?? req.path ?? '';
    const limit = ROUTE_LIMITS.find((l) => l.match.test(route));
    if (!limit) {
      next();
      return;
    }

    if (buckets.size > 50_000) cleanup(now);

    const ip = req.ip ?? 'unknown';
    const fullKey = `${route}|${ip}`;
    let bucket = buckets.get(fullKey);
    if (!bucket || now - bucket.windowStart > limit.windowMs) {
      bucket = { windowStart: now, count: 0 };
      buckets.set(fullKey, bucket);
    }
    bucket.count += 1;

    if (bucket.count > limit.max) {
      const retryAfter = Math.ceil((bucket.windowStart + limit.windowMs - now) / 1000);
      res.setHeader('Retry-After', String(Math.max(retryAfter, 1)));
      console.warn(
        JSON.stringify({
          event: 'AUTH_RATE_LIMIT',
          route,
          ip: '<ip>',
          attempts: bucket.count,
        }),
      );
      res.status(429).json({
        success: false,
        statusCode: 429,
        code: 'AUTH_RATE_LIMITED',
        message: `Trop de requêtes. Réessayez dans ${Math.max(retryAfter, 1)}s.`,
      });
      return;
    }

    next();
  };
}
