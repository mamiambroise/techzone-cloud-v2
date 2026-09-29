import { jest } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { PlatformException } from '../../../common/errors/platform.exception';
import { BmContractStatus } from '../../../generated/prisma/enums';

function createMockPrisma() {
  return {
    applicationVersion: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    bmBusinessContract: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
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
      prisma.applicationVersion.findFirst.mockResolvedValue({ id: 'av-1' });
      prisma.applicationVersion.findUnique.mockResolvedValue({ applicationId: 'app-1' });
      prisma.bmBusinessContract.findFirst.mockResolvedValue(null);
      prisma.bmBusinessContract.create.mockResolvedValue({ id: 'c-1', code: 'contract1', name: 'Contract 1' });
      prisma.bmContractVersion.create.mockResolvedValue({ id: 'cv-1', versionNumber: '1.0.0' });

      const result = await service.createContract(
        'av-1',
        { code: 'CONTRACT1', name: 'Contract 1', version: '1.0.0' } as any,
        'tenant-123',
      );

      expect(prisma.applicationVersion.findUnique).toHaveBeenCalledWith({
        where: { id: 'av-1' },
        include: { application: true },
      });
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
      prisma.applicationVersion.findFirst.mockResolvedValue({ id: 'av-1' });
      prisma.applicationVersion.findUnique.mockResolvedValue({ applicationId: 'app-1' });
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
      prisma.applicationVersion.findUnique.mockResolvedValue(null);

      await expect(
        service.createContract('av-1', { code: 'CONTRACT1', name: 'Contract 1' } as any, 'tenant-123'),
      ).rejects.toThrow(PlatformException);
    });
  });
});
