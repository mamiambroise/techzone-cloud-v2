import { ConflictException, HttpStatus, Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { PlatformErrorCode } from '../../common/errors/platform-error-code.enum';
import { PlatformException } from '../../common/errors/platform.exception';
import { canTransitionVersion } from '../../common/lifecycle/version-lifecycle.util';

import { CreateApplicationVersionDto } from '../application-versions/dto/create-app-version.dto';
import { UpdateApplicationVersionDto } from '../application-versions/dto/update-app-version.dto';

@Injectable()
export class ApplicationVersionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByApplication(applicationId: string) {
    await this.ensureApplicationExists(applicationId);

    return this.prisma.applicationVersion.findMany({
      where: {
        applicationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(applicationId: string, dto: CreateApplicationVersionDto) {
    await this.ensureApplicationExists(applicationId);

    const version = dto.version.trim();

    const existing = await this.prisma.applicationVersion.findFirst({
      where: {
        applicationId,
        version,
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
      },
    });
  }

  async findOne(id: string) {
    const version = await this.prisma.applicationVersion.findUnique({
      where: {
        id,
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

  async update(id: string, dto: UpdateApplicationVersionDto) {
    const version = await this.findOne(id);

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

  async changeStatus(id: string, nextStatus: string) {
    const version = await this.findOne(id);

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
      status: any;
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
      data,
    });
  }

  async clone(id: string) {
    const source = await this.findOne(id);

    const newVersion = await this.generateCloneVersion(
      source.applicationId,
      source.version,
    );

    return this.prisma.applicationVersion.create({
      data: {
        applicationId: source.applicationId,
        version: newVersion,
        releaseNotes: source.releaseNotes
          ? `Cloned from ${source.version}\n\n${source.releaseNotes}`
          : `Cloned from ${source.version}`,
        createdFrom: source.id,
        status: 'DRAFT',
      },
    });
  }

  private async generateCloneVersion(
    applicationId: string,
    sourceVersion: string,
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

  private async ensureApplicationExists(applicationId: string) {
    const application = await this.prisma.application.findUnique({
      where: {
        id: applicationId,
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

  private buildCloneVersion(sourceVersion: string): string {
    const match = sourceVersion.match(/^(\d+)\.(\d+)\.(\d+)$/);

    if (!match) {
      return `${sourceVersion}-clone`;
    }

    const major = Number(match[1]);
    const minor = Number(match[2]);
    const patch = Number(match[3]);

    return `${major}.${minor}.${patch + 1}`;
  }
}
