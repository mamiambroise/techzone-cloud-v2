import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ErpRegistryService, TenantContext } from './erp-registry.service';
import { ExternalResourceLink } from '../generated/prisma/client';
import { ErpError } from '../erp-adapter/erp-error';

export interface ExternalLinkInput {
  connectorId: string;
  resourceType: string;
  localId: string;
  externalId: string;
  externalRef?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface ExternalLinkFilters {
  connectorId?: string;
  resourceType?: string;
  localId?: string;
  externalId?: string;
}

@Injectable()
export class ExternalResourceLinkService {
  private readonly logger = new Logger(ExternalResourceLinkService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly erpRegistry: ErpRegistryService,
  ) {}

  async record(input: ExternalLinkInput, ctx?: TenantContext): Promise<ExternalResourceLink> {
    const tenantId = this.requireTenant(ctx);
    await this.erpRegistry.getOne(input.connectorId, { tenantId, actorId: ctx?.actorId });
    this.logger.log(`External resource link upsert [tenant=${tenantId}] [connector=${input.connectorId}] [type=${input.resourceType}] [local=${input.localId}]`);
    return this.prisma.externalResourceLink.upsert({
      where: {
        tenantId_connectorId_resourceType_localId: {
          tenantId,
          connectorId: input.connectorId,
          resourceType: input.resourceType,
          localId: input.localId,
        },
      },
      create: {
        tenantId,
        connectorId: input.connectorId,
        resourceType: input.resourceType,
        localId: input.localId,
        externalId: input.externalId,
        externalRef: input.externalRef ?? null,
        metadata: (input.metadata ?? undefined) as any,
        lastSyncedAt: new Date(),
      },
      update: {
        externalId: input.externalId,
        externalRef: input.externalRef ?? null,
        metadata: (input.metadata ?? undefined) as any,
        lastSyncedAt: new Date(),
      },
    });
  }

  async findByLocal(resourceType: string, localId: string, connectorId: string | undefined, ctx?: TenantContext): Promise<ExternalResourceLink | null> {
    const tenantId = this.requireTenant(ctx);
    return this.prisma.externalResourceLink.findFirst({
      where: { tenantId, resourceType, localId, ...(connectorId ? { connectorId } : {}) },
    });
  }

  async findByExternal(resourceType: string, externalId: string, connectorId: string | undefined, ctx?: TenantContext): Promise<ExternalResourceLink | null> {
    const tenantId = this.requireTenant(ctx);
    return this.prisma.externalResourceLink.findFirst({
      where: { tenantId, resourceType, externalId, ...(connectorId ? { connectorId } : {}) },
    });
  }

  async list(ctx: TenantContext, filters: ExternalLinkFilters = {}): Promise<ExternalResourceLink[]> {
    const tenantId = this.requireTenant(ctx);
    return this.prisma.externalResourceLink.findMany({
      where: {
        tenantId,
        ...(filters.connectorId ? { connectorId: filters.connectorId } : {}),
        ...(filters.resourceType ? { resourceType: filters.resourceType } : {}),
        ...(filters.localId ? { localId: filters.localId } : {}),
        ...(filters.externalId ? { externalId: filters.externalId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async remove(id: string, ctx?: TenantContext): Promise<void> {
    const tenantId = this.requireTenant(ctx);
    const existing = await this.prisma.externalResourceLink.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new ErpError(`Lien de ressource externe "${id}" non trouve pour le tenant ${tenantId}`, 404, 'NOT_FOUND', { id, tenantId });
    }
    await this.prisma.externalResourceLink.delete({ where: { id, tenantId } });
    await this.prisma.auditEvent.create({
      data: {
        tenantId,
        actorId: ctx?.actorId,
        traceId: randomUUID(),
        action: 'EXTERNAL_RESOURCE_LINK_DELETED',
        targetType: 'EXTERNAL_RESOURCE_LINK',
        targetId: id,
        result: 'SUCCESS',
      },
    });
    this.logger.log(`External resource link supprime: ${id} [tenant=${tenantId}]`);
  }

  private requireTenant(ctx?: TenantContext): string {
    const tenantId = ctx?.tenantId;
    if (!tenantId) {
      throw new ErpError('TENANT_REQUIRED: tenantId manquant dans le contexte', 400, 'TENANT_REQUIRED');
    }
    return tenantId;
  }
}
