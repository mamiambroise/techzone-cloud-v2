import { Test, TestingModule } from '@nestjs/testing';
import { ERPAdapterDataProvider } from './erp-adapter.provider';
import { ErpAdapterService } from '../../erp-adapter/erp-adapter.service';
import { IErpAdapter } from '../../erp-adapter/interfaces/erp-adapter.interface';
import { ErpError } from '../../erp-adapter/erp-error';
import { RuntimeContext } from '../../data-runtime/interfaces';

describe('ERPAdapterDataProvider', () => {
  let provider: ERPAdapterDataProvider;
  let erpAdapterService: { resolveAdapterForTenant: jest.Mock; getAdapter: jest.Mock };
  let mockAdapter: jest.Mocked<IErpAdapter>;

  beforeEach(async () => {
    mockAdapter = {
      getClients: jest.fn(),
      getClientById: jest.fn(),
      createClient: jest.fn(),
      updateClient: jest.fn(),
      deleteClient: jest.fn(),
      getProducts: jest.fn(),
      getProductById: jest.fn(),
      createProduct: jest.fn(),
      updateProduct: jest.fn(),
      deleteProduct: jest.fn(),
      getOrders: jest.fn(),
      getOrderById: jest.fn(),
      createOrder: jest.fn(),
      updateOrder: jest.fn(),
      deleteOrder: jest.fn(),
      getStock: jest.fn(),
      updateStock: jest.fn(),
      getStocks: jest.fn(),
      getSuppliers: jest.fn(),
      getSupplierById: jest.fn(),
      createSupplier: jest.fn(),
      updateSupplier: jest.fn(),
      deleteSupplier: jest.fn(),
      getQuotes: jest.fn(),
      getQuoteById: jest.fn(),
      createQuote: jest.fn(),
      updateQuote: jest.fn(),
      deleteQuote: jest.fn(),
      getInvoices: jest.fn(),
      getInvoiceById: jest.fn(),
      createInvoice: jest.fn(),
      updateInvoice: jest.fn(),
      deleteInvoice: jest.fn(),
      getPayments: jest.fn(),
      getPaymentById: jest.fn(),
      createPayment: jest.fn(),
      getWarehouses: jest.fn(),
      getWarehouseById: jest.fn(),
      createWarehouse: jest.fn(),
      updateWarehouse: jest.fn(),
      deleteWarehouse: jest.fn(),
      getShipments: jest.fn(),
      getShipmentById: jest.fn(),
      createShipment: jest.fn(),
      updateShipment: jest.fn(),
      getDocuments: jest.fn(),
      getDocumentById: jest.fn(),
      createDocument: jest.fn(),
      deleteDocument: jest.fn(),
      getProductVariants: jest.fn(),
      getProductVariantsByProduct: jest.fn(),
      createProductVariant: jest.fn(),
      updateProductVariant: jest.fn(),
      deleteProductVariant: jest.fn(),
      getServices: jest.fn(),
      getServiceById: jest.fn(),
      createService: jest.fn(),
      updateService: jest.fn(),
      deleteService: jest.fn(),
      getStockMovements: jest.fn(),
      createStockMovement: jest.fn(),
      getStockTransfers: jest.fn(),
      createStockTransfer: jest.fn(),
      updateStockTransfer: jest.fn(),
      getInventories: jest.fn(),
      getInventoryById: jest.fn(),
      createInventory: jest.fn(),
      updateInventory: jest.fn(),
      getStockAlerts: jest.fn(),
      createStockAlert: jest.fn(),
      getReturns: jest.fn(),
      getReturnById: jest.fn(),
      createReturn: jest.fn(),
      updateReturn: jest.fn(),
      getPromotions: jest.fn(),
      getPromotionById: jest.fn(),
      createPromotion: jest.fn(),
      updatePromotion: jest.fn(),
      deletePromotion: jest.fn(),
      getPurchaseOrders: jest.fn(),
      getPurchaseOrderById: jest.fn(),
      createPurchaseOrder: jest.fn(),
      updatePurchaseOrder: jest.fn(),
      getCashRegisters: jest.fn(),
      getCashRegisterById: jest.fn(),
      createCashRegister: jest.fn(),
      updateCashRegister: jest.fn(),
      getExpenses: jest.fn(),
      getExpenseById: jest.fn(),
      createExpense: jest.fn(),
      deleteExpense: jest.fn(),
      getReservations: jest.fn(),
      getReservationById: jest.fn(),
      createReservation: jest.fn(),
      updateReservation: jest.fn(),
      getAgenda: jest.fn(),
      createAgendaEvent: jest.fn(),
      updateAgendaEvent: jest.fn(),
      deleteAgendaEvent: jest.fn(),
      getProjects: jest.fn(),
      getProjectById: jest.fn(),
      createProject: jest.fn(),
      updateProject: jest.fn(),
      getStats: jest.fn(),
      getUsers: jest.fn(),
      getUserById: jest.fn(),
      getCurrentUser: jest.fn(),
      healthCheck: jest.fn(),
    };

    erpAdapterService = {
      resolveAdapterForTenant: jest.fn().mockResolvedValue(mockAdapter),
      getAdapter: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ERPAdapterDataProvider,
        { provide: ErpAdapterService, useValue: erpAdapterService },
      ],
    }).compile();

    provider = module.get<ERPAdapterDataProvider>(ERPAdapterDataProvider);
  });

  function createContext(overrides: Partial<RuntimeContext> = {}): RuntimeContext {
    return {
      tenantId: 'tenant-1',
      userId: 'user-1',
      requestId: 'req-1',
      traceId: 'trace-1',
      permissions: [],
      ...overrides,
    };
  }

  describe('F2-04: tenant-aware adapter resolution (no dead getAll fallback)', () => {
    it('devrait appeler resolveAdapterForTenant avec le tenantId du contexte', async () => {
      const ctx = createContext({ tenantId: 'tenant-abc' });
      await provider.get('Product', 'prod-1', ctx);

      expect(erpAdapterService.resolveAdapterForTenant).toHaveBeenCalledWith('tenant-abc');
      expect(erpAdapterService.getAdapter).not.toHaveBeenCalled();
    });

    it('ne devrait pas appeler erpRegistryService.getAll (dead fallback)', async () => {
      const ctx = createContext({ tenantId: 'tenant-def' });
      await provider.get('Product', 'prod-1', ctx);

      expect(erpAdapterService.resolveAdapterForTenant).toHaveBeenCalledTimes(1);
      expect(erpAdapterService.resolveAdapterForTenant).toHaveBeenCalledWith('tenant-def');
    });

    it('devrait propager l erreur de registry si aucun ERP actif', async () => {
      const ctx = createContext({ tenantId: 'tenant-no-erp' });
      erpAdapterService.resolveAdapterForTenant.mockRejectedValue(
        new ErpError('ERP_INSTANCE_NOT_CONFIGURED', 503, 'ERP_INSTANCE_NOT_CONFIGURED'),
      );

      await expect(provider.get('Product', 'prod-1', ctx)).rejects.toThrow(ErpError);
      expect(erpAdapterService.resolveAdapterForTenant).toHaveBeenCalledWith('tenant-no-erp');
    });
  });

  describe('F2-05: tenantId validation (TENANT_REQUIRED)', () => {
    it('devrait lever une erreur si tenantId est absent', async () => {
      const ctx = { ...createContext(), tenantId: undefined as any };

      await expect(provider.get('Product', 'prod-1', ctx)).rejects.toThrow(ErpError);
    });

    it('devrait lever une erreur si tenantId est vide', async () => {
      const ctx = createContext({ tenantId: '' });

      await expect(provider.list('Product', ctx)).rejects.toThrow(ErpError);
    });
  });

  describe('get / list / create / update / remove operations', () => {
    it('devrait utiliser l adapter resolu pour get Product', async () => {
      const ctx = createContext();
      mockAdapter.getProductById.mockResolvedValue({ id: 'prod-1', ref: 'REF', label: 'Test', price: 100, stock: 50 });

      const result = await provider.get('Product', 'prod-1', ctx);

      expect(mockAdapter.getProductById).toHaveBeenCalledWith('prod-1');
      expect(result).toEqual({ id: 'prod-1', ref: 'REF', label: 'Test', price: 100, stock: 50 });
    });

    it('devrait utiliser l adapter resolu pour list Client', async () => {
      const ctx = createContext();
      mockAdapter.getClients.mockResolvedValue([{ id: 'c1', nom: 'Test Client', email: 'test@test.com' }]);

      const result = await provider.list('Client', ctx, { page: 1, pageSize: 20 });

      expect(mockAdapter.getClients).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
    });

    it('devrait utiliser l adapter resolu pour create Order', async () => {
      const ctx = createContext();
      mockAdapter.createOrder.mockResolvedValue({ id: 'ord-1', ref: 'CMD-001', clientId: 'c1', lines: [], total: 0, status: 'DRAFT', createdAt: new Date().toISOString() });

      const result = await provider.create('Order', { clientId: 'c1', lines: [] }, ctx);

      expect(mockAdapter.createOrder).toHaveBeenCalledWith({ clientId: 'c1', lines: [] });
      expect(result.id).toBe('ord-1');
    });

    it('devrait utiliser l adapter resolu pour update Product', async () => {
      const ctx = createContext();
      mockAdapter.updateProduct.mockResolvedValue({ id: 'prod-1', ref: 'REF', label: 'Updated', price: 200, stock: 30 });

      const result = await provider.update('Product', 'prod-1', { label: 'Updated' }, ctx);

      expect(mockAdapter.updateProduct).toHaveBeenCalledWith('prod-1', { label: 'Updated' });
      expect(result.label).toBe('Updated');
    });

    it('devrait utiliser l adapter resolu pour remove Order', async () => {
      const ctx = createContext();
      mockAdapter.deleteOrder.mockResolvedValue(undefined);

      await provider.remove('Order', 'ord-1', ctx);

      expect(mockAdapter.deleteOrder).toHaveBeenCalledWith('ord-1');
    });
  });

  describe('metadata', () => {
    it('devrait retourner le descriptor pour Product', async () => {
      const ctx = createContext();
      const descriptor = await provider.metadata('Product', ctx);

      expect(descriptor.resourceCode).toBe('Product');
      expect(descriptor.fields).toContainEqual(
        expect.objectContaining({ code: 'id', type: 'STRING' }),
      );
    });

    it('devrait lever une exception pour une ressource inconnue', async () => {
      const ctx = createContext();
      await expect(provider.metadata('Unknown', ctx)).rejects.toThrow();
    });
  });

  describe('count', () => {
    it('devrait retourner le total de la liste', async () => {
      const ctx = createContext();
      const products = Object.assign(
        [
          { id: '1', ref: 'R1', label: 'P1', price: 10, stock: 5 },
          { id: '2', ref: 'R2', label: 'P2', price: 20, stock: 0 },
        ],
        { total: 2 },
      );
      mockAdapter.getProducts.mockResolvedValue(products);

      const result = await provider.count('Product', ctx);
      expect(result).toBe(2);
    });
  });

  describe('exists', () => {
    it('devrait retourner true si get reussit', async () => {
      const ctx = createContext();
      mockAdapter.getProductById.mockResolvedValue({ id: '1', ref: 'R1', label: 'P1', price: 10, stock: 5 });

      const result = await provider.exists('Product', '1', ctx);
      expect(result).toBe(true);
    });

    it('devrait retourner false si get echoue', async () => {
      const ctx = createContext();
      mockAdapter.getProductById.mockRejectedValue(new Error('Not found'));

      const result = await provider.exists('Product', '1', ctx);
      expect(result).toBe(false);
    });
  });
});
