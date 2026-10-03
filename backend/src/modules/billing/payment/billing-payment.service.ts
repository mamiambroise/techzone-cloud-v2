import { randomUUID } from 'node:crypto';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { BillingStage, PaymentMethod, PaymentStatus } from '../../../generated/prisma/enums';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { BillingErrorCode } from '../common/billing-error-code';
import { BillingException, billingError } from '../common/billing.exception';
import { BillingAuditService } from '../common/billing-audit.service';
import { assertCurrency, parseAmountToMinorUnits, Money } from '../common/money';
import { BillingInvoiceService } from '../invoice/billing-invoice.service';
import { BillingLifecycleService } from '../lifecycle/billing-lifecycle.service';
import { PaymentProviderRegistry } from './payment-provider.interface';
import { BillingDiagnosticsService } from '../diagnostics/billing-diagnostics.service';
import type {
  ListPaymentsParams,
  MarkPaymentFailedInput,
  RecordManualPaymentInput,
  RefundPaymentInput,
} from '../billing.dto';

/**
 * Paiements (CDC 41/42/46/47/49) et idempotence (RG-BILL-021).
 *
 * Le paiement manuel est le MVP (CDC 118). Toute validation manuelle exige la
 * permission IAM explicite `billing:payment:record` (CDC 23/49) : elle est
 * verifiee par le controleur, jamaisici.
 */
@Injectable()
export class BillingPaymentService {
  private readonly logger = new Logger(BillingPaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: BillingAuditService,
    private readonly invoices: BillingInvoiceService,
    private readonly lifecycle: BillingLifecycleService,
    private readonly providers: PaymentProviderRegistry,
    private readonly diagnostics: BillingDiagnosticsService,
  ) {}

  // -----------------------------------------------------------------------------------------
  // Lectures
  // -----------------------------------------------------------------------------------------

  listForTenant(tenantId: string, params?: ListPaymentsParams) {
    const take = Math.min(params?.limit ?? 50, 200);
    const skip = params?.page ? (params.page - 1) * take : 0;
    return this.prisma.payment.findMany({
      where: {
        tenantId,
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.invoiceId ? { invoiceId: params.invoiceId } : {}),
      },
      orderBy: { initiatedAt: 'desc' },
      skip,
      take,
      include: {
        invoice: { select: { id: true, invoiceNumber: true, total: true, currency: true, status: true } },
        attempts: true,
      },
    });
  }

  listAll(params?: ListPaymentsParams) {
    const take = Math.min(params?.limit ?? 50, 200);
    const skip = params?.page ? (params.page - 1) * take : 0;
    return this.prisma.payment.findMany({
      where: {
        ...(params?.tenantId ? { tenantId: params.tenantId } : {}),
        ...(params?.status ? { status: params.status } : {}),
      },
      orderBy: { initiatedAt: 'desc' },
      skip,
      take,
      include: {
        invoice: { select: { id: true, invoiceNumber: true, currency: true, status: true } },
        attempts: true,
      },
    });
  }

  async getScoped(id: string, tenantId: string | null) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { invoice: true, attempts: { orderBy: { startedAt: 'desc' } } },
    });
    if (!payment) {
      throw billingError.notFound(BillingErrorCode.PAYMENT_NOT_FOUND, `Paiement ${id} introuvable.`);
    }
    if (tenantId !== null && payment.tenantId !== tenantId) {
      throw billingError.forbidden(
        BillingErrorCode.CROSS_TENANT_ACCESS_DENIED,
        'Ce paiement appartient a un autre tenant.',
        { paymentId: id },
      );
    }
    return payment;
  }

  // -----------------------------------------------------------------------------------------
  // Paiement manuel (CDC 49)
  // -----------------------------------------------------------------------------------------

  /**
   * Enregistre un paiement manuel. RG-BILL-021 : la cle d'idempotence garantit
   * qu'un rejeu de la meme requete ne debite jamais deux fois.
   */
  async recordManualPayment(
    tenantId: string,
    actorId: string,
    body: RecordManualPaymentInput,
  ) {
    const invoice = await this.invoices.getScoped(body.invoiceId, tenantId);
    this.invoices.assertPayable(invoice);

    const currency = assertCurrency((body.currency ?? invoice.currency).toUpperCase());
    if (currency !== invoice.currency.toUpperCase()) {
      throw billingError.badRequest(
        BillingErrorCode.CURRENCY_MISMATCH,
        `Le paiement est en ${currency} alors que la facture est en ${invoice.currency} (RG-BILL-007).`,
      );
    }

    let minor: number;
    try {
      minor = parseAmountToMinorUnits(body.amount, currency);
    } catch (error) {
      throw billingError.badRequest(
        BillingErrorCode.AMOUNT_INVALID,
        error instanceof Error ? error.message : 'Montant invalide.',
      );
    }
    if (minor <= 0) {
      throw billingError.badRequest(
        BillingErrorCode.AMOUNT_INVALID,
        'Un paiement doit etre strictement positif.',
      );
    }

    const remaining = Money.of(invoice.amountDue.toString(), currency);
    const requested = Money.ofMinorUnits(minor, currency);
    if (requested.isGreaterThan(remaining)) {
      throw billingError.badRequest(
        BillingErrorCode.AMOUNT_INVALID,
        `Le montant (${requested.toDecimalString()} ${currency}) depasse le reste a payer (${remaining.toDecimalString()} ${currency}).`,
      );
    }

    const idempotencyKey = body.idempotencyKey?.trim() || `manual:${invoice.id}:${requested.toDecimalString()}:${body.proofReference ?? 'noproof'}`;
    const existing = await this.prisma.payment.findUnique({
      where: { tenantId_idempotencyKey: { tenantId, idempotencyKey } },
    });
    if (existing) {
      // RG-BILL-021 : meme cle, meme resultat — jamais un second debit.
      return { payment: existing, duplicate: true };
    }

    const validated = body.validate === true;
    const payment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          tenantId,
          invoiceId: invoice.id,
          amount: new Prisma.Decimal(requested.toDecimalString()),
          currency,
          method: body.method ?? PaymentMethod.MANUAL,
          provider: null,
          status: validated ? PaymentStatus.SUCCEEDED : PaymentStatus.PENDING,
          idempotencyKey,
          proofReference: body.proofReference ?? null,
          notes: body.notes ?? null,
          validatedBy: validated ? actorId : null,
          validatedAt: validated ? new Date() : null,
          completedAt: validated ? new Date() : null,
          attempts: {
            create: {
              attemptId: randomUUID(),
              status: validated ? PaymentStatus.SUCCEEDED : PaymentStatus.PENDING,
              correlationId: randomUUID(),
            },
          },
        },
      });
      return created;
    });

    await this.audit.audit({
      actorId,
      tenantId,
      action: 'billing.payment.recorded',
      targetType: 'Payment',
      targetId: payment.id,
      reason: body.notes ?? null,
      after: {
        invoiceNumber: invoice.invoiceNumber,
        amount: requested.toDecimalString(),
        currency,
        status: payment.status,
        validated,
      },
    });
    await this.audit.emit({
      tenantId,
      eventType: 'payment.created',
      invoiceId: invoice.id,
      paymentId: payment.id,
      subscriptionId: invoice.subscriptionId,
      payload: { amount: requested.toDecimalString(), currency, status: payment.status },
    });

    if (validated) {
      const settled = await this.settle(payment.id, tenantId, actorId, {
        reason: 'Paiement manuel valide a l enregistrement',
      });
      return { payment: settled ?? payment, duplicate: false };
    }
    return { payment, duplicate: false };
  }

  /**
   * Validation manuelle (CDC 49). C'est l'operation la plus sensible du MVP :
   * elle transforme une declaration en paiement reellement comptabilise.
   */
  async validateManualPayment(id: string, tenantId: string | null, actorId: string, reason?: string) {
    const payment = await this.getScoped(id, tenantId);
    if (payment.method !== PaymentMethod.MANUAL) {
      throw billingError.conflict(
        BillingErrorCode.BILLING_CONFIGURATION_INVALID,
        'Seul un paiement manuel se valide manuellement.',
      );
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw billingError.conflict(
        BillingErrorCode.PAYMENT_DUPLICATE,
        `Ce paiement est deja ${payment.status}.`,
      );
    }
    await this.prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.SUCCEEDED,
        validatedBy: actorId,
        validatedAt: new Date(),
        completedAt: new Date(),
        notes: reason ?? payment.notes,
      },
    });
    await this.audit.audit({
      actorId,
      tenantId: payment.tenantId,
      action: 'billing.payment.validated',
      targetType: 'Payment',
      targetId: id,
      reason: reason ?? 'Validation manuelle',
      before: { status: PaymentStatus.PENDING },
      after: { status: PaymentStatus.SUCCEEDED, validatedBy: actorId },
    });
    return this.settle(id, payment.tenantId, actorId, { reason: reason ?? 'Validation manuelle' });
  }

  async markFailed(id: string, tenantId: string | null, actorId: string, body: MarkPaymentFailedInput) {
    const payment = await this.getScoped(id, tenantId);
    if (payment.status === PaymentStatus.SUCCEEDED) {
      throw billingError.conflict(
        BillingErrorCode.REFUND_NOT_ALLOWED,
        'Un paiement deja abouti ne peut pas etre marque en echec : utilisez un remboursement.',
      );
    }
    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.FAILED,
        failedAt: new Date(),
        failureCode: body.code ?? null,
        failureMessage: body.message ?? null,
      },
    });
    await this.audit.emit({
      tenantId: payment.tenantId,
      eventType: 'payment.failed',
      invoiceId: payment.invoiceId,
      paymentId: id,
      subscriptionId: null,
      payload: { code: body.code ?? null, message: body.message ?? null },
    });
    await this.audit.audit({
      actorId,
      tenantId: payment.tenantId,
      action: 'billing.payment.recorded',
      targetType: 'Payment',
      targetId: id,
      reason: body.message ?? 'Echec de paiement',
      after: { status: PaymentStatus.FAILED },
    });
    await this.lifecycle.onPaymentFailure(payment.tenantId, payment.invoiceId, updated.id, actorId);
    return updated;
  }

  async refund(id: string, tenantId: string | null, actorId: string, body: RefundPaymentInput) {
    const payment = await this.getScoped(id, tenantId);
    if (payment.status !== PaymentStatus.SUCCEEDED && payment.status !== PaymentStatus.PARTIALLY_REFUNDED) {
      throw new BillingException(
        BillingErrorCode.REFUND_NOT_ALLOWED,
        `Seul un paiement abouti peut etre rembourse (statut ${payment.status}).`,
        HttpStatus.CONFLICT,
      );
    }
    if (!body.reason || body.reason.trim().length === 0) {
      throw billingError.badRequest(
        BillingErrorCode.REFUND_NOT_ALLOWED,
        'Un remboursement exige un motif (CDC 40).',
      );
    }
    const currency = assertCurrency(payment.currency.toUpperCase());
    const alreadyRefunded = payment.refundAmount
      ? Money.of(payment.refundAmount.toString(), currency)
      : Money.zero(currency);
    const paid = Money.of(payment.amount.toString(), currency);
    const refundable = paid.subtract(alreadyRefunded).clampToZero();

    const requested = body.amount
      ? Money.ofMinorUnits(parseAmountToMinorUnits(body.amount, currency), currency)
      : refundable;
    if (requested.isGreaterThan(refundable)) {
      throw billingError.badRequest(
        BillingErrorCode.REFUND_NOT_ALLOWED,
        `Montant de remboursement superieur au solde remboursable (${refundable.toDecimalString()} ${currency}).`,
      );
    }

    const totalRefunded = alreadyRefunded.add(requested);
    const fullyRefunded = totalRefunded.equals(paid);

    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        status: fullyRefunded ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
        refundAmount: new Prisma.Decimal(totalRefunded.toDecimalString()),
        refundReason: body.reason,
        refundedAt: new Date(),
      },
    });

    await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id: payment.invoiceId } });
      if (!invoice) return;
      const invCurrency = assertCurrency(invoice.currency.toUpperCase());
      const paidNow = Money.of(invoice.amountPaid.toString(), invCurrency).subtract(requested).clampToZero();
      const due = Money.of(invoice.total.toString(), invCurrency).subtract(paidNow).clampToZero();
      await tx.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          amountPaid: new Prisma.Decimal(paidNow.toDecimalString()),
          amountDue: new Prisma.Decimal(due.toDecimalString()),
          status: due.isZero() ? 'PAID' : 'PARTIALLY_PAID',
          paidAt: due.isZero() ? invoice.paidAt : null,
        },
      });
    });

    await this.audit.audit({
      actorId,
      tenantId: payment.tenantId,
      action: 'billing.payment.refunded',
      targetType: 'Payment',
      targetId: id,
      reason: body.reason,
      before: { status: payment.status, refundAmount: payment.refundAmount?.toString() ?? null },
      after: { status: updated.status, refundAmount: totalRefunded.toDecimalString(), currency },
    });
    await this.audit.emit({
      tenantId: payment.tenantId,
      eventType: 'payment.refunded',
      invoiceId: payment.invoiceId,
      paymentId: id,
      payload: { amount: requested.toDecimalString(), currency },
    });
    return updated;
  }

  // -----------------------------------------------------------------------------------------
  // Interne
  // -----------------------------------------------------------------------------------------

  /** Applique un paiement abouti : facture, abonnement, evenements. */
  async settle(paymentId: string, tenantId: string, actorId: string, options?: { reason?: string }) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      throw billingError.notFound(BillingErrorCode.PAYMENT_NOT_FOUND, `Paiement ${paymentId} introuvable.`);
    }

    await this.invoices.recomputePaidState(payment.invoiceId);

    await this.audit.emit({
      tenantId,
      eventType: 'payment.succeeded',
      invoiceId: payment.invoiceId,
      paymentId,
      subscriptionId: null,
      payload: {
        amount: payment.amount.toString(),
        currency: payment.currency,
        reason: options?.reason ?? null,
      },
    });

    // CDC 111 / 113 : facture soldee -> l'abonnement redevient ou reste ACTIVE.
    await this.lifecycle.onPaymentSucceeded(tenantId, payment.invoiceId, paymentId, actorId);

    return this.prisma.payment.findUnique({ where: { id: paymentId } });
  }

  /** Etat declare des providers : jamais simule. */
  providersStatus() {
    return {
      registered: this.providers.list(),
      count: this.providers.size,
      policy:
        'Aucun provider de paiement externe n est configure. Seul le paiement manuel est operationnel (CDC 44 / RG-BILL-039).',
    };
  }

  async reportProviderUnavailable(providerCode: string, correlationId?: string): Promise<void> {
    // RG-BILL-039 : aucun fallback silencieux. L'absence de provider est
    // signalee explicitement dans les diagnostics.
    await this.diagnostics.record({
      stage: BillingStage.PAYMENT_PROVIDER,
      status: 'UNKNOWN',
      code: BillingErrorCode.PAYMENT_PROVIDER_UNAVAILABLE,
      message: `Aucun adaptateur de paiement enregistre ou configure pour « ${providerCode} ».`,
      resource: providerCode,
      correlationId: correlationId ?? null,
      details: { registeredCount: this.providers.size },
    });
    this.logger.warn(`Provider de paiement indisponible : ${providerCode}`);
  }

  /** Providers réellement enregistrés (liste vide en MVP). */
  listProviders() {
    return this.providersStatus();
  }
}