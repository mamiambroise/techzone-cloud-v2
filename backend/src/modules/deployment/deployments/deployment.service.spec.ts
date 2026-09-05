import { Test, TestingModule } from '@nestjs/testing';
import { DeploymentService } from './deployment.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { DeploymentStrategy } from './dto/create-deployment.dto';
import { DeploymentException } from '../../../common/errors/deployment.exception';

describe('DeploymentService (DEP-CDC-03)', () => {
  let service: DeploymentService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeploymentService, PrismaService],
    }).compile();

    service = module.get<DeploymentService>(DeploymentService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list all deployments', async () => {
    const deployments = await service.findAll();
    expect(Array.isArray(deployments)).toBe(true);
    expect(deployments.length).toBeGreaterThan(0);
    expect(deployments[0]).toHaveProperty('status');
  });

  it('should get deployment by ID with relations', async () => {
    const all = await service.findAll();
    const deployment = await service.findOne(all[0].id);
    expect(deployment.id).toBe(all[0].id);
    expect(deployment).toHaveProperty('release');
    expect(deployment).toHaveProperty('environment');
    expect(deployment).toHaveProperty('gates');
  });

  it('should prevent deployment of unapproved release', async () => {
    const apps = await prisma.application.findMany();
    const appVersions = await prisma.applicationVersion.findMany();
    const snapshots = await prisma.snapshot.findMany();
    const environments = await prisma.environment.findMany();

    const draftRelease = await prisma.release.create({
      data: {
        code: 'unapproved-rel',
        version: `1.0-${Date.now()}`,
        applicationId: apps[0].id,
        applicationVersionId: appVersions[0].id,
        snapshotId: snapshots[0].id,
        configurationVersion: '1.0.0',
        status: 'DRAFT',
        createdBy: 'test-user',
      },
    });

    await expect(
      service.create({
        releaseId: draftRelease.id,
        environmentId: environments[0].id,
        startedBy: 'test-deployer',
      }),
    ).rejects.toThrow(DeploymentException);
  });

  it('should successfully deploy an approved release and execute gates', async () => {
    const releases = await prisma.release.findMany({
      where: { status: { in: ['APPROVED', 'RELEASED'] } },
    });
    const environments = await prisma.environment.findMany();

    const targetEnv = environments[0];
    const targetRel = releases[0];

    const deployment = await service.create({
      releaseId: targetRel.id,
      environmentId: targetEnv.id,
      strategy: DeploymentStrategy.STANDARD,
      idempotencyKey: `idemp-test-${Date.now()}`,
      startedBy: 'ci-runner',
    });

    expect(deployment.status).toBe('SUCCEEDED');
    expect(deployment.healthStatus).toBe('HEALTHY');
    expect(deployment.gates.length).toBeGreaterThan(0);

    // Verify idempotent execution returns identical result
    const secondCall = await service.create({
      releaseId: targetRel.id,
      environmentId: targetEnv.id,
      strategy: DeploymentStrategy.STANDARD,
      idempotencyKey: deployment.idempotencyKey as string,
      startedBy: 'ci-runner',
    });

    expect(secondCall.id).toBe(deployment.id);
  });

  it('should verify deployment health status', async () => {
    const all = await service.findAll();
    const verified = await service.verify(all[0].id, { verifiedBy: 'tester' });
    expect(verified.healthStatus).toBe('HEALTHY');
  });
});
