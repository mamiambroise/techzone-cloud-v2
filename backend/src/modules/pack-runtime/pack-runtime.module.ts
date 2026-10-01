import { Module } from '@nestjs/common';
import { RuntimeBridgeModule } from '../business-manager/runtime/runtime-bridge.module';
import { PackManagerModule } from '../pack-manager/pack-manager.module';
import { PackRuntimeController } from './pack-runtime.controller';
import { PackRuntimeService } from './pack-runtime.service';
import { RuntimeCacheService } from './runtime-cache.service';

@Module({
  imports: [RuntimeBridgeModule, PackManagerModule],
  controllers: [PackRuntimeController],
  providers: [PackRuntimeService, RuntimeCacheService],
  exports: [RuntimeCacheService],
})
export class PackRuntimeModule {}
