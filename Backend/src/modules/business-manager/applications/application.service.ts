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
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ApplicationQueryDto } from './dto/application-query.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ApplicationService {
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

  async create(createDto: CreateApplicationDto): Promise<Application> {
    if (!this.validateCode(createDto.code)) {
      throw new BadRequestException(
        'Code must contain only lowercase letters, numbers, and hyphens',
      );
    }

    const existing = await this.applicationRepository.findOne({
      where: { code: createDto.code },
    });
    if (existing) {
      throw new ConflictException(
        `Application with code "${createDto.code}" already exists`,
      );
    }

    const application = this.applicationRepository.create({
      code: createDto.code,
      name: createDto.name,
      description: createDto.description,
      category: createDto.category,
      icon: createDto.icon,
      status: ApplicationStatus.DRAFT,
      environment: Environment.DEVELOPMENT,
      createdBy: createDto.createdBy,
    });

    const savedApplication = await this.applicationRepository.save(application);

    const initialVersion = this.versionRepository.create({
      applicationId: savedApplication.id,
      versionNumber: '0.1.0',
      status: ApplicationVersionStatus.DRAFT,
      createdBy: createDto.createdBy,
      snapshot: {},
    });

    const savedVersion = await this.versionRepository.save(initialVersion);
    await this.applicationRepository.update(savedApplication.id, {
      currentVersionId: savedVersion.id,
    });

    const createdApplication = await this.findById(savedApplication.id);
    await this.auditService.log({
      applicationId: createdApplication.id,
      actorId: createDto.createdBy,
      eventType: 'application.created',
      action: 'CREATE',
      targetType: 'Application',
      targetId: createdApplication.id,
      result: 'SUCCESS',
      after: { application: createdApplication },
      metadata: {
        code: createdApplication.code,
        name: createdApplication.name,
      },
    });

    return createdApplication;
  }

  async findAll(query: ApplicationQueryDto): Promise<{
    items: Application[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const { page = 1, limit = 20, search, status, category, environment } = query;

    const qb = this.applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.versions', 'versions')
      .orderBy('application.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      qb.andWhere('application.status = :status', { status });
    }
    if (category) {
      qb.andWhere('application.category = :category', { category });
    }
    if (environment) {
      qb.andWhere('application.environment = :environment', { environment });
    }
    if (search) {
      qb.andWhere(
        '(application.name ILIKE :search OR application.code ILIKE :search OR application.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<Application> {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: ['versions', 'publications'],
      order: {
        versions: { createdAt: 'DESC' },
        publications: { publishedAt: 'DESC' },
      },
    });

    if (!application) {
      throw new NotFoundException(`Application with id "${id}" not found`);
    }
    return application;
  }

  async findByCode(code: string): Promise<Application> {
    const application = await this.applicationRepository.findOne({
      where: { code },
    });
    if (!application) {
      throw new NotFoundException(`Application with code "${code}" not found`);
    }
    return application;
  }

  async update(
    id: string,
    updateDto: UpdateApplicationDto,
    actorId: string,
  ): Promise<Application> {
    const application = await this.findById(id);

    if (application.status === ApplicationStatus.ARCHIVED) {
      throw new BadRequestException('Cannot update an archived application');
    }

    const before = { ...application };
    const nextVersion = (application.version ?? 1) + 1;

    const updated = await this.applicationRepository.save({
      ...application,
      name: updateDto.name ?? application.name,
      description: updateDto.description ?? application.description,
      category: updateDto.category ?? application.category,
      icon: updateDto.icon ?? application.icon,
      version: nextVersion,
    });

    await this.auditService.log({
      applicationId: application.id,
      actorId,
      eventType: 'application.updated',
      action: 'UPDATE',
      targetType: 'Application',
      targetId: application.id,
      result: 'SUCCESS',
      before,
      after: { ...updated },
      metadata: {
        updatedFields: Object.keys(updateDto),
      },
    });

    return updated;
  }

  async archive(id: string, actorId: string): Promise<void> {
    const application = await this.findById(id);

    if (application.status === ApplicationStatus.ARCHIVED) {
      throw new BadRequestException('Application is already archived');
    }

    const before = { ...application };

    await this.applicationRepository.update(id, {
      status: ApplicationStatus.ARCHIVED,
      archivedAt: new Date(),
    });

    await this.auditService.log({
      applicationId: application.id,
      actorId,
      eventType: 'application.archived',
      action: 'ARCHIVE',
      targetType: 'Application',
      targetId: application.id,
      result: 'SUCCESS',
      before,
      metadata: {
        previousStatus: before.status,
      },
    });
  }

  async getDashboardStats(): Promise<{
    total: number;
    active: number;
    testing: number;
    draft: number;
    suspended: number;
    archived: number;
  }> {
    const [total, active, testing, draft, suspended, archived] = await Promise.all([
      this.applicationRepository.count(),
      this.applicationRepository.count({ where: { status: ApplicationStatus.ACTIVE } }),
      this.applicationRepository.count({ where: { status: ApplicationStatus.TESTING } }),
      this.applicationRepository.count({ where: { status: ApplicationStatus.DRAFT } }),
      this.applicationRepository.count({ where: { status: ApplicationStatus.SUSPENDED } }),
      this.applicationRepository.count({ where: { status: ApplicationStatus.ARCHIVED } }),
    ]);

    return { total, active, testing, draft, suspended, archived };
  }

  async getRecentApplications(limit: number = 5): Promise<Application[]> {
    return this.applicationRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}