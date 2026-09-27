import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IamError } from './iam-error';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class IamTenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async listTenants(params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (params?.status) where.status = params.status;
    if (params?.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const take = Math.min(params?.limit ?? 50, 200);
    const skip = params?.page ? (params.page - 1) * take : 0;

    return this.prisma.tenant.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        organizations: true,
        subscriptions: true,
      },
    });
  }

  async getTenant(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        organizations: true,
        memberships: { include: { user: { select: { id: true, username: true, primaryEmail: true } } } },
        subscriptions: { include: { plan: true } },
      },
    });
    if (!tenant) {
      throw new IamError('Tenant introuvable', 404, 'TENANT_NOT_FOUND');
    }
    return tenant;
  }

  async createTenant(dto: CreateTenantDto) {
    const existing = await this.prisma.tenant.findUnique({ where: { code: dto.code } });
    if (existing) {
      throw new IamError('Code de tenant déjà utilisé', 409, 'TENANT_CODE_TAKEN');
    }

    return this.prisma.tenant.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description ?? null,
        status: dto.status as any,
        locale: dto.locale ?? null,
        timezone: dto.timezone ?? null,
        metadata: dto.metadata as any,
      },
    });
  }

  async updateTenant(id: string, dto: UpdateTenantDto, actorId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new IamError('Tenant introuvable', 404, 'TENANT_NOT_FOUND');
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status !== undefined) {
      data.status = dto.status;
      data.statusChangedAt = new Date();
      data.statusChangedBy = actorId;
      data.statusChangedReason = dto.reason ?? `Statut modifié par ${actorId}`;
    }
    if (dto.locale !== undefined) data.locale = dto.locale;
    if (dto.timezone !== undefined) data.timezone = dto.timezone;
    if (dto.metadata !== undefined) data.metadata = dto.metadata;

    return this.prisma.tenant.update({ where: { id }, data });
  }

  async deleteTenant(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new IamError('Tenant introuvable', 404, 'TENANT_NOT_FOUND');
    }

    await this.prisma.tenant.update({
      where: { id },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    });

    return { success: true, message: 'Tenant archivé' };
  }

  async getTenantMemberships(tenantId: string) {
    return this.prisma.membership.findMany({
      where: { tenantId },
      include: { user: { select: { id: true, username: true, primaryEmail: true, firstName: true, lastName: true, displayName: true } } },
    });
  }

  async getTenantSubscriptions(tenantId: string) {
    return this.prisma.subscription.findMany({
      where: { tenantId },
      include: { plan: true },
    });
  }
}
