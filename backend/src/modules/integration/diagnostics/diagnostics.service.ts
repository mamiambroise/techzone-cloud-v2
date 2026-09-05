import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { SearchLogsDto, DiagnosisCategory, TimelineResult, IntegrationMetrics, TimelineEntry } from './dto/search-logs.dto';
import { getDiagnosisCategories } from './dto/search-logs.dto';
import { IntegrationLog } from '../../../generated/prisma/client';

const SECRET_PATTERNS: RegExp[] = [
  /"password"\s*:\s*"[^"]*"/gi,
  /"token"\s*:\s*"[^"]*"/gi,
  /"secret"\s*:\s*"[^"]*"/gi,
  /"apiKey"\s*:\s*"[^"]*"/gi,
  /"authorization"\s*:\s*"[^"]*"/gi,
  /"refreshToken"\s*:\s*"[^"]*"/gi,
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
  /[A-Za-z0-9]{32,}/g,
];

const SECRET_KEYS = new Set([
  'password',
  'token',
  'secret',
  'apikey',
  'api_key',
  'authorization',
  'refreshtoken',
  'refresh_token',
  'accesstoken',
  'access_token',
  'clientid',
  'client_id',
  'clientsecret',
  'client_secret',
]);

@Injectable()
export class DiagnosticsService {
  constructor(private readonly prisma: PrismaService) {}

  async searchLogs(dto: SearchLogsDto) {
    const page = Math.max(1, dto.page ?? 1);
    const limit = Math.max(1, Math.min(dto.limit ?? 50, 200));
    const skip = (page - 1) * limit;

    const where: Prisma.IntegrationLogWhereInput = {};

    if (dto.traceId) {
      where.traceId = { contains: dto.traceId };
    }

    if (dto.connectorId) {
      where.connectorId = dto.connectorId;
    }

    if (dto.direction) {
      where.direction = dto.direction;
    }

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.errorCode) {
      where.errorCode = { contains: dto.errorCode };
    }

    if (dto.operation) {
      where.operation = { contains: dto.operation };
    }

    if (dto.tenantId) {
      where.tenantId = dto.tenantId;
    }

    if (dto.startDate || dto.endDate) {
      where.startedAt = {};
      if (dto.startDate) {
        where.startedAt.gte = new Date(dto.startDate);
      }
      if (dto.endDate) {
        where.startedAt.lte = new Date(dto.endDate);
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.integrationLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
      }),
      this.prisma.integrationLog.count({ where }),
    ]);

    const redactedItems = items.map((log) => this.redactLog(log));

    return {
      data: redactedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMetrics(): Promise<IntegrationMetrics> {
    const [total, succeeded, failed, timeoutLogs, retryingLogs, rateLimitedLogs, webhookFailures, syncFailures] = await Promise.all([
      this.prisma.integrationLog.count(),
      this.prisma.integrationLog.count({ where: { status: 'SUCCEEDED' } }),
      this.prisma.integrationLog.count({ where: { status: 'FAILED' } }),
      this.prisma.integrationLog.count({ where: { errorCode: 'INTEGRATION_TIMEOUT' } }),
      this.prisma.integrationLog.count({ where: { status: 'RETRYING' } }),
      this.prisma.integrationLog.count({ where: { errorCode: 'INTEGRATION_RATE_LIMITED' } }),
      this.prisma.webhookDelivery.count({
        where: { status: { in: ['FAILED', 'CANCELLED'] } },
      }),
      this.prisma.synchronization.count({
        where: { status: { in: ['FAILED', 'CANCELLED'] } },
      }),
    ]);

    const successRate = total > 0 ? (succeeded / total) * 100 : 100;
    const failureRate = total > 0 ? (failed / total) * 100 : 0;

    const avgLatencyResult = await this.prisma.integrationLog.aggregate({
      _avg: { duration: true },
      where: { duration: { not: null } },
    });

    const diagnosisBreakdown = await this.buildDiagnosisBreakdown();

    return {
      requestCount: total,
      successRate: Number(successRate.toFixed(2)),
      failureRate: Number(failureRate.toFixed(2)),
      averageLatency: avgLatencyResult._avg.duration ?? 0,
      timeoutCount: timeoutLogs,
      retryCount: retryingLogs,
      rateLimitEvents: rateLimitedLogs,
      webhookDeliveryFailures: webhookFailures,
      syncFailures,
      diagnosisBreakdown,
    };
  }

  async getTimeline(traceId: string): Promise<TimelineResult> {
    const logs = await this.prisma.integrationLog.findMany({
      where: { traceId: { contains: traceId } },
      orderBy: { startedAt: 'asc' },
    });

    if (logs.length === 0) {
      return {
        traceId,
        entries: [],
        summary: {
          totalSteps: 0,
          duration: null,
          status: 'UNKNOWN',
          errorCodes: [],
        },
      };
    }

    const redactedEntries: TimelineEntry[] = logs.map((log) => ({
      traceId: log.traceId,
      tenantId: log.tenantId,
      connectorId: log.connectorId,
      operation: log.operation,
      direction: log.direction,
      startedAt: log.startedAt,
      finishedAt: log.finishedAt,
      duration: log.duration,
      status: log.status,
      errorCode: log.errorCode,
      attempt: log.attempt,
    }));

    const first = logs[0]!;
    const last = logs[logs.length - 1]!;
    const totalDuration = last.finishedAt
      ? new Date(last.finishedAt).getTime() - new Date(first.startedAt).getTime()
      : null;

    const errorCodes = Array.from(
      new Set(logs.filter((l) => l.errorCode).map((l) => l.errorCode!)),
    );

    return {
      traceId,
      entries: redactedEntries,
      summary: {
        totalSteps: logs.length,
        duration: totalDuration,
        status: last.status as 'SUCCEEDED' | 'FAILED' | 'PARTIAL' | 'UNKNOWN',
        errorCodes,
      },
    };
  }

  private async buildDiagnosisBreakdown(): Promise<DiagnosisCategory[]> {
    const categories = getDiagnosisCategories();

    const errorCodeCounts = await this.prisma.integrationLog.groupBy({
      by: ['errorCode'],
      where: { errorCode: { not: null } },
      _count: { _all: true },
    });

    return Object.entries(categories).map(([code, info]) => {
      const match = errorCodeCounts.find((e) => e.errorCode === code);
      return {
        code,
        label: info.label,
        count: match?._count._all ?? 0,
        description: info.description,
      };
    });
  }

  private redactLog(log: IntegrationLog): IntegrationLog {
    const clone = { ...log } as IntegrationLog;

    if (clone.operation) {
      clone.operation = this.redactString(clone.operation);
    }

    return clone;
  }

  private redactString(value: string): string {
    let result = value;

    for (const pattern of SECRET_PATTERNS) {
      result = result.replace(pattern, '[REDACTED]');
    }

    return result;
  }

  static redactDeep<T>(obj: T): T {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      let result: string = obj;

      for (const pattern of SECRET_PATTERNS) {
        result = result.replace(pattern, '[REDACTED]');
      }

      return result as T;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => DiagnosticsService.redactDeep(item)) as T;
    }

    if (typeof obj === 'object') {
      const result: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(obj)) {
        if (SECRET_KEYS.has(key.toLowerCase())) {
          result[key] = '[REDACTED]';
        } else {
          result[key] = DiagnosticsService.redactDeep(value);
        }
      }

      return result as T;
    }

    return obj;
  }

  static redactText(value: string): string {
    if (!value) return value;

    let result = value;

    for (const pattern of SECRET_PATTERNS) {
      result = result.replace(pattern, '[REDACTED]');
    }

    return result;
  }
}
