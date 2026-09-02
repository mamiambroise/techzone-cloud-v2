import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { ContractsService } from '../contracts/contract.service';
import { CreateContractDto } from './dto/create-contract.dto';

@Controller('api/platform/contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  create(@Body() dto: CreateContractDto) {
    return this.contractsService.create(dto);
  }

  @Get()
  findAll() {
    return this.contractsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id);
  }

  @Post(':id/validate')
  validate(@Param('id') id: string) {
    return this.contractsService.validate(id);
  }

  @Post(':id/lock')
  lock(@Param('id') id: string) {
    return this.contractsService.lock(id);
  }

  @Get(':id/compatibility')
  compatibility(@Param('id') id: string) {
    return this.contractsService.getCompatibility(id);
  }
}
