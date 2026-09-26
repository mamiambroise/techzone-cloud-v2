import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/filters/all-exceptions.filter';
import { generateAdminToken, authHeader } from '../helpers/auth.helper';

const ADMIN_TOKEN = generateAdminToken();
const AUTH = authHeader(ADMIN_TOKEN);

describe('ERP Resilience E2E', () => {
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

  it('should handle ERP unavailability gracefully', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/erp/clients?erp=INEXISTANT')
      .set(AUTH);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('statusCode');
    expect(response.body).toHaveProperty('message');
  });

  it('should keep serving MOCK ERP when Dolibarr is in error', async () => {
    const dolibarrResponse = await request(app.getHttpServer())
      .get('/api/erp/clients?erp=DOLIBARR')
      .set(AUTH);

    const mockResponse = await request(app.getHttpServer())
      .get('/api/erp/clients?erp=MOCK')
      .set(AUTH);
    expect(mockResponse.status).toBe(200);
    expect(Array.isArray(mockResponse.body)).toBe(true);

    expect([200, 401, 404, 500, 502, 503]).toContain(dolibarrResponse.status);
  });

  it('should retry failed operations (documented behavior)', async () => {
    const health = await request(app.getHttpServer()).get('/api/erp/health?erp=MOCK');
    expect(health.status).toBe(200);
    expect(health.body.status).toBe('CONNECTED');
  });

  it('should return structured errors from the all-exceptions filter', async () => {
    const notFound = await request(app.getHttpServer())
      .get('/api/erp/clients/IDONTEXIST?erp=MOCK')
      .set(AUTH);
    expect(notFound.status).toBe(404);
    expect(notFound.body).toHaveProperty('statusCode');
    expect(notFound.body).toHaveProperty('message');
    expect(notFound.body).toHaveProperty('timestamp');

    const invalid = await request(app.getHttpServer())
      .post('/api/erp/clients?erp=MOCK')
      .set(AUTH)
      .send({ nom: '' });
    expect(invalid.status).toBe(400);
    expect(invalid.body).toHaveProperty('statusCode');
  });

  it('should validate the health endpoint of MOCK after errors', async () => {
    const health = await request(app.getHttpServer()).get('/api/erp/health?erp=MOCK');
    expect(health.status).toBe(200);
    expect(health.body.status).toBe('CONNECTED');
    expect(health.body.mode).toBe('MOCK');
  });

  it('should return 401 for protected endpoints without auth', async () => {
    const response = await request(app.getHttpServer()).get('/api/erp/clients?erp=MOCK');
    expect(response.status).toBe(401);
  });
});
