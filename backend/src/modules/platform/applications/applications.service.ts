import { HttpStatus, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { PlatformErrorCode } from '../../../common/errors/platform-error-code.enum';
import { PlatformException } from '../../../common/errors/platform.exception';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { DuplicateApplicationDto } from './dto/duplicate-application.dto';
import { ApplicationStatus } from '../../../generated/prisma/enums';
import { BusinessDefinitionCopyService } from '../../business-manager/business-definition-copy.service';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly definitionCopy: BusinessDefinitionCopyService,
  ) {}

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

  /**
   * Restaure une application archivée. Seule la dernière version non archivée
   * est remise en DRAFT : les versions historiquement publiées restent
   * immuables, conformément au cycle de vie existant.
   */
  async restore(id: string, tenantId: string | null) {
    const application = await this.findOne(id, tenantId);

    if (application.status !== ApplicationStatus.ARCHIVED) {
      return application;
    }

    const restorable = application.versions.find(
      (version) =>
        version.status !== 'ARCHIVED' &&
        version.status !== 'SUPERSEDED' &&
        version.status !== 'DEPRECATED',
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.application.update({
        where: { id },
        data: { status: ApplicationStatus.ACTIVE },
      });

      // Une application restaurée doit au moins exposer une version modifiable.
      if (!restorable) {
        await tx.applicationVersion.create({
          data: {
            applicationId: application.id,
            version: '1.0.0',
            releaseNotes: 'Version initiale créée lors de la restauration',
            status: 'DRAFT',
            tenantId: tenantId ?? undefined,
          },
        });
      } else if (restorable.status === 'ACTIVE') {
        await tx.applicationVersion.update({
          where: { id: restorable.id },
          data: { status: 'SUPERSEDED', publishedAt: null },
        });
      }

      return tx.application.findUnique({
        where: { id },
        include: { versions: { orderBy: { createdAt: 'desc' } } },
      });
    });
  }

  /**
   * Duplique une application : nouvelle application (code unique) avec une
   * version DRAFT. Par défaut la définition métier de la dernière version
   * source est recopiée afin que la copie soit réellement exploitable.
   */
  async duplicate(id: string, dto: DuplicateApplicationDto, tenantId: string | null) {
    const source = await this.findOne(id, tenantId);

    if (source.status === ApplicationStatus.ARCHIVED) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_ARCHIVED,
        'Archived application cannot be duplicated',
        HttpStatus.CONFLICT,
      );
    }

    const code = (dto.code?.trim() || `${source.code}-copy`).slice(0, 100);
    const name = (dto.name?.trim() || `${source.name} (copie)`).slice(0, 255);
    const copyDefinition = dto.copyDefinition !== false;

    const existing = await this.prisma.application.findFirst({
      where: { tenantId: tenantId ?? undefined, code },
      select: { id: true },
    });
    if (existing) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_CODE_EXISTS,
        `Application with code "${code}" already exists in this tenant`,
        HttpStatus.CONFLICT,
      );
    }

    const sourceVersion = source.versions.find(
      (version) =>
        version.status !== 'ARCHIVED' &&
        version.status !== 'SUPERSEDED' &&
        version.status !== 'DEPRECATED',
    ) ?? source.versions[0];

    const created = await this.prisma.$transaction(async (tx) => {
      const application = await tx.application.create({
        data: {
          code,
          name,
          description: source.description,
          status: ApplicationStatus.ACTIVE,
          tenantId: tenantId ?? undefined,
          tenantScope: source.tenantScope,
        },
        select: { id: true },
      });

      const version = await tx.applicationVersion.create({
        data: {
          applicationId: application.id,
          version: '1.0.0',
          releaseNotes: `Dupliqué depuis ${source.name} (${source.code})`,
          status: 'DRAFT',
          tenantId: tenantId ?? undefined,
        },
        select: { id: true },
      });

      return { application, version };
    });

    let copied: Awaited<ReturnType<BusinessDefinitionCopyService['copy']>> | null = null;
    if (copyDefinition && sourceVersion) {
      copied = await this.definitionCopy.copy(sourceVersion.id, created.version.id, tenantId);
    }

    const application = await this.prisma.application.findUnique({
      where: { id: created.application.id },
      include: { versions: { orderBy: { createdAt: 'desc' } } },
    });

    return { ...application, copiedFrom: source.id, copiedDefinition: copied };
  }
}
