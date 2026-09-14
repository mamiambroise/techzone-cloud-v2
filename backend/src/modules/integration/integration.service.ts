import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class IntegrationService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [
      connectorsActive,
      apisActive,
      webhooksActive,
      synchronizationsRunning,
      successfulLogs,
      failedLogs,
      timeoutLogs,
      attentionConnectors,
    ] = await Promise.all([
      this.prisma.connector.count({
        where: {
          status: 'ACTIVE',
        },
      }),

      this.prisma.apiDefinition.count({
        where: {
          status: 'ACTIVE',
        },
      }),

      this.prisma.webhook.count({
        where: {
          status: 'ACTIVE',
        },
      }),

      this.prisma.synchronization.count({
        where: {
          status: 'RUNNING',
        },
      }),

      this.prisma.integrationLog.count({
        where: {
          status: 'SUCCEEDED',
        },
      }),

      this.prisma.integrationLog.count({
        where: {
          status: 'FAILED',
        },
      }),

      this.prisma.integrationLog.count({
        where: {
          errorCode: 'INTEGRATION_TIMEOUT',
        },
      }),

      this.prisma.connector.count({
        where: {
          health: {
            in: ['WARNING', 'DEGRADED', 'CRITICAL'],
          },
        },
      }),
    ]);

    const totalCompleted = successfulLogs + failedLogs;

    const successRate =
      totalCompleted > 0
        ? Number(((successfulLogs / totalCompleted) * 100).toFixed(2))
        : 100;

    return {
      connectorsActive,
      apisActive,
      webhooksActive,
      synchronizationsRunning,
      successRate,
      failures: failedLogs,
      timeouts: timeoutLogs,
      attentionRequired: attentionConnectors,
    };
  }

  async getActivity(limit = 20) {
    const items = await this.prisma.integrationLog.findMany({
      orderBy: {
        startedAt: 'desc',
      },
      take: limit,
      select: {
        traceId: true,
        tenantId: true,
        connectorId: true,
        operation: true,
        direction: true,
        startedAt: true,
        finishedAt: true,
        duration: true,
        status: true,
        errorCode: true,
        attempt: true,
      },
    });

    return {
      items,
      total: items.length,
    };
  }

  async getHealth() {
    const connectors = await this.prisma.connector.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        providerType: true,
        status: true,
        health: true,
        contractVersion: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const healthValues = connectors.map((connector) => connector.health);

    let overallStatus:
      'HEALTHY' | 'WARNING' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';

    if (healthValues.includes('CRITICAL')) {
      overallStatus = 'CRITICAL';
    } else if (healthValues.includes('DEGRADED')) {
      overallStatus = 'DEGRADED';
    } else if (healthValues.includes('WARNING')) {
      overallStatus = 'WARNING';
    } else if (healthValues.length === 0) {
      overallStatus = 'UNKNOWN';
    } else if (healthValues.every((value) => value === 'HEALTHY')) {
      overallStatus = 'HEALTHY';
    } else {
      overallStatus = 'UNKNOWN';
    }

    return {
      status: overallStatus,
      connectors,
    };
  }

  async getAttention() {
    const [connectors, failedSynchronizations, failedLogs] = await Promise.all([
      this.prisma.connector.findMany({
        where: {
          health: {
            in: ['WARNING', 'DEGRADED', 'CRITICAL'],
          },
        },
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
          health: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      }),

      this.prisma.synchronization.findMany({
        where: {
          status: 'FAILED',
        },
        select: {
          id: true,
          code: true,
          connectorId: true,
          status: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      }),

      this.prisma.integrationLog.findMany({
        where: {
          status: 'FAILED',
        },
        select: {
          id: true,
          traceId: true,
          connectorId: true,
          operation: true,
          errorCode: true,
          attempt: true,
          startedAt: true,
        },
        orderBy: {
          startedAt: 'desc',
        },
        take: 20,
      }),
    ]);

    return {
      connectors,
      failedSynchronizations,
      failedLogs,
      total:
        connectors.length + failedSynchronizations.length + failedLogs.length,
    };
  }
}
