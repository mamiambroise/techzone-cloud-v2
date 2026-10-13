import { jest } from '@jest/globals';
import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantGuard } from './tenant.guard';
import { TENANT_RESOURCE_KEY } from './tenant-resource.decorator';
import { IS_PUBLIC_KEY } from './iam.constants';
import type { PrismaService } from '../prisma/prisma.service';
import type { IamPrincipal } from './principal.decorator';

/**
 * LOT 3 — fail-closed.
 *
 * unknown delegate => DENY, missing resource => DENY, métadonnées de
 * sécurité absentes => DENY. Toute ressource ciblée doit appartenir au
 * tenant du principal, sauf ressource plateforme explicite
 * (allowNullTenant).
 */

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

const reflectorWithResource = (config?: Record<string, unknown>) =>
  ({
    getAllAndOverride: (key: string) => {
      if (key === TENANT_RESOURCE_KEY) {
        return config ?? { table: 'application', idParam: 'id' };
      }
      if (key === IS_PUBLIC_KEY) return false;
      return undefined;
    },
  }) as unknown as Reflector;

const prismaStub = (application: unknown) =>
  ({ application }) as unknown as PrismaService;

const principal = { tenantId: TENANT, isSuperAdmin: false } as Partial<IamPrincipal>;

describe('LOT 3 — TenantGuard fail-closed', () => {
  it('DENY (500) si le delegate Prisma référencé par la métadonnée est inconnu', async () => {
    const guard = new TenantGuard(
      reflectorWithResource({ table: 'tableFantome', idParam: 'id' }),
      prismaStub({ findUnique: jest.fn() }),
    );

    // prisma.tableFantome n'existe pas dans ce stub.
    await expect(
      guard.canActivate(contextFor({ id: APP }, principal)),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('DENY (404) si la ressource ciblée est introuvable', async () => {
    const guard = new TenantGuard(
      reflectorWithResource(),
      prismaStub({ findUnique: jest.fn(async () => null) }),
    );

    await expect(
      guard.canActivate(contextFor({ id: APP }, principal)),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('DENY (403) si la ressource existe mais n’est pas scoping par tenant', async () => {
    const guard = new TenantGuard(
      reflectorWithResource(),
      prismaStub({ findUnique: jest.fn(async () => ({ tenantId: null })) }),
    );

    await expect(
      guard.canActivate(contextFor({ id: APP }, principal)),
    ).rejects.toMatchObject({ status: 403 } as Partial<ForbiddenException>);
  });

  it('autorise explicitement une ressource plateforme (allowNullTenant)', async () => {
    const guard = new TenantGuard(
      reflectorWithResource({ table: 'application', idParam: 'id', allowNullTenant: true }),
      prismaStub({ findUnique: jest.fn(async () => ({ tenantId: null })) }),
    );

    await expect(
      guard.canActivate(contextFor({ id: APP }, principal)),
    ).resolves.toBe(true);
  });

  it('autorise une ressource du même tenant (comportement conservé)', async () => {
    const guard = new TenantGuard(
      reflectorWithResource(),
      prismaStub({ findUnique: jest.fn(async () => ({ tenantId: TENANT })) }),
    );

    await expect(
      guard.canActivate(contextFor({ id: APP }, principal)),
    ).resolves.toBe(true);
  });

  it('forbid une ressource d’un autre tenant (comportement conservé)', async () => {
    const guard = new TenantGuard(
      reflectorWithResource(),
      prismaStub({ findUnique: jest.fn(async () => ({ tenantId: OTHER_TENANT })) }),
    );

    await expect(
      guard.canActivate(contextFor({ id: APP }, principal)),
    ).rejects.toMatchObject({ status: 403 } as Partial<ForbiddenException>);
  });

  it('no principal => DENY (comportement conservé)', async () => {
    const guard = new TenantGuard(
      reflectorWithResource(),
      prismaStub({ findUnique: jest.fn() }),
    );

    await expect(
      guard.canActivate(contextFor({ id: APP }, undefined)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
