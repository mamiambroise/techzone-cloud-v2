import { Body, Controller, ForbiddenException, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { RuntimeResolverService } from './runtime-resolver.service';
import { Permission } from '../../../common/enums';
import { User } from '../../../common/decorators/user.decorator';
import type { UserContext } from '../../../common/decorators/user.decorator';
import { RuntimeResolutionService } from './runtime-resolution.service';

@Controller('api/runtime')
@UseGuards(AuthGuard, PermissionGuard)
export class RuntimeController {
  constructor(private readonly resolver: RuntimeResolverService, private readonly resolutions: RuntimeResolutionService) {}

  @Post('resolve')
  @Permissions(Permission.RUNTIME_RESOLVE)
  resolve(@Body() body: any, @User() user: UserContext) {
    if (body.preview && !user.permissions?.includes(Permission.RUNTIME_RESOLVE_PREVIEW)) throw new ForbiddenException('RUNTIME_PREVIEW_FORBIDDEN');
    if (body.manifest) return this.resolver.resolve(body.manifest, { ...body.context, tenantId: user.tenantId ?? body.context?.tenantId });
    return this.resolutions.resolve({ ...body, tenantId: user.tenantId ?? body.tenantId, userId: user.id });
  }

  @Get('resolutions/:id/steps')
  @Permissions(Permission.RUNTIME_RESOLUTION_READ)
  steps(@Param('id') id: string) { return this.resolutions.getSteps(id); }

  @Post('resolutions/:id/retry')
  @Permissions(Permission.RUNTIME_RESOLUTION_RETRY)
  retry(@Param('id') id: string, @User() user: UserContext) { return this.resolutions.retry(id, user.tenantId ?? ''); }

  @Get('resolutions/:id')
  @Permissions(Permission.RUNTIME_READ)
  resolution(@Param('id') id: string) {
    return this.resolver.getResolution(id);
  }

  @Get('resolutions/:id/diagnostics')
  @Permissions(Permission.RUNTIME_DIAGNOSE)
  diagnostics(@Param('id') id: string) {
    return this.resolver.getResolution(id).diagnostics;
  }

  @Get('effective-manifests/:id')
  @Permissions(Permission.RUNTIME_READ)
  effectiveManifest(@Param('id') id: string) {
    return this.resolver.getResolution(id).manifest;
  }

  @Post('cache/invalidate')
  @Permissions(Permission.RUNTIME_INVALIDATE_CACHE)
  invalidateCache() {
    return this.resolver.invalidateCache();
  }
}