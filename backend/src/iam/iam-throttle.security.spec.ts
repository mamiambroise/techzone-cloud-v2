import { jest } from '@jest/globals';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { IamError } from './iam-error';
import { IamAuthService } from './iam-auth.service';
import { IamContextService } from './iam-context.service';
import { IamThrottleService, SECURITY_LOCKOUT } from './iam-throttle.service';
import { iamHttpThrottle } from './iam-http-throttle.middleware';
import * as bcrypt from 'bcrypt';
import type { PrismaService } from '../prisma/prisma.service';
import type { Request, Response } from 'express';

/**
 * LOT 4 — Rate limit / lockout.
 *
 * Seuil → tentative 5 : verrou temporaire TTL + auth.temp_lock ; refus 429
 * AUTH_TEMP_LOCKED avant toute vérification de credential ; reset au
 * succès ; fenêtres indépendantes par bucket ; middleware par IP.
 */
process.env.JWT_ACCESS_SECRET ||= 'unit-test-access-secret';
process.env.JWT_REFRESH_SECRET ||= 'unit-test-refresh-secret';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const TENANT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PASSWORD = 'Correct-Horse-42!';

const smallPolicy = { maxAttempts: 3, windowMs: 60_000, lockMs: 60_000 };

const prismaEventStub = () => ({ securityEvent: { create: jest.fn() } } as unknown as PrismaService);

const newThrottle = () => new IamThrottleService(prismaEventStub());

describe('IamThrottleService — seuil, verrou TTL, reset', () => {
  const USER2 = '22222222-2222-4222-8222-222222222222';
  void USER2;

  it("n'est pas locked avant le seuil", () => {
    const t = newThrottle();
    expect(t.isLocked('login', 'k1')).toBe(false);
  });

  it('verrouille au seuil (recordFailure true) puis refuse 429', async () => {
    const t = newThrottle();
    expect(await t.recordFailure('login', 'k2', smallPolicy, { userId: USER_ID })).toBe(false);
    expect(await t.recordFailure('login', 'k2', smallPolicy, { userId: USER_ID })).toBe(false);
    expect(await t.recordFailure('login', 'k2', smallPolicy, { userId: USER_ID })).toBe(true); // seuil
    expect(t.isLocked('login', 'k2')).toBe(true);
    expect(() => t.assertNotLocked('login', 'k2')).toThrow(IamError);
    try {
      t.assertNotLocked('login', 'k2');
    } catch (e) {
      expect((e as IamError).statusCode).toBe(429);
      expect((e as IamError).code).toBe('AUTH_TEMP_LOCKED');
    }
  });

  it('clés indépendantes par bucket', async () => {
    const t = newThrottle();
    await t.recordFailure('mfa', 'k3', smallPolicy, { userId: USER_ID });
    await t.recordFailure('mfa', 'k3', smallPolicy, { userId: USER_ID });
    await t.recordFailure('mfa', 'k3', smallPolicy, { userId: USER_ID });
    expect(t.isLocked('mfa', 'k3')).toBe(true);
    expect(t.isLocked('login', 'k3')).toBe(false);
  });

  it('recordSuccess réinitialise le compteur du même bucket', async () => {
    const t = newThrottle();
    const p = { maxAttempts: 2, windowMs: 60_000, lockMs: 60_000 };
    await t.recordFailure('login', 'k4', p, { userId: USER_ID });
    t.recordSuccess('login', 'k4');
    expect(await t.recordFailure('login', 'k4', p, { userId: USER_ID })).toBe(false);
    expect(await t.recordFailure('login', 'k4', p, { userId: USER_ID })).toBe(true);
  });

  it('TTL : le verrou expire et repart à zéro', async () => {
    const t = newThrottle();
    const p = { maxAttempts: 1, windowMs: 60_000, lockMs: 40 };
    await t.recordFailure('login', 'k5', p, { userId: USER_ID });
    expect(t.isLocked('login', 'k5')).toBe(true);
    await new Promise((r) => setTimeout(r, 60));
    expect(t.isLocked('login', 'k5')).toBe(false);
    expect(() => t.assertNotLocked('login', 'k5')).not.toThrow();
  });

  it('crée auth.temp_lock au déclenchement avec userId connu', async () => {
    const securityEvent = { create: jest.fn() };
    const prisma = { securityEvent } as unknown as PrismaService;
    const t = new IamThrottleService(prisma);
    await t.recordFailure('recovery', 'k6', smallPolicy, { userId: USER_ID });
    // Non déclenché : seulement auth.rate_limit.
    expect(securityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: 'auth.rate_limit' }) }),
    );
    await t.recordFailure('recovery', 'k6', smallPolicy, { userId: USER_ID });
    await t.recordFailure('recovery', 'k6', smallPolicy, { userId: USER_ID });
    expect(securityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: 'auth.temp_lock' }) }),
    );
  });
});

describe('densité login — lockout temporaire serveur', () => {
  const buildService = (password: string) => {
    void password;
    return null as unknown as IamAuthService;
  };
  void buildService;

  const buildAuthService = () => {
    const credential = {
      id: 'cred-1',
      status: 'ACTIVE',
      secretHash: bcryptSync(PASSWORD),
    };
    const baseUser = {
      id: USER_ID,
      username: 'bob',
      primaryEmail: 'bob@example.test',
      status: 'ACTIVE',
      isAdmin: false,
      defaultTenantId: null,
    };
    const prisma: any = {
      iamUser: {
        findFirst: jest.fn(async () => baseUser),
        findUnique: jest.fn(async () => ({ defaultTenantId: null })),
        update: jest.fn(async () => ({})),
      },
      iamCredential: {
        findFirst: jest.fn(async () => credential),
        update: jest.fn(async () => ({})),
      },
      mfaMethod: { count: jest.fn(async () => 0) },
      iamDevice: {
        findFirst: jest.fn(async () => null),
        create: jest.fn(async () => ({ id: 'd-1' })),
      },
      iamSession: {
        create: jest.fn(async ({ data }: any) => ({ id: 's-1', ...data })),
        findUnique: jest.fn(async ({ where }: any) => ({
          id: where.id,
          userId: USER_ID,
          tenantId: TENANT_A,
          organizationId: null,
          status: 'ACTIVE',
          authenticationLevel: 'PASSWORD',
          expiresAt: new Date(Date.now() + 3600_000),
          idleExpiresAt: new Date(Date.now() + 1800_000),
          lastActivityAt: new Date(),
        })),
        update: jest.fn(async () => ({})),
        updateMany: jest.fn(async () => ({ count: 0 })),
      },
      iamRefreshToken: {
        create: jest.fn(async ({ data }: any) => ({ id: 'rt-1', ...data })),
        findUnique: jest.fn(async () => null),
        update: jest.fn(async () => ({})),
        updateMany: jest.fn(async () => ({ count: 0 })),
      },
      securityEvent: { create: jest.fn(async () => ({})) },
      membership: {
        findFirst: jest.fn(async ({ where }: any) =>
          where.tenantId && where.tenantId !== TENANT_A
            ? null
            : {
                userId: USER_ID,
                tenantId: TENANT_A,
                status: 'ACTIVE',
                validFrom: null,
                validUntil: null,
                organizationId: null,
                siteId: null,
                tenant: { id: TENANT_A, status: 'ACTIVE' },
                organization: null,
                site: null,
              },
        ),
        findMany: jest.fn(async () => []),
      },
      identity: { findUnique: jest.fn(async () => null) },
      $transaction: jest.fn(async (fn: any) => fn(prisma)),
    };
    const contextService = new IamContextService(prisma as unknown as PrismaService);
    const throttle = new IamThrottleService(prisma as unknown as PrismaService);
    const authorization = {
      resolve: jest.fn(async () => ({ roles: [], permissions: [], isSuperAdmin: false, tenantRoleCodes: [] })),
      invalidate: jest.fn(),
    };
    const mail = { send: jest.fn(async () => true) };
    const mfa = {
      issueLoginChallenge: jest.fn(async () => ({ token: 't', challengeId: 'c', expiresAt: new Date() })),
    };
    const svc = new IamAuthService(
      prisma as unknown as PrismaService,
      mail as any,
      contextService,
      authorization as any,
      mfa as any,
      throttle,
    );
    return { svc, throttle };
  };

  it('429 AUTH_TEMP_LOCKED après le seuil mémé avec un password correct', async () => {
    const { svc, throttle } = buildAuthService();

    // 5 échecs (mauvais mot de passe).
    for (let i = 0; i < SECURITY_LOCKOUT.LOGIN_MAX_ATTEMPTS; i += 1) {
      await expect(
        svc.login(
          {
            identifier: 'bob',
            password: 'mauvais mot de passe',
            deviceName: 'jest',
          } as any,
          '203.0.113.9',
        ),
      ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' } as Partial<IamError>);
    }

    // Verrou actif : même password correct → 429 avant vérification.
    expect(throttle.isLocked('login', 'ident:bob')).toBe(true);
    await expect(
      svc.login({ identifier: 'bob', password: PASSWORD } as any, '203.0.113.9'),
    ).rejects.toMatchObject({ code: 'AUTH_TEMP_LOCKED' } as Partial<IamError>);

    // Le lockout identité bloque AUSSI par IP différente : le verrou de
    // sécurité est réellement appliqué (pas juste un filtre IP).
    await expect(
      svc.login({ identifier: 'bob', password: PASSWORD } as any, '198.51.100.5'),
    ).rejects.toMatchObject({ code: 'AUTH_TEMP_LOCKED' } as Partial<IamError>);
  });

  it('succès réinitialise le compteur de lockout', async () => {
    const { svc, throttle } = buildAuthService();
    const ip = '203.0.113.10';
    await expect(
      svc.login({ identifier: 'bob', password: 'encore-mauvais' } as any, ip),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' } as Partial<IamError>);
    await svc.login({ identifier: 'bob', password: PASSWORD } as any, ip);
    expect(throttle.isLocked('login', `ip:${ip}`)).toBe(false);
    expect(throttle.isLocked('login', 'ident:bob')).toBe(false);
  });
});

describe('middleware HTTP — limite par IP sur routes sensibles', () => {
  const makeReq = (path: string, ip: string) =>
    ({ originalUrl: path, path, ip } as unknown as Request);
  const makeRes = () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }) as any) as any;
    const headersMap = new Map<string, string>();
    const res: Response = {
      status,
      json,
      setHeader: (k: string, v: string) => {
        headersMap.set(k, v);
      },
    } as any;
    return { res, status, json, headersMap };
  };

  it('laisse passer les requêtes des routes non réglementées', () => {
    const next = jest.fn();
    const mw = iamHttpThrottle();
    mw(makeReq('/api/iam/auth/me', '1.2.3.4'), makeRes().res, next);
    expect(next).toHaveBeenCalled();
  });

  it('ne dépasse pas un routage régulier utilisé 30 fois (login)', () => {
    const mw = iamHttpThrottle();
    const ip = '198.51.100.77';
    for (let i = 0; i < 30; i += 1) {
      const next = jest.fn();
      mw(makeReq('/api/iam/auth/login', ip), makeRes().res, next);
      expect(next).toHaveBeenCalled();
    }
    const next = jest.fn();
    const { res, status, json } = makeRes();
    mw(makeReq('/api/iam/auth/login', ip), res, next);
    expect(status).toHaveBeenCalledWith(429);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'AUTH_RATE_LIMITED' }),
    );
    expect(next).not.toHaveBeenCalled();
  });
});

function bcryptSync(plain: string): string {
  return bcrypt.hashSync(plain, 4);
}

beforeEach(() => {
  // Hooks minimal — les tests créent leurs stubs dans chaque corps.
});
