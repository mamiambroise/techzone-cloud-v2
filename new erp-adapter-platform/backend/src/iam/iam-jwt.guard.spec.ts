import * as jwt from 'jsonwebtoken';
import { Reflector } from '@nestjs/core';
import { IamJwtGuard } from './iam-jwt.guard';

describe('Delegated IAM cookie contract', () => {
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
  it('uses live authority permissions and tenant rather than unvalidated role mapping', async () => {
    const token = jwt.sign({ userId: 'user', sessionId: 'session', roles: ['ADMIN'], tenantId: 'old-tenant' }, secret, { issuer: 'techzone-cloud-iam', expiresIn: 60 });
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { status: 'RESOLVED', roles: [], permissions: [{ code: 'erp.registry.read' }], tenant: { tenantId: 'active-tenant' } } }) });
    const {request,context} = makeContext(token);
    await expect(guard().canActivate(context)).resolves.toBe(true);
    expect(request.iamAuth.permissions).toEqual(['erp.registry.read']);
    expect(request.iamAuth.tenantId).toBe('active-tenant');
    expect(request.iamAuth.roles).toEqual([]);
  });
  it('refuses a revoked session even with a correctly signed access token', async () => {
    const token = jwt.sign({ userId: 'user', sessionId: 'revoked' }, secret, { issuer: 'techzone-cloud-iam', expiresIn: 60 });
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401 });
    await expect(guard().canActivate(makeContext(token).context)).rejects.toThrow();
  });
  it('refuses an MFA challenge as an access token', async () => {
    const token = jwt.sign({ userId: 'user', sessionId: 'session', purpose: 'step_up' }, secret, { issuer: 'techzone-cloud-iam', expiresIn: 60 });
    global.fetch = jest.fn();
    await expect(guard().canActivate(makeContext(token).context)).rejects.toThrow();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
