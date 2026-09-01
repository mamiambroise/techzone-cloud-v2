import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ApplicationsModule } from './modules/applications/applications..module';
import { ApplicationVersionsModule } from './modules/application-versions/application-versions.module';

@Module({
  imports: [PrismaModule, ApplicationsModule, ApplicationVersionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
