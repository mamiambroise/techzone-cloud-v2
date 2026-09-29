import { jest } from '@jest/globals';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { IamAdminGuard } from './iam-admin-guard';
import { PERMISSIONS_KEY } from './iam-permissions.guard';
import { IAM_PERMISSIONS_KEY, ROLES, ROLE_PERMISSIONS, PERMISSIONS } from './iam.constants';

describe('IamAdminGuard', () => {
  const buildContext = (
    principal: any,
    permissions?: string[],
  ) => {
    const reflector = {
      getAllAndOverride: jest.fn((key: string) => {
        if (key === PERMISSIONS_KEY) return permissions;
        return undefined;
      }),
    } as unknown as Reflector;

    const request: any = {
      headers: {},
      method: 'GET',
      url: '/test',
      iamAuth: principal,
      iamPrincipal: principal,
    };

    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => request }),
    } as any;

    return { reflector, context, request };
  };

  describe('deny-by-default (no @Permissions declared)', () => {
    it('throws ForbiddenException when no permissions metadata is present', () => {
      const { reflector, context } = buildContext(
        { userId: 'u1', roles: [ROLES.ADMIN], permissions: Object.values(PERMISSIONS), isSuperAdmin: true },
        undefined,
      );
      const guard = new IamAdminGuard(reflector);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(/aucune permission explicite/);
    });

    it('throws ForbiddenException even for an admin-role user when no permissions are declared', () => {
      const { reflector, context } = buildContext(
        { userId: 'u1', roles: [ROLES.ADMIN], permissions: Object.values(PERMISSIONS), isSuperAdmin: true },
        undefined,
      );
      const guard = new IamAdminGuard(reflector);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('authenticated with required permission', () => {
    it('grants access to a user with IAM_ADMIN permission', () => {
      const { reflector, context } = buildContext(
        {
          userId: 'u1',
          roles: [ROLES.ADMIN],
          permissions: [PERMISSIONS.IAM_ADMIN],
          isSuperAdmin: true,
        },
        [PERMISSIONS.IAM_ADMIN],
      );
      const guard = new IamAdminGuard(reflector);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('grants access when the principal is super-admin', () => {
      const { reflector, context } = buildContext(
        {
          userId: 'u1',
          roles: [ROLES.ADMIN],
          permissions: [PERMISSIONS.IAM_ADMIN],
          isSuperAdmin: true,
        },
        [PERMISSIONS.IAM_ADMIN],
      );
      const guard = new IamAdminGuard(reflector);

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('authenticated with wrong / insufficient permission', () => {
    it('throws ForbiddenException when the user has USER role (no IAM_ADMIN)', () => {
      const { reflector, context } = buildContext(
        {
          userId: 'u1',
          roles: [ROLES.USER],
          permissions: [PERMISSIONS.ERP_READ, PERMISSIONS.CONFIG_READ],
          isSuperAdmin: false,
        },
        [PERMISSIONS.IAM_ADMIN],
      );
      const guard = new IamAdminGuard(reflector);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when the user has ERP_READ but route requires IAM_ADMIN', () => {
      const { reflector, context } = buildContext(
        {
          userId: 'u1',
          roles: [ROLES.USER],
          permissions: [PERMISSIONS.ERP_READ],
          isSuperAdmin: false,
        },
        [PERMISSIONS.IAM_ADMIN],
      );
      const guard = new IamAdminGuard(reflector);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('no authenticated principal', () => {
    it('throws ForbiddenException when request has no iamAuth (anonymous)', () => {
      const { reflector, context } = buildContext(
        undefined,
        [PERMISSIONS.IAM_ADMIN],
      );
      const guard = new IamAdminGuard(reflector);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('metadata key isolation', () => {
    it('reads from PERMISSIONS_KEY (same key as @Permissions decorator), not IAM_PERMISSIONS_KEY', () => {
      const permissions = [PERMISSIONS.IAM_ADMIN];
      const reflector = {
        getAllAndOverride: jest.fn((key: string) =>
          key === PERMISSIONS_KEY ? permissions : undefined,
        ),
      } as unknown as Reflector;

      const request: any = {
        headers: {},
        method: 'GET',
        url: '/test',
        iamAuth: {
          userId: 'u1',
          roles: [ROLES.ADMIN],
          permissions: [PERMISSIONS.IAM_ADMIN],
          isSuperAdmin: true,
        },
      };

      const context = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({ getRequest: () => request }),
      } as any;

      const guard = new IamAdminGuard(reflector);

      expect(guard.canActivate(context)).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      );
    });
  });

  describe('integration with ROLE_PERMISSIONS mapping', () => {
    it('admin role user has IAM_ADMIN permission via role mapping and passes', () => {
      const adminPerms = Object.values(ROLE_PERMISSIONS[ROLES.ADMIN]).flat();
      expect(adminPerms).toContain(PERMISSIONS.IAM_ADMIN);

      const { reflector, context } = buildContext(
        {
          userId: 'u1',
          roles: [ROLES.ADMIN],
          permissions: adminPerms,
          isSuperAdmin: false,
        },
        [PERMISSIONS.IAM_ADMIN],
      );
      const guard = new IamAdminGuard(reflector);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('user role does NOT have IAM_ADMIN permission', () => {
      const userPerms = Object.values(ROLE_PERMISSIONS[ROLES.USER]).flat();
      expect(userPerms).not.toContain(PERMISSIONS.IAM_ADMIN);
    });
  });

  it('ensures IAM_PERMISSIONS_KEY constant is not used by the guard (regression guard)', () => {
    expect(IAM_PERMISSIONS_KEY).toBe('iam_permissions');
    expect(PERMISSIONS_KEY).toBe('permissions');
    expect(PERMISSIONS_KEY).not.toBe(IAM_PERMISSIONS_KEY);
  });
});
