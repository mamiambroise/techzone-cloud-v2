import { Module } from '@nestjs/common';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';
import { ConnectorController } from './connectors/connector.controller';
import { ConnectorService } from './connectors/connector.service';
import { MockIntegrationProvider } from '../../common/providers/mock-integration.provider';
import { IntegrationResilienceService } from '../../common/resilience/integration-resilience.service';
import { IdempotencyService } from '../../common/resilience/idempotency.service';
import { ApiManagerModule } from './api-manager/api-manager.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { CredentialsModule } from './credentials/credentials.module';
import { SynchronizationModule } from './synchronizations/synchronization.module';
import { DiagnosticsModule } from './diagnostics/diagnostics.module';

@Module({
  imports: [
    ApiManagerModule,
    WebhooksModule,
    CredentialsModule,
    SynchronizationModule,
    DiagnosticsModule,
  ],
  controllers: [IntegrationController, ConnectorController],
  providers: [
    IntegrationService,
    ConnectorService,
    MockIntegrationProvider,
    IntegrationResilienceService,
    IdempotencyService,
  ],
  exports: [
    IntegrationService,
    ConnectorService,
    MockIntegrationProvider,
    IntegrationResilienceService,
    IdempotencyService,
  ],
})
export class IntegrationModule {}
