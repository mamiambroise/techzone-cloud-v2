import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CredentialService } from './credentials.service';
import { RequirePermission } from '../../../iam/permission.decorator';
import {
  INTEGRATION_CREDENTIAL_READ,
  INTEGRATION_CREDENTIAL_WRITE,
  INTEGRATION_EXECUTE,
} from '../../../iam/iam.constants';
import {
  CreateCredentialDto,
  UpdateCredentialDto,
  RotateCredentialDto,
} from './dto/create-credential.dto';

// Les rÃ©fÃ©rences de secrets sont la surface la plus sensible de l'Integration
// Hub : lecture et Ã©criture ont donc des permissions distinctes de celles du
// catalogue, et `test` (qui n'altÃ¨re pas le secret) reste une action d'exÃ©cution.
@Controller('api/integrations/credentials')
export class CredentialsController {
  constructor(private readonly credentialService: CredentialService) {}

  @Post()
  @RequirePermission(INTEGRATION_CREDENTIAL_WRITE)
  async create(@Body() dto: CreateCredentialDto) {
    return this.credentialService.create(dto);
  }

  @Get()
  @RequirePermission(INTEGRATION_CREDENTIAL_READ)
  async findAll() {
    return this.credentialService.findAll();
  }

  @Get(':id')
  @RequirePermission(INTEGRATION_CREDENTIAL_READ)
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.credentialService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission(INTEGRATION_CREDENTIAL_WRITE)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCredentialDto,
  ) {
    return this.credentialService.update(id, dto);
  }

  @Post(':id/rotate')
  @RequirePermission(INTEGRATION_CREDENTIAL_WRITE)
  async rotate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RotateCredentialDto,
  ) {
    return this.credentialService.rotate(id, dto);
  }

  @Post(':id/disable')
  @RequirePermission(INTEGRATION_CREDENTIAL_WRITE)
  async disable(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.credentialService.disable(id);
  }

  @Post(':id/archive')
  @RequirePermission(INTEGRATION_CREDENTIAL_WRITE)
  async archive(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.credentialService.archive(id);
  }

  @Post(':id/test')
  @RequirePermission(INTEGRATION_EXECUTE)
  async test(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.credentialService.test(id);
  }

  @Post(':id/associate/:connectorId')
  @RequirePermission(INTEGRATION_CREDENTIAL_WRITE)
  async associateToConnector(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('connectorId', new ParseUUIDPipe()) connectorId: string,
  ) {
    return this.credentialService.associateToConnector(id, connectorId);
  }

  @Delete(':id')
  @RequirePermission(INTEGRATION_CREDENTIAL_WRITE)
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.credentialService.archive(id);
  }
}