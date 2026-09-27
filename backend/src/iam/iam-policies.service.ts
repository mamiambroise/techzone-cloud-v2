import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IamError } from './iam-error';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';

@Injectable()
export class IamPoliciesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPolicies(params?: {
    tenantId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
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

    const take = Math.min(params?.limit ?? 50, 200);
    const skip = params?.page ? (params.page - 1) * take : 0;

    return this.prisma.accessPolicy.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { conditions: true },
    });
  }

  async getPolicy(id: string) {
    const policy = await this.prisma.accessPolicy.findUnique({
      where: { id },
      include: { conditions: true },
    });
    if (!policy) {
      throw new IamError('Policy introuvable', 404, 'POLICY_NOT_FOUND');
    }
    return policy;
  }

  async createPolicy(dto: CreatePolicyDto) {
    return this.prisma.accessPolicy.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description ?? null,
        status: dto.status as any,
        effect: dto.effect as any,
        priority: dto.priority ?? 100,
        resource: dto.resource ?? null,
        action: dto.action ?? null,
        subjectType: dto.subjectType ?? null,
        subjectRef: dto.subjectRef ?? null,
        metadata: dto.metadata as any,
      },
    });
  }

  async updatePolicy(id: string, dto: UpdatePolicyDto) {
    const policy = await this.prisma.accessPolicy.findUnique({ where: { id } });
    if (!policy) {
      throw new IamError('Policy introuvable', 404, 'POLICY_NOT_FOUND');
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.effect !== undefined) data.effect = dto.effect;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.resource !== undefined) data.resource = dto.resource;
    if (dto.action !== undefined) data.action = dto.action;
    if (dto.subjectType !== undefined) data.subjectType = dto.subjectType;
    if (dto.subjectRef !== undefined) data.subjectRef = dto.subjectRef;
    if (dto.metadata !== undefined) data.metadata = dto.metadata;

    return this.prisma.accessPolicy.update({ where: { id }, data });
  }

  async deletePolicy(id: string) {
    const policy = await this.prisma.accessPolicy.findUnique({ where: { id } });
    if (!policy) {
      throw new IamError('Policy introuvable', 404, 'POLICY_NOT_FOUND');
    }

    await this.prisma.policyCondition.deleteMany({ where: { policyId: id } });
    await this.prisma.accessPolicy.update({
      where: { id },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    });

    return { success: true, message: 'Policy archivée' };
  }
}
