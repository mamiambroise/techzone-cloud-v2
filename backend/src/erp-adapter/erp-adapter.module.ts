import { forwardRef, Module } from '@nestjs/common';
import { ErpAdapterService } from './erp-adapter.service';
import { ErpAdapterController } from './erp-adapter.controller';
import { ErpRegistryModule } from '../erp-registry/erp-registry.module';
import { MockAdapter } from './mock/mock.adapter';
import { DolibarrAdapter } from './dolibarr/dolibarr.adapter';
import { ErpCapabilityService } from './capabilities/erp-capability.service';
import { ErpCommandService } from './commands/erp-command.service';

@Module({
  imports: [forwardRef(() => ErpRegistryModule)],
  controllers: [ErpAdapterController],
  providers: [
    ErpAdapterService,
    MockAdapter,
    DolibarrAdapter,
    ErpCapabilityService,
    ErpCommandService,
  ],
  exports: [ErpAdapterService, MockAdapter, DolibarrAdapter, ErpCapabilityService, ErpCommandService],
})
export class ErpAdapterModule {}
