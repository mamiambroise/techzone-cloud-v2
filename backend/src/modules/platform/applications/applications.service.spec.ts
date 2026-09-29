import { jest } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { PlatformException } from '../../../common/errors/platform.exception';

function createMockPrisma() {
  return {
    application: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
}

describe('ApplicationsService (TENANT-ISOLATION)', () => {
  let service: ApplicationsService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new ApplicationsService(prisma as any);
  });

  it('should find all applications filtered by tenantId', async () => {
    await service.findAll('tenant-123');
    expect(prisma.application.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-123' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('should find all applications with undefined tenantId when tenantId is null', async () => {
    await service.findAll(null);
    expect(prisma.application.findMany).toHaveBeenCalledWith({
      where: { tenantId: undefined },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('should create application with tenantId', async () => {
    prisma.application.findFirst.mockResolvedValue(null);
    prisma.application.create.mockResolvedValue({ id: 'app-1', code: 'APP01', tenantId: 'tenant-123' });

    const result = await service.create(
      { code: 'APP01', name: 'My App' } as any,
      'tenant-123',
    );

    expect(prisma.application.create).toHaveBeenCalledWith({
      data: {
        code: 'APP01',
        name: 'My App',
        description: undefined,
        tenantId: 'tenant-123',
        tenantScope: 'TENANT',
      },
    });
    expect(result.tenantId).toBe('tenant-123');
  });

  it('should find one application with tenantId filter', async () => {
    const mockApp = { id: 'app-1', code: 'APP01', tenantId: 'tenant-123', versions: [] };
    prisma.application.findFirst.mockResolvedValue(mockApp);

    const result = await service.findOne('app-1', 'tenant-123');

    expect(prisma.application.findFirst).toHaveBeenCalledWith({
      where: { id: 'app-1', tenantId: 'tenant-123' },
      include: { versions: { orderBy: { createdAt: 'desc' } } },
    });
    expect(result).toBe(mockApp);
  });

  it('should throw APPLICATION_NOT_FOUND when application does not belong to tenant', async () => {
    prisma.application.findFirst.mockResolvedValue(null);

    await expect(service.findOne('app-1', 'tenant-123')).rejects.toMatchObject({
      status: HttpStatus.NOT_FOUND,
    });
    expect(prisma.application.findFirst).toHaveBeenCalledWith({
      where: { id: 'app-1', tenantId: 'tenant-123' },
      include: expect.anything(),
    });
  });

  it('should reject duplicate code within same tenant', async () => {
    prisma.application.findFirst.mockResolvedValue({ id: 'existing', code: 'APP01' });

    await expect(
      service.create({ code: 'APP01', name: 'Dup' } as any, 'tenant-123'),
    ).rejects.toThrow(PlatformException);

    expect(prisma.application.findFirst).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-123', code: 'APP01' },
    });
  });

  it('should allow same code across different tenants', async () => {
    prisma.application.findFirst.mockResolvedValue(null);
    prisma.application.create.mockResolvedValue({ id: 'app-2', code: 'APP01', tenantId: 'tenant-456' });

    const result = await service.create(
      { code: 'APP01', name: 'App in other tenant' } as any,
      'tenant-456',
    );

    expect(result.tenantId).toBe('tenant-456');
  });

  it('should update application only if it belongs to the tenant', async () => {
    prisma.application.findFirst.mockResolvedValue({ id: 'app-1', code: 'APP01', status: 'ACTIVE', tenantId: 'tenant-123' });
    prisma.application.update.mockResolvedValue({ id: 'app-1', name: 'Updated' });

    await service.update('app-1', { name: 'Updated' } as any, 'tenant-123');

    expect(prisma.application.update).toHaveBeenCalled();
  });

  it('should throw when updating an archived application', async () => {
    prisma.application.findFirst.mockResolvedValue({
      id: 'app-1',
      code: 'APP01',
      status: 'ARCHIVED',
      tenantId: 'tenant-123',
    });

    await expect(
      service.update('app-1', { name: 'Updated' } as any, 'tenant-123'),
    ).rejects.toThrow(PlatformException);
  });

  it('should return application without updating if already archived on archive call', async () => {
    const archivedApp = { id: 'app-1', status: 'ARCHIVED', tenantId: 'tenant-123' };
    prisma.application.findFirst.mockResolvedValue(archivedApp);

    const result = await service.archive('app-1', 'tenant-123');
    expect(result).toBe(archivedApp);
    expect(prisma.application.update).not.toHaveBeenCalled();
  });

  it('should not call create if existing record found during create', async () => {
    prisma.application.findFirst.mockResolvedValue({ id: 'existing' });

    await expect(
      service.create({ code: 'APP01', name: 'Test' } as any, 'tenant-123'),
    ).rejects.toThrow(PlatformException);

    expect(prisma.application.create).not.toHaveBeenCalled();
  });
});
