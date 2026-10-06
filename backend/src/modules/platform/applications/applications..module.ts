import { Module } from '@nestjs/common';

import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { BusinessDefinitionModule } from '../../business-manager/business-definition.module';

@Module({
  imports: [BusinessDefinitionModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}