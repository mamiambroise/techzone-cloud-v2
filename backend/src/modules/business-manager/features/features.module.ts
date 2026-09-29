import { Module } from '@nestjs/common';
import { FeaturesController } from './features.controller';
import { FeatureCapabilityService } from './features.service';

@Module({
  controllers: [FeaturesController],
  providers: [FeatureCapabilityService],
  exports: [FeatureCapabilityService],
})
export class FeaturesModule {}
