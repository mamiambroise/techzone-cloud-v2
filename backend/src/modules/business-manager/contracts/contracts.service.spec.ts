import { jest } from '@jest/globals';
import { ContractsService } from './contracts.service';
import { PlatformException } from '../../../common/errors/platform.exception';
import { BmContractStatus } from '../../../generated/prisma/enums';

function createMockPrisma() {
  return {
    applicationVersion: {
      findFirst: jest.fn(),
    },
    bmBusinessContract: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    bmContractVersion: {
      create: jest.fn(),
    },
  };
}

describe('ContractsService (TENANT-ISOLATION)', () => {
  let service: ContractsService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new ContractsService(prisma as any);
  });

  describe('createContract', () => {
    it('should create contract with tenantId', async () => {
      prisma.applicationVersion.findFirst.mockResolvedValue({
        id: 'av-1',
        applicationId: 'app-1',
        status: 'DRAFT',
        version: '1.0.0',
      });
      prisma.bmBusinessContract.findFirst.mockResolvedValue(null);
      prisma.bmBusinessContract.create.mockResolvedValue({ id: 'c-1', code: 'contract1', name: 'Contract 1' });
      prisma.bmContractVersion.create.mockResolvedValue({ id: 'cv-1', versionNumber: '1.0.0' });

      const result = await service.createContract(
        'av-1',
        { code: 'CONTRACT1', name: 'Contract 1', version: '1.0.0' } as any,
        'tenant-123',
      );

      expect(prisma.applicationVersion.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'av-1', tenantId: 'tenant-123' },
        }),
      );
      expect(prisma.bmBusinessContract.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          applicationVersionId: 'av-1',
          code: 'contract1',
          tenantId: 'tenant-123',
          status: BmContractStatus.DRAFT,
        }),
      });
      expect(result.id).toBe('c-1');
    });

    it('should create contract with undefined tenantId when null', async () => {
      prisma.applicationVersion.findFirst.mockResolvedValue({
        id: 'av-1',
        applicationId: 'app-1',
        status: 'DRAFT',
        version: '1.0.0',
      });
      prisma.bmBusinessContract.findFirst.mockResolvedValue(null);
      prisma.bmBusinessContract.create.mockResolvedValue({ id: 'c-1', code: 'contract1', name: 'Contract 1' });
      prisma.bmContractVersion.create.mockResolvedValue({ id: 'cv-1' });

      await service.createContract(
        'av-1',
        { code: 'CONTRACT1', name: 'Contract 1', version: '1.0.0' } as any,
        null,
      );

      expect(prisma.bmBusinessContract.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId: undefined }),
        }),
      );
    });

    it('should throw NotFound when application version does not exist', async () => {
      prisma.applicationVersion.findFirst.mockResolvedValue(null);

      await expect(
        service.createContract('av-1', { code: 'CONTRACT1', name: 'Contract 1' } as any, 'tenant-123'),
      ).rejects.toThrow(PlatformException);
    });
  });

  it('scopes contract updates to the authenticated tenant', async () => {
    prisma.bmBusinessContract.findFirst.mockResolvedValue({
      id: 'c-1',
      tenantId: 'tenant-123',
      applicationVersionId: 'av-1',
      status: BmContractStatus.DRAFT,
    });
    prisma.applicationVersion.findFirst.mockResolvedValue({
      id: 'av-1',
      status: 'DRAFT',
      version: '1.0.0',
      applicationId: 'app-1',
    });
    prisma.bmBusinessContract.update.mockResolvedValue({ id: 'c-1' });

    await service.updateContract(
      'c-1',
      { name: 'Updated contract' } as any,
      'tenant-123',
    );

    expect(prisma.bmBusinessContract.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'c-1', tenantId: 'tenant-123' },
      }),
    );
  });

  it('refuses to mutate a contract belonging to a published version', async () => {
    prisma.bmBusinessContract.findFirst.mockResolvedValue({
      id: 'c-1',
      tenantId: 'tenant-123',
      applicationVersionId: 'av-1',
      status: BmContractStatus.DRAFT,
    });
    prisma.applicationVersion.findFirst.mockResolvedValue({
      id: 'av-1',
      status: 'ACTIVE',
      version: '1.0.0',
      applicationId: 'app-1',
    });

    await expect(
      service.updateContract('c-1', { name: 'Updated contract' } as any, 'tenant-123'),
    ).rejects.toThrow(PlatformException);
    expect(prisma.bmBusinessContract.update).not.toHaveBeenCalled();
  });
});
