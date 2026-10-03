import { HttpStatus, Injectable } from '@nestjs/common';
import {
  CancellationMode,
  PlanStatus,
  PriceStatus,
  SubscriptionStatus,
} from '../../../generated/prisma/enums';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { BillingErrorCode } from '../common/billing-error-code';
import { BillingException, billingError } from '../common/billing.exception';
import { BillingAuditService } from '../common/billing-audit.service';
import { CurrencyCode, assertCurrency } from '../common/money';
import { nextPeriod } from '../common/billing-period';
import { EntitlementResolverService } from '../entitlements/entitlement-resolver.service';
import { BillingCatalogService } from '../catalog/billing-catalog.service';
import { allowedTransitions, canTransition } from './subscription-lifecycle';
import type {
  ActivateSubscriptionOptions,
  CancelSubscriptionInput,
  ChangePlanInput,
  CreateSubscriptionInput,
  ListSubscriptionsParams,
  UpsertBillingAccountInput,
  UpsertOverrideInput,
} from '../billing.dto';

/**
 * Subscriptions (CDC 13/15/30/54/55/56) et comptes de facturation (CDC 30/31).
 *
 * RG-BILL-027 : chaque lecture et chaque ecriture passe par un tenantId issu du
 * principal IAM. Aucun `tenantId` de requete n'est accepte tel quel.
 */
@Injectable()
export class BillingSubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: BillingAuditService,
    private readonly catalog: BillingCatalogService,
    private readonly entitlements: EntitlementResolverService,
  ) {}

  // -----------------------------------------------------------------------------------------
  // Billing Account (CDC 30/31)
  // -----------------------------------------------------------------------------------------

  async getBillingAccount(tenantId: string) {
    const account = await this.prisma.billingAccount.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
    if (!account) {
      throw billingError.notFound(
        BillingErrorCode.BILLING_ACCOUNT_NOT_FOUND,
        'Aucun compte de facturation pour ce tenant.',
      );
    }
    return account;
  }

  async listBillingAccounts(tenantId: string) {
    return this.prisma.billingAccount.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async upsertBillingAccount(
    tenantId: string,
    body: UpsertBillingAccountInput,
    actorId: string,
  ) {
    let currency: CurrencyCode;
    try {
      currency = assertCurrency((body.currency ?? 'MGA').toUpperCase());
    } catch (error) {
      throw billingError.badRequest(
        BillingErrorCode.CURRENCY_NOT_SUPPORTED,
        error instanceof Error ? error.message : 'Devise invalide.',
      );
    }
    if (!body.billingEmail || !body.billingEmail.includes('@')) {
      throw billingError.badRequest(
        BillingErrorCode.BILLING_CONFIGURATION_INVALID,
        'Une adresse email de facturation valide est requise.',
      );
    }
    if (body.paymentTerms !== undefined && body.paymentTerms !== null && body.paymentTerms < 0) {
      throw billingError.badRequest(
        BillingErrorCode.BILLING_CONFIGURATION_INVALID,
        'paymentTerms (jours) ne peut pas etre negatif.',
      );
    }

    const before = body.id
      ? await this.prisma.billingAccount.findFirst({ where: { id: body.id, tenantId } })
      : await this.prisma.billingAccount.findFirst({ where: { tenantId } });
    if (body.id && !before) {
      throw this.crossTenant(BillingErrorCode.BILLING_ACCOUNT_NOT_FOUND, 'billing account', body.id);
    }

    const data = {
      customerName: body.customerName,
      billingEmail: body.billingEmail,
      currency,
      billingAddress: body.billingAddress ? this.json(body.billingAddress) : undefined,
      taxInformation: body.taxInformation ? this.json(body.taxInformation) : undefined,
      legalName: body.legalName ?? null,
      billingContact: body.billingContact ?? null,
      taxIdentifier: body.taxIdentifier ?? null,
      invoiceLanguage: body.invoiceLanguage ?? 'fr',
      paymentTerms: body.paymentTerms ?? null,
      metadata: body.metadata ? this.json(body.metadata) : undefined,
      updatedBy: actorId,
    };

    const account = before
      ? await this.prisma.billingAccount.update({ where: { id: before.id }, data })
      : await this.prisma.billingAccount.create({
          data: { tenantId, ...data, createdBy: actorId },
        });

    await this.audit.audit({
      actorId,
      tenantId,
      action: 'billing.billing_account.updated',
      targetType: 'BillingAccount',
      targetId: account.id,
      before: before ? { currency: before.currency, billingEmail: before.billingEmail } : undefined,
      after: { currency: account.currency, billingEmail: account.billingEmail },
    });
    return account;
  }

  // -----------------------------------------------------------------------------------------
  // Lectures (CDC 13) — toujours scopees au tenant
  // -----------------------------------------------------------------------------------------

  async listForTenant(tenantId: string, params?: { status?: SubscriptionStatus }) {
    return this.prisma.subscription.findMany({
      where: { tenantId, ...(params?.status ? { status: params.status } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { plan: true, price: true, billingAccount: true },
    });
  }

  async currentForTenant(tenantId: string) {
    return this.prisma.subscription.findFirst({
      where: { tenantId, status: { in: Object.values(SubscriptionStatus) } },
      orderBy: { createdAt: 'desc' },
      include: {
        plan: { include: { entitlements: true, prices: true } },
        price: true,
        billingAccount: true,
        entitlementOverrides: true,
      },
    });
  }

  /** Liste plateforme : reservee a l'administration Billing. */
  listAll(params?: ListSubscriptionsParams) {
    const take = Math.min(params?.limit ?? 50, 200);
    const skip = params?.page ? (params.page - 1) * take : 0;
    return this.prisma.subscription.findMany({
      where: {
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.tenantId ? { tenantId: params.tenantId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        plan: { select: { id: true, code: true, name: true, status: true } },
        price: true,
        tenant: { select: { id: true, code: true, name: true } },
      },
    });
  }

  /**
   * Chargement scopee. Connaître l'UUID d'un abonnement d'un autre tenant ne
   * doit授予 aucun acces : la resource est introuvable, pas « interdite »
   * (CDC 82).
   */
  async getScoped(id: string, tenantId: string | null) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        plan: { include: { entitlements: true, prices: true } },
        price: true,
        billingAccount: true,
        entitlementOverrides: true,
      },
    });
    if (!subscription) {
      throw billingError.notFound(
        BillingErrorCode.SUBSCRIPTION_NOT_FOUND,
        `Abonnement ${id} introuvable.`,
      );
    }
    if (tenantId !== null && subscription.tenantId !== tenantId) {
      throw billingError.forbidden(
        BillingErrorCode.CROSS_TENANT_ACCESS_DENIED,
        "Cet abonnement appartient a un autre tenant.",
        { subscriptionId: id },
      );
    }
    return subscription;
  }

  // -----------------------------------------------------------------------------------------
  // Creation (CDC 13)
  // -----------------------------------------------------------------------------------------

  async create(
    body: CreateSubscriptionInput,
    actorId: string,
  ) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: body.tenantId } });
    if (!tenant) {
      throw billingError.notFound(
        BillingErrorCode.TENANT_SCOPE_VIOLATION,
        `Tenant ${body.tenantId} introuvable.`,
      );
    }
    const plan = await this.catalog.getPlan(body.planId);
    if (plan.status !== PlanStatus.ACTIVE) {
      throw billingError.conflict(
        BillingErrorCode.PLAN_INVALID_STATE,
        `Le plan ${plan.code} est ${plan.status} : seuls les plans ACTIFS peuvent etre souscrits.`,
      );
    }

    const existing = await this.prisma.subscription.findFirst({
      where: { tenantId: body.tenantId, status: { in: [SubscriptionStatus.TRIALING, SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE, SubscriptionStatus.GRACE_PERIOD] } },
    });
    if (existing) {
      // CDC 118 : le MVP gere un abonnement par tenant. Aucun second
      // abonnement n est cree silencieusement.
      throw billingError.conflict(
        BillingErrorCode.SUBSCRIPTION_CONFLICT,
        'Ce tenant possede deja un abonnement actif. Les abonnements multiples sont hors MVP (CDC 118).',
        { subscriptionId: existing.id },
      );
    }

    const billingAccount = body.billingAccountId
      ? await this.prisma.billingAccount.findFirst({
          where: { id: body.billingAccountId, tenantId: body.tenantId },
        })
      : await this.prisma.billingAccount.findFirst({ where: { tenantId: body.tenantId } });
    if (body.billingAccountId && !billingAccount) {
      throw billingError.notFound(
        BillingErrorCode.BILLING_ACCOUNT_NOT_FOUND,
        'Compte de facturation introuvable pour ce tenant.',
      );
    }

    const currency = (billingAccount?.currency ?? 'MGA') as CurrencyCode;
    const price = body.priceId
      ? await this.prisma.price.findFirst({
          where: { id: body.priceId, planId: body.planId, status: PriceStatus.ACTIVE },
        })
      : await this.findDefaultPrice(body.planId, currency);
    if (!price) {
      throw billingError.notFound(
        BillingErrorCode.PRICE_NOT_FOUND,
        `Aucun prix actif pour le plan ${plan.code} en ${currency}.`,
      );
    }

    const startsAt = body.startsAt ? new Date(body.startsAt) : new Date();
    if (Number.isNaN(startsAt.getTime())) {
      throw billingError.badRequest(
        BillingErrorCode.BILLING_CONFIGURATION_INVALID,
        'startsAt invalide.',
      );
    }

    // RG-BILL-034 : un trial n'existe que s'il est reellement configure.
    const trialDays = body.trialDays ?? plan.trialDays ?? 0;
    const withTrial = trialDays > 0;
    const trialEndsAt = withTrial ? new Date(startsAt.getTime() + trialDays * 86_400_000) : null;

    const interval = price.interval;
    const intervalCount = price.intervalCount;
    const period = nextPeriod(startsAt, interval, intervalCount);

    const requestedStatus = body.status ?? SubscriptionStatus.DRAFT;
    if (!canTransition(SubscriptionStatus.DRAFT, requestedStatus)) {
      throw billingError.conflict(
        BillingErrorCode.SUBSCRIPTION_INVALID_TRANSITION,
        `Transition DRAFT -> ${requestedStatus} interdite.`,
      );
    }

    const subscription = await this.prisma.subscription.create({
      data: {
        tenantId: body.tenantId,
        planId: body.planId,
        priceId: price.id,
        billingAccountId: billingAccount?.id ?? null,
        status: SubscriptionStatus.DRAFT,
        startsAt,
        trialEndsAt,
        graceDays: body.graceDays ?? null,
        autoRenew: body.autoRenew ?? true,
        metadata: body.metadata ? this.json(body.metadata) : undefined,
        createdBy: actorId,
      },
      include: { plan: true, price: true, billingAccount: true },
    });

    await this.audit.audit({
      actorId,
      tenantId: body.tenantId,
      action: 'billing.subscription.created',
      targetType: 'Subscription',
      targetId: subscription.id,
      after: {
        planId: plan.id,
        priceId: price.id,
        currency: price.currency,
        amount: price.amount.toString(),
        interval,
      },
    });
    await this.audit.emit({
      tenantId: body.tenantId,
      eventType: 'subscription.created',
      subscriptionId: subscription.id,
      payload: { planCode: plan.code, priceId: price.id },
    });

    if (requestedStatus === SubscriptionStatus.DRAFT) return subscription;
    return this.transition(subscription.id, requestedStatus, actorId, {
      period,
      reason: 'Creation',
    });
  }

  // -----------------------------------------------------------------------------------------
  // Transitions controlees
  // -----------------------------------------------------------------------------------------

  async activate(
    id: string,
    tenantId: string | null,
    actorId: string,
    options?: ActivateSubscriptionOptions,
  ) {
    await this.getScoped(id, tenantId);
    return this.transition(id, SubscriptionStatus.ACTIVE, actorId, {
      period: options?.period,
      at: options?.at,
    });
  }

  async suspend(
    id: string,
    tenantId: string | null,
    actorId: string,
    reason?: string,
  ) {
    const subscription = await this.getScoped(id, tenantId);
    if (!subscription.suspendReason && !reason) {
      throw billingError.badRequest(
        BillingErrorCode.BILLING_CONFIGURATION_INVALID,
        'Une suspension exige un motif (CDC 79 : operation sensible tracee).',
      );
    }
    return this.transition(id, SubscriptionStatus.SUSPENDED, actorId, {
      reason,
      extra: { suspendedAt: new Date(), suspendReason: reason ?? subscription.suspendReason },
    });
  }

  /**
   * Reactivate (CDC 53 / 113) :
   * PAYMENT VERIFIED -> SUBSCRIPTION VALIDATION -> REACTIVATE -> RECALCULATE
   * ENTITLEMENTS -> INVALIDATE CACHE -> EVENT
   */
  async reactivate(id: string, tenantId: string | null, actorId: string, reason?: string) {
    await this.getScoped(id, tenantId);
    const due = await this.prisma.invoice.aggregate({
      where: { subscriptionId: id, status: { in: ['OPEN', 'PARTIALLY_PAID', 'OVERDUE'] } },
      _sum: { amountDue: true },
    });
    const blocking = (due._sum.amountDue ?? new Prisma.Decimal(0)).gt(0);
    if (blocking) {
      throw billingError.conflict(
        BillingErrorCode.SUBSCRIPTION_INVALID_TRANSITION,
        'Impossible de reactiver : des factures restent dues pour cet abonnement.',
        { amountDue: due._sum.amountDue?.toString() ?? '0' },
      );
    }
    return this.transition(id, SubscriptionStatus.ACTIVE, actorId, {
      reason,
      extra: { suspendedAt: null, suspendReason: null, graceEndsAt: null },
    });
  }

  /**
   * Annulation (CDC 30/54). Une annulation ne supprime AUCUNE donnee metier
   * (RG-BILL-016) : elle marque l'abonnement et son entitlements.
   */
  async cancel(
    id: string,
    tenantId: string | null,
    actorId: string,
    body: CancelSubscriptionInput,
  ) {
    const subscription = await this.getScoped(id, tenantId);
    const at = body.at ?? new Date();

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw billingError.conflict(
        BillingErrorCode.SUBSCRIPTION_ALREADY_CANCELLED,
        'Cet abonnement est deja annule.',
      );
    }

    if (body.mode === CancellationMode.END_OF_PERIOD) {
      const effectiveAt = subscription.currentPeriodEnd ?? at;
      const updated = await this.prisma.subscription.update({
        where: { id },
        data: {
          cancelAt: effectiveAt,
          cancelRequestedAt: at,
          cancelRequestedBy: actorId,
          cancellationMode: CancellationMode.END_OF_PERIOD,
          cancellationReason: body.reason ?? null,
          autoRenew: false,
          updatedBy: actorId,
          version: { increment: 1 },
        },
      });
      await this.audit.audit({
        actorId,
        tenantId: subscription.tenantId,
        action: 'billing.subscription.cancelled',
        targetType: 'Subscription',
        targetId: id,
        reason: body.reason ?? 'Annulation en fin de periode',
        before: { status: subscription.status, autoRenew: subscription.autoRenew },
        after: { cancelAt: effectiveAt, cancellationMode: CancellationMode.END_OF_PERIOD },
      });
      return updated;
    }

    return this.transition(id, SubscriptionStatus.CANCELLED, actorId, {
      reason: body.reason,
      at,
      extra: {
        cancelledAt: at,
        cancelledBy: actorId,
        cancellationReason: body.reason ?? null,
        cancellationMode: CancellationMode.IMMEDIATE,
        cancelAt: at,
        autoRenew: false,
      },
      eventType: 'subscription.cancelled',
    });
  }

  /**
   * Upgrade / Downgrade (CDC 55/56). Avant tout changement de plan, on compare
   * les limites cibles a la consommation reelle : un downgrade incompatible est
   * refuse, il ne supprime JAMAIS la ressource excedentaire (RG-BILL-018).
   */
  async changePlan(
    id: string,
    tenantId: string | null,
    actorId: string,
    body: ChangePlanInput,
  ) {
    const subscription = await this.getScoped(id, tenantId);
    const targetPlan = await this.catalog.getPlan(body.planId);
    if (targetPlan.status !== PlanStatus.ACTIVE) {
      throw billingError.conflict(
        BillingErrorCode.PLAN_INVALID_STATE,
        `Le plan cible ${targetPlan.code} est ${targetPlan.status} et ne peut pas etre souscrit.`,
      );
    }
    if (targetPlan.id === subscription.planId) {
      throw billingError.badRequest(
        BillingErrorCode.PLAN_CHANGE_NOT_ALLOWED,
        'Le tenant est deja souscrit a ce plan.',
      );
    }

    const currency = (subscription.billingAccount?.currency ?? 'MGA') as CurrencyCode;
    const price = body.priceId
      ? await this.prisma.price.findFirst({
          where: { id: body.priceId, planId: targetPlan.id, status: PriceStatus.ACTIVE },
        })
      : await this.findDefaultPrice(targetPlan.id, currency);
    if (!price) {
      throw billingError.notFound(
        BillingErrorCode.PRICE_NOT_FOUND,
        `Aucun prix actif pour le plan cible ${targetPlan.code} en ${currency}.`,
      );
    }

    const compatibility = await this.checkDowngradeCompatibility(subscription.id, targetPlan.id);
    if (!compatibility.compatible) {
      throw billingError.conflict(
        BillingErrorCode.PLAN_CHANGE_NOT_ALLOWED,
        `Downgrade vers ${targetPlan.code} impossible : ${compatibility.incompatibilities.join(' ; ')}. Aucune ressource n est supprimee automatiquement (RG-BILL-018).`,
        compatibility,
      );
    }

    const updated = await this.prisma.subscription.update({
      where: { id },
      data: {
        planId: targetPlan.id,
        priceId: price.id,
        updatedBy: actorId,
        version: { increment: 1 },
      },
      include: { plan: true, price: true },
    });

    // RG-BILL-017 / CDC 61 : recalcul immediat + invalidation du cache.
    this.entitlements.invalidate(subscription.tenantId);

    await this.audit.audit({
      actorId,
      tenantId: subscription.tenantId,
      action: 'billing.subscription.plan_changed',
      targetType: 'Subscription',
      targetId: id,
      reason: body.reason ?? null,
      before: { planId: subscription.planId, priceId: subscription.priceId },
      after: { planId: targetPlan.id, priceId: price.id },
    });
    await this.audit.emit({
      tenantId: subscription.tenantId,
      eventType: 'subscription.plan_changed',
      subscriptionId: id,
      payload: { from: subscription.planId, to: targetPlan.id, priceId: price.id },
    });

    return updated;
  }

  /** Overrides d'entitlement (CDC 58) : explicites, dates, audites. */
  async upsertOverride(
    subscriptionId: string,
    tenantId: string | null,
    actorId: string,
    body: UpsertOverrideInput,
  ) {
    const subscription = await this.getScoped(subscriptionId, tenantId);
    if (!body.reason || body.reason.trim().length === 0) {
      throw billingError.badRequest(
        BillingErrorCode.BILLING_CONFIGURATION_INVALID,
        'Un override commercial exige un motif (CDC 58 : override audite).',
      );
    }
    const feature = await this.prisma.feature.findUnique({ where: { code: body.featureCode } });
    if (!feature) {
      throw billingError.badRequest(
        BillingErrorCode.FEATURE_NOT_FOUND,
        `Cle d entitlement ${body.featureCode} non declaree.`,
      );
    }

    const before = await this.prisma.subscriptionEntitlementOverride.findUnique({
      where: { subscriptionId_featureCode: { subscriptionId, featureCode: body.featureCode } },
    });

    const override = await this.prisma.subscriptionEntitlementOverride.upsert({
      where: { subscriptionId_featureCode: { subscriptionId, featureCode: body.featureCode } },
      create: {
        subscriptionId,
        featureCode: body.featureCode,
        valueType: body.integerValue !== undefined && body.integerValue !== null ? 'INTEGER' : 'BOOLEAN',
        enabled: body.enabled ?? true,
        integerValue: body.integerValue ?? null,
        decimalValue:
          body.decimalValue === undefined || body.decimalValue === null
            ? null
            : new Prisma.Decimal(body.decimalValue),
        stringValue: body.stringValue ?? null,
        reason: body.reason,
        validFrom: body.validFrom ? new Date(body.validFrom) : new Date(),
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        createdBy: actorId,
      },
      update: {
        enabled: body.enabled,
        integerValue: body.integerValue,
        decimalValue:
          body.decimalValue === undefined || body.decimalValue === null
            ? undefined
            : new Prisma.Decimal(body.decimalValue),
        stringValue: body.stringValue,
        reason: body.reason,
        validFrom: body.validFrom ? new Date(body.validFrom) : undefined,
        validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
        createdBy: actorId,
      },
    });

    this.entitlements.invalidate(subscription.tenantId);
    await this.audit.audit({
      actorId,
      tenantId: subscription.tenantId,
      action: 'billing.subscription.override_upserted',
      targetType: 'SubscriptionEntitlementOverride',
      targetId: override.id,
      reason: body.reason,
      before: before ?? undefined,
      after: {
        featureCode: body.featureCode,
        enabled: override.enabled,
        integerValue: override.integerValue,
        validUntil: override.validUntil,
      },
    });
    return override;
  }

  async removeOverride(
    subscriptionId: string,
    featureCode: string,
    tenantId: string | null,
    actorId: string,
  ) {
    const subscription = await this.getScoped(subscriptionId, tenantId);
    const existing = await this.prisma.subscriptionEntitlementOverride.findUnique({
      where: { subscriptionId_featureCode: { subscriptionId, featureCode } },
    });
    if (!existing) {
      throw billingError.notFound(
        BillingErrorCode.ENTITLEMENT_NOT_AVAILABLE,
        `Aucun override pour ${featureCode}.`,
      );
    }
    await this.prisma.subscriptionEntitlementOverride.delete({ where: { id: existing.id } });
    this.entitlements.invalidate(subscription.tenantId);
    await this.audit.audit({
      actorId,
      tenantId: subscription.tenantId,
      action: 'billing.subscription.override_removed',
      targetType: 'SubscriptionEntitlementOverride',
      targetId: existing.id,
      reason: existing.reason,
      before: { featureCode, enabled: existing.enabled },
    });
    return { removed: true };
  }

  // -----------------------------------------------------------------------------------------
  // Interne
  // -----------------------------------------------------------------------------------------

  async transition(
    id: string,
    to: SubscriptionStatus,
    actorId: string,
    options?: {
      reason?: string;
      period?: { start: Date; end: Date };
      at?: Date;
      extra?: Record<string, unknown>;
      eventType?: string;
    },
  ): Promise<Record<string, unknown>> {
    const current = await this.prisma.subscription.findUnique({ where: { id } });
    if (!current) {
      throw billingError.notFound(BillingErrorCode.SUBSCRIPTION_NOT_FOUND, `Abonnement ${id} introuvable.`);
    }
    if (current.status === to) {
      throw billingError.conflict(
        BillingErrorCode.SUBSCRIPTION_INVALID_TRANSITION,
        `L abonnement est deja ${to}.`,
      );
    }
    if (!canTransition(current.status, to)) {
      throw new BillingException(
        BillingErrorCode.SUBSCRIPTION_INVALID_TRANSITION,
        `Transition ${current.status} -> ${to} non autorisee par la machine a etats Billing.`,
        HttpStatus.CONFLICT,
        { from: current.status, to, allowed: allowedTransitions(current.status) },
      );
    }

    const at = options?.at ?? new Date();
    const period =
      options?.period ??
      (current.currentPeriodStart && current.currentPeriodEnd
        ? { start: current.currentPeriodStart, end: current.currentPeriodEnd }
        : undefined);

    const data: Record<string, unknown> = {
      status: to,
      updatedBy: actorId,
      version: { increment: 1 },
      ...(options?.extra ?? {}),
    };
    if (period) {
      data.currentPeriodStart = period.start;
      data.currentPeriodEnd = period.end;
      data.nextBillingAt = period.end;
      data.renewalAt = period.end;
    }
    if (to === SubscriptionStatus.ACTIVE) {
      data.graceEndsAt = null;
      data.cancelAt = null;
      data.cancelRequestedAt = null;
      data.cancelRequestedBy = null;
      data.cancellationMode = null;
    }

    const updated = await this.prisma.subscription.update({
      where: { id },
      data,
      include: { plan: true, price: true, billingAccount: true },
    });

    // RG-BILL-036 : toute mutation d'etat invalide les entitlements caches.
    this.entitlements.invalidate(current.tenantId);

    const actionByStatus: Partial<Record<SubscriptionStatus, string>> = {
      ACTIVE: current.status === SubscriptionStatus.SUSPENDED
        ? 'billing.subscription.reactivated'
        : 'billing.subscription.activated',
      SUSPENDED: 'billing.subscription.suspended',
      CANCELLED: 'billing.subscription.cancelled',
      GRACE_PERIOD: 'billing.subscription.suspended',
      PAST_DUE: 'billing.subscription.suspended',
    };
    await this.audit.audit({
      actorId,
      tenantId: current.tenantId,
      action: actionByStatus[to] ?? 'billing.subscription.activated',
      targetType: 'Subscription',
      targetId: id,
      reason: options?.reason ?? null,
      before: { status: current.status },
      after: { status: to },
    });

    const eventByStatus: Partial<Record<SubscriptionStatus, string>> = {
      ACTIVE: current.status === SubscriptionStatus.SUSPENDED
        ? 'subscription.reactivated'
        : 'subscription.activated',
      SUSPENDED: 'subscription.suspended',
      CANCELLED: 'subscription.cancelled',
      GRACE_PERIOD: 'subscription.grace_started',
      PAST_DUE: 'subscription.past_due',
    };
    const eventType = options?.eventType ?? eventByStatus[to];
    if (eventType) {
      await this.audit.emit({
        tenantId: current.tenantId,
        eventType,
        subscriptionId: id,
        payload: { from: current.status, to, reason: options?.reason ?? null, at: at.toISOString() },
      });
    }

    return updated as unknown as Record<string, unknown>;
  }

  async checkDowngradeCompatibility(subscriptionId: string, targetPlanId: string) {
    const subscription = await this.prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!subscription) {
      throw billingError.notFound(
        BillingErrorCode.SUBSCRIPTION_NOT_FOUND,
        `Abonnement ${subscriptionId} introuvable.`,
      );
    }
    const [currentPlan, targetPlan] = await Promise.all([
      this.prisma.plan.findUnique({ where: { id: subscription.planId }, include: { entitlements: true } }),
      this.prisma.plan.findUnique({ where: { id: targetPlanId }, include: { entitlements: true } }),
    ]);
    if (!currentPlan || !targetPlan) {
      throw billingError.notFound(BillingErrorCode.PLAN_NOT_FOUND, 'Plan source ou cible introuvable.');
    }

    const incompatibilities: string[] = [];
    for (const entitlement of currentPlan.entitlements) {
      if (entitlement.kind !== 'LIMIT' && entitlement.kind !== 'QUOTA') continue;
      const target = targetPlan.entitlements.find((item) => item.featureCode === entitlement.featureCode);
      if (!target) {
        incompatibilities.push(`${entitlement.featureCode} absent du plan cible`);
        continue;
      }
      const targetLimit = target.integerValue ?? Number(String(target.decimalValue ?? 0));
      if (targetLimit === 0) continue;
      const quota = await this.prisma.quotaUsage.findFirst({
        where: { subscriptionId, featureCode: entitlement.featureCode },
        orderBy: { periodEnd: 'desc' },
      });
      const used = Number(String(quota?.usedValue ?? 0));
      if (used > targetLimit) {
        incompatibilities.push(
          `${entitlement.featureCode} : ${used} consomme(s) pour une limite cible de ${targetLimit}`,
        );
      }
    }
    return { compatible: incompatibilities.length === 0, incompatibilities };
  }

  async renew(
    id: string,
    tenantId: string | null,
    actorId: string,
    period: { start: Date; end: Date },
    eventReason = 'Renouvellement manuel',
  ) {
    const subscription = await this.getScoped(id, tenantId);
    const updated = await this.transition(id, SubscriptionStatus.ACTIVE, actorId, {
      period,
      reason: eventReason,
      extra: { trialEndsAt: null, cancelAt: null, graceEndsAt: null },
    });
    await this.audit.audit({
      actorId,
      tenantId: subscription.tenantId,
      action: 'billing.subscription.renewed',
      targetType: 'Subscription',
      targetId: id,
      reason: eventReason,
      before: { currentPeriodEnd: subscription.currentPeriodEnd },
      after: { currentPeriodStart: period.start, currentPeriodEnd: period.end },
    });
    return updated;
  }

  private async findDefaultPrice(planId: string, currency: string) {
    const now = new Date();
    const prices = await this.prisma.price.findMany({
      where: {
        planId,
        currency: currency.toUpperCase(),
        status: PriceStatus.ACTIVE,
        effectiveFrom: { lte: now },
      },
      orderBy: { effectiveFrom: 'desc' },
    });
    return prices.find((price) => !price.effectiveUntil || price.effectiveUntil > now) ?? null;
  }

  private crossTenant(code: BillingErrorCode, resource: string, id: string) {
    return billingError.forbidden(
      BillingErrorCode.CROSS_TENANT_ACCESS_DENIED,
      `Cette ressource ${resource} n appartient pas au tenant courant.`,
      { resource, id },
    );
  }

  private json(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
