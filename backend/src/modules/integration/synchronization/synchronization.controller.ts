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
import { SynchronizationService } from './synchronization.service';
import {
  CreateSynchronizationDto,
  SynchronizationDirectionEnum,
  SynchronizationModeEnum,
} from './dto/create-synchronization.dto';
import { UpdateSynchronizationDto } from './dto/update-synchronization.dto';
import { RunSynchronizationDto } from './dto/run-synchronization.dto';
import { IdempotencyService } from '../../../common/resilience/idempotency.service';

@Controller('api/integrations/synchronizations')
export class SynchronizationController {
  constructor(
    private readonly syncService: SynchronizationService,
    private readonly idempotency: IdempotencyService,
  ) {}

  @Post()
  async create(@Body() dto: CreateSynchronizationDto) {
    return this.syncService.create(dto);
  }

  @Get()
  async findAll(
    @Query('connectorId') connectorId?: string,
    @Query('direction') direction?: SynchronizationDirectionEnum,
    @Query('mode') mode?: SynchronizationModeEnum,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.syncService.findAll({
      connectorId,
      direction,
      mode,
      status,
      page,
      limit,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.syncService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSynchronizationDto,
  ) {
    return this.syncService.update(id, dto);
  }

  @Post(':id/run')
  async run(
    @Param('id') id: string,
    @Body() dto?: RunSynchronizationDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    if (idempotencyKey) {
      return this.idempotency.execute(`sync-run:${id}:${idempotencyKey}`, () =>
        this.syncService.run(id, dto),
      );
    }
    return this.syncService.run(id, dto);
  }

  @Post(':id/pause')
  async pause(@Param('id') id: string) {
    return this.syncService.pause(id);
  }

  @Post(':id/resume')
  async resume(@Param('id') id: string) {
    return this.syncService.resume(id);
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.syncService.cancel(id);
  }

  @Get(':id/history')
  async getHistory(@Param('id') id: string) {
    return this.syncService.getHistory(id);
  }
}
