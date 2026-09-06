import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CredentialService } from './credentials.service';
import { CreateCredentialDto, UpdateCredentialDto, RotateCredentialDto } from './dto/create-credential.dto';

@Controller('api/integrations/credentials')
export class CredentialsController {
  constructor(private readonly credentialService: CredentialService) {}

  @Post()
  async create(@Body() dto: CreateCredentialDto) {
    return this.credentialService.create(dto);
  }

  @Get()
  async findAll() {
    return this.credentialService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.credentialService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCredentialDto) {
    return this.credentialService.update(id, dto);
  }

  @Post(':id/rotate')
  async rotate(@Param('id') id: string, @Body() dto: RotateCredentialDto) {
    return this.credentialService.rotate(id, dto);
  }

  @Post(':id/disable')
  async disable(@Param('id') id: string) {
    return this.credentialService.disable(id);
  }

  @Post(':id/archive')
  async archive(@Param('id') id: string) {
    return this.credentialService.archive(id);
  }

  @Post(':id/test')
  async test(@Param('id') id: string) {
    return this.credentialService.test(id);
  }

  @Post(':id/associate/:connectorId')
  async associateToConnector(
    @Param('id') id: string,
    @Param('connectorId') connectorId: string,
  ) {
    return this.credentialService.associateToConnector(id, connectorId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.credentialService.archive(id);
  }
}
