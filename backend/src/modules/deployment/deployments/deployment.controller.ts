import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { CurrentUser } from '../../../iam/decorators/current-user.decorator';
import type { IamAuthContext } from '../../../iam/decorators/current-user.decorator';
import { Permissions } from '../../../iam/iam-permissions.guard';
import { PERMISSIONS } from '../../../iam/iam.constants';
import { DeploymentService } from './deployment.service';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { QueryDeploymentDto } from './dto/query-deployment.dto';
import { VerifyDeploymentDto } from './dto/verify-deployment.dto';

@Controller('api/deployments')
export class DeploymentController {
  constructor(private readonly deploymentService: DeploymentService) {}

  @Post()
  @Permissions(PERMISSIONS.DEPLOYMENT_CREATE, PERMISSIONS.DEPLOYMENT_EXECUTE)
  create(
    @Body() dto: CreateDeploymentDto,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.deploymentService.create(dto, principal.tenantId, principal.userId);
  }

  @Get()
  @Permissions(PERMISSIONS.DEPLOYMENT_READ)
  findAll(
    @Query() query: QueryDeploymentDto,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.deploymentService.findAll(query, principal.tenantId);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.DEPLOYMENT_READ)
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.deploymentService.findOne(id, principal.tenantId);
  }

  @Post(':id/verify')
  @Permissions(PERMISSIONS.DEPLOYMENT_READ)
  verify(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: VerifyDeploymentDto,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.deploymentService.verify(id, dto, principal.tenantId);
  }

  @Post(':id/cancel')
  @Permissions(PERMISSIONS.DEPLOYMENT_CANCEL)
  cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.deploymentService.cancel(id, principal.tenantId, principal.userId);
  }

  @Post(':id/retry')
  @Permissions(PERMISSIONS.DEPLOYMENT_RETRY, PERMISSIONS.DEPLOYMENT_EXECUTE)
  retry(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.deploymentService.retry(id, principal.tenantId, principal.userId);
  }
}
