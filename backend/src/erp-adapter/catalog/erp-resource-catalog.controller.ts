import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../iam/decorators/current-user.decorator';
import type { IamAuthContext } from '../../iam/decorators/current-user.decorator';
import { IamAdminGuard } from '../../iam/iam-admin-guard';
import { ERP_READ, IAM_ADMIN } from '../../iam/iam.constants';
import { Permissions } from '../../iam/iam-permissions.guard';
import { ErpResourceCatalogService } from './erp-resource-catalog.service';

@ApiTags('erp-resource-catalog')
@Controller('api/erp/catalog')
export class ErpResourceCatalogController {
  constructor(private readonly catalog: ErpResourceCatalogService) {}

  @Get()
  @Permissions(ERP_READ)
  @ApiOperation({ summary: 'Catalogue ERP effectif pour le tenant courant, sans secret ni appel métier' })
  getCatalog(@CurrentUser() principal: IamAuthContext) {
    return this.catalog.getCatalog({ tenantId: principal.tenantId ?? undefined, actorId: principal.userId, permissions: principal.permissions, isSuperAdmin: principal.isSuperAdmin });
  }

  @Get('policy')
  @Permissions(IAM_ADMIN)
  @UseGuards(IamAdminGuard)
  @ApiOperation({ summary: 'Politique plateforme des ressources ERP' })
  getPolicy() {
    return this.catalog.getPolicy();
  }

  @Patch('policy/:resourceKey')
  @Permissions(IAM_ADMIN)
  @UseGuards(IamAdminGuard)
  @ApiOperation({ summary: 'Autoriser ou interdire une ressource ERP au niveau plateforme' })
  setPolicy(
    @Param('resourceKey') resourceKey: string,
    @Body() body: { platformAllowed?: unknown },
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.catalog.setPlatformAllowed(resourceKey, body.platformAllowed as boolean, principal.userId);
  }
}
