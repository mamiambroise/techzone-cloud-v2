import { IamAuthService } from './iam-auth.service';
import { PERMISSIONS } from './iam.constants';
import { verifyAccessToken } from './jwt.util';

describe('IAM access token cookie size', () => {
  const originalSecret = process.env.JWT_ACCESS_SECRET;

  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = 'iam-token-size-test-secret';
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.JWT_ACCESS_SECRET;
    else process.env.JWT_ACCESS_SECRET = originalSecret;
  });

  it('keeps the access token cookie below common browser cookie limits', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const sessionId = '22222222-2222-4222-8222-222222222222';
    const authorization = {
      resolve: jest.fn().mockResolvedValue({
        roles: ['admin'],
        permissions: Object.values(PERMISSIONS),
        isSuperAdmin: true,
        tenantRoleCodes: ['admin'],
      }),
    };
    const service = new IamAuthService(
      {
        iamUser: {
          findUnique: jest.fn().mockResolvedValue({ isAdmin: true, status: 'ACTIVE' }),
        },
      } as never,
      {} as never,
      {} as never,
      authorization as never,
      {} as never,
      {} as never,
    );

    const token = await service.buildAccessToken({
      id: sessionId,
      userId,
      tenantId: '33333333-3333-4333-8333-333333333333',
      authenticationLevel: 'PASSWORD',
    });

    const payload = verifyAccessToken(token);
    expect(token.length).toBeLessThan(2048);
    expect(payload).toMatchObject({ userId, sessionId });
    expect(payload).not.toHaveProperty('roles');
    expect(payload).not.toHaveProperty('permissions');
    expect(authorization.resolve).not.toHaveBeenCalled();
  });
});
