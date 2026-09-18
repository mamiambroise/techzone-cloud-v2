import { createHash, randomBytes } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { JWT_ACCESS_TTL } from './iam.constants';

export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

export function getAccessSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET manquant dans .env');
  }
  return secret;
}

export function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET manquant dans .env');
  }
  return secret;
}

export interface AccessTokenPayload {
  type: 'access';
  userId: string;
  sessionId: string;
  tenantId?: string | null;
  organizationId?: string | null;
  authenticationLevel?: string | null;
  iss?: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign({ ...payload, type: 'access' }, getAccessSecret(), {
    expiresIn: JWT_ACCESS_TTL as any,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, getAccessSecret()) as AccessTokenPayload;
}

export function issueRefreshTokenPayload(): { raw: string; hash: string; familyId: string } {
  const raw = generateRefreshToken();
  return { raw, hash: hashToken(raw), familyId: randomBytes(16).toString('hex') };
}