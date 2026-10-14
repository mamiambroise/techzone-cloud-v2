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
    const list = await service.findAll();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
  });

  it('should get detailed environment status and drift check', async () => {
    const environments = [fixture.environment];
    const status = await service.getStatus(environments[0].id);
    expect(status).toHaveProperty('environment');
    expect(status).toHaveProperty('deployments');

    const drift = await service.detectDrift(environments[0].id);
    expect(drift).toHaveProperty('isSynchronized');
    expect(drift.isSynchronized).toBe(true);
  });

  it('should lock and unlock an environment', async () => {
    const environments = [fixture.environment];
    const envId = environments[0].id;

    const lockResult = await service.lock(envId, {
      reason: 'Scheduled infrastructure maintenance window',
      lockedBy: 'ops-lead',
    });
    expect(lockResult.status).toBe('LOCKED');

    const unlockResult = await service.unlock(envId, 'ops-lead');
    expect(unlockResult.status).toBe('ACTIVE');
  });
});
