import {
  createDeploymentFixture,
  removeDeploymentFixture,
  DeploymentFixture,
} from '../deployment-test.fixture';
import { Test, TestingModule } from '@nestjs/testing';
import { RollbackService } from './rollback.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { RollbackTypeDto } from './dto/create-rollback.dto';

describe('RollbackService (DEP-CDC-06)', () => {
  let service: RollbackService;
  let prisma: PrismaService;
  let fixture: DeploymentFixture;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RollbackService, PrismaService],
    }).compile();

    service = module.get<RollbackService>(RollbackService);
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

  it('should execute rollback to target release', async () => {
    const deployments = [{ ...fixture.deployment, release: fixture.release }];

    const dep = deployments[0];

    const priorRelease = await prisma.release.create({
      data: {
        tenantId: fixture.tenant.id,
        code: dep.release.code,
        version: '0.9.0',
        applicationId: dep.release.applicationId,
        applicationVersionId: dep.release.applicationVersionId,
        snapshotId: dep.release.snapshotId,
        configurationVersion: '0.9.0',
        status: 'RELEASED',
        createdBy: 'system',
        artifactRefs: [],
        contractVersions: [],
      },
    });

    const rollback = await service.rollbackDeployment(dep.id, {
      type: RollbackTypeDto.MANUAL_ROLLBACK,
      reason: 'Critical bug detected in production payment flow',
      toReleaseId: priorRelease.id,
      startedBy: 'sre-engineer@techzone.io',
    });

    expect(rollback.status).toBe('SUCCEEDED');
    expect(rollback.fromReleaseId).toBe(dep.releaseId);
    expect(rollback.toReleaseId).toBe(priorRelease.id);
  });
});
