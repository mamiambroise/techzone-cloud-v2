import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { IamError } from './iam-error';
import { IS_PUBLIC_KEY } from './iam.constants';
import { verifyAccessToken } from './jwt.util';
import { IamAuthService } from './iam-auth.service';

@Injectable()
export class IamJwtGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly authService: IamAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const header = request.headers?.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new IamError('Token manquant', 401, 'UNAUTHENTICATED');
    }

    const token = header.slice('Bearer '.length);
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      throw new IamError('Token invalide ou expiré', 401, 'UNAUTHENTICATED');
    }

    const session = await this.prisma.iamSession.findUnique({
      where: { id: decoded.sessionId },
    });
    if (!session) {
      throw new IamError('Session introuvable', 401, 'SESSION_NOT_FOUND');
    }

    await this.authService.assertSessionUsable(session);

    await this.prisma.iamSession.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() },
    });

    const user = await this.prisma.iamUser.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      throw new IamError('Utilisateur introuvable', 401, 'USER_NOT_FOUND');
    }

    request.iamAuth = {
      userId: decoded.userId,
      sessionId: decoded.sessionId,
      tenantId: decoded.tenantId ?? null,
      organizationId: decoded.organizationId ?? null,
      authenticationLevel: decoded.authenticationLevel ?? null,
    };

    return true;
  }
}