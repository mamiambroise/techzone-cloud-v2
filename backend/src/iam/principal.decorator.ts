import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * IAM Principal canonique — construit à partir d'un token validé.
 *
 * Toutes les valeurs proviennent d'une source authentifiée (JWT validé).
 * Aucune valeur ne provient du body/query/header métier non fiable.
 */
export interface IamPrincipal {
  userId: string;
  sessionId: string;
  tenantId: string | null;
  organizationId: string | null;
  authenticationLevel: string | null;
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
  /**
   * Phase 8 : codes des rôles tenant effectivement résolus. `roles` est
   * conservé pour compatibilité et peut contenir le rôle de repli historique
   * quand aucun rôle tenant n'est affecté.
   */
  tenantRoleCodes?: string[];
}

export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): IamPrincipal => {
    const request = ctx.switchToHttp().getRequest();
    return request.iamPrincipal as IamPrincipal;
  },
);

export function hasPermission(principal: IamPrincipal, permission: string): boolean {
  if (principal.isSuperAdmin) return true;
  if (!principal.permissions || principal.permissions.length === 0) return false;
  return principal.permissions.includes('*') || principal.permissions.includes(permission);
}

export function hasRole(principal: IamPrincipal, role: string): boolean {
  if (principal.isSuperAdmin) return true;
  if (!principal.roles || principal.roles.length === 0) return false;
  return principal.roles.includes(role);
}

export function hasAnyPermission(
  principal: IamPrincipal,
  permissions: string[],
): boolean {
  if (principal.isSuperAdmin) return true;
  return permissions.some((p) => hasPermission(principal, p));
}