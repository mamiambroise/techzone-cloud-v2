import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { IamPrincipal } from './principal.decorator';
import { IamLogger } from './iam.logger';

/**
 * Permission enforcement guard.
 *
 * Authentifié n'est pas suffisant. La permission demandée doit être présente
 * dans le principal (source: JWT validé).
 *
 * Aucun wildcard implicite. Le principal n'a `isSuperAdmin=false` par défaut ;
 * le wildcard `permissions: ['*']` n'est honoré que s'il est explicitement
 * présent dans le token émis par IAM.
 */
@Injectable()
export class RequirePermissionGuard implements CanActivate {
  constructor(private readonly permission: string) {}

  async activate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const principal: IamPrincipal = request.iamPrincipal;

    if (!principal) {
      throw new ForbiddenException('Authentication required');
    }

    const granted =
      principal.isSuperAdmin ||
      (Array.isArray(principal.permissions) &&
        (principal.permissions.includes('*') ||
          principal.permissions.includes(this.permission)));

    if (!granted) {
      IamLogger.permissionDeny(request, principal, this.permission);
      throw new ForbiddenException('Insufficient permission');
    }

    return true;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return this.activate(context);
  }
}

/**
 * Factory pour créer un guard instance par permission.
 * Utilisé comme : @UseGuards(RequirePermission('applications.read'))
 */
export function RequirePermission(permission: string) {
  @Injectable()
  class PermissionGuard implements CanActivate {
    constructor() {}

    async activate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const principal: IamPrincipal = request.iamPrincipal;

      if (!principal) {
        throw new ForbiddenException('Authentication required');
      }

      const granted =
        principal.isSuperAdmin ||
        (Array.isArray(principal.permissions) &&
          (principal.permissions.includes('*') ||
            principal.permissions.includes(permission)));

      if (!granted) {
        IamLogger.permissionDeny(request, principal, permission);
        throw new ForbiddenException('Insufficient permission');
      }

      return true;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
      return this.activate(context);
    }
  }

  return PermissionGuard;
}