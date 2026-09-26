import { HttpException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

import { IAM_ISSUER } from './iam.constants';

export interface AccessTokenPayload {
  type?: string;
  userId: string;
  sessionId: string;
  tenantId?: string | null;
  organizationId?: string | null;
  authenticationLevel?: string | null;
  roles?: string[];
  permissions?: string[];
  iss?: string;
}

function getAccessSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_ACCESS_SECRET manquant dans backend/.env (nécessaire pour valider les tokens IAM)',
    );
  }
  return secret;
}

/**
 * Valide un access token émis par Auth_AIM (iss: techzone-cloud-iam).
 *
 * Validation stricte (fail-closed) :
 * - signature HS256
 * - expiration (exp)
 * - issuer (iss === techzone-cloud-iam)
 * - subject (sub / userId) présent
 *
 * Ne se contente pas de décoder : il vérifie la signature.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  let decoded: jwt.JwtPayload;
  try {
    decoded = jwt.verify(token, getAccessSecret(), {
      issuer: IAM_ISSUER,
      algorithms: ['HS256'],
    }) as jwt.JwtPayload;
  } catch (err: any) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new HttpException('Token expiré', 401);
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw new HttpException('Token invalide', 401);
    }
    throw new HttpException('Token invalide', 401);
  }

  const userId = (decoded.userId as string) || (decoded.sub as string);
  const sessionId = (decoded.sessionId as string) || (decoded.sid as string);

  if (!userId || !sessionId) {
    throw new HttpException('Token mal formé', 401);
  }

  return {
    type: decoded.type as string,
    userId,
    sessionId,
    tenantId: (decoded.tenantId as string | null) ?? null,
    organizationId: (decoded.organizationId as string | null) ?? null,
    authenticationLevel: (decoded.authenticationLevel as string | null) ?? null,
    roles: Array.isArray(decoded.roles) ? (decoded.roles as string[]) : [],
    permissions: Array.isArray(decoded.permissions)
      ? (decoded.permissions as string[])
      : [],
    iss: decoded.iss as string,
  };
}

export function decodeAccessTokenUnsafe(token: string): AccessTokenPayload | null {
  try {
    return jwt.decode(token) as AccessTokenPayload;
  } catch {
    return null;
  }
}