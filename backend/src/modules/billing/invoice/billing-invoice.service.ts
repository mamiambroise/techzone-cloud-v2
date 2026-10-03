import { HttpStatus, Injectable } from '@nestjs/common';
import { InvoiceStatus } from '../../../generated/prisma/enums';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { BillingErrorCode } from '../common/billing-error-code';
import { BillingException, billingError } from '../common/billing.exception';
import { BillingAuditService } from '../common/billing-audit.service';
import {
  CurrencyCode,
  Money,
  assertCurrency,
  parseAmountToMinorUnits,
} from '../common/money';
import { BillingInvoiceNumberService } from './billing-invoice-number.service';
import type {
  AdjustInvoiceInput,
  CreateInvoiceInput,
  GenerateInvoiceOptions,
  InvoiceLineInput,
  ListInvoicesParams,
} from '../billing.dto';

/**
 * Factures (CDC 32/33/34/35/36/96).
 *
 * Deux garanties :
 *  - RG-BILL-006/007 : tous les calculs passent par `Money` (entiers en unites
 *    mineures) et toute somme porte sa devise ;
 *  - RG-BILL-009/010 / CDC 96 : une facture emise ne change pas quand le
 *    catalogue evolue — le `unitPrice` est fige dans la ligne, et la taxation
 *    reste a zero tant qu'aucune regle fiscale reelle n a ete validee.
 */

@Injectable()
export class BillingInvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: BillingAuditService,
    private readonly numbering: BillingInvoiceNumberService,
  ) {}

  // -----------------------------------------------------------------------------------------
  // Lectures
  // -----------------------------------------------------------------------------------------

  listForTenant(tenantId: string, params?: ListInvoicesParams) {
    const take = Math.min(params?.limit ?? 50, 200);
    const skip = params?.page ? (params.page - 1) * take : 0;
    return this.prisma.invoice.findMany({
      where: { tenantId, ...(params?.status ? { status: params.status } : {}) },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { items: true, subscription: { select: { id: true, planId: true } } },
    });
  }

  listAll(params?: ListInvoicesParams) {
    const take = Math.min(params?.limit ?? 50, 200);
    const skip = params?.page ? (params.page - 1) * take : 0;
    return this.prisma.invoice.findMany({
      where: {
        ...(params?.tenantId ? { tenantId: params.tenantId } : {}),
        ...(params?.status ? { status: params.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        items: true,
        payments: true,
        tenant: { select: { id: true, code: true, name: true } },
      },
    });
  }

  /** RG-BILL-027 : un UUID d'un autre tenant ne donne aucun acces. */
  async getScoped(id: string, tenantId: string | null) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        items: { orderBy: { createdAt: 'asc' } },
        payments: { orderBy: { initiatedAt: 'desc' } },
        subscription: { include: { plan: true } },
        billingAccount: true,
        adjustments: true,
      },
    });
    if (!invoice) {
      throw billingError.notFound(BillingErrorCode.INVOICE_NOT_FOUND, `Facture ${id} introuvable.`);
    }
    if (tenantId !== null && invoice.tenantId !== tenantId) {
      throw billingError.forbidden(
        BillingErrorCode.CROSS_TENANT_ACCESS_DENIED,
        'Cette facture appartient a un autre tenant.',
        { invoiceId: id },
      );
    }
    return invoice;
  }

  // -----------------------------------------------------------------------------------------
  // Generation (CDC 32/34)
  // -----------------------------------------------------------------------------------------

  /**
   * Genere une facture pour un abonnement, a partir de son Price actif.
   * Le montant provient du prix FIGE au moment de la generation.
   */
  async generateForSubscription(
    subscriptionId: string,
    tenantId: string,
    actorId: string,
    options?: GenerateInvoiceOptions,
  ) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, tenantId },
      include: { price: true, plan: true, billingAccount: true },
    });
    if (!subscription) {
      throw billingError.notFound(
        BillingErrorCode.SUBSCRIPTION_NOT_FOUND,
        `Abonnement ${subscriptionId} introuvable pour ce tenant.`,
      );
    }
    if (!subscription.priceId) {
      throw billingError.badRequest(
        BillingErrorCode.PRICE_NOT_FOUND,
        `L abonnement ${subscriptionId} n a pas de prix associe : aucune facture ne peut etre generee sans tarif (RG-BILL-005).`,
      );
    }
    const price = subscription.price;
    if (!price) {
      throw billingError.notFound(BillingErrorCode.PRICE_NOT_FOUND, 'Prix de l abonnement introuvable.');
    }

    const currency = assertCurrency(price.currency.toUpperCase());
    const period =
      options?.period ??
      (subscription.currentPeriodStart && subscription.currentPeriodEnd
        ? { start: subscription.currentPeriodStart, end: subscription.currentPeriodEnd }
        : { start: new Date(), end: new Date() });

    const existing = await this.prisma.invoice.findFirst({
      where: {
        subscriptionId,
        status: { in: [InvoiceStatus.DRAFT, InvoiceStatus.OPEN, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] },
        periodStart: period.start,
        periodEnd: period.end,
      },
      select: { id: true, invoiceNumber: true },
    });
    if (existing) {
      throw billingError.conflict(
        BillingErrorCode.INVOICE_INVALID_STATE,
        `Une facture existe deja pour cette periode (${existing.invoiceNumber}). Aucune facture en double n est creee.`,
        existing,
      );
    }

    const line: InvoiceLineInput = {
      description: `${subscription.plan.name} — ${price.interval.toLowerCase().replace('_', ' ')}`,
      quantity: 1,
      unitPrice: price.amount.toString(),
      currency,
      priceId: price.id,
      sourceType: 'SUBSCRIPTION',
      sourceRef: subscription.id,
      periodStart: period.start,
      periodEnd: period.end,
    };

    return this.create(
      {
        tenantId,
        subscriptionId,
        billingAccountId: subscription.billingAccountId ?? undefined,
        periodStart: period.start,
        periodEnd: period.end,
        dueDays: options?.dueDays ?? subscription.billingAccount?.paymentTerms ?? undefined,
        lines: [line],
      },
      actorId,
    );
  }

  async create(
    body: CreateInvoiceInput,
    actorId: string,
  ) {
    if (!body.lines || body.lines.length === 0) {
      throw billingError.badRequest(
        BillingErrorCode.INVOICE_INVALID_STATE,
        'Une facture doit comporter au moins une ligne explicable (CDC 34).',
      );
    }

    const currency = assertCurrency(String(body.lines[0].currency).toUpperCase());
    const computed = this.computeTotals(body.lines, currency);

    const invoiceNumber = await this.numbering.next(body.tenantId);
    await this.numbering.assertAvailable(invoiceNumber);

    // RG-BILL-010 : aucun taux fiscal n est invente. taxTotal reste 0 tant
    // qu'une regle fiscale reelle n'a pas ete validee par la direction.
    const taxTotal = Money.zero(currency);
    const total = computed.subtotal.add(computed.taxTotal).subtract(computed.discount);
    const amountDue = total.subtract(computed.creditApplied);

    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId: body.tenantId,
        subscriptionId: body.subscriptionId ?? null,
        billingAccountId: body.billingAccountId ?? null,
        invoiceNumber,
        status: InvoiceStatus.DRAFT,
        currency,
        subtotal: new Prisma.Decimal(computed.subtotal.toDecimalString()),
        taxTotal: new Prisma.Decimal(taxTotal.toDecimalString()),
        discountTotal: new Prisma.Decimal(computed.discount.toDecimalString()),
        creditApplied: new Prisma.Decimal(computed.creditApplied.toDecimalString()),
        total: new Prisma.Decimal(total.toDecimalString()),
        amountPaid: new Prisma.Decimal(0),
        amountDue: new Prisma.Decimal(amountDue.toDecimalString()),
        periodStart: body.periodStart ?? null,
        periodEnd: body.periodEnd ?? null,
        dueAt:
          body.dueDays !== undefined && body.dueDays !== null
            ? new Date(Date.now() + body.dueDays * 86_400_000)
            : null,
        createdBy: actorId,
        items: {
          create: body.lines.map((line) => this.lineData(line, currency)),
        },
      },
      include: { items: true },
    });

    await this.audit.audit({
      actorId,
      tenantId: body.tenantId,
      action: 'billing.invoice.generated',
      targetType: 'Invoice',
      targetId: invoice.id,
      after: {
        invoiceNumber,
        currency,
        total: total.toDecimalString(),
        lines: invoice.items.length,
      },
    });
    await this.audit.emit({
      tenantId: body.tenantId,
      eventType: 'invoice.created',
      subscriptionId: body.subscriptionId ?? null,
      invoiceId: invoice.id,
      payload: { invoiceNumber, currency, total: total.toDecimalString() },
    });

    return invoice;
  }

  /** Emission : DRAFT -> OPEN, avec date d'echeance. RG-BILL-009 : fige. */
  async issue(id: string, tenantId: string | null, actorId: string, dueDays?: number) {
    const invoice = await this.getScoped(id, tenantId);
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw billingError.conflict(
        BillingErrorCode.INVOICE_INVALID_STATE,
        `Seule une facture DRAFT peut etre emise (statut actuel ${invoice.status}).`,
      );
    }
    const terms = dueDays ?? invoice.billingAccount?.paymentTerms ?? undefined;
    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.OPEN,
        issuedAt: new Date(),
        dueAt:
          terms !== undefined && terms !== null
            ? new Date(Date.now() + terms * 86_400_000)
            : invoice.dueAt ?? new Date(),
      },
      include: { items: true, payments: true },
    });
    await this.audit.audit({
      actorId,
      tenantId: invoice.tenantId,
      action: 'billing.invoice.issued',
      targetType: 'Invoice',
      targetId: id,
      before: { status: invoice.status },
      after: { status: updated.status, issuedAt: updated.issuedAt, dueAt: updated.dueAt },
    });
    await this.audit.emit({
      tenantId: invoice.tenantId,
      eventType: 'invoice.issued',
      invoiceId: id,
      subscriptionId: invoice.subscriptionId,
      payload: { invoiceNumber: invoice.invoiceNumber, total: invoice.total.toString() },
    });
    return updated;
  }

  async markOverdue(id: string, tenantId: string | null, actorId: string) {
    const invoice = await this.getScoped(id, tenantId);
    if (invoice.status !== InvoiceStatus.OPEN && invoice.status !== InvoiceStatus.PARTIALLY_PAID) {
      throw billingError.conflict(
        BillingErrorCode.INVOICE_INVALID_STATE,
        `Une facture ${invoice.status} ne peut pas passer OVERDUE.`,
      );
    }
    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.OVERDUE },
    });
    await this.audit.audit({
      actorId,
      tenantId: invoice.tenantId,
      action: 'billing.invoice.issued',
      targetType: 'Invoice',
      targetId: id,
      reason: 'Echeance depassee',
      before: { status: invoice.status },
      after: { status: InvoiceStatus.OVERDUE },
    });
    await this.audit.emit({
      tenantId: invoice.tenantId,
      eventType: 'invoice.overdue',
      invoiceId: id,
      subscriptionId: invoice.subscriptionId,
      payload: { invoiceNumber: invoice.invoiceNumber, dueAt: invoice.dueAt },
    });
    return updated;
  }

  async voidInvoice(id: string, tenantId: string | null, actorId: string, reason: string) {
    const invoice = await this.getScoped(id, tenantId);
    if (!reason || reason.trim().length === 0) {
      throw billingError.badRequest(
        BillingErrorCode.INVOICE_INVALID_STATE,
        'L annulation d une facture exige un motif (CDC 40 : correction tracable).',
      );
    }
    if (invoice.status === InvoiceStatus.PAID) {
      throw billingError.conflict(
        BillingErrorCode.INVOICE_ALREADY_PAID,
        'Une facture payee ne peut pas etre annulee : emettez un avoir ou un remboursement.',
      );
    }
    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.VOID, voidedAt: new Date(), voidReason: reason },
    });
    await this.audit.audit({
      actorId,
      tenantId: invoice.tenantId,
      action: 'billing.invoice.voided',
      targetType: 'Invoice',
      targetId: id,
      reason,
      before: { status: invoice.status },
      after: { status: InvoiceStatus.VOID },
    });
    await this.audit.emit({
      tenantId: invoice.tenantId,
      eventType: 'invoice.voided',
      invoiceId: id,
      subscriptionId: invoice.subscriptionId,
      payload: { invoiceNumber: invoice.invoiceNumber, reason },
    });
    return updated;
  }

  /**
   * Ajustement commercial trace (CDC 40). Cree une ligne d ajustement dediee :
   * les montants d'origine ne sont jamais reecrits.
   */
  async adjust(
    id: string,
    tenantId: string | null,
    actorId: string,
    body: AdjustInvoiceInput,
  ) {
    const invoice = await this.getScoped(id, tenantId);
    if (invoice.status === InvoiceStatus.VOID || invoice.status === InvoiceStatus.CANCELLED) {
      throw billingError.conflict(
        BillingErrorCode.INVOICE_INVALID_STATE,
        `Une facture ${invoice.status} n accepte plus d ajustement.`,
      );
    }
    if (!body.reason || body.reason.trim().length === 0) {
      throw billingError.badRequest(
        BillingErrorCode.INVOICE_INVALID_STATE,
        'Un ajustement exige un motif (CDC 40).',
      );
    }
    const currency = assertCurrency(invoice.currency.toUpperCase());
    let minor: number;
    try {
      minor = parseAmountToMinorUnits(body.amount, currency);
    } catch (error) {
      throw billingError.badRequest(
        BillingErrorCode.AMOUNT_INVALID,
        error instanceof Error ? error.message : 'Montant invalide.',
      );
    }

    const adjustment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.adjustment.create({
        data: {
          tenantId: invoice.tenantId,
          invoiceId: id,
          type: body.type,
          amount: new Prisma.Decimal(Money.ofMinorUnits(minor, currency).toDecimalString()),
          currency,
          reason: body.reason,
          createdBy: actorId,
        },
      });

      const delta = Money.ofMinorUnits(minor, currency);
      const nextTotal = Money.of(
        invoice.total.toString(),
        currency,
      ).add(delta).clampToZero();
      const paid = Money.of(invoice.amountPaid.toString(), currency);
      const nextDue = nextTotal.subtract(paid).clampToZero();

      const subtotal = Money.of(invoice.subtotal.toString(), currency);
      const taxTotal = Money.of(invoice.taxTotal.toString(), currency);
      const newSubtotal = nextTotal.subtract(taxTotal).clampToZero();
      const newDiscount = subtotal.subtract(newSubtotal).clampToZero();

      await tx.invoice.update({
        where: { id },
        data: {
          subtotal: new Prisma.Decimal(newSubtotal.toDecimalString()),
          discountTotal: new Prisma.Decimal(newDiscount.toDecimalString()),
          total: new Prisma.Decimal(nextTotal.toDecimalString()),
          amountDue: new Prisma.Decimal(nextDue.toDecimalString()),
          status: nextDue.isZero() ? InvoiceStatus.PAID : invoice.status,
          paidAt: nextDue.isZero() ? invoice.paidAt ?? new Date() : invoice.paidAt,
        },
      });

      return created;
    });

    await this.audit.audit({
      actorId,
      tenantId: invoice.tenantId,
      action: 'billing.invoice.adjusted',
      targetType: 'Invoice',
      targetId: id,
      reason: body.reason,
      before: { total: invoice.total.toString(), amountDue: invoice.amountDue.toString() },
      after: { type: body.type, amount: Money.ofMinorUnits(minor, currency).toDecimalString() },
    });
    return adjustment;
  }

  /**
   * Recalcule l'etat d une facture apres mouvement de paiement.
   * RG-BILL-007 : la somme des paiements est comparee en unites mineures.
   */
  async recomputePaidState(invoiceId: string, currency?: string): Promise<Record<string, unknown>> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });
    if (!invoice) {
      throw billingError.notFound(BillingErrorCode.INVOICE_NOT_FOUND, `Facture ${invoiceId} introuvable.`);
    }
    const resolved = assertCurrency((currency ?? invoice.currency).toUpperCase());

    const paid = invoice.payments
      .filter((payment) => payment.status === 'SUCCEEDED' || payment.status === 'PARTIALLY_REFUNDED')
      .reduce((total, payment) => total.add(Money.of(payment.amount.toString(), resolved)), Money.zero(resolved));

    const total = Money.of(invoice.total.toString(), resolved);
    const due = total.subtract(paid).clampToZero();

    const status: InvoiceStatus = due.isZero()
      ? InvoiceStatus.PAID
      : paid.isZero()
        ? invoice.status === InvoiceStatus.OVERDUE
          ? InvoiceStatus.OVERDUE
          : InvoiceStatus.OPEN
        : InvoiceStatus.PARTIALLY_PAID;

    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: new Prisma.Decimal(paid.toDecimalString()),
        amountDue: new Prisma.Decimal(due.toDecimalString()),
        status,
        paidAt: due.isZero() ? invoice.paidAt ?? new Date() : null,
      },
    });

    if (due.isZero() && invoice.status !== InvoiceStatus.PAID) {
      await this.audit.emit({
        tenantId: invoice.tenantId,
        eventType: 'invoice.paid',
        invoiceId,
        subscriptionId: invoice.subscriptionId,
        payload: { invoiceNumber: invoice.invoiceNumber, amountPaid: paid.toDecimalString(), currency: resolved },
      });
    }

    return updated as unknown as Record<string, unknown>;
  }

  assertPayable(invoice: { status: InvoiceStatus }): void {
    if (invoice.status === InvoiceStatus.VOID || invoice.status === InvoiceStatus.CANCELLED) {
      throw new BillingException(
        BillingErrorCode.INVOICE_INVALID_STATE,
        `Une facture ${invoice.status} n accepte aucun paiement.`,
        HttpStatus.CONFLICT,
      );
    }
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BillingException(
        BillingErrorCode.INVOICE_ALREADY_PAID,
        'Cette facture est deja entierement reglee.',
        HttpStatus.CONFLICT,
      );
    }
  }

  // -----------------------------------------------------------------------------------------

  /**
   * Totaux d'une facture. Les remises et credits ne passent PAS par les lignes
   * en MVP (CDC 38 : pas de moteur marketing) : ils sont appliques comme
   * `Adjustment` ou `Credit`, traces et separes du prix souscrit.
   */
  computeTotals(lines: readonly InvoiceLineInput[], currency: CurrencyCode) {
    let subtotal = Money.zero(currency);

    for (const line of lines) {
      let lineCurrency: CurrencyCode;
      let unit: number;
      let quantity: number;
      try {
        lineCurrency = assertCurrency(String(line.currency).toUpperCase());
        unit = parseAmountToMinorUnits(line.unitPrice, lineCurrency);
        quantity = Number(String(line.quantity));
      } catch (error) {
        throw billingError.badRequest(
          BillingErrorCode.AMOUNT_INVALID,
          error instanceof Error ? error.message : 'Montant de ligne invalide.',
        );
      }
      if (!Number.isFinite(quantity) || quantity < 0) {
        throw billingError.badRequest(
          BillingErrorCode.AMOUNT_INVALID,
          `Quantite invalide sur la ligne « ${line.description} ».`,
        );
      }
      if (lineCurrency !== currency) {
        throw billingError.badRequest(
          BillingErrorCode.CURRENCY_MISMATCH,
          `La ligne « ${line.description} » est en ${lineCurrency} alors que la facture est en ${currency}. Aucune conversion implicite n existe (RG-BILL-007).`,
        );
      }
      // quantity est un nombre : on le met a l'echelle centieme AVANT la
      // multiplication pour que le resultat reste entier.
      const quantityMinor = Math.round(quantity * 100);
      subtotal = subtotal.add(Money.ofMinorUnits(unit * quantityMinor, currency));
    }

    return {
      subtotal,
      taxTotal: Money.zero(currency),
      discount: Money.zero(currency),
      creditApplied: Money.zero(currency),
    };
  }

  private lineData(line: InvoiceLineInput, currency: CurrencyCode) {
    const unit = parseAmountToMinorUnits(line.unitPrice, currency);
    const quantity = Number(String(line.quantity));
    const quantityMinor = Math.round(quantity * 100);
    const lineSubtotal = Money.ofMinorUnits(unit * quantityMinor, currency);
    return {
      priceId: line.priceId ?? null,
      description: line.description,
      quantity: new Prisma.Decimal(quantity),
      unitPrice: new Prisma.Decimal(Money.ofMinorUnits(unit, currency).toDecimalString()),
      subtotal: new Prisma.Decimal(lineSubtotal.toDecimalString()),
      taxAmount: new Prisma.Decimal(0),
      discount: new Prisma.Decimal(0),
      total: new Prisma.Decimal(lineSubtotal.toDecimalString()),
      sourceType: line.sourceType ?? null,
      sourceRef: line.sourceRef ?? null,
      periodStart: line.periodStart ?? null,
      periodEnd: line.periodEnd ?? null,
      metadata: line.metadata
        ? (JSON.parse(JSON.stringify(line.metadata)) as Prisma.InputJsonValue)
        : undefined,
    };
  }
}