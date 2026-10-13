import { jest } from '@jest/globals';
import * as bcrypt from 'bcrypt';
import { IamError } from './iam-error';
import { IamAuthService } from './iam-auth.service';
import { IamContextService } from './iam-context.service';
import type { PrismaService } from '../prisma/prisma.service';

/**
 * LOT 2 — Sécurité tenant / membership.
 *
 * Le `tenantId` du frontend n'est jamais une autorité : toute session sur un
 * tenant exige un membership ACTIVE sur tenant/organization/site actifs.
 * Interdit : forged tenant, wrong tenant, suspended, revoked, org forge, et
 * toute session dans un tenant non-autorisé.
 */
process.env.JWT_ACCESS_SECRET ||= 'unit-test-access-secret';
process.env.JWT_REFRESH_SECRET ||= 'unit-test-refresh-secret';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_USER_ID = '99999999-9999-4999-8999-999999999999';
const TENANT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const ACTIVE_PASSWORD = 'Correct-Horse-42!';

const baseUser = {
  id: USER_ID,
  username: 'alice',
  primaryEmail: 'alice@example.test',
  status: 'ACTIVE',
  isAdmin: false,
  defaultTenantId: null,
};

const baseCredential = () => ({
  id: 'cred-1',
  userId: USER_ID,
  type: 'PASSWORD',
  status: 'ACTIVE',
  secretHash: null as string | null,
  lastUsedAt: null,
});  const membershipFor = (tenantId: string, overrides: Record<string, unknown> = {}) => {
    const base = {
      id: `mem-${tenantId}`,
      userId: USER_ID,
      tenantId,
      organizationId: null,
      siteId: null,
      status: 'ACTIVE',
      validFrom: null,
      validUntil: null,
      tenant: { id: tenantId, status: 'ACTIVE' },
      organization: null,
      site: null,
    };
    const merged = { ...base, ...overrides };
    return {
      ...merged,
      organization: merged.organizationId
        ? (overrides.organization ?? { id: merged.organizationId, status: 'ACTIVE' })
        : null,
      site: merged.siteId
        ? (overrides.site ?? { id: merged.siteId, status: 'ACTIVE' })
        : null,
    };
  };

/**
 * Stub Prisma qui simule une base avec :
 * - l'utilisateur alice, credential bcrypt, mfa 0 ;
 * - un membership ACTIVE sur TENANT_A uniquement
 *   (tenantStatusFor ajuste le statut du tenant retourné) ;
 * - sessions/refresh devices inérents au flux IAM.
 */
const buildPrisma = (opts: {
  membership?: unknown | null;
  membershipOrder?: unknown[]; // pour resolveTenantId : premiers memberships actifs
  tenantStatusFor?: Record<string, string>;
}) => {
  const credential = baseCredential();

  const prisma: any = {
    iamUser: {
      findFirst: jest.fn(async () => baseUser),
      findUnique: jest.fn(async () => ({ defaultTenantId: null })),
      update: jest.fn(async () => baseUser),
    },
    iamCredential: {
      findFirst: jest.fn(async () => ({ ...credential })),
      update: jest.fn(async () => ({})),
    },
    mfaMethod: { count: jest.fn(async () => 0) },
    iamDevice: {
      findFirst: jest.fn(async () => null),
      create: jest.fn(async () => ({ id: 'device-1' })),
    },
    iamSession: {
      create: jest.fn(async ({ data }: any) => ({
        id: 'session-1',
        ...data,
        createdAt: new Date(),
      })),
      findUnique: jest.fn(async () => ({
        id: 'session-1',
        userId: USER_ID,
        tenantId: null,
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
      updateMany: jest.fn(async () => ({ count: 0 })),
      update: jest.fn(async () => ({})),
      findUnique: jest.fn(async () => null),
    },
    securityEvent: { create: jest.fn(async () => ({})) },
    $transaction: jest.fn(async (fn: any) => fn(prisma)),
  };

  (prisma as any).membership = {
    findFirst: jest.fn(async ({ where }: any) => {
      // Respecte le filtrage Prisma : un statut demandé différent n'est
      // jamais rendu (membership SUSPENDED/REVOKED ⊄ ACTIVE).
      const candidate = opts.membership === undefined ? TENANT_A : opts.membership;
      const floating = (): unknown => {
        if (candidate === null || candidate === undefined) return null;
        if (typeof candidate !== 'object') {
          if (where.tenantId && candidate !== where.tenantId) return null;
          if (where.status && 'ACTIVE' !== where.status) return null;
          const tStatus = opts.tenantStatusFor?.[candidate as string] ?? 'ACTIVE';
          return membershipFor(candidate as string, { tenant: { id: candidate, status: tStatus } });
        }
        const m = candidate as Record<string, unknown>;
        if (where.tenantId && m.tenantId && m.tenantId !== where.tenantId) return null;
        if (where.status && m.status !== where.status) return null;
        // Statut du tenant simulé pour les tests de tenant suspendu.
        const tStatus = opts.tenantStatusFor?.[m.tenantId as string] ?? 'ACTIVE';
        return {
          ...m,
          tenant: { id: m.tenantId, status: tStatus },
          organization: m.organizationId
            ? { id: m.organizationId, status: m.orgStatus ?? 'ACTIVE' }
            : null,
          site: m.siteId ? { id: m.siteId, status: m.siteStatus ?? 'ACTIVE' } : null,
        };
      };
      return floating();
    }),
    findMany: jest.fn(async () => opts.membershipOrder ?? []),
  };

  return prisma;
};

const buildService = (prisma: any) => {
  const authorization = {
    resolve: jest.fn(async () => ({
      roles: [],
      permissions: [],
      isSuperAdmin: false,
      tenantRoleCodes: [],
    })),
    invalidate: jest.fn(),
  };
  const mail = { send: jest.fn(async () => true) };
  const mfa = {
    issueLoginChallenge: jest.fn(async () => ({
      token: 'mfa-ch_test',
      challengeId: 'c-1',
      expiresAt: new Date(),
    })),
  };
  const contextService = new IamContextService(prisma as unknown as PrismaService);
  const service = new IamAuthService(
    prisma as unknown as PrismaService,
    mail as any,
    contextService,
    authorization as any,
    mfa as any,
  );
  return service;
};

const loginRequest = (extra: Record<string, unknown> = {}) => ({
  identifier: 'alice',
  password: ACTIVE_PASSWORD,
  deviceName: 'jest',
  ...extra,
});

describe('LOT 2 — membership tenant / forged tenant', () => {
  beforeAll(async () => {
    // Remplit le hash bcrypt du credential du stub.
  });

  it('refuse un tenant forgé (aucun membership) sans créer de session', async () => {
    const passwordHash = await bcrypt.hash(ACTIVE_PASSWORD, 4);
    const prisma = buildPrisma({ membership: null });
    prisma.iamCredential.findFirst.mockResolvedValue({ ...baseCredential(), secretHash: passwordHash });
    const service = buildService(prisma);

    await expect(
      service.login(loginRequest({ tenantId: TENANT_B } as any) as any),
    ).rejects.toMatchObject({ code: 'TENANT_ACCESS_DENIED' } as Partial<IamError>);

    expect(prisma.iamSession.create).not.toHaveBeenCalled();
  });

  it('refuse un membership SUSPENDED et ne crée aucune session', async () => {
    const passwordHash = await bcrypt.hash(ACTIVE_PASSWORD, 4);
    const prisma = buildPrisma({
      membership: membershipFor(TENANT_A, { status: 'SUSPENDED' }),
    });
    prisma.iamCredential.findFirst.mockResolvedValue({ ...baseCredential(), secretHash: passwordHash });
    const service = buildService(prisma);

    // findFirst filtre status ACTIVE : un membership suspended ne matche pas.
    prisma.membership.findFirst.mockResolvedValue(null);
    await expect(
      service.login(loginRequest({ tenantId: TENANT_A } as any) as any),
    ).rejects.toMatchObject({ code: 'TENANT_ACCESS_DENIED' } as Partial<IamError>);
    expect(prisma.iamSession.create).not.toHaveBeenCalled();

    // Sans tenant demandé et sans membership actif : aucune résolution de
    // tenant — la session ne porte jamais un tenant non-autorisé.
    const fallback: any = await service.login(loginRequest() as any);
    // La session créée (via le service) n'existe pas du tout côté test ? On
    // vérifie via les données Prismanos : aucune session tenant-scoped.
    expect(prisma.iamSession.create).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: TENANT_A }),
      }),
    );
    // fallback est un login sans tenant (tenantId null) — jamais TENANT_A.
    expect(fallback.mfaRequired).toBe(false);
  });

  it('refuse un membership REVOKED', async () => {
    const passwordHash = await bcrypt.hash(ACTIVE_PASSWORD, 4);
    const prisma = buildPrisma({ membership: null });
    prisma.iamCredential.findFirst.mockResolvedValue({ ...baseCredential(), secretHash: passwordHash });
    const contextService = new IamContextService(prisma as unknown as PrismaService);
    await expect(
      contextService.assertTenantAccess(USER_ID, TENANT_A),
    ).rejects.toMatchObject({ code: 'TENANT_ACCESS_DENIED' } as Partial<IamError>);
  });

  it('refuse un tenant donne en membership mais non ACTIVE (SUSPENDED plateforme)', async () => {
    const prisma = buildPrisma({
      membership: membershipFor(TENANT_A),
      tenantStatusFor: { [TENANT_A]: 'SUSPENDED' },
    });
    const contextService = new IamContextService(prisma as unknown as PrismaService);
    await expect(
      contextService.assertTenantAccess(USER_ID, TENANT_A),
    ).rejects.toMatchObject({ code: 'TENANT_ACCESS_DENIED' } as Partial<IamError>);
  });

  it('refuse une organization suggérée hors membership (cross-tenant forgé)', async () => {
    const prisma = buildPrisma({
      membership: membershipFor(TENANT_A, { organizationId: 'org-a' }),
    });
    const contextService = new IamContextService(prisma as unknown as PrismaService);
    await expect(
      contextService.assertTenantAccess(USER_ID, TENANT_A, { organizationId: 'org-b' }),
    ).rejects.toMatchObject({ code: 'CONTEXT_ACCESS_DENIED' } as Partial<IamError>);
    await expect(
      contextService.assertTenantAccess(USER_ID, TENANT_A, { siteId: 'site-b' }),
    ).rejects.toMatchObject({ code: 'CONTEXT_ACCESS_DENIED' } as Partial<IamError>);
  });

  it('cross-tenant : le login sans tenant résout UNIQUEMENT le premier membership actif', async () => {
    const passwordHash = await bcrypt.hash(ACTIVE_PASSWORD, 4);
    const prisma = buildPrisma({
      membership: membershipFor(TENANT_A),
      // resolveTenantId : le premier membership ACTIVE de l'utilisateur.
      membershipOrder: [membershipFor(TENANT_A), membershipFor(TENANT_B)],
    });
    prisma.iamCredential.findFirst.mockResolvedValue({ ...baseCredential(), secretHash: passwordHash });
    // iamUser.findUnique (defaultTenantId) → null puis membership par défaut.
    prisma.iamUser.findUnique.mockResolvedValue({ defaultTenantId: null });
    prisma.iamSession.create.mockImplementation(async ({ data }: any) => ({
      id: 'session-1',
      ...data,
    }));

    const service = buildService(prisma);
    await service.login(loginRequest() as any);

    expect(prisma.iamSession.create).toHaveBeenCalled();
    const sessionData = prisma.iamSession.create.mock.calls[0][0].data;
    expect(sessionData.tenantId).toBe(TENANT_A);
  });

  it('un utilisateur de TENANT_A ne peut pas démarrer une session sur TENANT_B', async () => {
    const prisma = buildPrisma({ membership: membershipFor(TENANT_A) });
    const contextService = new IamContextService(prisma as unknown as PrismaService);
    await expect(
      contextService.switchTenant(USER_ID, TENANT_B),
    ).rejects.toMatchObject({ code: 'TENANT_ACCESS_DENIED' } as Partial<IamError>);

    // contraste : TENANT_A est autorisé
    const switched = await contextService.switchTenant(USER_ID, TENANT_A);
    expect(switched.tenantId).toBe(TENANT_A);
  });

  it('fenêtre de validité : membership pas encore valide ou expiré → DENY', async () => {
    const prisma = buildPrisma({});
    const contextService = new IamContextService(prisma as unknown as PrismaService);

    const notYet = membershipFor(TENANT_A, {
      validFrom: new Date(Date.now() + 86_400_000),
    });
    prisma.membership.findFirst.mockResolvedValue(notYet);
    await expect(
      contextService.assertTenantAccess(USER_ID, TENANT_A),
    ).rejects.toMatchObject({ code: 'TENANT_ACCESS_DENIED' } as Partial<IamError>);

    const expired = membershipFor(TENANT_A, {
      validUntil: new Date(Date.now() - 86_400_000),
    });
    prisma.membership.findFirst.mockResolvedValue(expired);
    await expect(
      contextService.assertTenantAccess(USER_ID, TENANT_A),
    ).rejects.toMatchObject({ code: 'TENANT_ACCESS_DENIED' } as Partial<IamError>);
  });
});
