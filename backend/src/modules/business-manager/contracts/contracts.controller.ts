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
import { RequirePermission } from '../../../iam/permission.decorator';
import { BM_CONTRACT_READ, BM_CONTRACT_WRITE } from '../../../iam/iam.constants';

import { CreateContractDto, UpdateContractDto } from './dto/create-contract.dto';

@TenantResource({ table: 'bmBusinessContract', idParam: 'contractId' })
@UseGuards(BmTenantGuard, TenantGuard)
@Controller('api/business-manager/contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @RequirePermission(BM_CONTRACT_READ)
  @Get('versions/:versionId')
  findAll(
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.contractsService.findAllContracts(versionId, principal.tenantId);
  }

  @RequirePermission(BM_CONTRACT_WRITE)
  @Post('versions/:versionId')
  create(
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @Body() dto: CreateContractDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.contractsService.createContract(versionId, dto, principal.tenantId);
  }

  @RequirePermission(BM_CONTRACT_READ)
  @Get('contract/:contractId')
  findOne(
    @Param('contractId', new ParseUUIDPipe()) contractId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.contractsService.findOneContract(contractId, principal.tenantId);
  }

  @RequirePermission(BM_CONTRACT_WRITE)
  @Patch('contract/:contractId')
  update(
    @Param('contractId', new ParseUUIDPipe()) contractId: string,
    @Body() dto: UpdateContractDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.contractsService.updateContract(contractId, dto, principal.tenantId);
  }

  @RequirePermission(BM_CONTRACT_WRITE)
  @Post('contract/:contractId/validate')
  validate(
    @Param('contractId', new ParseUUIDPipe()) contractId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.contractsService.validateContract(contractId, principal.tenantId);
  }

  @RequirePermission(BM_CONTRACT_READ)
  @Get('contract/:contractId/compatibility/:targetContractId')
  checkCompatibility(
    @Param('contractId', new ParseUUIDPipe()) contractId: string,
    @Param('targetContractId', new ParseUUIDPipe()) targetContractId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.contractsService.checkCompatibility(contractId, targetContractId, principal.tenantId);
  }

  @RequirePermission(BM_CONTRACT_READ)
  @Get(':versionId/assemble')
  assembleContracts(
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.contractsService.assembleContracts(versionId, principal.tenantId);
  }
}
