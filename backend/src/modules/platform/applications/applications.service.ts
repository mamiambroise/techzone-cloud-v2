import { HttpStatus, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { PlatformErrorCode } from '../../../common/errors/platform-error-code.enum';
import { PlatformException } from '../../../common/errors/platform.exception';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ApplicationStatus } from '../../../generated/prisma/enums';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateApplicationDto, tenantId: string | null) {
    const code = dto.code.trim();

    const existing = await this.prisma.application.findFirst({
      where: {
        tenantId: tenantId ?? undefined,
        code,
      },
    });

    if (existing) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_CODE_EXISTS,
        `Application with code "${code}" already exists in this tenant`,
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.application.create({
      data: {
        code,
        name: dto.name.trim(),
        description: dto.description?.trim(),
        tenantId: tenantId ?? undefined,
        tenantScope: dto.tenantScope?.trim() ?? 'TENANT',
      },
    });
  }

  async findAll(tenantId: string | null) {
    return this.prisma.application.findMany({
      where: {
        tenantId: tenantId ?? undefined,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, tenantId: string | null) {
    const application = await this.prisma.application.findFirst({
      where: {
        id,
        tenantId: tenantId ?? undefined,
      },
      include: {
        versions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!application) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_NOT_FOUND,
        `Application "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return application;
  }

  async update(id: string, dto: UpdateApplicationDto, tenantId: string | null) {
    const application = await this.prisma.application.findFirst({
      where: {
        id,
        tenantId: tenantId ?? undefined,
      },
    });

    if (!application) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_NOT_FOUND,
        `Application "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (application.status === ApplicationStatus.ARCHIVED) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_ARCHIVED,
        'Archived application cannot be modified',
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.application.update({
      where: {
        id,
      },
      data: {
        name: dto.name?.trim(),
        description: dto.description?.trim(),
        tenantScope: dto.tenantScope?.trim(),
      },
    });
  }

  async archive(id: string, tenantId: string | null) {
    const application = await this.prisma.application.findFirst({
      where: {
        id,
        tenantId: tenantId ?? undefined,
      },
    });

    if (!application) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_NOT_FOUND,
        `Application "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (application.status === ApplicationStatus.ARCHIVED) {
      return application;
    }

    return this.prisma.application.update({
      where: {
        id,
      },
      data: {
        status: ApplicationStatus.ARCHIVED,
      },
    });
  }
}
