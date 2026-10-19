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
import {
  CurrentUser,
  type IamAuthContext,
} from '../../../iam/decorators/current-user.decorator';
import { DeploymentService } from './deployment.service';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { QueryDeploymentDto } from './dto/query-deployment.dto';

@Controller('api/deployments')
@TenantResource({ table: 'deployment' })
export class DeploymentController {
  constructor(private readonly deploymentService: DeploymentService) {}

  @Post()
  @RequirePermission(PERMISSIONS.DEPLOYMENT_CREATE)
  create(
    @Body() dto: CreateDeploymentDto,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.deploymentService.create(dto, principal);
  }

  @Get()
  @RequirePermission(PERMISSIONS.DEPLOYMENT_READ)
  findAll(
    @Query() query: QueryDeploymentDto,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.deploymentService.findAll(query, principal);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_READ)
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.deploymentService.findOne(id, principal);
  }

  @Post(':id/verify')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_DIAGNOSTICS)
  verify(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.deploymentService.verify(id, principal);
  }

  @Post(':id/cancel')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_CANCEL)
  cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.deploymentService.cancel(id, principal);
  }

  @Post(':id/retry')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_RETRY)
  retry(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.deploymentService.retry(id, principal);
  }
}
