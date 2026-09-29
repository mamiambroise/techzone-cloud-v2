import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES, ROLE_PERMISSIONS } from './iam.constants';
import { PERMISSIONS_KEY } from './iam-permissions.guard';
import type { IamAuthContext } from './decorators/current-user.decorator';

@Injectable()
export class IamAdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      throw new ForbiddenException({
        success: false,
        message: 'Accès refusé — aucune permission explicite déclarée sur cette route administrative',
        statusCode: 403,
      });
    }

    const request = context.switchToHttp().getRequest();
    const ctx: IamAuthContext = request.iamAuth;

    if (!ctx) {
      throw new ForbiddenException({
        success: false,
        message: 'Authentification requise',
        statusCode: 401,
      });
    }

    const userRoles = ctx.roles ?? [];
    const userPermissions = ctx.permissions ?? [];

    for (const role of userRoles) {
      if (role === ROLES.ADMIN) {
        return true;
      }
      const rolePerms = ROLE_PERMISSIONS[role] ? (Array.isArray(ROLE_PERMISSIONS[role]) ? ROLE_PERMISSIONS[role] : Object.values(ROLE_PERMISSIONS[role]).flat() as string[]) : [];
      if (rolePerms.some((p) => requiredPermissions.includes(p))) {
        return true;
      }
    }

    if (userPermissions.some((p) => requiredPermissions.includes(p))) {
      return true;
    }

    throw new ForbiddenException({
      success: false,
      message: 'Permissions insuffisantes',
      statusCode: 403,
    });
  }
}
