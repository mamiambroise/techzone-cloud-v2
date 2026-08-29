import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ErpRegistryModule } from './erp-registry/erp-registry.module';
import { ErpAdapterModule } from './erp-adapter/erp-adapter.module';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';

@Module({
  imports: [PrismaModule, ErpRegistryModule, ErpAdapterModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes('*');
  }
}