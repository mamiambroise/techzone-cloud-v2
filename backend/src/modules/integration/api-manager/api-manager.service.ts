import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, ApiStatus, ApiAuthenticationType } from '../../../generated/prisma/client';
import { IntegrationErrorCode } from '../../../common/errors/integration-error-code';
import { IntegrationException } from '../../../common/errors/integration-exception';
import { CreateApiDefinitionDto, UpdateApiDefinitionDto, CreateApiVersionDto, ApiVersionLifecycleStatus, PaginatedApiResponse } from './dto/create-api-definition.dto';
import { IdempotencyService } from '../../../common/resilience/idempotency.service';
import { randomUUID } from 'node:crypto';

@Injectable()
export class ApiManagerService {
  private static readonly ALLOWED_TRANSITIONS: Record<
    ApiVersionLifecycleStatus,
    ApiVersionLifecycleStatus[]
  > = {
    DRAFT: ['VALIDATING', 'RETIRED'],
    VALIDATING: ['DRAFT', 'READY'],
    READY: ['ACTIVE', 'DEPRECATED', 'RETIRED'],
    ACTIVE: ['DEPRECATED', 'RETIRED'],
    DEPRECATED: ['RETIRED'],
    RETIRED: [],
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  async create(dto: CreateApiDefinitionDto) {
    const existing = await this.prisma.apiDefinition.findUnique({
      where: {
        apiCode_version: {
          apiCode: dto.apiCode,
          version: dto.version,
        },
      },
      select: { id: true },
    });

    if (existing) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_CONTRACT_UNSUPPORTED,
        `API definition "${dto.apiCode}" version "${dto.version}" already exists`,
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.apiDefinition.create({
      data: {
        apiCode: dto.apiCode,
        version: dto.version,
        basePath: dto.basePath,
        operations: dto.operations as Prisma.InputJsonValue,
        authentication: dto.authentication as ApiAuthenticationType,
        authorization: dto.authorization as Prisma.InputJsonValue,
        rateLimit: dto.rateLimit as Prisma.InputJsonValue,
        requestSchema: dto.requestSchema as Prisma.InputJsonValue,
        responseSchema: dto.responseSchema as Prisma.InputJsonValue,
        status: 'DRAFT' as ApiStatus,
      },
    });
  }

  async findOne(id: string) {
    const api = await this.prisma.apiDefinition.findUnique({
      where: { id },
    });

    if (!api) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_CONTRACT_UNSUPPORTED,
        `API definition "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return api;
  }

  async findByCodeAndVersion(apiCode: string, version: string) {
    const api = await this.prisma.apiDefinition.findUnique({
      where: {
        apiCode_version: { apiCode, version },
      },
    });

    if (!api) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_CONTRACT_UNSUPPORTED,
        `API "${apiCode}" version "${version}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return api;
  }

  async findAll(params?: {
    page?: number;
    limit?: number;
    status?: string;
    apiCode?: string;
  }): Promise<PaginatedApiResponse> {
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.max(1, Math.min(params?.limit ?? 20, 100));
    const skip = (page - 1) * limit;

    const where: Prisma.ApiDefinitionWhereInput = {};

    if (params?.status) {
      where.status = params.status as ApiStatus;
    }

    if (params?.apiCode) {
      where.apiCode = { contains: params.apiCode };
    }

    const [data, total] = await Promise.all([
      this.prisma.apiDefinition.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.apiDefinition.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, dto: UpdateApiDefinitionDto) {
    const api = await this.prisma.apiDefinition.findUnique({
      where: { id },
    });

    if (!api) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_CONTRACT_UNSUPPORTED,
        `API definition "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prisma.apiDefinition.update({
      where: { id },
      data: {
        basePath: dto.basePath,
        operations: dto.operations as Prisma.InputJsonValue | undefined,
        authentication: dto.authentication as ApiAuthenticationType | undefined,
        authorization: dto.authorization as Prisma.InputJsonValue | undefined,
        rateLimit: dto.rateLimit as Prisma.InputJsonValue | undefined,
        requestSchema: dto.requestSchema as Prisma.InputJsonValue | undefined,
        responseSchema: dto.responseSchema as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async transition(
    id: string,
    status: ApiVersionLifecycleStatus,
    idempotencyKey?: string,
  ) {
    const transitionOperation = async () => {
      const api = await this.prisma.apiDefinition.findUnique({
        where: { id },
      });

      if (!api) {
        throw new IntegrationException(
          IntegrationErrorCode.INTEGRATION_CONTRACT_UNSUPPORTED,
          `API definition "${id}" not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      if (api.status === status) {
        return api;
      }

      const allowed = ApiManagerService.ALLOWED_TRANSITIONS[api.status as ApiVersionLifecycleStatus];
      if (!allowed || !allowed.includes(status)) {
        throw new IntegrationException(
          IntegrationErrorCode.INTEGRATION_INVALID_STATE,
          `Cannot transition API "${api.apiCode}" v${api.version} from ${api.status} to ${status}`,
          HttpStatus.CONFLICT,
        );
      }

      const data: { status: ApiStatus; publishedAt?: Date } = {
        status: status as ApiStatus,
      };

      if (status === 'ACTIVE' && !api.publishedAt) {
        data.publishedAt = new Date();
      }

      return this.prisma.apiDefinition.update({
        where: { id },
        data,
      });
    };

    if (idempotencyKey) {
      return this.idempotencyService.execute(idempotencyKey, transitionOperation);
    }

    return transitionOperation();
  }

  async createVersion(dto: CreateApiVersionDto) {
    const existing = await this.prisma.apiDefinition.findUnique({
      where: {
        apiCode_version: {
          apiCode: dto.apiCode,
          version: dto.version,
        },
      },
      select: { id: true },
    });

    if (existing) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_CONTRACT_UNSUPPORTED,
        `API definition "${dto.apiCode}" version "${dto.version}" already exists`,
        HttpStatus.CONFLICT,
      );
    }

    const data: { status: ApiStatus; publishedAt?: Date } = {
      status: 'DRAFT' as ApiStatus,
    };

    if (dto.breakingChangeReason) {
      data.publishedAt = undefined;
    }

    return this.prisma.apiDefinition.create({
      data: {
        apiCode: dto.apiCode,
        version: dto.version,
        basePath: dto.basePath,
        operations: dto.operations as Prisma.InputJsonValue,
        authentication: dto.authentication as ApiAuthenticationType,
        authorization: dto.authorization as Prisma.InputJsonValue,
        rateLimit: dto.rateLimit as Prisma.InputJsonValue,
        requestSchema: dto.requestSchema as Prisma.InputJsonValue,
        responseSchema: dto.responseSchema as Prisma.InputJsonValue,
        status: data.status,
        ...(data.publishedAt !== undefined ? { publishedAt: data.publishedAt } : {}),
      },
    });
  }

  async remove(id: string) {
    const api = await this.prisma.apiDefinition.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!api) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_CONTRACT_UNSUPPORTED,
        `API definition "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (api.status === 'RETIRED') {
      return this.prisma.apiDefinition.delete({ where: { id } });
    }

    throw new IntegrationException(
      IntegrationErrorCode.INTEGRATION_INVALID_STATE,
      `API definition "${id}" must be RETIRED before deletion`,
      HttpStatus.CONFLICT,
    );
  }

  async generateTraceId(): Promise<string> {
    return randomUUID();
  }
}
