import { BmTenantGuard } from '../../business-manager/bm-tenant.guard';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Headers,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';

import { SnapshotsService } from '../snapshots/snapshot.service';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';
import { CurrentPrincipal } from '../../../iam/principal.decorator';
import type { IamPrincipal } from '../../../iam/principal.decorator';
import { TenantResource } from '../../../iam/tenant-resource.decorator';
import { TenantGuard } from '../../../iam/tenant.guard';

@TenantResource({ table: 'snapshot', idParam: 'id' })
@UseGuards(BmTenantGuard, TenantGuard)
@Controller('api/business-manager/snapshots')
export class SnapshotsController {
  constructor(private readonly snapshotsService: SnapshotsService) {}

  @Post()
  create(
    @Body() dto: CreateSnapshotDto,
    @Headers('x-trace-id') traceId: string | undefined,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.snapshotsService.create(dto, traceId, principal.tenantId);
  }

  @Get()
  findAll(@CurrentPrincipal() principal: IamPrincipal) {
    return this.snapshotsService.findAll(principal.tenantId);
  }

  @Get('compare')
  compare(
    @Query('left', new ParseUUIDPipe()) left: string,
    @Query('right', new ParseUUIDPipe()) right: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.snapshotsService.compare(left, right, principal.tenantId);
  }

  @Get(':id/history')
  getHistory(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.snapshotsService.getHistory(id, principal.tenantId);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.snapshotsService.findOne(id, principal.tenantId);
  }

  @Post(':id/validate')
  validate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('x-trace-id') traceId: string | undefined,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.snapshotsService.validate(id, traceId, principal.tenantId);
  }

  @Post(':id/activate')
  activate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('x-trace-id') traceId: string | undefined,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.snapshotsService.activate(id, traceId, principal.tenantId);
  }

  @Post(':id/archive')
  archive(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('x-trace-id') traceId: string | undefined,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.snapshotsService.archive(id, traceId, principal.tenantId);
  }
}
