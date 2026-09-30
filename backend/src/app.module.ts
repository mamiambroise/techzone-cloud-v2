import { Module } from '@nestjs/common';
import { PackManagerModule } from './modules/pack-manager/pack-manager.module';
import { PackRuntimeModule } from './modules/pack-runtime/pack-runtime.module';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './common/mail/mail.module';
import { IamModule } from './iam/iam.module';
import { PlatformModule } from './modules/platform/platform.module';
import { BusinessManagerModule } from './modules/business-manager/business-manager.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { DeploymentModule } from './modules/deployment/deployment.module';
import { ErpAdapterModule } from './erp-adapter/erp-adapter.module';
import { DataRuntimeModule } from './data-runtime/data-runtime.module';
import { AutomationModule } from './automation/automation.module';
import { ErpRegistryModule } from './erp-registry/erp-registry.module';
import { ConfigController } from './config/config.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    MailModule,
    IamModule,
    PlatformModule,
    BusinessManagerModule,
    PackManagerModule,
    PackRuntimeModule,
    IntegrationModule,
    DeploymentModule,
    ErpRegistryModule,
    ErpAdapterModule,
    DataRuntimeModule,
    AutomationModule,
  ],
  controllers: [AppController, ConfigController],
  providers: [AppService],
})
export class AppModule {}
