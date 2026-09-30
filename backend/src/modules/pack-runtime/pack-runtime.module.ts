import { Module } from '@nestjs/common';
<<<<<<< HEAD
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
=======

import { PackRuntimeController } from './pack-runtime.controller';
import { RuntimeResolverService } from './runtime-resolver.service';

@Module({
  controllers: [PackRuntimeController],
  providers: [RuntimeResolverService],
  exports: [RuntimeResolverService],
>>>>>>> dc5feb88fd597836d806457a7b2a50727b017d02
})
export class PackRuntimeModule {}
