import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ErpAdapterController } from './erp-adapter.controller';
import { ErpAdapterService } from './erp-adapter.service';
import { ErpRegistryService } from '../erp-registry/erp-registry.service';
import { ErpCommandService } from './commands/erp-command.service';
import { ErpResourceRuntimeService } from './runtime/erp-resource-runtime.service';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';
import { DolibarrError } from './dolibarr/dolibarr.error';
import { ErpError } from './erp-error';

describe('ERP resource HTTP error contract (real controller/filter, test provider)', () => {
  let app: any;
  let failure: Error | undefined;
  beforeAll(async () => {
    const read = async () => { if (failure) throw failure; return [{ id: '42' }]; };
    const module = await Test.createTestingModule({
      controllers: [ErpAdapterController],
      providers: [
        { provide: ErpAdapterService, useValue: { resolveAdapterForTenant: async () => ({ getClients: read, getProducts: read, getOrders: read, getInvoices: read, getStocks: read }) } },
        { provide: ErpRegistryService, useValue: {} },
        { provide: ErpCommandService, useValue: {} },
        { provide: ErpResourceRuntimeService, useValue: { guardAdapter: (adapter: unknown) => adapter } },
      ],
    }).compile();
    app = module.createNestApplication();
    app.use((req: any, _res: any, next: any) => { req.iamAuth = { tenantId: 'tenant-a', permissions: ['erp:read', 'erp:write'] }; req.traceId = 'erp-test-trace'; next(); });
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });
  afterAll(async () => { await app?.close(); });
  for (const resource of ['clients', 'products', 'orders', 'invoices', 'stocks']) {
    describe(resource, () => {
      it.each([
        ['unconfigured', () => ErpError.notConfigured(), 503, 'ERP_INSTANCE_NOT_CONFIGURED'],
        ['unreachable', () => DolibarrError.CONNECTION_ERROR(), 503, 'INTEGRATION_PROVIDER_UNAVAILABLE'],
        ['ERP auth', () => DolibarrError.AUTH_ERROR('secret-provider-payload'), 502, 'INTEGRATION_AUTH_FAILED'],
        ['ERP permission', () => DolibarrError.FORBIDDEN('secret-provider-payload'), 502, 'ERP_PERMISSION_DENIED'],
        ['timeout', () => DolibarrError.TIMEOUT(), 504, 'INTEGRATION_TIMEOUT'],
        ['rate limit', () => DolibarrError.RATE_LIMIT(), 429, 'INTEGRATION_RATE_LIMITED'],
      ])('%s preserves a safe structured failure', async (_name, makeError, status, code) => {
        failure = (makeError as () => Error)();
        const response = await request(app.getHttpServer()).get('/api/erp/' + resource);
        expect(response.status).toBe(status);
        expect(response.body).toMatchObject({ success: false, code, traceId: 'erp-test-trace', connector: 'dolibarr' });
        expect(response.body.timestamp).toBeDefined();
        expect(JSON.stringify(response.body)).not.toContain('secret-provider-payload');
      });
      it('returns actual provider data on success', async () => {
        failure = undefined;
        const response = await request(app.getHttpServer()).get('/api/erp/' + resource);
        expect(response.status).toBe(200);
        expect(response.body).toEqual([{ id: '42' }]);
      });
    });
  }
});
