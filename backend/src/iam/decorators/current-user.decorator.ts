import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Contexte d'autorisation porté par la requête.
 *
 * Ces champs décrivent EXACTEMENT ce que `IamJwtGuard` a résolu en base pour le
 * tenant actif de la session. `permissions` est la seule autorité : elle est
 * produite par `IamAuthorizationService`
 * (membership ACTIVE → affectations → rôle → role_permission → permission).
 *
 * `roles` est conservé pour compatibilité et peut contenir le rôle de repli
 * historique (`admin` / `user`) quand aucun rôle tenant n'est affecté. Il ne
 * doit jamais servir à décider d'une autorisation par comparaison de nom : un
 * code de rôle choisi par un tenant n'a pas de portée plateforme.
 */
export interface IamAuthContext {
  userId: string;
  sessionId: string;
  tenantId?: string | null;
  organizationId?: string | null;
  authenticationLevel?: string | null;
  roles: string[];
  permissions: string[];
  /** Override plateforme, calculé côté base — jamais déduit d'un nom de rôle. */
  isSuperAdmin?: boolean;
  /** Rôles tenant persistés ayant effectivement produit des permissions. */
  tenantRoleCodes?: string[];
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): IamAuthContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.iamAuth;
  },
);

export function hasPermission(
  ctx: IamAuthContext,
  permission: string,
): boolean {
  if (ctx.isSuperAdmin) return true;
  if (!ctx.permissions || ctx.permissions.length === 0) {
    return false;
  }
  return ctx.permissions.includes('*') || ctx.permissions.includes(permission);
}

export function hasRole(ctx: IamAuthContext, role: string): boolean {
  if (ctx.isSuperAdmin) return true;
  if (!ctx.roles || ctx.roles.length === 0) {
    return false;
  }
  return ctx.roles.includes(role);
}

export function hasAnyPermission(
  ctx: IamAuthContext,
  permissions: string[],
): boolean {
  if (ctx.isSuperAdmin) return true;
  return permissions.some((p) => hasPermission(ctx, p));
}