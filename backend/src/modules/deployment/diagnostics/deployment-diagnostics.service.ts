import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueryHistoryDto } from './dto/query-history.dto';
import { DeploymentErrorCode } from '../../../common/errors/deployment-error-code.enum';
import { DeploymentException } from '../../../common/errors/deployment.exception';

@Injectable()
export class DeploymentDiagnosticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getHistory(query?: QueryHistoryDto) {
    const where: Record<string, any> = {};

    if (query?.applicationId) {
      where.applicationId = query.applicationId;
    }

    if (query?.releaseId) {
      where.releaseId = query.releaseId;
    }

    if (query?.deploymentId) {
      where.deploymentId = query.deploymentId;
    }

    if (query?.environmentId) {
      where.environmentId = query.environmentId;
    }

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.actor) {
      where.actor = query.actor;
    }

    if (query?.traceId) {
      where.traceId = query.traceId;
    }

    const events = await this.prisma.deploymentHistory.findMany({
      where,
      include: {
        application: true,
        environment: true,
        release: true,
        deployment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Sanitize metadata to guarantee no secrets are exposed
    return events.map((e: any) => ({
      ...e,
      metadata: this.sanitizeMetadata(e.metadata),
    }));
  }

  async getTimeline(deploymentId: string) {
    const deployment = await this.prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: {
        release: {
          include: {
            application: true,
          },
        },
        environment: true,
        gates: true,
        rollbacks: true,
      },
    });

    if (!deployment) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_DEPLOYMENT_NOT_FOUND,
        `Deployment "${deploymentId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const events = await this.prisma.deploymentHistory.findMany({
      where: {
        deploymentId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      deployment: {
        id: deployment.id,
        traceId: deployment.traceId,
        releaseCode: deployment.release?.code,
        releaseVersion: deployment.release?.version,
        applicationName: deployment.release?.application?.name,
        environmentCode: deployment.environment?.code,
        status: deployment.status,
        startedAt: deployment.startedAt,
        finishedAt: deployment.finishedAt,
        healthStatus: deployment.healthStatus,
      },
      gates: deployment.gates,
      rollbacks: deployment.rollbacks,
      events: events.map((e: any) => ({
        ...e,
        metadata: this.sanitizeMetadata(e.metadata),
      })),
    };
  }

  async getDiagnostics() {
    const deployments = await this.prisma.deployment.findMany({
      include: {
        gates: true,
      },
    });

    const rollbacks = await this.prisma.rollback.findMany();
    const gates = await this.prisma.deploymentGate.findMany();

    const totalDeployments = deployments.length;
    const succeeded = deployments.filter((d: any) => d.status === 'SUCCEEDED').length;
    const failed = deployments.filter((d: any) => d.status === 'FAILED').length;
    const running = deployments.filter((d: any) =>
      ['PENDING', 'RUNNING', 'VERIFYING'].includes(d.status),
    ).length;

    const successRate = totalDeployments > 0
      ? Math.round((succeeded / totalDeployments) * 100)
      : 100;

    const durations = deployments
      .filter((d: any) => d.finishedAt && d.startedAt)
      .map((d: any) =>
        Math.round(
          (new Date(d.finishedAt).getTime() - new Date(d.startedAt).getTime()) / 1000,
        ),
      );

    const averageDurationSeconds = durations.length > 0
      ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length)
      : 0;

    const gatesPassed = gates.filter((g: any) => g.result === 'PASSED').length;
    const gatesFailed = gates.filter((g: any) => g.result === 'FAILED').length;
    const gatesSkipped = gates.filter((g: any) => g.result === 'SKIPPED').length;

    return {
      summary: {
        totalDeployments,
        succeeded,
        failed,
        running,
        totalRollbacks: rollbacks.length,
        successRate,
        averageDurationSeconds,
      },
      gatesEvaluation: {
        totalGates: gates.length,
        passed: gatesPassed,
        failed: gatesFailed,
        skippedOrBypassed: gatesSkipped,
      },
      recentIncidents: deployments
        .filter((d: any) => d.status === 'FAILED' || d.healthStatus === 'DEGRADED')
        .slice(0, 5),
    };
  }

  async getDeploymentDiagnostic(deploymentId: string) {
    const deployment = await this.prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: {
        release: {
          include: {
            application: true,
          },
        },
        environment: true,
        gates: true,
        rollbacks: true,
      },
    });

    if (!deployment) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_DEPLOYMENT_NOT_FOUND,
        `Deployment "${deploymentId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const failedGates = deployment.gates.filter((g: any) => g.result === 'FAILED');
    const isHealthy = deployment.healthStatus === 'HEALTHY';

    let diagnosis = 'Deployment executed smoothly with nominal telemetry.';
    const recommendations: string[] = [];

    if (deployment.status === 'FAILED') {
      if (failedGates.length > 0) {
        diagnosis = `Deployment failed during gate verification stage (${failedGates.map((g: any) => g.name).join(', ')}).`;
        recommendations.push('Inspect gate failure details and fix compatibility/validation errors before retrying.');
      } else {
        diagnosis = 'Deployment failed during execution phase.';
        recommendations.push('Check target environment cluster connectivity and container startup logs.');
      }
    } else if (deployment.status === 'SUCCEEDED' && !isHealthy) {
      diagnosis = 'Deployment completed but post-deploy health check reported degraded or non-responsive health status.';
      recommendations.push('Initiate automated or manual rollback to restore previous known healthy release.');
    }

    return {
      deploymentId,
      status: deployment.status,
      healthStatus: deployment.healthStatus,
      durationSeconds: deployment.finishedAt && deployment.startedAt
        ? Math.round(
            (new Date(deployment.finishedAt).getTime() -
              new Date(deployment.startedAt).getTime()) /
              1000,
          )
        : null,
      diagnosis,
      failedGates,
      hasRollback: deployment.rollbacks.length > 0,
      recommendations,
    };
  }

  private sanitizeMetadata(metadata: any): any {
    if (!metadata || typeof metadata !== 'object') return metadata;
    const sanitized: Record<string, any> = {};
    const sensitiveKeys = ['password', 'secret', 'token', 'key', 'credential', 'auth'];

    for (const [k, v] of Object.entries(metadata)) {
      if (sensitiveKeys.some((s) => k.toLowerCase().includes(s))) {
        sanitized[k] = '***REDACTED***';
      } else if (v && typeof v === 'object') {
        sanitized[k] = this.sanitizeMetadata(v);
      } else {
        sanitized[k] = v;
      }
    }
    return sanitized;
  }
}
