import { Module } from '@nestjs/common';

import { ApplicationVersionsController } from './application-versions.controller';
import { ApplicationVersionsService } from './application-versions.service';

@Module({
  controllers: [ApplicationVersionsController],
  providers: [ApplicationVersionsService],
  exports: [ApplicationVersionsService],
})
export class ApplicationVersionsModule {}
