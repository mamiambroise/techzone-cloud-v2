import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ApplicationsModule } from './modules/platform/applications/applications..module';
import { ApplicationVersionsModule } from './modules/platform/application-versions/application-versions.module';
import { EnvironmentsModule } from './modules/platform/environments/environment.module';
import { ContractsModule } from './modules/platform/contracts/contract.module';
import { ConfigurationModule } from './modules/platform/configuration/configuration.module';
import { SnapshotsModule } from './modules/platform/snapshots/snapshot.module';

@Module({
  imports: [
    PrismaModule,
    ApplicationsModule,
    ApplicationVersionsModule,
    EnvironmentsModule,
    ContractsModule,
    ConfigurationModule,
    SnapshotsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
