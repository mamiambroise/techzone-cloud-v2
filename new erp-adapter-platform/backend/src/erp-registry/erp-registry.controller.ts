import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Logger, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ErpRegistryService } from './erp-registry.service';
import { CreateErpDto } from './dto/create-erp.dto';
import { UpdateErpDto } from './dto/update-erp.dto';

@ApiTags('erp-registry')
@Controller('erp-registry')
export class ErpRegistryController {
  private readonly logger = new Logger(ErpRegistryController.name);

  constructor(private readonly service: ErpRegistryService) {}

  @Post()
  @ApiOperation({ summary: 'Creer un ERP dans PostgreSQL' })
  @ApiResponse({ status: 201, description: 'ERP cree' })
  @ApiResponse({ status: 409, description: 'Code deja existant' })
  async create(@Body() dto: CreateErpDto) {
    this.logger.log(`POST /erp-registry -> ${dto.code}`);
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les ERP depuis PostgreSQL' })
  @ApiResponse({ status: 200, description: 'Liste des ERP' })
  async getAll() {
    this.logger.log('GET /erp-registry');
    return this.service.getAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Details d un ERP par ID' })
  @ApiParam({ name: 'id', description: 'UUID de l ERP' })
  @ApiResponse({ status: 200, description: 'ERP trouve' })
  @ApiResponse({ status: 404, description: 'ERP non trouve' })
  async getOne(@Param('id') id: string) {
    this.logger.log(`GET /erp-registry/${id}`);
    return this.service.getOne(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Details d un ERP par code' })
  @ApiParam({ name: 'code', description: 'Code unique de l ERP' })
  @ApiResponse({ status: 200, description: 'ERP trouve' })
  @ApiResponse({ status: 404, description: 'ERP non trouve' })
  async getByCode(@Param('code') code: string) {
    this.logger.log(`GET /erp-registry/code/${code}`);
    return this.service.getByCode(code);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier un ERP dans PostgreSQL' })
  @ApiParam({ name: 'id', description: 'UUID de l ERP' })
  @ApiResponse({ status: 200, description: 'ERP mis a jour' })
  @ApiResponse({ status: 404, description: 'ERP non trouve' })
  async update(@Param('id') id: string, @Body() dto: UpdateErpDto) {
    this.logger.log(`PUT /erp-registry/${id}`);
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un ERP de PostgreSQL' })
  @ApiParam({ name: 'id', description: 'UUID de l ERP' })
  @ApiResponse({ status: 204, description: 'ERP supprime' })
  @ApiResponse({ status: 404, description: 'ERP non trouve' })
  async remove(@Param('id') id: string): Promise<void> {
    this.logger.log(`DELETE /erp-registry/${id}`);
    await this.service.remove(id);
  }
}
