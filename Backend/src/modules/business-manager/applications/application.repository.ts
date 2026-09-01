import { Injectable } from '@nestjs/common';
import { DataSource, Repository, FindOptionsWhere, Like } from 'typeorm';
import { Application } from '../entities/application.entity';
import { ApplicationStatus } from '../../../common/enums';

@Injectable()
export class ApplicationRepository {
  private readonly repository: Repository<Application>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(Application);
  }

  async create(application: Partial<Application>): Promise<Application> {
    const newApp = this.repository.create(application);
    return this.repository.save(newApp);
  }

  async findById(id: string): Promise<Application | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['versions'],
    });
  }

  async findByCode(code: string): Promise<Application | null> {
    return this.repository.findOne({
      where: { code },
    });
  }

  async findAll(
    options: {
      page?: number;
      limit?: number;
      search?: string;
      status?: ApplicationStatus;
      category?: string;
      environment?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    } = {},
  ): Promise<{ items: Application[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      category,
      environment,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = options;

    const where: FindOptionsWhere<Application> = {};

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (environment) {
      where.environment = environment as any;
    }

    if (search) {
      where.name = Like(`%${search}%`);
    }

    const [items, total] = await this.repository.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total };
  }

  async update(id: string, data: Partial<Application>): Promise<Application> {
    await this.repository.update(id, data);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Application with id ${id} not found`);
    }
    return updated;
  }

  async save(application: Application): Promise<Application> {
    return this.repository.save(application);
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.update(id, {
      status: ApplicationStatus.ARCHIVED,
      archivedAt: new Date(),
    });
  }

  async incrementVersion(id: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .update(Application)
      .set({ version: () => 'version + 1' })
      .where('id = :id', { id })
      .returning('version')
      .execute();

    return result.raw[0]?.version || 1;
  }

  async existsByCode(code: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { code },
    });
    return count > 0;
  }

  async getActiveApplications(): Promise<number> {
    return this.repository.count({
      where: { status: ApplicationStatus.ACTIVE },
    });
  }

  async getTotalApplications(): Promise<number> {
    return this.repository.count();
  }

  async getApplicationsByStatus(status: ApplicationStatus): Promise<number> {
    return this.repository.count({
      where: { status },
    });
  }
}