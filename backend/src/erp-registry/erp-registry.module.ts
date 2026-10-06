import { forwardRef, Module } from '@nestjs/common';
import { ErpAdapterModule } from '../erp-adapter/erp-adapter.module';
import { ErpRegistryService } from './erp-registry.service';
import { ExternalResourceLinkService } from './external-resource-link.service';
import { ErpRegistryController } from './erp-registry.controller';

@Module({
  imports: [forwardRef(() => ErpAdapterModule)],
  controllers: [ErpRegistryController],
  providers: [ErpRegistryService, ExternalResourceLinkService],
  exports: [ErpRegistryService, ExternalResourceLinkService],
})
export class ErpRegistryModule {}
