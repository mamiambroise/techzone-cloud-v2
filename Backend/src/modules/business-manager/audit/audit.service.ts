import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ActivityEvent } from '../entities/activity-event.entity';
import { ResultType } from '../../../common/enums';
import { ActivityQueryDto } from './dto/activity-query.dto';

export interface LogEventParams {
  applicationId?: string;
  actorId: string;
  eventType: string;
  action: string;
  targetType: string;
  targetId: string;
  result?: string;
  before?: any;
  after?: any;
  metadata?: any;
  traceId?: string;
}

@Injectable()
export class AuditService {
  private readonly activityRepository: Repository<ActivityEvent>;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    this.activityRepository = this.dataSource.getRepository(ActivityEvent);
  }

  async log(params: LogEventParams): Promise<ActivityEvent> {
    const traceId =
      params.traceId || `trace-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const event = this.activityRepository.create({
      applicationId: params.applicationId || undefined,
      actorId: params.actorId,
      eventType: params.eventType,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      result: (params.result as ResultType) || ResultType.SUCCESS,
      before: params.before || null,
      after: params.after || null,
      metadata: params.metadata || null,
      traceId,
    });

    return this.activityRepository.save(event);
  }

  async getActivity(
    applicationId: string,
    query: ActivityQueryDto,
  ): Promise<{
    items: ActivityEvent[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const { page = 1, limit = 20, eventType, actorId, startDate, endDate } = query;

    const qb = this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.applicationId = :applicationId', { applicationId })
      .orderBy('activity.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (eventType) {
      qb.andWhere('activity.eventType = :eventType', { eventType });
    }
    if (actorId) {
      qb.andWhere('activity.actorId = :actorId', { actorId });
    }
    if (startDate) {
      qb.andWhere('activity.createdAt >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      qb.andWhere('activity.createdAt <= :endDate', { endDate: new Date(endDate) });
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

  async getRecentActivity(applicationId: string, limit: number = 10): Promise<ActivityEvent[]> {
    return this.activityRepository.find({
      where: { applicationId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}