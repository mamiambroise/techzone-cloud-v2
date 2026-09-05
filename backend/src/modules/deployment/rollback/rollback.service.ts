import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateRollbackDto, RollbackTypeDto } from './dto/create-rollback.dto';
import { EnvironmentRollbackDto } from './dto/environment-rollback.dto';
import { DeploymentErrorCode } from '../../../common/errors/deployment-error-code.enum';
import { DeploymentException } from '../../../common/errors/deployment.exception';
import { randomUUID } from 'crypto';

@Injectable()
export class RollbackService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.rollback.findMany({
      include: {
        deployment: {
          include: {
            environment: true,
          },
        },
        fromRelease: {
          include: {
            application: true,
          },
        },
        toRelease: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const rollback = await this.prisma.rollback.findUnique({
      where: { id },
      include: {
        deployment: {
          include: {
            environment: true,
            release: true,
          },
        },
        fromRelease: true,
        toRelease: true,
      },
    });

    if (!rollback) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_DEPLOYMENT_NOT_FOUND,
        `Rollback "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return rollback;
  }

  async rollbackDeployment(deploymentId: string, dto: CreateRollbackDto) {
    const deployment = await this.prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: {
        release: true,
        environment: true,
      },
    });

    if (!deployment) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_DEPLOYMENT_NOT_FOUND,
        `Deployment "${deploymentId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const envDeployment = await this.prisma.environmentDeployment.findFirst({
      where: {
        environmentId: deployment.environmentId,
        applicationId: deployment.release.applicationId,
      },
    });

    // Déterminer la release cible (soit explicitement fournie, soit la précédente de l'environnement)
    let targetReleaseId = dto.toReleaseId || envDeployment?.previousReleaseId;

    if (!targetReleaseId) {
      // Trouver une release approuvée ou publiée antérieure
      const priorReleases = await this.prisma.release.findMany({
        where: {
          applicationId: deployment.release.applicationId,
          status: { in: ['APPROVED', 'RELEASED'] },
          id: { not: deployment.releaseId },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (priorReleases.length === 0) {
        throw new DeploymentException(
          DeploymentErrorCode.DEP_ROLLBACK_NO_TARGET,
          `No previous valid release target found for rollback of application "${deployment.release.applicationId}"`,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      targetReleaseId = priorReleases[0].id;
    }

    const targetRelease = await this.prisma.release.findUnique({
      where: { id: targetReleaseId },
    });

    if (!targetRelease) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_RELEASE_NOT_FOUND,
        `Target rollback release "${targetReleaseId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const traceId = `trc-rbk-${randomUUID().slice(0, 8)}`;
    const startedAt = new Date();

    // 1. Audit début de rollback
    await this.prisma.deploymentHistory.create({
      data: {
        traceId,
        releaseId: deployment.releaseId,
        deploymentId: deployment.id,
        applicationId: deployment.release.applicationId,
        environmentId: deployment.environmentId,
        action: 'ROLLBACK_STARTED',
        status: 'RUNNING',
        startedAt,
        actor: dto.startedBy,
        metadata: {
          fromReleaseId: deployment.releaseId,
          toReleaseId: targetRelease.id,
          reason: dto.reason,
          type: dto.type ?? RollbackTypeDto.MANUAL_ROLLBACK,
        },
      },
    });

    // 2. Créer l'enregistrement de Rollback
    const rollback = await this.prisma.rollback.create({
      data: {
        deploymentId: deployment.id,
        fromReleaseId: deployment.releaseId,
        toReleaseId: targetRelease.id,
        type: dto.type ?? RollbackTypeDto.MANUAL_ROLLBACK,
        reason: dto.reason,
        status: 'SUCCEEDED',
        startedBy: dto.startedBy,
        startedAt,
        finishedAt: new Date(),
        traceId,
      },
    });

    // 3. Mettre à jour l'état d'environnement (DEP-CDC-04)
    if (envDeployment) {
      await this.prisma.environmentDeployment.update({
        where: { id: envDeployment.id },
        data: {
          currentReleaseId: targetRelease.id,
          previousReleaseId: deployment.releaseId,
          healthStatus: 'HEALTHY',
          status: 'ROLLED_BACK',
          deployedAt: new Date(),
        },
      });
    }

    // 4. Audit fin de rollback
    const finishedAt = new Date();
    const duration = Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000);

    await this.prisma.deploymentHistory.create({
      data: {
        traceId,
        releaseId: targetRelease.id,
        deploymentId: deployment.id,
        applicationId: deployment.release.applicationId,
        environmentId: deployment.environmentId,
        action: 'ROLLBACK_COMPLETED',
        status: 'SUCCEEDED',
        startedAt,
        finishedAt,
        duration,
        actor: dto.startedBy,
        metadata: {
          rollbackId: rollback.id,
          restoredReleaseVersion: targetRelease.version,
        },
      },
    });

    return rollback;
  }

  async rollbackEnvironment(environmentId: string, dto: EnvironmentRollbackDto) {
    const envDeployment = await this.prisma.environmentDeployment.findFirst({
      where: {
        environmentId,
        applicationId: dto.applicationId,
      },
      include: {
        deployment: true,
      },
    });

    if (!envDeployment) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_ENVIRONMENT_NOT_FOUND,
        `No deployment state found for application "${dto.applicationId}" in environment "${environmentId}"`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (!envDeployment.deploymentId) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_ROLLBACK_NO_TARGET,
        `No active deployment associated with environment "${environmentId}" to roll back`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    return this.rollbackDeployment(envDeployment.deploymentId, {
      type: RollbackTypeDto.MANUAL_ROLLBACK,
      reason: dto.reason,
      toReleaseId: dto.toReleaseId,
      startedBy: dto.startedBy,
    });
  }
}
