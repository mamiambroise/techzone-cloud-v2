import { IamError } from './iam-error';
import { IamTenantsService } from './iam-tenants.service';

const TENANT_A = '11111111-1111-4111-8111-111111111111';

describe('IamTenantsService membership context', () => {
  const buildService = () => {
    const authorization = { invalidate: jest.fn() };
    const prisma = {
      tenant: {
        findUnique: jest.fn().mockResolvedValue({ id: TENANT_A, status: 'ACTIVE' }),
      },
      iamUser: {
        findUnique: jest.fn().mockResolvedValue({ id: 'user-a' }),
      },
      membership: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }: any) =>
          Promise.resolve({ id: 'membership-a', ...data }),
        ),
      },
      organization: { findFirst: jest.fn() },
      site: { findUnique: jest.fn() },
    };
    return {
      service: new IamTenantsService(prisma as any, authorization as any),
      prisma,
      authorization,
    };
  };

  it('refuses an organization from another tenant', async () => {
    const { service, prisma } = buildService();
    prisma.organization.findFirst.mockResolvedValue(null);

    await expect(
      service.createMembership(
        TENANT_A,
        {
          userId: 'user-a',
          status: 'ACTIVE',
          organizationId: '22222222-2222-4222-8222-222222222222',
        },
        'admin-user',
      ),
    ).rejects.toMatchObject({
      code: 'CONTEXT_ACCESS_DENIED',
    } as Partial<IamError>);
    expect(prisma.membership.create).not.toHaveBeenCalled();
  });

  it('derives the organization from a tenant-owned site and invalidates authorization', async () => {
    const { service, prisma, authorization } = buildService();
    prisma.site.findUnique.mockResolvedValue({
      id: '33333333-3333-4333-8333-333333333333',
      organizationId: '44444444-4444-4444-8444-444444444444',
      organization: { tenantId: TENANT_A },
    });

    await service.createMembership(
      TENANT_A,
      {
        userId: 'user-a',
        status: 'ACTIVE',
        siteId: '33333333-3333-4333-8333-333333333333',
      },
      'admin-user',
    );

    expect(prisma.membership.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: TENANT_A,
          organizationId: '44444444-4444-4444-8444-444444444444',
          siteId: '33333333-3333-4333-8333-333333333333',
        }),
      }),
    );
    expect(authorization.invalidate).toHaveBeenCalledWith('user-a', TENANT_A);
  });
});
