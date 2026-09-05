import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ReleaseService } from './release.service';
import { CreateReleaseDto } from './dto/create-release-dto';
import { QueryReleaseDto } from './dto/query-release.dto';
import { ApproveReleaseDto } from './dto/approve-release.dto';

@Controller('api/releases')
export class ReleaseController {
  constructor(private readonly releaseService: ReleaseService) {}

  @Post()
  create(@Body() dto: CreateReleaseDto) {
    return this.releaseService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryReleaseDto) {
    return this.releaseService.findAll(query);
  }

  @Get('compare/:id1/:id2')
  compare(@Param('id1') id1: string, @Param('id2') id2: string) {
    return this.releaseService.compare(id1, id2);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.releaseService.findOne(id);
  }

  @Post(':id/assemble')
  assemble(@Param('id') id: string) {
    return this.releaseService.assemble(id);
  }

  @Post(':id/validate')
  validate(@Param('id') id: string) {
    return this.releaseService.validate(id);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: ApproveReleaseDto) {
    return this.releaseService.approve(id, dto);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.releaseService.publish(id);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string) {
    return this.releaseService.archive(id);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.releaseService.getHistory(id);
  }
}
