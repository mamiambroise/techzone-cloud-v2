import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IamAdminGuard } from './iam-admin-guard';
import { PERMISSIONS } from './iam.constants';
import type { IamAuthContext } from './decorators/current-user.decorator';

/**
 * Phase 8 — régression d'escalade de privilège.
 *
 * `ctx.roles` contient des codes de rôles TENANT résolus en base. Le contrôle
 * ne doit jamais traduire un NOM de rôle en autorité plateforme : sinon un
 * tenant qui crée un rôle `admin` s'attribue l'administration de la plateforme.
 */
describe('IamAdminGuard', () => {
  const contextFor = (principal: Partial<IamAuthContext> | undefined) => {
    const request = { iamAuth: principal };
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  };

  const guardRequiring = (permissions: string[]) =>
    new IamAdminGuard({
      getAllAndOverride: () => permissions,
    } as unknown as Reflector);

  it('refuses a route marked administrative without explicit permission', () => {
    const guard = guardRequiring([]);

    expect(() =>
      guard.canActivate(
        contextFor({ userId: 'u', roles: ['admin'], permissions: [] }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('refuses when there is no principal', () => {
    const guard = guardRequiring([PERMISSIONS.IAM_ADMIN]);

    expect(() => guard.canActivate(contextFor(undefined))).toThrow(
      /Authentification requise/,
    );
  });

  it('grants a superadmin regardless of the declared permission', () => {
    const guard = guardRequiring([PERMISSIONS.IAM_ADMIN]);

    expect(
      guard.canActivate(
        contextFor({ userId: 'u', roles: [], permissions: [], isSuperAdmin: true }),
      ),
    ).toBe(true);
  });

  it('grants when the effective permission set covers the requirement', () => {
    const guard = guardRequiring([PERMISSIONS.IAM_ADMIN]);

    expect(
      guard.canActivate(
        contextFor({
          userId: 'u',
          roles: ['tenant_admin'],
          permissions: [PERMISSIONS.IAM_ADMIN],
          isSuperAdmin: false,
        }),
      ),
    ).toBe(true);
  });

  it('refuses when only part of the required permissions is present', () => {
    const guard = guardRequiring([
      PERMISSIONS.IAM_ADMIN,
      PERMISSIONS.INTEGRATION_CREDENTIAL_WRITE,
    ]);

    expect(() =>
      guard.canActivate(
        contextFor({
          userId: 'u',
          roles: ['tenant_admin'],
          permissions: [PERMISSIONS.IAM_ADMIN],
          isSuperAdmin: false,
        }),
      ),
    ).toThrow(/Permissions insuffisantes/);
  });

  it('refuses a tenant-defined role named admin', () => {
    const guard = guardRequiring([PERMISSIONS.IAM_ADMIN]);

    expect(() =>
      guard.canActivate(
        contextFor({
          userId: 'u',
          // Rôle créé par un tenant : même code que le rôle plateforme.
          roles: ['admin'],
          tenantRoleCodes: ['admin'],
          permissions: [],
          isSuperAdmin: false,
        }),
      ),
    ).toThrow(/Permissions insuffisantes/);
  });

  it('refuses a tenant role whose name matches nothing but that lacks the permission', () => {
    const guard = guardRequiring([PERMISSIONS.IAM_ADMIN]);

    expect(() =>
      guard.canActivate(
        contextFor({
          userId: 'u',
          roles: ['application_manager'],
          tenantRoleCodes: ['application_manager'],
          permissions: ['bm:read', 'bm:write'],
          isSuperAdmin: false,
        }),
      ),
    ).toThrow(/Permissions insuffisantes/);
  });
});