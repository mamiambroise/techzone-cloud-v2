import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/filters/all-exceptions.filter';
import { generateAdminToken, generateUserToken, authHeader } from '../helpers/auth.helper';

const ADMIN_TOKEN = generateAdminToken();
const AUTH = authHeader(ADMIN_TOKEN);

describe('ERP CRUD E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('ERP Registry (PostgreSQL)', () => {
    const createdIds: string[] = [];

    it('should create an ERP', async () => {
      const suffix = Date.now();
      const response = await request(app.getHttpServer())
        .post('/api/erp-registry')
        .set(AUTH)
        .send({
          code: `TEST_ERP_${suffix}`,
          nom: 'Test ERP',
          type: 'MOCK',
          url: 'http://localhost:3000',
          environment: 'TEST',
        });
      expect(response.status).toBe(201);
      expect(response.body.code).toBe(`TEST_ERP_${suffix}`);
      createdIds.push(response.body.id);
    });

    it('should list all ERPs', async () => {
      const response = await request(app.getHttpServer()).get('/api/erp-registry').set(AUTH);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get one ERP by id', async () => {
      const list = await request(app.getHttpServer()).get('/api/erp-registry').set(AUTH);
      const first = list.body[0];
      const response = await request(app.getHttpServer()).get(`/api/erp-registry/${first.id}`).set(AUTH);
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(first.id);
    });

    it('should update an ERP', async () => {
      const list = await request(app.getHttpServer()).get('/api/erp-registry').set(AUTH);
      const first = list.body[0];
      const response = await request(app.getHttpServer())
        .put(`/api/erp-registry/${first.id}`)
        .set(AUTH)
        .send({ nom: 'Test ERP Modifie' });
      expect(response.status).toBe(200);
      expect(response.body.nom).toBe('Test ERP Modifie');
    });

    it('should delete an ERP', async () => {
      for (const id of createdIds) {
        const response = await request(app.getHttpServer())
          .delete(`/api/erp-registry/${id}`)
          .set(AUTH);
        expect(response.status).toBe(204);
      }
    });
  });

  describe('ERP Adapter - Mock', () => {
    it('should create a client with Mock ERP', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/erp/clients?erp=MOCK')
        .set(AUTH)
        .send({
          nom: 'Rakoto Marie',
          email: 'marie@test.com',
        });
      expect(response.status).toBe(201);
      expect(response.body.nom).toBe('Rakoto Marie');
    });

    it('should create a product with Mock ERP', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/erp/products?erp=MOCK')
        .set(AUTH)
        .send({
          ref: 'TEST-001',
          label: 'Produit Test',
          price: 10000,
        });
      expect(response.status).toBe(201);
      expect(response.body.ref).toBe('TEST-001');
    });

    it('should create an order with Mock ERP', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/erp/orders?erp=MOCK')
        .set(AUTH)
        .send({
          clientId: '1',
          lines: [{ productId: '1', quantity: 2, price: 10000 }],
        });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.total).toBe(20000);
    });

    it('should list clients with Mock ERP', async () => {
      const response = await request(app.getHttpServer()).get('/api/erp/clients?erp=MOCK').set(AUTH);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should list products with Mock ERP', async () => {
      const response = await request(app.getHttpServer()).get('/api/erp/products?erp=MOCK').set(AUTH);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should list orders with Mock ERP', async () => {
      const response = await request(app.getHttpServer()).get('/api/erp/orders?erp=MOCK').set(AUTH);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get stock for a product', async () => {
      const response = await request(app.getHttpServer()).get('/api/erp/stock/prod-1?erp=MOCK').set(AUTH);
      expect(response.status).toBe(200);
      expect(response.body.productId).toBe('prod-1');
      expect(response.body).toHaveProperty('currentStock');
    });

    it('should update stock for a product', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/erp/stock/prod-1?erp=MOCK')
        .set(AUTH)
        .send({ quantity: 50 });
      expect(response.status).toBe(200);
      expect(response.body.currentStock).toBe(50);
    });

    it('should return health check (public endpoint)', async () => {
      const response = await request(app.getHttpServer()).get('/api/erp/health?erp=MOCK');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('CONNECTED');
      expect(response.body.mode).toBe('MOCK');
    });
  });

  describe('Authentication enforcement', () => {
    it('should return 401 when accessing protected endpoints without a token', async () => {
      const response = await request(app.getHttpServer()).get('/api/erp/clients?erp=MOCK');
      expect(response.status).toBe(401);
    });

    it('should return 401 when accessing protected endpoints with an invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/erp/clients?erp=MOCK')
        .set(authHeader('invalid-token'));
      expect(response.status).toBe(401);
    });
  });

  describe('Permission enforcement', () => {
    it('should allow admin to execute data-runtime operations', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/data-runtime/query')
        .set(AUTH)
        .send({ resource: 'clients', pageSize: 10 });
      expect([200, 400, 404, 501]).toContain(response.status);
    });

    it('should deny non-admin user from data-runtime execute operations', async () => {
      const userToken = generateUserToken();
      const response = await request(app.getHttpServer())
        .post('/api/data-runtime/execute')
        .set(authHeader(userToken))
        .send({ resource: 'clients', operation: 'create' });
      expect(response.status).toBe(403);
    });

    it('should allow non-admin user to query data-runtime', async () => {
      const userToken = generateUserToken();
      const response = await request(app.getHttpServer())
        .post('/api/data-runtime/query')
        .set(authHeader(userToken))
        .send({ resource: 'clients', pageSize: 10 });
      expect([200, 400, 404, 501]).toContain(response.status);
    });

    it('should allow admin to access automation cockpit', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/automation/cockpit')
        .set(AUTH);
      expect(response.status).toBe(200);
    });

    it('should deny non-admin user from automation execute operations', async () => {
      const userToken = generateUserToken();
      const response = await request(app.getHttpServer())
        .post('/api/automation/workflows/start')
        .set(authHeader(userToken))
        .send({ workflowCode: 'test' });
      expect(response.status).toBe(403);
    });

    it('should allow non-admin user to read automation rules', async () => {
      const userToken = generateUserToken();
      const response = await request(app.getHttpServer())
        .get('/api/automation/rules')
        .set(authHeader(userToken));
      expect(response.status).toBe(200);
    });
  });

  describe('Config endpoint secret masking', () => {
    it('should mask sensitive configuration values', async () => {
      const response = await request(app.getHttpServer()).get('/api/config').set(AUTH);
      expect(response.status).toBe(200);
      const entries = response.body.entries;
      const jwtSecret = entries.find((e: any) => e.key === 'JWT_ACCESS_SECRET');
      expect(jwtSecret).toBeDefined();
      expect(jwtSecret.masked).toBe(true);
      expect(jwtSecret.value).not.toBe('change_me');
      expect(jwtSecret.value).toContain('*');
    });

    it('should return public config without auth', async () => {
      const response = await request(app.getHttpServer()).get('/api/config/public');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('erpResolutionMode');
    });
  });
});