import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { ConfigurationService } from './configuration.service';
import { CurrentPrincipal } from '../../iam/principal.decorator';
import { IamPrincipal } from '../../iam/principal.decorator';
import { RequirePermission } from '../../iam/permission.decorator';
import { MaskedSecretConfigResponse } from './dto/masked-secret-config.dto';

import { CreateConfigurationDto } from './dto/create-config.dto';
import { UpdateConfigurationDto } from './dto/update-config.dto';

@Controller('api/platform/config')
export class ConfigurationController {
  constructor(private readonly configurationService: ConfigurationService) {}

  // GET /api/platform/config
  @Get()
  @RequirePermission('configurations.read')
  findAll() {
    return this.configurationService.findAll();
  }

  @Get('effective/:applicationId/:applicationVersionId/:environmentId')
  @RequirePermission('configurations.read')
  resolveEffectiveConfigurations(
    @Param('applicationId', new ParseUUIDPipe()) applicationId: string,
    @Param('applicationVersionId', new ParseUUIDPipe())
      applicationVersionId: string,
    @Param('environmentId', new ParseUUIDPipe()) environmentId: string,
  ) {
    return this.configurationService.resolveEffectiveConfigurations({
      applicationId,
      applicationVersionId,
      environmentId,
    });
  }

  // GET /api/platform/config/:id/history
  @Get(':id/history')
  @RequirePermission('configurations.read')
  getHistory(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.configurationService.getHistory(id);
  }

  // GET /api/platform/config/:scope/:scopeId
  @Get(':scope/:scopeId')
  @RequirePermission('configurations.read')
  findByScope(
    @Param('scope') scope: string,
    @Param('scopeId') scopeId: string,
  ) {
    return this.configurationService.findByScope(scope, scopeId);
  }

  // POST /api/platform/config
  @Post()
  @RequirePermission('configurations.write')
  create(@Body() dto: CreateConfigurationDto) {
    return this.configurationService.create(dto);
  }

  // PATCH /api/platform/config/:id
  @Patch(':id')
  @RequirePermission('configurations.write')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateConfigurationDto,
  ) {
    return this.configurationService.update(id, dto);
  }

  // POST /api/platform/config/:id/activate
  @Post(':id/activate')
  @RequirePermission('configurations.write')
  activate(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.configurationService.activate(id);
  }

  // POST /api/platform/config/:id/validate
  @Post(':id/validate')
  @RequirePermission('configurations.write')
  validate(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.configurationService.validate(id);
  }

  /**
   * GET /api/platform/config/:id/secret-safe
   *
   * Retourne la configuration avec la valeur secrète MASQUÉE
   * (selon le contrat). La valeur brute n'est retournée que si le
   * principal a explicitement la permission 'configurations.secrets.read'.
   */
  @Get(':id/secret-safe')
  @RequirePermission('configurations.read')
  async getSecretSafe(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ): Promise<MaskedSecretConfigResponse> {
    return this.configurationService.getSecretSafe(id, principal);
  }
}