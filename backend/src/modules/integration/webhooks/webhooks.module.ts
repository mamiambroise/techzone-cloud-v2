import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { InboundWebhookController } from './inbound-webhook.controller';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { WebhookSignatureService } from './webhook-signature.service';
import { IntegrationResilienceService } from '../../../common/resilience/integration-resilience.service';

@Module({
  controllers: [WebhookController, InboundWebhookController],
  providers: [
    WebhookService,
    WebhookDeliveryService,
    WebhookSignatureService,
    IntegrationResilienceService,
  ],
  exports: [WebhookService, WebhookDeliveryService, WebhookSignatureService],
})
export class WebhooksModule {}
