import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { IntegrationResilienceService } from '../../../common/resilience/integration-resilience.service';
import { IntegrationErrorCode } from '../../../common/errors/integration-error-code';
import { IntegrationException } from '../../../common/errors/integration-exception';
import { WebhookSignatureService } from './webhook-signature.service';
import { randomUUID } from 'node:crypto';

interface RetryPolicyConfig {
  maxAttempts: number;
  initialDelayMs: number;
  backoffMultiplier?: number;
}

interface DeliveryAttemptResult {
  success: boolean;
  httpStatus?: number;
  duration: number;
  error?: string;
  errorCode?: IntegrationErrorCode;
}

@Injectable()
export class WebhookDeliveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resilienceService: IntegrationResilienceService,
    private readonly signatureService: WebhookSignatureService,
  ) {}

  async createDelivery(_webhookId: string, eventId: string, _payload: unknown): Promise<string> {
    const traceId = randomUUID();

    await this.prisma.webhookDelivery.create({
      data: {
        webhookId,
        eventId,
        attempt: 1,
        status: 'PENDING',
        traceId,
      },
    });

    return traceId;
  }

  async deliver(webhookId: string, eventId: string, payload: unknown): Promise<void> {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE,
        `Webhook "${webhookId}" not found`,
        404,
      );
    }

    if (webhook.status !== 'ACTIVE') {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_INVALID_STATE,
        `Webhook "${webhook.code}" is not ACTIVE (status: ${webhook.status})`,
        400,
      );
    }

    const traceId = await this.createDelivery(webhookId, eventId, payload);

    const payloadStr = JSON.stringify(payload);

    if (!this.signatureService.validatePayload(payload)) {
      await this.failDelivery(traceId, 'Invalid payload', IntegrationErrorCode.INTEGRATION_PAYLOAD_INVALID);
      return;
    }

    const result = await this.retryDelivery(webhook, payloadStr, traceId);

    if (result.success) {
      await this.succeedDelivery(traceId, result);
    } else {
      await this.failDelivery(traceId, result.error ?? 'Delivery failed', result.errorCode);
    }
  }

  private async retryDelivery(
    webhook: {
      id: string;
      code: string;
      endpoint: string;
      secretRef?: string | null;
      signaturePolicy?: Prisma.JsonValue;
      retryPolicy?: Prisma.JsonValue;
      timeout?: number | null;
    },
    payloadStr: string,
    traceId: string,
  ): Promise<DeliveryAttemptResult> {
    const retryConfig = this.parseRetryPolicy(webhook.retryPolicy as Record<string, unknown> | null);
    const timeout = webhook.timeout ?? 5000;

    let attempt = 0;
    let lastError: string | undefined;
    let lastErrorCode: IntegrationErrorCode | undefined;
    let duration = 0;
    let httpStatus: number | undefined;

    while (attempt < retryConfig.maxAttempts) {
      attempt++;

      await this.updateDeliveryStatus(traceId, 'RUNNING' as const, attempt);

      const startTime = Date.now();

      try {
        const response = await this.resilienceService.execute(
          () => this.sendHttpRequest(webhook.endpoint, payloadStr, webhook, traceId),
          {
            timeout: { timeoutMs: timeout },
            retry: {
              maxAttempts: 1,
              initialDelayMs: 0,
            },
          },
        );

        duration = Date.now() - startTime;
        httpStatus = response.status;

        if (response.status >= 200 && response.status < 300) {
          return { success: true, httpStatus, duration };
        }

        lastError = `HTTP ${response.status}`;
        lastErrorCode =
          response.status === 429
            ? IntegrationErrorCode.INTEGRATION_RATE_LIMITED
            : IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE;
      } catch (error) {
        duration = Date.now() - startTime;

        const err = error as Error;

        if (err.message?.includes('timeout')) {
          lastErrorCode = IntegrationErrorCode.INTEGRATION_TIMEOUT;
          lastError = 'Timeout';
        } else {
          lastErrorCode = IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE;
          lastError = err.message;
        }
      }

      if (attempt < retryConfig.maxAttempts) {
        const delay = Math.min(
          retryConfig.initialDelayMs *
            Math.pow(retryConfig.backoffMultiplier ?? 2, attempt - 1),
          300_000,
        );

        const nextRetryAt = new Date(Date.now() + delay);
        await this.rescheduleDelivery(traceId, nextRetryAt);

        await this.sleep(delay);
      }
    }

    return { success: false, httpStatus, duration, error: lastError, errorCode: lastErrorCode };
  }

  private async sendHttpRequest(
    endpoint: string,
    payload: string,
    webhook: {
      secretRef?: string | null;
      signaturePolicy?: Prisma.JsonValue;
    },
    traceId: string,
  ): Promise<{ status: number }> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': this.signatureService.generateSignature(
          payload,
          webhook.secretRef ?? '',
        ),
        'X-Webhook-Event-Id': traceId,
        'X-Delivery-Attempt': '1',
      },
      body: payload,
    });

    return { status: response.status };
  }

  private async succeedDelivery(traceId: string, result: DeliveryAttemptResult): Promise<void> {
    await this.prisma.webhookDelivery.updateMany({
      where: { traceId },
      data: {
        status: 'SUCCEEDED',
        httpStatus: result.httpStatus ?? null,
        duration: result.duration,
        finishedAt: new Date(),
      },
    });
  }

  private async failDelivery(
    traceId: string,
    _error: string,
    _errorCode?: IntegrationErrorCode,
  ): Promise<void> {
    await this.prisma.webhookDelivery.updateMany({
      where: { traceId },
      data: {
        status: 'FAILED',
        finishedAt: new Date(),
      },
    });
  }

  private async updateDeliveryStatus(
    traceId: string,
    status: 'PENDING' | 'RUNNING' | 'RETRYING',
    attempt: number,
  ): Promise<void> {
    await this.prisma.webhookDelivery.updateMany({
      where: { traceId },
      data: { status, attempt },
    });
  }

  private async rescheduleDelivery(traceId: string, nextRetryAt: Date): Promise<void> {
    await this.prisma.webhookDelivery.updateMany({
      where: { traceId },
      data: { status: 'RETRYING' as const, nextRetryAt },
    });
  }

  private parseRetryPolicy(
    policy: Record<string, unknown> | null,
  ): RetryPolicyConfig {
    if (!policy) {
      return { maxAttempts: 3, initialDelayMs: 1000 };
    }

    return {
      maxAttempts: Number(policy.maxAttempts) || 3,
      initialDelayMs: Number(policy.initialDelayMs) || 1000,
      backoffMultiplier:
        Number(policy.backoffMultiplier) || 2,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getDeliveries(
    webhookId: string,
    params?: {
      status?: string;
      limit?: number;
    },
  ) {
    const where: {
      webhookId: string;
      status?: { in: string[] };
    } = { webhookId };

    if (params?.status) {
      where.status = { in: [params.status] };
    }

    return this.prisma.webhookDelivery.findMany({
      where: where as unknown as Prisma.WebhookDeliveryWhereInput,
      orderBy: { createdAt: 'desc' },
      take: params?.limit ?? 50,
    });
  }

  async findDuplicate(eventId: string): Promise<boolean> {
    const existing = await this.prisma.webhookDelivery.findFirst({
      where: { eventId },
      select: { id: true },
    });

    return !!existing;
  }
}
