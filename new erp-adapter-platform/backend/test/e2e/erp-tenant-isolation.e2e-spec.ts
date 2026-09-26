import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/filters/all-exceptions.filter';
import { generateAdminToken, generateUserToken, authHeader } from '../helpers/auth.helper';

const ADMIN_TOKEN = generateAdminToken();
const AUTH = authHeader(ADMIN_TOKEN);

describe('Tenant Isolation E2E', () => {
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

  it('should create an ERP scoped to the authenticated tenant', async () => {
    const suffix = Date.now();
    const response = await request(app.getHttpServer())
      .post('/api/erp-registry')
      .set(AUTH)
      .send({
        code: `TENANT_ERP_${suffix}`,
        nom: 'Tenant ERP',
        type: 'MOCK',
        url: 'http://localhost:3000',
        environment: 'TEST',
      });
    expect(response.status).toBe(201);
    expect(response.body.code).toBe(`TENANT_ERP_${suffix}`);
    expect(response.body.tenantId).toBe('test-tenant');
  });

  it('should list only ERPs of the authenticated tenant', async () => {
    const response = await request(app.getHttpServer()).get('/api/erp-registry').set(AUTH);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    for (const erp of response.body) {
      expect(erp.tenantId).toBe('test-tenant');
    }
  });

  it('should return 404 when looking up an ERP that belongs to another tenant', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/erp-registry/00000000-0000-4000-8000-000000000000')
      .set(AUTH);
    expect(response.status).toBe(404);
  });

  it('should return 404 when looking up an ERP by code from another tenant', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/erp-registry/code/DOES_NOT_EXIST')
      .set(AUTH);
    expect(response.status).toBe(404);
  });

  it('should reject duplicate code within the same tenant', async () => {
    const suffix = Date.now();
    const code = `DUP_${suffix}`;
    const first = await request(app.getHttpServer())
      .post('/api/erp-registry')
      .set(AUTH)
      .send({ code, nom: 'First', type: 'MOCK', url: 'http://localhost:3000' });
    expect(first.status).toBe(201);

    const second = await request(app.getHttpServer())
      .post('/api/erp-registry')
      .set(AUTH)
      .send({ code, nom: 'Second', type: 'MOCK', url: 'http://localhost:3000' });
    expect(second.status).toBe(409);
  });

  it('should allow the same code for a different tenant', async () => {
    const userToken = generateUserToken({ tenantId: 'other-tenant' });
    const code = `SHARED_${Date.now()}`;
    const response = await request(app.getHttpServer())
      .post('/api/erp-registry')
      .set(authHeader(userToken))
      .send({ code, nom: 'Shared Code', type: 'MOCK', url: 'http://localhost:3000' });
    expect(response.status).toBe(201);
    expect(response.body.tenantId).toBe('other-tenant');
  });

  it('should deny update of another tenant resource', async () => {
    const response = await request(app.getHttpServer())
      .put('/api/erp-registry/00000000-0000-4000-8000-000000000000')
      .set(AUTH)
      .send({ nom: 'Nope' });
    expect(response.status).toBe(404);
  });

  it('should deny delete of another tenant resource', async () => {
    const response = await request(app.getHttpServer())
      .delete('/api/erp-registry/00000000-0000-4000-8000-000000000000')
      .set(AUTH);
    expect(response.status).toBe(404);
  });
});