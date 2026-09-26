import { Reflector } from '@nestjs/core';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { IamPrincipal } from './principal.decorator';
import { IamLogger } from './iam.logger';

/**
 * Permission enforcement guard (global).
 *
 * Lit la permission déclarée via @RequirePermission('xxx').
 * Si aucune permission n'est déclarée sur la route, aucune vérification
 * n'est effectuée (l'authentification seule suffit).
 *
 * Authentifié n'est pas suffisant pour les routes déclarées.
 */
@Injectable()
export class IamPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async activate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string | undefined>(
      'requiredPermission',
      [context.getHandler(), context.getClass()],
    );

    if (!required) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const principal: IamPrincipal = request.iamPrincipal;

    if (!principal) {
      throw new ForbiddenException('Authentication required');
    }

    const granted =
      principal.isSuperAdmin ||
      (Array.isArray(principal.permissions) &&
        (principal.permissions.includes('*') ||
          principal.permissions.includes(required)));

    if (!granted) {
      IamLogger.permissionDeny(request, principal, required);
      throw new ForbiddenException('Insufficient permission');
    }

    return true;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return this.activate(context);
  }
}