import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { ApplicationVersionsService } from './application-versions.service';
import { CreateApplicationVersionDto } from '../application-versions/dto/create-app-version.dto';
import { UpdateApplicationVersionDto } from '../application-versions/dto/update-app-version.dto';

@Controller()
export class ApplicationVersionsController {
  constructor(private readonly versionsService: ApplicationVersionsService) {}

  @Get('api/platform/applications/:id/versions')
  findByApplication(@Param('id') applicationId: string) {
    return this.versionsService.findByApplication(applicationId);
  }

  @Post('api/platform/applications/:id/versions')
  create(
    @Param('id') applicationId: string,
    @Body() dto: CreateApplicationVersionDto,
  ) {
    return this.versionsService.create(applicationId, dto);
  }

  @Get('api/platform/versions/:id')
  findOne(@Param('id') id: string) {
    return this.versionsService.findOne(id);
  }

  @Patch('api/platform/versions/:id')
  update(@Param('id') id: string, @Body() dto: UpdateApplicationVersionDto) {
    return this.versionsService.update(id, dto);
  }

  @Post('api/platform/versions/:id/clone')
  clone(@Param('id') id: string) {
    return this.versionsService.clone(id);
  }

  @Post('api/platform/versions/:id/status/:status')
  changeStatus(@Param('id') id: string, @Param('status') status: string) {
    return this.versionsService.changeStatus(id, status.toUpperCase());
  }
}
