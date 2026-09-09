import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { ConfigurationService } from './configuration.service';
@Controller('api/v1/business-manager') @UseGuards(AuthGuard, PermissionGuard)
export class ConfigurationController {
  constructor(private readonly service: ConfigurationService) {}
  @Get('configuration/definitions') definitions(@Query() q: any) { return this.service.listDefinitions(q); }
  @Post('configuration/definitions') createDefinition(@Body() b: any) { return this.service.createDefinition(b); }
  @Patch('configuration/definitions/:id') updateDefinition(@Param('id') id: string, @Body() b: any) { return this.service.updateDefinition(id, b); }
  @Put('applications/:applicationId/configuration/:code') setApplication(@Param('applicationId') applicationId: string, @Param('code') code: string, @Body() b: any) { return this.service.setValue(code, { applicationId, environment: b.environment }, b.value); }
  @Put('application-versions/:versionId/configuration/:code') setVersion(@Param('versionId') applicationVersionId: string, @Param('code') code: string, @Body() b: any) { return this.service.setValue(code, { applicationVersionId, environment: b.environment }, b.value); }
  @Delete('application-versions/:versionId/configuration/:code') removeOverride(@Param('versionId') id: string, @Param('code') code: string) { return this.service.removeOverride(id, code); }
  @Get('application-versions/:versionId/configuration/resolved') resolved(@Param('versionId') id: string, @Query('environment') environment?: string, @Query('codes') codes?: string) { return this.service.resolve(id, environment, codes?.split(',')); }
  @Get('application-versions/:versionId/configuration/:code/explain') explain(@Param('versionId') id: string, @Param('code') code: string, @Query('environment') environment?: string) { return this.service.explain(id, code, environment); }
  @Post('application-versions/:versionId/configuration/validate') validate(@Param('versionId') id: string) { return this.service.validate(id); }
  @Get('application-versions/:source/configuration/diff/:target') diff(@Param('source') source: string, @Param('target') target: string) { return this.service.diff(source, target); }
  @Post('application-versions/:versionId/configuration/snapshot') snapshot(@Param('versionId') id: string) { return this.service.snapshot(id); }
  @Get('metadata/definitions') metadataDefinitions() { return this.service.listMetadataDefinitions(); }
  @Post('metadata/definitions') createMetadataDefinition(@Body() b: any) { return this.service.createMetadataDefinition(b); }
  @Get('resources/:type/:id/metadata') metadata(@Param('type') type: string, @Param('id') id: string) { return this.service.resourceMetadata(type, id); }
  @Put('resources/:type/:id/metadata/:code') setMetadata(@Param('type') type: string, @Param('id') id: string, @Param('code') code: string, @Body() b: any) { return this.service.setMetadata(type, id, code, b.value); }
}
