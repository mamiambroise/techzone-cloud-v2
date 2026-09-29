import { Module } from '@nestjs/common';
import { RuntimeBridgeController } from './runtime-bridge.controller';
import { RuntimeBridgeService } from './runtime-bridge.service';

@Module({
  controllers: [RuntimeBridgeController],
  providers: [RuntimeBridgeService],
  exports: [RuntimeBridgeService],
})
export class RuntimeBridgeModule {}
