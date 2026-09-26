import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './common/mail/mail.module';
import { ErpRegistryModule } from './erp-registry/erp-registry.module';
import { ErpAdapterModule } from './erp-adapter/erp-adapter.module';
import { DataRuntimeModule } from './data-runtime/data-runtime.module';
import { AutomationModule } from './automation/automation.module';
import { IamModule } from './iam/iam.module';
import { ConfigController } from './config/config.controller';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    MailModule,
    ErpRegistryModule,
    ErpAdapterModule,
    DataRuntimeModule,
    AutomationModule,
    IamModule,
  ],
  controllers: [ConfigController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes('*');
  }
}