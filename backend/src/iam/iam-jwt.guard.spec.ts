import * as jwt from 'jsonwebtoken';
import { Reflector } from '@nestjs/core';
import { IamJwtGuard } from './iam-jwt.guard';
import { IAM_AUDIENCE } from './jwt.util';
import { IAM_ISSUER, ROLE_PERMISSIONS, ROLES } from './iam.constants';
import type { IamAuthorizationService } from './iam-authorization.service';

const EMPTY_AUTHORIZATION = {
  userId: 'user',
  tenantId: null,
  roles: [],
  permissions: [],
  isSuperAdmin: false,
  tenantRoleCodes: [],
  baselineApplied: false,
};

const authorizationStub = (value: unknown = EMPTY_AUTHORIZATION) =>
  ({
    resolve: jest.fn().mockResolvedValue(value),
    invalidate: jest.fn(),
  }) as unknown as IamAuthorizationService;

describe('Local IAM cookie contract', () => {
  const originalFetch = global.fetch;
  const originalSecret = process.env.JWT_ACCESS_SECRET;
  // Une seule valeur de test partagée par toutes les suites JWT (lockout
  // stocké en mémoire inter-suite). Deux valeurs différentes rendent les
  // signatures croisées invalides.
  const testSecret = 'unified-jwt-test-secret';
  beforeEach(() => { process.env.JWT_ACCESS_SECRET = testSecret; });
  afterEach(() => {
    global.fetch = originalFetch;
    if (originalSecret === undefined) delete process.env.JWT_ACCESS_SECRET;
    else process.env.JWT_ACCESS_SECRET = originalSecret;
  });
  const makeContext = (token: string) => {
    const request: any = { headers: { cookie: `iam_access_token=${token}` } };
    return { request, context: { getHandler: () => ({}), getClass: () => ({}), switchToHttp: () => ({ getRequest: () => request }) } as any };
  };
  const refStub = { getAllAndOverride: () => false } as unknown as Reflector;
  // verifyAccessToken exige type==='access' (contrat issu de jwt.util) :
  // chaque token signé ci-dessous porte cette claim pour traverser la
  // vérification de signature et exercer la suite du guard.
  const signAccess = (claims: Record<string, unknown>) =>
    jwt.sign({ type: 'access', ...claims }, testSecret, {
      issuer: IAM_ISSUER,
      audience: IAM_AUDIENCE,
      expiresIn: 60,
    });

  it('resolves permissions from the local user rather than unvalidated token claims', async () => {
    const token = signAccess({ userId: 'user', sessionId: 'session', roles: ['ADMIN'], tenantId: 'old-tenant' });
    const prisma = {
      iamSession: { findUnique: jest.fn().mockResolvedValue({ id: 'session', userId: 'user', status: 'ACTIVE' }), update: jest.fn().mockResolvedValue({}) },
      iamUser: { findUnique: jest.fn().mockResolvedValue({ id: 'user', isAdmin: false }) },
    };
    const auth = { assertSessionUsable: jest.fn().mockResolvedValue(undefined) };
    const localGuard = new IamJwtGuard(refStub, prisma as any, auth as any, authorizationStub());
    const { request, context } = makeContext(token);
    await expect(localGuard.canActivate(context)).resolves.toBe(true);
    expect(prisma.iamSession.findUnique).toHaveBeenCalledWith({ where: { id: 'session' } });
    // Sans tenant actif, le RBAC n'accorde rien : le token ne peut pas y suppléer.
    expect(request.iamAuth.permissions).toEqual([]);
    expect(request.iamAuth.roles).toEqual([ROLES.USER]);
  });

  it('publishes the tenant-scoped permissions resolved by the RBAC, not the legacy role map', async () => {
    const token = signAccess({ userId: 'user', sessionId: 'session' });
    const prisma = {
      iamSession: { findUnique: jest.fn().mockResolvedValue({ id: 'session', userId: 'user', status: 'ACTIVE', tenantId: 'tenant-1' }), update: jest.fn().mockResolvedValue({}) },
      iamUser: { findUnique: jest.fn().mockResolvedValue({ id: 'user', isAdmin: false }) },
    };
    const auth = { assertSessionUsable: jest.fn().mockResolvedValue(undefined) };
    const authorization = authorizationStub({
      ...EMPTY_AUTHORIZATION,
      tenantId: 'tenant-1',
      roles: ['application_manager'],
      tenantRoleCodes: ['application_manager'],
      permissions: ['bm:read', 'bm:write'],
    });
    const localGuard = new IamJwtGuard(refStub, prisma as any, auth as any, authorization);
    const { request, context } = makeContext(token);
    await expect(localGuard.canActivate(context)).resolves.toBe(true);
    expect(authorization.resolve).toHaveBeenCalledWith(
      { id: 'user', isAdmin: false },
      'tenant-1',
    );
    expect(request.iamAuth.permissions).toEqual(['bm:read', 'bm:write']);
    expect(request.iamAuth.tenantRoleCodes).toEqual(['application_manager']);
    expect(request.iamAuth.roles).toEqual(['application_manager']);
  });

  it('refuses a revoked session even with a correctly signed access token', async () => {
    const token = signAccess({ userId: 'user', sessionId: 'revoked' });
    const revokedGuard = new IamJwtGuard(
      refStub,
      { iamSession: { findUnique: jest.fn().mockResolvedValue({ id: 'revoked', userId: 'user' }) } } as any,
      { assertSessionUsable: jest.fn().mockRejectedValue(new Error('Session revoked')) } as any,
      authorizationStub(),
    );
    await expect(revokedGuard.canActivate(makeContext(token).context)).rejects.toThrow('Session revoked');
  });

  it('refuses an MFA challenge as an access token', async () => {
    const token = signAccess({ userId: 'user', sessionId: 'session', purpose: 'step_up' });
    global.fetch = jest.fn();
    await expect(new IamJwtGuard(refStub, {} as any, {} as any, authorizationStub()).canActivate(makeContext(token).context)).rejects.toThrow();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // LOT 5 : le tenantId du JWT (jwt-tenant) ne doit JAMAIS être honoré ; le JWT
  // seul n'est pas une autorité. Le guard lit tenantId depuis la session
  // persistée (session-tenant), ce qui convainc le bind userId/sessionId.
  it('reads tenantId from the live session record instead of the JWT payload', async () => {
    const token = signAccess({ userId: 'user', sessionId: 'session', tenantId: 'jwt-tenant' });
    const prisma = {
      iamSession: { findUnique: jest.fn().mockResolvedValue({ id: 'session', userId: 'user', status: 'ACTIVE', tenantId: 'session-tenant' }), update: jest.fn().mockResolvedValue({}) },
      iamUser: { findUnique: jest.fn().mockResolvedValue({ id: 'user', isAdmin: true }) },
    };
    const auth = { assertSessionUsable: jest.fn().mockResolvedValue(undefined) };
    const localGuard = new IamJwtGuard(
      refStub,
      prisma as any,
      auth as any,
      authorizationStub({
        ...EMPTY_AUTHORIZATION,
        tenantId: 'session-tenant',
        roles: [ROLES.ADMIN],
        permissions: ROLE_PERMISSIONS[ROLES.ADMIN],
        isSuperAdmin: true,
      }),
    );
    const { request, context } = makeContext(token);
    await expect(localGuard.canActivate(context)).resolves.toBe(true);
    expect(request.iamAuth.tenantId).toBe('session-tenant');
    expect(request.iamAuth.isSuperAdmin).toBe(true);
  });
});
