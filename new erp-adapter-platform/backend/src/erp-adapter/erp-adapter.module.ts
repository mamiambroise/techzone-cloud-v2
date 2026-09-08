import { Module } from '@nestjs/common';
import { ErpAdapterService } from './erp-adapter.service';
import { ErpAdapterController } from './erp-adapter.controller';
import { ErpRegistryModule } from '../erp-registry/erp-registry.module';
import { MockAdapter } from './mock/mock.adapter';
import { DolibarrAdapter } from './dolibarr/dolibarr.adapter';

@Module({
  imports: [ErpRegistryModule],
  controllers: [ErpAdapterController],
  providers: [
    ErpAdapterService,
    MockAdapter,
    DolibarrAdapter,
  ],
  exports: [ErpAdapterService, MockAdapter, DolibarrAdapter],
})
export class ErpAdapterModule {}
