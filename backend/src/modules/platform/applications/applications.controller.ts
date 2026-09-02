import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Controller('api/platform/applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  findAll() {
    return this.applicationsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateApplicationDto) {
    return this.applicationsService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateApplicationDto) {
    return this.applicationsService.update(id, dto);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string) {
    return this.applicationsService.archive(id);
  }
}
