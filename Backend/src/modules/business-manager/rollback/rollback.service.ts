import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Application } from '../entities/application.entity';
import { ApplicationVersion } from '../entities/application-version.entity';
import { Publication } from '../entities/publication.entity';
import { ApplicationVersionStatus, PublicationStatus, PublicationType, Environment } from '../../../common/enums';
import { AuditService } from '../audit/audit.service';
import { RollbackDto } from './dto/rollback.dto';

@Injectable()
export class RollbackService {
  private readonly applicationRepository: Repository<Application>;
  private readonly versionRepository: Repository<ApplicationVersion>;
  private readonly publicationRepository: Repository<Publication>;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {
    this.applicationRepository = this.dataSource.getRepository(Application);
    this.versionRepository = this.dataSource.getRepository(ApplicationVersion);
    this.publicationRepository = this.dataSource.getRepository(Publication);
  }

  async rollback(
    applicationId: string,
    rollbackDto: RollbackDto,
    actorId: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const applicationRepo = manager.getRepository(Application);
      const versionRepo = manager.getRepository(ApplicationVersion);
      const publicationRepo = manager.getRepository(Publication);

      const application = await applicationRepo.findOne({ where: { id: applicationId } });
      if (!application) {
        throw new NotFoundException(`Application with id "${applicationId}" not found`);
      }

      const targetVersion = await versionRepo.findOne({ where: { id: rollbackDto.versionId } });
      if (!targetVersion) {
        throw new NotFoundException(`Version with id "${rollbackDto.versionId}" not found`);
      }

      if (targetVersion.applicationId !== applicationId) {
        throw new BadRequestException('Version does not belong to this application');
      }

      if (
        targetVersion.status !== ApplicationVersionStatus.PUBLISHED &&
        targetVersion.status !== ApplicationVersionStatus.SUPERSEDED
      ) {
        throw new BadRequestException(
          `Cannot rollback to a version that is not published (status: ${targetVersion.status})`,
        );
      }

      if (application.publishedVersionId === targetVersion.id) {
        throw new BadRequestException('Cannot rollback to the current published version');
      }

      const oldPublishedVersionId = application.publishedVersionId;

      if (oldPublishedVersionId) {
        await versionRepo.update(oldPublishedVersionId, { status: ApplicationVersionStatus.SUPERSEDED });
      }

      const publication = publicationRepo.create({
        applicationId,
        versionId: targetVersion.id,
        environment: rollbackDto.environment || Environment.PRODUCTION,
        type: PublicationType.ROLLBACK,
        status: PublicationStatus.SUCCESS,
        previousVersionId: oldPublishedVersionId,
        publishedBy: actorId,
        result: {
          rollbackFrom: oldPublishedVersionId,
          rollbackTo: targetVersion.id,
          timestamp: new Date().toISOString(),
        },
      });

      const savedPublication = await publicationRepo.save(publication);
      await versionRepo.update(targetVersion.id, {
        status: ApplicationVersionStatus.PUBLISHED,
        publishedAt: new Date(),
      });
      await applicationRepo.update(applicationId, {
        publishedVersionId: targetVersion.id,
        currentVersionId: targetVersion.id,
      });

      await this.auditService.log({
        applicationId,
        actorId,
        eventType: 'application.rollback',
        action: 'ROLLBACK',
        targetType: 'ApplicationVersion',
        targetId: targetVersion.id,
        result: 'SUCCESS',
        metadata: {
          versionNumber: targetVersion.versionNumber,
          previousVersionId: oldPublishedVersionId,
          environment: savedPublication.environment,
        },
      });

      return savedPublication;
    });
  }
}