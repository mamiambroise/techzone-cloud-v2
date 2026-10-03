import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PaymentStatus } from '../../../generated/prisma/enums';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { BillingDiagnosticStatus, BillingStage } from '../../../generated/prisma/enums';
import { BillingAuditService } from '../common/billing-audit.service';
import { BillingDiagnosticsService } from '../diagnostics/billing-diagnostics.service';
import { BillingErrorCode } from '../common/billing-error-code';
import { billingError } from '../common/billing.exception';
import { PaymentProviderRegistry, WebhookResolution } from '../payment/payment-provider.interface';
import { BillingPaymentService } from '../payment/billing-payment.service';

/**
 * Reception de webhooks de paiement (CDC 46 / RG-BILL-022).
 *
 * Regle non negociable : un webhook dont la signature n'est pas verifiee par un
 * adaptateur REELLEMENT enregistre n'entame AUCUN changement d'etat. Il est
 * trace comme rejete, avec un payload expurge de toute donnee sensible
 * (RG-BILL-031/032 : ni secret, ni signature, ni donnee carte).
 */
@Injectable()
export class BillingWebhookService {
  private readonly logger = new Logger(BillingWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: BillingAuditService,
    private readonly diagnostics: BillingDiagnosticsService,
    private readonly providers: PaymentProviderRegistry,
    private readonly payments: BillingPaymentService,
  ) {}

  async handle(
    providerCode: string,
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<{ received: true; duplicate?: boolean; status: PaymentStatus | null }> {
    const adapter = this.providers.resolve(providerCode);
    if (!adapter) {
      // Aucun provider n'est enregistre en MVP : l'absence est signalee, jamais
      // simulee (RG-BILL-039 — aucun fallback silencieux).
      await this.diagnostics.record({
        stage: BillingStage.PAYMENT_PROVIDER,
        status: BillingDiagnosticStatus.CRITICAL,
        code: BillingErrorCode.PAYMENT_PROVIDER_UNAVAILABLE,
        message: `Webhook recu pour « ${providerCode} » alors qu'aucun adaptateur n'est enregistre. Aucun paiement n'est modifie.`,
        resource: providerCode,
        correlationId: randomUUID(),
      });
      throw billingError.unavailable(
        BillingErrorCode.PAYMENT_PROVIDER_UNAVAILABLE,
        `Aucun adaptateur de paiement enregistre pour « ${providerCode} ». Aucun paiement ne peut etre modifie.`,
      );
    }

    const signatureValid = adapter.verifyWebhook(rawBody, headers);
    const payload = this.safeParse(rawBody);
    const providerEventId = this.extractEventId(payload);

    if (!signatureValid) {
      await this.prisma.billingWebhookEvent.create({
        data: {
          provider: providerCode,
          providerEventId: providerEventId ?? randomUUID(),
          signatureValid: false,
          processed: false,
          payload: this.redact(payload),
        },
      });
      await this.audit.audit({
        actorId: 'system:billing-webhook',
        tenantId: null,
        action: 'billing.webhook.rejected',
        targetType: 'BillingWebhookEvent',
        targetId: providerEventId ?? randomUUID(),
        result: 'DENIED',
        reason: 'Signature de webhook invalide (RG-BILL-022).',
      });
      await this.diagnostics.record({
        stage: BillingStage.WEBHOOK,
        status: BillingDiagnosticStatus.CRITICAL,
        code: BillingErrorCode.PAYMENT_WEBHOOK_INVALID,
        message: `Webhook ${providerCode} rejete : signature invalide.`,
        resource: providerEventId,
      });
      throw billingError.badRequest(
        BillingErrorCode.PAYMENT_WEBHOOK_INVALID,
        'Signature de webhook invalide : aucun paiement n a ete modifie.',
      );
    }

    if (providerEventId) {
      const existing = await this.prisma.billingWebhookEvent.findUnique({
        where: { provider_providerEventId: { provider: providerCode, providerEventId } },
      });
      if (existing?.processed) {
        // Idempotence : le meme evenement provider ne fait pas deux fois le meme effet.
        return { received: true, duplicate: true, status: null };
      }
    }

    const stored = await this.prisma.billingWebhookEvent.create({
      data: {
        provider: providerCode,
        providerEventId: providerEventId ?? randomUUID(),
        signatureValid: true,
        processed: false,
        payload: this.redact(payload),
      },
    });

    try {
      const applied = await this.applyResolution(providerCode, payload);
      await this.prisma.billingWebhookEvent.update({
        where: { id: stored.id },
        data: { processed: true, processedAt: new Date() },
      });
      await this.audit.audit({
        actorId: 'system:billing-webhook',
        tenantId: applied?.tenantId ?? null,
        action: 'billing.webhook.processed',
        targetType: 'BillingWebhookEvent',
        targetId: stored.id,
        after: { provider: providerCode, providerEventId, status: applied?.status ?? null },
      });
      return { received: true, status: applied?.status ?? null };
    } catch (error) {
      await this.diagnostics.record({
        stage: BillingStage.WEBHOOK,
        status: BillingDiagnosticStatus.DEGRADED,
        code: BillingErrorCode.PAYMENT_FAILED,
        message: `Webhook ${providerCode} verifie mais non applique.`,
        resource: providerEventId,
        details: { error: error instanceof Error ? error.message : String(error) },
      });
      this.logger.warn(`Webhook ${providerCode} non applique : ${String(error)}`);
      throw error;
    }
  }

  listEvents(params?: { provider?: string; page?: number; limit?: number }) {
    const take = Math.min(params?.limit ?? 50, 200);
    const skip = params?.page ? (params.page - 1) * take : 0;
    return this.prisma.billingWebhookEvent.findMany({
      where: params?.provider ? { provider: params.provider } : {},
      orderBy: { receivedAt: 'desc' },
      skip,
      take,
    });
  }

  private async applyResolution(
    providerCode: string,
    payload: Record<string, unknown> | null,
  ): Promise<{ tenantId: string; status: PaymentStatus } | null> {
    const resolution = this.toResolution(payload);
    if (!resolution?.providerReference) {
      throw billingError.badRequest(
        BillingErrorCode.PAYMENT_WEBHOOK_INVALID,
        'Webhook sans reference provider exploitable.',
      );
    }
    const payment = await this.prisma.payment.findFirst({
      where: { provider: providerCode, externalReference: resolution.providerReference },
    });
    if (!payment) {
      throw billingError.notFound(
        BillingErrorCode.PAYMENT_NOT_FOUND,
        `Aucun paiement ne correspond a la reference ${resolution.providerReference}.`,
      );
    }

    if (payment.status === resolution.status) {
      return { tenantId: payment.tenantId, status: payment.status };
    }

    if (resolution.status === PaymentStatus.SUCCEEDED) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.SUCCEEDED, completedAt: new Date() },
      });
      await this.payments.settle(payment.id, payment.tenantId, 'system:billing-webhook', {
        reason: 'Webhook provider',
      });
      return { tenantId: payment.tenantId, status: PaymentStatus.SUCCEEDED };
    }

    if (
      resolution.status === PaymentStatus.FAILED ||
      resolution.status === PaymentStatus.CANCELLED
    ) {
      const updated = await this.payments.markFailed(
        payment.id,
        null,
        'system:billing-webhook',
        { code: 'WEBHOOK', message: `Statut provider : ${resolution.status}` },
      );
      return { tenantId: updated.tenantId, status: updated.status };
    }

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: resolution.status },
    });
    return { tenantId: updated.tenantId, status: updated.status };
  }

  private toResolution(payload: Record<string, unknown> | null): WebhookResolution | null {
    if (!payload) return null;
    const reference = payload.reference ?? payload.paymentReference ?? payload.transactionId;
    const status = payload.status ?? payload.state;
    if (typeof reference !== 'string' || typeof status !== 'string') return null;
    return {
      providerEventId: String(payload.eventId ?? payload.id ?? randomUUID()),
      providerReference: reference,
      status: this.toPaymentStatus(status),
      amountMinorUnits: typeof payload.amount === 'number' ? payload.amount : undefined,
      currency: typeof payload.currency === 'string' ? payload.currency : undefined,
      occurredAt: typeof payload.occurredAt === 'string' ? payload.occurredAt : undefined,
    };
  }

  /** Mapping explicite : un statut provider inconnu n'est jamais devine. */
  private toPaymentStatus(raw: string): PaymentStatus {
    const normalized = raw.trim().toUpperCase();
    switch (normalized) {
      case 'SUCCESS':
      case 'SUCCEEDED':
      case 'PAID':
      case 'COMPLETED':
        return PaymentStatus.SUCCEEDED;
      case 'PENDING':
      case 'PROCESSING':
      case 'AUTHORIZED':
        return PaymentStatus.PROCESSING;
      case 'FAILED':
      case 'ERROR':
      case 'DECLINED':
        return PaymentStatus.FAILED;
      case 'CANCELLED':
      case 'CANCELED':
      case 'EXPIRED':
        return PaymentStatus.CANCELLED;
      case 'REFUNDED':
        return PaymentStatus.REFUNDED;
      case 'PARTIALLY_REFUNDED':
        return PaymentStatus.PARTIALLY_REFUNDED;
      default:
        throw billingError.badRequest(
          BillingErrorCode.PAYMENT_WEBHOOK_INVALID,
          `Statut provider inconnu : « ${raw} ». Aucun changement d'etat n est applique.`,
        );
    }
  }

  private extractEventId(payload: Record<string, unknown> | null): string | null {
    const raw = payload?.eventId ?? payload?.id;
    return typeof raw === 'string' ? raw : null;
  }

  private safeParse(rawBody: Buffer): Record<string, unknown> | null {
    try {
      const parsed: unknown = JSON.parse(rawBody.toString('utf8'));
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }

  /**
   * RG-BILL-032 : on ne conserve que la forme utile du payload. Les cles
   * sensibles (signature, secret, carte, token) sont retirees avant ecriture.
   */
  private redact(payload: Record<string, unknown> | null): Prisma.InputJsonValue {
    const source = payload ?? {};
    const forbidden = /signature|secret|token|card|cvv|iban|authorization|cookie|password/i;
    const kept: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(source)) {
      if (forbidden.test(key)) continue;
      if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
        kept[key] = value;
      }
    }
    return { redacted: true, keys: Object.keys(kept), sample: kept } as unknown as Prisma.InputJsonValue;
  }
}