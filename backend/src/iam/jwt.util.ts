import { createHash, randomBytes } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { JWT_ACCESS_TTL, IAM_ISSUER } from './iam.constants';

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
  roles?: string[];
  permissions?: string[];
  iss?: string;
  aud?: string;
}

export const IAM_AUDIENCE = 'techzone-cloud-api';

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(
    {
      ...payload,
      type: 'access',
      // LOT 5 : identité stricte du jeton émis (LOT 15 audite). Un token
      // sans issuer/audience émis par une autre chaîne est refusé au
      // dépouillement d'échanges ci-dessous.
      iss: IAM_ISSUER,
      aud: IAM_AUDIENCE,
    },
    getAccessSecret(),
    { expiresIn: JWT_ACCESS_TTL as any, algorithm: 'HS256' },
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, getAccessSecret(), {
    algorithms: ['HS256'],
    // Fail-closed : iss/aud sont obligatoires et doivent correspondre ;
    // 'alg: none' et les autres algorithmes sont déjà exclus ci-dessus.
    issuer: IAM_ISSUER,
    audience: IAM_AUDIENCE,
  }) as jwt.JwtPayload;
  if (
    !decoded.userId ||
    !decoded.sessionId ||
    decoded.purpose ||
    decoded.type !== 'access'
  ) {
    throw new Error('Invalid access token');
  }
  return decoded as AccessTokenPayload;
}

export function issueRefreshTokenPayload(): { raw: string; hash: string; familyId: string } {
  const raw = generateRefreshToken();
  return { raw, hash: hashToken(raw), familyId: randomBytes(16).toString('hex') };
}

export function decodeAccessTokenUnsafe(token: string): AccessTokenPayload | null {
  try {
    return jwt.decode(token) as AccessTokenPayload;
  } catch {
    return null;
  }
}
