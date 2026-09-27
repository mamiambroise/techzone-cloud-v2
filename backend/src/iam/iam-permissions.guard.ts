import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { IamAuthContext } from './decorators/current-user.decorator';
import { hasPermission } from './decorators/current-user.decorator';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

@Injectable()
export class IamPermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const principal: IamAuthContext = request.iamAuth;
    if (!principal) {
      throw new ForbiddenException('Principal introuvable');
    }

    for (const permission of required) {
      if (!hasPermission(principal, permission)) {
        throw new ForbiddenException(`Permission insuffisante : ${permission}`);
      }
    }
    return true;
  }
}
