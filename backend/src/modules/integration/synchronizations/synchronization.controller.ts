import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { SynchronizationService } from './synchronization.service';
import { CreateSynchronizationDto, UpdateSynchronizationDto } from './dto/create-synchronization.dto';

@Controller('api/integrations/synchronizations')
export class SynchronizationController {
  constructor(
    private readonly synchronizationService: SynchronizationService,
  ) {}

  @Post()
  async create(@Body() dto: CreateSynchronizationDto) {
    return this.synchronizationService.create(dto);
  }

  @Get()
  async findAll() {
    return this.synchronizationService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.synchronizationService.findOne(id);
  }

  @Get(':id/checkpoint')
  async getCheckpoint(@Param('id') id: string) {
    return this.synchronizationService.getCheckpoint(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSynchronizationDto) {
    return this.synchronizationService.update(id, dto);
  }

  @Post(':id/run')
  async run(@Param('id') id: string) {
    return this.synchronizationService.run(id);
  }

  @Post(':id/resume')
  async resume(@Param('id') id: string) {
    return this.synchronizationService.resume(id);
  }

  @Post(':id/pause')
  async pause(@Param('id') id: string) {
    return this.synchronizationService.pause(id);
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.synchronizationService.cancel(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.synchronizationService.remove(id);
  }
}
