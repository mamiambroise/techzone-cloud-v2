import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PlatformModule } from './modules/platform/platform.module';
import { IntegrationModule } from './modules/integration/integration.module';

@Module({
  imports: [PrismaModule, PlatformModule, IntegrationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
