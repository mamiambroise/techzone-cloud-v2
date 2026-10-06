import { BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantGuard } from './tenant.guard';
import { TENANT_RESOURCE_KEY } from './tenant-resource.decorator';
import { IS_PUBLIC_KEY } from './iam.constants';
import type { PrismaService } from '../prisma/prisma.service';
import type { IamPrincipal } from './principal.decorator';

const TENANT = '11111111-1111-4111-8111-111111111111';
const OTHER_TENANT = '22222222-2222-4222-8222-222222222222';
const APP = '33333333-3333-4333-8333-333333333333';

const contextFor = (
  params: Record<string, string>,
  principal: Partial<IamPrincipal> | undefined,
) =>
  ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ params, iamPrincipal: principal }) }),
  }) as never;

const prismaStub = (findUnique: jest.Mock) =>
  ({ application: { findUnique } }) as unknown as PrismaService;

describe('TenantGuard', () => {
const reflectorWithResource = () =>
  ({
    getAllAndOverride: (key: string) => {
      if (key === TENANT_RESOURCE_KEY) {
        return { table: 'application', idParam: 'id' };
      }
      if (key === IS_PUBLIC_KEY) return false;
      return undefined;
    },
  }) as unknown as Reflector;

  it('rejects a malformed resource id with 400 instead of 500', async () => {
    const findUnique = jest.fn();
    const guard = new TenantGuard(reflectorWithResource(), prismaStub(findUnique));

    await expect(
      guard.canActivate(
        contextFor({ id: 'pas-un-uuid' }, { tenantId: TENANT, isSuperAdmin: false }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    // La base ne doit même pas être sollicitée : c'est la requête qui est invalide.
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('rejects a truncated but uuid-shaped id', async () => {
    const findUnique = jest.fn();
    const guard = new TenantGuard(reflectorWithResource(), prismaStub(findUnique));

    await expect(
      guard.canActivate(
        contextFor({ id: APP.slice(0, 30) }, { tenantId: TENANT, isSuperAdmin: false }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('allows a well-formed id whose resource belongs to the active tenant', async () => {
    const findUnique = jest.fn().mockResolvedValue({ tenantId: TENANT });
    const guard = new TenantGuard(reflectorWithResource(), prismaStub(findUnique));

    await expect(
      guard.canActivate(
        contextFor({ id: APP }, { tenantId: TENANT, isSuperAdmin: false }),
      ),
    ).resolves.toBe(true);
    expect(findUnique).toHaveBeenCalledTimes(1);
  });

  it('forbids a well-formed id owned by another tenant', async () => {
    const findUnique = jest.fn().mockResolvedValue({ tenantId: OTHER_TENANT });
    const guard = new TenantGuard(reflectorWithResource(), prismaStub(findUnique));

    await expect(
      guard.canActivate(
        contextFor({ id: APP }, { tenantId: TENANT, isSuperAdmin: false }),
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('still surfaces a genuine database failure as a 500 with its cause', async () => {
    const cause = new Error('connection terminated');
    const findUnique = jest.fn().mockRejectedValue(cause);
    const guard = new TenantGuard(reflectorWithResource(), prismaStub(findUnique));

    await expect(
      guard.canActivate(
        contextFor({ id: APP }, { tenantId: TENANT, isSuperAdmin: false }),
      ),
    ).rejects.toMatchObject({ status: 500 });
  });
});
