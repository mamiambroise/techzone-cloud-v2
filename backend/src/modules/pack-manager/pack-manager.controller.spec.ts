import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IamPermissionGuard } from '../../iam/iam-permission.guard';
import { PERMISSION_KEY } from '../../iam/permission.decorator';
import { PackManagerController } from './pack-manager.controller';

describe('Pack Manager security permissions', () => {
  const guard = new IamPermissionGuard(new Reflector());

  const contextFor = (handler: (...args: any[]) => unknown, permissions: string[]) => ({
    getHandler: () => handler,
    getClass: () => PackManagerController,
    switchToHttp: () => ({
      getRequest: () => ({ iamPrincipal: { permissions } }),
    }),
  }) as any;

  it.each([
    ['validate', 'pack.version.validate'],
    ['publish', 'pack.version.publish'],
  ] as const)('denies %s without its dedicated permission', async (method, permission) => {
    const handler = PackManagerController.prototype[method] as (...args: any[]) => unknown;

    expect(Reflect.getMetadata(PERMISSION_KEY, handler)).toBe(permission);
    await expect(guard.canActivate(contextFor(handler, []))).rejects.toBeInstanceOf(ForbiddenException);
    await expect(guard.canActivate(contextFor(handler, [permission]))).resolves.toBe(true);
  });
});
