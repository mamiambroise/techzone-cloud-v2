import { Module } from '@nestjs/common';

import { EnvironmentsController } from '../environments/envrionment.controller';
import { EnvironmentsService } from '../environments/environment.service';

@Module({
  controllers: [EnvironmentsController],
  providers: [EnvironmentsService],
  exports: [EnvironmentsService],
})
export class EnvironmentsModule {}
