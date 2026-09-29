import { jest } from '@jest/globals';
import { ApplicationVersionsService } from './application-versions.service';
import { PlatformException } from '../../../common/errors/platform.exception';

function createMockPrisma() {
  return {
    application: {
      findFirst: jest.fn(),
    },
    applicationVersion: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
}

describe('ApplicationVersionsService (TENANT-ISOLATION)', () => {
  let service: ApplicationVersionsService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new ApplicationVersionsService(prisma as any);
  });

  it('should find versions by application filtered by tenantId', async () => {
    prisma.application.findFirst.mockResolvedValue({ id: 'app-1', status: 'ACTIVE' });
    prisma.applicationVersion.findMany.mockResolvedValue([]);

    await service.findByApplication('app-1', 'tenant-123');

    expect(prisma.application.findFirst).toHaveBeenCalledWith({
      where: { id: 'app-1', tenantId: 'tenant-123' },
    });
    expect(prisma.applicationVersion.findMany).toHaveBeenCalledWith({
      where: { applicationId: 'app-1', tenantId: 'tenant-123' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('should throw APPLICATION_NOT_FOUND when application does not belong to tenant', async () => {
    prisma.application.findFirst.mockResolvedValue(null);

    await expect(service.findByApplication('app-1', 'tenant-123')).rejects.toThrow(PlatformException);
  });

  it('should throw APPLICATION_ARCHIVED when trying to create version for archived app', async () => {
    prisma.application.findFirst.mockResolvedValue({ id: 'app-1', status: 'ARCHIVED' });

    await expect(
      service.create('app-1', { version: '1.0.0' } as any, 'tenant-123'),
    ).rejects.toThrow(PlatformException);
  });

  it('should create version with tenantId', async () => {
    prisma.application.findFirst.mockResolvedValue({ id: 'app-1', status: 'ACTIVE' });
    prisma.applicationVersion.findFirst.mockResolvedValue(null);
    prisma.applicationVersion.create.mockResolvedValue({
      id: 'v-1',
      version: '1.0.0',
      tenantId: 'tenant-123',
      status: 'DRAFT',
    });

    const result = await service.create('app-1', { version: '1.0.0' } as any, 'tenant-123');

    expect(result.tenantId).toBe('tenant-123');
    expect(prisma.applicationVersion.create).toHaveBeenCalledWith({
      data: {
        applicationId: 'app-1',
        version: '1.0.0',
        releaseNotes: undefined,
        createdFrom: undefined,
        status: 'DRAFT',
        tenantId: 'tenant-123',
      },
    });
  });

  it('should reject duplicate version within same application and tenant', async () => {
    prisma.application.findFirst.mockResolvedValue({ id: 'app-1', status: 'ACTIVE' });
    prisma.applicationVersion.findFirst.mockResolvedValue({ id: 'existing', version: '1.0.0' });

    await expect(
      service.create('app-1', { version: '1.0.0' } as any, 'tenant-123'),
    ).rejects.toThrow(PlatformException);
  });

  it('should find one version with tenantId filter', async () => {
    const mockVersion = { id: 'v-1', version: '1.0.0', tenantId: 'tenant-123', application: {}, snapshots: [], releases: [] };
    prisma.applicationVersion.findFirst.mockResolvedValue(mockVersion);

    const result = await service.findOne('v-1', 'tenant-123');

    expect(prisma.applicationVersion.findFirst).toHaveBeenCalledWith({
      where: { id: 'v-1', tenantId: 'tenant-123' },
      include: { application: true, snapshots: true, releases: true },
    });
    expect(result).toBe(mockVersion);
  });

  it('should throw VERSION_NOT_FOUND when version does not belong to tenant', async () => {
    prisma.applicationVersion.findFirst.mockResolvedValue(null);

    await expect(service.findOne('v-1', 'tenant-123')).rejects.toThrow(PlatformException);
  });

  it('should reject updating immutable version', async () => {
    prisma.applicationVersion.findFirst.mockResolvedValue({
      id: 'v-1',
      version: '1.0.0',
      status: 'ACTIVE',
      application: {},
      snapshots: [],
      releases: [],
      tenantId: 'tenant-123',
    });

    await expect(
      service.update('v-1', { releaseNotes: 'test' } as any, 'tenant-123'),
    ).rejects.toThrow(PlatformException);
  });

  it('should change status of version belonging to tenant', async () => {
    prisma.applicationVersion.findFirst.mockResolvedValue({
      id: 'v-1',
      version: '1.0.0',
      status: 'CONFIGURING',
      application: {},
      snapshots: [],
      releases: [],
      tenantId: 'tenant-123',
    });
    prisma.applicationVersion.update.mockResolvedValue({ id: 'v-1', status: 'VALIDATING' });

    const result = await service.changeStatus('v-1', 'VALIDATING', 'tenant-123');
    expect(result.status).toBe('VALIDATING');
  });
});
