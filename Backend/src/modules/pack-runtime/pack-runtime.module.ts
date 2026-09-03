import { Module } from '@nestjs/common';
import { BusinessManagerModule } from '../business-manager/business-manager.module';
import { PackRuntimeController } from './pack-runtime.controller';
import { PackRuntimeService } from './pack-runtime.service';
import { RuntimeCacheService } from './runtime-cache.service';

@Module({
  imports: [BusinessManagerModule],
  controllers: [PackRuntimeController],
  providers: [PackRuntimeService, RuntimeCacheService],
  exports: [RuntimeCacheService],
})
export class PackRuntimeModule {}
