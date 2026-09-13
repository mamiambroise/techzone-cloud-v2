import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Headers,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiManagerService } from './api-manager.service';
import {
  CreateApiDefinitionDto,
  UpdateApiDefinitionDto,
  CreateApiVersionDto,
} from './dto/create-api-definition.dto';
import type { ApiVersionLifecycleStatus } from './dto/create-api-definition.dto';

@Controller('api/integrations/apis')
export class ApiManagerController {
  constructor(private readonly apiManagerService: ApiManagerService) {}

  @Post()
  async create(@Body() dto: CreateApiDefinitionDto) {
    return this.apiManagerService.create(dto);
  }

  @Post('versions')
  async createVersion(@Body() dto: CreateApiVersionDto) {
    return this.apiManagerService.createVersion(dto);
  }

  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('apiCode') apiCode?: string,
  ) {
    return this.apiManagerService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      apiCode,
    });
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.apiManagerService.findOne(id);
  }

  @Get('code/:apiCode/version/:version')
  async findByCodeAndVersion(
    @Param('apiCode') apiCode: string,
    @Param('version') version: string,
  ) {
    return this.apiManagerService.findByCodeAndVersion(apiCode, version);
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateApiDefinitionDto,
  ) {
    return this.apiManagerService.update(id, dto);
  }

  @Post(':id/transition')
  async transition(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body('status') status: ApiVersionLifecycleStatus,
    @Headers('Idempotency-Key') idempotencyKey?: string,
  ) {
    return this.apiManagerService.transition(id, status, idempotencyKey);
  }

  @Delete(':id')
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.apiManagerService.remove(id);
  }
}
