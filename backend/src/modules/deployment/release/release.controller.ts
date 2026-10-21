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
import {
  CurrentUser,
  type IamAuthContext,
} from '../../../iam/decorators/current-user.decorator';
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
  create(
    @Body() dto: CreateReleaseDto,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.releaseService.create(dto, principal);
  }

  @Get()
  @RequirePermission(PERMISSIONS.DEPLOYMENT_READ)
  findAll(
    @Query() query: QueryReleaseDto,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.releaseService.findAll(query, principal);
  }

  @Get('compare/:id1/:id2')
  @TenantResource({ table: 'release', idParam: 'id1' })
  @RequirePermission(PERMISSIONS.DEPLOYMENT_READ)
  compare(
    @Param('id1') id1: string,
    @Param('id2') id2: string,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.releaseService.compare(id1, id2, principal);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_READ)
  findOne(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    return this.releaseService.findOne(id, principal);
  }

  @Post(':id/assemble')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_CREATE)
  assemble(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    return this.releaseService.assemble(id, principal);
  }

  @Post(':id/validate')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_CREATE)
  validate(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    return this.releaseService.validate(id, principal);
  }

  @Post(':id/approve')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_EXECUTE)
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveReleaseDto,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.releaseService.approve(id, dto, principal);
  }

  @Post(':id/publish')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_EXECUTE)
  publish(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    return this.releaseService.publish(id, principal);
  }

  @Post(':id/archive')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_EXECUTE)
  archive(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    return this.releaseService.archive(id, principal);
  }

  @Get(':id/history')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_READ)
  getHistory(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    return this.releaseService.getHistory(id, principal);
  }
}
