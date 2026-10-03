import { Module } from '@nestjs/common';
import { PackManagerController } from './pack-manager.controller';
import { PackManagerService } from './pack-manager.service';
import { UiBuilderModule } from '../ui-builder/ui-builder.module';

@Module({
  imports: [UiBuilderModule],
  controllers: [PackManagerController],
  providers: [PackManagerService],
  exports: [PackManagerService],
})
export class PackManagerModule {}
