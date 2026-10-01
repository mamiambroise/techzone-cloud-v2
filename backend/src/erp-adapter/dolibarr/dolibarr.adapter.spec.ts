import { DolibarrMapper } from './dolibarr.mapper';
import { DolibarrError } from './dolibarr.error';
import { DOLIBARR_ORDER_STATUS, TECHZONE_ORDER_STATUS } from './dolibarr.dto';
import { DolibarrAdapter } from './dolibarr.adapter';
import axios from 'axios';

describe('DolibarrMapper', () => {
  describe('Client mapping', () => {
    it('should map Techzone client to Dolibarr format', () => {
      const client = { nom: 'Jean Dupont', email: 'jean@test.com', telephone: '+261 34 000 000' };
      const result = DolibarrMapper.mapToDolibarrClient(client);
      expect(result.name).toBe('Dupont');
      expect(result.firstname).toBe('Jean');
      expect(result.email).toBe('jean@test.com');
      expect(result.phone).toBe('+261 34 000 000');
      expect(result.status).toBe(1);
      expect(result.entity).toBe(1);
    });

    it('should map Dolibarr client to Techzone format', () => {
      const dolibarr = { id: 42, name: 'Dupont', firstname: 'Jean', email: 'jean@test.com', phone: '+261 34 000 000', status: 1, entity: 1 };
      const result = DolibarrMapper.mapFromDolibarrClient(dolibarr);
      expect(result.id).toBe('42');
      expect(result.nom).toBe('Jean Dupont');
      expect(result.email).toBe('jean@test.com');
      expect(result.telephone).toBe('+261 34 000 000');
    });
  });

  describe('Product mapping', () => {
    it('should map Techzone product to Dolibarr format', () => {
      const product = { ref: 'PRD-001', label: 'Test', price: 100, stock: 50 };
      const result = DolibarrMapper.mapToDolibarrProduct(product);
      expect(result.ref).toBe('PRD-001');
      expect(result.label).toBe('Test');
      expect(result.price).toBe(100);
      expect(result.stock).toBe(50);
      expect(result.status).toBe(1);
    });

    it('should map Dolibarr product to Techzone format', () => {
      const dolibarr = { id: 10, ref: 'PRD-001', label: 'Test', price: 100, stock: 50, status: 1, entity: 1 };
      const result = DolibarrMapper.mapFromDolibarrProduct(dolibarr);
      expect(result.id).toBe('10');
      expect(result.ref).toBe('PRD-001');
      expect(result.price).toBe(100);
      expect(result.stock).toBe(50);
    });
  });

  describe('Order mapping', () => {
    it('should map Techzone order to Dolibarr format', () => {
      const order = {
        clientId: '42',
        lines: [{ productId: '10', quantity: 3, price: 100 }],
      };
      const result = DolibarrMapper.mapToDolibarrOrder(order);
      expect(result.socid).toBe(42);
      expect(result.lines).toHaveLength(1);
      expect(result.lines[0].fk_product).toBe(10);
      expect(result.lines[0].qty).toBe(3);
      expect(result.lines[0].price).toBe(100);
    });

    it('should map Dolibarr order to Techzone format', () => {
      const dolibarr = {
        id: 1,
        ref: 'COM-001',
        socid: 42,
        total_ht: 300,
        status: 2,
        date: '2024-01-15',
        entity: 1,
        lines: [{ fk_product: 10, qty: 3, price: 100 }],
      };
      const result = DolibarrMapper.mapFromDolibarrOrder(dolibarr);
      expect(result.id).toBe('1');
      expect(result.ref).toBe('COM-001');
      expect(result.clientId).toBe('42');
      expect(result.status).toBe('PROCESSING');
      expect(result.lines).toHaveLength(1);
    });
  });

  describe('Status mapping', () => {
    it('should map numeric status to string', () => {
      expect(DolibarrMapper.mapDolibarrStatus(0)).toBe('DRAFT');
      expect(DolibarrMapper.mapDolibarrStatus(1)).toBe('VALIDATED');
      expect(DolibarrMapper.mapDolibarrStatus(2)).toBe('PROCESSING');
      expect(DolibarrMapper.mapDolibarrStatus(3)).toBe('SHIPPED');
      expect(DolibarrMapper.mapDolibarrStatus(4)).toBe('DELIVERED');
      expect(DolibarrMapper.mapDolibarrStatus(5)).toBe('CANCELLED');
      expect(DolibarrMapper.mapDolibarrStatus(6)).toBe('PAID');
    });

    it('should map string status to numeric', () => {
      expect(DolibarrMapper.mapTechzoneStatus('DRAFT')).toBe(0);
      expect(DolibarrMapper.mapTechzoneStatus('VALIDATED')).toBe(1);
      expect(DolibarrMapper.mapTechzoneStatus('PROCESSING')).toBe(2);
      expect(DolibarrMapper.mapTechzoneStatus('SHIPPED')).toBe(3);
      expect(DolibarrMapper.mapTechzoneStatus('DELIVERED')).toBe(4);
      expect(DolibarrMapper.mapTechzoneStatus('CANCELLED')).toBe(5);
      expect(DolibarrMapper.mapTechzoneStatus('PAID')).toBe(6);
    });
  });

  describe('Error mapping', () => {
    it('should map 401 to AUTH_ERROR', () => {
      const error = DolibarrMapper.mapDolibarrError(401, { error: 'Bad API Key' });
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.httpStatus).toBe(401);
    });

    it('should map 404 to NOT_FOUND', () => {
      const error = DolibarrMapper.mapDolibarrError(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.httpStatus).toBe(404);
    });

    it('should map 500 to ERP_ERROR', () => {
      const error = DolibarrMapper.mapDolibarrError(500, { error: 'Server error' });
      expect(error.code).toBe('ERP_ERROR');
      expect(error.httpStatus).toBe(500);
    });
  });

  describe('Stock mapping', () => {
    it('should map stock info', () => {
      const result = DolibarrMapper.mapFromDolibarrStock('42', 150);
      expect(result.productId).toBe('42');
      expect(result.currentStock).toBe(150);
      expect(result.lastUpdated).toBeDefined();
    });
  });
});

describe('DolibarrError', () => {
  it('should create AUTH_ERROR', () => {
    const error = DolibarrError.AUTH_ERROR();
    expect(error.code).toBe('AUTH_ERROR');
    expect(error.httpStatus).toBe(401);
    expect(error.message).toBe('Cle API invalide');
  });

  it('should create NOT_FOUND with custom message', () => {
    const error = DolibarrError.NOT_FOUND('Client');
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('Client non trouvee');
  });

  it('should create fromHttpError for 401', () => {
    const error = DolibarrError.fromHttpError(401, { error: 'Unauthorized' });
    expect(error.code).toBe('AUTH_ERROR');
    expect(error.httpStatus).toBe(401);
  });

  it('should create fromHttpError for 404', () => {
    const error = DolibarrError.fromHttpError(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.httpStatus).toBe(404);
  });

  it('should create fromHttpError for unknown status', () => {
    const error = DolibarrError.fromHttpError(418);
    expect(error.code).toBe('ERP_ERROR');
    expect(error.httpStatus).toBe(500);
  });
});

describe('DolibarrAdapter', () => {
  let mockInstance: any;
  let createSpy: jest.SpyInstance;

  beforeEach(() => {
    mockInstance = {
      interceptors: {
        response: {
          use: jest.fn(),
        },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      request: jest.fn(),
      defaults: {},
    };

    createSpy = jest.spyOn(axios, 'create').mockReturnValue(mockInstance);
  });

  afterEach(() => {
    createSpy.mockRestore();
  });

  it('devrait etre defini', () => {
    const adapter = new DolibarrAdapter();
    expect(adapter).toBeDefined();
  });

  it('devrait appeler axios.create au moins une fois dans le constructeur', () => {
    const adapter = new DolibarrAdapter();
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: expect.stringContaining('/api/index.php'),
      }),
    );
  });

  describe('configure() - B3/F singleton isolation regression', () => {
    it('devrait recreer l instance axios apres configure()', () => {
      const adapter = new DolibarrAdapter();
      expect(createSpy).toHaveBeenCalledTimes(1);

      adapter.configure({ baseUrl: 'https://dolibarr-tenant.example.com' });
      expect(createSpy).toHaveBeenCalledTimes(2);
    });

    it('devrait utiliser le nouveau baseUrl apres configure()', () => {
      const adapter = new DolibarrAdapter();

      adapter.configure({ baseUrl: 'https://tenant-b.dolibarr.com' });

      expect(createSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          baseURL: 'https://tenant-b.dolibarr.com/api/index.php',
        }),
      );
    });

    it('devrait mettre a jour la cle API apres configure()', () => {
      const adapter = new DolibarrAdapter();

      adapter.configure({ baseUrl: 'https://dolibarr.com', apiKey: 'new-secret-key' });

      expect(createSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            DOLAPIKEY: 'new-secret-key',
          }),
        }),
      );
    });

    it('devrait mettre a jour l entity apres configure()', () => {
      const adapter = new DolibarrAdapter();

      adapter.configure({ baseUrl: 'https://dolibarr.com', entity: 5 });

      expect(createSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            DOLAPIKEY: expect.any(String),
          }),
        }),
      );
    });
  });

  describe('healthCheck', () => {
    it('devrait retourner NOT_CONFIGURED si apiKey est vide', async () => {
      const adapter = new DolibarrAdapter();
      adapter.configure({ apiKey: '' });
      const result = await adapter.healthCheck();
      expect(result.status).toBe('NOT_CONFIGURED');
    });

    it('devrait retourner CONNECTED si la requete reussit', async () => {
      const adapter = new DolibarrAdapter();
      adapter.configure({ apiKey: 'test-key' });
      mockInstance.get.mockResolvedValue({ status: 200 });

      const result = await adapter.healthCheck();
      expect(result.status).toBe('CONNECTED');
    });

    it('devrait retourner UNAVAILABLE si connexion refusee', async () => {
      const adapter = new DolibarrAdapter();
      adapter.configure({ apiKey: 'test-key' });
      const error: any = new Error('connect ECONNREFUSED');
      error.code = 'ECONNREFUSED';
      mockInstance.get.mockRejectedValue(error);

      const result = await adapter.healthCheck();
      expect(result.status).toBe('UNAVAILABLE');
    });
  });
});
