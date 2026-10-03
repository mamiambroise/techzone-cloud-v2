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
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
  }
}
