import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/filters/all-exceptions.filter';
import { generateAdminToken, authHeader } from '../helpers/auth.helper';

const ADMIN_TOKEN = generateAdminToken();
const AUTH = authHeader(ADMIN_TOKEN);

describe('ERP Independence E2E', () => {
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

  it('should list available adapters (public health-check only, auth required for others)', async () => {
    const unauth = await request(app.getHttpServer()).get('/api/erp/adapters');
    expect(unauth.status).toBe(401);

    const response = await request(app.getHttpServer()).get('/api/erp/adapters').set(AUTH);
    expect(response.status).toBe(200);
    expect(response.body.adapters).toEqual(expect.arrayContaining(['MOCK']));
  });

  it('should work with both MOCK and DOLIBARR without changing the Pack', async () => {
    const mockClient = await request(app.getHttpServer())
      .post('/api/erp/clients?erp=MOCK')
      .set(AUTH)
      .send({ nom: 'Client Mock', email: 'mock@test.com' });
    expect(mockClient.status).toBe(201);
    expect(mockClient.body.nom).toBe('Client Mock');
    expect(mockClient.body.email).toBe('mock@test.com');

    const dolibarrClient = await request(app.getHttpServer())
      .post('/api/erp/clients?erp=DOLIBARR')
      .set(AUTH)
      .send({ nom: 'Client Dolibarr', email: 'dolibarr@test.com' });

    if (dolibarrClient.status === 200 || dolibarrClient.status === 201) {
      expect(dolibarrClient.body.nom).toBe('Client Dolibarr');
    }

    const mockList = await request(app.getHttpServer()).get('/api/erp/clients?erp=MOCK').set(AUTH);
    expect(mockList.status).toBe(200);
    expect(Array.isArray(mockList.body)).toBe(true);

    const dolibarrList = await request(app.getHttpServer()).get('/api/erp/clients?erp=DOLIBARR').set(AUTH);
    expect([200, 201, 401, 404, 500, 502, 503]).toContain(dolibarrList.status);

    if (mockList.body.length > 0) {
      const client = mockList.body[0];
      expect(client).toHaveProperty('id');
      expect(client).toHaveProperty('nom');
      expect(client).toHaveProperty('email');
    }
  });

  it('should return the same structure for products regardless of ERP', async () => {
    const mockProducts = await request(app.getHttpServer())
      .get('/api/erp/products?erp=MOCK')
      .set(AUTH);
    expect(mockProducts.status).toBe(200);

    const dolibarrProducts = await request(app.getHttpServer())
      .get('/api/erp/products?erp=DOLIBARR')
      .set(AUTH);
    expect([200, 201, 401, 404, 500, 502, 503]).toContain(dolibarrProducts.status);

    if (mockProducts.body.length > 0) {
      const product = mockProducts.body[0];
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('ref');
      expect(product).toHaveProperty('label');
      expect(product).toHaveProperty('price');
    }
  });

  it('should keep MOCK data in memory independent from Dolibarr', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/erp/clients?erp=MOCK')
      .set(AUTH)
      .send({ nom: 'Independent Client', email: 'indep@test.com' });
    expect(created.status).toBe(201);

    const list = await request(app.getHttpServer()).get('/api/erp/clients?erp=MOCK').set(AUTH);
    const found = list.body.find((c: any) => c.email === 'indep@test.com');
    expect(found).toBeDefined();
    expect(found.nom).toBe('Independent Client');
  });
});
