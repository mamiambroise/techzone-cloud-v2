import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateErpDto } from './dto/create-erp.dto';
import { UpdateErpDto } from './dto/update-erp.dto';
import { ERPRegistry } from '../generated/prisma/client';
import { ErpError } from '../erp-adapter/erp-error';
import { encryptErpKey } from './erp-credentials';
import { validateDolibarrUrl } from '../erp-adapter/dolibarr/dolibarr-destination';
import { randomUUID } from 'node:crypto';

export interface TenantContext {
  tenantId?: string;
  actorId?: string;
  permissions?: string[];
  isSuperAdmin?: boolean;
}

@Injectable()
export class ErpRegistryService {
  private readonly logger = new Logger(ErpRegistryService.name);

  constructor(private readonly prisma: PrismaService) {}

  private requireTenant(ctx?: TenantContext): string {
    const tenantId = ctx?.tenantId;
    if (!tenantId) {
      throw new ErpError(
        'TENANT_REQUIRED: tenantId manquant dans le contexte',
        400,
        'TENANT_REQUIRED',
      );
    }
    return tenantId;
  }

  async create(dto: CreateErpDto, ctx?: TenantContext): Promise<ERPRegistry> {
    const tenantId = this.requireTenant(ctx);
    validateDolibarrUrl(dto.url);
    this.logger.log(`Creation ERP: ${dto.code} [tenant=${tenantId}]`);

    const existing = await this.prisma.eRPRegistry.findUnique({
      where: { tenantId_code: { tenantId, code: dto.code } },
    });

    if (existing) {
      throw new ConflictException(`Code ERP "${dto.code}" deja existant pour ce tenant`);
    }

    const data: any = {
      tenantId,
      code: dto.code,
      nom: dto.nom,
      type: dto.type,
      url: dto.url,
    };
    data.capabilities = { environment: dto.environment || 'development', entity: dto.entity || 1,
      ...(dto.apiKey?.trim() ? { encryptedApiKey: encryptErpKey(dto.apiKey.trim(), tenantId) } : {}) };

    const erp = await this.prisma.$transaction(async tx => {
      const created = await tx.eRPRegistry.create({ data });
      await tx.auditEvent.create({ data: { tenantId, actorId: ctx?.actorId, traceId: randomUUID(), action: 'ERP_CONNECTOR_CREATED', targetType: 'ERP_CONNECTOR', targetId: created.id, result: 'SUCCESS' } });
      return created;
    });
    this.logger.log(`ERP cree: ${erp.id}`);
    return erp;
  }

  async getAll(ctx?: TenantContext): Promise<ERPRegistry[]> {
    const tenantId = this.requireTenant(ctx);
    this.logger.log(`Liste des ERP [tenant=${tenantId}]`);
    return this.prisma.eRPRegistry.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOne(id: string, ctx?: TenantContext): Promise<ERPRegistry> {
    const tenantId = this.requireTenant(ctx);
    this.logger.log(`Recuperation ERP: ${id} [tenant=${tenantId}]`);
    const erp = await this.prisma.eRPRegistry.findUnique({
      where: { id },
      include: { entityMappings: true },
    });
    if (!erp || erp.tenantId !== tenantId) {
      throw new ErpError(
        `ERP "${id}" non trouve pour le tenant ${tenantId}`,
        404,
        'NOT_FOUND',
        { id, tenantId },
      );
    }
    return erp;
  }

  async getByCode(code: string, ctx?: TenantContext): Promise<ERPRegistry> {
    const tenantId = this.requireTenant(ctx);
    this.logger.log(`Recuperation ERP par code: ${code} [tenant=${tenantId}]`);
    const erp = await this.prisma.eRPRegistry.findUnique({
      where: { tenantId_code: { tenantId, code } },
    });
    if (!erp) {
      throw new ErpError(
        `ERP avec le code "${code}" non trouve pour le tenant ${tenantId}`,
        404,
        'NOT_FOUND',
        { code, tenantId },
      );
    }
    return erp;
  }

  async update(id: string, dto: UpdateErpDto, ctx?: TenantContext): Promise<ERPRegistry> {
    const tenantId = this.requireTenant(ctx);
    this.logger.log(`Mise a jour ERP: ${id} [tenant=${tenantId}]`);
    const existing = await this.getOne(id, ctx);
    if (dto.url !== undefined) validateDolibarrUrl(dto.url);

    const data: any = {};
    if (dto.nom !== undefined) data.nom = dto.nom;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.url !== undefined) data.url = dto.url;
    if (dto.status !== undefined) data.status = dto.status.toUpperCase();
    const capabilities = { ...((existing.capabilities || {}) as Record<string, any>) };
    if (dto.environment !== undefined) capabilities.environment = dto.environment;
    if (dto.entity !== undefined) capabilities.entity = dto.entity;
    if (dto.apiKey?.trim()) {
      capabilities.encryptedApiKey = encryptErpKey(dto.apiKey.trim(), tenantId);
      delete capabilities.apiKey;
    }
    data.capabilities = capabilities;

    const erp = await this.prisma.$transaction(async tx => {
      const updated = await tx.eRPRegistry.update({ where: { id, tenantId }, data });
      await tx.auditEvent.create({ data: { tenantId, actorId: ctx?.actorId, traceId: randomUUID(), action: dto.apiKey?.trim() ? 'ERP_CREDENTIAL_CHANGED' : 'ERP_CONNECTOR_CONFIGURED', targetType: 'ERP_CONNECTOR', targetId: id, result: 'SUCCESS', metadata: { status: updated.status } } });
      return updated;
    });
    this.logger.log(`ERP mis a jour: ${erp.id}`);
    return erp;
  }

  async remove(id: string, ctx?: TenantContext): Promise<void> {
    const tenantId = this.requireTenant(ctx);
    this.logger.log(`Suppression ERP: ${id} [tenant=${tenantId}]`);
    await this.getOne(id, ctx);
    await this.prisma.$transaction(async tx => {
      await tx.eRPRegistry.delete({ where: { id, tenantId } });
      await tx.auditEvent.create({ data: { tenantId, actorId: ctx?.actorId, traceId: randomUUID(), action: 'ERP_CONNECTOR_DELETED', targetType: 'ERP_CONNECTOR', targetId: id, result: 'SUCCESS' } });
    });
    this.logger.log(`ERP supprime: ${id}`);
  }

  async getActiveForTenant(ctx?: TenantContext): Promise<ERPRegistry> {
    const tenantId = this.requireTenant(ctx);
    this.logger.log(`Resolution ERP actif [tenant=${tenantId}]`);
    const erp = await this.prisma.eRPRegistry.findFirst({
      where: { tenantId, status: { in: ['ACTIVE', 'active'] } },
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
    });
    if (!erp) {
      throw new ErpError(
        `ERP_INSTANCE_NOT_CONFIGURED: Aucun ERP actif trouve pour le tenant ${tenantId}`,
        503,
        'ERP_INSTANCE_NOT_CONFIGURED',
        { tenantId },
      );
    }
    return erp;
  }

  async recordCheck(id: string | undefined, status: string, ctx: TenantContext) {
    const registry = id ? await this.getOne(id, ctx) : await this.getActiveForTenant(ctx);
    await this.prisma.auditEvent.create({ data: { tenantId: this.requireTenant(ctx), actorId: ctx.actorId, traceId: randomUUID(), action: 'ERP_CONNECTOR_TESTED', targetType: 'ERP_CONNECTOR', targetId: registry.id, result: status } });
  }

  async history(id: string, ctx: TenantContext) {
    await this.getOne(id, ctx);
    return this.prisma.auditEvent.findMany({ where: { tenantId: this.requireTenant(ctx), targetType: 'ERP_CONNECTOR', targetId: id }, take: 50, orderBy: { createdAt: 'desc' }, select: { id: true, action: true, result: true, traceId: true, createdAt: true } });
  }
}
