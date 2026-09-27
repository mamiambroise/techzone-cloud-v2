import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IamError } from './iam-error';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class IamGovernanceService {
  constructor(private readonly prisma: PrismaService) {}

  async listRoles(params?: {
    tenantId?: string;
    status?: string;
    search?: string;
  }) {
    const where: any = {};
    if (params?.tenantId) where.tenantId = params.tenantId;
    if (params?.status) where.status = params.status;
    if (params?.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.role.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { permissions: { include: { permission: true } } },
    });
  }

  async getRole(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) {
      throw new IamError('Rôle introuvable', 404, 'ROLE_NOT_FOUND');
    }
    return role;
  }

  async createRole(dto: CreateRoleDto, tenantId?: string) {
    const existing = await this.prisma.role.findFirst({
      where: { code: dto.code, tenantId: tenantId ?? null },
    });
    if (existing) {
      throw new IamError('Code de rôle déjà utilisé', 409, 'ROLE_CODE_TAKEN');
    }

    return this.prisma.role.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description ?? null,
        status: 'ACTIVE',
        system: dto.system ?? false,
        privileged: false,
        metadata: dto.metadata ? JSON.parse(JSON.stringify(dto.metadata)) : undefined,
        tenantId: tenantId ?? null,
      },
    });
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new IamError('Rôle introuvable', 404, 'ROLE_NOT_FOUND');
    }
    if (role.system) {
      throw new IamError('Impossible de modifier un rôle système', 403, 'SYSTEM_ROLE_IMMUTABLE');
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.system !== undefined) data.system = dto.system;
    if (dto.metadata !== undefined) data.metadata = dto.metadata;

    return this.prisma.role.update({ where: { id }, data });
  }

  async deleteRole(id: string, actorId: string) {
    const role = await this.prisma.role.findUnique({ where: { id }, include: { assignments: true } });
    if (!role) {
      throw new IamError('Rôle introuvable', 404, 'ROLE_NOT_FOUND');
    }
    if (role.system) {
      throw new IamError('Impossible de supprimer un rôle système', 403, 'SYSTEM_ROLE_IMMUTABLE');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      await tx.roleAssignment.updateMany({
        where: { roleId: id, revokedAt: null },
        data: { revokedAt: new Date(), revokedBy: actorId, revokeReason: 'ROLE_DELETED' },
      });
      await tx.role.update({
        where: { id },
        data: { status: 'DISABLED', archivedAt: new Date() },
      });
      return { success: true, message: 'Rôle désactivé' };
    });
  }

  async listPermissions() {
    return this.prisma.permission.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async getRolePermissions(roleId: string) {
    return this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });
  }

  async assignPermission(roleId: string, permissionId: string, actorId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new IamError('Rôle introuvable', 404, 'ROLE_NOT_FOUND');
    }
    const permission = await this.prisma.permission.findUnique({ where: { id: permissionId } });
    if (!permission) {
      throw new IamError('Permission introuvable', 404, 'PERMISSION_NOT_FOUND');
    }

    return this.prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId } },
      create: { roleId, permissionId, grantedBy: actorId },
      update: { revokedAt: null, revokedBy: null },
    });
  }

  async revokePermission(roleId: string, permissionId: string, actorId: string) {
    await this.prisma.rolePermission.update({
      where: { roleId_permissionId: { roleId, permissionId } },
      data: { revokedAt: new Date(), revokedBy: actorId },
    });
    return { success: true, message: 'Permission révoquée' };
  }

  async listAssignments(params?: {
    userId?: string;
    roleId?: string;
    tenantId?: string;
    status?: string;
  }) {
    const where: any = {};
    if (params?.userId) where.userId = params.userId;
    if (params?.roleId) where.roleId = params.roleId;
    if (params?.tenantId) where.tenantId = params.tenantId;
    if (params?.status === 'active') {
      where.revokedAt = null;
    } else if (params?.status === 'revoked') {
      where.revokedAt = { not: null };
    }

    return this.prisma.roleAssignment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        role: { select: { id: true, code: true, name: true } },
        user: { select: { id: true, username: true, primaryEmail: true } },
        group: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async revokeAssignment(assignmentId: string, actorId: string) {
    const assignment = await this.prisma.roleAssignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) {
      throw new IamError('Assignation introuvable', 404, 'ASSIGNMENT_NOT_FOUND');
    }
    if (assignment.revokedAt) {
      return { success: true, message: 'Assignation déjà révoquée' };
    }

    await this.prisma.roleAssignment.update({
      where: { id: assignmentId },
      data: { revokedAt: new Date(), revokedBy: actorId, revokeReason: 'ADMIN_REVOKED' },
    });

    return { success: true, message: 'Assignation révoquée' };
  }
}
