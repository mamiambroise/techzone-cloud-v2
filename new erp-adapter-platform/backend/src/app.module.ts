import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ErpRegistryModule } from './erp-registry/erp-registry.module';
import { ErpAdapterModule } from './erp-adapter/erp-adapter.module';
import { DataRuntimeModule } from './data-runtime/data-runtime.module';
import { AutomationModule } from './automation/automation.module';
import { IamModule } from './iam/iam.module';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';

@Module({
  imports: [PrismaModule, ErpRegistryModule, ErpAdapterModule, DataRuntimeModule, AutomationModule, IamModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes('*');
  }
}