import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Get,
} from '@nestjs/common';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { WebhookSignatureService } from './webhook-signature.service';
import { IntegrationException } from '../../../common/errors/integration-exception';
import { IntegrationErrorCode } from '../../../common/errors/integration-error-code';
import { SendWebhookDto } from './dto/create-webhook.dto';
import { PrismaService } from '../../../prisma/prisma.service';

@Controller('api/webhooks/inbound')
export class InboundWebhookController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly signatureService: WebhookSignatureService,
    private readonly deliveryService: WebhookDeliveryService,
  ) {}

  @Post(':code')
  @HttpCode(HttpStatus.OK)
  async receive(
    @Param('code') code: string,
    @Body() payload: Record<string, unknown>,
    @Headers('X-Webhook-Signature') signature?: string,
    @Headers('X-Webhook-Event-Id') eventId?: string,
  ) {
    const webhook = await this.prisma.webhook.findUnique({
      where: { code },
    });

    if (!webhook) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_CONTRACT_UNSUPPORTED,
        `Webhook "${code}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (webhook.direction !== 'INBOUND') {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_INVALID_STATE,
        `Webhook "${code}" is not INBOUND`,
        HttpStatus.CONFLICT,
      );
    }

    if (webhook.status !== 'ACTIVE') {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_INVALID_STATE,
        `Webhook "${code}" is not ACTIVE`,
        HttpStatus.CONFLICT,
      );
    }

    const eventIdFinal = eventId ?? `evt-${Date.now()}`;

    const isDuplicate = await this.deliveryService.findDuplicate(eventIdFinal);
    if (isDuplicate) {
      return { status: 'DUPLICATE', eventId: eventIdFinal };
    }

    if (webhook.signaturePolicy) {
      const policy = webhook.signaturePolicy as Record<string, unknown>;
      const secret = String(policy.secret ?? webhook.secretRef ?? '');

      if (signature) {
        const result = this.signatureService.verifySignature(
          JSON.stringify(payload),
          signature,
          secret,
          (policy.algorithm as 'sha256' | 'sha1') ?? 'sha256',
        );

        if (!result.valid) {
          throw new IntegrationException(
            IntegrationErrorCode.WEBHOOK_SIGNATURE_FAILED,
            `Invalid webhook signature: ${result.reason}`,
            HttpStatus.UNAUTHORIZED,
          );
        }
      } else {
        throw new IntegrationException(
          IntegrationErrorCode.WEBHOOK_SIGNATURE_FAILED,
          'Missing webhook signature',
          HttpStatus.UNAUTHORIZED,
        );
      }
    }

    return {
      status: 'RECEIVED',
      eventId: eventIdFinal,
      event: webhook.event,
    };
  }

  @Post(':code/outbound')
  async sendOutbound(
    @Param('code') code: string,
    @Body() dto: SendWebhookDto,
  ) {
    const webhook = await this.prisma.webhook.findUnique({
      where: { code, direction: 'OUTBOUND' },
    });

    if (!webhook) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_CONTRACT_UNSUPPORTED,
        `OUTBOUND webhook "${code}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.deliveryService.deliver(webhook.id, dto.eventId, dto.payload);

    return { status: 'QUEUED', eventId: dto.eventId };
  }

  @Get(':code/deliveries')
  async getDeliveries(
    @Param('code') code: string,
    @Headers('x-delivery-status') status?: string,
  ) {
    const webhook = await this.prisma.webhook.findUnique({
      where: { code },
      select: { id: true },
    });

    if (!webhook) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_CONTRACT_UNSUPPORTED,
        `Webhook "${code}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.deliveryService.getDeliveries(
      webhook.id,
      status ? { status } : undefined,
    );
  }
}
