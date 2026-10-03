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
import { RequirePermission } from '../../../iam/permission.decorator';
import {
  INTEGRATION_READ,
  INTEGRATION_WRITE,
} from '../../../iam/iam.constants';
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
  @RequirePermission(INTEGRATION_WRITE)
  async create(@Body() dto: CreateApiDefinitionDto) {
    return this.apiManagerService.create(dto);
  }

  @Post('versions')
  @RequirePermission(INTEGRATION_WRITE)
  async createVersion(@Body() dto: CreateApiVersionDto) {
    return this.apiManagerService.createVersion(dto);
  }

  @Get()
  @RequirePermission(INTEGRATION_READ)
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
  @RequirePermission(INTEGRATION_READ)
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.apiManagerService.findOne(id);
  }

  @Get('code/:apiCode/version/:version')
  @RequirePermission(INTEGRATION_READ)
  async findByCodeAndVersion(
    @Param('apiCode') apiCode: string,
    @Param('version') version: string,
  ) {
    return this.apiManagerService.findByCodeAndVersion(apiCode, version);
  }

  @Patch(':id')
  @RequirePermission(INTEGRATION_WRITE)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateApiDefinitionDto,
  ) {
    return this.apiManagerService.update(id, dto);
  }

  @Post(':id/transition')
  @RequirePermission(INTEGRATION_WRITE)
  async transition(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body('status') status: ApiVersionLifecycleStatus,
    @Headers('Idempotency-Key') idempotencyKey?: string,
  ) {
    return this.apiManagerService.transition(id, status, idempotencyKey);
  }

  @Delete(':id')
  @RequirePermission(INTEGRATION_WRITE)
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.apiManagerService.remove(id);
  }
}