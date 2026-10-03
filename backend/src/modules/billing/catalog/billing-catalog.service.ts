import { HttpStatus, Injectable } from '@nestjs/common';
import {
  BillingInterval,
  EntitlementKind,
  EntitlementValueType,
  EnforcementPolicy,
  PlanStatus,
  PriceStatus,
  PricingModel,
} from '../../../generated/prisma/enums';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { BillingErrorCode } from '../common/billing-error-code';
import { BillingException, billingError } from '../common/billing.exception';
import { BillingAuditService } from '../common/billing-audit.service';
import type {
  CreatePlanInput,
  CreatePriceInput,
  CreateProductInput,
  ListFeaturesParams,
  ListPlansParams,
  ListPricesParams,
  ListProductsParams,
  UpdatePlanInput,
  UpsertFeatureInput,
  UpsertPlanEntitlementInput,
} from '../billing.dto';
import {
  CurrencyCode,
  Money,
  assertCurrency,
  parseAmountToMinorUnits,
  toMinorUnits,
} from '../common/money';

/**
 * Catalogue commercial (CDC 7/8/9) : Product -> Plan -> Price, et le referentiel
 * des cles d'entitlement (Feature).
 *
 * Frontiere plateforme : Product, Plan, Price et Feature sont PLATFORM GLOBAL
 * (CDC 83) — ils ne portent pas de tenantId et leur securite est la permission.
 */

@Injectable()
export class BillingCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: BillingAuditService,
  ) {}

  // -----------------------------------------------------------------------------------------
  // Products (CDC 7)
  // -----------------------------------------------------------------------------------------

  listProducts(params?: ListProductsParams) {
    return this.prisma.billingProduct.findMany({
      where: {
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.search
          ? {
              OR: [
                { key: { contains: params.search, mode: 'insensitive' } },
                { name: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { plans: { select: { id: true, code: true, name: true, status: true } } },
    });
  }

  async createProduct(
    body: CreateProductInput,
    actorId: string,
  ) {
    const existing = await this.prisma.billingProduct.findUnique({ where: { key: body.key } });
    if (existing) {
      throw billingError.conflict(
        BillingErrorCode.PRODUCT_CODE_TAKEN,
        `La cle de produit ${body.key} est deja utilisee.`,
      );
    }
    const product = await this.prisma.billingProduct.create({
      data: {
        key: body.key,
        name: body.name,
        description: body.description ?? null,
        features: body.features ? this.json(body.features) : undefined,
        metadata: body.metadata ? this.json(body.metadata) : undefined,
        createdBy: actorId,
      },
    });
    await this.audit.audit({
      actorId,
      tenantId: null,
      action: 'billing.product.created',
      targetType: 'BillingProduct',
      targetId: product.id,
      after: { key: product.key, name: product.name },
    });
    return product;
  }

  // -----------------------------------------------------------------------------------------
  // Plans (CDC 8)
  // -----------------------------------------------------------------------------------------

  listPlans(params?: ListPlansParams) {
    const take = Math.min(params?.limit ?? 50, 200);
    const skip = params?.page ? (params.page - 1) * take : 0;
    return this.prisma.plan.findMany({
      where: {
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.productId ? { productId: params.productId } : {}),
        ...(params?.search
          ? {
              OR: [
                { code: { contains: params.search, mode: 'insensitive' } },
                { name: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        entitlements: true,
        prices: { orderBy: { effectiveFrom: 'desc' } },
        product: { select: { id: true, key: true, name: true } },
      },
    });
  }

  async getPlan(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: {
        entitlements: true,
        prices: { orderBy: { effectiveFrom: 'desc' } },
        product: { select: { id: true, key: true, name: true } },
      },
    });
    if (!plan) {
      throw billingError.notFound(BillingErrorCode.PLAN_NOT_FOUND, `Plan ${id} introuvable.`);
    }
    return plan;
  }

  async createPlan(
    body: CreatePlanInput,
    actorId: string,
  ) {
    const existing = await this.prisma.plan.findUnique({ where: { code: body.code } });
    if (existing) {
      throw billingError.conflict(
        BillingErrorCode.PLAN_CODE_TAKEN,
        `La cle de plan ${body.code} est deja utilisee.`,
      );
    }
    if (body.trialDays !== undefined && body.trialDays !== null && body.trialDays < 0) {
      throw billingError.badRequest(
        BillingErrorCode.BILLING_CONFIGURATION_INVALID,
        'trialDays ne peut pas etre negatif.',
      );
    }
    if (body.billingModel && body.billingModel !== PricingModel.FLAT) {
      // CDC 12 / 118 : le MVP est FLAT. Les autres modeles ne sont pas
      // simules, ils sont refuses explicitement.
      throw billingError.badRequest(
        BillingErrorCode.BILLING_CONFIGURATION_INVALID,
        `Le modele de tarification ${body.billingModel} n est pas disponible. Le MVP ne gere que FLAT (CDC 118).`,
      );
    }
    if (body.productId) {
      const product = await this.prisma.billingProduct.findUnique({ where: { id: body.productId } });
      if (!product) {
        throw billingError.notFound(
          BillingErrorCode.PRODUCT_NOT_FOUND,
          `Produit ${body.productId} introuvable.`,
        );
      }
    }

    const plan = await this.prisma.plan.create({
      data: {
        code: body.code,
        name: body.name,
        description: body.description ?? null,
        status: PlanStatus.DRAFT,
        billingModel: body.billingModel ?? PricingModel.FLAT,
        billingInterval: body.billingInterval ?? BillingInterval.MONTHLY,
        intervalCount: body.intervalCount ?? 1,
        trialDays: body.trialDays ?? null,
        productId: body.productId ?? null,
        metadata: body.metadata ? this.json(body.metadata) : undefined,
        createdBy: actorId,
      },
    });

    await this.audit.audit({
      actorId,
      tenantId: null,
      action: 'billing.plan.created',
      targetType: 'Plan',
      targetId: plan.id,
      after: { code: plan.code, name: plan.name, status: plan.status },
    });
    return plan;
  }

  async updatePlan(
    id: string,
    body: UpdatePlanInput,
    actorId: string,
  ) {
    const before = await this.getPlan(id);

    // CDC 94 : un plan ACTIVE deja souscrit ne doit pas etre modifie
    // silencieusement. changer son cycle ou son essai affecterait des contrats
    // existants : il faut versionner ou limiter aux plans DRAFT/DEPRECATED.
    const hasSubscriptions = await this.prisma.subscription.count({ where: { planId: id } });
    if (hasSubscriptions > 0) {
      const commercialChange =
        (body.billingInterval !== undefined && body.billingInterval !== before.billingInterval) ||
        (body.intervalCount !== undefined && body.intervalCount !== before.intervalCount) ||
        (body.trialDays !== undefined && body.trialDays !== before.trialDays);
      if (commercialChange) {
        throw billingError.conflict(
          BillingErrorCode.PLAN_INVALID_STATE,
          `Le plan ${before.code} porte ${hasSubscriptions} abonnement(s) : son cycle et sa duree d essai sont figes. Creer un nouveau plan ou un nouveau prix (CDC 44 / CDC 95).`,
        );
      }
    }

    const plan = await this.prisma.plan.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.billingInterval !== undefined ? { billingInterval: body.billingInterval } : {}),
        ...(body.intervalCount !== undefined ? { intervalCount: body.intervalCount } : {}),
        ...(body.trialDays !== undefined ? { trialDays: body.trialDays } : {}),
        ...(body.metadata !== undefined ? { metadata: this.json(body.metadata) } : {}),
        updatedBy: actorId,
        version: { increment: 1 },
      },
    });

    await this.audit.audit({
      actorId,
      tenantId: null,
      action: 'billing.plan.updated',
      targetType: 'Plan',
      targetId: id,
      before: { name: before.name, billingInterval: before.billingInterval, intervalCount: before.intervalCount },
      after: { name: plan.name, billingInterval: plan.billingInterval, intervalCount: plan.intervalCount },
    });
    return plan;
  }

  async setPlanStatus(
    id: string,
    status: PlanStatus,
    actorId: string,
  ) {
    const plan = await this.getPlan(id);
    if (plan.status === status) {
      throw billingError.conflict(
        BillingErrorCode.PLAN_INVALID_STATE,
        `Le plan ${plan.code} est deja ${status}.`,
      );
    }
    if (status === PlanStatus.ACTIVE) {
      // Un plan sans prix actif ne peut pas etre vendu.
      const activePrice = await this.prisma.price.count({
        where: { planId: id, status: PriceStatus.ACTIVE },
      });
      if (activePrice === 0) {
        throw billingError.conflict(
          BillingErrorCode.PRICE_INVALID_STATE,
          `Le plan ${plan.code} n a aucun prix ACTIF : un plan sans tarif ne peut pas etre active (RG-BILL-005).`,
        );
      }
    }

    const updated = await this.prisma.plan.update({
      where: { id },
      data: {
        status,
        updatedBy: actorId,
        archivedAt: status === PlanStatus.ARCHIVED ? new Date() : plan.archivedAt,
        version: { increment: 1 },
      },
    });

    const action =
      status === PlanStatus.ACTIVE
        ? 'billing.plan.activated'
        : status === PlanStatus.DEPRECATED
          ? 'billing.plan.deprecated'
          : 'billing.plan.archived';

    await this.audit.audit({
      actorId,
      tenantId: null,
      action,
      targetType: 'Plan',
      targetId: id,
      before: { status: plan.status },
      after: { status: updated.status },
    });
    return updated;
  }

  async setPlanEntitlement(
    planId: string,
    input: UpsertPlanEntitlementInput,
    actorId: string,
  ) {
    await this.getPlan(planId);

    const feature = await this.prisma.feature.findUnique({ where: { code: input.featureCode } });
    if (!feature) {
      throw billingError.badRequest(
        BillingErrorCode.FEATURE_NOT_FOUND,
        `La cle d entitlement ${input.featureCode} n est pas declaree dans le referentiel Feature.`,
      );
    }
    if (input.kind === EntitlementKind.QUOTA && !input.meterKey) {
      throw billingError.badRequest(
        BillingErrorCode.BILLING_CONFIGURATION_INVALID,
        `Un entitlement de type QUOTA doit referencer un meterKey (CDC 21).`,
      );
    }
    if (input.meterKey) {
      const meter = await this.prisma.meter.findUnique({ where: { key: input.meterKey } });
      if (!meter) {
        throw billingError.badRequest(
          BillingErrorCode.METER_NOT_FOUND,
          `Le meter ${input.meterKey} n existe pas.`,
        );
      }
    }

    const data = {
      kind: input.kind,
      valueType: this.valueTypeFor(input),
      enabled: input.enabled ?? true,
      integerValue: input.integerValue ?? null,
      decimalValue:
        input.decimalValue === undefined || input.decimalValue === null
          ? null
          : new Prisma.Decimal(String(input.decimalValue)),
      stringValue: input.stringValue ?? null,
      jsonValue: input.jsonValue ? this.json(input.jsonValue) : undefined,
      unit: input.unit ?? null,
      enforcement: input.enforcement ?? EnforcementPolicy.SOFT_LIMIT,
      meterKey: input.meterKey ?? null,
      metadata: input.metadata ? this.json(input.metadata) : undefined,
    };

    const before = await this.prisma.planEntitlement.findUnique({
      where: { planId_featureCode: { planId, featureCode: input.featureCode } },
    });

    const entitlement = await this.prisma.planEntitlement.upsert({
      where: { planId_featureCode: { planId, featureCode: input.featureCode } },
      create: { planId, featureCode: input.featureCode, ...data },
      update: data,
    });

    await this.audit.audit({
      actorId,
      tenantId: null,
      action: 'billing.plan.updated',
      targetType: 'PlanEntitlement',
      targetId: entitlement.id,
      before: before ?? undefined,
      after: {
        planId,
        featureCode: input.featureCode,
        kind: entitlement.kind,
        integerValue: entitlement.integerValue,
        enforcement: entitlement.enforcement,
      },
    });
    return entitlement;
  }

  async removePlanEntitlement(planId: string, featureCode: string, actorId: string) {
    const existing = await this.prisma.planEntitlement.findUnique({
      where: { planId_featureCode: { planId, featureCode } },
    });
    if (!existing) {
      throw billingError.notFound(
        BillingErrorCode.ENTITLEMENT_NOT_AVAILABLE,
        `Entitlement ${featureCode} absent du plan ${planId}.`,
      );
    }
    // CDC 44 (Admin Plan Builder) : retirer un entitlement d'un plan deja souscrit
    // changerait silencieusement le contrat. On refuse au-dela de DRAFT/DEPRECATED.
    const plan = await this.getPlan(planId);
    const activeSubscriptions = await this.prisma.subscription.count({
      where: { planId, status: { in: ['TRIALING', 'ACTIVE', 'PAST_DUE', 'GRACE_PERIOD'] } },
    });
    if (activeSubscriptions > 0 && plan.status === PlanStatus.ACTIVE) {
      throw billingError.conflict(
        BillingErrorCode.PLAN_INVALID_STATE,
        `Le plan ${plan.code} est souscrit par ${activeSubscriptions} abonnement(s) actif(s). Deprecatez le plan puis creez une nouvelle version plutot que de retirer un droit en cours (CDC 44).`,
      );
    }

    await this.prisma.planEntitlement.delete({ where: { id: existing.id } });
    await this.audit.audit({
      actorId,
      tenantId: null,
      action: 'billing.plan.updated',
      targetType: 'PlanEntitlement',
      targetId: existing.id,
      reason: 'Entitlement retire du plan',
      before: { planId, featureCode },
    });
    return { removed: true };
  }

  // -----------------------------------------------------------------------------------------
  // Prices (CDC 9 / 45 / 95)
  // -----------------------------------------------------------------------------------------

  listPrices(params?: ListPricesParams) {
    const take = Math.min(params?.limit ?? 50, 200);
    const skip = params?.page ? (params.page - 1) * take : 0;
    return this.prisma.price.findMany({
      where: {
        ...(params?.planId ? { planId: params.planId } : {}),
        ...(params?.currency ? { currency: params.currency } : {}),
        ...(params?.status ? { status: params.status } : {}),
      },
      orderBy: [{ planId: 'asc' }, { effectiveFrom: 'desc' }],
      skip,
      take,
    });
  }

  async getPrice(id: string) {
    const price = await this.prisma.price.findUnique({ where: { id } });
    if (!price) {
      throw billingError.notFound(BillingErrorCode.PRICE_NOT_FOUND, `Prix ${id} introuvable.`);
    }
    return price;
  }

  /**
   * Creer un prix = publier une NOUVELLE VERSION. Un prix historique n'est
   * jamais ecrase (CDC 45/95, RG-BILL-008).
   */
  async createPrice(
    body: CreatePriceInput,
    actorId: string,
  ) {
    const plan = await this.getPlan(body.planId);

    let currency: CurrencyCode;
    try {
      currency = assertCurrency(String(body.currency).toUpperCase());
    } catch (error) {
      throw billingError.badRequest(
        BillingErrorCode.CURRENCY_NOT_SUPPORTED,
        error instanceof Error ? error.message : 'Devise invalide.',
      );
    }

    let minorUnits: number;
    try {
      minorUnits = parseAmountToMinorUnits(body.amount, currency);
    } catch (error) {
      throw billingError.badRequest(
        BillingErrorCode.AMOUNT_INVALID,
        error instanceof Error ? error.message : 'Montant invalide.',
      );
    }
    if (minorUnits < 0) {
      throw billingError.badRequest(
        BillingErrorCode.AMOUNT_INVALID,
        'Un prix ne peut pas etre negatif.',
      );
    }

    if (body.pricingModel && body.pricingModel !== PricingModel.FLAT) {
      throw billingError.badRequest(
        BillingErrorCode.BILLING_CONFIGURATION_INVALID,
        `Le modele ${body.pricingModel} n est pas disponible en MVP (CDC 118).`,
      );
    }

    const effectiveFrom = body.effectiveFrom ? new Date(body.effectiveFrom) : new Date();
    if (Number.isNaN(effectiveFrom.getTime())) {
      throw billingError.badRequest(
        BillingErrorCode.BILLING_CONFIGURATION_INVALID,
        'effectiveFrom invalide.',
      );
    }

    // L'ancien prix actif bascule INACTIVE et sa fenetre se ferme : il reste
    // referencable par les factures et abonnements existants.
    const previous = await this.prisma.price.findMany({
      where: {
        planId: body.planId,
        currency,
        interval: body.interval,
        status: PriceStatus.ACTIVE,
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    const price = await this.prisma.$transaction(async (tx) => {
      for (const old of previous) {
        await tx.price.update({
          where: { id: old.id },
          data: {
            status: PriceStatus.INACTIVE,
            effectiveUntil: effectiveFrom,
          },
        });
      }

      return tx.price.create({
        data: {
          planId: body.planId,
          currency,
          amount: new Prisma.Decimal(Money.ofMinorUnits(minorUnits, currency).toDecimalString()),
          interval: body.interval,
          intervalCount: body.intervalCount ?? 1,
          pricingModel: body.pricingModel ?? PricingModel.FLAT,
          effectiveFrom,
          effectiveUntil: body.effectiveUntil ? new Date(body.effectiveUntil) : null,
          status: PriceStatus.ACTIVE,
          metadata: body.metadata ? this.json(body.metadata) : undefined,
          createdBy: actorId,
        },
      });
    });

    await this.audit.audit({
      actorId,
      tenantId: null,
      action: 'billing.price.created',
      targetType: 'Price',
      targetId: price.id,
      before: previous.length ? { deactivated: previous.map((p) => p.id) } : undefined,
      after: {
        planId: price.planId,
        currency: price.currency,
        amount: Money.ofMinorUnits(minorUnits, currency).toDecimalString(),
        interval: price.interval,
      },
    });

    if (previous.length > 0) {
      await this.audit.audit({
        actorId,
        tenantId: null,
        action: 'billing.price.deactivated',
        targetType: 'Plan',
        targetId: plan.id,
        reason: 'Ancienne version de prix conservee pour l historique financier',
        before: { priceIds: previous.map((p) => p.id) },
      });
    }

    return price;
  }

  async deactivatePrice(id: string, actorId: string) {
    const price = await this.getPrice(id);
    if (price.status !== PriceStatus.ACTIVE) {
      throw billingError.conflict(
        BillingErrorCode.PRICE_INVALID_STATE,
        `Le prix ${id} n est pas ACTIF (statut ${price.status}).`,
      );
    }
    const activeSubscriptions = await this.prisma.subscription.count({
      where: { priceId: id, status: { in: ['TRIALING', 'ACTIVE', 'PAST_DUE', 'GRACE_PERIOD'] } },
    });
    if (activeSubscriptions > 0) {
      throw billingError.conflict(
        BillingErrorCode.PRICE_INVALID_STATE,
        `Le prix ${id} est reference par ${activeSubscriptions} abonnement(s) actif(s) : il reste l historique contractuel et ne peut pas etre desactive (CDC 96).`,
      );
    }
    const updated = await this.prisma.price.update({
      where: { id },
      data: { status: PriceStatus.INACTIVE, effectiveUntil: new Date() },
    });
    await this.audit.audit({
      actorId,
      tenantId: null,
      action: 'billing.price.deactivated',
      targetType: 'Price',
      targetId: id,
      before: { status: price.status },
      after: { status: updated.status },
    });
    return updated;
  }

  /** Prix courant d'un plan pour un cycle et une devise (CDC 7/9). */
  async resolvePrice(planId: string, currency: string, interval?: BillingInterval, at = new Date()) {
    const prices = await this.prisma.price.findMany({
      where: {
        planId,
        currency: currency.toUpperCase(),
        status: PriceStatus.ACTIVE,
        effectiveFrom: { lte: at },
        ...(interval ? { interval } : {}),
      },
      orderBy: { effectiveFrom: 'desc' },
    });
    const effective = prices.find(
      (price) => !price.effectiveUntil || price.effectiveUntil > at,
    );
    if (!effective) {
      throw new BillingException(
        BillingErrorCode.PRICE_NOT_FOUND,
        `Aucun prix actif pour le plan ${planId} en ${currency.toUpperCase()}.`,
        HttpStatus.NOT_FOUND,
      );
    }
    return effective;
  }

  // -----------------------------------------------------------------------------------------
  // Features = referentiel des cles d entitlement (CDC 17)
  // -----------------------------------------------------------------------------------------

  listFeatures(params?: ListFeaturesParams) {
    return this.prisma.feature.findMany({
      where: {
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.kind ? { kind: params.kind } : {}),
        ...(params?.search
          ? {
              OR: [
                { code: { contains: params.search, mode: 'insensitive' } },
                { name: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { code: 'asc' },
    });
  }

  async getFeature(code: string) {
    const feature = await this.prisma.feature.findUnique({ where: { code } });
    if (!feature) {
      throw billingError.notFound(
        BillingErrorCode.FEATURE_NOT_FOUND,
        `Cle d entitlement ${code} non declaree.`,
      );
    }
    return feature;
  }

  async upsertFeature(
    body: UpsertFeatureInput,
    actorId: string,
  ) {
    if (body.meterKey) {
      const meter = await this.prisma.meter.findUnique({ where: { key: body.meterKey } });
      if (!meter) {
        throw billingError.badRequest(
          BillingErrorCode.METER_NOT_FOUND,
          `Le meter ${body.meterKey} n existe pas.`,
        );
      }
    }
    const data = {
      name: body.name,
      description: body.description ?? null,
      kind: body.kind ?? EntitlementKind.BOOLEAN,
      unit: body.unit ?? null,
      metered: body.metered ?? Boolean(body.meterKey),
      meterKey: body.meterKey ?? null,
      enforcement: body.enforcement ?? EnforcementPolicy.SOFT_LIMIT,
      quotaCode: body.quotaCode ?? null,
      metadata: body.metadata ? this.json(body.metadata) : undefined,
    };
    const before = await this.prisma.feature.findUnique({ where: { code: body.code } });
    const feature = await this.prisma.feature.upsert({
      where: { code: body.code },
      create: { code: body.code, ...data },
      update: data,
    });
    await this.audit.audit({
      actorId,
      tenantId: null,
      action: 'billing.plan.updated',
      targetType: 'Feature',
      targetId: feature.code,
      before: before ?? undefined,
      after: { code: feature.code, kind: feature.kind, meterKey: feature.meterKey },
    });
    return feature;
  }

  // -----------------------------------------------------------------------------------------

  amountOfMinorUnits(value: unknown, currency: CurrencyCode): number {
    return toMinorUnits(value, currency);
  }

  private valueTypeFor(input: UpsertPlanEntitlementInput): EntitlementValueType {
    if (input.integerValue !== undefined && input.integerValue !== null) {
      return EntitlementValueType.INTEGER;
    }
    if (input.decimalValue !== undefined && input.decimalValue !== null) {
      return EntitlementValueType.DECIMAL;
    }
    if (input.stringValue !== undefined && input.stringValue !== null) {
      return EntitlementValueType.STRING;
    }
    if (input.jsonValue !== undefined && input.jsonValue !== null) {
      return EntitlementValueType.JSON;
    }
    return EntitlementValueType.BOOLEAN;
  }

  private json(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}