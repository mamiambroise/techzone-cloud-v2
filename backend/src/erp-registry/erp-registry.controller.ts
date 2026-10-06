import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, Logger, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ErpRegistryService, TenantContext } from './erp-registry.service';
import { ExternalResourceLinkService } from './external-resource-link.service';
import { ErpCapabilityService } from '../erp-adapter/capabilities/erp-capability.service';
import { CreateErpDto } from './dto/create-erp.dto';
import { UpdateErpDto } from './dto/update-erp.dto';
import { CurrentUser } from '../iam/decorators/current-user.decorator';
import type { IamAuthContext } from '../iam/decorators/current-user.decorator';
import { Permissions } from '../iam/iam-permissions.guard';
import { ERP_READ, ERP_WRITE } from '../iam/iam.constants';
import { safeErpRegistry } from './erp-credentials';

function toTenantContext(principal: IamAuthContext): TenantContext {
  return { tenantId: principal.tenantId ?? undefined, actorId: principal.userId };
}

@ApiTags('erp-registry')
@Controller('api/erp-registry')
export class ErpRegistryController {
  private readonly logger = new Logger(ErpRegistryController.name);

  constructor(
    private readonly service: ErpRegistryService,
    private readonly links: ExternalResourceLinkService,
    private readonly capabilities: ErpCapabilityService,
  ) {}

  @Post()
  @Permissions(ERP_WRITE)
  @ApiOperation({ summary: 'Creer un ERP dans PostgreSQL' })
  @ApiResponse({ status: 201, description: 'ERP cree' })
  @ApiResponse({ status: 409, description: 'Code deja existant' })
  async create(@Body() dto: CreateErpDto, @CurrentUser() principal: IamAuthContext) {
    this.logger.log(`POST /erp-registry -> ${dto.code} [tenant=${principal.tenantId}]`);
    return safeErpRegistry(await this.service.create(dto, toTenantContext(principal)));
  }

  @Get()
  @Permissions(ERP_READ)
  @ApiOperation({ summary: 'Lister les ERP du tenant courant depuis PostgreSQL' })
  @ApiResponse({ status: 200, description: 'Liste des ERP' })
  async getAll(@CurrentUser() principal: IamAuthContext) {
    this.logger.log(`GET /erp-registry [tenant=${principal.tenantId}]`);
    return (await this.service.getAll(toTenantContext(principal))).map(safeErpRegistry);
  }

  @Get('health')
  @Permissions(ERP_READ)
  @ApiOperation({ summary: 'Sante du connecteur ERP actif du tenant (snapshot, sans appel reseau)' })
  @ApiResponse({ status: 200, description: 'Sante du connecteur' })
  @ApiResponse({ status: 503, description: 'Aucun ERP actif configure' })
  async health(@CurrentUser() principal: IamAuthContext) {
    this.logger.log(`GET /erp-registry/health [tenant=${principal.tenantId}]`);
    return this.capabilities.getHealth(undefined, toTenantContext(principal));
  }

  @Get('links')
  @Permissions(ERP_READ)
  @ApiOperation({ summary: 'Lister les liens de ressources externes du tenant' })
  @ApiResponse({ status: 200, description: 'Liste des liens' })
  async listLinks(@CurrentUser() principal: IamAuthContext, @Query('connectorId') connectorId?: string, @Query('resourceType') resourceType?: string) {
    this.logger.log(`GET /erp-registry/links [tenant=${principal.tenantId}]`);
    return this.links.list(toTenantContext(principal), { connectorId, resourceType });
  }

  @Post('test')
  @Permissions(ERP_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tester la connexion du connecteur ERP actif (sonde reelle Dolibarr + capabilities)' })
  @ApiResponse({ status: 200, description: 'Rapport de connexion' })
  @ApiResponse({ status: 503, description: 'Aucun ERP actif configure' })
  async testActive(@CurrentUser() principal: IamAuthContext) {
    this.logger.log(`POST /erp-registry/test [tenant=${principal.tenantId}]`);
    return this.capabilities.testConnection(undefined, toTenantContext(principal));
  }

  @Get(':id')
  @Permissions(ERP_READ)
  @ApiOperation({ summary: 'Details d un ERP par ID' })
  @ApiParam({ name: 'id', description: 'UUID de l ERP' })
  @ApiResponse({ status: 200, description: 'ERP trouve' })
  @ApiResponse({ status: 404, description: 'ERP non trouve' })
  async getOne(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    this.logger.log(`GET /erp-registry/${id} [tenant=${principal.tenantId}]`);
    return safeErpRegistry(await this.service.getOne(id, toTenantContext(principal)));
  }

  @Get('code/:code')
  @Permissions(ERP_READ)
  @ApiOperation({ summary: 'Details d un ERP par code' })
  @ApiParam({ name: 'code', description: 'Code unique de l ERP' })
  @ApiResponse({ status: 200, description: 'ERP trouve' })
  @ApiResponse({ status: 404, description: 'ERP non trouve' })
  async getByCode(@Param('code') code: string, @CurrentUser() principal: IamAuthContext) {
    this.logger.log(`GET /erp-registry/code/${code} [tenant=${principal.tenantId}]`);
    return safeErpRegistry(await this.service.getByCode(code, toTenantContext(principal)));
  }

  @Put(':id')
  @Permissions(ERP_WRITE)
  @ApiOperation({ summary: 'Modifier un ERP dans PostgreSQL' })
  @ApiParam({ name: 'id', description: 'UUID de l ERP' })
  @ApiResponse({ status: 200, description: 'ERP mis a jour' })
  @ApiResponse({ status: 404, description: 'ERP non trouve' })
  async update(@Param('id') id: string, @Body() dto: UpdateErpDto, @CurrentUser() principal: IamAuthContext) {
    this.logger.log(`PUT /erp-registry/${id} [tenant=${principal.tenantId}]`);
    return safeErpRegistry(await this.service.update(id, dto, toTenantContext(principal)));
  }

  @Delete(':id')
  @Permissions(ERP_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un ERP de PostgreSQL' })
  @ApiParam({ name: 'id', description: 'UUID de l ERP' })
  @ApiResponse({ status: 204, description: 'ERP supprime' })
  @ApiResponse({ status: 404, description: 'ERP non trouve' })
  async remove(@Param('id') id: string, @CurrentUser() principal: IamAuthContext): Promise<void> {
    this.logger.log(`DELETE /erp-registry/${id} [tenant=${principal.tenantId}]`);
    await this.service.remove(id, toTenantContext(principal));
  }

  @Post(':id/test')
  @Permissions(ERP_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tester la connexion d un ERP (sonde reelle Dolibarr + capabilities detectees)' })
  @ApiParam({ name: 'id', description: 'UUID de l ERP' })
  @ApiResponse({ status: 200, description: 'Rapport de connexion' })
  @ApiResponse({ status: 404, description: 'ERP non trouve' })
  async testOne(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    this.logger.log(`POST /erp-registry/${id}/test [tenant=${principal.tenantId}]`);
    return this.capabilities.testConnection(id, toTenantContext(principal));
  }

  @Get(':id/health')
  @Permissions(ERP_READ)
  @ApiOperation({ summary: 'Sante et capabilities d un ERP (snapshot, sans appel reseau)' })
  @ApiParam({ name: 'id', description: 'UUID de l ERP' })
  @ApiResponse({ status: 200, description: 'Sante du connecteur' })
  @ApiResponse({ status: 404, description: 'ERP non trouve' })
  async oneHealth(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    this.logger.log(`GET /erp-registry/${id}/health [tenant=${principal.tenantId}]`);
    return this.capabilities.getHealth(id, toTenantContext(principal));
  }

  @Get(':id/capabilities')
  @Permissions(ERP_READ)
  @ApiOperation({ summary: 'Capabilities ERP reellement detectees chez le fournisseur' })
  @ApiParam({ name: 'id', description: 'UUID de l ERP' })
  @ApiResponse({ status: 200, description: 'Capabilities' })
  @ApiResponse({ status: 404, description: 'ERP non trouve' })
  async oneCapabilities(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    this.logger.log(`GET /erp-registry/${id}/capabilities [tenant=${principal.tenantId}]`);
    return this.capabilities.getCapabilities(id, toTenantContext(principal));
  }

  @Get(':id/links')
  @Permissions(ERP_READ)
  @ApiOperation({ summary: 'Liens de ressources externes d un connecteur' })
  @ApiParam({ name: 'id', description: 'UUID de l ERP' })
  @ApiResponse({ status: 200, description: 'Liste des liens' })
  @ApiResponse({ status: 404, description: 'ERP non trouve' })
  async oneLinks(@Param('id') id: string, @CurrentUser() principal: IamAuthContext, @Query('resourceType') resourceType?: string) {
    this.logger.log(`GET /erp-registry/${id}/links [tenant=${principal.tenantId}]`);
    return this.links.list(toTenantContext(principal), { connectorId: id, resourceType });
  }

  @Delete('links/:id')
  @Permissions(ERP_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un lien de ressource externe' })
  @ApiParam({ name: 'id', description: 'UUID du lien' })
  @ApiResponse({ status: 204, description: 'Lien supprime' })
  @ApiResponse({ status: 404, description: 'Lien non trouve' })
  async removeLink(@Param('id') id: string, @CurrentUser() principal: IamAuthContext): Promise<void> {
    this.logger.log(`DELETE /erp-registry/links/${id} [tenant=${principal.tenantId}]`);
    await this.links.remove(id, toTenantContext(principal));
  }

  @Get(':id/history')
  @Permissions(ERP_READ)
  history(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    return this.service.history(id, toTenantContext(principal));
  }
}
