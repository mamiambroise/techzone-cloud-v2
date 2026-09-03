import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Headers,
} from '@nestjs/common';
import { SnapshotsService } from '../snapshots/snapshot.service';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';

@Controller('api/platform/snapshots')
export class SnapshotsController {
  constructor(private readonly snapshotsService: SnapshotsService) {}

  @Post()
  create(
    @Body() dto: CreateSnapshotDto,
    @Headers('x-trace-id') traceId?: string,
  ) {
    return this.snapshotsService.create(dto, traceId);
  }

  @Get()
  findAll() {
    return this.snapshotsService.findAll();
  }

  @Get('compare')
  compare(@Query('left') left: string, @Query('right') right: string) {
    return this.snapshotsService.compare(left, right);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.snapshotsService.getHistory(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.snapshotsService.findOne(id);
  }

  @Post(':id/validate')
  validate(@Param('id') id: string, @Headers('x-trace-id') traceId?: string) {
    return this.snapshotsService.validate(id, traceId);
  }

  @Post(':id/activate')
  activate(@Param('id') id: string, @Headers('x-trace-id') traceId?: string) {
    return this.snapshotsService.activate(id, traceId);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string, @Headers('x-trace-id') traceId?: string) {
    return this.snapshotsService.archive(id, traceId);
  }
}
