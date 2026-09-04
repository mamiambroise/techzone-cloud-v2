import { Test, TestingModule } from '@nestjs/testing';
import { createHmac } from 'node:crypto';
import { WebhookService } from './webhook.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { IntegrationResilienceService } from '../../../common/resilience/integration-resilience.service';
import { WebhookDirectionEnum } from './dto/create-webhook.dto';
import { IntegrationException } from '../../../common/errors/integration-exception';

describe('WebhookService (API-CDC-04)', () => {
  let service: WebhookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebhookService, PrismaService, IntegrationResilienceService],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
  });

  it('should create and activate a webhook', async () => {
    const webhook = await service.create({
      code: 'user-created-hook',
      direction: WebhookDirectionEnum.INBOUND,
      event: 'user.created',
      endpoint: '/api/integrations/webhooks/inbound/user-created-hook',
      secretRef: 'my-secret-key-1234',
      signaturePolicy: {
        algorithm: 'sha256',
        headerName: 'x-hub-signature',
      },
    });

    expect(webhook).toBeDefined();
    expect(webhook.status).toBe('DRAFT');

    const activated = await service.activate(webhook.id);
    expect(activated.status).toBe('ACTIVE');
  });

  it('should process inbound webhook with valid HMAC signature and deduplicate', async () => {
    const secret = 'webhook-secret-token-xyz';
    const hook = await service.create({
      code: 'github-push-hook',
      direction: WebhookDirectionEnum.INBOUND,
      event: 'push',
      endpoint: '/api/integrations/webhooks/inbound/github-push-hook',
      secretRef: secret,
      signaturePolicy: {
        algorithm: 'sha256',
        headerName: 'x-hub-signature-256',
      },
    });

    await service.activate(hook.id);

    const payload = JSON.stringify({ repository: 'backend', ref: 'main' });
    const signature = createHmac('sha256', secret).update(payload).digest('hex');

    const result = await service.processInbound('github-push-hook', payload, {
      'x-hub-signature-256': signature,
      'x-event-id': 'evt_unique_101',
    });

    expect(result.success).toBe(true);
    expect(result.eventId).toBe('evt_unique_101');

    // Replay should be rejected as duplicate
    await expect(
      service.processInbound('github-push-hook', payload, {
        'x-hub-signature-256': signature,
        'x-event-id': 'evt_unique_101',
      }),
    ).rejects.toThrow(IntegrationException);
  });

  it('should dispatch outbound webhook and record delivery', async () => {
    const hook = await service.create({
      code: 'crm-contact-created',
      direction: WebhookDirectionEnum.OUTBOUND,
      event: 'contact.created',
      endpoint: 'https://api.partner.example/webhooks',
      secretRef: 'partner-secret-999',
    });

    await service.activate(hook.id);

    const dispatchRes = await service.dispatchOutbound(hook.id, {
      payload: { contactId: 'cnt-443', email: 'user@example.com' },
      eventId: 'evt-dispatch-1',
    });

    expect(dispatchRes.success).toBe(true);
    expect(dispatchRes.deliveryId).toBeDefined();

    const deliveries = await service.getDeliveries(hook.id);
    expect(deliveries.total).toBeGreaterThanOrEqual(1);
  });
});
