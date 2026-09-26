import { Reflector } from '@nestjs/core';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { IS_PUBLIC_KEY } from './iam.constants';
import { resolveIamPrincipal } from './iam-client';
import { IamPrincipal } from './principal.decorator';
import { IamLogger } from './iam.logger';

/**
 * Global auth guard.
 *
 * PRIVATE BY DEFAULT, PUBLIC BY EXCEPTION.
 * Toute route métier non décorée de @Public() exige un token valide.
 * Aucun fallback system, aucun fallback mock, aucun wildcard.
 */
@Injectable()
export class IamJwtGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async activate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const header = request.headers?.authorization;

    const cookie = request.headers?.cookie?.split(';').map((part: string) => part.trim()).find((part: string) => part.startsWith('iam_access_token='));
    const token = header?.startsWith('Bearer ') ? header.slice(7) : cookie?.slice('iam_access_token='.length);
    if (!token) {
      IamLogger.authFailure(request, 'UNAUTHENTICATED', 'Token manquant');
      throw new UnauthorizedException('Authentication required');
    }


    const principal: IamPrincipal = await resolveIamPrincipal(token);

    request.iamPrincipal = principal;
    IamLogger.authSuccess(request, principal);
    return true;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return this.activate(context);
  }
}
