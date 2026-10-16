import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { type IamAuthContext } from '../../../iam/decorators/current-user.decorator';
import { DeploymentErrorCode } from '../../../common/errors/deployment-error-code.enum';
import { DeploymentException } from '../../../common/errors/deployment.exception';

@Injectable()
export class CockpitService {
  constructor(private readonly prisma: PrismaService) {}

  private requireTenant(principal: IamAuthContext): string {
    const tenantId = principal?.tenantId;
    if (!tenantId || tenantId === 'legacy') {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_PERMISSION_DENIED,
        'An active tenant context is required for deployment cockpit operations',
        HttpStatus.FORBIDDEN,
      );
    }
    return tenantId;
  }

  async getDashboard(principal: IamAuthContext) {
    const tenantId = this.requireTenant(principal);
    const releases = await this.prisma.release.findMany({
      where: { tenantId },
      include: {
        application: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const deployments = await this.prisma.deployment.findMany({
      where: { tenantId },
      include: {
        release: {
          include: {
            application: true,
          },
        },
        environment: true,
        gates: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    const envDeployments = await this.prisma.environmentDeployment.findMany({
      where: { tenantId },
      include: {
        environment: true,
        application: true,
        currentRelease: true,
      },
    });

    const rollbacks = await this.prisma.rollback.findMany({
      where: { deployment: { is: { tenantId } } },
      include: {
        deployment: {
          include: {
            environment: true,
          },
        },
        fromRelease: true,
        toRelease: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    const recentEvents = await this.prisma.deploymentHistory.findMany({
      where: { tenantId },
      include: {
        application: true,
        environment: true,
        release: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Compute KPIs
    const releasesReady = releases.filter((r: any) =>
      ['READY', 'APPROVED'].includes(r.status),
    ).length;

    const deploymentsRunning = deployments.filter((d: any) =>
      ['PENDING', 'RUNNING', 'VERIFYING'].includes(d.status),
    ).length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deploymentsToday = deployments.filter(
      (d: any) => new Date(d.startedAt) >= today,
    ).length;

    const totalDeployments = deployments.length;
    const successfulDeployments = deployments.filter(
      (d: any) => d.status === 'SUCCEEDED',
    ).length;
    const failedDeployments = deployments.filter(
      (d: any) => d.status === 'FAILED',
    ).length;

    const successRate =
      totalDeployments > 0
        ? Math.round((successfulDeployments / totalDeployments) * 100)
        : 100;

    // Production health status
    const prodEnvDeployments = envDeployments.filter(
      (ed: any) => ed.environment?.type === 'PRODUCTION',
    );
    const hasDegradedProd = prodEnvDeployments.some(
      (ed: any) => ed.healthStatus !== 'HEALTHY',
    );
    const productionStatus =
      prodEnvDeployments.length === 0
        ? 'UNKNOWN'
        : hasDegradedProd
        ? 'DEGRADED'
        : 'HEALTHY';

    const attentionRequired =
      failedDeployments > 0 || hasDegradedProd || deploymentsRunning > 3;

    // Gate stats
    const allGates = deployments.flatMap((d: any) => d.gates || []);
    const gatesSummary = {
      total: allGates.length,
      passed: allGates.filter((g: any) => g.result === 'PASSED').length,
      failed: allGates.filter((g: any) => g.result === 'FAILED').length,
      skipped: allGates.filter((g: any) => g.result === 'SKIPPED').length,
    };

    return {
      kpis: {
        releasesReady,
        deploymentsRunning,
        deploymentsToday,
        successRate,
        failedDeployments,
        rollbackCount: rollbacks.length,
        productionStatus,
        attentionRequired,
      },
      recentReleases: releases.slice(0, 5),
      runningDeployments: deployments
        .filter((d: any) => ['PENDING', 'RUNNING', 'VERIFYING'].includes(d.status))
        .slice(0, 5),
      environments: envDeployments,
      gatesSummary,
      productionHealth: {
        status: productionStatus,
        activeDeployments: prodEnvDeployments.length,
        lastVerifiedAt: new Date().toISOString(),
      },
      rollbacks: rollbacks.slice(0, 5),
      activity: recentEvents,
      incidents: deployments
        .filter((d: any) => d.status === 'FAILED' || d.healthStatus === 'DEGRADED')
        .slice(0, 5),
    };
  }

  async getRecentReleases(principal: IamAuthContext, limit: number = 10) {
    const tenantId = this.requireTenant(principal);
    return this.prisma.release.findMany({
      where: { tenantId },
      include: {
        application: true,
        applicationVersion: true,
        snapshot: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async getRunningDeployments(principal: IamAuthContext) {
    const tenantId = this.requireTenant(principal);
    return this.prisma.deployment.findMany({
      where: {
        tenantId,
        status: { in: ['PENDING', 'RUNNING', 'VERIFYING'] },
      },
      include: {
        release: {
          include: {
            application: true,
          },
        },
        environment: true,
        gates: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });
  }

  async getActivity(principal: IamAuthContext, limit: number = 20) {
    const tenantId = this.requireTenant(principal);
    return this.prisma.deploymentHistory.findMany({
      where: { tenantId },
      include: {
        application: true,
        environment: true,
        release: true,
        deployment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async getHealth(principal: IamAuthContext) {
    const tenantId = this.requireTenant(principal);
    const environments = await this.prisma.environment.findMany({
      where: { tenantId },
    });
    const envDeployments = await this.prisma.environmentDeployment.findMany({
      where: { tenantId },
      include: {
        environment: true,
        application: true,
        currentRelease: true,
      },
    });

    const envHealth = environments.map((env: any) => {
      const activeDeploys = envDeployments.filter(
        (ed: any) => ed.environmentId === env.id,
      );
      const isHealthy = activeDeploys.every(
        (ed: any) => ed.healthStatus === 'HEALTHY',
      );

      return {
        environmentId: env.id,
        code: env.code,
        name: env.name,
        type: env.type,
        status: isHealthy ? 'HEALTHY' : 'DEGRADED',
        deployedApplications: activeDeploys.length,
        isLocked: activeDeploys.some((ed: any) => ed.status === 'LOCKED'),
      };
    });

    return {
      status: envHealth.every((e: any) => e.status === 'HEALTHY')
        ? 'HEALTHY'
        : 'DEGRADED',
      checkedAt: new Date(),
      environments: envHealth,
    };
  }
}
