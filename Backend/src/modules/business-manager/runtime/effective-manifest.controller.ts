import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/enums';
import { User } from '../../../common/decorators/user.decorator';
import type { UserContext } from '../../../common/decorators/user.decorator';
import { EffectiveManifestService } from './effective-manifest.service';
import type { RuntimeProjection } from './contracts/runtime.contracts';

@Controller('api/runtime/effective-manifests')
@UseGuards(AuthGuard, PermissionGuard)
export class EffectiveManifestController {
  constructor(private readonly service: EffectiveManifestService) {}

  @Get(':id')
  @Permissions(Permission.RUNTIME_READ)
  getById(@Param('id') id: string, @Query('projection') projection: RuntimeProjection = 'FULL') {
    return this.service.getEffectiveManifestByResolution(id, projection);
  }

  @Get('compare')
  @Permissions(Permission.RUNTIME_MANIFEST_COMPARE)
  compare(@Query('left') left: string, @Query('right') right: string) {
    return this.service.compare(left, right);
  }

  @Post('validate')
  @Permissions(Permission.RUNTIME_READ)
  validate(@Body() manifest: any) {
    return this.service.validate(manifest);
  }

  @Get('applications/:applicationId/packs/:packCode/current')
  @Permissions(Permission.RUNTIME_READ)
  current(@Param('applicationId') applicationId: string, @Param('packCode') packCode: string, @User() user: UserContext, @Query('projection') projection: RuntimeProjection = 'FULL') {
    return this.service.getCurrentEffectiveManifest(applicationId, packCode, user.tenantId ?? '', projection);
  }
}
