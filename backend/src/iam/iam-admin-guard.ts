import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IAM_PERMISSIONS_KEY, ROLES, ROLE_PERMISSIONS } from './iam.constants';
import type { IamAuthContext } from './decorators/current-user.decorator';

@Injectable()
export class IamAdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(IAM_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const ctx: IamAuthContext = request.user;

    if (!ctx) {
      throw new ForbiddenException({
        success: false,
        message: 'Authentification requise',
        statusCode: 401,
      });
    }

    const userRoles = ctx.roles ?? [];
    const userPermissions = ctx.permissions ?? [];

    const adminPerms = Object.values(ROLE_PERMISSIONS[ROLES.ADMIN] ?? {}).flat() as string[];

    for (const role of userRoles) {
      if (role === ROLES.ADMIN) {
        return true;
      }
      const rolePerms = ROLE_PERMISSIONS[role] ? Object.values(ROLE_PERMISSIONS[role]).flat() as string[] : [];
      if (rolePerms.some((p) => requiredPermissions.includes(p))) {
        return true;
      }
    }

    if (userPermissions.some((p) => requiredPermissions.includes(p))) {
      return true;
    }

    if (adminPerms.some((p) => requiredPermissions.includes(p))) {
      return true;
    }

    throw new ForbiddenException({
      success: false,
      message: 'Permissions insuffisantes',
      statusCode: 403,
    });
  }
}
