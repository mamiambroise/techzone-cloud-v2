import { jest } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';
import { ContractsService } from './contract.service';
import { PlatformException } from '../../../common/errors/platform.exception';
import { ContractStatus, ContractHistoryAction } from '../../../generated/prisma/enums';

function createMockPrisma() {
  const transactionClient = {
    contract: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    contractHistory: {
      create: jest.fn(),
    },
  };
  return {
    contract: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    contractHistory: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (callback: any) => callback(transactionClient)),
    _transactionClient: transactionClient,
  };
}

describe('ContractsService (TENANT-ISOLATION)', () => {
  let service: ContractsService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let tx: any;

  beforeEach(() => {
    prisma = createMockPrisma();
    tx = prisma._transactionClient;
    service = new ContractsService(prisma as any);
  });

  it('should find all contracts filtered by tenantId', async () => {
    await service.findAll('tenant-123');
    expect(prisma.contract.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-123' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('should find all contracts with undefined tenantId when null', async () => {
    await service.findAll(null);
    expect(prisma.contract.findMany).toHaveBeenCalledWith({
      where: { tenantId: undefined },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('should create contract with tenantId', async () => {
    prisma.contract.findFirst.mockResolvedValue(null);
    const mockContract = { id: 'c-1', contractCode: 'CON-01', contractVersion: '1.0.0', tenantId: 'tenant-123', status: ContractStatus.DRAFT };
    tx.contract.create.mockResolvedValue(mockContract);
    tx.contractHistory.create.mockResolvedValue({});

    const dto = {
      contractCode: 'CON-01',
      contractVersion: '1.0.0',
      ownerTeam: 'team-a',
      schema: {},
      compatibilityPolicy: {},
    } as any;

    const result = await service.create(dto, 'tenant-123');

    expect(tx.contract.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        contractCode: 'CON-01',
        contractVersion: '1.0.0',
        ownerTeam: 'team-a',
        tenantId: 'tenant-123',
        status: ContractStatus.DRAFT,
      }),
    });
    expect(tx.contractHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-123',
          action: ContractHistoryAction.CREATED,
        }),
      }),
    );
    expect(result.tenantId).toBe('tenant-123');
  });

  it('should reject duplicate contract in same tenant', async () => {
    prisma.contract.findFirst.mockResolvedValue({ id: 'existing' });

    const dto = {
      contractCode: 'CON-01',
      contractVersion: '1.0.0',
      ownerTeam: 'team-a',
      schema: {},
      compatibilityPolicy: {},
    } as any;

    await expect(service.create(dto, 'tenant-123')).rejects.toThrow(PlatformException);
    expect(tx.contract.create).not.toHaveBeenCalled();
  });

  it('should find one contract with tenantId filter', async () => {
    const mockContract = {
      id: 'c-1',
      contractCode: 'CON-01',
      tenantId: 'tenant-123',
      providers: [],
      consumers: [],
      history: [],
    };
    prisma.contract.findFirst.mockResolvedValue(mockContract);

    const result = await service.findOne('c-1', 'tenant-123');
    expect(result).toBe(mockContract);
    expect(prisma.contract.findFirst).toHaveBeenCalledWith({
      where: { id: 'c-1', tenantId: 'tenant-123' },
      include: { providers: true, consumers: true, history: { orderBy: { createdAt: 'desc' } } },
    });
  });

  it('should throw CONTRACT_NOT_FOUND when contract does not belong to tenant', async () => {
    prisma.contract.findFirst.mockResolvedValue(null);

    await expect(service.findOne('c-1', 'tenant-123')).rejects.toMatchObject({
      status: HttpStatus.NOT_FOUND,
    });
  });

  it('should validate contract belonging to tenant', async () => {
    prisma.contract.findFirst.mockResolvedValue({
      id: 'c-1',
      status: ContractStatus.DRAFT,
      schema: { type: 'object' },
      compatibilityPolicy: { mode: 'major' },
      tenantId: 'tenant-123',
    });
    tx.contract.update.mockResolvedValue({ id: 'c-1', status: ContractStatus.VALIDATING });
    tx.contractHistory.create.mockResolvedValue({});

    const result = await service.validate('c-1', 'tenant-123');
    expect(result.status).toBe(ContractStatus.VALIDATING);
    expect(tx.contractHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-123',
          action: ContractHistoryAction.VALIDATED,
        }),
      }),
    );
  });

  it('should lock contract belonging to tenant', async () => {
    prisma.contract.findFirst.mockResolvedValue({
      id: 'c-1',
      status: ContractStatus.VALIDATING,
      tenantId: 'tenant-123',
    });
    tx.contract.update.mockResolvedValue({ id: 'c-1', status: ContractStatus.LOCKED });
    tx.contractHistory.create.mockResolvedValue({});

    const result = await service.lock('c-1', 'tenant-123');
    expect(result.status).toBe(ContractStatus.LOCKED);
  });

  it('should get compatibility only for contract in tenant', async () => {
    const mockContract = {
      id: 'c-1',
      contractCode: 'CON-01',
      contractVersion: '1.0.0',
      status: ContractStatus.LOCKED,
      consumers: [],
      providers: [],
      tenantId: 'tenant-123',
    };
    prisma.contract.findFirst.mockResolvedValueOnce(mockContract);

    const result = await service.getCompatibility('c-1', 'tenant-123');
    expect(result.contractId).toBe('c-1');
  });

  it('should get history for contract in tenant', async () => {
    prisma.contract.findFirst.mockResolvedValue({ id: 'c-1', tenantId: 'tenant-123' });
    prisma.contractHistory.findMany.mockResolvedValue([]);

    const result = await service.getHistory('c-1', 'tenant-123');
    expect(result).toEqual([]);
       expect(prisma.contractHistory.findMany).toHaveBeenCalledWith({
      where: { contractId: 'c-1', tenantId: 'tenant-123' },
      orderBy: { createdAt: 'desc' },
    });
  });
});
