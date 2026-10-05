import { jest } from '@jest/globals';
import { Reflector } from '@nestjs/core';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { IamPermissionGuard } from './iam-permission.guard';
import { TenantGuard } from './tenant.guard';
import { TENANT_RESOURCE_KEY, TENANT_OPTIONAL_KEY } from './tenant-resource.decorator';

describe('IAM guard contracts', () => {
  // `TenantResource` résout l'identifiant via Prisma sur une colonne `uuid` :
  // les identifiants de test doivent donc être des UUID valides.
  const TENANT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const TENANT_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const RESOURCE = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

  const ctx = (principal: any, params = {}) => ({
    getHandler: () => ({}), getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ iamPrincipal: principal, params, headers: {}, method: 'GET', url: '/test' }) }),
  }) as any;

  it('enforces Nest canActivate and refuses absent permission', async () => {
    const reflector = { getAllAndOverride: () => 'configurations.write' } as unknown as Reflector;
    const guard = new IamPermissionGuard(reflector);
    await expect(guard.canActivate(ctx({ permissions: [] }))).rejects.toBeInstanceOf(ForbiddenException);
    await expect(guard.canActivate(ctx({ permissions: ['configurations.write'] }))).resolves.toBe(true);
  });

  it('refuses a resource tenant different from the authenticated principal', async () => {
    const mockModel = {
      findUnique: jest.fn().mockResolvedValue({ tenantId: TENANT_B }),
    };
    const mockPrisma = {
      application: mockModel,
    } as any;

    const reflector = {
      getAllAndOverride: jest.fn((key) => key === TENANT_RESOURCE_KEY ? { table: 'application', idParam: 'id' } : undefined),
    } as unknown as Reflector;

    const guard = new TenantGuard(reflector, mockPrisma);

    await expect(
      guard.canActivate(ctx({ tenantId: TENANT_A }, { id: RESOURCE })),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(mockModel.findUnique).toHaveBeenCalledWith({
      where: { id: RESOURCE },
      select: { tenantId: true },
    });
  });

  it('rejects a malformed resource id as a client error, not a server error', async () => {
    const mockModel = { findUnique: jest.fn() };
    const mockPrisma = { application: mockModel } as any;
    const reflector = {
      getAllAndOverride: jest.fn((key) => key === TENANT_RESOURCE_KEY ? { table: 'application', idParam: 'id' } : undefined),
    } as unknown as Reflector;

    const guard = new TenantGuard(reflector, mockPrisma);

    await expect(
      guard.canActivate(ctx({ tenantId: TENANT_A }, { id: 'res-1' })),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(mockModel.findUnique).not.toHaveBeenCalled();
  });

  it('allows access when resource tenant matches principal tenant', async () => {
    const mockModel = {
      findUnique: jest.fn().mockResolvedValue({ tenantId: TENANT_A }),
    };
    const mockPrisma = {
      application: mockModel,
    } as any;

    const reflector = {
      getAllAndOverride: jest.fn((key) => key === TENANT_RESOURCE_KEY ? { table: 'application', idParam: 'id' } : undefined),
    } as unknown as Reflector;

    const guard = new TenantGuard(reflector, mockPrisma);

    await expect(
      guard.canActivate(ctx({ tenantId: TENANT_A }, { id: RESOURCE })),
    ).resolves.toBe(true);
  });

  it('returns true when no TenantResource decorator is present', async () => {
    const mockPrisma = { application: { findUnique: jest.fn() } } as any;
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;

    const guard = new TenantGuard(reflector, mockPrisma);

    await expect(
      guard.canActivate(ctx({ tenantId: 'a' }, { id: 'res-1' })),
    ).resolves.toBe(true);
  });

  it('denies access when principal has no tenant and is not super admin', async () => {
    const mockPrisma = { application: { findUnique: jest.fn() } } as any;
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;

    const guard = new TenantGuard(reflector, mockPrisma);

    await expect(
      guard.canActivate(ctx({ tenantId: null, isSuperAdmin: false }, { id: 'res-1' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows super admin access with no tenant', async () => {
    const mockPrisma = { application: { findUnique: jest.fn() } } as any;
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;

    const guard = new TenantGuard(reflector, mockPrisma);

    await expect(
      guard.canActivate(ctx({ tenantId: null, isSuperAdmin: true }, { id: 'res-1' })),
    ).resolves.toBe(true);
  });

  it('allows explicitly public endpoints before authentication', async () => {
    const reflector = { getAllAndOverride: (key: string) => key === 'isPublic' ? true : undefined } as any;
    await expect(new TenantGuard(reflector, {} as any).canActivate(ctx(undefined))).resolves.toBe(true);
  });
  it('allows tenant discovery only after authentication and preserves business isolation', async () => {
    const reflector = { getAllAndOverride: (key: string) => key === TENANT_OPTIONAL_KEY ? true : undefined } as any;
    const guard = new TenantGuard(reflector, {} as any);
    await expect(guard.canActivate(ctx(undefined))).rejects.toBeInstanceOf(ForbiddenException);
    await expect(guard.canActivate(ctx({ userId: 'u', tenantId: null }))).resolves.toBe(true);
  });
});
