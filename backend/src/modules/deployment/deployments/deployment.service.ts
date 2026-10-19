import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDeploymentDto, DeploymentStrategy } from './dto/create-deployment.dto';
import { QueryDeploymentDto } from './dto/query-deployment.dto';
import { DeploymentErrorCode } from '../../../common/errors/deployment-error-code.enum';
import { DeploymentException } from '../../../common/errors/deployment.exception';
import { type IamAuthContext } from '../../../iam/decorators/current-user.decorator';
import { randomUUID } from 'crypto';
import {
  DeploymentReadinessService,
  type DeploymentReadinessEvidence,
} from '../readiness/deployment-readiness.service';

@Injectable()
export class DeploymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly readiness: DeploymentReadinessService,
  ) {}

  private requireTenant(principal: IamAuthContext): string {
    const tenantId = principal?.tenantId;
    if (!tenantId || tenantId === 'legacy') {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_PERMISSION_DENIED,
        'An active tenant context is required for deployment operations',
        HttpStatus.FORBIDDEN,
      );
    }
    return tenantId;
  }

  /**
   * Serializes state changes that compete for one environment. PostgreSQL
   * transaction advisory locks are released automatically on commit/rollback,
   * so a failed request can never leave a stale in-process lock behind.
   */
  private async withEnvironmentLock<T>(
    tenantId: string,
    environmentId: string,
    operation: (tx: any) => Promise<T>,
  ): Promise<T> {
    const lockKey = `deployment:${tenantId}:${environmentId}`;
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`;
        return operation(tx);
      },
      { timeout: 15_000 },
    );
  }

  private async findDeploymentForTransition(
    client: any,
    id: string,
    tenantId: string,
  ) {
    const deployment = await client.deployment.findFirst({
      where: { id, tenantId },
      include: {
        release: true,
        environment: true,
        gates: true,
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

  async create(dto: CreateDeploymentDto, principal: IamAuthContext) {
    const tenantId = this.requireTenant(principal);
    const actor = principal.userId;

    // 1. Idempotence
    if (dto.idempotencyKey) {
      const existing = await this.prisma.deployment.findFirst({
        where: { idempotencyKey: dto.idempotencyKey, tenantId },
        include: {
          release: true,
          environment: true,
          gates: true,
        },
      });
      if (existing) {
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

    if (release.tenantId !== tenantId || environment.tenantId !== tenantId) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_ENVIRONMENT_NOT_FOUND,
        'Release and environment must belong to the same tenant',
        HttpStatus.FORBIDDEN,
      );
    }

    const traceId = `trc-dep-${randomUUID().slice(0, 8)}`;
    const strategy = dto.strategy ?? DeploymentStrategy.STANDARD;

    // The check for an active deployment and creation of RUNNING are one
    // database-critical section. A process-local mutex is not sufficient when
    // two API instances race against the same PostgreSQL database.
    const started = await this.withEnvironmentLock(
      tenantId,
      environment.id,
      async (tx) => {
        if (dto.idempotencyKey) {
          const existing = await tx.deployment.findFirst({
            where: { idempotencyKey: dto.idempotencyKey, tenantId },
            include: { release: true, environment: true, gates: true },
          });
          if (existing) {
            return { existing };
          }
        }

        const envDeployment = await tx.environmentDeployment.findFirst({
          where: {
            environmentId: environment.id,
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

        const activeDeployment = await tx.deployment.findFirst({
          where: {
            environmentId: environment.id,
            tenantId,
            status: { in: ['PENDING', 'RUNNING', 'VERIFYING'] },
          },
          orderBy: { startedAt: 'asc' },
        });

        if (activeDeployment) {
          throw new DeploymentException(
            DeploymentErrorCode.DEP_CONCURRENCY_LOCKED,
            `Another deployment (${activeDeployment.id}) is currently executing in environment "${environment.code}". Simultaneous deployments to the same environment are prevented.`,
            HttpStatus.CONFLICT,
          );
        }

        const deployment = await tx.deployment.create({
          data: {
            tenantId,
            releaseId: dto.releaseId,
            environmentId: environment.id,
            status: 'RUNNING',
            strategy,
            idempotencyKey: dto.idempotencyKey,
            startedBy: actor,
            startedAt: new Date(),
            // Never infer health from a newly-created database record.
            healthStatus: 'PENDING',
            traceId,
          },
        });

        await tx.deploymentHistory.create({
          data: {
            traceId,
            tenantId,
            releaseId: release.id,
            deploymentId: deployment.id,
            applicationId: release.applicationId,
            environmentId: environment.id,
            action: 'STARTED',
            status: 'RUNNING',
            startedAt: deployment.startedAt,
            actor,
            metadata: {
              strategy,
              releaseVersion: release.version,
              environmentCode: environment.code,
            },
          },
        });

        return { deployment };
      },
    );

    if ('existing' in started) {
      return started.existing;
    }

    const { deployment } = started;

    // 6. Évaluation des Gates (DEP-CDC-05)
    const gates = await this.initializeAndEvaluateGates(
      deployment.id,
      environment,
      release,
      tenantId,
      traceId,
    );
    if (!gates.allPassed) {
      return this.failDeployment({
        deployment,
        release,
        environment,
        tenantId,
        actor,
        code: DeploymentErrorCode.DEP_GATE_FAILED,
        message: 'One or more required deployment gates did not produce a passing proof',
        metadata: { gates: gates.failed },
      });
    }

    // A running deployment is not yet a deployment success. Only a fresh
    // runtime-bound proof can advance it to SUCCEEDED.
    const movedToVerifying = await this.prisma.deployment.updateMany({
      where: {
        id: deployment.id,
        tenantId,
        status: 'RUNNING',
      },
      data: { status: 'VERIFYING', healthStatus: 'VERIFYING' },
    });
    if (movedToVerifying.count !== 1) {
      return this.findDeploymentForTransition(this.prisma, deployment.id, tenantId);
    }

    await this.prisma.deploymentHistory.create({
      data: {
        traceId,
        tenantId,
        releaseId: release.id,
        deploymentId: deployment.id,
        applicationId: release.applicationId,
        environmentId: environment.id,
        action: 'VALIDATING',
        status: 'VERIFYING',
        actor,
        metadata: { phase: 'RUNTIME_READINESS', mode: this.readinessMode() },
      },
    });

    const readiness = await this.readiness.verify({
      deploymentId: deployment.id,
      releaseId: release.id,
      environmentId: environment.id,
      tenantId,
      traceId,
      startedAt: deployment.startedAt.toISOString(),
      environment: {
        code: environment.code,
        type: environment.type,
        baseUrl: environment.baseUrl,
      },
    });
    await this.prisma.deploymentHistory.create({
      data: {
        traceId,
        tenantId,
        releaseId: release.id,
        deploymentId: deployment.id,
        applicationId: release.applicationId,
        environmentId: environment.id,
        action: 'HEALTH_CHECK',
        status: readiness.ready ? 'READY' : 'FAILED',
        actor: 'runtime-readiness-probe',
        errorCode: readiness.ready ? undefined : readiness.code,
        metadata: this.readiness.auditMetadata(readiness) as any,
      },
    });

    if (!readiness.ready) {
      return this.failDeployment({
        deployment,
        release,
        environment,
        tenantId,
        actor,
        code: readiness.code ?? DeploymentErrorCode.DEP_READINESS_UNVERIFIED,
        message: readiness.message,
        metadata: { readiness: this.readiness.auditMetadata(readiness) },
      });
    }

    // 7. Mise à jour de l'état d'environnement (DEP-CDC-04)
    return this.completeDeployment({
      deployment,
      release,
      environment,
      tenantId,
      actor,
      traceId,
      readiness,
    });
  }

  /**
   * Promotion and the terminal state are one transaction. In particular, a
   * cancellation that wins the compare-and-set cannot later be overwritten by
   * an asynchronous readiness result or promote its release pointer.
   */
  private async completeDeployment(input: {
    deployment: { id: string; startedAt: Date };
    release: { id: string; applicationId: string; status: string };
    environment: { id: string };
    tenantId: string;
    actor: string;
    traceId: string;
    readiness: DeploymentReadinessEvidence;
  }) {
    const finishedAt = new Date();
    const duration = Math.max(
      0,
      Math.round((finishedAt.getTime() - input.deployment.startedAt.getTime()) / 1000),
    );

    return this.withEnvironmentLock(
      input.tenantId,
      input.environment.id,
      async (tx) => {
        const transitioned = await tx.deployment.updateMany({
          where: {
            id: input.deployment.id,
            tenantId: input.tenantId,
            status: 'VERIFYING',
          },
          data: {
            status: 'SUCCEEDED',
            finishedAt,
            healthStatus: 'HEALTHY',
          },
        });

        if (transitioned.count !== 1) {
          return this.findDeploymentForTransition(
            tx,
            input.deployment.id,
            input.tenantId,
          );
        }

        const envDeployment = await tx.environmentDeployment.findFirst({
          where: {
            environmentId: input.environment.id,
            applicationId: input.release.applicationId,
            tenantId: input.tenantId,
          },
        });
        const previousReleaseId = envDeployment?.currentReleaseId ?? null;

        if (envDeployment) {
          await tx.environmentDeployment.update({
            where: { id: envDeployment.id },
            data: {
              currentReleaseId: input.release.id,
              previousReleaseId,
              deploymentId: input.deployment.id,
              deployedAt: finishedAt,
              healthStatus: 'HEALTHY',
              status: 'ACTIVE',
            },
          });
        } else {
          await tx.environmentDeployment.create({
            data: {
              tenantId: input.tenantId,
              environmentId: input.environment.id,
              applicationId: input.release.applicationId,
              currentReleaseId: input.release.id,
              previousReleaseId: null,
              deploymentId: input.deployment.id,
              deployedAt: finishedAt,
              healthStatus: 'HEALTHY',
              status: 'ACTIVE',
            },
          });
        }

        // A concurrent release lifecycle update must not turn a non-approved
        // release into RELEASED. If it is still APPROVED, mark it released.
        if (input.release.status === 'APPROVED') {
          await tx.release.updateMany({
            where: { id: input.release.id, status: 'APPROVED' },
            data: { status: 'RELEASED', releasedAt: finishedAt },
          });
        }

        await tx.deploymentHistory.create({
          data: {
            traceId: input.traceId,
            tenantId: input.tenantId,
            releaseId: input.release.id,
            deploymentId: input.deployment.id,
            applicationId: input.release.applicationId,
            environmentId: input.environment.id,
            action: 'SUCCEEDED',
            status: 'SUCCEEDED',
            startedAt: input.deployment.startedAt,
            finishedAt,
            duration,
            actor: input.actor,
            metadata: {
              healthStatus: 'HEALTHY',
              promotedFromPrevious: previousReleaseId,
              readiness: this.readiness.auditMetadata(input.readiness) as any,
            },
          },
        });

        return this.findDeploymentForTransition(
          tx,
          input.deployment.id,
          input.tenantId,
        );
      },
    );
  }

  private async initializeAndEvaluateGates(
    deploymentId: string,
    environment: {
      id: string;
      type: string;
      baseUrl?: string | null;
    },
    release: any,
    tenantId: string,
    traceId: string,
  ): Promise<{ allPassed: boolean; failed: Array<{ type: string; message: string }> }> {
    const hasEntries = (value: unknown) =>
      Array.isArray(value)
        ? value.length > 0
        : !!value && typeof value === 'object' && Object.keys(value as object).length > 0;
    const contractVersions = release.contractVersions as Record<string, unknown> | null;
    const snapshotContracts = Array.isArray(release.snapshot?.contracts)
      ? release.snapshot.contracts
      : [];
    const contractsMatch =
      hasEntries(contractVersions) &&
      Object.entries(contractVersions ?? {}).every(([code, version]) =>
        snapshotContracts.some(
          (contract: any) =>
            contract?.contractCode === code && contract?.contractVersion === version,
        ),
      );
    const artifactRefs = release.artifactRefs as Record<string, unknown> | null;
    const hasImmutableArtifact =
      hasEntries(artifactRefs) &&
      typeof artifactRefs?.digest === 'string' &&
      artifactRefs.digest.trim().length > 0;

    type Gate = {
      type: string;
      name: string;
      required: boolean;
      passed: boolean;
      message: string;
      evidence: Record<string, unknown>;
    };

    const gates: Gate[] = [
      {
        type: 'CONTRACT_COMPATIBILITY',
        name: 'Frozen Contract Version Match',
        required: true,
        passed: contractsMatch,
        message: contractsMatch
          ? 'Release contract versions match the immutable snapshot declaration'
          : 'Release contract versions cannot be verified against the immutable snapshot',
        evidence: { source: 'RELEASE_AND_SNAPSHOT', checked: 'contractVersions' },
      },
      {
        type: 'SNAPSHOT_VALID',
        name: 'Immutable Snapshot Integrity',
        required: true,
        passed:
          release.snapshot?.status === 'VALID' &&
          typeof release.snapshot?.hash === 'string' &&
          release.snapshot.hash.length > 0,
        message:
          release.snapshot?.status === 'VALID'
            ? 'Snapshot is recorded as VALID with an immutable hash'
            : 'Snapshot has no valid immutable-hash evidence',
        evidence: {
          source: 'SNAPSHOT_STORE',
          snapshotId: release.snapshotId,
          snapshotStatus: release.snapshot?.status ?? 'UNKNOWN',
        },
      },
      {
        type: 'CONFIGURATION_VALID',
        name: 'Frozen Configuration Reference',
        required: true,
        passed:
          typeof release.configurationVersion === 'string' &&
          release.configurationVersion.trim().length > 0,
        message:
          typeof release.configurationVersion === 'string' &&
          release.configurationVersion.trim()
            ? 'Release has a frozen configuration version'
            : 'Release has no frozen configuration version',
        evidence: { source: 'RELEASE_METADATA' },
      },
      {
        type: 'BUILD_AVAILABLE',
        name: 'Immutable Artifact Reference',
        required: true,
        passed: hasImmutableArtifact,
        message: hasImmutableArtifact
          ? 'Release contains an immutable artifact digest; runtime readiness must still prove activation'
          : 'Release has no immutable artifact digest',
        evidence: { source: 'RELEASE_METADATA', digestDeclared: hasImmutableArtifact },
      },
    ];

    if (environment.type === 'STAGING' || environment.type === 'PRODUCTION') {
      gates.push(
        {
          type: 'TESTS_PASS',
          name: 'Immutable Test Evidence',
          required: true,
          passed: false,
          message: 'No immutable test-result provider is configured for this deployment',
          evidence: { source: 'UNCONFIGURED' },
        },
        {
          type: 'SECURITY_CHECK',
          name: 'Immutable Security Evidence',
          required: true,
          passed: false,
          message: 'No immutable security-scan provider is configured for this deployment',
          evidence: { source: 'UNCONFIGURED' },
        },
        {
          type: 'ENVIRONMENT_READY',
          name: 'Runtime Target Configuration',
          required: true,
          passed: typeof environment.baseUrl === 'string' && environment.baseUrl.trim().length > 0,
          message:
            typeof environment.baseUrl === 'string' && environment.baseUrl.trim()
              ? 'A runtime target is configured; live readiness is verified separately'
              : 'No runtime target is configured',
          evidence: { source: 'ENVIRONMENT_CONFIGURATION' },
        },
        {
          type: 'HEALTH_PRECHECK',
          name: 'Post-Deployment Runtime Readiness',
          required: false,
          passed: false,
          message: 'This check is performed by the mandatory runtime readiness probe after application',
          evidence: { source: 'RUNTIME_READINESS_PROBE', phase: 'POST_APPLY' },
        },
      );
    }

    if (environment.type === 'PRODUCTION') {
      const approved = ['APPROVED', 'RELEASED'].includes(release.status);
      gates.push({
        type: 'MANUAL_APPROVAL',
        name: 'Release Approval Record',
        required: true,
        passed: approved,
        message: approved
          ? 'Release lifecycle contains an approval state'
          : 'Release lifecycle has no approval state',
        evidence: { source: 'RELEASE_LIFECYCLE', status: release.status },
      });
    }

    const failed: Array<{ type: string; message: string }> = [];
    for (const gate of gates) {
      const result = gate.passed ? 'PASSED' : 'FAILED';
      if (gate.required && !gate.passed) {
        failed.push({ type: gate.type, message: gate.message });
      }
      await this.prisma.deploymentGate.create({
        data: {
          deploymentId,
          type: gate.type as any,
          name: gate.name,
          result,
          required: gate.required,
          message: gate.message,
          executedBy: 'deployment-precondition-evaluator',
          executedAt: new Date(),
          metadata: gate.evidence as any,
        },
      });
    }

    await this.prisma.deploymentHistory.create({
      data: {
        traceId,
        tenantId,
        releaseId: release.id,
        deploymentId,
        applicationId: release.applicationId,
        environmentId: environment.id,
        action: 'GATE_CHECK',
        status: failed.length === 0 ? 'PASSED' : 'FAILED',
        actor: 'deployment-precondition-evaluator',
        metadata: { allPassed: failed.length === 0, failedGates: failed },
      },
    });

    return { allPassed: failed.length === 0, failed };
  }

  private async failDeployment(input: {
    deployment: { id: string; startedAt: Date; traceId?: string | null };
    release: { id: string; applicationId: string };
    environment: { id: string };
    tenantId: string;
    actor: string;
    code: DeploymentErrorCode;
    message: string;
    metadata: Record<string, unknown>;
  }) {
    const finishedAt = new Date();
    const duration = Math.max(
      0,
      Math.round((finishedAt.getTime() - input.deployment.startedAt.getTime()) / 1000),
    );
    return this.withEnvironmentLock(
      input.tenantId,
      input.environment.id,
      async (tx) => {
        const transitioned = await tx.deployment.updateMany({
          where: {
            id: input.deployment.id,
            tenantId: input.tenantId,
            status: { in: ['PENDING', 'RUNNING', 'VERIFYING'] },
          },
          data: {
            status: 'FAILED',
            healthStatus: 'DEGRADED',
            finishedAt,
          },
        });

        // A cancel or another terminal transition won the race. Do not write
        // a contradictory failure history record or alter environment state.
        if (transitioned.count !== 1) {
          return this.findDeploymentForTransition(
            tx,
            input.deployment.id,
            input.tenantId,
          );
        }

        const envDeployment = await tx.environmentDeployment.findFirst({
          where: {
            environmentId: input.environment.id,
            applicationId: input.release.applicationId,
            tenantId: input.tenantId,
          },
        });

        // Preserve an existing known-good environment record. In particular,
        // a failed candidate must not replace its deploymentId, active state,
        // or current release pointer.
        if (!envDeployment) {
          await tx.environmentDeployment.create({
            data: {
              tenantId: input.tenantId,
              environmentId: input.environment.id,
              applicationId: input.release.applicationId,
              currentReleaseId: null,
              previousReleaseId: null,
              deploymentId: input.deployment.id,
              healthStatus: 'DEGRADED',
              status: 'FAILED',
            },
          });
        }

        await tx.deploymentHistory.create({
          data: {
            traceId:
              input.deployment.traceId ?? `trc-fail-${randomUUID().slice(0, 8)}`,
            tenantId: input.tenantId,
            releaseId: input.release.id,
            deploymentId: input.deployment.id,
            applicationId: input.release.applicationId,
            environmentId: input.environment.id,
            action: 'FAILED',
            status: 'FAILED',
            startedAt: input.deployment.startedAt,
            finishedAt,
            duration,
            actor: input.actor,
            errorCode: input.code,
            metadata: {
              reason: input.message,
              ...input.metadata,
            },
          },
        });

        return this.findDeploymentForTransition(
          tx,
          input.deployment.id,
          input.tenantId,
        );
      },
    );
  }

  private readinessMode(): 'REAL' | 'TEST' {
    return process.env.NODE_ENV === 'test' &&
      process.env.DEPLOYMENT_READINESS_MODE?.trim().toUpperCase() === 'TEST'
      ? 'TEST'
      : 'REAL';
  }

  async findAll(
    query: QueryDeploymentDto | undefined,
    principal: IamAuthContext,
  ) {
    const tenantId = this.requireTenant(principal);
    const where: Record<string, any> = { tenantId };

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

  async findOne(id: string, principal: IamAuthContext) {
    const tenantId = this.requireTenant(principal);
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

  async verify(id: string, principal: IamAuthContext) {
    const tenantId = this.requireTenant(principal);
    const deployment = await this.findOne(id, principal);

    // Effectuer une vérification d'état de santé
    const traceId =
      deployment.traceId || `trc-vrf-${randomUUID().slice(0, 8)}`;
    const readiness = await this.readiness.verify({
      deploymentId: deployment.id,
      releaseId: deployment.releaseId,
      environmentId: deployment.environmentId,
      tenantId,
      traceId,
      startedAt: deployment.startedAt.toISOString(),
      environment: {
        code: deployment.environment.code,
        type: deployment.environment.type,
        baseUrl: deployment.environment.baseUrl,
      },
    });

    if (!readiness.ready) {
      // A later diagnostic probe must not rewrite immutable history for an
      // already terminal deployment. It reports degraded health only; the
      // create path is the sole path that promotes or fails an in-flight run.
      if (!['RUNNING', 'VERIFYING'].includes(deployment.status)) {
        const updated = await this.prisma.deployment.update({
          where: { id },
          data: { healthStatus: 'DEGRADED' },
        });
        await this.prisma.deploymentHistory.create({
          data: {
            traceId,
            tenantId,
            releaseId: deployment.releaseId,
            deploymentId: deployment.id,
            applicationId: deployment.release.applicationId,
            environmentId: deployment.environmentId,
            action: 'HEALTH_CHECK',
            status: 'DEGRADED',
            actor: principal.userId,
            errorCode: readiness.code,
            metadata: this.readiness.auditMetadata(readiness) as any,
          },
        });
        return updated;
      }

      return this.failDeployment({
        deployment,
        release: deployment.release,
        environment: deployment.environment,
        tenantId,
        actor: principal.userId,
        code: readiness.code ?? DeploymentErrorCode.DEP_READINESS_UNVERIFIED,
        message: readiness.message,
        metadata: { readiness: this.readiness.auditMetadata(readiness) },
      });
    }

    const updated = await this.prisma.deployment.update({
      where: { id },
      data: { healthStatus: 'HEALTHY' },
    });

    await this.prisma.deploymentHistory.create({
      data: {
        traceId,
        tenantId,
        releaseId: deployment.releaseId,
        deploymentId: deployment.id,
        applicationId: deployment.release?.applicationId,
        environmentId: deployment.environmentId,
        action: 'HEALTH_CHECK',
        status: 'HEALTHY',
        actor: principal.userId,
        metadata: this.readiness.auditMetadata(readiness) as any,
      },
    });

    return updated;
  }

  async cancel(id: string, principal: IamAuthContext) {
    const tenantId = this.requireTenant(principal);
    const deployment = await this.findOne(id, principal);

    if (
      deployment.status !== 'PENDING' &&
      deployment.status !== 'RUNNING' &&
      deployment.status !== 'VERIFYING'
    ) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_DEPLOYMENT_CANNOT_CANCEL,
        `Deployment "${id}" cannot be cancelled from status "${deployment.status}". Only PENDING, RUNNING, or VERIFYING deployments can be cancelled.`,
        HttpStatus.CONFLICT,
      );
    }

    const finishedAt = new Date();
    const duration = Math.max(
      0,
      Math.round((finishedAt.getTime() - deployment.startedAt.getTime()) / 1000),
    );
    const updated = await this.withEnvironmentLock(
      tenantId,
      deployment.environmentId,
      async (tx) => {
        const transitioned = await tx.deployment.updateMany({
          where: {
            id,
            tenantId,
            status: { in: ['PENDING', 'RUNNING', 'VERIFYING'] },
          },
          data: {
            status: 'CANCELLED',
            finishedAt,
          },
        });

        if (transitioned.count !== 1) {
          return null;
        }

        await tx.deploymentHistory.create({
          data: {
            traceId: deployment.traceId || `trc-cnc-${randomUUID().slice(0, 8)}`,
            tenantId,
            releaseId: deployment.releaseId,
            deploymentId: deployment.id,
            applicationId: deployment.release?.applicationId,
            environmentId: deployment.environmentId,
            action: 'CANCELLED',
            status: 'CANCELLED',
            startedAt: deployment.startedAt,
            finishedAt,
            duration,
            actor: principal.userId,
          },
        });

        return tx.deployment.findFirst({ where: { id, tenantId } });
      },
    );

    if (updated) {
      return updated;
    }

    const current = await this.findOne(id, principal);
    throw new DeploymentException(
      DeploymentErrorCode.DEP_DEPLOYMENT_CANNOT_CANCEL,
      `Deployment "${id}" cannot be cancelled from status "${current.status}". Only PENDING, RUNNING, or VERIFYING deployments can be cancelled.`,
      HttpStatus.CONFLICT,
    );
  }

  async retry(id: string, principal: IamAuthContext) {
    const deployment = await this.findOne(id, principal);

    if (deployment.status !== 'FAILED' && deployment.status !== 'CANCELLED') {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_DEPLOYMENT_FAILED,
        `Only FAILED or CANCELLED deployments can be retried. Current status is "${deployment.status}".`,
        HttpStatus.CONFLICT,
      );
    }

    // Réexécuter un déploiement avec les mêmes paramètres
    return this.create(
      {
        releaseId: deployment.releaseId,
        environmentId: deployment.environmentId,
        strategy: deployment.strategy as DeploymentStrategy,
        idempotencyKey: `retry-${deployment.id}-${Date.now()}`,
      },
      principal,
    );
  }
}
