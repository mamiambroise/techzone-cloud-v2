import { Module } from '@nestjs/common';
import { ErpRegistryService } from './erp-registry.service';
import { ExternalResourceLinkService } from './external-resource-link.service';
import { ErpRegistryController } from './erp-registry.controller';

@Module({
  controllers: [ErpRegistryController],
  providers: [ErpRegistryService, ExternalResourceLinkService],
  exports: [ErpRegistryService, ExternalResourceLinkService],
})
export class ErpRegistryModule {}
