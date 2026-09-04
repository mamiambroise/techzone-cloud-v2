import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiDefinitionService } from './api-definition.service';
import { CreateApiDto } from './dto/create-api.dto';
import { UpdateApiDto } from './dto/update-api.dto';
import { NewApiVersionDto } from './dto/new-version.dto';
import { IdempotencyService } from '../../../common/resilience/idempotency.service';

@Controller('api/integrations/apis')
export class ApiDefinitionController {
  constructor(
    private readonly apiService: ApiDefinitionService,
    private readonly idempotency: IdempotencyService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateApiDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    if (idempotencyKey) {
      return this.idempotency.execute(`create-api:${idempotencyKey}`, () =>
        this.apiService.create(dto),
      );
    }
    return this.apiService.create(dto);
  }

  @Get()
  async findAll(
    @Query('apiCode') apiCode?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.apiService.findAll({ apiCode, status, page, limit });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.apiService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateApiDto) {
    return this.apiService.update(id, dto);
  }

  @Post(':id/validate')
  async validate(@Param('id') id: string) {
    return this.apiService.validate(id);
  }

  @Post(':id/publish')
  async publish(@Param('id') id: string) {
    return this.apiService.publish(id);
  }

  @Post(':id/deprecate')
  async deprecate(@Param('id') id: string) {
    return this.apiService.deprecate(id);
  }

  @Post(':id/retire')
  async retire(@Param('id') id: string) {
    return this.apiService.retire(id);
  }

  @Post(':id/new-version')
  async createNewVersion(
    @Param('id') id: string,
    @Body() dto: NewApiVersionDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    if (idempotencyKey) {
      return this.idempotency.execute(
        `new-version:${id}:${idempotencyKey}`,
        () => this.apiService.createNewVersion(id, dto),
      );
    }
    return this.apiService.createNewVersion(id, dto);
  }
}
