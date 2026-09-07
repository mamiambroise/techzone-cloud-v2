import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { DeploymentService } from './deployment.service';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { QueryDeploymentDto } from './dto/query-deployment.dto';
import { VerifyDeploymentDto } from './dto/verify-deployment.dto';

@Controller('api/deployments')
export class DeploymentController {
  constructor(private readonly deploymentService: DeploymentService) {}

  @Post()
  create(@Body() dto: CreateDeploymentDto) {
    return this.deploymentService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryDeploymentDto) {
    return this.deploymentService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deploymentService.findOne(id);
  }

  @Post(':id/verify')
  verify(@Param('id') id: string, @Body() dto: VerifyDeploymentDto) {
    return this.deploymentService.verify(id, dto);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Body('actor') actor?: string) {
    return this.deploymentService.cancel(id, actor);
  }

  @Post(':id/retry')
  retry(@Param('id') id: string, @Body('actor') actor?: string) {
    return this.deploymentService.retry(id, actor);
  }
}
