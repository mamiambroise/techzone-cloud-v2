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
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { User } from '../../common/decorators/user.decorator';
import type { UserContext } from '../../common/decorators/user.decorator';
import { Permission } from '../../common/enums';
import { PackManagerService } from './pack-manager.service';

type Input = Record<string, unknown>;

@Controller('api/pack-manager')
@UseGuards(AuthGuard, PermissionGuard)
export class PackManagerController {
  constructor(private readonly service: PackManagerService) {}

  @Get('dashboard')
  @Permissions(Permission.PACK_READ)
  dashboard(@User() user: UserContext) {
    return this.service.dashboard(user);
  }

  @Get('dashboard/attention')
  @Permissions(Permission.PACK_READ)
  async attention(@User() user: UserContext) {
    return (await this.service.dashboard(user)).counters;
  }

  @Get('dashboard/activity')
  @Permissions(Permission.PACK_READ)
  async activity(@User() user: UserContext) {
    return (await this.service.dashboard(user)).activity;
  }

  @Get('packs')
  @Permissions(Permission.PACK_READ)
  packs(@Query() query: Input, @User() user: UserContext) {
    return this.service.listPacks(user, query);
  }

  @Post('packs')
  @Permissions(Permission.PACK_CREATE)
  createPack(@Body() input: Input, @User() user: UserContext) {
    return this.service.createPack(input, user);
  }

  @Get('packs/:id')
  @Permissions(Permission.PACK_READ)
  pack(@Param('id') id: string, @User() user: UserContext) {
    return this.service.getPack(id, user);
  }

  @Patch('packs/:id')
  @Permissions(Permission.PACK_UPDATE)
  updatePack(
    @Param('id') id: string,
    @Body() input: Input,
    @User() user: UserContext,
  ) {
    return this.service.updatePack(id, input, user);
  }

  @Post('packs/:id/archive')
  @Permissions(Permission.PACK_ARCHIVE)
  archivePack(@Param('id') id: string, @User() user: UserContext) {
    return this.service.archivePack(id, user);
  }

  @Post('packs/:id/restore')
  @Permissions(Permission.PACK_RESTORE)
  restorePack(@Param('id') id: string, @User() user: UserContext) {
    return this.service.restorePack(id, user);
  }

  @Get('packs/:packId/versions')
  @Permissions(Permission.PACK_VERSION_READ)
  versions(@Param('packId') packId: string, @User() user: UserContext) {
    return this.service.listVersions(packId, user);
  }

  @Post('packs/:packId/versions')
  @Permissions(Permission.PACK_VERSION_CREATE)
  createVersion(
    @Param('packId') packId: string,
    @Body() input: Input,
    @User() user: UserContext,
  ) {
    return this.service.createVersion(packId, input, user);
  }

  @Get('versions/:id')
  @Permissions(Permission.PACK_VERSION_READ)
  version(@Param('id') id: string, @User() user: UserContext) {
    return this.service.getVersion(id, user);
  }

  @Patch('versions/:id')
  @Permissions(Permission.PACK_VERSION_UPDATE)
  updateVersion(
    @Param('id') id: string,
    @Body() input: Input,
    @User() user: UserContext,
  ) {
    return this.service.updateVersion(id, input, user);
  }

  @Get('versions/:versionId/modules')
  @Permissions(Permission.PACK_MODULE_READ)
  modules(@Param('versionId') id: string, @User() user: UserContext) {
    return this.service.listModules(id, user);
  }

  @Post('versions/:versionId/modules')
  @Permissions(Permission.PACK_MODULE_CREATE)
  addModule(
    @Param('versionId') id: string,
    @Body() input: Input,
    @User() user: UserContext,
  ) {
    return this.service.addModule(id, input, user);
  }

  @Get('versions/:versionId/features')
  @Permissions(Permission.PACK_FEATURE_READ)
  features(@Param('versionId') id: string, @User() user: UserContext) {
    return this.service.listFeatures(id, user);
  }

  @Post('versions/:versionId/features')
  @Permissions(Permission.PACK_FEATURE_CREATE)
  addFeature(
    @Param('versionId') id: string,
    @Body() input: Input,
    @User() user: UserContext,
  ) {
    return this.service.addFeature(id, input, user);
  }

  @Get('capabilities')
  @Permissions(Permission.PACK_CAPABILITY_READ)
  capabilities(@User() user: UserContext) {
    return this.service.listCapabilities(user);
  }

  @Post('capabilities')
  @Permissions(Permission.PACK_CAPABILITY_CREATE)
  addCapability(@Body() input: Input, @User() user: UserContext) {
    return this.service.createCapability(input, user);
  }

  @Post('features/:featureId/capabilities')
  @Permissions(Permission.PACK_CAPABILITY_ATTACH)
  attachCapability(
    @Param('featureId') id: string,
    @Body() input: Input,
    @User() user: UserContext,
  ) {
    return this.service.attachCapability(id, input, user);
  }

  @Get('versions/:versionId/dependencies')
  @Permissions(Permission.PACK_DEPENDENCY_READ)
  dependencies(@Param('versionId') id: string, @User() user: UserContext) {
    return this.service.listDependencies(id, user);
  }

  @Post('versions/:versionId/dependencies')
  @Permissions(Permission.PACK_DEPENDENCY_CREATE)
  addDependency(
    @Param('versionId') id: string,
    @Body() input: Input,
    @User() user: UserContext,
  ) {
    return this.service.addDependency(id, input, user);
  }

  @Get('versions/:versionId/rules')
  @Permissions(Permission.PACK_RULE_READ)
  rules(@Param('versionId') id: string, @User() user: UserContext) {
    return this.service.listRules(id, user);
  }

  @Post('versions/:versionId/rules')
  @Permissions(Permission.PACK_RULE_CREATE)
  addRule(
    @Param('versionId') id: string,
    @Body() input: Input,
    @User() user: UserContext,
  ) {
    return this.service.addRule(id, input, user);
  }

  @Post('versions/:id/validate')
  @Permissions(Permission.PACK_VERSION_VALIDATE)
  validate(@Param('id') id: string, @User() user: UserContext) {
    return this.service.validate(id, user);
  }

  @Get('versions/:id/validation')
  @Permissions(Permission.PACK_VERSION_READ)
  validation(@Param('id') id: string, @User() user: UserContext) {
    return this.service.getValidation(id, user);
  }

  @Post('versions/:id/manifest')
  @Permissions(Permission.PACK_VERSION_GENERATE_MANIFEST)
  manifest(@Param('id') id: string, @User() user: UserContext) {
    return this.service.generateManifest(id, user);
  }

  @Get('versions/:id/manifest')
  @Permissions(Permission.PACK_VERSION_READ)
  getManifest(@Param('id') id: string, @User() user: UserContext) {
    return this.service.getManifest(id, user);
  }

  @Post('versions/:id/publish')
  @Permissions(Permission.PACK_VERSION_PUBLISH)
  publish(@Param('id') id: string, @User() user: UserContext) {
    return this.service.publish(id, user);
  }
}
