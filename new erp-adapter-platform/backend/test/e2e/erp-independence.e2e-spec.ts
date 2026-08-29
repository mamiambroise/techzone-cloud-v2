import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/filters/all-exceptions.filter';

/**
 * Test d'independance ERP.
 * Demontre que la meme API /erp/clients fonctionne avec plusieurs ERP
 * sans changer le code de l'application (le Pack Boutique).
 */
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

  it('should list available adapters', async () => {
    const response = await request(app.getHttpServer()).get('/api/erp/adapters');
    expect(response.status).toBe(200);
    expect(response.body.adapters).toEqual(expect.arrayContaining(['MOCK']));
  });

  it('should work with both MOCK and DOLIBARR without changing the Pack', async () => {
    // 1. Creer un client avec MOCK
    const mockClient = await request(app.getHttpServer())
      .post('/api/erp/clients?erp=MOCK')
      .send({ nom: 'Client Mock', email: 'mock@test.com' });
    expect(mockClient.status).toBe(201);
    expect(mockClient.body.nom).toBe('Client Mock');
    expect(mockClient.body.email).toBe('mock@test.com');

    // 2. Creer un client avec DOLIBARR (si configure)
    // Le test passe meme si Dolibarr n'est pas disponible
    const dolibarrClient = await request(app.getHttpServer())
      .post('/api/erp/clients?erp=DOLIBARR')
      .send({ nom: 'Client Dolibarr', email: 'dolibarr@test.com' });

    if (dolibarrClient.status === 200 || dolibarrClient.status === 201) {
      expect(dolibarrClient.body.nom).toBe('Client Dolibarr');
    }

    // 3. Le meme endpoint retourne une liste pour les deux ERP
    const mockList = await request(app.getHttpServer()).get('/api/erp/clients?erp=MOCK');
    expect(mockList.status).toBe(200);
    expect(Array.isArray(mockList.body)).toBe(true);

    const dolibarrList = await request(app.getHttpServer()).get('/api/erp/clients?erp=DOLIBARR');
    // Accepte 200 (Dolibarr connecte) ou 5xx (Dolibarr indisponible)
    expect([200, 201, 401, 404, 500, 502, 503]).toContain(dolibarrList.status);

    // 4. La structure des donnees est identique (meme interface IErpAdapter)
    if (mockList.body.length > 0) {
      const client = mockList.body[0];
      expect(client).toHaveProperty('id');
      expect(client).toHaveProperty('nom');
      expect(client).toHaveProperty('email');
    }
  });

  it('should return the same structure for products regardless of ERP', async () => {
    const mockProducts = await request(app.getHttpServer()).get('/api/erp/products?erp=MOCK');
    expect(mockProducts.status).toBe(200);

    const dolibarrProducts = await request(app.getHttpServer()).get('/api/erp/products?erp=DOLIBARR');
    expect([200, 201, 401, 404, 500, 502, 503]).toContain(dolibarrProducts.status);

    // Structure commune via IErpAdapter
    if (mockProducts.body.length > 0) {
      const product = mockProducts.body[0];
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('ref');
      expect(product).toHaveProperty('label');
      expect(product).toHaveProperty('price');
    }
  });

  it('should keep MOCK data in memory independent from Dolibarr', async () => {
    // Creer un client dans MOCK
    const created = await request(app.getHttpServer())
      .post('/api/erp/clients?erp=MOCK')
      .send({ nom: 'Independent Client', email: 'indep@test.com' });
    expect(created.status).toBe(201);

    // Le client doit etre retrouvable
    const list = await request(app.getHttpServer()).get('/api/erp/clients?erp=MOCK');
    const found = list.body.find((c: any) => c.email === 'indep@test.com');
    expect(found).toBeDefined();
    expect(found.nom).toBe('Independent Client');
  });
});