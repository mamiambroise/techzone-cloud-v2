import { HttpStatus, Injectable } from '@nestjs/common';
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

  async findAll() {
    return this.prisma.environmentDeployment.findMany({
      include: {
        environment: true,
        application: true,
        currentRelease: true,
        previousRelease: true,
        deployment: true,
      },
    });
  }

  async getStatus(environmentId: string) {
    const environment = await this.prisma.environment.findUnique({
      where: { id: environmentId },
    });

    if (!environment) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_ENVIRONMENT_NOT_FOUND,
        `Environment "${environmentId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const deployments = await this.prisma.environmentDeployment.findMany({
      where: { environmentId },
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

  async promote(dto: PromoteReleaseDto) {
    // 1. Trouver la release
    const release = await this.prisma.release.findUnique({
      where: { id: dto.releaseId },
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
    const targetEnv = await this.prisma.environment.findUnique({
      where: { id: dto.targetEnvironmentId },
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
        where: { type: 'STAGING' },
      });

      if (stagingEnv) {
        const stagingDeployment = await this.prisma.deployment.findFirst({
          where: {
            releaseId: release.id,
            environmentId: stagingEnv.id,
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
      startedBy: dto.startedBy,
      idempotencyKey: `promote-${release.id}-${targetEnv.id}-${Date.now()}`,
    });

    return {
      message: `Release ${release.code}:${release.version} successfully promoted to ${targetEnv.code} (${targetEnv.type})`,
      deployment,
    };
  }

  async lock(environmentId: string, dto: LockEnvironmentDto) {
    const environment = await this.prisma.environment.findUnique({
      where: { id: environmentId },
    });

    if (!environment) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_ENVIRONMENT_NOT_FOUND,
        `Environment "${environmentId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const envDeployments = await this.prisma.environmentDeployment.findMany({
      where: { environmentId },
    });

    for (const ed of envDeployments) {
      await this.prisma.environmentDeployment.update({
        where: { id: ed.id },
        data: {
          status: 'LOCKED',
        },
      });
    }

    await this.prisma.deploymentHistory.create({
      data: {
        traceId: `trc-lock-${randomUUID().slice(0, 8)}`,
        environmentId,
        action: 'FAILED',
        status: 'LOCKED',
        actor: dto.lockedBy || 'environment-admin',
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

  async unlock(environmentId: string, actor: string = 'environment-admin') {
    const environment = await this.prisma.environment.findUnique({
      where: { id: environmentId },
    });

    if (!environment) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_ENVIRONMENT_NOT_FOUND,
        `Environment "${environmentId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const envDeployments = await this.prisma.environmentDeployment.findMany({
      where: { environmentId },
    });

    for (const ed of envDeployments) {
      await this.prisma.environmentDeployment.update({
        where: { id: ed.id },
        data: {
          status: 'ACTIVE',
        },
      });
    }

    await this.prisma.deploymentHistory.create({
      data: {
        traceId: `trc-unlk-${randomUUID().slice(0, 8)}`,
        environmentId,
        action: 'SUCCEEDED',
        status: 'ACTIVE',
        actor,
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

  async detectDrift(environmentId: string) {
    const environment = await this.prisma.environment.findUnique({
      where: { id: environmentId },
    });

    if (!environment) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_ENVIRONMENT_NOT_FOUND,
        `Environment "${environmentId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const envDeployments = await this.prisma.environmentDeployment.findMany({
      where: { environmentId },
      include: {
        currentRelease: {
          include: {
            snapshot: true,
          },
        },
        application: true,
      },
    });

    const driftResults = envDeployments.map((ed: any) => {
      const release = ed.currentRelease;
      const snapshot = release?.snapshot;
      const expectedHash = snapshot?.hash ?? 'snap-hash-001';
      // In live environment, drift occurs if active cluster configuration diverges from snapshot
      const currentLiveHash = expectedHash; // In-memory simulated clean synchronization
      const hasDrift = false;

      return {
        applicationId: ed.applicationId,
        applicationCode: ed.application?.code,
        currentReleaseId: ed.currentReleaseId,
        releaseVersion: release?.version,
        expectedSnapshotHash: expectedHash,
        currentLiveHash,
        hasDrift,
        status: hasDrift ? 'DRIFTED' : 'IN_SYNC',
        differences: [],
      };
    });

    return {
      environmentId: environment.id,
      environmentCode: environment.code,
      checkedAt: new Date(),
      isSynchronized: driftResults.every((r: any) => !r.hasDrift),
      reports: driftResults,
    };
  }
}
