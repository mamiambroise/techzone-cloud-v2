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
import { SynchronizationService } from './synchronization.service';
import { RequirePermission } from '../../../iam/permission.decorator';
import {
  INTEGRATION_READ,
  INTEGRATION_WRITE,
  INTEGRATION_EXECUTE,
} from '../../../iam/iam.constants';
import {
  CreateSynchronizationDto,
  UpdateSynchronizationDto,
} from './dto/create-synchronization.dto';

@Controller('api/integrations/synchronizations')
export class SynchronizationController {
  constructor(
    private readonly synchronizationService: SynchronizationService,
  ) {}

  @Post()
  @RequirePermission(INTEGRATION_WRITE)
  async create(@Body() dto: CreateSynchronizationDto) {
    return this.synchronizationService.create(dto);
  }

  @Get()
  @RequirePermission(INTEGRATION_READ)
  async findAll() {
    return this.synchronizationService.findAll();
  }

  @Get(':id')
  @RequirePermission(INTEGRATION_READ)
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.synchronizationService.findOne(id);
  }

  @Get(':id/checkpoint')
  @RequirePermission(INTEGRATION_READ)
  async getCheckpoint(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.synchronizationService.getCheckpoint(id);
  }

  @Patch(':id')
  @RequirePermission(INTEGRATION_WRITE)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSynchronizationDto,
  ) {
    return this.synchronizationService.update(id, dto);
  }

  @Post(':id/run')
  @RequirePermission(INTEGRATION_EXECUTE)
  async run(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.synchronizationService.run(id);
  }

  @Post(':id/resume')
  @RequirePermission(INTEGRATION_EXECUTE)
  async resume(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.synchronizationService.resume(id);
  }

  @Post(':id/pause')
  @RequirePermission(INTEGRATION_EXECUTE)
  async pause(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.synchronizationService.pause(id);
  }

  @Post(':id/cancel')
  @RequirePermission(INTEGRATION_EXECUTE)
  async cancel(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.synchronizationService.cancel(id);
  }

  @Delete(':id')
  @RequirePermission(INTEGRATION_WRITE)
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.synchronizationService.remove(id);
  }
}