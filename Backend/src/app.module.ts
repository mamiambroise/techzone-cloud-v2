import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { dataSourceOptions } from './config/data-source';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { BusinessManagerModule } from './modules/business-manager/business-manager.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.dev', '.env'],
      load: [appConfig, databaseConfig],
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    BusinessManagerModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }