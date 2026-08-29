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
import { ApplicationStatus, ApplicationVersionStatus, Environment } from '../../../common/enums';
import { AuditService } from '../audit/audit.service';
import { CloneDto } from './dto/clone.dto';

@Injectable()
export class CloneService {
  private readonly applicationRepository: Repository<Application>;
  private readonly versionRepository: Repository<ApplicationVersion>;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {
    this.applicationRepository = this.dataSource.getRepository(Application);
    this.versionRepository = this.dataSource.getRepository(ApplicationVersion);
  }

  private validateCode(code: string): boolean {
    const codeRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return codeRegex.test(code);
  }

  async clone(
    sourceApplicationId: string,
    cloneDto: CloneDto,
    actorId: string,
  ) {
    const source = await this.applicationRepository.findOne({
      where: { id: sourceApplicationId },
      relations: ['versions'],
    });
    if (!source) {
      throw new NotFoundException(`Source application with id "${sourceApplicationId}" not found`);
    }

    if (!this.validateCode(cloneDto.code)) {
      throw new BadRequestException(
        'Code must contain only lowercase letters, numbers, and hyphens',
      );
    }

    const existing = await this.applicationRepository.findOne({ where: { code: cloneDto.code } });
    if (existing) {
      throw new ConflictException(`Application with code "${cloneDto.code}" already exists`);
    }

    return this.dataSource.transaction(async (manager) => {
      const appRepo = manager.getRepository(Application);
      const versionRepo = manager.getRepository(ApplicationVersion);

      const newApp = appRepo.create({
        code: cloneDto.code,
        name: cloneDto.name,
        description: cloneDto.description || source.description,
        category: cloneDto.category || source.category,
        icon: cloneDto.icon || source.icon,
        status: ApplicationStatus.DRAFT,
        environment: source.environment || Environment.DEVELOPMENT,
        createdBy: actorId,
      });

      const savedApp = await appRepo.save(newApp);
      const versionMapping = new Map<string, string>();
      const publishedVersionId = source.publishedVersionId;

      for (const sourceVersion of source.versions) {
        const isPublished = sourceVersion.id === publishedVersionId;
        const isSuperseded = sourceVersion.status === ApplicationVersionStatus.SUPERSEDED;

        const newVersion = await versionRepo.save(
          versionRepo.create({
            applicationId: savedApp.id,
            versionNumber: sourceVersion.versionNumber,
            status: isPublished || isSuperseded ? ApplicationVersionStatus.DRAFT : sourceVersion.status,
            snapshot: sourceVersion.snapshot || {},
            comment: `Cloned from ${source.code} version ${sourceVersion.versionNumber}`,
            createdBy: actorId,
          }),
        );

        versionMapping.set(sourceVersion.id, newVersion.id);

        if (isPublished) {
          await appRepo.update(savedApp.id, { currentVersionId: newVersion.id });
        }
      }

      if (!savedApp.currentVersionId && source.versions.length > 0) {
        const firstVersion = source.versions[0];
        const clonedId = versionMapping.get(firstVersion.id);
        if (clonedId) {
          await appRepo.update(savedApp.id, { currentVersionId: clonedId });
        }
      }

      await this.auditService.log({
        applicationId: savedApp.id,
        actorId,
        eventType: 'application.cloned',
        action: 'CLONE',
        targetType: 'Application',
        targetId: savedApp.id,
        result: 'SUCCESS',
        metadata: {
          sourceApplicationId: sourceApplicationId,
          sourceCode: source.code,
        },
      });

      return appRepo.findOne({
        where: { id: savedApp.id },
        relations: ['versions'],
      });
    });
  }
}