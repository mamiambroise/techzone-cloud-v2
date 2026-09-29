import { Logger } from '@nestjs/common';

/**
 * Security-safe logger.
 *
 * NE JAMAIS logger :
 * - tokens (access/refresh)
 * - JWT complet
 * - mot de passe
 * - client secret / API key
 *
 * Événements autorisés :
 * - userId, tenantId, action, result, traceId, timestamp
 */
export class IamLogger {
  private static readonly logger = new Logger('IAM');

  static authSuccess(request: any, principal: { userId: string; tenantId: string | null }): void {
    IamLogger.logger.log(
      JSON.stringify({
        event: 'AUTH_SUCCESS',
        userId: principal.userId,
        tenantId: principal.tenantId,
        method: request.method,
        path: request.path,
        ip: IamLogger.safeIp(request),
      }),
    );
  }

  static authFailure(
    request: any,
    code: string,
    reason: string,
  ): void {
    IamLogger.logger.warn(
      JSON.stringify({
        event: 'AUTH_FAILURE',
        code,
        reason,
        method: request.method,
        path: request.path,
        ip: IamLogger.safeIp(request),
      }),
    );
  }

  static tenantDeny(
    request: any,
    principal: { userId: string; tenantId: string | null },
    resourceTenantId: string | undefined,
    reason: string,
  ): void {
    IamLogger.logger.warn(
      JSON.stringify({
        event: 'TENANT_DENY',
        userId: principal.userId,
        principalTenantId: principal.tenantId,
        resourceTenantId,
        reason,
        method: request.method,
        path: request.path,
      }),
    );
  }

  static permissionDeny(
    request: any,
    principal: { userId: string; tenantId: string | null },
    permission: string,
  ): void {
    IamLogger.logger.warn(
      JSON.stringify({
        event: 'PERMISSION_DENY',
        userId: principal.userId,
        tenantId: principal.tenantId,
        permission,
        method: request.method,
        path: request.path,
      }),
    );
  }

  static secretAccess(
    request: any,
    principal: { userId: string; tenantId: string | null },
    configId: string,
    masked: boolean,
  ): void {
    IamLogger.logger.log(
      JSON.stringify({
        event: 'SECRET_CONFIG_ACCESS',
        userId: principal.userId,
        tenantId: principal.tenantId,
        configId,
        masked,
        method: request.method,
        path: request.path,
      }),
    );
  }

  private static safeIp(request: any): string {
    const ip =
      request.ip ||
      request.headers?.['x-forwarded-for'] ||
      request.connection?.remoteAddress ||
      'unknown';
    return String(ip).split(',')[0].trim();
  }
}