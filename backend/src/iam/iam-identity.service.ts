import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IamError } from './iam-error';
import { CreateIdentityDto } from './dto/create-identity.dto';
import { UpdateIdentityDto } from './dto/update-identity.dto';

@Injectable()
export class IamIdentityService {
  constructor(private readonly prisma: PrismaService) {}

  async listIdentities(params?: {
    type?: string;
    status?: string;
    search?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }) {
    const where: Record<string, unknown> = {};
    if (params?.type) where.type = params.type;
    if (params?.status) where.status = params.status;
    if (params?.search) {
      where.OR = [
        { subject: { contains: params.search, mode: 'insensitive' } },
        { provider: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const take = Math.min(params?.limit ?? 50, 200);
    const skip = params?.page ? (params.page - 1) * take : 0;

    const identities = await this.prisma.identity.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    if (params?.userId) {
      const userIdentities = await this.prisma.userIdentity.findMany({
        where: { userId: params.userId },
        include: { identity: true },
      });
      return userIdentities.map((ui) => ui.identity);
    }

    return identities;
  }

  async getIdentity(id: string) {
    const identity = await this.prisma.identity.findUnique({ where: { id } });
    if (!identity) {
      throw new IamError('Identity introuvable', 404, 'IDENTITY_NOT_FOUND');
    }
    return identity;
  }

  async createIdentity(dto: CreateIdentityDto) {
    return this.prisma.identity.create({
      data: {
        type: dto.type as any,
        provider: dto.provider ?? null,
        subject: dto.subject ?? null,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        status: 'PENDING' as any,
        confidence: dto.confidence ?? null,
        metadata: dto.metadata ? JSON.parse(JSON.stringify(dto.metadata)) : undefined,
      },
    });
  }

  async updateIdentity(id: string, dto: UpdateIdentityDto) {
    const identity = await this.prisma.identity.findUnique({ where: { id } });
    if (!identity) {
      throw new IamError('Identity introuvable', 404, 'IDENTITY_NOT_FOUND');
    }

    const data: any = {};
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.provider !== undefined) data.provider = dto.provider;
    if (dto.subject !== undefined) data.subject = dto.subject;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.confidence !== undefined) data.confidence = dto.confidence;
    if (dto.metadata !== undefined) data.metadata = JSON.parse(JSON.stringify(dto.metadata));

    if (dto.status === 'VERIFIED') {
      data.verifiedAt = new Date();
    }

    return this.prisma.identity.update({ where: { id }, data });
  }

  async deleteIdentity(id: string) {
    const identity = await this.prisma.identity.findUnique({ where: { id } });
    if (!identity) {
      throw new IamError('Identity introuvable', 404, 'IDENTITY_NOT_FOUND');
    }
    await this.prisma.identity.update({
      where: { id },
      data: { status: 'ARCHIVED' as any, archivedAt: new Date() },
    });
    return { success: true, message: 'Identity archivée' };
  }
}
