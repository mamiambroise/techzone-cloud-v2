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
import { IamAuthorizationService } from './iam-authorization.service';
import { IamLogger } from './iam.logger';

@Injectable()
export class IamJwtGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly authService: IamAuthService,
    private readonly authorization: IamAuthorizationService,
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
    const cookie = request.headers?.cookie?.split(';').map((part: string) => part.trim()).find((part: string) => part.startsWith('iam_access_token='));
    const token = header?.startsWith('Bearer ') ? header.slice(7) : cookie?.slice('iam_access_token='.length);
    if (!token) {
      IamLogger.authFailure(request, 'UNAUTHENTICATED', 'Token manquant');
      throw new IamError('Token manquant', 401, 'UNAUTHENTICATED');
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      IamLogger.authFailure(request, 'UNAUTHENTICATED', 'Token invalide ou expiré');
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

    const roles = this.deriveRoles(user);
    const effective = await this.authorization.resolve(
      { id: user.id, isAdmin: user.isAdmin },
      session.tenantId,
    );

    const principal = {
      userId: decoded.userId,
      sessionId: decoded.sessionId,
       tenantId: session.tenantId ?? null,
      organizationId: session.organizationId ?? decoded.organizationId ?? null,
      authenticationLevel: decoded.authenticationLevel ?? null,
      // Phase 8 : les permissions effectives proviennent du RBAC tenant
      // (membership ACTIVE → affectations → rôle → role_permission →
      // permission). Les claims du JWT ne sont jamais utilisés comme
      // autorité : un JWT valide mais périmé ne peut pas conserver des
      // droits révoqués, et un changement de tenant les recalcule puisque
      // la résolution est indexée sur `session.tenantId`.
      roles: effective.roles.length > 0 ? effective.roles : roles,
      permissions: effective.permissions,
      isSuperAdmin: effective.isSuperAdmin,
      tenantRoleCodes: effective.tenantRoleCodes,
    };
    request.iamAuth = principal;
    request.iamPrincipal = principal;
    IamLogger.authSuccess(request, principal);

    return true;
  }

  /**
   * Rôle de repli historique, conservé uniquement pour les claims JWT et les
   * contextes sans tenant. L'autorisation effective ne l'utilise plus.
   */
  private deriveRoles(user: { isAdmin?: boolean }): string[] {
    const roles: string[] = [];
    if (user.isAdmin) {
      roles.push('admin');
    } else {
      roles.push('user');
    }
    return roles;
  }
}
