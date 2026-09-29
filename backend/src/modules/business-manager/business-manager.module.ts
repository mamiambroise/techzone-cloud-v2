import { Module } from '@nestjs/common';

import { DataModelModule } from './data-model/data-model.module';
import { FeaturesModule } from './features/features.module';
import { NavigationModule } from './navigation/navigation.module';
import { ContractsModule } from './contracts/contracts.module';
import { RuntimeBridgeModule } from './runtime/runtime-bridge.module';
import { QualityModule } from './quality/quality.module';

@Module({
  imports: [
    DataModelModule,
    FeaturesModule,
    NavigationModule,
    ContractsModule,
    RuntimeBridgeModule,
    QualityModule,
  ],
})
export class BusinessManagerModule {}
