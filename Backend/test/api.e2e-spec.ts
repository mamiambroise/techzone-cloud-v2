import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Permission } from '../src/common/enums';

describe('BM + PM + PR API (JWT)', () => {
  let app: INestApplication;
  let adminToken: string;
  let viewerToken: string;
  let otherTenantToken: string;
  let applicationId: string;
  let businessVersionId: string;
  let packId: string;
  let packVersionId: string;
  let resolutionId: string;
  let publishedRowVersion: number;
  const suffix = `${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`;
  const auth = (token = adminToken) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    const fixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = fixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    const admin = await request(app.getHttpServer())
      .post('/api/v1/auth/session')
      .send({ email: 'admin@techzone.io' })
      .expect(201);
    const viewer = await request(app.getHttpServer())
      .post('/api/v1/auth/session')
      .send({ email: 'guest@techzone.io' })
      .expect(201);
    adminToken = admin.body.accessToken;
    viewerToken = viewer.body.accessToken;

    const jwt = app.get(JwtService);
    const config = app.get(ConfigService);
    otherTenantToken = await jwt.signAsync(
      {
        sub: '99999999-9999-4999-8999-999999999999',
        email: 'other-tenant@techzone.io',
        tenantId: 'tenant-other',
        permissions: Object.values(Permission),
      },
      { secret: config.get('app.jwtSecret', 'super-secret-key-change-me') },
    );
  });

  afterAll(async () => app.close());

  it('rejects an unauthenticated request with 401', async () => {
    await request(app.getHttpServer())
      .get('/api/pack-manager/packs')
      .expect(401);
  });

  it('rejects a viewer mutation with 403', async () => {
    await request(app.getHttpServer())
      .post('/api/pack-manager/packs')
      .set(auth(viewerToken))
      .send({ code: `viewer-${suffix}`, name: 'Forbidden' })
      .expect(403);
  });

  it('creates the persisted BM application and version used by runtime', async () => {
    const application = await request(app.getHttpServer())
      .post('/api/v1/business-manager/applications')
      .set(auth())
      .send({ code: `e2e-${suffix}`, name: `E2E application ${suffix}` })
      .expect(201);
    applicationId = application.body.id;
    const version = await request(app.getHttpServer())
      .post(`/api/v1/business-manager/applications/${applicationId}/versions`)
      .set(auth())
      .send({ versionNumber: '1.0.0', comment: 'JWT E2E contract' })
      .expect(201);
    businessVersionId = version.body.id;
  });

  it('blocks publication of an invalid empty PM version', async () => {
    const pack = await request(app.getHttpServer())
      .post('/api/pack-manager/packs')
      .set(auth())
      .send({ code: `invalid-${suffix}`, name: 'Invalid publication' })
      .expect(201);
    const version = await request(app.getHttpServer())
      .post(`/api/pack-manager/packs/${pack.body.id}/versions`)
      .set(auth())
      .send({ versionNumber: '1.0.0' })
      .expect(201);
    const validation = await request(app.getHttpServer())
      .post(`/api/pack-manager/versions/${version.body.id}/validate`)
      .set(auth())
      .expect(201);
    expect(validation.body.status).toBe('INVALID');
    await request(app.getHttpServer())
      .post(`/api/pack-manager/versions/${version.body.id}/publish`)
      .set(auth())
      .expect(409);
  });

  it('reports a missing required dependency and blocks publication', async () => {
    const pack = await request(app.getHttpServer())
      .post('/api/pack-manager/packs')
      .set(auth())
      .send({ code: `missing-${suffix}`, name: 'Missing dependency' })
      .expect(201);
    const version = await request(app.getHttpServer())
      .post(`/api/pack-manager/packs/${pack.body.id}/versions`)
      .set(auth())
      .send({ versionNumber: '1.0.0' })
      .expect(201);
    const module = await request(app.getHttpServer())
      .post(`/api/pack-manager/versions/${version.body.id}/modules`)
      .set(auth())
      .send({ code: 'core', name: 'Core' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/pack-manager/versions/${version.body.id}/dependencies`)
      .set(auth())
      .send({
        sourceType: 'MODULE',
        sourceId: module.body.id,
        targetType: 'FEATURE',
        targetRef: 'does-not-exist',
        required: true,
      })
      .expect(201);
    const validation = await request(app.getHttpServer())
      .post(`/api/pack-manager/versions/${version.body.id}/validate`)
      .set(auth())
      .expect(201);
    expect(validation.body.status).toBe('INVALID');
    expect(validation.body.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'DEPENDENCY_UNSATISFIED' }),
      ]),
    );
  });

  it('persists, validates, manifests and publishes a complete PM version', async () => {
    const pack = await request(app.getHttpServer())
      .post('/api/pack-manager/packs')
      .set(auth())
      .send({ code: `runtime-${suffix}`, name: 'Runtime E2E pack' })
      .expect(201);
    packId = pack.body.id;
    const version = await request(app.getHttpServer())
      .post(`/api/pack-manager/packs/${packId}/versions`)
      .set(auth())
      .send({ versionNumber: '1.0.0', label: 'Production' })
      .expect(201);
    packVersionId = version.body.id;
    const module = await request(app.getHttpServer())
      .post(`/api/pack-manager/versions/${packVersionId}/modules`)
      .set(auth())
      .send({ code: 'inventory', name: 'Inventory', displayOrder: 1 })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/pack-manager/versions/${packVersionId}/features`)
      .set(auth())
      .send({
        code: 'stock-view',
        name: 'Stock view',
        moduleId: module.body.id,
      })
      .expect(201);
    const validation = await request(app.getHttpServer())
      .post(`/api/pack-manager/versions/${packVersionId}/validate`)
      .set(auth())
      .expect(201);
    expect(validation.body.status).toBe('VALID');
    await request(app.getHttpServer())
      .post(`/api/pack-manager/versions/${packVersionId}/manifest`)
      .set(auth())
      .expect(201);
    const publication = await request(app.getHttpServer())
      .post(`/api/pack-manager/versions/${packVersionId}/publish`)
      .set(auth())
      .expect(201);
    expect(publication.body.status).toBe('PUBLISHED');
    publishedRowVersion = publication.body.rowVersion;
  });

  it('keeps a published version immutable', async () => {
    await request(app.getHttpServer())
      .patch(`/api/pack-manager/versions/${packVersionId}`)
      .set(auth())
      .send({ label: 'Forbidden edit', rowVersion: publishedRowVersion })
      .expect(409);
  });

  it('returns 404 without leaking a pack across tenants', async () => {
    await request(app.getHttpServer())
      .get(`/api/pack-manager/packs/${packId}`)
      .set(auth(otherTenantToken))
      .expect(404);
  });

  it('returns 404 for an unknown resource', async () => {
    await request(app.getHttpServer())
      .get(`/api/pack-manager/packs/${randomUUID()}`)
      .set(auth())
      .expect(404);
  });

  it('resolves BM + PM into an effective PR manifest and caches it', async () => {
    const input = {
      applicationId,
      businessVersionId,
      packCode: `runtime-${suffix}`,
      packVersion: '1.0.0',
      environment: 'PROD',
      context: { subscription: { plan: 'PRO', status: 'ACTIVE' } },
    };
    const first = await request(app.getHttpServer())
      .post('/api/runtime/resolve')
      .set(auth())
      .send(input)
      .expect(201);
    expect(first.body).toMatchObject({ status: 'RESOLVED', cache: 'MISS' });
    resolutionId = first.body.resolutionId;
    const second = await request(app.getHttpServer())
      .post('/api/runtime/resolve')
      .set(auth())
      .send(input)
      .expect(201);
    expect(second.body).toMatchObject({ resolutionId, cache: 'HIT' });
    const effective = await request(app.getHttpServer())
      .get(`/api/runtime/resolutions/${resolutionId}/effective-manifest`)
      .set(auth())
      .expect(200);
    expect(effective.body).toMatchObject({ status: 'VALID', executable: true });
    expect(effective.body.content.businessConfiguration.applicationId).toBe(
      applicationId,
    );
  });

  it('exposes tenant-safe PR cache, provider and resilience administration', async () => {
    const cache = await request(app.getHttpServer())
      .get('/api/runtime/cache/status')
      .set(auth())
      .expect(200);
    expect(cache.body).toMatchObject({ layer: 'L1_MEMORY', available: true });
    const health = await request(app.getHttpServer())
      .get('/api/runtime/providers/health')
      .set(auth())
      .expect(200);
    expect(health.body.providers).toEqual(
      expect.arrayContaining([expect.objectContaining({ state: 'UP' })]),
    );
    const resilience = await request(app.getHttpServer())
      .get('/api/runtime/resilience/status')
      .set(auth())
      .expect(200);
    expect(resilience.body.singleFlight).toBe(true);
    const invalidation = await request(app.getHttpServer())
      .post('/api/runtime/cache/invalidate')
      .set(auth())
      .send({ scope: 'APPLICATION', applicationId })
      .expect(201);
    expect(invalidation.body.invalidated).toBeGreaterThanOrEqual(1);
  });

  it('creates a distinct resolution when re-resolving', async () => {
    const retried = await request(app.getHttpServer())
      .post(`/api/runtime/resolutions/${resolutionId}/reresolve`)
      .set(auth())
      .expect(201);
    expect(retried.body.resolutionId).not.toBe(resolutionId);
    expect(retried.body.status).toBe('RESOLVED');
  });
});
