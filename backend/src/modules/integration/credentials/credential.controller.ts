import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CredentialService } from './credential.service';
import { CreateCredentialDto, CredentialTypeEnum } from './dto/create-credential.dto';
import { CredentialStatusEnum, UpdateCredentialDto } from './dto/update-credential.dto';
import { RotateCredentialDto } from './dto/rotate-credential.dto';

@Controller('api/integrations/credentials')
export class CredentialController {
  constructor(private readonly credentialService: CredentialService) {}

  @Post()
  async create(@Body() dto: CreateCredentialDto) {
    return this.credentialService.create(dto);
  }

  @Get()
  async findAll(
    @Query('type') type?: CredentialTypeEnum,
    @Query('provider') provider?: string,
    @Query('status') status?: CredentialStatusEnum,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.credentialService.findAll({
      type,
      provider,
      status,
      page,
      limit,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.credentialService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCredentialDto,
  ) {
    return this.credentialService.update(id, dto);
  }

  @Post(':id/rotate')
  async rotate(
    @Param('id') id: string,
    @Body() dto: RotateCredentialDto,
  ) {
    return this.credentialService.rotate(id, dto);
  }

  @Post(':id/test')
  async testConnectivity(@Param('id') id: string) {
    return this.credentialService.testConnectivity(id);
  }

  @Post(':id/disable')
  async disable(@Param('id') id: string) {
    return this.credentialService.disable(id);
  }

  @Post(':id/archive')
  async archive(@Param('id') id: string) {
    return this.credentialService.archive(id);
  }
}
