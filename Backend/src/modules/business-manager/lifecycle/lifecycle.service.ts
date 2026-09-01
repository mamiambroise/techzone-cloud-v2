import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Application } from '../entities/application.entity';
import { ApplicationVersion } from '../entities/application-version.entity';
import { ApplicationStatus, ApplicationVersionStatus } from '../../../common/enums';
import { AuditService } from '../audit/audit.service';

const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  [ApplicationStatus.DRAFT]: [ApplicationStatus.CONFIGURING, ApplicationStatus.ARCHIVED],
  [ApplicationStatus.CONFIGURING]: [ApplicationStatus.READY, ApplicationStatus.ARCHIVED],
  [ApplicationStatus.READY]: [ApplicationStatus.TESTING, ApplicationStatus.ARCHIVED],
  [ApplicationStatus.TESTING]: [ApplicationStatus.ACTIVE, ApplicationStatus.ARCHIVED],
  [ApplicationStatus.ACTIVE]: [ApplicationStatus.SUSPENDED, ApplicationStatus.ARCHIVED],
  [ApplicationStatus.SUSPENDED]: [ApplicationStatus.ACTIVE, ApplicationStatus.ARCHIVED],
  [ApplicationStatus.ARCHIVED]: [],
  [ApplicationStatus.ERROR]: [ApplicationStatus.DRAFT, ApplicationStatus.CONFIGURING, ApplicationStatus.READY, ApplicationStatus.ARCHIVED],
};

@Injectable()
export class LifecycleService {
  private readonly applicationRepository: Repository<Application>;
  private readonly versionRepository: Repository<ApplicationVersion>;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {
    this.applicationRepository = this.dataSource.getRepository(Application);
    this.versionRepository = this.dataSource.getRepository(ApplicationVersion);
  }

  async getAllowedTransitions(applicationId: string): Promise<ApplicationStatus[]> {
    const application = await this.applicationRepository.findOne({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException(`Application with id "${applicationId}" not found`);
    }
    return ALLOWED_TRANSITIONS[application.status] || [];
  }

  async transition(
    applicationId: string,
    targetStatus: ApplicationStatus,
    actorId: string,
  ): Promise<Application> {
    const application = await this.applicationRepository.findOne({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException(`Application with id "${applicationId}" not found`);
    }

    const allowed = ALLOWED_TRANSITIONS[application.status] || [];
    if (!allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${application.status} to ${targetStatus}`,
      );
    }

    if (targetStatus === ApplicationStatus.ACTIVE) {
      const publishedVersion = await this.versionRepository.findOne({
        where: { applicationId, status: ApplicationVersionStatus.PUBLISHED },
      });
      if (!publishedVersion) {
        throw new BadRequestException(
          'Cannot activate an application without a published version',
        );
      }
    }

    const before = { ...application };
    const updated = await this.applicationRepository.save({
      ...application,
      status: targetStatus,
    });

    await this.auditService.log({
      applicationId: application.id,
      actorId,
      eventType: 'application.status.changed',
      action: 'TRANSITION',
      targetType: 'Application',
      targetId: application.id,
      result: 'SUCCESS',
      before,
      after: { ...updated },
      metadata: {
        fromStatus: before.status,
        toStatus: targetStatus,
      },
    });

    return updated;
  }
}