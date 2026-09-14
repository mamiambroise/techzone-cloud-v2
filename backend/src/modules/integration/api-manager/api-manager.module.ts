import { Module } from '@nestjs/common';
import { ApiManagerController } from './api-manager.controller';
import { ApiManagerService } from './api-manager.service';
import { IdempotencyService } from '../../../common/resilience/idempotency.service';

@Module({
  controllers: [ApiManagerController],
  providers: [ApiManagerService, IdempotencyService],
  exports: [ApiManagerService],
})
export class ApiManagerModule {}
