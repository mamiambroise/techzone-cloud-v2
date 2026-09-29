import { BmTenantGuard } from '../../business-manager/bm-tenant.guard';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ContractsService } from '../contracts/contract.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { CurrentPrincipal } from '../../../iam/principal.decorator';
import type { IamPrincipal } from '../../../iam/principal.decorator';
import { TenantResource } from '../../../iam/tenant-resource.decorator';
import { TenantGuard } from '../../../iam/tenant.guard';

@TenantResource({ table: 'contract', idParam: 'id' })
@UseGuards(BmTenantGuard, TenantGuard)
@Controller('api/business-manager/contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  create(
    @Body() dto: CreateContractDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.contractsService.create(dto, principal.tenantId);
  }

  @Get()
  findAll(@CurrentPrincipal() principal: IamPrincipal) {
    return this.contractsService.findAll(principal.tenantId);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.contractsService.findOne(id, principal.tenantId);
  }

  @Post(':id/validate')
  validate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.contractsService.validate(id, principal.tenantId);
  }

  @Post(':id/lock')
  lock(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.contractsService.lock(id, principal.tenantId);
  }

  @Get(':id/history')
  history(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.contractsService.getHistory(id, principal.tenantId);
  }

  @Get(':id/compatibility')
  compatibility(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.contractsService.getCompatibility(id, principal.tenantId);
  }
}
