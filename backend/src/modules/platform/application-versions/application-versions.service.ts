import { HttpStatus, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { PlatformErrorCode } from '../../../common/errors/platform-error-code.enum';
import { PlatformException } from '../../../common/errors/platform.exception';
import { canTransitionVersion } from '../../../common/lifecycle/version-lifecycle.util';
import { BusinessDefinitionCopyService } from '../../business-manager/business-definition-copy.service';

import { CreateApplicationVersionDto } from './dto/create-app-version.dto';
import { UpdateApplicationVersionDto } from './dto/update-app-version.dto';

@Injectable()
export class ApplicationVersionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly definitionCopy: BusinessDefinitionCopyService,
  ) {}

  async findByApplication(applicationId: string, tenantId: string | null) {
    await this.ensureApplicationExists(applicationId, tenantId);

    return this.prisma.applicationVersion.findMany({
      where: {
        applicationId,
        tenantId: tenantId ?? undefined,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAll(tenantId: string | null) {
    return this.prisma.applicationVersion.findMany({
      where: {
        tenantId: tenantId ?? undefined,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(
    applicationId: string,
    dto: CreateApplicationVersionDto,
    tenantId: string | null,
  ) {
    await this.ensureApplicationExists(applicationId, tenantId);

    const version = dto.version.trim();

    const existing = await this.prisma.applicationVersion.findFirst({
      where: {
        applicationId,
        version,
        tenantId: tenantId ?? undefined,
      },
    });

    if (existing) {
      throw new PlatformException(
        PlatformErrorCode.VERSION_EXISTS,
        `Version "${version}" already exists for this application`,
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.applicationVersion.create({
      data: {
        applicationId,
        version,
        releaseNotes: dto.releaseNotes?.trim(),
        createdFrom: dto.createdFrom?.trim(),
        status: 'DRAFT',
        tenantId: tenantId ?? undefined,
      },
    });
  }

  async findOne(id: string, tenantId: string | null) {
    const version = await this.prisma.applicationVersion.findFirst({
      where: {
        id,
        tenantId: tenantId ?? undefined,
      },
      include: {
        application: true,
        snapshots: true,
        releases: true,
      },
    });

    if (!version) {
      throw new PlatformException(
        PlatformErrorCode.VERSION_NOT_FOUND,
        `Application version "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return version;
  }

  async update(
    id: string,
    dto: UpdateApplicationVersionDto,
    tenantId: string | null,
  ) {
    const version = await this.findOne(id, tenantId);

    const immutableStatuses = [
      'ACTIVE',
      'SUPERSEDED',
      'DEPRECATED',
      'ARCHIVED',
    ];

    if (immutableStatuses.includes(version.status)) {
      throw new PlatformException(
        PlatformErrorCode.VERSION_IMMUTABLE,
        `Version "${version.version}" cannot be modified in status ${version.status}`,
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.applicationVersion.update({
      where: {
        id,
      },
      data: {
        releaseNotes: dto.releaseNotes?.trim(),
      },
    });
  }

  async changeStatus(
    id: string,
    nextStatus: string,
    tenantId: string | null,
  ) {
    const version = await this.findOne(id, tenantId);

    const currentStatus = version.status;

    if (
      currentStatus === 'ACTIVE' &&
      nextStatus !== 'SUPERSEDED' &&
      nextStatus !== 'DEPRECATED'
    ) {
      throw new PlatformException(
        PlatformErrorCode.VERSION_LIFECYCLE_INVALID,
        `Invalid transition ${currentStatus} → ${nextStatus}`,
        HttpStatus.CONFLICT,
      );
    }

    if (!canTransitionVersion(currentStatus as never, nextStatus as never)) {
      throw new PlatformException(
        PlatformErrorCode.VERSION_LIFECYCLE_INVALID,
        `Invalid transition ${currentStatus} → ${nextStatus}`,
        HttpStatus.CONFLICT,
      );
    }

    const data: {
      status: string;
      publishedAt?: Date;
    } = {
      status: nextStatus,
    };

    if (nextStatus === 'ACTIVE') {
      data.publishedAt = new Date();
    }

    return this.prisma.applicationVersion.update({
      where: {
        id,
      },
      data: data as any,
    });
  }

  /**
   * Clone une version : crée une nouvelle version DRAFT et recopie la
   * Business Definition complète (entités, champs, relations, fonctionnalités,
   * navigation, configuration) en ré-échappant toutes les références vers les
   * nouveaux objets. La version source n'est jamais modifiée.
   */
  async clone(id: string, tenantId: string | null) {
    const source = await this.findOne(id, tenantId);

    const newVersion = await this.generateCloneVersion(
      source.applicationId,
      source.version,
      tenantId,
    );

    const created = await this.prisma.applicationVersion.create({
      data: {
        applicationId: source.applicationId,
        version: newVersion,
        releaseNotes: source.releaseNotes
          ? `Cloned from ${source.version}\n\n${source.releaseNotes}`
          : `Cloned from ${source.version}`,
        createdFrom: source.id,
        status: 'DRAFT',
        tenantId: tenantId ?? undefined,
      },
      select: { id: true },
    });

    const copied = await this.definitionCopy.copy(source.id, created.id, tenantId);

    return {
      ...created,
      version: newVersion,
      createdFrom: source.id,
      copiedDefinition: copied,
    };
  }

  private async generateCloneVersion(
    applicationId: string,
    sourceVersion: string,
    tenantId: string | null,
  ): Promise<string> {
    const match = sourceVersion.match(/^(\d+)\.(\d+)\.(\d+)$/);

    let candidate: string;

    if (match) {
      const major = Number(match[1]);
      const minor = Number(match[2]);
      const patch = Number(match[3]);

      candidate = `${major}.${minor}.${patch + 1}`;
    } else {
      candidate = `${sourceVersion}-clone`;
    }

    let counter = 0;

    while (true) {
      const existing = await this.prisma.applicationVersion.findFirst({
        where: {
          applicationId,
          version: candidate,
          tenantId: tenantId ?? undefined,
        },
      });

      if (!existing) {
        return candidate;
      }

      counter++;

      if (match) {
        const major = Number(match[1]);
        const minor = Number(match[2]);
        const patch = Number(match[3]);

        candidate = `${major}.${minor}.${patch + 1 + counter}`;
      } else {
        candidate = `${sourceVersion}-clone-${counter}`;
      }
    }
  }

  private async ensureApplicationExists(
    applicationId: string,
    tenantId: string | null,
  ) {
    const application = await this.prisma.application.findFirst({
      where: {
        id: applicationId,
        tenantId: tenantId ?? undefined,
      },
    });

    if (!application) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_NOT_FOUND,
        `Application "${applicationId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (application.status === 'ARCHIVED') {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_ARCHIVED,
        'Cannot create version for an archived application',
        HttpStatus.CONFLICT,
      );
    }

    return application;
  }
}
