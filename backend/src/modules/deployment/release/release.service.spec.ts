import { Test, TestingModule } from '@nestjs/testing';
import { ReleaseService } from './release.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { DeploymentException } from '../../../common/errors/deployment.exception';

describe('ReleaseService (DEP-CDC-02)', () => {
  let service: ReleaseService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReleaseService, PrismaService],
    }).compile();

    service = module.get<ReleaseService>(ReleaseService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list all releases with relations', async () => {
    const releases = await service.findAll();
    expect(Array.isArray(releases)).toBe(true);
    expect(releases.length).toBeGreaterThan(0);
    expect(releases[0]).toHaveProperty('code');
    expect(releases[0]).toHaveProperty('version');
  });

  it('should get a single release by ID', async () => {
    const all = await service.findAll();
    const release = await service.findOne(all[0].id);
    expect(release.id).toBe(all[0].id);
  });

  it('should reject release creation if application does not exist', async () => {
    await expect(
      service.create({
        code: 'new-app-rel',
        version: '1.0.0',
        applicationId: '00000000-0000-0000-0000-000000000000',
        applicationVersionId: '00000000-0000-0000-0000-000000000001',
        snapshotId: '00000000-0000-0000-0000-000000000002',
        configurationVersion: '1.0.0',
        createdBy: 'test-user',
      }),
    ).rejects.toThrow(DeploymentException);
  });

  it('should reject duplicate code and version', async () => {
    const all = await service.findAll();
    const existing = all[0];

    await expect(
      service.create({
        code: existing.code,
        version: existing.version,
        applicationId: existing.applicationId,
        applicationVersionId: existing.applicationVersionId,
        snapshotId: existing.snapshotId,
        configurationVersion: '1.0.0',
        createdBy: 'test-user',
      }),
    ).rejects.toThrow(DeploymentException);
  });

  it('should assemble a release in DRAFT status', async () => {
    const apps = await prisma.application.findMany();
    const appVersions = await prisma.applicationVersion.findMany();
    const snapshots = await prisma.snapshot.findMany();

    const created = await service.create({
      code: 'assembly-test-rel',
      version: `2.0.0-${Date.now()}`,
      applicationId: apps[0].id,
      applicationVersionId: appVersions[0].id,
      snapshotId: snapshots[0].id,
      configurationVersion: '1.0.0',
      createdBy: 'test-user',
    });

    expect(created.status).toBe('DRAFT');

    const assembled = await service.assemble(created.id);
    expect(assembled.status).toBe('ASSEMBLING');

    const validated = await service.validate(created.id);
    expect(validated.status).toBe('READY');

    const approved = await service.approve(created.id, {
      approvedBy: 'qa-lead@techzone.io',
      notes: 'All quality metrics met',
    });
    expect(approved.status).toBe('APPROVED');
    expect(approved.approvedAt).toBeDefined();

    const published = await service.publish(created.id);
    expect(published.status).toBe('RELEASED');
    expect(published.releasedAt).toBeDefined();
  });

  it('should compare two releases and highlight diffs', async () => {
    const all = await service.findAll();
    if (all.length >= 2) {
      const comparison = await service.compare(all[0].id, all[1].id);
      expect(comparison).toHaveProperty('release1');
      expect(comparison).toHaveProperty('release2');
      expect(comparison).toHaveProperty('differences');
    }
  });
});
