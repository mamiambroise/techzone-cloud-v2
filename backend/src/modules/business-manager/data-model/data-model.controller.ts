import { BmTenantGuard } from '../bm-tenant.guard';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Delete,
  UseGuards,
} from '@nestjs/common';

import { DataModelService } from './data-model.service';
import { CurrentPrincipal } from '../../../iam/principal.decorator';
import type { IamPrincipal } from '../../../iam/principal.decorator';
import { TenantResource } from '../../../iam/tenant-resource.decorator';
import { TenantGuard } from '../../../iam/tenant.guard';

import {
  CreateEntityDto,
  CreateFieldDto,
  CreateRelationDto,
  CreateConstraintDto,
  CreateIndexDto,
  CreateFieldValidationDto,
  CreateComputedFieldDto,
  UpdateEntityDto,
  UpdateFieldDto,
} from './dto/create-data-model.dto';

@TenantResource({ table: 'bm_entity', idParam: 'entityId' })
@UseGuards(BmTenantGuard, TenantGuard)
@Controller('api/business-manager/data-model')
export class DataModelController {
  constructor(private readonly dataModelService: DataModelService) {}

  // === Entities ===

  @Get(':versionId/entities')
  findAllEntities(
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.dataModelService.findAllEntities(versionId, principal.tenantId);
  }

  @Post(':versionId/entities')
  createEntity(
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @Body() dto: CreateEntityDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.dataModelService.createEntity(versionId, dto, principal.tenantId);
  }

  @Get('entities/:entityId')
  findOneEntity(
    @Param('entityId', new ParseUUIDPipe()) entityId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.dataModelService.findOneEntity(entityId, principal.tenantId);
  }

  @Patch('entities/:entityId')
  updateEntity(
    @Param('entityId', new ParseUUIDPipe()) entityId: string,
    @Body() dto: UpdateEntityDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.dataModelService.updateEntity(entityId, dto, principal.tenantId);
  }

  @Post('entities/:entityId/archive')
  archiveEntity(
    @Param('entityId', new ParseUUIDPipe()) entityId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.dataModelService.archiveEntity(entityId, principal.tenantId);
  }

  @Get(':versionId/schema')
  getSchema(
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.dataModelService.getEntitySchema(versionId, principal.tenantId);
  }

  @Get(':versionId/dependencies')
  getDependencyGraph(
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.dataModelService.getDependencyGraph(versionId, principal.tenantId);
  }

  // === Fields ===

  @Post('entities/:entityId/fields')
  createField(
    @Param('entityId', new ParseUUIDPipe()) entityId: string,
    @Body() dto: CreateFieldDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.dataModelService.createField(entityId, dto, principal.tenantId);
  }

  @Get('entities/:entityId/fields')
  findFieldsByEntity(
    @Param('entityId', new ParseUUIDPipe()) entityId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.dataModelService.findFieldsByEntity(entityId, principal.tenantId);
  }

  @Patch('fields/:fieldId')
  updateField(
    @Param('fieldId', new ParseUUIDPipe()) fieldId: string,
    @Body() dto: UpdateFieldDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.dataModelService.updateField(fieldId, dto, principal.tenantId);
  }

  @Delete('fields/:fieldId')
  deleteField(
    @Param('fieldId', new ParseUUIDPipe()) fieldId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.dataModelService.deleteField(fieldId, principal.tenantId);
  }

  // === Relations ===

  @Post(':versionId/relations')
  createRelation(
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @Body() dto: CreateRelationDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.dataModelService.createRelation(versionId, dto, principal.tenantId);
  }

  @Get(':versionId/relations')
  findRelationsByVersion(
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.dataModelService.findRelationsByVersion(versionId, principal.tenantId);
  }

  // === Constraints ===

  @Post('entities/:entityId/constraints')
  createConstraint(
    @Param('entityId', new ParseUUIDPipe()) entityId: string,
    @Body() dto: CreateConstraintDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.dataModelService.createConstraint(entityId, dto, principal.tenantId);
  }

  // === Indexes ===

  @Post('entities/:entityId/indexes')
  createIndex(
    @Param('entityId', new ParseUUIDPipe()) entityId: string,
    @Body() dto: CreateIndexDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.dataModelService.createIndex(entityId, dto, principal.tenantId);
  }

  // === Validations ===

  @Post('field-validations')
  createFieldValidation(
    @Body() dto: CreateFieldValidationDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.dataModelService.createFieldValidation(dto, principal.tenantId);
  }

  // === Computed Fields ===

  @Post(':versionId/entities/:entityId/computed-fields')
  createComputedField(
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @Param('entityId', new ParseUUIDPipe()) entityId: string,
    @Body() dto: CreateComputedFieldDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.dataModelService.createComputedField(versionId, entityId, dto, principal.tenantId);
  }
}
