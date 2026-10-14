import {
  createDeploymentFixture,
  removeDeploymentFixture,
  DeploymentFixture,
} from '../deployment-test.fixture';
import { Test, TestingModule } from '@nestjs/testing';
import { EnvironmentDeploymentService } from './environment-deployment.service';
import { DeploymentService } from '../deployments/deployment.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('EnvironmentDeploymentService (DEP-CDC-04)', () => {
  let service: EnvironmentDeploymentService;
  let prisma: PrismaService;
  let fixture: DeploymentFixture;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnvironmentDeploymentService,
        DeploymentService,
        PrismaService,
      ],
    }).compile();

    service = module.get<EnvironmentDeploymentService>(
      EnvironmentDeploymentService,
    );
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

  it('should list all environment deployment statuses', async () => {
    const list = await service.findAll(fixture.tenant.id);
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
  });

  it('should get detailed environment status and drift check', async () => {
    const environments = [fixture.environment];
    const status = await service.getStatus(environments[0].id, fixture.tenant.id);
    expect(status).toHaveProperty('environment');
    expect(status).toHaveProperty('deployments');

    await expect(
      service.detectDrift(environments[0].id, fixture.tenant.id),
    ).rejects.toMatchObject({ status: 503 });
  });

  it('should lock and unlock an environment', async () => {
    const environments = [fixture.environment];
    const envId = environments[0].id;

    const lockResult = await service.lock(envId, {
      reason: 'Scheduled infrastructure maintenance window',
      lockedBy: 'ops-lead',
    }, fixture.tenant.id, 'authenticated-test-user');
    expect(lockResult.status).toBe('LOCKED');

    const unlockResult = await service.unlock(
      envId,
      fixture.tenant.id,
      'authenticated-test-user',
    );
    expect(unlockResult.status).toBe('ACTIVE');
  });
});
