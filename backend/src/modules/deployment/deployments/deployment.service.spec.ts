import {
  createDeploymentFixture,
  removeDeploymentFixture,
  DeploymentFixture,
} from '../deployment-test.fixture';
import { Test, TestingModule } from '@nestjs/testing';
import { DeploymentService } from './deployment.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { DeploymentStrategy } from './dto/create-deployment.dto';
import { DeploymentException } from '../../../common/errors/deployment.exception';
import type { IamAuthContext } from '../../../iam/decorators/current-user.decorator';
import {
  DEPLOYMENT_RUNTIME_READINESS_PROBE,
  DeploymentReadinessService,
  type DeploymentReadinessEvidence,
  type DeploymentReadinessInput,
} from '../readiness/deployment-readiness.service';
import { DeploymentErrorCode } from '../../../common/errors/deployment-error-code.enum';

const principalFor = (
  tenantId: string,
  userId = 'deployment-test-user',
): IamAuthContext => ({
  userId,
  sessionId: 'deployment-test-session',
  tenantId,
  organizationId: null,
  siteId: null,
  authenticationLevel: 'PASSWORD',
  roles: [],
  permissions: [],
  isSuperAdmin: false,
});

const realReadiness = (
  input: DeploymentReadinessInput,
): DeploymentReadinessEvidence => ({
  ready: true,
  source: 'REAL',
  message: 'Test runtime returned a deployment-bound readiness proof',
  observedAt: new Date().toISOString(),
  runtimeStatus: 'READY',
  proof: {
    kind: 'RUNTIME_READINESS',
    source: 'RUNTIME',
    deploymentId: input.deploymentId,
    releaseId: input.releaseId,
    environmentId: input.environmentId,
    tenantId: input.tenantId,
    traceId: input.traceId,
    activationId: `activation-${input.deploymentId}`,
    appliedAt: new Date().toISOString(),
    observedAt: new Date().toISOString(),
  },
  dependencies: [{ name: 'database', critical: true, status: 'UP' }],
});

async function waitFor<T>(read: () => T | undefined): Promise<T> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const value = read();
    if (value !== undefined) {
      return value;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Timed out waiting for deployment readiness to start');
}

describe('DeploymentService (DEP-CDC-03)', () => {
  let service: DeploymentService;
  let prisma: PrismaService;
  let fixture: DeploymentFixture;
  let readinessProbe: { probe: jest.Mock };

  beforeEach(async () => {
    readinessProbe = {
      probe: jest.fn((input: DeploymentReadinessInput) =>
        Promise.resolve(realReadiness(input)),
      ),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeploymentService,
        PrismaService,
        DeploymentReadinessService,
        {
          provide: DEPLOYMENT_RUNTIME_READINESS_PROBE,
          useValue: readinessProbe,
        },
      ],
    }).compile();

    service = module.get<DeploymentService>(DeploymentService);
    prisma = module.get<PrismaService>(PrismaService);
    fixture = await createDeploymentFixture(prisma);
  });

  afterEach(async () => {
    try {
      await removeDeploymentFixture(prisma, fixture);
    } finally {
      await prisma.$disconnect();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list all deployments', async () => {
    const deployments = await service.findAll({
      environmentId: fixture.environment.id,
    }, principalFor(fixture.tenant.id));
    expect(Array.isArray(deployments)).toBe(true);
    expect(deployments.length).toBeGreaterThan(0);
    expect(deployments[0]).toHaveProperty('status');
  });

  it('should get deployment by ID with relations', async () => {
    const all = await service.findAll({
      environmentId: fixture.environment.id,
    }, principalFor(fixture.tenant.id));
    const deployment = await service.findOne(all[0].id, principalFor(fixture.tenant.id));
    expect(deployment.id).toBe(all[0].id);
    expect(deployment).toHaveProperty('release');
    expect(deployment).toHaveProperty('environment');
    expect(deployment).toHaveProperty('gates');
  });

  it('should prevent deployment of unapproved release', async () => {
    const apps = [fixture.application];
    const appVersions = [fixture.version];
    const snapshots = [fixture.snapshot];
    const environments = [fixture.environment];

    const draftRelease = await prisma.release.create({
      data: {
        tenantId: fixture.tenant.id,
        code: 'unapproved-rel',
        version: `1.0-${Date.now()}`,
        applicationId: apps[0].id,
        applicationVersionId: appVersions[0].id,
        snapshotId: snapshots[0].id,
        configurationVersion: '1.0.0',
        status: 'DRAFT',
        createdBy: 'test-user',
        artifactRefs: [],
        contractVersions: [],
      },
    });

    await expect(
      service.create({
        releaseId: draftRelease.id,
        environmentId: environments[0].id,
        startedBy: 'test-deployer',
      }, principalFor(fixture.tenant.id)),
    ).rejects.toThrow(DeploymentException);
  });

  it('should successfully deploy an approved release and execute gates', async () => {
    const releases = [fixture.release];
    const environments = [fixture.environment];

    const targetEnv = environments[0];
    const targetRel = releases[0];

    const deployment = await service.create({
      releaseId: targetRel.id,
      environmentId: targetEnv.id,
      strategy: DeploymentStrategy.STANDARD,
      idempotencyKey: `idemp-test-${Date.now()}`,
      startedBy: 'forged-ci-runner',
    }, principalFor(fixture.tenant.id, 'server-ci-runner'));

    expect(deployment.status).toBe('SUCCEEDED');
    expect(deployment.tenantId).toBe(fixture.tenant.id);
    expect(deployment.healthStatus).toBe('HEALTHY');
    expect(deployment.gates.length).toBeGreaterThan(0);
    expect(deployment.startedBy).toBe('server-ci-runner');

    // Verify idempotent execution returns identical result
    const secondCall = await service.create({
      releaseId: targetRel.id,
      environmentId: targetEnv.id,
      strategy: DeploymentStrategy.STANDARD,
      idempotencyKey: deployment.idempotencyKey as string,
      startedBy: 'ci-runner',
    }, principalFor(fixture.tenant.id, 'server-ci-runner'));

    expect(secondCall.id).toBe(deployment.id);
  });

  it('should verify deployment health status', async () => {
    const all = await service.findAll({
      environmentId: fixture.environment.id,
    }, principalFor(fixture.tenant.id));
    const verified = await service.verify(
      all[0].id,
      principalFor(fixture.tenant.id, 'server-health-checker'),
    );
    expect(verified.healthStatus).toBe('HEALTHY');
    const healthCheck = await prisma.deploymentHistory.findFirst({
      where: { deploymentId: all[0].id, action: 'HEALTH_CHECK' },
      orderBy: { createdAt: 'desc' },
    });
    expect(healthCheck?.actor).toBe('server-health-checker');
  });

  it('fails closed when the runtime is unavailable and never reports success', async () => {
    readinessProbe.probe.mockResolvedValue({
      ready: false,
      source: 'REAL',
      code: DeploymentErrorCode.DEP_RUNTIME_UNAVAILABLE,
      message: 'Runtime is unavailable',
      observedAt: new Date().toISOString(),
      retryable: true,
    } satisfies DeploymentReadinessEvidence);

    const deployment = await service.create(
      {
        releaseId: fixture.release.id,
        environmentId: fixture.environment.id,
        idempotencyKey: `unavailable-${Date.now()}`,
      },
      principalFor(fixture.tenant.id),
    );

    expect(deployment.status).toBe('FAILED');
    expect(deployment.status).not.toBe('SUCCEEDED');
    expect(deployment.healthStatus).toBe('DEGRADED');
    expect(
      await prisma.deploymentHistory.findFirst({
        where: {
          deploymentId: deployment.id,
          action: 'FAILED',
          errorCode: DeploymentErrorCode.DEP_RUNTIME_UNAVAILABLE,
        },
      }),
    ).toBeTruthy();
    const environmentState = await prisma.environmentDeployment.findFirst({
      where: {
        environmentId: fixture.environment.id,
        applicationId: fixture.application.id,
        tenantId: fixture.tenant.id,
      },
    });
    expect(environmentState?.status).toBe('ACTIVE');
    expect(environmentState?.currentReleaseId).toBe(fixture.release.id);
    expect(environmentState?.deploymentId).toBe(fixture.deployment.id);
  });

  it('serializes competing creates for the same environment', async () => {
    let firstReadinessInput: DeploymentReadinessInput | undefined;
    let resolveReadiness!: (evidence: DeploymentReadinessEvidence) => void;
    const delayedReadiness = new Promise<DeploymentReadinessEvidence>((resolve) => {
      resolveReadiness = resolve;
    });
    readinessProbe.probe.mockImplementationOnce((input: DeploymentReadinessInput) => {
      firstReadinessInput = input;
      return delayedReadiness;
    });

    const first = service.create(
      {
        releaseId: fixture.release.id,
        environmentId: fixture.environment.id,
        idempotencyKey: `race-first-${Date.now()}`,
      },
      principalFor(fixture.tenant.id),
    );
    const firstInput = await waitFor(() => firstReadinessInput);

    await expect(
      service.create(
        {
          releaseId: fixture.release.id,
          environmentId: fixture.environment.id,
          idempotencyKey: `race-second-${Date.now()}`,
        },
        principalFor(fixture.tenant.id),
      ),
    ).rejects.toThrow(DeploymentException);

    resolveReadiness(realReadiness(firstInput));
    await expect(first).resolves.toMatchObject({ status: 'SUCCEEDED' });
  });

  it('does not promote an environment when cancellation wins the readiness race', async () => {
    let readinessInput: DeploymentReadinessInput | undefined;
    let resolveReadiness!: (evidence: DeploymentReadinessEvidence) => void;
    const delayedReadiness = new Promise<DeploymentReadinessEvidence>((resolve) => {
      resolveReadiness = resolve;
    });
    readinessProbe.probe.mockImplementationOnce((input: DeploymentReadinessInput) => {
      readinessInput = input;
      return delayedReadiness;
    });

    const creating = service.create(
      {
        releaseId: fixture.release.id,
        environmentId: fixture.environment.id,
        idempotencyKey: `cancel-race-${Date.now()}`,
      },
      principalFor(fixture.tenant.id),
    );
    const input = await waitFor(() => readinessInput);

    const cancelled = await service.cancel(
      input.deploymentId,
      principalFor(fixture.tenant.id, 'deployment-canceller'),
    );
    expect(cancelled.status).toBe('CANCELLED');

    resolveReadiness(realReadiness(input));
    await expect(creating).resolves.toMatchObject({ status: 'CANCELLED' });

    const persisted = await prisma.deployment.findFirst({
      where: { id: input.deploymentId, tenantId: fixture.tenant.id },
    });
    expect(persisted?.status).toBe('CANCELLED');
    expect(
      await prisma.deploymentHistory.count({
        where: { deploymentId: input.deploymentId, action: 'SUCCEEDED' },
      }),
    ).toBe(0);
    const environmentState = await prisma.environmentDeployment.findFirst({
      where: {
        environmentId: fixture.environment.id,
        applicationId: fixture.application.id,
        tenantId: fixture.tenant.id,
      },
    });
    expect(environmentState?.deploymentId).toBe(fixture.deployment.id);
    expect(environmentState?.currentReleaseId).toBe(fixture.release.id);
  });

  it('should reject deployment into an environment of another tenant', async () => {
    const other = await createDeploymentFixture(prisma);
    try {
      await expect(
        service.create({
          releaseId: fixture.release.id,
          environmentId: other.environment.id,
          startedBy: 'isolated-test',
        }, principalFor(fixture.tenant.id)),
      ).rejects.toThrow(DeploymentException);
      expect(
        await prisma.deployment.count({
          where: {
            releaseId: fixture.release.id,
            environmentId: other.environment.id,
          },
        }),
      ).toBe(0);
    } finally {
      await removeDeploymentFixture(prisma, other);
    }
  });

  it('does not return deployments owned by a different tenant', async () => {
    const other = await createDeploymentFixture(prisma);
    try {
      const scoped = await service.findAll(
        undefined,
        principalFor(fixture.tenant.id),
      );
      expect(scoped.every((deployment) => deployment.tenantId === fixture.tenant.id)).toBe(true);
      await expect(
        service.findOne(other.deployment.id, principalFor(fixture.tenant.id)),
      ).rejects.toThrow(DeploymentException);
    } finally {
      await removeDeploymentFixture(prisma, other);
    }
  });
});
