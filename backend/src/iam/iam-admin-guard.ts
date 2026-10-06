import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './iam-permissions.guard';
import type { IamAuthContext } from './decorators/current-user.decorator';

/**
 * Phase 8 — contrôle des routes administratives.
 *
 * Décision volontairement modifiée par rapport à l'ancien contrôle par nom de rôle :
 * l'autorité vient du `isSuperAdmin`calculé par `IamAuthorizationService` et de
 * l'ensemble de permissions effectives, jamais d'une comparaison de chaîne.
 *
 * Raison : `ctx.roles` contient désormais des codes de rôles TENANT
 * (`application_manager`, `tenant_user`, …) résolus en base. Tester
 * `roles.includes('admin')` ferait qu'un rôle créé par un tenant avec le code
 * `admin` vaudrait administration plateforme — une escalade de privilège
 * entièrement pilotable par un client.
 */
@Injectable()
export class IamAdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Une route déclarée « administrative » sans permission explicite est
    // inexploitable : l'octroyer serait décider par omission.
    if (!requiredPermissions || requiredPermissions.length === 0) {
      throw new ForbiddenException({
        success: false,
        message:
          'Accès refusé — aucune permission explicite déclarée sur cette route administrative',
        statusCode: 403,
      });
    }

    const request = context.switchToHttp().getRequest();
    const ctx: IamAuthContext | undefined = request.iamAuth;

    if (!ctx) {
      throw new ForbiddenException({
        success: false,
        message: 'Authentification requise',
        statusCode: 401,
      });
    }

    // Override plateforme : un superadmin reste superadmin, sans condition.
    if (ctx.isSuperAdmin === true) {
      return true;
    }

    const userPermissions = ctx.permissions ?? [];
    const granted = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (granted) {
      return true;
    }

    throw new ForbiddenException({
      success: false,
      message: 'Permissions insuffisantes',
      statusCode: 403,
    });
  }
}