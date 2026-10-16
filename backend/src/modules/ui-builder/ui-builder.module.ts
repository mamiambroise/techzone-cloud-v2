import { Module } from '@nestjs/common';
import { AutomationModule } from '../../automation/automation.module';

import { UiBuilderController } from './ui-builder.controller';
import { UiBuilderService } from './ui-builder.service';

@Module({
  imports: [AutomationModule],
  controllers: [UiBuilderController],
  providers: [UiBuilderService],
  exports: [UiBuilderService],
})
export class UiBuilderModule {}
