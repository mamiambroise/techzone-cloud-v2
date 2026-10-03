import { Injectable, Logger } from '@nestjs/common';
import {
  BillingDiagnosticStatus,
  BillingStage,
  InvoiceStatus,
  SubscriptionStatus,
} from '../../../generated/prisma/enums';
import { PrismaService } from '../../../prisma/prisma.service';
import { BillingAuditService } from '../common/billing-audit.service';
import { addGraceDays, nextPeriod, resolvePeriod } from '../common/billing-period';
import { BillingErrorCode } from '../common/billing-error-code';
import { billingError } from '../common/billing.exception';
import { EntitlementResolverService } from '../entitlements/entitlement-resolver.service';
import { BillingInvoiceService } from '../invoice/billing-invoice.service';
import { BillingSubscriptionService } from '../subscription/billing-subscription.service';
import { BillingDiagnosticsService } from '../diagnostics/billing-diagnostics.service';

/**
 * Cycle de vie recurrent du Billing (CDC 51/52/98/112/113).
 *
 * Toutes les sweeps sont :
 *  - idempotentes : relancer un sweep ne duplique ni facture ni evenement ;
 *  - deterministes : la duree de grace vient de la configuration
 *    (`BILLING_GRACE_DAYS`, surcharge par abonnement) et la periode du Price ;
 *  - tracees : chaque transition produit un AuditEvent + un BillingEvent.
 *
 * Le systeme utilizes chaque jour UTC. Aucun « jour Local » arbitraire.
 */
@Injectable()
export class BillingLifecycleService {
  private readonly logger = new Logger(BillingLifecycleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: BillingAuditService,
    private readonly subscriptions: BillingSubscriptionService,
    private readonly invoices: BillingInvoiceService,
    private readonly entitlements: EntitlementResolverService,
    private readonly diagnostics: BillingDiagnosticsService,
  ) {}

  /**
   * CDC 51 : la duree de grace n'est jamais codee en dur dans une transition.
   * Ordre : surcharge abonnement -> configuration plateforme -> defaut documente.
   */
  graceDaysFor(subscription: { graceDays?: number | null }): number {
    if (typeof subscription.graceDays === 'number' && Number.isFinite(subscription.graceDays)) {
      return Math.max(0, Math.trunc(subscription.graceDays));
    }
    const configured = Number.parseInt(process.env.BILLING_GRACE_DAYS ?? '', 10);
    if (Number.isFinite(configured)) {
      return Math.max(0, configured);
    }
    return 7;
  }

  // -----------------------------------------------------------------------------------------
  // Reactions aux paiements (CDC 53 / 111 / 113)
  // -----------------------------------------------------------------------------------------

  /**
   * Facture entierement reglee : l'abonnement redevient ACTIVE s'il etait en
   * grace ou suspendu, les entitlements sont recalcules immediatement.
   */
  async onPaymentSucceeded(
    tenantId: string,
    invoiceId: string,
    paymentId: string,
    actorId: string,
  ): Promise<void> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, tenantId: true, subscriptionId: true, status: true, invoiceNumber: true },
    });
    if (!invoice || invoice.status !== InvoiceStatus.PAID || !invoice.subscriptionId) {
      return;
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { id: invoice.subscriptionId },
    });
    if (!subscription) return;

    if (
      subscription.status === SubscriptionStatus.GRACE_PERIOD ||
      subscription.status === SubscriptionStatus.SUSPENDED ||
      subscription.status === SubscriptionStatus.PAST_DUE
    ) {
      await this.subscriptions.transition(subscription.id, SubscriptionStatus.ACTIVE, actorId, {
        reason: `Facture ${invoice.invoiceNumber} soldee (paiement ${paymentId})`,
        extra: { graceEndsAt: null, suspendedAt: null, suspendReason: null },
      });
      this.entitlements.invalidate(tenantId);
      await this.diagnostics.record({
        stage: BillingStage.SUBSCRIPTION_RESOLVER,
        status: BillingDiagnosticStatus.HEALTHY,
        message: `Abonnement reactive apres reglement de la facture ${invoice.invoiceNumber}.`,
        resource: subscription.id,
        correlationId: paymentId,
        tenantId,
      });
    }
  }

  /**
   * Echec de paiement sur une facture emise : abonnement PAST_DUE puis entree
   * en grace. RG-BILL-013 : les entitlements restent servis pendant la grace,
   * seule la suspension les retire.
   */
  async onPaymentFailure(
    tenantId: string,
    invoiceId: string,
    paymentId: string,
    actorId: string,
  ): Promise<void> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, tenantId: true, subscriptionId: true, status: true },
    });
    if (!invoice?.subscriptionId) return;
    if (invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.VOID) return;

    const subscription = await this.prisma.subscription.findUnique({
      where: { id: invoice.subscriptionId },
    });
    if (!subscription) return;
    if (subscription.status !== SubscriptionStatus.ACTIVE && subscription.status !== SubscriptionStatus.TRIALING) {
      return;
    }

    const graceDays = this.graceDaysFor(subscription);
    await this.subscriptions.transition(subscription.id, SubscriptionStatus.PAST_DUE, actorId, {
      reason: 'Echec de paiement',
      eventType: 'subscription.past_due',
    });
    await this.audit.audit({
      actorId,
      tenantId,
      action: 'billing.subscription.past_due',
      targetType: 'Subscription',
      targetId: subscription.id,
      reason: 'Echec de paiement',
      after: { paymentId, graceDays },
    });

    if (graceDays <= 0) {
      await this.subscriptions.suspend(
        subscription.id,
        tenantId,
        actorId,
        'Suspension immediate : aucune grace configuree.',
      );
      return;
    }

    const graceEndsAt = addGraceDays(new Date(), graceDays);
    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.GRACE_PERIOD, graceEndsAt, updatedBy: actorId, version: { increment: 1 } },
    });
    await this.audit.emit({
      tenantId,
      eventType: 'subscription.grace_started',
      subscriptionId: subscription.id,
      paymentId,
      payload: { graceDays, graceEndsAt: graceEndsAt.toISOString() },
    });
    this.entitlements.invalidate(tenantId);
  }

  // -----------------------------------------------------------------------------------------
  // Sweeps planifiables
  // -----------------------------------------------------------------------------------------

  /** Factures echues non soldees -> OVERDUE + cascade PAST_DUE/grace. */
  async sweepOverdueInvoices(now = new Date()): Promise<number> {
    const overdue = await this.prisma.invoice.findMany({
      where: {
        status: { in: [InvoiceStatus.OPEN, InvoiceStatus.PARTIALLY_PAID] },
        dueAt: { lte: now },
      },
      select: { id: true, tenantId: true, subscriptionId: true, invoiceNumber: true },
      take: 200,
    });

    for (const invoice of overdue) {
      try {
        await this.invoices.markOverdue(invoice.id, null, 'system:billing-lifecycle');
        if (invoice.subscriptionId) {
          await this.onPaymentFailure(
            invoice.tenantId,
            invoice.id,
            'system:billing-lifecycle',
            'system:billing-lifecycle',
          );
        }
      } catch (error) {
        await this.diagnostics.record({
          stage: BillingStage.INVOICE_GENERATION,
          status: BillingDiagnosticStatus.DEGRADED,
          code: BillingErrorCode.INVOICE_INVALID_STATE,
          message: `Sweep overdue en echec sur la facture ${invoice.invoiceNumber}.`,
          resource: invoice.id,
          tenantId: invoice.tenantId,
          details: { error: error instanceof Error ? error.message : String(error) },
        });
      }
    }
    return overdue.length;
  }

  /** Fin de grace atteinte -> suspension (les entitlements sont retires). */
  async sweepGraceExpirations(now = new Date()): Promise<number> {
    const expired = await this.prisma.subscription.findMany({
      where: { status: SubscriptionStatus.GRACE_PERIOD, graceEndsAt: { lte: now } },
      select: { id: true, tenantId: true },
      take: 200,
    });
    for (const subscription of expired) {
      try {
        await this.subscriptions.suspend(
          subscription.id,
          null,
          'system:billing-lifecycle',
          'Grace period expiree sans reglement.',
        );
      } catch (error) {
        await this.diagnostics.record({
          stage: BillingStage.SUBSCRIPTION_RESOLVER,
          status: BillingDiagnosticStatus.DEGRADED,
          message: `Suspension apres grace en echec (${subscription.id}).`,
          resource: subscription.id,
          tenantId: subscription.tenantId,
          details: { error: error instanceof Error ? error.message : String(error) },
        });
      }
    }
    return expired.length;
  }

  /** Fin de trial -> abonnement ACTIVE + premiere facture. */
  async sweepTrialExpirations(now = new Date()): Promise<number> {
    const trials = await this.prisma.subscription.findMany({
      where: { status: SubscriptionStatus.TRIALING, trialEndsAt: { lte: now } },
      include: { price: true },
      take: 200,
    });
    let processed = 0;
    for (const subscription of trials) {
      const period = subscription.price
        ? resolvePeriod(null, now, subscription.price.interval, subscription.price.intervalCount)
        : { start: now, end: now };
      try {
        await this.subscriptions.renew(
          subscription.id,
          null,
          'system:billing-lifecycle',
          period,
          'Fin de periode d essai',
        );
        await this.audit.emit({
          tenantId: subscription.tenantId,
          eventType: 'subscription.trial_expired',
          subscriptionId: subscription.id,
          payload: { trialEndsAt: subscription.trialEndsAt },
        });
        await this.generateInvoiceForCurrentPeriod(subscription.id, subscription.tenantId);
        processed += 1;
      } catch (error) {
        await this.diagnostics.record({
          stage: BillingStage.SUBSCRIPTION_RESOLVER,
          status: BillingDiagnosticStatus.DEGRADED,
          message: `Fin de trial en echec (${subscription.id}).`,
          resource: subscription.id,
          tenantId: subscription.tenantId,
          details: { error: error instanceof Error ? error.message : String(error) },
        });
      }
    }
    return processed;
  }

  /**
   * Renouvellement (CDC 52). La periode avance AVANT la generation pour que la
   * facture porte la bonne periode ; si la generation echoue, la subscription
   * reste facturable a la periode suivante et l'echec est trace.
   */
  async sweepRenewals(now = new Date()): Promise<number> {
    const due = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        autoRenew: true,
        currentPeriodEnd: { lte: now },
        cancelAt: null,
      },
      include: { price: true },
      take: 200,
    });

    let processed = 0;
    for (const subscription of due) {
      const price = subscription.price;
      if (!price) {
        await this.diagnostics.record({
          stage: BillingStage.RENEWAL,
          status: BillingDiagnosticStatus.CRITICAL,
          code: BillingErrorCode.PRICE_NOT_FOUND,
          message: 'Abonnement ACTIVE sans Price : aucun renouvellement possible.',
          resource: subscription.id,
          tenantId: subscription.tenantId,
        });
        continue;
      }

      const period = nextPeriod(
        subscription.currentPeriodEnd ?? now,
        price.interval,
        price.intervalCount,
      );
      try {
        await this.subscriptions.renew(subscription.id, null, 'system:billing-lifecycle', period);
        await this.audit.emit({
          tenantId: subscription.tenantId,
          eventType: 'subscription.activated',
          subscriptionId: subscription.id,
          payload: { renewal: true, periodStart: period.start, periodEnd: period.end },
        });
        await this.generateInvoiceForCurrentPeriod(subscription.id, subscription.tenantId);
        processed += 1;
      } catch (error) {
        await this.diagnostics.record({
          stage: BillingStage.RENEWAL,
          status: BillingDiagnosticStatus.CRITICAL,
          code: BillingErrorCode.BILLING_CONFIGURATION_INVALID,
          message: `Renouvellement en echec (${subscription.id}).`,
          resource: subscription.id,
          tenantId: subscription.tenantId,
          details: { error: error instanceof Error ? error.message : String(error) },
        });
      }
    }
    return processed;
  }

  /** Annulation en fin de periode atteinte -> CANCELLED puis ENDED. */
  async sweepScheduledCancellations(now = new Date()): Promise<number> {
    const due = await this.prisma.subscription.findMany({
      where: { cancelAt: { lte: now }, status: { notIn: [SubscriptionStatus.CANCELLED, SubscriptionStatus.ENDED] } },
      select: { id: true, tenantId: true },
      take: 200,
    });
    for (const subscription of due) {
      try {
        await this.subscriptions.cancel(subscription.id, null, 'system:billing-lifecycle', {
          mode: 'IMMEDIATE',
          reason: 'Annulation programmee en fin de periode',
          at: now,
        });
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: SubscriptionStatus.ENDED,
            endsAt: now,
            endedAt: now,
            autoRenew: false,
            updatedBy: 'system:billing-lifecycle',
          },
        });
        await this.audit.emit({
          tenantId: subscription.tenantId,
          eventType: 'subscription.ended',
          subscriptionId: subscription.id,
          payload: { endedAt: now.toISOString() },
        });
        this.entitlements.invalidate(subscription.tenantId);
      } catch (error) {
        await this.diagnostics.record({
          stage: BillingStage.SUBSCRIPTION_RESOLVER,
          status: BillingDiagnosticStatus.DEGRADED,
          message: `Annulation programmee en echec (${subscription.id}).`,
          resource: subscription.id,
          tenantId: subscription.tenantId,
          details: { error: error instanceof Error ? error.message : String(error) },
        });
      }
    }
    return due.length;
  }

  /** Point d'entree unique : toutes les etapes, dans un ordre explicite. */
  async runAllSweeps(now = new Date()) {
    const overdue = await this.sweepOverdueInvoices(now);
    const trials = await this.sweepTrialExpirations(now);
    const renewals = await this.sweepRenewals(now);
    const grace = await this.sweepGraceExpirations(now);
    const cancellations = await this.sweepScheduledCancellations(now);
    const summary = { overdue, trials, renewals, grace, cancellations, at: now.toISOString() };
    this.logger.log(`Sweeps Billing termines : ${JSON.stringify(summary)}`);
    return summary;
  }

  /** Generation d'une facture pour la periode courante de l'abonnement. */
  async generateInvoiceForCurrentPeriod(subscriptionId: string, tenantId: string) {
    try {
      const invoice = await this.invoices.generateForSubscription(
        subscriptionId,
        tenantId,
        'system:billing-lifecycle',
      );
      return invoice;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Une facture existante pour la periode n'est pas une erreur de sweep.
      if (message.includes('deja existe')) {
        this.logger.debug(`Facture deja presente pour ${subscriptionId} : rien a regenerer.`);
        return null;
      }
      await this.diagnostics.record({
        stage: BillingStage.INVOICE_GENERATION,
        status: BillingDiagnosticStatus.CRITICAL,
        code: BillingErrorCode.BILLING_CONFIGURATION_INVALID,
        message: `Generation de facture en echec (${subscriptionId}).`,
        resource: subscriptionId,
        tenantId,
        details: { error: message },
      });
      throw billingError.unprocessable(
        BillingErrorCode.BILLING_CONFIGURATION_INVALID,
        message,
      );
    }
  }
}