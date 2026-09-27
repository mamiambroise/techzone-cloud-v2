import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { IamError } from './iam-error';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12);

@Injectable()
export class IamAdminService {
  constructor(private readonly prisma: PrismaService) {}

  private sanitizeUser(user: {
    id: string;
    username: string;
    primaryEmail: string;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    status: string;
    isAdmin: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      username: user.username,
      primaryEmail: user.primaryEmail,
      phone: user.phone ?? null,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      displayName: user.displayName ?? null,
      status: user.status,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async listUsers(status?: string, search?: string) {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { primaryEmail: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.iamUser.findMany({ where, orderBy: { createdAt: 'desc' } });
    return users.map((u) => this.sanitizeUser(u));
  }

  async getUserById(userId: string) {
    const user = await this.prisma.iamUser.findUnique({ where: { id: userId } });
    if (!user) {
      throw new IamError('Utilisateur introuvable', 404, 'USER_NOT_FOUND');
    }
    return this.sanitizeUser(user);
  }

  async createUser(dto: CreateUserDto) {
    if (!dto.password || dto.password.length < 10) {
      throw new IamError(
        'Le mot de passe doit contenir au moins 10 caractères',
        422,
        'PASSWORD_TOO_SHORT',
      );
    }
    const existing = await this.prisma.iamUser.findFirst({
      where: { OR: [{ username: dto.username }, { primaryEmail: dto.email }] },
    });
    if (existing) {
      throw new IamError(
        "Nom d'utilisateur ou email déjà utilisé",
        409,
        'USER_ALREADY_EXISTS',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.iamUser.create({
        data: {
          username: dto.username,
          primaryEmail: dto.email,
          phone: dto.phone ?? null,
          firstName: dto.firstName,
          lastName: dto.lastName,
          displayName: dto.displayName ?? null,
          status: (dto.status ?? 'ACTIVE') as any,
          isAdmin: dto.isAdmin ?? false,
          statusChangedAt: new Date(),
          statusChangedBy: 'iam-admin-console',
          statusChangedReason: 'Création via console IAM',
        },
      });
      await tx.iamCredential.create({
        data: { userId: created.id, type: 'PASSWORD', status: 'ACTIVE', secretHash: hashedPassword },
      });
      await tx.iamPasswordHistory.create({
        data: { userId: created.id, passwordHash: hashedPassword },
      });
      return created;
    });

    return this.sanitizeUser(user);
  }

  async updateUserStatus(userId: string, dto: UpdateUserStatusDto, actorId: string) {
    const allowed: Record<string, boolean> = {
      ACTIVE: true,
      SUSPENDED: true,
      DISABLED: true,
    };
    if (!allowed[dto.status]) {
      throw new IamError('Statut invalide', 422, 'INVALID_STATUS');
    }
    const user = await this.prisma.iamUser.findUnique({ where: { id: userId } });
    if (!user) {
      throw new IamError('Utilisateur introuvable', 404, 'USER_NOT_FOUND');
    }
    if (user.id === actorId && dto.status !== 'ACTIVE') {
      throw new IamError("Impossible de modifier son propre statut", 422, 'SELF_STATUS_CHANGE');
    }

    return this.sanitizeUser(
      await this.prisma.iamUser.update({
        where: { id: userId },
        data: {
          status: dto.status as any,
          statusChangedAt: new Date(),
          statusChangedBy: actorId,
          statusChangedReason: dto.reason ?? `Changement de statut via console (${dto.status})`,
        },
      }),
    );
  }

  async deleteUser(userId: string, actorId: string) {
    if (userId === actorId) {
      throw new IamError('Impossible de supprimer son propre compte', 422, 'SELF_DELETE');
    }
    const user = await this.prisma.iamUser.findUnique({ where: { id: userId } });
    if (!user) {
      throw new IamError('Utilisateur introuvable', 404, 'USER_NOT_FOUND');
    }
    await this.prisma.iamSession.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'REVOKED', revokedAt: new Date(), revokedBy: actorId, revokeReason: 'ADMIN_DELETE' },
    });
    await this.prisma.iamUser.delete({ where: { id: userId } });
    return { success: true, message: 'Utilisateur supprimé' };
  }

  async listSessions(status?: string) {
    const where: Record<string, unknown> | undefined = status ? { status: status as any } : undefined;
    const sessions = await this.prisma.iamSession.findMany({
      where,
      orderBy: { lastActivityAt: 'desc' },
      take: 200,
      include: { user: { select: { username: true, primaryEmail: true, firstName: true, lastName: true } } },
    });
    return sessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      username: (s as any).user?.username ?? null,
      email: (s as any).user?.primaryEmail ?? null,
      status: s.status,
      authenticationLevel: s.authenticationLevel,
      riskLevel: s.riskLevel,
      environment: s.environment,
      createdAt: s.createdAt,
      lastActivityAt: s.lastActivityAt,
      expiresAt: s.expiresAt,
      idleExpiresAt: s.idleExpiresAt,
      revokeReason: s.revokeReason,
    }));
  }

  async revokeSession(sessionId: string, actorId: string) {
    const session = await this.prisma.iamSession.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new IamError('Session introuvable', 404, 'SESSION_NOT_FOUND');
    }
    await this.prisma.iamRefreshToken.updateMany({
      where: { sessionId, status: 'ACTIVE' },
      data: { status: 'REVOKED', revokedAt: new Date(), revokeReason: 'ADMIN_REVOKED' },
    });
    await this.prisma.iamSession.update({
      where: { id: sessionId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokedBy: actorId,
        revokeReason: 'ADMIN_REVOKED',
        statusChangedAt: new Date(),
      },
    });
    return { success: true, message: 'Session révoquée' };
  }

  async stats() {
    const users = await this.prisma.iamUser.count();
    const activeUsers = await this.prisma.iamUser.count({ where: { status: 'ACTIVE' } });
    const pendingUsers = await this.prisma.iamUser.count({ where: { status: 'PENDING' } });
    const sessions = await this.prisma.iamSession.count();
    const activeSessions = await this.prisma.iamSession.count({ where: { status: 'ACTIVE' } });
    return { users, activeUsers, pendingUsers, sessions, activeSessions };
  }
}