import * as jwt from 'jsonwebtoken';
import { Reflector } from '@nestjs/core';
import { IamJwtGuard } from './iam-jwt.guard';
import { ROLE_PERMISSIONS, ROLES } from './iam.constants';

describe('Local IAM cookie contract', () => {
  const originalFetch = global.fetch;
  const originalSecret = process.env.JWT_ACCESS_SECRET;
  const secret = 'test-only-erp-contract-secret';
  beforeEach(() => { process.env.JWT_ACCESS_SECRET = secret; });
  afterEach(() => {
    global.fetch = originalFetch;
    if (originalSecret === undefined) delete process.env.JWT_ACCESS_SECRET;
    else process.env.JWT_ACCESS_SECRET = originalSecret;
  });
  const makeContext = (token: string) => {
    const request: any = { headers: { cookie: `iam_access_token=${token}` } };
    return { request, context: { getHandler: () => ({}), getClass: () => ({}), switchToHttp: () => ({ getRequest: () => request }) } as any };
  };
  const guard = () => new IamJwtGuard({ getAllAndOverride: () => false } as unknown as Reflector, {} as any, {} as any);
  it('resolves permissions from the local user rather than unvalidated token claims', async () => {
    const token = jwt.sign({ userId: 'user', sessionId: 'session', roles: ['ADMIN'], tenantId: 'old-tenant' }, secret, { issuer: 'techzone-cloud-iam', expiresIn: 60 });
    const prisma = {
      iamSession: { findUnique: jest.fn().mockResolvedValue({ id: 'session', userId: 'user', status: 'ACTIVE' }), update: jest.fn().mockResolvedValue({}) },
      iamUser: { findUnique: jest.fn().mockResolvedValue({ id: 'user', isAdmin: false }) },
    };
    const auth = { assertSessionUsable: jest.fn().mockResolvedValue(undefined) };
    const localGuard = new IamJwtGuard({ getAllAndOverride: () => false } as unknown as Reflector, prisma as any, auth as any);
    const {request,context} = makeContext(token);
    await expect(localGuard.canActivate(context)).resolves.toBe(true);
    expect(prisma.iamSession.findUnique).toHaveBeenCalledWith({ where: { id: 'session' } });
    expect(request.iamAuth.permissions).toEqual(ROLE_PERMISSIONS[ROLES.USER]);
    expect(request.iamAuth.roles).toEqual([ROLES.USER]);
  });
  it('refuses a revoked session even with a correctly signed access token', async () => {
    const token = jwt.sign({ userId: 'user', sessionId: 'revoked' }, secret, { issuer: 'techzone-cloud-iam', expiresIn: 60 });
    const revokedGuard = new IamJwtGuard({ getAllAndOverride: () => false } as unknown as Reflector,
      { iamSession: { findUnique: jest.fn().mockResolvedValue({ id: 'revoked' }) } } as any,
      { assertSessionUsable: jest.fn().mockRejectedValue(new Error('Session revoked')) } as any);
    await expect(revokedGuard.canActivate(makeContext(token).context)).rejects.toThrow('Session revoked');
  });
  it('refuses an MFA challenge as an access token', async () => {
    const token = jwt.sign({ userId: 'user', sessionId: 'session', purpose: 'step_up' }, secret, { issuer: 'techzone-cloud-iam', expiresIn: 60 });
    global.fetch = jest.fn();
    await expect(guard().canActivate(makeContext(token).context)).rejects.toThrow();
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it('reads tenantId from the live session record instead of the JWT payload', async () => {
    const token = jwt.sign({ userId: 'user', sessionId: 'session', tenantId: 'jwt-tenant' }, secret, { issuer: 'techzone-cloud-iam', expiresIn: 60 });
    const prisma = {
      iamSession: { findUnique: jest.fn().mockResolvedValue({ id: 'session', userId: 'user', status: 'ACTIVE', tenantId: 'session-tenant' }), update: jest.fn().mockResolvedValue({}) },
      iamUser: { findUnique: jest.fn().mockResolvedValue({ id: 'user', isAdmin: true }) },
    };
    const auth = { assertSessionUsable: jest.fn().mockResolvedValue(undefined) };
    const localGuard = new IamJwtGuard({ getAllAndOverride: () => false } as unknown as Reflector, prisma as any, auth as any);
    const { request, context } = makeContext(token);
    await expect(localGuard.canActivate(context)).resolves.toBe(true);
    expect(request.iamAuth.tenantId).toBe('session-tenant');
  });
});
