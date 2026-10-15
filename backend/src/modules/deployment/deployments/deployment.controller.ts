import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { RequirePermission } from '../../../iam/permission.decorator';
import { PERMISSIONS } from '../../../iam/iam.constants';
import { TenantResource } from '../../../iam/tenant-resource.decorator';
import { DeploymentService } from './deployment.service';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { QueryDeploymentDto } from './dto/query-deployment.dto';
import { VerifyDeploymentDto } from './dto/verify-deployment.dto';

@Controller('api/deployments')
@TenantResource({ table: 'deployment' })
export class DeploymentController {
  constructor(private readonly deploymentService: DeploymentService) {}

  @Post()
  @RequirePermission(PERMISSIONS.DEPLOYMENT_CREATE)
  create(@Body() dto: CreateDeploymentDto) {
    return this.deploymentService.create(dto);
  }

  @Get()
  @RequirePermission(PERMISSIONS.DEPLOYMENT_READ)
  findAll(@Query() query: QueryDeploymentDto) {
    return this.deploymentService.findAll(query);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_READ)
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.deploymentService.findOne(id);
  }

  @Post(':id/verify')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_DIAGNOSTICS)
  verify(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: VerifyDeploymentDto,
  ) {
    return this.deploymentService.verify(id, dto);
  }

  @Post(':id/cancel')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_CANCEL)
  cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body('actor') actor?: string,
  ) {
    return this.deploymentService.cancel(id, actor);
  }

  @Post(':id/retry')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_RETRY)
  retry(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body('actor') actor?: string,
  ) {
    return this.deploymentService.retry(id, actor);
  }
}
