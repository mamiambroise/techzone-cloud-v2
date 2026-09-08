import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IamError } from './iam-error';

@Injectable()
export class IamAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const auth = request.iamAuth;

    if (!auth?.userId) {
      throw new IamError('Non authentifié', 401, 'UNAUTHENTICATED');
    }

    const user = await this.prisma.iamUser.findUnique({ where: { id: auth.userId } });
    if (!user) {
      throw new IamError('Utilisateur introuvable', 401, 'USER_NOT_FOUND');
    }
    if (!user.isAdmin) {
      throw new IamError('Accès réservé aux administrateurs', 403, 'ADMIN_REQUIRED');
    }
    return true;
  }
}