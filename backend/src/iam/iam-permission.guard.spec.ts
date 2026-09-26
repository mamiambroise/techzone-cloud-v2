import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { IamPermissionGuard } from './iam-permission.guard';
import { TenantGuard } from './tenant.guard';

describe('IAM guard contracts', () => {
  const ctx = (principal: any, params = {}) => ({
    getHandler: () => ({}), getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ iamPrincipal: principal, params, headers: {}, method: 'GET', url: '/test' }) }),
  }) as any;
  it('enforces Nest canActivate and refuses absent permission', async () => {
    const reflector = { getAllAndOverride: () => 'configurations.write' } as unknown as Reflector;
    const guard = new IamPermissionGuard(reflector);
    await expect(guard.canActivate(ctx({ permissions: [] }))).rejects.toBeInstanceOf(ForbiddenException);
    await expect(guard.canActivate(ctx({ permissions: ['configurations.write'] }))).resolves.toBe(true);
  });
  it('refuses a resource tenant different from the authenticated principal', async () => {
    const guard = new TenantGuard();
    await expect(guard.canActivate(ctx({ tenantId: 'a' }, { tenantId: 'b' }))).rejects.toBeInstanceOf(ForbiddenException);
    await expect(guard.canActivate(ctx({ tenantId: 'a' }, { tenantId: 'a' }))).resolves.toBe(true);
  });
});
