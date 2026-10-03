import { Test, TestingModule } from '@nestjs/testing';
import { ErpAdapterService } from './erp-adapter.service';
import { MockAdapter } from './mock/mock.adapter';
import { DolibarrAdapter } from './dolibarr/dolibarr.adapter';
import { ErpRegistryService } from '../erp-registry/erp-registry.service';
import { ErpError } from './erp-error';

describe('ErpAdapterService', () => {
  let service: ErpAdapterService;
  let erpRegistryService: { getActiveForTenant: jest.Mock };

  beforeEach(async () => {
    erpRegistryService = {
      getActiveForTenant: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ErpAdapterService,
        MockAdapter,
        DolibarrAdapter,
        { provide: ErpRegistryService, useValue: erpRegistryService },
      ],
    }).compile();

    service = module.get<ErpAdapterService>(ErpAdapterService);
  });

  it('devrait etre defini', () => {
    expect(service).toBeDefined();
  });

  it('devrait avoir l\'adaptateur MOCK et DOLIBARR disponibles', () => {
    const adapters = service.getAvailableAdapters();
    expect(adapters).toContain('MOCK');
    expect(adapters).toContain('DOLIBARR');
  });

  it('devrait retourner l\'adaptateur MOCK', () => {
    const adapter = service.getAdapter('MOCK');
    expect(adapter).toBeInstanceOf(MockAdapter);
  });

  it('devrait retourner l\'adaptateur DOLIBARR', () => {
    const adapter = service.getAdapter('DOLIBARR');
    expect(adapter).toBeInstanceOf(DolibarrAdapter);
  });

  it('devrait lever une erreur pour un adaptateur inexistant', () => {
    expect(() => service.getAdapter('INEXISTANT')).toThrow();
  });

  it('devrait accepter les entrees en minuscules', () => {
    const adapter = service.getAdapter('mock');
    expect(adapter).toBeInstanceOf(MockAdapter);
  });

  it('devrait pouvoir reconfigurer Dolibarr', () => {
    expect(() =>
      service.configureDolibarr({ baseUrl: 'https://erp.example.com', entity: 1 }),
    ).not.toThrow();
  });

  describe('resolveAdapterForTenant', () => {
    it('devrait resoudre un adaptateur Dolibarr depuis le registry', async () => {
      const mockRegistry = {
        tenantId: 'tenant-1',
        code: 'DOLI-01',
        type: 'DOLIBARR',
        url: 'https://dolibarr.example.com',
        status: 'ACTIVE',
        capabilities: { apiKey: 'secret-key', entity: 1 },
      };
      erpRegistryService.getActiveForTenant.mockResolvedValue(mockRegistry);

      const adapter = await service.resolveAdapterForTenant('tenant-1');
      expect(adapter).toBeInstanceOf(DolibarrAdapter);
      expect(erpRegistryService.getActiveForTenant).toHaveBeenCalledWith({ tenantId: 'tenant-1' });
    });

    it('devrait resoudre un adaptateur Mock pour le type MOCK', async () => {
      const mockRegistry = {
        tenantId: 'tenant-mock',
        code: 'MOCK-01',
        type: 'MOCK',
        url: '',
        status: 'ACTIVE',
        capabilities: {},
      };
      erpRegistryService.getActiveForTenant.mockResolvedValue(mockRegistry);

      const adapter = await service.resolveAdapterForTenant('tenant-mock');
      expect(adapter).toBeInstanceOf(MockAdapter);
    });

    it('devrait lever une erreur pour un type d ERP non supporte', async () => {
      const mockRegistry = {
        tenantId: 'tenant-x',
        code: 'UNKNOWN-01',
        type: 'UNKNOWN',
        url: '',
        status: 'ACTIVE',
        capabilities: {},
      };
      erpRegistryService.getActiveForTenant.mockResolvedValue(mockRegistry);

      await expect(service.resolveAdapterForTenant('tenant-x')).rejects.toThrow(ErpError);
    });

    it('devrait revalider la configuration du tenant a chaque resolution', async () => {
      const mockRegistry = {
        tenantId: 'tenant-cache',
        code: 'DOLI-CACHE',
        type: 'DOLIBARR',
        url: 'https://dolibarr.cache.com',
        status: 'ACTIVE',
        capabilities: { apiKey: 'key-cache', entity: 2 },
      };
      erpRegistryService.getActiveForTenant.mockResolvedValue(mockRegistry);

      const adapter1 = await service.resolveAdapterForTenant('tenant-cache');
      const adapter2 = await service.resolveAdapterForTenant('tenant-cache');

      expect(adapter1).not.toBe(adapter2);
      expect(erpRegistryService.getActiveForTenant).toHaveBeenCalledTimes(2);
    });

    it('devrait isoler les tenants avec des instances distinctes', async () => {
      const mockRegistryA = {
        tenantId: 'tenant-a',
        code: 'DOLI-A',
        type: 'DOLIBARR',
        url: 'https://a.dolibarr.com',
        status: 'ACTIVE',
        capabilities: { apiKey: 'key-a' },
      };
      const mockRegistryB = {
        tenantId: 'tenant-b',
        code: 'DOLI-B',
        type: 'DOLIBARR',
        url: 'https://b.dolibarr.com',
        status: 'ACTIVE',
        capabilities: { apiKey: 'key-b' },
      };
      erpRegistryService.getActiveForTenant.mockResolvedValueOnce(mockRegistryA);
      erpRegistryService.getActiveForTenant.mockResolvedValueOnce(mockRegistryB);

      const adapterA = await service.resolveAdapterForTenant('tenant-a');
      const adapterB = await service.resolveAdapterForTenant('tenant-b');

      expect(adapterA).not.toBe(adapterB);
    });
  });
});
