import {
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PromoteReleaseDto } from './dto/promote-release.dto';
import { LockEnvironmentDto } from './dto/lock-environment.dto';
import { DeploymentErrorCode } from '../../../common/errors/deployment-error-code.enum';
import { DeploymentException } from '../../../common/errors/deployment.exception';
import { DeploymentService } from '../deployments/deployment.service';
import { DeploymentStrategy } from '../deployments/dto/create-deployment.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class EnvironmentDeploymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly deploymentService: DeploymentService,
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.environmentDeployment.findMany({
      where: { tenantId },
      include: {
        environment: true,
        application: true,
        currentRelease: true,
        previousRelease: true,
        deployment: true,
      },
    });
  }

  async getStatus(environmentId: string, tenantId: string) {
    const environment = await this.prisma.environment.findFirst({
      where: { id: environmentId, tenantId },
    });

    if (!environment) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_ENVIRONMENT_NOT_FOUND,
        `Environment "${environmentId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const deployments = await this.prisma.environmentDeployment.findMany({
      where: { environmentId, tenantId },
      include: {
        application: true,
        currentRelease: {
          include: {
            snapshot: true,
          },
        },
        previousRelease: true,
        deployment: {
          include: {
            gates: true,
          },
        },
      },
    });

    const activeDeployments = await this.prisma.deployment.findMany({
      where: {
        environmentId,
        tenantId,
        status: { in: ['PENDING', 'RUNNING', 'VERIFYING'] },
      },
      include: {
        release: true,
      },
    });

    return {
      environment: {
        id: environment.id,
        code: environment.code,
        name: environment.name,
        type: environment.type,
      },
      deployments,
      activeExecution: activeDeployments.length > 0 ? activeDeployments[0] : null,
      isLocked: deployments.some((d: any) => d.status === 'LOCKED'),
    };
  }

  async promote(dto: PromoteReleaseDto, tenantId: string, actorId: string) {
    // 1. Trouver la release
    const release = await this.prisma.release.findFirst({
      where: { id: dto.releaseId, tenantId },
      include: {
        application: true,
      },
    });

    if (!release) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_RELEASE_NOT_FOUND,
        `Release "${dto.releaseId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    // 2. Trouver l'environnement cible
    const targetEnv = await this.prisma.environment.findFirst({
      where: { id: dto.targetEnvironmentId, tenantId },
    });

    if (!targetEnv) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_ENVIRONMENT_NOT_FOUND,
        `Target environment "${dto.targetEnvironmentId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    // 3. Vérifier les règles de promotion par étape (DEP-CDC-04)
    if (targetEnv.type === 'PRODUCTION') {
      // Pour aller en PRODUCTION, la release doit avoir été déployée avec succès en STAGING
      const stagingEnv = await this.prisma.environment.findFirst({
        where: { type: 'STAGING', tenantId },
      });

      if (stagingEnv) {
        const stagingDeployment = await this.prisma.deployment.findFirst({
          where: {
            releaseId: release.id,
            environmentId: stagingEnv.id,
            tenantId,
            status: 'SUCCEEDED',
          },
        });

        if (!stagingDeployment) {
          throw new DeploymentException(
            DeploymentErrorCode.DEP_PROMOTION_INVALID_STAGE,
            `Promotion to PRODUCTION rejected. Release "${release.code}:${release.version}" must first be successfully deployed and validated in STAGING.`,
            HttpStatus.PRECONDITION_FAILED,
          );
        }
      }
    }

    // 4. Déclencher le déploiement sur l'environnement cible
    const deployment = await this.deploymentService.create({
      releaseId: release.id,
      environmentId: targetEnv.id,
      strategy: (dto.strategy as DeploymentStrategy) ?? DeploymentStrategy.STANDARD,
      startedBy: actorId,
      idempotencyKey: `promote-${release.id}-${targetEnv.id}-${Date.now()}`,
    }, tenantId, actorId);

    return {
      message: `Release ${release.code}:${release.version} successfully promoted to ${targetEnv.code} (${targetEnv.type})`,
      deployment,
    };
  }

  async lock(environmentId: string, dto: LockEnvironmentDto, tenantId: string, actorId: string) {
    const environment = await this.prisma.environment.findFirst({
      where: { id: environmentId, tenantId },
    });

    if (!environment) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_ENVIRONMENT_NOT_FOUND,
        `Environment "${environmentId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const envDeployments = await this.prisma.environmentDeployment.findMany({
      where: { environmentId, tenantId },
    });

    for (const ed of envDeployments) {
      await this.prisma.environmentDeployment.updateMany({
        where: { id: ed.id, tenantId },
        data: {
          status: 'LOCKED',
        },
      });
    }

    await this.prisma.deploymentHistory.create({
      data: {
        traceId: `trc-lock-${randomUUID().slice(0, 8)}`,
        tenantId,
        environmentId,
        action: 'FAILED',
        status: 'LOCKED',
        actor: actorId,
        metadata: {
          reason: dto.reason,
          lockedAt: new Date().toISOString(),
        },
      },
    });

    return {
      environmentId,
      status: 'LOCKED',
      reason: dto.reason,
      lockedAt: new Date(),
    };
  }

  async unlock(environmentId: string, tenantId: string, actorId: string) {
    const environment = await this.prisma.environment.findFirst({
      where: { id: environmentId, tenantId },
    });

    if (!environment) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_ENVIRONMENT_NOT_FOUND,
        `Environment "${environmentId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const envDeployments = await this.prisma.environmentDeployment.findMany({
      where: { environmentId, tenantId },
    });

    for (const ed of envDeployments) {
      await this.prisma.environmentDeployment.updateMany({
        where: { id: ed.id, tenantId },
        data: {
          status: 'ACTIVE',
        },
      });
    }

    await this.prisma.deploymentHistory.create({
      data: {
        traceId: `trc-unlk-${randomUUID().slice(0, 8)}`,
        tenantId,
        environmentId,
        action: 'SUCCEEDED',
        status: 'ACTIVE',
        actor: actorId,
        metadata: {
          unlockedAt: new Date().toISOString(),
        },
      },
    });

    return {
      environmentId,
      status: 'ACTIVE',
      unlockedAt: new Date(),
    };
  }

  async detectDrift(environmentId: string, tenantId: string) {
    const environment = await this.prisma.environment.findFirst({
      where: { id: environmentId, tenantId },
    });

    if (!environment) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_ENVIRONMENT_NOT_FOUND,
        `Environment "${environmentId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    throw new ServiceUnavailableException(
      `Live drift detection is not configured for environment ${environment.code}`,
    );
  }
}
