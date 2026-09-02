import { Module } from '@nestjs/common';

import { ContractsController } from '../contracts/contract.controller';
import { ContractsService } from '../contracts/contract.service';

@Module({
  controllers: [ContractsController],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}
