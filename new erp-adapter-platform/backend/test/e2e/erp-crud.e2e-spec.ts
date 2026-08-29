import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/filters/all-exceptions.filter';

// Les tests E2E peuvent etre executes avec ou sans Dolibarr.
// Ils utilisent le MOCK ERP par defaut.

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
      const response = await request(app.getHttpServer()).get('/api/erp-registry');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get one ERP by id', async () => {
      const list = await request(app.getHttpServer()).get('/api/erp-registry');
      const first = list.body[0];
      const response = await request(app.getHttpServer()).get(`/api/erp-registry/${first.id}`);
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(first.id);
    });

    it('should update an ERP', async () => {
      const list = await request(app.getHttpServer()).get('/api/erp-registry');
      const first = list.body[0];
      const response = await request(app.getHttpServer())
        .put(`/api/erp-registry/${first.id}`)
        .send({ nom: 'Test ERP Modifie' });
      expect(response.status).toBe(200);
      expect(response.body.nom).toBe('Test ERP Modifie');
    });

    it('should delete an ERP', async () => {
      for (const id of createdIds) {
        const response = await request(app.getHttpServer()).delete(`/api/erp-registry/${id}`);
        expect(response.status).toBe(204);
      }
    });
  });

  describe('ERP Adapter - Mock', () => {
    it('should create a client with Mock ERP', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/erp/clients?erp=MOCK')
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
        .send({
          clientId: '1',
          lines: [{ productId: '1', quantity: 2, price: 10000 }],
        });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.total).toBe(20000);
    });

    it('should list clients with Mock ERP', async () => {
      const response = await request(app.getHttpServer()).get('/api/erp/clients?erp=MOCK');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should list products with Mock ERP', async () => {
      const response = await request(app.getHttpServer()).get('/api/erp/products?erp=MOCK');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should list orders with Mock ERP', async () => {
      const response = await request(app.getHttpServer()).get('/api/erp/orders?erp=MOCK');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get stock for a product', async () => {
      const response = await request(app.getHttpServer()).get('/api/erp/stock/prod-1?erp=MOCK');
      expect(response.status).toBe(200);
      expect(response.body.productId).toBe('prod-1');
      expect(response.body).toHaveProperty('currentStock');
    });

    it('should update stock for a product', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/erp/stock/prod-1?erp=MOCK')
        .send({ quantity: 50 });
      expect(response.status).toBe(200);
      expect(response.body.currentStock).toBe(50);
    });

    it('should return health check', async () => {
      const response = await request(app.getHttpServer()).get('/api/erp/health?erp=MOCK');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('HEALTHY');
      expect(response.body.mode).toBe('MOCK');
    });
  });
});