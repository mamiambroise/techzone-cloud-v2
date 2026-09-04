import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/enums';
import { PackService } from './pack.service';

@Controller('api/v1/pack-manager')
@UseGuards(AuthGuard, PermissionGuard)
export class PackController {
  constructor(private readonly service: PackService) {}

  @Get('packs') @Permissions(Permission.PACK_READ)
  list() { return this.service.listPacks(); }
  @Post('packs') @Permissions(Permission.PACK_WRITE)
  create(@Body() body: any) { return this.service.createPack(body); }
  @Get('packs/:id') @Permissions(Permission.PACK_READ)
  get(@Param('id') id: string) { return this.service.getPack(id); }
  @Patch('packs/:id') @Permissions(Permission.PACK_WRITE)
  update(@Param('id') id: string, @Body() body: any) { return this.service.updatePack(id, body); }
  @Get('packs/:packId/versions') @Permissions(Permission.PACK_READ)
  versions(@Param('packId') packId: string) { return this.service.listVersions(packId); }
  @Post('packs/:packId/versions') @Permissions(Permission.PACK_WRITE)
  createVersion(@Param('packId') packId: string, @Body() body: any) { return this.service.createVersion(packId, body); }
  @Get('versions/:id') @Permissions(Permission.PACK_READ)
  getVersion(@Param('id') id: string) { return this.service.getVersion(id); }
  @Patch('versions/:id') @Permissions(Permission.PACK_WRITE)
  updateVersion(@Param('id') id: string, @Body() body: any) { return this.service.updateVersion(id, body); }
  @Patch('versions/:id/state') @Permissions(Permission.PACK_WRITE)
  replaceState(@Param('id') id: string, @Body() body: any) { return this.service.replaceVersionState(id, body); }
}
