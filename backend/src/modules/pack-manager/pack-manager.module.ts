import { Module } from '@nestjs/common';

import { PackManagerController } from './pack-manager.controller';
import { PackManagerService } from './pack-manager.service';

@Module({
  controllers: [PackManagerController],
  providers: [PackManagerService],
  exports: [PackManagerService],
})
export class PackManagerModule {}
