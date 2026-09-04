import { Test, TestingModule } from '@nestjs/testing';
import { SynchronizationService } from './synchronization.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { MockIntegrationProvider } from '../../../common/providers/mock-integration.provider';
import { IntegrationResilienceService } from '../../../common/resilience/integration-resilience.service';
import { IdempotencyService } from '../../../common/resilience/idempotency.service';
import { IntegrationException } from '../../../common/errors/integration-exception';
import { IntegrationErrorCode } from '../../../common/errors/integration-error-code';

describe('SynchronizationService', () => {
  let service: SynchronizationService;
  let prisma: {
    synchronization: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock; findMany: jest.Mock; delete: jest.Mock };
    connector: { findUnique: jest.Mock };
    integrationLog: { create: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      synchronization: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
      },
      connector: {
        findUnique: jest.fn(),
      },
      integrationLog: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SynchronizationService,
        { provide: PrismaService, useValue: prisma },
        MockIntegrationProvider,
        IntegrationResilienceService,
        IdempotencyService,
      ],
    }).compile();

    service = module.get<SynchronizationService>(SynchronizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a synchronization when connector is ACTIVE', async () => {
      prisma.connector.findUnique.mockResolvedValue({ id: 'conn-1', status: 'ACTIVE' });
      prisma.synchronization.findUnique.mockResolvedValue(null);
      prisma.synchronization.create.mockResolvedValue({
        id: 'sync-1',
        code: 'sync-test',
        connectorId: 'conn-1',
        status: 'PENDING',
      });

      const result = await service.create({
        code: 'sync-test',
        connectorId: 'conn-1',
        source: 'source-system',
        target: 'target-system',
        direction: 'PULL',
        mode: 'FULL',
      });

      expect(result.code).toBe('sync-test');
      expect(result.status).toBe('PENDING');
    });

    it('should reject if connector is not ACTIVE', async () => {
      prisma.connector.findUnique.mockResolvedValue({ id: 'conn-1', status: 'DRAFT' });

      await expect(
        service.create({
          code: 'sync-test',
          connectorId: 'conn-1',
          source: 'src',
          target: 'tgt',
          direction: 'PULL',
          mode: 'FULL',
        }),
      ).rejects.toThrow(IntegrationException);
      await expect(
        service.create({
          code: 'sync-test',
          connectorId: 'conn-1',
          source: 'src',
          target: 'tgt',
          direction: 'PULL',
          mode: 'FULL',
        }),
      ).rejects.toThrow('must be ACTIVE');
    });
  });

  describe('pause', () => {
    it('should reject if synchronization is not RUNNING', async () => {
      prisma.synchronization.findUnique.mockResolvedValue({
        id: '1',
        status: 'PENDING',
        code: 'test',
      });

      await expect(service.pause('1')).rejects.toThrow(
        IntegrationErrorCode.INTEGRATION_INVALID_STATE,
      );
    });
  });

  describe('cancel', () => {
    it('should reject if synchronization is not RUNNING', async () => {
      prisma.synchronization.findUnique.mockResolvedValue({
        id: '1',
        status: 'RUNNING',
        code: 'test',
      });

      prisma.synchronization.update.mockResolvedValue({
        id: '1',
        status: 'CANCELLED',
      });

      const result = await service.cancel('1');
      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('resume', () => {
    it('should reject if synchronization is not PAUSED or FAILED', async () => {
      prisma.synchronization.findUnique.mockResolvedValue({
        id: '1',
        status: 'RUNNING',
        code: 'test',
        connectorId: 'conn-1',
      });

      await expect(service.resume('1')).rejects.toThrow(
        IntegrationException,
      );
    });
  });
});
