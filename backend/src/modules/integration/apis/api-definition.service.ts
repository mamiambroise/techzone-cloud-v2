import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { IntegrationErrorCode } from '../../../common/errors/integration-error-code';
import { IntegrationException } from '../../../common/errors/integration-exception';
import { CreateApiDto } from './dto/create-api.dto';
import { UpdateApiDto } from './dto/update-api.dto';
import { NewApiVersionDto } from './dto/new-version.dto';

@Injectable()
export class ApiDefinitionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateApiDto) {
    const existing = await this.prisma.apiDefinition.findUnique({
      where: {
        apiCode_version: {
          apiCode: dto.apiCode,
          version: dto.version,
        },
      },
    });

    if (existing) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_CONTRACT_UNSUPPORTED,
        `API "${dto.apiCode}" version "${dto.version}" already exists`,
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.apiDefinition.create({
      data: {
        apiCode: dto.apiCode,
        version: dto.version,
        basePath: dto.basePath,
        operations: dto.operations as unknown as Prisma.InputJsonValue,
        authentication: (dto.authentication ?? 'BEARER') as any,
        authorization: dto.authorization as unknown as Prisma.InputJsonValue,
        rateLimit: dto.rateLimit as unknown as Prisma.InputJsonValue,
        requestSchema: dto.requestSchema as unknown as Prisma.InputJsonValue,
        responseSchema: dto.responseSchema as unknown as Prisma.InputJsonValue,
        status: 'DRAFT',
      },
    });
  }

  async findAll(query?: {
    apiCode?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(Number(query?.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query?.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.ApiDefinitionWhereInput = {};
    if (query?.apiCode) {
      where.apiCode = query.apiCode;
    }
    if (query?.status) {
      where.status = query.status as any;
    }

    const [items, total] = await Promise.all([
      this.prisma.apiDefinition.findMany({
        where,
        orderBy: [{ apiCode: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.apiDefinition.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: string) {
    const api = await this.prisma.apiDefinition.findUnique({
      where: { id },
    });

    if (!api) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE,
        `API definition "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return api;
  }

  async update(id: string, dto: UpdateApiDto) {
    const existing = await this.findOne(id);

    if (existing.status === 'ACTIVE' || existing.status === 'RETIRED') {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_INVALID_STATE,
        `Cannot modify API definition in state "${existing.status}". Create a new version instead.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prisma.apiDefinition.update({
      where: { id },
      data: {
        ...(dto.basePath !== undefined ? { basePath: dto.basePath } : {}),
        ...(dto.operations !== undefined
          ? { operations: dto.operations as unknown as Prisma.InputJsonValue }
          : {}),
        ...(dto.authentication !== undefined
          ? { authentication: dto.authentication as any }
          : {}),
        ...(dto.authorization !== undefined
          ? { authorization: dto.authorization as unknown as Prisma.InputJsonValue }
          : {}),
        ...(dto.rateLimit !== undefined
          ? { rateLimit: dto.rateLimit as unknown as Prisma.InputJsonValue }
          : {}),
        ...(dto.requestSchema !== undefined
          ? { requestSchema: dto.requestSchema as unknown as Prisma.InputJsonValue }
          : {}),
        ...(dto.responseSchema !== undefined
          ? { responseSchema: dto.responseSchema as unknown as Prisma.InputJsonValue }
          : {}),
      },
    });
  }

  async validate(id: string) {
    const api = await this.findOne(id);

    // Validate operations structure
    const operations = api.operations as any[];
    if (!Array.isArray(operations) || operations.length === 0) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PAYLOAD_INVALID,
        `API validation failed: at least one operation must be defined`,
        HttpStatus.BAD_REQUEST,
      );
    }

    for (const op of operations) {
      if (!op.method || !op.path) {
        throw new IntegrationException(
          IntegrationErrorCode.INTEGRATION_PAYLOAD_INVALID,
          `API operation missing required "method" or "path" attributes`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    return this.prisma.apiDefinition.update({
      where: { id },
      data: {
        status: 'READY',
      },
    });
  }

  async publish(id: string) {
    const api = await this.findOne(id);

    if (api.status !== 'READY' && api.status !== 'DRAFT') {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_INVALID_STATE,
        `API "${api.apiCode}" must be validated/READY before publishing (current: ${api.status})`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prisma.apiDefinition.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        publishedAt: new Date(),
      },
    });
  }

  async deprecate(id: string) {
    const api = await this.findOne(id);

    if (api.status !== 'ACTIVE') {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_INVALID_STATE,
        `API "${api.apiCode}" must be ACTIVE before deprecation`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prisma.apiDefinition.update({
      where: { id },
      data: {
        status: 'DEPRECATED',
      },
    });
  }

  async retire(id: string) {
    const api = await this.findOne(id);

    if (api.status !== 'DEPRECATED' && api.status !== 'ACTIVE') {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_INVALID_STATE,
        `API "${api.apiCode}" cannot be retired from state "${api.status}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prisma.apiDefinition.update({
      where: { id },
      data: {
        status: 'RETIRED',
      },
    });
  }

  async createNewVersion(id: string, dto: NewApiVersionDto) {
    const baseApi = await this.findOne(id);

    // Validate SemVer progression
    const [baseMajor] = baseApi.version.split('.').map(Number);
    const [newMajor] = dto.newVersion.split('.').map(Number);

    if (dto.hasBreakingChanges && newMajor <= baseMajor) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_CONTRACT_UNSUPPORTED,
        `Breaking changes require a major version bump: requested ${dto.newVersion} but current is ${baseApi.version}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const existing = await this.prisma.apiDefinition.findUnique({
      where: {
        apiCode_version: {
          apiCode: baseApi.apiCode,
          version: dto.newVersion,
        },
      },
    });

    if (existing) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_CONTRACT_UNSUPPORTED,
        `Version "${dto.newVersion}" for API "${baseApi.apiCode}" already exists`,
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.apiDefinition.create({
      data: {
        apiCode: baseApi.apiCode,
        version: dto.newVersion,
        basePath: baseApi.basePath,
        operations: baseApi.operations as unknown as Prisma.InputJsonValue,
        authentication: baseApi.authentication,
        authorization: baseApi.authorization as unknown as Prisma.InputJsonValue,
        rateLimit: baseApi.rateLimit as unknown as Prisma.InputJsonValue,
        requestSchema: baseApi.requestSchema as unknown as Prisma.InputJsonValue,
        responseSchema: baseApi.responseSchema as unknown as Prisma.InputJsonValue,
        status: 'DRAFT',
      },
    });
  }
}
