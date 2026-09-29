import { HttpStatus, Injectable } from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { PlatformErrorCode } from '../../../common/errors/platform-error-code.enum';
import { PlatformException } from '../../../common/errors/platform.exception';

import { CreateEnvironmentDto } from './dto/create-environment.dto';
import { UpdateEnvironmentDto } from './dto/update-environment.dto';

import {
  EnvironmentHistoryAction,
  EnvironmentStatus,
  EnvironmentType,
} from '../../../generated/prisma/enums';

@Injectable()
export class EnvironmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEnvironmentDto, tenantId: string | null) {
    const code = dto.code.trim();

    const existing = await this.prisma.environment.findFirst({
      where: {
        tenantId: tenantId ?? undefined,
        code,
      },
    });

    if (existing) {
      throw new PlatformException(
        PlatformErrorCode.ENVIRONMENT_CODE_EXISTS,
        `Environment with code "${code}" already exists in this tenant`,
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const environment = await tx.environment.create({
        data: {
          code,
          name: dto.name.trim(),
          type: dto.type,
          status: dto.status ?? EnvironmentStatus.ACTIVE,
          region: dto.region?.trim(),
          baseUrl: dto.baseUrl?.trim(),
          configurationRef: dto.configurationRef?.trim(),
          tenantId: tenantId ?? undefined,
        },
      });

      await tx.environmentHistory.create({
        data: {
          environmentId: environment.id,
          action: EnvironmentHistoryAction.CREATED,
          actor: null,
          tenantId: tenantId ?? undefined,
          changes: {
            code: environment.code,
            name: environment.name,
            type: environment.type,
            status: environment.status,
            region: environment.region,
            baseUrl: environment.baseUrl,
            configurationRef: environment.configurationRef,
          },
        },
      });

      return environment;
    });
  }

  async findAll(tenantId: string | null) {
    return this.prisma.environment.findMany({
      where: {
        tenantId: tenantId ?? undefined,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, tenantId: string | null) {
    const environment = await this.prisma.environment.findFirst({
      where: {
        id,
        tenantId: tenantId ?? undefined,
      },
    });

    if (!environment) {
      throw new PlatformException(
        PlatformErrorCode.ENVIRONMENT_NOT_FOUND,
        `Environment "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return environment;
  }

  async update(id: string, dto: UpdateEnvironmentDto, tenantId: string | null) {
    const environment = await this.prisma.environment.findFirst({
      where: {
        id,
        tenantId: tenantId ?? undefined,
      },
    });

    if (!environment) {
      throw new PlatformException(
        PlatformErrorCode.ENVIRONMENT_NOT_FOUND,
        `Environment "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (environment.status === EnvironmentStatus.ARCHIVED) {
      throw new PlatformException(
        PlatformErrorCode.ENVIRONMENT_ARCHIVED,
        'Archived environment cannot be modified',
        HttpStatus.CONFLICT,
      );
    }

    if (
      environment.type === EnvironmentType.PRODUCTION &&
      dto.type &&
      dto.type !== EnvironmentType.PRODUCTION
    ) {
      throw new PlatformException(
        PlatformErrorCode.ENVIRONMENT_PRODUCTION_PROTECTED,
        'Production environment type cannot be changed',
        HttpStatus.CONFLICT,
      );
    }

    const changes: Record<
      string,
      {
        from: string | null;
        to: string | null;
      }
    > = {};

    if (dto.name !== undefined) {
      const newValue = dto.name.trim();

      if (newValue !== environment.name) {
        changes.name = {
          from: environment.name,
          to: newValue,
        };
      }
    }

    if (dto.type !== undefined && dto.type !== environment.type) {
      changes.type = {
        from: environment.type,
        to: dto.type,
      };
    }

    if (dto.status !== undefined && dto.status !== environment.status) {
      changes.status = {
        from: environment.status,
        to: dto.status,
      };
    }

    if (dto.region !== undefined) {
      const newValue = dto.region.trim();

      if (newValue !== environment.region) {
        changes.region = {
          from: environment.region,
          to: newValue,
        };
      }
    }

    if (dto.baseUrl !== undefined) {
      const newValue = dto.baseUrl.trim();

      if (newValue !== environment.baseUrl) {
        changes.baseUrl = {
          from: environment.baseUrl,
          to: newValue,
        };
      }
    }

    if (dto.configurationRef !== undefined) {
      const newValue = dto.configurationRef.trim();

      if (newValue !== environment.configurationRef) {
        changes.configurationRef = {
          from: environment.configurationRef,
          to: newValue,
        };
      }
    }

    if (Object.keys(changes).length === 0) {
      return environment;
    }

    let action: EnvironmentHistoryAction = EnvironmentHistoryAction.UPDATED;

    if (changes.status) {
      action = EnvironmentHistoryAction.STATUS_CHANGED;
    } else if (changes.configurationRef) {
      action = EnvironmentHistoryAction.CONFIGURATION_CHANGED;
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedEnvironment = await tx.environment.update({
        where: {
          id,
        },
        data: {
          name: dto.name?.trim(),
          type: dto.type,
          status: dto.status,
          region: dto.region?.trim(),
          baseUrl: dto.baseUrl?.trim(),
          configurationRef: dto.configurationRef?.trim(),
        },
      });

      await tx.environmentHistory.create({
        data: {
          environmentId: id,
          action,
          actor: null,
          tenantId: tenantId ?? undefined,
          changes: changes as Prisma.InputJsonValue,
        },
      });

      return updatedEnvironment;
    });
  }

  async archive(id: string, tenantId: string | null) {
    const environment = await this.prisma.environment.findFirst({
      where: {
        id,
        tenantId: tenantId ?? undefined,
      },
    });

    if (!environment) {
      throw new PlatformException(
        PlatformErrorCode.ENVIRONMENT_NOT_FOUND,
        `Environment "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (environment.status === EnvironmentStatus.ARCHIVED) {
      return environment;
    }

    if (environment.type === EnvironmentType.PRODUCTION) {
      throw new PlatformException(
        PlatformErrorCode.ENVIRONMENT_PRODUCTION_PROTECTED,
        'Production environment cannot be archived',
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const archivedEnvironment = await tx.environment.update({
        where: {
          id,
        },
        data: {
          status: EnvironmentStatus.ARCHIVED,
        },
      });

      await tx.environmentHistory.create({
        data: {
          environmentId: id,
          action: EnvironmentHistoryAction.ARCHIVED,
          actor: null,
          tenantId: tenantId ?? undefined,
          changes: {
            status: {
              from: environment.status,
              to: EnvironmentStatus.ARCHIVED,
            },
          },
        },
      });

      return archivedEnvironment;
    });
  }

  async getHistory(id: string, tenantId: string | null) {
    await this.findOne(id, tenantId);

    return this.prisma.environmentHistory.findMany({
      where: {
        environmentId: id,
        tenantId: tenantId ?? undefined,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
