import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Application } from '../entities/application.entity';
import { ApplicationVersion } from '../entities/application-version.entity';
import { ApplicationVersionStatus } from '../../../common/enums';
import { AuditService } from '../audit/audit.service';
import { CreateVersionDto } from './dto/create-version.dto';

@Injectable()
export class VersionService {
  private readonly applicationRepository: Repository<Application>;
  private readonly versionRepository: Repository<ApplicationVersion>;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {
    this.applicationRepository = this.dataSource.getRepository(Application);
    this.versionRepository = this.dataSource.getRepository(ApplicationVersion);
  }

  async createInitialVersion(
    applicationId: string,
    createdBy: string,
  ): Promise<ApplicationVersion> {
    const version = this.versionRepository.create({
      applicationId,
      versionNumber: '0.1.0',
      status: ApplicationVersionStatus.DRAFT,
      createdBy,
      snapshot: {},
    });
    return this.versionRepository.save(version);
  }

  async createVersion(
    applicationId: string,
    createDto: CreateVersionDto,
    actorId: string,
  ): Promise<ApplicationVersion> {
    const application = await this.applicationRepository.findOne({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException(`Application with id "${applicationId}" not found`);
    }

    const existing = await this.versionRepository.findOne({
      where: {
        applicationId,
        versionNumber: createDto.versionNumber,
      },
    });
    if (existing) {
      throw new ConflictException(
        `Version ${createDto.versionNumber} already exists for this application`,
      );
    }

    let sourceSnapshot: Record<string, any> = {};
    if (createDto.sourceVersionId) {
      const source = await this.versionRepository.findOne({ where: { id: createDto.sourceVersionId } });
      if (source) {
        sourceSnapshot = source.snapshot || {};
      }
    } else {
      const published = await this.versionRepository.findOne({
        where: { applicationId, status: ApplicationVersionStatus.PUBLISHED },
        order: { createdAt: 'DESC' },
      });
      if (published) {
        sourceSnapshot = published.snapshot || {};
      } else {
        const latest = await this.versionRepository.findOne({
          where: { applicationId },
          order: { createdAt: 'DESC' },
        });
        if (latest) {
          sourceSnapshot = latest.snapshot || {};
        }
      }
    }

    const version = this.versionRepository.create({
      applicationId,
      versionNumber: createDto.versionNumber,
      status: ApplicationVersionStatus.DRAFT,
      comment: createDto.comment || undefined,
      createdBy: actorId,
      snapshot: sourceSnapshot,
    });

    const savedVersion = await this.versionRepository.save(version);
    await this.applicationRepository.update(applicationId, { currentVersionId: savedVersion.id });

    await this.auditService.log({
      applicationId,
      actorId,
      eventType: 'application.version.created',
      action: 'VERSION_CREATE',
      targetType: 'ApplicationVersion',
      targetId: savedVersion.id,
      result: 'SUCCESS',
      after: { version: savedVersion },
      metadata: {
        versionNumber: savedVersion.versionNumber,
        sourceVersionId: createDto.sourceVersionId,
      },
    });

    return savedVersion;
  }

  async getVersions(applicationId: string): Promise<ApplicationVersion[]> {
    return this.versionRepository.find({
      where: { applicationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<ApplicationVersion | null> {
    return this.versionRepository.findOne({ where: { id } });
  }

  async getPublishedVersion(applicationId: string): Promise<ApplicationVersion | null> {
    const application = await this.applicationRepository.findOne({ where: { id: applicationId } });
    if (!application || !application.publishedVersionId) {
      return null;
    }
    return this.findById(application.publishedVersionId);
  }

  async getDraftVersion(applicationId: string): Promise<ApplicationVersion | null> {
    return this.versionRepository.findOne({
      where: {
        applicationId,
        status: ApplicationVersionStatus.DRAFT,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async updateVersionStatus(
    versionId: string,
    status: ApplicationVersionStatus,
  ): Promise<ApplicationVersion> {
    const updateData: Partial<ApplicationVersion> = { status };
    if (status === ApplicationVersionStatus.PUBLISHED) {
      updateData.publishedAt = new Date();
    }
    if (status === ApplicationVersionStatus.READY || status === ApplicationVersionStatus.TESTING) {
      updateData.validatedAt = new Date();
    }

    await this.versionRepository.update(versionId, updateData);
    const updatedVersion = await this.findById(versionId);
    if (!updatedVersion) {
      throw new NotFoundException(`Version with id "${versionId}" not found`);
    }
    return updatedVersion;
  }

  async markAsSuperseded(versionId: string): Promise<void> {
    await this.versionRepository.update(versionId, { status: ApplicationVersionStatus.SUPERSEDED });
  }

  async getVersionSnapshot(versionId: string): Promise<any> {
    const version = await this.findById(versionId);
    if (!version) {
      throw new NotFoundException(`Version with id "${versionId}" not found`);
    }
    return version.snapshot;
  }

  async compareVersions(
    applicationId: string,
    versionId1: string,
    versionId2: string,
  ): Promise<any> {
    const [version1, version2] = await Promise.all([
      this.findById(versionId1),
      this.findById(versionId2),
    ]);

    if (!version1 || !version2) {
      throw new NotFoundException('One or both versions not found');
    }

    if (version1.applicationId !== applicationId || version2.applicationId !== applicationId) {
      throw new BadRequestException('Versions belong to different applications');
    }

    const diff: any = {
      version1: {
        id: version1.id,
        number: version1.versionNumber,
        status: version1.status,
        createdAt: version1.createdAt,
      },
      version2: {
        id: version2.id,
        number: version2.versionNumber,
        status: version2.status,
        createdAt: version2.createdAt,
      },
      differences: {},
    };

    if (version1.snapshot && version2.snapshot) {
      const keys = new Set([
        ...Object.keys(version1.snapshot as Record<string, any>),
        ...Object.keys(version2.snapshot as Record<string, any>),
      ]);

      for (const key of keys) {
        const val1 = (version1.snapshot as Record<string, any>)?.[key];
        const val2 = (version2.snapshot as Record<string, any>)?.[key];
        if (JSON.stringify(val1) !== JSON.stringify(val2)) {
          diff.differences[key] = { version1: val1, version2: val2 };
        }
      }
    }

    return diff;
  }
}