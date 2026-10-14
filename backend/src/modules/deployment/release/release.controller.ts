import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { RequirePermission } from '../../../iam/permission.decorator';
import { PERMISSIONS } from '../../../iam/iam.constants';
import { TenantResource } from '../../../iam/tenant-resource.decorator';
import { ReleaseService } from './release.service';
import { CreateReleaseDto } from './dto/create-release-dto';
import { QueryReleaseDto } from './dto/query-release.dto';
import { ApproveReleaseDto } from './dto/approve-release.dto';

@Controller('api/releases')
@TenantResource({ table: 'release' })
export class ReleaseController {
  constructor(private readonly releaseService: ReleaseService) {}

  @Post()
  @RequirePermission(PERMISSIONS.DEPLOYMENT_CREATE)
  create(@Body() dto: CreateReleaseDto) {
    return this.releaseService.create(dto);
  }

  @Get()
  @RequirePermission(PERMISSIONS.DEPLOYMENT_READ)
  findAll(@Query() query: QueryReleaseDto) {
    return this.releaseService.findAll(query);
  }

  @Get('compare/:id1/:id2')
  @TenantResource({ table: 'release', idParam: 'id1' })
  @RequirePermission(PERMISSIONS.DEPLOYMENT_READ)
  compare(@Param('id1') id1: string, @Param('id2') id2: string) {
    return this.releaseService.compare(id1, id2);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_READ)
  findOne(@Param('id') id: string) {
    return this.releaseService.findOne(id);
  }

  @Post(':id/assemble')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_CREATE)
  assemble(@Param('id') id: string) {
    return this.releaseService.assemble(id);
  }

  @Post(':id/validate')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_CREATE)
  validate(@Param('id') id: string) {
    return this.releaseService.validate(id);
  }

  @Post(':id/approve')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_EXECUTE)
  approve(@Param('id') id: string, @Body() dto: ApproveReleaseDto) {
    return this.releaseService.approve(id, dto);
  }

  @Post(':id/publish')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_EXECUTE)
  publish(@Param('id') id: string) {
    return this.releaseService.publish(id);
  }

  @Post(':id/archive')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_EXECUTE)
  archive(@Param('id') id: string) {
    return this.releaseService.archive(id);
  }

  @Get(':id/history')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_READ)
  getHistory(@Param('id') id: string) {
    return this.releaseService.getHistory(id);
  }
}
