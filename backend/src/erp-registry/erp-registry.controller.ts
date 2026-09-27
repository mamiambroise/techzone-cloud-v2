import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Logger, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ErpRegistryService, TenantContext } from './erp-registry.service';
import { CreateErpDto } from './dto/create-erp.dto';
import { UpdateErpDto } from './dto/update-erp.dto';
import { CurrentUser } from '../iam/decorators/current-user.decorator';
import type { IamAuthContext } from '../iam/decorators/current-user.decorator';

function toTenantContext(principal: IamAuthContext): TenantContext {
  return { tenantId: principal.tenantId ?? undefined };
}

@ApiTags('erp-registry')
@Controller('api/erp-registry')
export class ErpRegistryController {
  private readonly logger = new Logger(ErpRegistryController.name);

  constructor(private readonly service: ErpRegistryService) {}

  @Post()
  @ApiOperation({ summary: 'Creer un ERP dans PostgreSQL' })
  @ApiResponse({ status: 201, description: 'ERP cree' })
  @ApiResponse({ status: 409, description: 'Code deja existant' })
  async create(@Body() dto: CreateErpDto, @CurrentUser() principal: IamAuthContext) {
    this.logger.log(`POST /erp-registry -> ${dto.code} [tenant=${principal.tenantId}]`);
    return this.service.create(dto, toTenantContext(principal));
  }

  @Get()
  @ApiOperation({ summary: 'Lister les ERP du tenant courant depuis PostgreSQL' })
  @ApiResponse({ status: 200, description: 'Liste des ERP' })
  async getAll(@CurrentUser() principal: IamAuthContext) {
    this.logger.log(`GET /erp-registry [tenant=${principal.tenantId}]`);
    return this.service.getAll(toTenantContext(principal));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Details d un ERP par ID' })
  @ApiParam({ name: 'id', description: 'UUID de l ERP' })
  @ApiResponse({ status: 200, description: 'ERP trouve' })
  @ApiResponse({ status: 404, description: 'ERP non trouve' })
  async getOne(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    this.logger.log(`GET /erp-registry/${id} [tenant=${principal.tenantId}]`);
    return this.service.getOne(id, toTenantContext(principal));
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Details d un ERP par code' })
  @ApiParam({ name: 'code', description: 'Code unique de l ERP' })
  @ApiResponse({ status: 200, description: 'ERP trouve' })
  @ApiResponse({ status: 404, description: 'ERP non trouve' })
  async getByCode(@Param('code') code: string, @CurrentUser() principal: IamAuthContext) {
    this.logger.log(`GET /erp-registry/code/${code} [tenant=${principal.tenantId}]`);
    return this.service.getByCode(code, toTenantContext(principal));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier un ERP dans PostgreSQL' })
  @ApiParam({ name: 'id', description: 'UUID de l ERP' })
  @ApiResponse({ status: 200, description: 'ERP mis a jour' })
  @ApiResponse({ status: 404, description: 'ERP non trouve' })
  async update(@Param('id') id: string, @Body() dto: UpdateErpDto, @CurrentUser() principal: IamAuthContext) {
    this.logger.log(`PUT /erp-registry/${id} [tenant=${principal.tenantId}]`);
    return this.service.update(id, dto, toTenantContext(principal));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un ERP de PostgreSQL' })
  @ApiParam({ name: 'id', description: 'UUID de l ERP' })
  @ApiResponse({ status: 204, description: 'ERP supprime' })
  @ApiResponse({ status: 404, description: 'ERP non trouve' })
  async remove(@Param('id') id: string, @CurrentUser() principal: IamAuthContext): Promise<void> {
    this.logger.log(`DELETE /erp-registry/${id} [tenant=${principal.tenantId}]`);
    await this.service.remove(id, toTenantContext(principal));
  }
}


