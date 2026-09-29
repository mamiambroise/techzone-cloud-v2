import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { PrismaService } from '../prisma/prisma.service';
import { IamPrincipal } from './principal.decorator';
import { IamLogger } from './iam.logger';
import { TENANT_RESOURCE_KEY, TENANT_OPTIONAL_KEY, TenantResourceConfig } from './tenant-resource.decorator';
import { IS_PUBLIC_KEY } from './iam.constants';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) return true;
    const request = context.switchToHttp().getRequest();

    const principal: IamPrincipal | undefined = request.iamPrincipal;

    if (!principal) {
      throw new ForbiddenException('Authentication required');
    }

    if (this.reflector.getAllAndOverride<boolean>(TENANT_OPTIONAL_KEY, targets)) return true;

    if (
      principal.tenantId === null ||
      principal.tenantId === undefined ||
      principal.tenantId === 'legacy'
    ) {
      if (principal.isSuperAdmin) {
        return true;
      }

      IamLogger.tenantDeny(request, principal, undefined, 'NO_TENANT_ON_PRINCIPAL');
      throw new ForbiddenException('Access denied: no tenant context');
    }

    const resourceConfig: TenantResourceConfig | undefined =
      this.reflector.getAllAndOverride<TenantResourceConfig>(
        TENANT_RESOURCE_KEY,
        targets,
      );

    if (!resourceConfig) {
      return true;
    }

    const resourceTenantId = await this.resolveResourceTenantId(
      request,
      resourceConfig,
    );

    if (resourceTenantId === null || resourceTenantId === undefined) {
      return true;
    }

    if (resourceTenantId !== principal.tenantId) {
      IamLogger.tenantDeny(
        request,
        principal,
        resourceTenantId,
        'TENANT_MISMATCH',
      );
      throw new ForbiddenException('Access denied: resource belongs to a different tenant');
    }

    return true;
  }

  private async resolveResourceTenantId(
    request: any,
    config: TenantResourceConfig,
  ): Promise<string | null> {
    const params = request.params ?? {};
    const idParam = config.idParam ?? 'id';
    const resourceId = params[idParam];

    if (!resourceId) {
      return null;
    }

    const table = config.table;
    const idColumn = config.idColumn ?? 'id';
    const tenantColumn = config.tenantColumn ?? 'tenantId';

    try {
      const query = {
        where: { [idColumn]: resourceId },
        select: { [tenantColumn]: true },
      };

      const modelDelegate = (this.prisma as any)[table];
      if (!modelDelegate) {
        return null;
      }

      const result = await modelDelegate.findUnique(query);
      if (!result) {
        return null;
      }

      const tenantValue = (result as Record<string, unknown>)[tenantColumn];
      return tenantValue !== null && tenantValue !== undefined
        ? String(tenantValue)
        : null;
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to resolve tenant for resource ${table}`,
      );
    }
  }
}
