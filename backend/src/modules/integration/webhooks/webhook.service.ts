import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { IntegrationException } from '../../../common/errors/integration-exception';
import { IntegrationErrorCode } from '../../../common/errors/integration-error-code';
import { CreateWebhookDto, UpdateWebhookDto } from './dto/create-webhook.dto';

@Injectable()
export class WebhookService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateWebhookDto) {
    const existing = await this.prisma.webhook.findUnique({
      where: { code: dto.code },
      select: { id: true },
    });

    if (existing) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_CONTRACT_UNSUPPORTED,
        `Webhook with code "${dto.code}" already exists`,
        HttpStatus.CONFLICT,
      );
    }

    if (dto.direction !== 'INBOUND' && !dto.endpoint) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PAYLOAD_INVALID,
        'Endpoint is required for OUTBOUND webhooks',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prisma.webhook.create({
      data: {
        code: dto.code,
        direction: dto.direction,
        event: dto.event,
        endpoint: dto.endpoint ?? '',
        secretRef: dto.secretRef ?? null,
        signaturePolicy: dto.signaturePolicy as Prisma.InputJsonValue,
        retryPolicy: dto.retryPolicy as Prisma.InputJsonValue,
        timeout: dto.timeout ?? null,
        filters: dto.filters as Prisma.InputJsonValue,
        status: 'DRAFT',
      },
    });
  }

  async findAll() {
    return this.prisma.webhook.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id },
      include: { deliveries: true },
    });

    if (!webhook) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE,
        `Webhook "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return webhook;
  }

  async update(id: string, dto: UpdateWebhookDto) {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id },
    });

    if (!webhook) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE,
        `Webhook "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prisma.webhook.update({
      where: { id },
      data: {
        event: dto.event,
        endpoint: dto.endpoint ?? undefined,
        secretRef: dto.secretRef ?? undefined,
        signaturePolicy: dto.signaturePolicy as Prisma.InputJsonValue | undefined,
        retryPolicy: dto.retryPolicy as Prisma.InputJsonValue | undefined,
        timeout: dto.timeout ?? undefined,
        filters: dto.filters as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async transition(id: string, status: string) {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id },
    });

    if (!webhook) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE,
        `Webhook "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (webhook.status === status) {
      return webhook;
    }

    const allowed = this.getAllowedTransitions(webhook.status);
    if (!allowed.includes(status)) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_INVALID_STATE,
        `Cannot transition webhook "${webhook.code}" from ${webhook.status} to ${status}`,
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.webhook.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async remove(id: string) {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!webhook) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE,
        `Webhook "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (webhook.status !== 'ARCHIVED') {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_INVALID_STATE,
        `Webhook "${id}" must be ARCHIVED before deletion`,
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.webhook.delete({ where: { id } });
  }

  private getAllowedTransitions(status: string): string[] {
    const transitions: Record<string, string[]> = {
      DRAFT: ['CONFIGURING', 'VALIDATING', 'ARCHIVED'],
      CONFIGURING: ['DRAFT', 'VALIDATING'],
      VALIDATING: ['CONFIGURING', 'READY'],
      READY: ['ACTIVE', 'DEGRADED', 'DISABLED', 'ARCHIVED'],
      ACTIVE: ['DEGRADED', 'DISABLED', 'ARCHIVED'],
      DEGRADED: ['ACTIVE', 'READY', 'DISABLED'],
      DISABLED: ['ACTIVE', 'ARCHIVED'],
      ARCHIVED: [],
    };

    return transitions[status] ?? [];
  }
}
