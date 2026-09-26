import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { IamPrincipal } from './principal.decorator';
import { IamLogger } from './iam.logger';

/**
 * Tenant enforcement guard.
 *
 * Le tenant du principal authentifié (source: JWT validé) est comparé au
 * tenant de la ressource demandée. Aucune valeur n'est lue dans le body/query/header
 * métier (sauf si le contrat IAM prévoit explicitement un mécanisme sécurisé de
 * changement de contexte, ce qui n'est pas le cas ici).
 */
@Injectable()
export class TenantGuard implements CanActivate {
  async activate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const principal: IamPrincipal = request.iamPrincipal;

    if (!principal) {
      throw new ForbiddenException('Authentication required');
    }

    const resourceTenantId = this.resolveResourceTenantId(request);

    if (resourceTenantId === null || resourceTenantId === undefined) {
      // Ressource non tenant-scoped (ex: PLATFORM scope) → aucune contrainte tenant
      return true;
    }

    if (principal.tenantId === null || principal.tenantId === undefined) {
      IamLogger.tenantDeny(request, principal, resourceTenantId, 'NO_TENANT_ON_PRINCIPAL');
      throw new ForbiddenException('Access denied');
    }

    if (principal.tenantId !== resourceTenantId) {
      IamLogger.tenantDeny(request, principal, resourceTenantId, 'TENANT_MISMATCH');
      throw new ForbiddenException('Access denied');
    }

    return true;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return this.activate(context);
  }

  /**
   * Résout le tenant de la ressource à partir de sources fiables :
   * - param route (ex: /platform/applications/:applicationId)
   * - header X-Resource-Tenant-Id (réservé, contrôlé)
   *
   * Les tentatives d'override via ?tenantId=, body.tenantId, X-Tenant-Id
   * sont IGNOREES (ne sont pas utilisées ici).
   */
  private resolveResourceTenantId(request: any): string | null {
    const params = request.params ?? {};
    const resourceTenantId = params.tenantId ?? params.resourceTenantId ?? null;

    if (resourceTenantId !== null && resourceTenantId !== undefined) {
      return String(resourceTenantId);
    }

    return null;
  }
}