import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { ConfigurationService } from './configuration.service';

import { CreateConfigurationDto } from './dto/create-config.dto';
import { UpdateConfigurationDto } from '../configuration/dto/update-config.dto';

@Controller('api/platform/config')
export class ConfigurationController {
  constructor(private readonly configurationService: ConfigurationService) {}

  // GET /api/platform/config
  @Get()
  findAll() {
    return this.configurationService.findAll();
  }

  @Get('effective/:applicationId/:applicationVersionId/:environmentId')
  resolveEffectiveConfigurations(
    @Param('applicationId') applicationId: string,
    @Param('applicationVersionId') applicationVersionId: string,
    @Param('environmentId') environmentId: string,
  ) {
    return this.configurationService.resolveEffectiveConfigurations({
      applicationId,
      applicationVersionId,
      environmentId,
    });
  }

  // GET /api/platform/config/:id/history
  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.configurationService.getHistory(id);
  }

  // GET /api/platform/config/:scope/:scopeId
  @Get(':scope/:scopeId')
  findByScope(
    @Param('scope') scope: string,
    @Param('scopeId') scopeId: string,
  ) {
    return this.configurationService.findByScope(scope, scopeId);
  }

  // POST /api/platform/config
  @Post()
  create(@Body() dto: CreateConfigurationDto) {
    return this.configurationService.create(dto);
  }

  // PATCH /api/platform/config/:id
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateConfigurationDto) {
    return this.configurationService.update(id, dto);
  }

  // POST /api/platform/config/:id/activate
  @Post(':id/activate')
  activate(@Param('id') id: string) {
    return this.configurationService.activate(id);
  }

  // POST /api/platform/config/:id/validate
  @Post(':id/validate')
  validate(@Param('id') id: string) {
    return this.configurationService.validate(id);
  }
}
