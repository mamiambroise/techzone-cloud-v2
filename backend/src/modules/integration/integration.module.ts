import { Module } from '@nestjs/common';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';
import { ConnectorController } from './connectors.old/connector.controller';
import { ConnectorService } from './connectors.old/connector.service';
import { ApiDefinitionController } from './apis/api-definition.controller';
import { ApiDefinitionService } from './apis/api-definition.service';
import { WebhookController } from './webhooks/webhook.controller';
import { WebhookService } from './webhooks/webhook.service';
import { CredentialController } from './credentials/credential.controller';
import { CredentialService } from './credentials/credential.service';
import { SynchronizationController } from './synchronization/synchronization.controller';
import { SynchronizationService } from './synchronization/synchronization.service';
import { DiagnosticsController } from './diagnostics/diagnostics.controller';
import { DiagnosticsService } from './diagnostics/diagnostics.service';
import { MockIntegrationProvider } from '../../common/providers/mock-integration.provider';
import { IntegrationResilienceService } from '../../common/resilience/integration-resilience.service';
import { IdempotencyService } from '../../common/resilience/idempotency.service';

@Module({
  controllers: [
    IntegrationController,
    ConnectorController,
    ApiDefinitionController,
    WebhookController,
    CredentialController,
    SynchronizationController,
    DiagnosticsController,
  ],
  providers: [
    IntegrationService,
    ConnectorService,
    ApiDefinitionService,
    WebhookService,
    CredentialService,
    SynchronizationService,
    DiagnosticsService,
    MockIntegrationProvider,
    IntegrationResilienceService,
    IdempotencyService,
  ],
  exports: [
    IntegrationService,
    ConnectorService,
    ApiDefinitionService,
    WebhookService,
    CredentialService,
    SynchronizationService,
    DiagnosticsService,
    MockIntegrationProvider,
    IntegrationResilienceService,
    IdempotencyService,
  ],
})
export class IntegrationModule {}
