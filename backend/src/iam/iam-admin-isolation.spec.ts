import { jest } from '@jest/globals';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

import { IamAdminGuard } from './iam-admin-guard';
import { TenantGuard } from './tenant.guard';
import { PERMISSIONS_KEY } from './iam-permissions.guard';
import { TENANT_RESOURCE_KEY } from './tenant-resource.decorator';
import {
  IAM_PERMISSIONS_KEY,
  IAM_ADMIN,
  ROLES,
  ROLE_PERMISSIONS,
  PERMISSIONS,
} from './iam.constants';

type MockRequest = {
  iamAuth: any;
  iamPrincipal?: any;
  params: Record<string, string>;
  headers: Record<string, string>;
  method: string;
  url: string;
};

// `TenantGuard` rÃ©sout l'identifiant sur une colonne PostgreSQL `uuid` :
// les tenants et identifiants de test doivent donc Ãªtre des UUID valides.
const TENANT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const RESOURCE = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

function buildContext(principal: any, permissions?: string[], params: Record<string, string> = {}) {
  const reflector = {
    getAllAndOverride: jest.fn((key: string) => {
      if (key === PERMISSIONS_KEY) return permissions;
      if (key === 'isPublic') return false;
      return undefined;
    }),
  } as unknown as Reflector;

  const request: MockRequest = {
    iamAuth: principal,
    iamPrincipal: principal,
    params,
    headers: {},
    method: 'GET',
    url: '/test',
  };

  const context = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  return { reflector, context, request };
}

describe('IAM Admin Security â€” Cross-Tenant Isolation', () => {
  it('Tenant A resource is denied to Tenant B user (resource ownership guard)', async () => {
    const mockModel = {
      findUnique: jest.fn().mockResolvedValue({ tenantId: TENANT_A }),
    };
    const mockPrisma = { application: mockModel } as any;

    const reflector = {
      getAllAndOverride: jest.fn((key: string) => {
        if (key === TENANT_RESOURCE_KEY) return { table: 'application', idParam: 'id' };
        if (key === 'isPublic') return false;
        return undefined;
      }),
    } as unknown as Reflector;

    const guard = new TenantGuard(reflector, mockPrisma);
    const request: MockRequest = {
      iamAuth: { userId: 'u2', tenantId: TENANT_B, roles: [ROLES.USER], permissions: [PERMISSIONS.ERP_READ] },
      iamPrincipal: { userId: 'u2', tenantId: TENANT_B },
      params: { id: RESOURCE },
      headers: {},
      method: 'GET',
      url: '/test',
    };

    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('Tenant A resource is accessible to Tenant A user (resource ownership guard)', async () => {
    const mockModel = {
      findUnique: jest.fn().mockResolvedValue({ tenantId: TENANT_A }),
    };
    const mockPrisma = { application: mockModel } as any;

    const reflector = {
      getAllAndOverride: jest.fn((key: string) => {
        if (key === TENANT_RESOURCE_KEY) return { table: 'application', idParam: 'id' };
        if (key === 'isPublic') return false;
        return undefined;
      }),
    } as unknown as Reflector;

    const guard = new TenantGuard(reflector, mockPrisma);
    const request: MockRequest = {
      iamAuth: { userId: 'u1', tenantId: TENANT_A, roles: [ROLES.ADMIN], permissions: [IAM_ADMIN] },
      iamPrincipal: { userId: 'u1', tenantId: TENANT_A },
      params: { id: RESOURCE },
      headers: {},
      method: 'GET',
      url: '/test',
    };

    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('IamAdminGuard prevents super-admin bypass of tenant scoping (admin role is checked, not adminPerms)', () => {
    const { reflector, context } = buildContext(
      { userId: 'u1', roles: [ROLES.ADMIN], permissions: [PERMISSIONS.IAM_ADMIN], isSuperAdmin: true },
      [IAM_ADMIN],
    );
    const guard = new IamAdminGuard(reflector);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('IamAdminGuard denies USER role even with non-admin permissions matching route', () => {
    const { reflector, context } = buildContext(
      {
        userId: 'u1',
        roles: [ROLES.USER],
        permissions: [PERMISSIONS.ERP_READ, PERMISSIONS.CONFIG_READ],
        isSuperAdmin: false,
      },
      [IAM_ADMIN],
    );
    const guard = new IamAdminGuard(reflector);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('IamAdminGuard denies USER role with ERP_READ only when route requires IAM_ADMIN', () => {
    const { reflector, context } = buildContext(
      { userId: 'u1', roles: [ROLES.USER], permissions: [PERMISSIONS.ERP_READ], isSuperAdmin: false },
      [IAM_ADMIN],
    );
    const guard = new IamAdminGuard(reflector);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('IamAdminGuard denies anonymous requests even with valid permission metadata', () => {
    const { reflector, context } = buildContext(undefined, [IAM_ADMIN]);
    const guard = new IamAdminGuard(reflector);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('IamAdminGuard throws ForbiddenException when no @Permissions is declared (deny-by-default)', () => {
    const { reflector, context } = buildContext(
      { userId: 'u1', roles: [ROLES.ADMIN], permissions: Object.values(PERMISSIONS), isSuperAdmin: true },
      undefined,
    );
    const guard = new IamAdminGuard(reflector);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('ensures IAM_PERMISSIONS_KEY is different from PERMISSIONS_KEY (regression guard)', () => {
    expect(IAM_PERMISSIONS_KEY).toBe('iam_permissions');
    expect(PERMISSIONS_KEY).toBe('permissions');
    expect(PERMISSIONS_KEY).not.toBe(IAM_PERMISSIONS_KEY);
  });

  it('verifies USER role does not include IAM_ADMIN in role mapping', () => {
    const userPerms = ROLE_PERMISSIONS[ROLES.USER];
    expect(userPerms).not.toContain(PERMISSIONS.IAM_ADMIN);
  });

  it('verifies ADMIN role includes IAM_ADMIN in role mapping', () => {
    const adminPerms = ROLE_PERMISSIONS[ROLES.ADMIN];
    expect(adminPerms).toContain(PERMISSIONS.IAM_ADMIN);
  });
});
