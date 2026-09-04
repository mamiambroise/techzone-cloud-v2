import { Module } from '@nestjs/common';

import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';

import { ApplicationsModule } from '../platform/applications/applications..module';
import { ApplicationVersionsModule } from '../platform/application-versions/application-versions.module';
import { EnvironmentsModule } from '../platform/environments/environment.module';
import { ContractsModule } from '../platform/contracts/contract.module';
import { ConfigurationModule } from '../platform/configuration/configuration.module';
import { SnapshotsModule } from '../platform/snapshots/snapshot.module';

@Module({
  imports: [
    ApplicationsModule,
    ApplicationVersionsModule,
    EnvironmentsModule,
    ContractsModule,
    ConfigurationModule,
    SnapshotsModule,
  ],

  controllers: [PlatformController],

  providers: [PlatformService],
})
export class PlatformModule {}
