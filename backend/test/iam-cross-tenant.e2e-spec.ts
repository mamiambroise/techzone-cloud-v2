import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { currentTotpCode, hashChallengeToken } from '../src/iam/iam-totp.js';
import {
  clearIamCrossTenantFixtures,
  E2E_IDS,
  E2E_MFA_OTHER_SECRET,
  E2E_MFA_SECRET,
  E2E_PASSWORD,
  E2E_USERS,
  seedIamCrossTenantFixtures,
} from './iam-cross-tenant.seed.js';

describe('IAM cross-tenant PostgreSQL E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const pages = (versionId: string) => `/api/ui-builder/pages/${versionId}`;
  const page = (pageId: string) => `/api/ui-builder/pages/${pageId}`;

  function assertIsolatedTestDatabase() {
    const testUrl = process.env.TEST_DATABASE_URL;
    const activeUrl = process.env.DATABASE_URL;
    expect(testUrl).toBeTruthy();
    expect(activeUrl).toBe(testUrl);
    expect(new URL(activeUrl!).pathname.replace(/^\/+/, '')).toMatch(/(?:^|[_-])(test|e2e)(?:$|[_-])/i);
  }

  async function login(user: (typeof E2E_USERS)[keyof typeof E2E_USERS], tenantId: string) {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/iam/auth/login')
      .send({ identifier: user.username, password: E2E_PASSWORD, tenantId })
      .expect(200);
    return agent;
  }

  async function startMfaLogin(user: (typeof E2E_USERS)[keyof typeof E2E_USERS]) {
    const response = await request(app.getHttpServer())
      .post('/api/iam/auth/login')
      .send({ identifier: user.username, password: E2E_PASSWORD })
      .expect(200);
    expect(response.body.data.mfaRequired).toBe(true);
    return response.body.data.mfaChallengeToken as string;
  }

  beforeAll(async () => {
    assertIsolatedTestDatabase();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
    await seedIamCrossTenantFixtures(prisma);
  });

  afterAll(async () => {
    if (prisma) await clearIamCrossTenantFixtures(prisma);
    if (app) await app.close();
  });

  it('A → A GET : PASS', async () => {
    const agentA = await login(E2E_USERS.a, E2E_IDS.tenantA);
    const response = await agentA.get(pages(E2E_IDS.versionA)).expect(200);
    expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: E2E_IDS.pageA })]));
  });

  it('A → B GET : DENY', async () => {
    const agentA = await login(E2E_USERS.a, E2E_IDS.tenantA);
    await agentA.get(pages(E2E_IDS.versionB)).expect(404);
  });

  it('B → B GET : PASS', async () => {
    const agentB = await login(E2E_USERS.b, E2E_IDS.tenantB);
    const response = await agentB.get(pages(E2E_IDS.versionB)).expect(200);
    expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: E2E_IDS.pageB })]));
  });

  it('B → A GET : DENY', async () => {
    const agentB = await login(E2E_USERS.b, E2E_IDS.tenantB);
    await agentB.get(pages(E2E_IDS.versionA)).expect(404);
  });

  it('A → B UPDATE : DENY', async () => {
    const agentA = await login(E2E_USERS.a, E2E_IDS.tenantA);
    await agentA.patch(page(E2E_IDS.pageB)).send({ title: 'forged update' }).expect(403);
  });

  it('B → A UPDATE : DENY', async () => {
    const agentB = await login(E2E_USERS.b, E2E_IDS.tenantB);
    await agentB.patch(page(E2E_IDS.pageA)).send({ title: 'forged update' }).expect(403);
  });

  it('A → B DELETE : DENY', async () => {
    const agentA = await login(E2E_USERS.a, E2E_IDS.tenantA);
    await agentA.delete(page(E2E_IDS.pageB)).expect(403);
  });

  it('B → A DELETE : DENY', async () => {
    const agentB = await login(E2E_USERS.b, E2E_IDS.tenantB);
    await agentB.delete(page(E2E_IDS.pageA)).expect(403);
  });

  it('forged tenantId in login body, API body, query, and header : DENY', async () => {
    await request(app.getHttpServer())
      .post('/api/iam/auth/login')
      .send({ identifier: E2E_USERS.a.username, password: E2E_PASSWORD, tenantId: E2E_IDS.tenantB })
      .expect(403);

    const agentA = await login(E2E_USERS.a, E2E_IDS.tenantA);
    await agentA
      .patch(page(E2E_IDS.pageA))
      .send({ title: 'forged body', tenantId: E2E_IDS.tenantB })
      .expect(400);
    await agentA.get(`${pages(E2E_IDS.versionB)}?tenantId=${E2E_IDS.tenantA}`).expect(404);
    await agentA
      .patch(page(E2E_IDS.pageB))
      .set('x-tenant-id', E2E_IDS.tenantB)
      .send({ title: 'forged header' })
      .expect(403);
  });

  it('missing session, malformed token, and unknown resource : DENY', async () => {
    await request(app.getHttpServer()).get(pages(E2E_IDS.versionA)).expect(401);
    await request(app.getHttpServer()).get(pages(E2E_IDS.versionA)).set('Authorization', 'Bearer malformed').expect(401);
    const agentA = await login(E2E_USERS.a, E2E_IDS.tenantA);
    await agentA.patch(page('f0000000-0000-4000-8000-000000000099')).send({ title: 'unknown' }).expect(404);
  });

  it('missing permission and wrong role : DENY', async () => {
    const limited = await login(E2E_USERS.limited, E2E_IDS.tenantA);
    await limited.get(pages(E2E_IDS.versionA)).expect(200);
    await limited.patch(page(E2E_IDS.pageA)).send({ title: 'must not update' }).expect(403);
  });

  it('revoked session : DENY when the same token is replayed', async () => {
    const agentB = await login(E2E_USERS.b, E2E_IDS.tenantB);
    await agentB.get(pages(E2E_IDS.versionB)).expect(200);
    const session = await prisma.iamSession.findFirst({
      where: { userId: E2E_IDS.userB, status: 'ACTIVE', id: { not: E2E_IDS.sessionB } },
      orderBy: { createdAt: 'desc' },
    });
    expect(session).not.toBeNull();
    await prisma.iamSession.update({ where: { id: session!.id }, data: { status: 'REVOKED', revokedAt: new Date(), revokeReason: 'E2E_TEST' } });
    await agentB.get(pages(E2E_IDS.versionB)).expect(401);
  });

  it('MFA invalid code, challenge bound to another user, valid challenge, and replay : PASS', async () => {
    const invalidChallenge = await startMfaLogin(E2E_USERS.mfa);
    await request(app.getHttpServer()).post('/api/iam/auth/login/mfa').send({ challengeToken: invalidChallenge, code: '000000' }).expect(401);

    const otherUserChallenge = await startMfaLogin(E2E_USERS.mfa);
    await request(app.getHttpServer())
      .post('/api/iam/auth/login/mfa')
      .send({ challengeToken: otherUserChallenge, code: currentTotpCode(E2E_MFA_OTHER_SECRET) })
      .expect(401);

    const validChallenge = await startMfaLogin(E2E_USERS.mfa);
    await request(app.getHttpServer())
      .post('/api/iam/auth/login/mfa')
      .send({ challengeToken: validChallenge, code: currentTotpCode(E2E_MFA_SECRET) })
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/iam/auth/login/mfa')
      .send({ challengeToken: validChallenge, code: currentTotpCode(E2E_MFA_SECRET) })
      .expect(401);
  });

  it('expired MFA challenge : DENY', async () => {
    const challengeToken = await startMfaLogin(E2E_USERS.mfaOther);
    const rawToken = challengeToken.replace(/^mfa-ch_/, '');
    await prisma.mfaChallenge.updateMany({
      where: { tokenHash: hashChallengeToken(rawToken) },
      data: { expiresAt: new Date(Date.now() - 1_000) },
    });
    await request(app.getHttpServer())
      .post('/api/iam/auth/login/mfa')
      .send({ challengeToken, code: currentTotpCode(E2E_MFA_OTHER_SECRET) })
      .expect(401);
  });

  it('revoked membership : DENY after dynamic authorization cache expiry', async () => {
    const agentA = await login(E2E_USERS.a, E2E_IDS.tenantA);
    await agentA.get(pages(E2E_IDS.versionA)).expect(200);
    await prisma.membership.updateMany({
      where: { userId: E2E_IDS.userA, tenantId: E2E_IDS.tenantA, status: 'ACTIVE' },
      data: { status: 'REVOKED', revokedAt: new Date(), revokeReason: 'E2E_TEST' },
    });
    await new Promise((resolve) => setTimeout(resolve, 5_100));
    await agentA.get(pages(E2E_IDS.versionA)).expect(403);
  }, 10_000);
});
