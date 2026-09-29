import { BmTenantGuard } from '../bm-tenant.guard';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ContractsService } from './contracts.service';
import { CurrentPrincipal } from '../../../iam/principal.decorator';
import type { IamPrincipal } from '../../../iam/principal.decorator';
import { TenantResource } from '../../../iam/tenant-resource.decorator';
import { TenantGuard } from '../../../iam/tenant.guard';

import { CreateContractDto, UpdateContractDto } from './dto/create-contract.dto';

@TenantResource({ table: 'bm_contracts', idParam: 'contractId' })
@UseGuards(BmTenantGuard, TenantGuard)
@Controller('api/business-manager/contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get('versions/:versionId')
  findAll(
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.contractsService.findAllContracts(versionId, principal.tenantId);
  }

  @Post('versions/:versionId')
  create(
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @Body() dto: CreateContractDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.contractsService.createContract(versionId, dto, principal.tenantId);
  }

  @Get('contract/:contractId')
  findOne(
    @Param('contractId', new ParseUUIDPipe()) contractId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.contractsService.findOneContract(contractId, principal.tenantId);
  }

  @Patch('contract/:contractId')
  update(
    @Param('contractId', new ParseUUIDPipe()) contractId: string,
    @Body() dto: UpdateContractDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.contractsService.updateContract(contractId, dto, principal.tenantId);
  }

  @Post('contract/:contractId/validate')
  validate(
    @Param('contractId', new ParseUUIDPipe()) contractId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.contractsService.validateContract(contractId, principal.tenantId);
  }

  @Get('contract/:contractId/compatibility/:targetContractId')
  checkCompatibility(
    @Param('contractId', new ParseUUIDPipe()) contractId: string,
    @Param('targetContractId', new ParseUUIDPipe()) targetContractId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.contractsService.checkCompatibility(contractId, targetContractId, principal.tenantId);
  }

  @Get(':versionId/assemble')
  assembleContracts(
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.contractsService.assembleContracts(versionId, principal.tenantId);
  }
}
