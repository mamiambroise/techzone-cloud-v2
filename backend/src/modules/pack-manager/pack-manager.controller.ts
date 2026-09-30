<<<<<<< HEAD
import { ParseUUIDPipe } from '@nestjs/common';
import { BmTenantGuard } from '../business-manager/bm-tenant.guard';
import { CurrentPrincipal } from '../../iam/principal.decorator';
import type { IamPrincipal } from '../../iam/principal.decorator';
import { RequirePermission } from '../../iam/permission.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
=======
/**
 * Pack Manager — contrôleur REST (PM-CDC-00 §22 : routes et enveloppe standard).
 *
 * Sécurité :
 * - IamJwtGuard global (auth) + TenantGuard (contexte tenant obligatoire) ;
 * - TenantResource : vérifie que la ressource ciblée par :id appartient au tenant du principal ;
 * - RequirePermission : permissions pack.* du principal IAM (deny by default).
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
>>>>>>> dc5feb88fd597836d806457a7b2a50727b017d02
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
<<<<<<< HEAD
import { PackManagerService } from './pack-manager.service';

type Input = Record<string, unknown>;

@Controller('api/pack-manager')
@UseGuards(BmTenantGuard)
export class PackManagerController {
  constructor(private readonly service: PackManagerService) {}

  @Patch('capabilities/:id')
  @RequirePermission('pack.capability.update')
  updateCapability(@Param('id',new ParseUUIDPipe()) id: string,@Body() input: Input,@CurrentPrincipal() user: IamPrincipal) { return this.service.atomic('updateCapability',[id,input,user]); }

  @Post('packs/:id/duplicate')
  @RequirePermission('pack.create')
  duplicate(@Param('id',new ParseUUIDPipe()) id: string,@Body() input: Input,@CurrentPrincipal() user: IamPrincipal) { return this.service.atomic('duplicatePack',[id,input,user]); }

  @Get('registry')
  @RequirePermission('pack.read')
  registry(@CurrentPrincipal() user: IamPrincipal) { return this.service.publishedVersions(user); }

  @Post('versions/:id/clone')
  @RequirePermission('pack.version.create')
  clone(@Param('id', new ParseUUIDPipe()) id: string, @Body() input: Input, @CurrentPrincipal() user: IamPrincipal) { return this.service.atomic('cloneVersion', [id, input, user]); }

  @Get('versions/:id/compare/:otherId')
  @RequirePermission('pack.version.read')
  compare(@Param('id', new ParseUUIDPipe()) id: string, @Param('otherId', new ParseUUIDPipe()) otherId: string, @CurrentPrincipal() user: IamPrincipal) { return this.service.compareVersions(id, otherId, user); }

  @Patch('resources/:kind/:id')
  @RequirePermission('pack.update')
  updateResource(@Param('kind') kind: string, @Param('id', new ParseUUIDPipe()) id: string, @Body() input: Input, @CurrentPrincipal() user: IamPrincipal) { return this.service.atomic('updateResource', [kind, id, input, user]); }

  @Get('dashboard')
  @RequirePermission('pack.read')
  dashboard(@CurrentPrincipal() user: IamPrincipal) {
    return this.service.dashboard(user);
  }

  @Get('dashboard/attention')
  @RequirePermission('pack.read')
  async attention(@CurrentPrincipal() user: IamPrincipal) {
    return (await this.service.dashboard(user)).counters;
  }

  @Get('dashboard/activity')
  @RequirePermission('pack.read')
  async activity(@CurrentPrincipal() user: IamPrincipal) {
    return (await this.service.dashboard(user)).activity;
  }

  @Get('packs')
  @RequirePermission('pack.read')
  packs(@Query() query: Input, @CurrentPrincipal() user: IamPrincipal) {
    return this.service.listPacks(user, query);
  }

  @Post('packs')
  @RequirePermission('pack.create')
  createPack(@Body() input: Input, @CurrentPrincipal() user: IamPrincipal) {
    return this.service.atomic('createPack', [input, user]);
  }

  @Get('packs/:id')
  @RequirePermission('pack.read')
  pack(@Param('id', new ParseUUIDPipe()) id: string, @CurrentPrincipal() user: IamPrincipal) {
    return this.service.getPack(id, user);
  }

  @Patch('packs/:id')
  @RequirePermission('pack.update')
  updatePack(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: Input,
    @CurrentPrincipal() user: IamPrincipal,
  ) {
    return this.service.atomic('updatePack', [id, input, user]);
  }

  @Post('packs/:id/archive')
  @RequirePermission('pack.archive')
  archivePack(@Param('id', new ParseUUIDPipe()) id: string, @CurrentPrincipal() user: IamPrincipal) {
    return this.service.atomic('archivePack', [id, user]);
  }

  @Post('packs/:id/restore')
  @RequirePermission('pack.restore')
  restorePack(@Param('id', new ParseUUIDPipe()) id: string, @CurrentPrincipal() user: IamPrincipal) {
    return this.service.atomic('restorePack', [id, user]);
  }

  @Get('packs/:packId/versions')
  @RequirePermission('pack.version.read')
  versions(@Param('packId', new ParseUUIDPipe()) packId: string, @CurrentPrincipal() user: IamPrincipal) {
    return this.service.listVersions(packId, user);
  }

  @Post('packs/:packId/versions')
  @RequirePermission('pack.version.create')
  createVersion(
    @Param('packId', new ParseUUIDPipe()) packId: string,
    @Body() input: Input,
    @CurrentPrincipal() user: IamPrincipal,
  ) {
    return this.service.atomic('createVersion', [packId, input, user]);
  }

  @Get('versions/:id')
  @RequirePermission('pack.version.read')
  version(@Param('id', new ParseUUIDPipe()) id: string, @CurrentPrincipal() user: IamPrincipal) {
    return this.service.getVersion(id, user);
  }

  @Patch('versions/:id')
  @RequirePermission('pack.version.update')
  updateVersion(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: Input,
    @CurrentPrincipal() user: IamPrincipal,
  ) {
    return this.service.atomic('updateVersion', [id, input, user]);
  }

  @Get('versions/:versionId/modules')
  @RequirePermission('pack.module.read')
  modules(@Param('versionId', new ParseUUIDPipe()) id: string, @CurrentPrincipal() user: IamPrincipal) {
    return this.service.listModules(id, user);
  }

  @Post('versions/:versionId/modules')
  @RequirePermission('pack.module.create')
  addModule(
    @Param('versionId', new ParseUUIDPipe()) id: string,
    @Body() input: Input,
    @CurrentPrincipal() user: IamPrincipal,
  ) {
    return this.service.atomic('addModule', [id, input, user]);
  }

  @Get('versions/:versionId/features')
  @RequirePermission('pack.feature.read')
  features(@Param('versionId', new ParseUUIDPipe()) id: string, @CurrentPrincipal() user: IamPrincipal) {
    return this.service.listFeatures(id, user);
  }

  @Post('versions/:versionId/features')
  @RequirePermission('pack.feature.create')
  addFeature(
    @Param('versionId', new ParseUUIDPipe()) id: string,
    @Body() input: Input,
    @CurrentPrincipal() user: IamPrincipal,
  ) {
    return this.service.atomic('addFeature', [id, input, user]);
  }

  @Get('capabilities')
  @RequirePermission('pack.capability.read')
  capabilities(@CurrentPrincipal() user: IamPrincipal) {
    return this.service.listCapabilities(user);
  }

  @Post('capabilities')
  @RequirePermission('pack.capability.create')
  addCapability(@Body() input: Input, @CurrentPrincipal() user: IamPrincipal) {
    return this.service.atomic('createCapability', [input, user]);
  }

  @Post('features/:featureId/capabilities')
  @RequirePermission('pack.capability.attach')
  attachCapability(
    @Param('featureId', new ParseUUIDPipe()) id: string,
    @Body() input: Input,
    @CurrentPrincipal() user: IamPrincipal,
  ) {
    return this.service.atomic('attachCapability', [id, input, user]);
  }

  @Get('versions/:versionId/dependencies')
  @RequirePermission('pack.dependency.read')
  dependencies(@Param('versionId', new ParseUUIDPipe()) id: string, @CurrentPrincipal() user: IamPrincipal) {
    return this.service.listDependencies(id, user);
  }

  @Post('versions/:versionId/dependencies')
  @RequirePermission('pack.dependency.create')
  addDependency(
    @Param('versionId', new ParseUUIDPipe()) id: string,
    @Body() input: Input,
    @CurrentPrincipal() user: IamPrincipal,
  ) {
    return this.service.atomic('addDependency', [id, input, user]);
  }

  @Get('versions/:versionId/rules')
  @RequirePermission('pack.rule.read')
  rules(@Param('versionId', new ParseUUIDPipe()) id: string, @CurrentPrincipal() user: IamPrincipal) {
    return this.service.listRules(id, user);
  }

  @Post('versions/:versionId/rules')
  @RequirePermission('pack.rule.create')
  addRule(
    @Param('versionId', new ParseUUIDPipe()) id: string,
    @Body() input: Input,
    @CurrentPrincipal() user: IamPrincipal,
  ) {
    return this.service.atomic('addRule', [id, input, user]);
  }

  @Post('versions/:id/validate')
  @RequirePermission('pack.version.validate')
  validate(@Param('id', new ParseUUIDPipe()) id: string, @CurrentPrincipal() user: IamPrincipal) {
    return this.service.atomic('validate', [id, user]);
  }

  @Get('versions/:id/validation')
  @RequirePermission('pack.version.read')
  validation(@Param('id', new ParseUUIDPipe()) id: string, @CurrentPrincipal() user: IamPrincipal) {
    return this.service.getValidation(id, user);
  }

  @Post('versions/:id/manifest')
  @RequirePermission('pack.version.generate.manifest')
  manifest(@Param('id', new ParseUUIDPipe()) id: string, @CurrentPrincipal() user: IamPrincipal) {
    return this.service.atomic('generateManifest', [id, user]);
  }

  @Get('versions/:id/manifest')
  @RequirePermission('pack.version.read')
  getManifest(@Param('id', new ParseUUIDPipe()) id: string, @CurrentPrincipal() user: IamPrincipal) {
    return this.service.getManifest(id, user);
  }

  @Post('versions/:id/publish')
  @RequirePermission('pack.version.publish')
  publish(@Param('id', new ParseUUIDPipe()) id: string, @CurrentPrincipal() user: IamPrincipal) {
    return this.service.atomic('publish', [id, user]);
=======

import { PackManagerService } from './pack-manager.service';
import { CurrentPrincipal } from '../../iam/principal.decorator';
import type { IamPrincipal } from '../../iam/principal.decorator';
import { TenantGuard } from '../../iam/tenant.guard';
import { TenantResource } from '../../iam/tenant-resource.decorator';
import { RequirePermission } from '../../iam/permission.guard';

const UUID = new ParseUUIDPipe({ version: '4' });

@UseGuards(TenantGuard)
@Controller('api/pack-manager')
export class PackManagerController {
  constructor(private readonly packManagerService: PackManagerService) {}

  // ---------- Cockpit ----------

  @Get('cockpit')
  async getCockpit(@CurrentPrincipal() principal: IamPrincipal) {
    return this.packManagerService.getCockpit(principal.tenantId);
  }

  // ---------- Packs (PM-CDC-02) ----------

  @Get('packs')
  async listPacks(
    @CurrentPrincipal() principal: IamPrincipal,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.packManagerService.listPacks(principal.tenantId, {
      search: search || undefined,
      status: status || undefined,
      category: category || undefined,
      includeArchived: includeArchived === 'true',
    });
  }

  @Get('packs/:packId')
  @UseGuards(RequirePermission('pack.read'))
  async getPack(@Param('packId', UUID) packId: string, @CurrentPrincipal() principal: IamPrincipal) {
    return this.packManagerService.getPack(principal.tenantId, packId);
  }

  @Post('packs')
  @UseGuards(RequirePermission('pack.create'))
  async createPack(@Body() dto: { code: string; name: string; shortName?: string; description?: string; category?: string; iconKey?: string; sourceType?: string }, @CurrentPrincipal() principal: IamPrincipal) {
    return this.packManagerService.createPack(principal.tenantId, dto);
  }

  @Patch('packs/:packId')
  @UseGuards(RequirePermission('pack.update'))
  async updatePack(
    @Param('packId', UUID) packId: string,
    @Body() dto: { name?: string; shortName?: string; description?: string; category?: string; iconKey?: string; status?: string; rowVersion?: number },
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.packManagerService.updatePack(principal.tenantId, packId, dto);
  }

  @Post('packs/:packId/archive')
  @UseGuards(RequirePermission('pack.archive'))
  async archivePack(@Param('packId', UUID) packId: string, @CurrentPrincipal() principal: IamPrincipal) {
    return this.packManagerService.archivePack(principal.tenantId, packId);
  }

  @Post('packs/:packId/restore')
  @UseGuards(RequirePermission('pack.archive'))
  async restorePack(@Param('packId', UUID) packId: string, @CurrentPrincipal() principal: IamPrincipal) {
    return this.packManagerService.restorePack(principal.tenantId, packId);
  }

  @Post('packs/:packId/duplicate')
  @UseGuards(RequirePermission('pack.create'))
  async duplicatePack(@Param('packId', UUID) packId: string, @CurrentPrincipal() principal: IamPrincipal) {
    return this.packManagerService.duplicatePack(principal.tenantId, packId);
  }

  // ---------- Versions (PM-CDC-03) ----------

  @Get('packs/:packId/versions')
  async listVersions(@Param('packId', UUID) packId: string, @CurrentPrincipal() principal: IamPrincipal) {
    return this.packManagerService.listVersions(principal.tenantId, packId);
  }

  @Get('versions/:versionId')
  async getVersion(@Param('versionId', UUID) versionId: string, @CurrentPrincipal() principal: IamPrincipal) {
    return this.packManagerService.getVersion(principal.tenantId, versionId);
  }

  @Post('packs/:packId/versions')
  @UseGuards(RequirePermission('pack.version.create'))
  async createVersion(
    @Param('packId', UUID) packId: string,
    @Body() dto: { versionNumber: string; label?: string; description?: string; releaseNotes?: string; sourceVersionId?: string },
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.packManagerService.createVersion(principal.tenantId, packId, dto);
  }

  @Post('versions/:versionId/transition')
  @UseGuards(RequirePermission('pack.version.publish'))
  async transitionVersion(
    @Param('versionId', UUID) versionId: string,
    @Body() dto: { target: string },
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.packManagerService.transitionVersion(principal.tenantId, versionId, dto.target);
  }

  // ---------- Modules (PM-CDC-04) ----------

  @Get('versions/:versionId/modules')
  async listModules(@Param('versionId', UUID) versionId: string, @CurrentPrincipal() principal: IamPrincipal) {
    return this.packManagerService.listModules(principal.tenantId, versionId);
  }

  @Post('versions/:versionId/modules')
  @UseGuards(RequirePermission('pack.module.manage'))
  async createModule(
    @Param('versionId', UUID) versionId: string,
    @Body() dto: { code: string; name: string; description?: string; orderIndex?: number; config?: unknown },
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.packManagerService.createModule(principal.tenantId, versionId, dto);
  }

  @Patch('modules/:moduleId')
  @UseGuards(RequirePermission('pack.module.manage'))
  async updateModule(
    @Param('moduleId', UUID) moduleId: string,
    @Body() dto: { name?: string; description?: string; enabled?: boolean; orderIndex?: number; config?: unknown },
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.packManagerService.updateModule(principal.tenantId, moduleId, dto);
  }

  @Delete('modules/:moduleId')
  @UseGuards(RequirePermission('pack.module.manage'))
  async deleteModule(@Param('moduleId', UUID) moduleId: string, @CurrentPrincipal() principal: IamPrincipal) {
    return this.packManagerService.deleteModule(principal.tenantId, moduleId);
  }

  @Post('versions/:versionId/module-features')
  @UseGuards(RequirePermission('pack.module.manage'))
  async linkFeatureToModule(
    @Param('versionId', UUID) versionId: string,
    @Body() dto: { featureId: string; moduleId: string },
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.packManagerService.linkFeatureToModule(principal.tenantId, versionId, dto);
  }

  @Delete('versions/:versionId/module-features/:linkId')
  @UseGuards(RequirePermission('pack.module.manage'))
  async unlinkFeatureFromModule(
    @Param('versionId', UUID) versionId: string,
    @Param('linkId', UUID) linkId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.packManagerService.unlinkFeatureFromModule(principal.tenantId, versionId, linkId);
  }

  // ---------- Features (PM-CDC-05) ----------

  @Get('versions/:versionId/features')
  async listFeatures(@Param('versionId', UUID) versionId: string, @CurrentPrincipal() principal: IamPrincipal) {
    return this.packManagerService.listFeatures(principal.tenantId, versionId);
  }

  @Post('versions/:versionId/features')
  @UseGuards(RequirePermission('pack.feature.manage'))
  async createFeature(
    @Param('versionId', UUID) versionId: string,
    @Body() dto: { code: string; name: string; description?: string; enabled?: boolean },
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.packManagerService.createFeature(principal.tenantId, versionId, dto);
  }

  @Patch('features/:featureId')
  @UseGuards(RequirePermission('pack.feature.manage'))
  async updateFeature(
    @Param('featureId', UUID) featureId: string,
    @Body() dto: { name?: string; description?: string; enabled?: boolean },
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.packManagerService.updateFeature(principal.tenantId, featureId, dto);
  }

  @Delete('features/:featureId')
  @UseGuards(RequirePermission('pack.feature.manage'))
  async deleteFeature(@Param('featureId', UUID) featureId: string, @CurrentPrincipal() principal: IamPrincipal) {
    return this.packManagerService.deleteFeature(principal.tenantId, featureId);
  }

  @Post('versions/:versionId/feature-capabilities')
  @UseGuards(RequirePermission('pack.feature.manage'))
  async linkCapabilityToFeature(
    @Param('versionId', UUID) versionId: string,
    @Body() dto: { featureId: string; capabilityId: string; required?: boolean },
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.packManagerService.linkCapabilityToFeature(principal.tenantId, versionId, dto);
  }

  @Delete('versions/:versionId/feature-capabilities/:linkId')
  @UseGuards(RequirePermission('pack.feature.manage'))
  async unlinkCapabilityFromFeature(
    @Param('versionId', UUID) versionId: string,
    @Param('linkId', UUID) linkId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.packManagerService.unlinkCapabilityFromFeature(principal.tenantId, versionId, linkId);
  }

  // ---------- Capabilities (PM-CDC-05) ----------

  @Get('versions/:versionId/capabilities')
  async listCapabilities(@Param('versionId', UUID) versionId: string, @CurrentPrincipal() principal: IamPrincipal) {
    return this.packManagerService.listCapabilities(principal.tenantId, versionId);
  }

  @Post('versions/:versionId/capabilities')
  @UseGuards(RequirePermission('pack.feature.manage'))
  async createCapability(
    @Param('versionId', UUID) versionId: string,
    @Body() dto: { code: string; name: string; description?: string; required?: boolean },
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.packManagerService.createCapability(principal.tenantId, versionId, dto);
  }

  // ---------- Dépendances (PM-CDC-06) ----------

  @Get('versions/:versionId/dependencies')
  async listDependencies(@Param('versionId', UUID) versionId: string, @CurrentPrincipal() principal: IamPrincipal) {
    return this.packManagerService.listDependencies(principal.tenantId, versionId);
  }

  @Post('versions/:versionId/dependencies')
  @UseGuards(RequirePermission('pack.dependency.manage'))
  async createDependency(
    @Param('versionId', UUID) versionId: string,
    @Body() dto: { targetType: string; targetCode: string; versionRange?: string; type?: string; targetPackId?: string },
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.packManagerService.createDependency(principal.tenantId, versionId, dto);
  }

  @Delete('versions/:versionId/dependencies/:dependencyId')
  @UseGuards(RequirePermission('pack.dependency.manage'))
  async deleteDependency(
    @Param('versionId', UUID) versionId: string,
    @Param('dependencyId', UUID) dependencyId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.packManagerService.deleteDependency(principal.tenantId, versionId, dependencyId);
  }

  // ---------- Règles (PM-CDC-07) ----------

  @Get('versions/:versionId/rules')
  async listRules(@Param('versionId', UUID) versionId: string, @CurrentPrincipal() principal: IamPrincipal) {
    return this.packManagerService.listRules(principal.tenantId, versionId);
  }

  @Post('versions/:versionId/rules')
  @UseGuards(RequirePermission('pack.rule.manage'))
  async createRule(
    @Param('versionId', UUID) versionId: string,
    @Body() dto: { code: string; name: string; type?: string; description?: string; conditions: unknown; effect?: string; priority?: number; moduleId?: string },
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.packManagerService.createRule(principal.tenantId, versionId, dto as never);
  }

  @Patch('versions/:versionId/rules/:ruleId')
  @UseGuards(RequirePermission('pack.rule.manage'))
  async updateRule(
    @Param('versionId', UUID) versionId: string,
    @Param('ruleId', UUID) ruleId: string,
    @Body() dto: { name?: string; description?: string; enabled?: boolean; priority?: number; effect?: string; conditions?: unknown },
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.packManagerService.updateRule(principal.tenantId, versionId, ruleId, dto as never);
  }

  @Delete('versions/:versionId/rules/:ruleId')
  @UseGuards(RequirePermission('pack.rule.manage'))
  async deleteRule(
    @Param('versionId', UUID) versionId: string,
    @Param('ruleId', UUID) ruleId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.packManagerService.deleteRule(principal.tenantId, versionId, ruleId);
  }

  // ---------- Validation / Manifest / Publication ----------

  @Post('versions/:versionId/validate')
  @UseGuards(RequirePermission('pack.update'))
  async validateVersion(@Param('versionId', UUID) versionId: string, @CurrentPrincipal() principal: IamPrincipal) {
    return this.packManagerService.validateVersion(principal.tenantId, versionId, principal.userId, null);
  }

  @Get('versions/:versionId/validation')
  async latestValidation(@Param('versionId', UUID) versionId: string, @CurrentPrincipal() principal: IamPrincipal) {
    return this.packManagerService.latestValidation(principal.tenantId, versionId);
  }

  @Post('versions/:versionId/manifest')
  @UseGuards(RequirePermission('pack.update'))
  async generateManifest(@Param('versionId', UUID) versionId: string, @CurrentPrincipal() principal: IamPrincipal) {
    return this.packManagerService.generateManifest(principal.tenantId, versionId, principal.userId, null);
  }

  @Get('versions/:versionId/manifest')
  async latestManifest(@Param('versionId', UUID) versionId: string, @CurrentPrincipal() principal: IamPrincipal) {
    return this.packManagerService.latestManifest(principal.tenantId, versionId);
  }

  @Get('versions/:versionId/manifests')
  async listManifests(@Param('versionId', UUID) versionId: string, @CurrentPrincipal() principal: IamPrincipal) {
    return this.packManagerService.listManifests(principal.tenantId, versionId);
  }

  @Post('versions/:versionId/publish')
  @UseGuards(RequirePermission('pack.version.publish'))
  async publishVersion(@Param('versionId', UUID) versionId: string, @CurrentPrincipal() principal: IamPrincipal) {
    return this.packManagerService.publishVersion(principal.tenantId, versionId, principal.userId, null);
>>>>>>> dc5feb88fd597836d806457a7b2a50727b017d02
  }
}
