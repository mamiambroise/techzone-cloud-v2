import { Test, TestingModule } from '@nestjs/testing';
import { ErpAdapterService } from './erp-adapter.service';
import { MockAdapter } from './mock/mock.adapter';
import { DolibarrAdapter } from './dolibarr/dolibarr.adapter';

describe('ErpAdapterService', () => {
  let service: ErpAdapterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ErpAdapterService, MockAdapter, DolibarrAdapter],
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
      service.configureDolibarr({ baseUrl: 'http://localhost/dolibarr', entity: 1 }),
    ).not.toThrow();
  });
});
