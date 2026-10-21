import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentPrincipal } from '../iam/principal.decorator';
import type { IamPrincipal } from '../iam/principal.decorator';
import { RequirePermission } from '../iam/permission.decorator';
import { RegistryService } from './registry.service';

@Controller('api/registry')
export class RegistryController {
  constructor(private readonly registry: RegistryService) {}

  @Get('overview')
  @RequirePermission('registry.read')
  overview(@CurrentPrincipal() principal: IamPrincipal) {
    return this.registry.overview(principal);
  }

  @Get('namespaces')
  @RequirePermission('registry.read')
  namespaces(@CurrentPrincipal() principal: IamPrincipal) {
    return this.registry.listNamespaces(principal);
  }

  @Get('sources')
  @RequirePermission('registry.read')
  sources(@CurrentPrincipal() principal: IamPrincipal) {
    return this.registry.listSources(principal);
  }

  @Get('entries')
  @RequirePermission('registry.read')
  entries(
    @CurrentPrincipal() principal: IamPrincipal,
    @Query('namespace') namespace?: string,
    @Query('status') status?: string,
    @Query('query') query?: string,
  ) {
    return this.registry.listEntries(principal, { namespace, status, query });
  }

  @Get('entries/:id')
  @RequirePermission('registry.read')
  entry(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.registry.getEntry(principal, id);
  }

  @Post('entries')
  register(
    @Body() input: Parameters<RegistryService['register']>[1],
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.registry.register(principal, input);
  }

  @Post('resolve')
  @RequirePermission('registry.resolve')
  resolve(
    @Body() input: Parameters<RegistryService['resolve']>[1],
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.registry.resolve(principal, input);
  }

  @Get('capabilities')
  @RequirePermission('registry.read')
  capabilities(
    @CurrentPrincipal() principal: IamPrincipal,
    @Query('query') query?: string,
  ) {
    return this.registry.listCapabilities(principal, query);
  }

  @Get('providers')
  @RequirePermission('registry.read')
  providers(@CurrentPrincipal() principal: IamPrincipal) {
    return this.registry.listProviders(principal);
  }

  @Get('schemas')
  @RequirePermission('registry.read')
  schemas(@CurrentPrincipal() principal: IamPrincipal) {
    return this.registry.listSchemas(principal);
  }

  @Get('compatibility')
  @RequirePermission('registry.compatibility.read')
  compatibility(@CurrentPrincipal() principal: IamPrincipal) {
    return this.registry.listCompatibilities(principal);
  }

  @Get('availability')
  @RequirePermission('registry.availability.read')
  availability(@CurrentPrincipal() principal: IamPrincipal) {
    return this.registry.listAvailability(principal);
  }

  @Get('diagnostics')
  @RequirePermission('registry.diagnostics.read')
  diagnostics(@CurrentPrincipal() principal: IamPrincipal) {
    return this.registry.listDiagnostics(principal);
  }

  @Get('audit')
  @RequirePermission('registry.read')
  audit(@CurrentPrincipal() principal: IamPrincipal) {
    return this.registry.listAudit(principal);
  }

  @Post('entries/:id/deprecate')
  @RequirePermission('registry.deprecate')
  deprecate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body()
    input: {
      replacementKey?: string;
      removalTarget?: string;
      message: string;
    },
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.registry.deprecate(principal, id, input);
  }

  @Patch('entries/:id/disable')
  @RequirePermission('registry.disable')
  disable(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body('reason') reason: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.registry.disable(principal, id, reason);
  }

  @Delete('entries/:id')
  @RequirePermission('registry.remove')
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body('reason') reason: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.registry.remove(principal, id, reason);
  }
}
