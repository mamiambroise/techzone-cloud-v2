import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { RuntimeResolverService } from './runtime-resolver.service';
import { Permission } from '../../../common/enums';

@Controller('api/runtime')
@UseGuards(AuthGuard, PermissionGuard)
export class RuntimeController {
  constructor(private readonly resolver: RuntimeResolverService) {}

  @Post('resolve')
  @Permissions(Permission.RUNTIME_RESOLVE)
  resolve(@Body() body: any) {
    return this.resolver.resolve(body.manifest, body.context);
  }

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