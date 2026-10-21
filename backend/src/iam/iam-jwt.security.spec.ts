import { jest } from '@jest/globals';
import * as jwt from 'jsonwebtoken';
import { IamError } from './iam-error';
import { IamLogger } from './iam.logger';
import {
  signAccessToken,
  verifyAccessToken,
  IAM_AUDIENCE,
  type AccessTokenPayload,
} from './jwt.util';
import { IAM_ISSUER } from './iam.constants';
import { IamJwtGuard } from './iam-jwt.guard';
import { IamAuthService } from './iam-auth.service';
import type { PrismaService } from '../prisma/prisma.service';

/**
 * LOT 5 — JWT / sessions.
 *
 * JWT seul ≠ autorité : signature HS256 stricte, iss/aud obligatoires,
 * expiration active, rejet de 'alg: none' / tampering, et surtout binding
 * exact (userId, sessionId) avec la session persistée.
 */
process.env.JWT_ACCESS_SECRET ||= 'unified-jwt-test-secret';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const SESSION_ID = '22222222-2222-4222-8222-222222222222';

const validPayload = (): AccessTokenPayload => ({
  type: 'access',
  userId: USER_ID,
  sessionId: SESSION_ID,
  tenantId: null,
  organizationId: null,
  authenticationLevel: 'PASSWORD',
  roles: ['user'],
  permissions: [],
});

describe('verifyAccessToken — signature / iss / aud / exp', () => {
  it('accepte un token proprement signé avec iss+aud', () => {
    const token = signAccessToken(validPayload());
    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(USER_ID);
    expect(decoded.sessionId).toBe(SESSION_ID);
    expect(decoded.iss).toBe(IAM_ISSUER);
    expect(decoded.aud).toBe(IAM_AUDIENCE);
  });

  it('rejette un token sans issuer (ancien format) — fail-closed', () => {
    // Signature sans iss (l'ancien signer) : doit être refusé désormais.
    const token = jwt.sign(
      { type: 'access', userId: USER_ID, sessionId: SESSION_ID },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '15m', algorithm: 'HS256' },
    );
    expect(() => verifyAccessToken(token)).toThrow();
  });

  it('rejette un issuer inconnu', () => {
    const token = jwt.sign(
      { ...validPayload(), iss: 'imposteur' },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '15m', algorithm: 'HS256' },
    );
    expect(() => verifyAccessToken(token)).toThrow();
  });

  it('rejette une mauvaise audience', () => {
    const token = jwt.sign(
      { ...validPayload(), iss: IAM_ISSUER, aud: 'elsewhere' },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '15m', algorithm: 'HS256' },
    );
    expect(() => verifyAccessToken(token)).toThrow();
  });

  it('rejette alg: none (header forgé manuellement)', () => {
    const head = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(
      JSON.stringify({ ...validPayload(), iss: IAM_ISSUER, aud: IAM_AUDIENCE }),
    ).toString('base64url');
    expect(() => verifyAccessToken(`${head}.${body}.`)).toThrow();
  });

  it('rejette un token altéré (payload réécrit)', () => {
    const token = signAccessToken(validPayload());
    const [head, body, sig] = token.split('.');
    const forged = Buffer.from(
      JSON.stringify({ ...validPayload(), userId: 'attacker' }),
    ).toString('base64url');
    expect(() => verifyAccessToken(`${head}.${forged}.${sig}`)).toThrow(/invalid signature|Invalid access token/);
    void body;
  });

  it('rejette un token signé avec un autre secret', () => {
    const token = jwt.sign(
      { ...validPayload(), iss: IAM_ISSUER, aud: IAM_AUDIENCE },
      'wrong-secret',
      { expiresIn: '15m', algorithm: 'HS256' },
    );
    expect(() => verifyAccessToken(token)).toThrow();
  });

  it('rejette un token expiré', () => {
    const token = jwt.sign(
      { ...validPayload(), iss: IAM_ISSUER, aud: IAM_AUDIENCE },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '-10s', algorithm: 'HS256' },
    );
    expect(() => verifyAccessToken(token)).toThrow();
  });

  it('les refresh tokens restent opaques (pas de JWT)', () => {
    // Le refresh est un blob aléatoire hashé : pas de structure signée.
    // Un JWT de type refresh frauduleux ne peut pas être confondu.
    const token = jwt.sign(
      { type: 'refresh', userId: USER_ID },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '15m', algorithm: 'HS256' },
    );
    expect(() => verifyAccessToken(token)).toThrow();
  });
});

describe('IamJwtGuard — binding session ↔ user', () => {
  const buildGuard = (session: any, user: any) => {
    const prisma = {
      iamSession: { findUnique: jest.fn(async () => session), update: jest.fn(async () => ({})) },
      iamUser: { findUnique: jest.fn(async () => user) },
    } as unknown as PrismaService;
    const authService = {
      assertSessionUsable: jest.fn(async () => undefined),
      assertUserIsActive: jest.fn(),
    } as unknown as IamAuthService;
    const authorization = {
      resolve: jest.fn(async () => ({ roles: [], permissions: [], isSuperAdmin: false, tenantRoleCodes: [] })),
    };
    const guard = new IamJwtGuard(
      { getAllAndOverride: () => false } as never,
      prisma,
      authService,
      authorization as never,
    );
    return guard;
  };

  const requestFor = (token: string) =>
    ({
      headers: { authorization: `Bearer ${token}` },
      headersCookie: undefined,
    } as any);

  it('refuse un userId de JWT différent de la session (fixation)', async () => {
    const token = signAccessToken(validPayload());
    const guard = buildGuard(
      { id: SESSION_ID, userId: 'victime', status: 'ACTIVE', expiresAt: null, idleExpiresAt: null },
      { id: USER_ID, isAdmin: false },
    );

    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => requestFor(token) }),
    } as unknown as import('@nestjs/common').ExecutionContext;
    await expect(guard.canActivate(context))
      .rejects.toMatchObject({ code: 'SESSION_MISMATCH' } as Partial<IamError>);
  });

  it('accepte un token cohérent et construit le principal depuis la session', async () => {
    const token = signAccessToken(validPayload());
    const guard = buildGuard(
      { id: SESSION_ID, userId: USER_ID, tenantId: TENANT(), status: 'ACTIVE', expiresAt: null, idleExpiresAt: null, organizationId: null },
      { id: USER_ID, isAdmin: false },
    );

    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => requestFor(token) }),
    } as never;
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });
});

function TENANT(): string {
  return 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
}

void IamLogger;
