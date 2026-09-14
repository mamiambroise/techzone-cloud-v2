import { Test, TestingModule } from '@nestjs/testing';
import { ApiManagerService } from './api-manager.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { IdempotencyService } from '../../../common/resilience/idempotency.service';
import { IntegrationException } from '../../../common/errors/integration-exception';
import { IntegrationErrorCode } from '../../../common/errors/integration-error-code';

describe('ApiManagerService', () => {
  let service: ApiManagerService;
  let prisma: { apiDefinition: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock; findMany: jest.Mock; count: jest.Mock; delete: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      apiDefinition: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiManagerService,
        { provide: PrismaService, useValue: prisma },
        IdempotencyService,
      ],
    }).compile();

    service = module.get<ApiManagerService>(ApiManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an API definition in DRAFT status', async () => {
      prisma.apiDefinition.findUnique.mockResolvedValue(null);
      prisma.apiDefinition.create.mockResolvedValue({
        id: 'test-id',
        apiCode: 'test-api',
        version: '1.0.0',
        basePath: '/test',
        status: 'DRAFT',
      });

      const result = await service.create({
        apiCode: 'test-api',
        version: '1.0.0',
        basePath: '/test',
        operations: {},
        authentication: 'BEARER',
      });

      expect(result.status).toBe('DRAFT');
      expect(prisma.apiDefinition.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ apiCode: 'test-api', version: '1.0.0' }),
        }),
      );
    });

    it('should throw when API code + version already exists', async () => {
      prisma.apiDefinition.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({
          apiCode: 'test-api',
          version: '1.0.0',
          basePath: '/test',
          operations: {},
          authentication: 'BEARER',
        }),
      ).rejects.toThrow(IntegrationException);
      await expect(
        service.create({
          apiCode: 'test-api',
          version: '1.0.0',
          basePath: '/test',
          operations: {},
          authentication: 'BEARER',
        }),
      ).rejects.toThrow('already exists');
    });
  });

  describe('transition', () => {
    it('should transition from DRAFT to VALIDATING', async () => {
      const mockApi = { id: '1', apiCode: 'api', version: '1.0', status: 'DRAFT', publishedAt: null };
      prisma.apiDefinition.findUnique.mockResolvedValue(mockApi);
      prisma.apiDefinition.update.mockResolvedValue({ ...mockApi, status: 'VALIDATING' });

      const result = await service.transition('1', 'VALIDATING');

      expect(result.status).toBe('VALIDATING');
    });

    it('should throw on invalid transition', async () => {
      const mockApi = { id: '1', apiCode: 'api', version: '1.0', status: 'DRAFT', publishedAt: null };
      prisma.apiDefinition.findUnique.mockResolvedValue(mockApi);

      await expect(service.transition('1', 'ACTIVE')).rejects.toThrow(IntegrationException);
      await expect(service.transition('1', 'ACTIVE')).rejects.toThrow(
        IntegrationErrorCode.INTEGRATION_INVALID_STATE,
      );
    });

    it('should set publishedAt when transitioning to ACTIVE', async () => {
      const mockApi = { id: '1', apiCode: 'api', version: '1.0', status: 'READY', publishedAt: null };
      prisma.apiDefinition.findUnique.mockResolvedValue(mockApi);
      prisma.apiDefinition.update.mockResolvedValue({ ...mockApi, status: 'ACTIVE', publishedAt: new Date() });

      await service.transition('1', 'ACTIVE');

      expect(prisma.apiDefinition.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ publishedAt: expect.any(Date) }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      prisma.apiDefinition.findMany.mockResolvedValue([{ id: '1' }]);
      prisma.apiDefinition.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('remove', () => {
    it('should throw if not RETIRED', async () => {
      prisma.apiDefinition.findUnique.mockResolvedValue({ id: '1', status: 'ACTIVE' });

      await expect(service.remove('1')).rejects.toThrow(IntegrationException);
    });

    it('should delete when RETIRED', async () => {
      prisma.apiDefinition.findUnique.mockResolvedValue({ id: '1', status: 'RETIRED' });
      prisma.apiDefinition.delete.mockResolvedValue({ id: '1' });

      await service.remove('1');

      expect(prisma.apiDefinition.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });
});
