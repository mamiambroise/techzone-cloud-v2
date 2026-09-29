import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
@Injectable()
export class BmTenantGuard implements CanActivate {
 canActivate(context: ExecutionContext): boolean {
  const tenantId = context.switchToHttp().getRequest().iamPrincipal?.tenantId;
  if (!tenantId || tenantId === 'legacy') throw new ForbiddenException('Select a tenant to use Business Manager');
  return true;
 }
}
