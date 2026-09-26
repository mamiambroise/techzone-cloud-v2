import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface IamAuthContext {
  userId: string;
  sessionId: string;
  tenantId?: string | null;
  organizationId?: string | null;
  authenticationLevel?: string | null;
  roles: string[];
  permissions: string[];
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): IamAuthContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.iamAuth;
  },
);

export function hasPermission(ctx: IamAuthContext, permission: string): boolean {
  if (!ctx.permissions || ctx.permissions.length === 0) {
    return false;
  }
  return ctx.permissions.includes('*') || ctx.permissions.includes(permission);
}

export function hasRole(ctx: IamAuthContext, role: string): boolean {
  if (!ctx.roles || ctx.roles.length === 0) {
    return false;
  }
  return ctx.roles.includes(role);
}

export function hasAnyPermission(ctx: IamAuthContext, permissions: string[]): boolean {
  return permissions.some((p) => hasPermission(ctx, p));
}