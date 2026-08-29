import { Module } from '@nestjs/common';
import { ErpRegistryService } from './erp-registry.service';
import { ErpRegistryController } from './erp-registry.controller';

@Module({
  controllers: [ErpRegistryController],
  providers: [ErpRegistryService],
  exports: [ErpRegistryService],
})
export class ErpRegistryModule {}
