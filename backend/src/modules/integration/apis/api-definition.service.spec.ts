import { Test, TestingModule } from '@nestjs/testing';
import { ApiDefinitionService } from './api-definition.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { IntegrationException } from '../../../common/errors/integration-exception';

describe('ApiDefinitionService (API-CDC-03)', () => {
  let service: ApiDefinitionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiDefinitionService, PrismaService],
    }).compile();

    service = module.get<ApiDefinitionService>(ApiDefinitionService);
  });

  it('should create a new API definition in DRAFT status', async () => {
    const api = await service.create({
      apiCode: 'order-service-api',
      version: '1.0.0',
      basePath: '/v1/orders',
      operations: [{ method: 'GET', path: '/' }],
    });

    expect(api).toBeDefined();
    expect(api.apiCode).toBe('order-service-api');
    expect(api.version).toBe('1.0.0');
    expect(api.status).toBe('DRAFT');
  });

  it('should validate and advance API status to READY', async () => {
    const created = await service.create({
      apiCode: 'invoice-api',
      version: '1.0.0',
      basePath: '/v1/invoices',
      operations: [{ method: 'POST', path: '/create' }],
    });

    const validated = await service.validate(created.id);
    expect(validated.status).toBe('READY');
  });

  it('should publish a READY API to ACTIVE', async () => {
    const created = await service.create({
      apiCode: 'catalog-api',
      version: '1.0.0',
      basePath: '/v1/catalog',
      operations: [{ method: 'GET', path: '/items' }],
    });

    await service.validate(created.id);
    const published = await service.publish(created.id);
    expect(published.status).toBe('ACTIVE');
    expect(published.publishedAt).toBeDefined();
  });

  it('should deprecate and retire an ACTIVE API', async () => {
    const created = await service.create({
      apiCode: 'legacy-api',
      version: '1.0.0',
      basePath: '/v1/legacy',
      operations: [{ method: 'GET', path: '/' }],
    });

    await service.validate(created.id);
    await service.publish(created.id);

    const deprecated = await service.deprecate(created.id);
    expect(deprecated.status).toBe('DEPRECATED');

    const retired = await service.retire(created.id);
    expect(retired.status).toBe('RETIRED');
  });

  it('should prevent breaking change without major version bump', async () => {
    const created = await service.create({
      apiCode: 'crm-sync-api',
      version: '1.2.0',
      basePath: '/v1/crm',
      operations: [{ method: 'GET', path: '/' }],
    });

    await expect(
      service.createNewVersion(created.id, {
        newVersion: '1.3.0',
        hasBreakingChanges: true,
      }),
    ).rejects.toThrow(IntegrationException);
  });
});
