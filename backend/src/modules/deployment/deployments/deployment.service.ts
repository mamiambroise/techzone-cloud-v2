import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDeploymentDto, DeploymentStrategy } from './dto/create-deployment.dto';
import { QueryDeploymentDto } from './dto/query-deployment.dto';
import { VerifyDeploymentDto } from './dto/verify-deployment.dto';
import { DeploymentErrorCode } from '../../../common/errors/deployment-error-code.enum';
import { DeploymentException } from '../../../common/errors/deployment.exception';
import { randomUUID } from 'crypto';

@Injectable()
export class DeploymentService {
  constructor(private readonly prisma: PrismaService) {}

  private requireTenantId(tenantId?: string | null): string {
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }
    return tenantId;
  }

  async create(
    dto: CreateDeploymentDto,
    tenantContext?: string | null,
    actorId?: string,
  ) {
    const tenantId = this.requireTenantId(tenantContext);
    if (!actorId) {
      throw new ForbiddenException('Authenticated actor required');
    }

    // 1. Idempotence
    if (dto.idempotencyKey) {
      const scopedIdempotencyKey = `${tenantId}:${dto.idempotencyKey}`;
      const existing = await this.prisma.deployment.findFirst({
        where: { idempotencyKey: scopedIdempotencyKey, tenantId },
        include: {
          release: true,
          environment: true,
          gates: true,
        },
      });
      if (existing) {
        if (
          existing.releaseId !== dto.releaseId ||
          existing.environmentId !== dto.environmentId ||
          existing.strategy !== (dto.strategy ?? DeploymentStrategy.STANDARD)
        ) {
          throw new DeploymentException(
            DeploymentErrorCode.DEP_DEPLOYMENT_FAILED,
            'Idempotency key was already used for a different deployment request',
            HttpStatus.CONFLICT,
          );
        }
        return existing;
      }
    }

    // 2. Vérification de la Release
    const release = await this.prisma.release.findFirst({
      where: { id: dto.releaseId, tenantId },
      include: {
        application: true,
        snapshot: true,
      },
    });

    if (!release) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_RELEASE_NOT_FOUND,
        `Release "${dto.releaseId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (release.status !== 'APPROVED' && release.status !== 'RELEASED') {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_RELEASE_INVALID,
        `Release "${release.code}:${release.version}" cannot be deployed. Current status is "${release.status}". Release must be APPROVED or RELEASED.`,
        HttpStatus.CONFLICT,
      );
    }

    // 3. Vérification de l'Environnement
    const environment = await this.prisma.environment.findFirst({
      where: { id: dto.environmentId, tenantId },
    });

    if (!environment) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_ENVIRONMENT_NOT_FOUND,
        `Target environment "${dto.environmentId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (!release.tenantId || release.tenantId !== environment.tenantId) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_ENVIRONMENT_NOT_FOUND,
        'Release and environment must belong to the same tenant',
        HttpStatus.FORBIDDEN,
      );
    }

    // Vérifier si l'environnement a un verrouillage
    const envDeployment = await this.prisma.environmentDeployment.findFirst({
      where: {
        environmentId: dto.environmentId,
        applicationId: release.applicationId,
        tenantId,
      },
    });

    if (envDeployment?.status === 'LOCKED') {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_ENVIRONMENT_LOCKED,
        `Environment "${environment.code}" is currently locked for maintenance or incident response`,
        HttpStatus.LOCKED,
      );
    }

    // 4. Contrôle de Concurrence (DEP-CDC-03)
    const activeDeployments = await this.prisma.deployment.findMany({
      where: {
        environmentId: dto.environmentId,
        tenantId,
        status: { in: ['PENDING', 'RUNNING', 'VERIFYING'] },
      },
    });

    if (activeDeployments.length > 0) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_CONCURRENCY_LOCKED,
        `Another deployment (${activeDeployments[0].id}) is currently executing in environment "${environment.code}". Simultaneous deployments to the same environment are prevented.`,
        HttpStatus.CONFLICT,
      );
    }

    // No deployment Runtime adapter exists in this module. Do not fabricate
    // gates, readiness, or SUCCEEDED state until activation is verified by one.
    throw new DeploymentException(
      DeploymentErrorCode.DEP_RUNTIME_UNAVAILABLE,
      'Deployment runtime is not configured; no deployment was created',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  async findAll(query: QueryDeploymentDto | undefined, tenantContext?: string | null) {
    const tenantId = this.requireTenantId(tenantContext);
    const where: Record<string, any> = {};
    where.tenantId = tenantId;

    if (query?.environmentId) {
      where.environmentId = query.environmentId;
    }

    if (query?.releaseId) {
      where.releaseId = query.releaseId;
    }

    if (query?.status) {
      where.status = query.status;
    }

    return this.prisma.deployment.findMany({
      where,
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

  async findOne(id: string, tenantContext?: string | null) {
    const tenantId = this.requireTenantId(tenantContext);
    const deployment = await this.prisma.deployment.findFirst({
      where: { id, tenantId },
      include: {
        release: {
          include: {
            application: true,
            applicationVersion: true,
            snapshot: true,
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
        `Deployment "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return deployment;
  }

  async verify(
    id: string,
    _dto?: VerifyDeploymentDto,
    tenantContext?: string | null,
  ) {
    await this.findOne(id, tenantContext);
    throw new ServiceUnavailableException(
      'Runtime health verification is not configured',
    );
  }

  async cancel(
    id: string,
    tenantContext?: string | null,
    actorId?: string,
  ) {
    const deployment = await this.findOne(id, tenantContext);
    if (!actorId) {
      throw new ForbiddenException('Authenticated actor required');
    }

    if (deployment.status !== 'PENDING' && deployment.status !== 'RUNNING') {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_DEPLOYMENT_CANNOT_CANCEL,
        `Deployment "${id}" cannot be cancelled from status "${deployment.status}". Only PENDING or RUNNING deployments can be cancelled.`,
        HttpStatus.CONFLICT,
      );
    }

    const finishedAt = new Date();
    const duration = Math.round((finishedAt.getTime() - deployment.startedAt.getTime()) / 1000);

    const updated = await this.prisma.deployment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        finishedAt,
      },
    });

    await this.prisma.deploymentHistory.create({
      data: {
        traceId: deployment.traceId || `trc-cnc-${randomUUID().slice(0, 8)}`,
        releaseId: deployment.releaseId,
        deploymentId: deployment.id,
        applicationId: deployment.release?.applicationId,
        environmentId: deployment.environmentId,
        action: 'CANCELLED',
        status: 'CANCELLED',
        startedAt: deployment.startedAt,
        finishedAt,
        duration,
        actor: actorId,
      },
    });

    return updated;
  }

  async retry(id: string, tenantContext?: string | null, actorId?: string) {
    const tenantId = this.requireTenantId(tenantContext);
    const deployment = await this.findOne(id, tenantId);
    if (!actorId) {
      throw new ForbiddenException('Authenticated actor required');
    }

    if (deployment.status !== 'FAILED' && deployment.status !== 'CANCELLED') {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_DEPLOYMENT_FAILED,
        `Only FAILED or CANCELLED deployments can be retried. Current status is "${deployment.status}".`,
        HttpStatus.CONFLICT,
      );
    }

    // Réexécuter un déploiement avec les mêmes paramètres
    return this.create({
      releaseId: deployment.releaseId,
      environmentId: deployment.environmentId,
      strategy: deployment.strategy as DeploymentStrategy,
      idempotencyKey: `retry-${deployment.id}-${Date.now()}`,
      startedBy: actorId,
    }, tenantId, actorId);
  }
}
