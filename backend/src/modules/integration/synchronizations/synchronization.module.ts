import { Module } from '@nestjs/common';
import { SynchronizationService } from './synchronization.service';
import { SynchronizationController } from './synchronization.controller';
import { MockIntegrationProvider } from '../../../common/providers/mock-integration.provider';
import { IntegrationResilienceService } from '../../../common/resilience/integration-resilience.service';
import { IdempotencyService } from '../../../common/resilience/idempotency.service';

@Module({
  controllers: [SynchronizationController],
  providers: [
    SynchronizationService,
    MockIntegrationProvider,
    IntegrationResilienceService,
    IdempotencyService,
  ],
  exports: [SynchronizationService],
})
export class SynchronizationModule {}
