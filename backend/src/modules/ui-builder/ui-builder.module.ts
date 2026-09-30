import { Module } from '@nestjs/common';

import { UiBuilderController } from './ui-builder.controller';
import { UiBuilderService } from './ui-builder.service';

@Module({
  controllers: [UiBuilderController],
  providers: [UiBuilderService],
  exports: [UiBuilderService],
})
export class UiBuilderModule {}
