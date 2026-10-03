/**
 * UI Builder — contrôleur REST (UI-BUILDER CDC V1).
 *
 * Sécurité : IamJwtGuard global (APP_GUARD) + BmTenantGuard (tenant actif
 * obligatoire) + TenantGuard. Le service filtre systématiquement par
 * principal.tenantId : aucun accès cross-tenant possible, y compris indirect
 * (ApplicationVersion résolue dans le tenant).
 *
 * Routes (préfixe /api/ui-builder) :
 *   GET    /overview/:applicationVersionId
 *   GET    /pages/:applicationVersionId
 *   POST   /pages
 *   PATCH  /pages/:pageId
 *   DELETE /pages/:pageId
 *   POST   /pages/:applicationVersionId/reorder
 *   GET    /uidefinition/:applicationVersionId
 *   POST   /validate/:applicationVersionId
 *   GET    /theme/:applicationVersionId
 *   PUT    /theme
 *   GET    /business-context/:applicationVersionId   (entities+fields BM pour bindings/forms)
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { UiBuilderService } from './ui-builder.service';
import {
  CreateUiPageDto,
  ReorderUiPagesDto,
  UpdateUiPageDto,
  UpsertUiThemeDto,
} from './dto/ui-page.dto';
import { CurrentPrincipal } from '../../iam/principal.decorator';
import type { IamPrincipal } from '../../iam/principal.decorator';
import { TenantGuard } from '../../iam/tenant.guard';
import { TenantResource } from '../../iam/tenant-resource.decorator';
import { BmTenantGuard } from '../business-manager/bm-tenant.guard';
import { RequirePermission } from '../../iam/permission.decorator';
import { UI_BUILDER_READ, UI_BUILDER_VALIDATE, UI_BUILDER_WRITE } from '../../iam/iam.constants';

const UUID = new ParseUUIDPipe({ version: '4' });

@TenantResource({ table: 'ui_page', idParam: 'pageId' })
@UseGuards(BmTenantGuard, TenantGuard)
@Controller('api/ui-builder')
export class UiBuilderController {
  constructor(private readonly uiBuilderService: UiBuilderService) {}

  // ---------- Overview ----------

  @Get('overview/:applicationVersionId')
  @RequirePermission(UI_BUILDER_READ)
  getOverview(
    @Param('applicationVersionId', UUID) applicationVersionId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.uiBuilderService.getOverview(applicationVersionId, principal.tenantId);
  }

  // ---------- Pages ----------

  @Get('pages/:applicationVersionId')
  @RequirePermission(UI_BUILDER_READ)
  listPages(
    @Param('applicationVersionId', UUID) applicationVersionId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.uiBuilderService.listPages(applicationVersionId, principal.tenantId);
  }

  @Post('pages')
  @RequirePermission(UI_BUILDER_WRITE)
  createPage(@Body() dto: CreateUiPageDto, @CurrentPrincipal() principal: IamPrincipal) {
    return this.uiBuilderService.createPage(dto, principal.tenantId, principal.userId);
  }

  @Patch('pages/:pageId')
  @RequirePermission(UI_BUILDER_WRITE)
  updatePage(
    @Param('pageId', UUID) pageId: string,
    @Body() dto: UpdateUiPageDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.uiBuilderService.updatePage(pageId, dto, principal.tenantId, principal.userId);
  }

  @Delete('pages/:pageId')
  @RequirePermission(UI_BUILDER_WRITE)
  deletePage(
    @Param('pageId', UUID) pageId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.uiBuilderService.deletePage(pageId, principal.tenantId, principal.userId);
  }

  @Post('pages/:applicationVersionId/reorder')
  @RequirePermission(UI_BUILDER_WRITE)
  reorderPages(
    @Param('applicationVersionId', UUID) applicationVersionId: string,
    @Body() dto: ReorderUiPagesDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.uiBuilderService.reorderPages(applicationVersionId, dto, principal.tenantId, principal.userId);
  }

  // ---------- UI Definition ----------

  @Get('uidefinition/:applicationVersionId')
  @RequirePermission(UI_BUILDER_READ)
  getUiDefinition(
    @Param('applicationVersionId', UUID) applicationVersionId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.uiBuilderService.getUiDefinition(applicationVersionId, principal.tenantId);
  }

  // ---------- Validation ----------

  @Post('validate/:applicationVersionId')
  @RequirePermission(UI_BUILDER_VALIDATE)
  validate(
    @Param('applicationVersionId', UUID) applicationVersionId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.uiBuilderService.validate(applicationVersionId, principal.tenantId, principal.userId);
  }

  // ---------- Theme ----------

  @Get('theme/:applicationVersionId')
  @RequirePermission(UI_BUILDER_READ)
  getTheme(
    @Param('applicationVersionId', UUID) applicationVersionId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.uiBuilderService.getTheme(applicationVersionId, principal.tenantId);
  }

  @Put('theme')
  @RequirePermission(UI_BUILDER_WRITE)
  upsertTheme(@Body() dto: UpsertUiThemeDto, @CurrentPrincipal() principal: IamPrincipal) {
    return this.uiBuilderService.upsertTheme(dto, principal.tenantId, principal.userId);
  }

  // ---------- Business context (bindings BM) ----------

  @Get('business-context/:applicationVersionId')
  @RequirePermission(UI_BUILDER_READ)
  async getBusinessContext(
    @Param('applicationVersionId', UUID) applicationVersionId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.uiBuilderService.getBusinessContext(applicationVersionId, principal.tenantId);
  }
}
