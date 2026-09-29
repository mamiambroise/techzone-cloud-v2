import { Module } from '@nestjs/common';
import { QualityController } from './quality.controller';
import { QualityEngineService } from './quality-engine.service';

@Module({
  controllers: [QualityController],
  providers: [QualityEngineService],
  exports: [QualityEngineService],
})
export class QualityModule {}
