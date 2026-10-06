import { forwardRef, Module } from '@nestjs/common';
import { ErpAdapterService } from './erp-adapter.service';
import { ErpAdapterController } from './erp-adapter.controller';
import { ErpRegistryModule } from '../erp-registry/erp-registry.module';
import { MockAdapter } from './mock/mock.adapter';
import { DolibarrAdapter } from './dolibarr/dolibarr.adapter';
import { ErpCapabilityService } from './capabilities/erp-capability.service';
import { ErpCommandService } from './commands/erp-command.service';
import { ErpResourceCatalogService } from './catalog/erp-resource-catalog.service';
import { ErpResourceCatalogController } from './catalog/erp-resource-catalog.controller';

@Module({
  imports: [forwardRef(() => ErpRegistryModule)],
  controllers: [ErpAdapterController, ErpResourceCatalogController],
  providers: [
    ErpAdapterService,
    MockAdapter,
    DolibarrAdapter,
    ErpCapabilityService,
    ErpCommandService,
    ErpResourceCatalogService,
  ],
  exports: [ErpAdapterService, MockAdapter, DolibarrAdapter, ErpCapabilityService, ErpCommandService, ErpResourceCatalogService],
})
export class ErpAdapterModule {}
