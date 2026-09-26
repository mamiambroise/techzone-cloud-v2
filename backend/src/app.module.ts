import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { IamModule } from './iam/iam.module';
import { PlatformModule } from './modules/platform/platform.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { DeploymentModule } from './modules/deployment/deployment.module';

@Module({
  imports: [PrismaModule, IamModule, PlatformModule, IntegrationModule, DeploymentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
