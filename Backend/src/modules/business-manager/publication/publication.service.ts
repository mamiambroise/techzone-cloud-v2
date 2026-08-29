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
import { Publication } from '../entities/publication.entity';
import { ApplicationStatus, ApplicationVersionStatus, PublicationStatus, PublicationType, Environment } from '../../../common/enums';
import { ValidationService } from '../validation/validation.service';
import { AuditService } from '../audit/audit.service';
import { PublishDto } from './dto/publish.dto';

@Injectable()
export class PublicationService {
  private readonly applicationRepository: Repository<Application>;
  private readonly versionRepository: Repository<ApplicationVersion>;
  private readonly publicationRepository: Repository<Publication>;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly validationService: ValidationService,
    private readonly auditService: AuditService,
  ) {
    this.applicationRepository = this.dataSource.getRepository(Application);
    this.versionRepository = this.dataSource.getRepository(ApplicationVersion);
    this.publicationRepository = this.dataSource.getRepository(Publication);
  }

  async publish(
    applicationId: string,
    versionId: string,
    publishDto: PublishDto,
    actorId: string,
  ) {
    const validationResult = await this.validationService.validate(
      applicationId,
      versionId,
    );

    if (!validationResult.canPublish) {
      throw new BadRequestException({
        message: 'Version cannot be published',
        details: validationResult,
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const appRepo = manager.getRepository(Application);
      const versionRepo = manager.getRepository(ApplicationVersion);
      const publicationRepo = manager.getRepository(Publication);

      const app = await appRepo.findOne({ where: { id: applicationId } });
      if (!app) {
        throw new NotFoundException(`Application with id "${applicationId}" not found`);
      }

      const version = await versionRepo.findOne({ where: { id: versionId } });
      if (!version) {
        throw new NotFoundException(`Version with id "${versionId}" not found`);
      }

      if (version.status === ApplicationVersionStatus.PUBLISHED) {
        throw new ConflictException('Version is already published');
      }

      const oldPublishedVersionId = app.publishedVersionId;

      if (oldPublishedVersionId) {
        await versionRepo.update(oldPublishedVersionId, { status: ApplicationVersionStatus.SUPERSEDED });
      }

      const publication = publicationRepo.create({
        applicationId,
        versionId,
        environment: publishDto.environment || Environment.PRODUCTION,
        type: PublicationType.PUBLISH,
        status: PublicationStatus.SUCCESS,
        previousVersionId: oldPublishedVersionId,
        publishedBy: actorId,
        result: {
          validation: validationResult,
          timestamp: new Date().toISOString(),
        },
      });

      const savedPublication = await publicationRepo.save(publication);
      await versionRepo.update(versionId, {
        status: ApplicationVersionStatus.PUBLISHED,
        publishedAt: new Date(),
      });
      await appRepo.update(applicationId, {
        publishedVersionId: versionId,
        currentVersionId: versionId,
        status: ApplicationStatus.ACTIVE,
      });

      await this.auditService.log({
        applicationId,
        actorId,
        eventType: 'application.published',
        action: 'PUBLISH',
        targetType: 'ApplicationVersion',
        targetId: versionId,
        result: 'SUCCESS',
        metadata: {
          versionNumber: version.versionNumber,
          previousVersionId: oldPublishedVersionId,
          environment: savedPublication.environment,
        },
      });

      return savedPublication;
    });
  }

  async getPublicationHistory(applicationId: string) {
    return this.publicationRepository.find({
      where: { applicationId },
      order: { publishedAt: 'DESC' },
      relations: ['version'],
    });
  }
}