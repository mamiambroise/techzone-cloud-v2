import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { dataSourceOptions } from './config/data-source';
import { BusinessManagerModule } from './modules/business-manager/business-manager.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { PrismaModule } from './prisma/prisma.module';
import { PackManagerModule } from './modules/pack-manager/pack-manager.module';
import { PackRuntimeModule } from './modules/pack-runtime/pack-runtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, databaseConfig],
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    PrismaModule,
    BusinessManagerModule,
    PackManagerModule,
    PackRuntimeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
