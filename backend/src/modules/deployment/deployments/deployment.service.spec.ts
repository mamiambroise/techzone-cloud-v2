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

describe('DeploymentService (DEP-CDC-03)', () => {
  let service: DeploymentService;
  let prisma: PrismaService;
  let fixture: DeploymentFixture;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeploymentService, PrismaService],
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
    }, fixture.tenant.id);
    expect(Array.isArray(deployments)).toBe(true);
    expect(deployments.length).toBeGreaterThan(0);
    expect(deployments[0]).toHaveProperty('status');
  });

  it('should get deployment by ID with relations', async () => {
    const all = await service.findAll({
      environmentId: fixture.environment.id,
    }, fixture.tenant.id);
    const deployment = await service.findOne(all[0].id, fixture.tenant.id);
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
      }, fixture.tenant.id, 'authenticated-test-user'),
    ).rejects.toThrow(DeploymentException);
  });

  it('must not fabricate Runtime readiness or deployment success', async () => {
    const releases = [fixture.release];
    const environments = [fixture.environment];

    const targetEnv = environments[0];
    const targetRel = releases[0];

    const before = await prisma.deployment.count({
      where: { tenantId: fixture.tenant.id },
    });
    await expect(service.create({
      releaseId: targetRel.id,
      environmentId: targetEnv.id,
      strategy: DeploymentStrategy.STANDARD,
      idempotencyKey: `idemp-test-${Date.now()}`,
      startedBy: 'forged-client-actor',
    }, fixture.tenant.id, 'authenticated-test-user')).rejects.toMatchObject({
      status: 503,
    });
    expect(
      await prisma.deployment.count({ where: { tenantId: fixture.tenant.id } }),
    ).toBe(before);
  });

  it('must not fabricate a successful health check without a Runtime probe', async () => {
    const all = await service.findAll({
      environmentId: fixture.environment.id,
    }, fixture.tenant.id);
    await expect(
      service.verify(
        all[0].id,
        { verifiedBy: 'forged-client-actor' },
        fixture.tenant.id,
      ),
    ).rejects.toMatchObject({ status: 503 });
  });

  it('should reject deployment into an environment of another tenant', async () => {
    const other = await createDeploymentFixture(prisma);
    try {
      await expect(
        service.create({
          releaseId: fixture.release.id,
          environmentId: other.environment.id,
          startedBy: 'isolated-test',
        }, fixture.tenant.id, 'authenticated-test-user'),
      ).rejects.toThrow(
        'Target environment',
      );
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
});
