import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateErpDto } from './dto/create-erp.dto';
import { UpdateErpDto } from './dto/update-erp.dto';
import { ERPRegistry } from '@prisma/client';
import { ErpError } from '../erp-adapter/erp-error';

export interface TenantContext {
  tenantId?: string;
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
    if (dto.environment) {
      data.capabilities = { environment: dto.environment };
    }

    const erp = await this.prisma.eRPRegistry.create({ data });
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
    await this.getOne(id, ctx);

    const data: any = {};
    if (dto.nom !== undefined) data.nom = dto.nom;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.url !== undefined) data.url = dto.url;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.environment !== undefined) data.capabilities = { environment: dto.environment };

    const erp = await this.prisma.eRPRegistry.update({
      where: { id },
      data,
    });
    this.logger.log(`ERP mis a jour: ${erp.id}`);
    return erp;
  }

  async remove(id: string, ctx?: TenantContext): Promise<void> {
    const tenantId = this.requireTenant(ctx);
    this.logger.log(`Suppression ERP: ${id} [tenant=${tenantId}]`);
    await this.getOne(id, ctx);
    await this.prisma.eRPRegistry.delete({
      where: { id },
    });
    this.logger.log(`ERP supprime: ${id}`);
  }

  async getActiveForTenant(ctx?: TenantContext): Promise<ERPRegistry> {
    const tenantId = this.requireTenant(ctx);
    this.logger.log(`Resolution ERP actif [tenant=${tenantId}]`);
    const erp = await this.prisma.eRPRegistry.findFirst({
      where: { tenantId, status: 'ACTIVE' },
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
}