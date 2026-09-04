import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CreateIntegrationLogDto } from './dto/create-log.dto';
import { QueryIntegrationLogsDto } from './dto/query-log.dto';

@Injectable()
export class DiagnosticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Systematically redacts secrets, tokens, and credentials from string or object structures.
   */
  redactSensitiveData<T>(input: T): T {
    if (typeof input === 'string') {
      return input
        .replace(/(bearer\s+)[a-zA-Z0-9_.-]+/gi, '$1[REDACTED]')
        .replace(/(api[_-]?key["':\s=]+)[a-zA-Z0-9_-]+/gi, '$1[REDACTED]')
        .replace(/(secret["':\s=]+)[a-zA-Z0-9_-]+/gi, '$1[REDACTED]')
        .replace(/(password["':\s=]+)[^"'\s,}]+/gi, '$1[REDACTED]') as unknown as T;
    }

    if (input && typeof input === 'object' && !Array.isArray(input)) {
      const redacted: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(input)) {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey.includes('secret') ||
          lowerKey.includes('password') ||
          lowerKey.includes('token') ||
          lowerKey.includes('authorization') ||
          lowerKey.includes('apikey')
        ) {
          redacted[key] = '[REDACTED]';
        } else {
          redacted[key] = this.redactSensitiveData(value);
        }
      }
      return redacted as T;
    }

    if (Array.isArray(input)) {
      return input.map((item) => this.redactSensitiveData(item)) as unknown as T;
    }

    return input;
  }

  async createLog(dto: CreateIntegrationLogDto) {
    const sanitizedOperation = this.redactSensitiveData(dto.operation);
    const now = new Date();

    return this.prisma.integrationLog.create({
      data: {
        traceId: dto.traceId,
        tenantId: dto.tenantId ?? 'default',
        connectorId: dto.connectorId,
        operation: sanitizedOperation,
        direction: dto.direction,
        status: dto.status,
        errorCode: dto.errorCode,
        duration: dto.duration ?? 0,
        attempt: dto.attempt ?? 1,
        startedAt: new Date(now.getTime() - (dto.duration ?? 0)),
        finishedAt: now,
      },
    });
  }

  async findLogs(query?: QueryIntegrationLogsDto) {
    const page = Math.max(Number(query?.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query?.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.IntegrationLogWhereInput = {};
    if (query?.traceId) where.traceId = query.traceId;
    if (query?.tenantId) where.tenantId = query.tenantId;
    if (query?.connectorId) where.connectorId = query.connectorId;
    if (query?.direction) where.direction = query.direction as any;
    if (query?.status) where.status = query.status as any;
    if (query?.errorCode) where.errorCode = query.errorCode;

    if (query?.from || query?.to) {
      where.startedAt = {
        ...(query?.from ? { gte: new Date(query.from) } : {}),
        ...(query?.to ? { lte: new Date(query.to) } : {}),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.integrationLog.findMany({
        where,
        include: { connector: true },
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.integrationLog.count({ where }),
    ]);

    return {
      items: items.map((log) => ({
        ...log,
        operation: this.redactSensitiveData(log.operation),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * API-CDC-07 Timeline:
   * Returns all log events associated with a specific traceId in chronological sequence.
   */
  async getTimeline(traceId: string) {
    const logs = await this.prisma.integrationLog.findMany({
      where: { traceId },
      include: { connector: true },
      orderBy: { startedAt: 'asc' },
    });

    const timeline = logs.map((log, index) => ({
      stepIndex: index + 1,
      id: log.id,
      operation: this.redactSensitiveData(log.operation),
      direction: log.direction,
      status: log.status,
      errorCode: log.errorCode,
      durationMs: log.duration,
      attempt: log.attempt,
      timestamp: log.startedAt,
      connectorCode: log.connector?.code ?? null,
    }));

    const hasFailure = logs.some(
      (l) => l.status === 'FAILED' || l.status === 'TIMEOUT',
    );

    return {
      traceId,
      totalSteps: logs.length,
      overallStatus: hasFailure ? 'FAILED' : 'SUCCEEDED',
      startedAt: logs[0]?.startedAt ?? null,
      finishedAt: logs[logs.length - 1]?.finishedAt ?? null,
      totalDurationMs: logs.reduce((acc, curr) => acc + (curr.duration ?? 0), 0),
      timeline,
    };
  }

  /**
   * API-CDC-07 Root Cause & Error Categorization breakdown
   */
  async getDiagnostics() {
    const logs = await this.prisma.integrationLog.findMany({
      take: 200,
      orderBy: { startedAt: 'desc' },
      include: { connector: true },
    });

    const categoryBreakdown = {
      authenticationFailure: 0,
      providerUnavailable: 0,
      timeout: 0,
      rateLimit: 0,
      contractMismatch: 0,
      invalidPayload: 0,
      webhookSignatureFailure: 0,
      syncConflict: 0,
      internalError: 0,
      other: 0,
    };

    const recentErrors: Array<{
      id: string;
      traceId: string;
      connector: string | null;
      operation: string;
      errorCode: string | null;
      startedAt: Date;
    }> = [];

    for (const log of logs) {
      if (log.status === 'FAILED' || log.status === 'TIMEOUT') {
        const code = log.errorCode ?? '';
        if (code.includes('AUTH')) categoryBreakdown.authenticationFailure++;
        else if (code.includes('UNAVAILABLE')) categoryBreakdown.providerUnavailable++;
        else if (code.includes('TIMEOUT') || log.status === 'TIMEOUT') categoryBreakdown.timeout++;
        else if (code.includes('RATE_LIMIT')) categoryBreakdown.rateLimit++;
        else if (code.includes('CONTRACT')) categoryBreakdown.contractMismatch++;
        else if (code.includes('PAYLOAD')) categoryBreakdown.invalidPayload++;
        else if (code.includes('SIGNATURE')) categoryBreakdown.webhookSignatureFailure++;
        else if (code.includes('CONFLICT')) categoryBreakdown.syncConflict++;
        else if (code.includes('INTERNAL')) categoryBreakdown.internalError++;
        else categoryBreakdown.other++;

        if (recentErrors.length < 10) {
          recentErrors.push({
            id: log.id,
            traceId: log.traceId,
            connector: log.connector?.code ?? null,
            operation: this.redactSensitiveData(log.operation),
            errorCode: log.errorCode,
            startedAt: log.startedAt,
          });
        }
      }
    }

    const totalErrors = Object.values(categoryBreakdown).reduce((a, b) => a + b, 0);

    return {
      status: totalErrors === 0 ? 'HEALTHY' : totalErrors > 10 ? 'DEGRADED' : 'WARNING',
      totalErrorsRecorded: totalErrors,
      categoryBreakdown,
      recentErrors,
      recommendedActions: this.deriveRecommendations(categoryBreakdown),
    };
  }

  async getMetrics() {
    const logs = await this.prisma.integrationLog.findMany({
      take: 500,
      orderBy: { startedAt: 'desc' },
    });

    const total = logs.length;
    const succeeded = logs.filter((l) => l.status === 'SUCCEEDED').length;
    const failed = logs.filter((l) => l.status === 'FAILED').length;
    const timeouts = logs.filter((l) => l.status === 'TIMEOUT').length;
    const retried = logs.filter((l) => l.attempt > 1).length;
    const rateLimited = logs.filter((l) => l.errorCode?.includes('RATE_LIMITED')).length;

    const totalDuration = logs.reduce((acc, l) => acc + (l.duration ?? 0), 0);
    const avgLatency = total > 0 ? Math.round(totalDuration / total) : 0;
    const successRate = total > 0 ? Number(((succeeded / total) * 100).toFixed(2)) : 100;

    return {
      requestCount: total,
      successCount: succeeded,
      failureCount: failed,
      timeoutCount: timeouts,
      retryCount: retried,
      rateLimitCount: rateLimited,
      successRate,
      averageLatencyMs: avgLatency,
    };
  }

  private deriveRecommendations(breakdown: Record<string, number>): string[] {
    const recommendations: string[] = [];
    if (breakdown.authenticationFailure > 0) {
      recommendations.push(
        'Verify credential validity or initiate credential rotation for failing connectors.',
      );
    }
    if (breakdown.timeout > 0) {
      recommendations.push(
        'Check network latency or adjust timeout thresholds in connector resilience policy.',
      );
    }
    if (breakdown.rateLimit > 0) {
      recommendations.push(
        'Enable backoff multiplier or request rate limit quota elevation from external providers.',
      );
    }
    if (breakdown.webhookSignatureFailure > 0) {
      recommendations.push(
        'Review webhook secret reference configuration and signature verification policies.',
      );
    }
    if (breakdown.syncConflict > 0) {
      recommendations.push(
        'Review synchronization conflict policies (e.g. switch to SOURCE_WINS or NEWEST_WINS).',
      );
    }
    if (recommendations.length === 0) {
      recommendations.push('All integration diagnostic metrics are operating within normal parameters.');
    }
    return recommendations;
  }
}
