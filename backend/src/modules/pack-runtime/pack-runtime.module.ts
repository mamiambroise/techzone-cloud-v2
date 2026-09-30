import { Module } from '@nestjs/common';

import { PackRuntimeController } from './pack-runtime.controller';
import { RuntimeResolverService } from './runtime-resolver.service';

@Module({
  controllers: [PackRuntimeController],
  providers: [RuntimeResolverService],
  exports: [RuntimeResolverService],
})
export class PackRuntimeModule {}
