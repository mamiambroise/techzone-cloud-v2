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
import { ROLE_PERMISSIONS, ROLES } from './iam.constants';

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
    const cookie = request.headers?.cookie?.split(';').map((part: string) => part.trim()).find((part: string) => part.startsWith('iam_access_token='));
    const token = header?.startsWith('Bearer ') ? header.slice(7) : cookie?.slice('iam_access_token='.length);
    if (!token) {
      throw new IamError('Token manquant', 401, 'UNAUTHENTICATED');
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      throw new IamError('Token invalide ou expiré', 401, 'UNAUTHENTICATED');
    }

    // Token emis par Auth_AIM (iss: techzone-cloud-iam) : authentification
    // deleguee, session validee cote Auth_AIM. Accepte directement.
    // Les roles/permissions proviennent des claims JWT signés par Auth_AIM.
    if (decoded.iss === 'techzone-cloud-iam') {
      const base = process.env.IAM_API_URL || 'http://127.0.0.1:5001/api/iam';
      let response: Response;
      try {
        response = await fetch(`${base}/context/resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ source: 'ERP_API' }),
          signal: AbortSignal.timeout(5000),
        });
      } catch {
        throw new IamError('IAM indisponible', 503, 'IAM_UNAVAILABLE');
      }
      if (!response.ok) throw new IamError('Session IAM non valide', response.status === 401 ? 401 : 503, 'IAM_SESSION_INVALID');
      const { data: iamContext } = await response.json();
      if (iamContext?.status !== 'RESOLVED') throw new IamError('Contexte IAM non résolu', 403, 'IAM_CONTEXT_UNRESOLVED');
      const roles = (iamContext.roles || []).map((role: { code: string }) => role.code);
      const permissions = (iamContext.permissions || []).map((permission: { code: string }) => permission.code);
      request.iamAuth = {
        userId: decoded.userId,
        sessionId: decoded.sessionId,
        tenantId: iamContext.tenant?.tenantId ?? null,
        organizationId: iamContext.tenant?.organizationId ?? null,
        authenticationLevel: decoded.authenticationLevel ?? null,
        roles,
        permissions,
        isExternal: true,
      };
      return true;
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
    const permissions = this.resolvePermissionsFromRoles(roles);

    request.iamAuth = {
      userId: decoded.userId,
      sessionId: decoded.sessionId,
      tenantId: decoded.tenantId ?? null,
      organizationId: decoded.organizationId ?? null,
      authenticationLevel: decoded.authenticationLevel ?? null,
      roles,
      permissions,
    };

    return true;
  }

  private deriveRoles(user: { isAdmin?: boolean }): string[] {
    const roles: string[] = [];
    if (user.isAdmin) {
      roles.push(ROLES.ADMIN);
    } else {
      roles.push(ROLES.USER);
    }
    return roles;
  }

  private resolvePermissionsFromRoles(roles: string[]): string[] {
    if (!roles || roles.length === 0) {
      return [];
    }
    const perms = new Set<string>();
    for (const role of roles) {
      const rolePerms = ROLE_PERMISSIONS[role];
      if (rolePerms) {
        rolePerms.forEach((p) => perms.add(p));
      }
    }
    return Array.from(perms);
  }
}
