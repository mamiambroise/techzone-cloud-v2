import { Module } from '@nestjs/common';

import { ApplicationVersionsController } from './application-versions.controller';
import { ApplicationVersionsService } from './application-versions.service';
import { BusinessDefinitionModule } from '../../business-manager/business-definition.module';

@Module({
  imports: [BusinessDefinitionModule],
  controllers: [ApplicationVersionsController],
  providers: [ApplicationVersionsService],
  exports: [ApplicationVersionsService],
})
export class ApplicationVersionsModule {}