import {
  createDeploymentFixture,
  removeDeploymentFixture,
  DeploymentFixture,
} from '../deployment-test.fixture';
import { Test, TestingModule } from '@nestjs/testing';
import { ReleaseService } from './release.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { DeploymentException } from '../../../common/errors/deployment.exception';
import type { IamAuthContext } from '../../../iam/decorators/current-user.decorator';

const principalFor = (tenantId: string, userId = 'release-test-user'): IamAuthContext => ({
  userId,
  sessionId: 'release-test-session',
  tenantId,
  organizationId: null,
  siteId: null,
  authenticationLevel: 'PASSWORD',
  roles: [],
  permissions: [],
  isSuperAdmin: false,
});

describe('ReleaseService (DEP-CDC-02)', () => {
  jest.setTimeout(30_000);

  let service: ReleaseService;
  let prisma: PrismaService;
  let fixture: DeploymentFixture;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReleaseService, PrismaService],
    }).compile();

    service = module.get<ReleaseService>(ReleaseService);
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

  it('should list all releases with relations', async () => {
    const releases = await service.findAll({
      applicationId: fixture.application.id,
    }, principalFor(fixture.tenant.id));
    expect(Array.isArray(releases)).toBe(true);
    expect(releases.length).toBeGreaterThan(0);
    expect(releases[0]).toHaveProperty('code');
    expect(releases[0]).toHaveProperty('version');
  });

  it('should get a single release by ID', async () => {
    const all = await service.findAll({
      applicationId: fixture.application.id,
    }, principalFor(fixture.tenant.id));
    const release = await service.findOne(all[0].id, principalFor(fixture.tenant.id));
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
      }, principalFor(fixture.tenant.id)),
    ).rejects.toThrow(DeploymentException);
  });

  it('should reject duplicate code and version', async () => {
    const all = await service.findAll({
      applicationId: fixture.application.id,
    }, principalFor(fixture.tenant.id));
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
      }, principalFor(fixture.tenant.id)),
    ).rejects.toThrow(DeploymentException);
  });

  it('should assemble a release in DRAFT status', async () => {
    const apps = [fixture.application];
    const appVersions = [fixture.version];
    const snapshots = [fixture.snapshot];

    const created = await service.create({
      tenantId: fixture.tenant.id,
      code: 'assembly-test-rel',
      version: `2.0.0-${Date.now()}`,
      applicationId: apps[0].id,
      applicationVersionId: appVersions[0].id,
      snapshotId: snapshots[0].id,
      configurationVersion: '1.0.0',
      createdBy: 'test-user',
    }, principalFor(fixture.tenant.id, 'release-creator'));

    expect(created.status).toBe('DRAFT');

    const assembled = await service.assemble(created.id, principalFor(fixture.tenant.id));
    expect(assembled.status).toBe('ASSEMBLING');

    const validated = await service.validate(created.id, principalFor(fixture.tenant.id));
    expect(validated.status).toBe('READY');

    const approved = await service.approve(created.id, {
      approvedBy: 'qa-lead@techzone.io',
      notes: 'All quality metrics met',
    }, principalFor(fixture.tenant.id, 'release-approver'));
    expect(approved.status).toBe('APPROVED');
    expect(approved.approvedAt).toBeDefined();

    const published = await service.publish(created.id, principalFor(fixture.tenant.id));
    expect(published.status).toBe('RELEASED');
    expect(published.releasedAt).toBeDefined();
  });

  it('should compare two releases and highlight diffs', async () => {
    const second = await service.create({
      code: fixture.release.code,
      version: '2.0.0',
      tenantId: fixture.tenant.id,
      applicationId: fixture.application.id,
      applicationVersionId: fixture.version.id,
      snapshotId: fixture.snapshot.id,
      configurationVersion: '2.0.0',
      createdBy: 'isolated-test',
    }, principalFor(fixture.tenant.id));
    const comparison = await service.compare(
      fixture.release.id,
      second.id,
      principalFor(fixture.tenant.id),
    );
    expect(comparison).toHaveProperty('release1');
    expect(comparison).toHaveProperty('release2');
    expect(comparison).toHaveProperty('differences');
  });

  it('does not expose a release belonging to another tenant', async () => {
    const other = await createDeploymentFixture(prisma);
    try {
      await expect(
        service.findOne(other.release.id, principalFor(fixture.tenant.id)),
      ).rejects.toThrow(DeploymentException);
      const releases = await service.findAll(undefined, principalFor(fixture.tenant.id));
      expect(releases.every((release) => release.tenantId === fixture.tenant.id)).toBe(true);
    } finally {
      await removeDeploymentFixture(prisma, other);
    }
  });
});
