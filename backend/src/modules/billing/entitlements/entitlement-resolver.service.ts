import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import {
  EntitlementKind,
  EnforcementPolicy,
  SubscriptionStatus,
} from '../../../generated/prisma/enums';
import { PrismaService } from '../../../prisma/prisma.service';
import { BillingErrorCode } from '../common/billing-error-code';
import { billingError } from '../common/billing.exception';
import { CurrencyCode } from '../common/money';
import { resolvePeriod } from '../common/billing-period';

/**
 * Effective Entitlement Resolver (CDC 60).
 *
 *   TENANT
 *   -> ACTIVE SUBSCRIPTION
 *   -> PLAN
 *   -> PRICE / CONTRACT
 *   -> BASE ENTITLEMENTS
 *   -> VALID OVERRIDES
 *   -> USAGE / LIMIT STATE
 *   -> EFFECTIVE ENTITLEMENTS
 *
 * Point cle : ce resolver est l'unique source de verite commerciale. Aucun
 * module ne recalcule ses propres droits, et aucun entitlement n'est jamais
 * transforme en permission IAM (RG-BILL-004).
 */

export const ACTIVE_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.TRIALING,
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.PAST_DUE,
  SubscriptionStatus.GRACE_PERIOD,
];

/** Une suspension retire les droits d'usage mais laisse le compte lisible. */
export const ENTITLED_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.TRIALING,
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.PAST_DUE,
  SubscriptionStatus.GRACE_PERIOD,
];

export type EntitlementSource = 'PLAN' | 'OVERRIDE';

export type EntitlementState = 'ACTIVE' | 'RESTRICTED' | 'SUSPENDED' | 'UNAVAILABLE';

export interface EffectiveEntitlement {
  key: string;
  kind: EntitlementKind;
  enabled: boolean;
  value: number | string | boolean | null;
  limit: number | null;
  used: number | null;
  remaining: number | null;
  unit: string | null;
  enforcement: EnforcementPolicy;
  source: EntitlementSource;
  validUntil: string | null;
  status: EntitlementState;
  reason: string | null;
}

export interface EffectiveEntitlements {
  tenantId: string;
  subscriptionId: string | null;
  planId: string | null;
  planCode: string | null;
  priceId: string | null;
  currency: CurrencyCode | null;
  subscriptionStatus: SubscriptionStatus | null;
  periodStart: string | null;
  periodEnd: string | null;
  trialEndsAt: string | null;
  state: EntitlementState;
  entitlements: EffectiveEntitlement[];
  resolvedAt: string;
}

interface CachedResolution {
  value: EffectiveEntitlements;
  expiresAt: number;
}

@Injectable()
export class EntitlementResolverService implements OnModuleDestroy {
  private readonly logger = new Logger(EntitlementResolverService.name);
  private readonly cache = new Map<string, CachedResolution>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * TTL court par defaut. Le cache est une acceleration, jamais une source de
   * verite : toute revocation passe par `invalidate` (CDC 61, RG-BILL-036).
   */
  private readonly ttlMs = Number(process.env.BILLING_ENTITLEMENT_CACHE_TTL_MS ?? 30_000);

  onModuleDestroy(): void {
    this.cache.clear();
  }

  invalidate(tenantId: string): void {
    const before = this.cache.size;
    for (const key of [...this.cache.keys()]) {
      if (key.startsWith(`${tenantId}::`)) this.cache.delete(key);
    }
    this.logger.debug?.(
      `Cache d'entitlements invalide pour ${tenantId} (${before - this.cache.size} entree(s)).`,
    );
  }

  invalidateAll(): void {
    this.cache.clear();
  }

  async resolve(tenantId: string, options?: { at?: Date; bypassCache?: boolean }): Promise<EffectiveEntitlements> {
    if (!tenantId) {
      throw billingError.badRequest(
        BillingErrorCode.TENANT_SCOPE_VIOLATION,
        'Un tenant est requis pour resoudre des entitlements.',
      );
    }
    const key = `${tenantId}::${options?.at?.toISOString() ?? 'now'}`;
    if (!options?.bypassCache) {
      const hit = this.cache.get(key);
      if (hit && hit.expiresAt > Date.now()) return hit.value;
      if (hit) this.cache.delete(key);
    }
    const value = await this.compute(tenantId, options?.at ?? new Date());
    this.cache.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    return value;
  }

  /**
   * Decision d'acces commerciale (CDC 5/19/62). Volontairement distincte de
   * l'autorisation IAM : un `true` ici ne dispense d'aucune permission.
   */
  async isEntitled(tenantId: string, key: string, options?: { at?: Date }): Promise<boolean> {
    const resolved = await this.resolve(tenantId, options);
    return resolved.entitlements.some(
      (entitlement) =>
        entitlement.key === key &&
        entitlement.enabled &&
        entitlement.status !== 'UNAVAILABLE' &&
        entitlement.status !== 'SUSPENDED',
    );
  }

  /** Verifie une limite avant ecriture. RG-BILL-015 : rien n est bloque sans policy. */
  async assertWithinLimit(
    tenantId: string,
    key: string,
    requested: number,
    options?: { at?: Date },
  ): Promise<EffectiveEntitlement> {
    const resolved = await this.resolve(tenantId, options);
    const entitlement = resolved.entitlements.find((item) => item.key === key);
    if (!entitlement) {
      throw billingError.forbidden(
        BillingErrorCode.ENTITLEMENT_NOT_AVAILABLE,
        `Le tenant nebeneficie pas commercialement de ${key}.`,
        { key },
      );
    }
    if (!entitlement.enabled || entitlement.status === 'UNAVAILABLE') {
      throw billingError.forbidden(
        BillingErrorCode.ENTITLEMENT_NOT_AVAILABLE,
        `L entitlement ${key} n est pas actif pour ce tenant.`,
        { key, status: entitlement.status },
      );
    }
    if (entitlement.limit === null) return entitlement;

    const used = entitlement.used ?? 0;
    if (used + requested <= entitlement.limit) return entitlement;

    const payload = {
      key,
      limit: entitlement.limit,
      used,
      requested,
      enforcement: entitlement.enforcement,
    };
    // NOTIFY_ONLY et SOFT_LIMIT n'interdisent jamais une ecriture : le depassement
    // est constate et journalise, pas bloque (RG-BILL-015).
    if (entitlement.enforcement === EnforcementPolicy.NOTIFY_ONLY || entitlement.enforcement === EnforcementPolicy.SOFT_LIMIT) {
      return entitlement;
    }
    if (entitlement.enforcement === EnforcementPolicy.OVERAGE) {
      return entitlement;
    }
    throw billingError.forbidden(
      BillingErrorCode.ENTITLEMENT_LIMIT_EXCEEDED,
      `Limite ${key} atteinte (${used}/${entitlement.limit}) et politique HARD_LIMIT.`,
      payload,
    );
  }

  // -----------------------------------------------------------------------------------------

  private async compute(tenantId: string, at: Date): Promise<EffectiveEntitlements> {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        tenantId,
        status: { in: ACTIVE_SUBSCRIPTION_STATUSES },
      },
      orderBy: [{ currentPeriodEnd: 'desc' }, { createdAt: 'desc' }],
      include: {
        plan: { include: { entitlements: true, prices: true } },
        price: true,
        billingAccount: true,
        entitlementOverrides: true,
      },
    });

    if (!subscription) {
      return {
        tenantId,
        subscriptionId: null,
        planId: null,
        planCode: null,
        priceId: null,
        currency: null,
        subscriptionStatus: null,
        periodStart: null,
        periodEnd: null,
        trialEndsAt: null,
        state: 'UNAVAILABLE',
        entitlements: [],
        resolvedAt: at.toISOString(),
      };
    }

    const suspended = subscription.status === SubscriptionStatus.SUSPENDED
      || subscription.status === SubscriptionStatus.CANCELLED
      || subscription.status === SubscriptionStatus.EXPIRED
      || subscription.status === SubscriptionStatus.ENDED;

    const currency = (subscription.billingAccount?.currency
      ?? subscription.price?.currency
      ?? 'MGA') as CurrencyCode;

    const period = resolvePeriod(
      subscription.currentPeriodStart && subscription.currentPeriodEnd
        ? { start: subscription.currentPeriodStart, end: subscription.currentPeriodEnd }
        : null,
      at,
      subscription.price?.interval ?? subscription.plan.billingInterval,
      subscription.price?.intervalCount ?? subscription.plan.intervalCount,
    );

    const overrides = new Map(
      subscription.entitlementOverrides
        .filter((override) => this.isOverrideValid(override.validFrom, override.validUntil, at))
        .map((override) => [override.featureCode, override]),
    );

    const entitlements: EffectiveEntitlement[] = [];
    const seen = new Set<string>();

    for (const base of subscription.plan.entitlements) {
      seen.add(base.featureCode);
      const override = overrides.get(base.featureCode);
      const source: EntitlementSource = override ? 'OVERRIDE' : 'PLAN';

      // Le `kind`, l'`unit`, la politique d'enforcement et le meter sont des
      // proprietes du PLAN : un override commercial ne les redonne pas, il ne
      // fait que surcharger la valeur et la validite.
      const kind = base.kind;
      const unit = base.unit;
      const enforcement = base.enforcement;
      const meterKey = base.meterKey;

      const numericValue = this.numericValueOf(
        override?.integerValue ?? base.integerValue,
        override?.decimalValue ?? base.decimalValue,
      );
      const enabled = override ? (override.enabled ?? base.enabled) : base.enabled;

      const isLimitLike = kind === EntitlementKind.LIMIT || kind === EntitlementKind.QUOTA;

      let used: number | null = null;
      let limit: number | null = null;
      let remaining: number | null = null;
      let status: EntitlementState = suspended ? 'SUSPENDED' : 'ACTIVE';

      if (isLimitLike) {
        const quota = await this.prisma.quotaUsage.findFirst({
          where: {
            subscriptionId: subscription.id,
            featureCode: base.featureCode,
            periodStart: period.start,
            periodEnd: period.end,
          },
        });
        const aggregate = kind === EntitlementKind.QUOTA && meterKey
          ? await this.prisma.usageAggregate.findFirst({
              where: {
                tenantId,
                meterKey,
                periodStart: period.start,
                periodEnd: period.end,
              },
            })
          : null;
        const rawUsed = aggregate?.value ?? quota?.usedValue;
        // Une quantite consommee (requetes, executions, Go) n'est PAS une
        // valeur monetaire : elle se lit comme un nombre brut, jamais via une
        // conversion en unites mineures.
        used = this.quantityOf(rawUsed);
        limit = numericValue;
        remaining = limit === null ? null : Math.max(0, limit - used);
        if (limit !== null && used > limit) status = suspended ? 'SUSPENDED' : 'RESTRICTED';
      }

      if (!enabled && status === 'ACTIVE') status = 'RESTRICTED';

      entitlements.push({
        key: base.featureCode,
        kind,
        enabled,
        value: override ? this.valueOf(override) : this.valueOf(base),
        limit,
        used,
        remaining,
        unit,
        enforcement,
        source,
        validUntil: override?.validUntil ? override.validUntil.toISOString() : null,
        status,
        reason: this.reasonFor(enabled, status, suspended),
      });
    }

    // Un override peut ajouter un droit absent du plan (contrat negocié).
    for (const [featureCode, override] of overrides) {
      if (seen.has(featureCode)) continue;
      entitlements.push({
        key: featureCode,
        kind: EntitlementKind.BOOLEAN,
        enabled: override.enabled ?? true,
        value: this.valueOf(override),
        limit: override.integerValue ?? null,
        used: null,
        remaining: null,
        unit: null,
        enforcement: EnforcementPolicy.SOFT_LIMIT,
        source: 'OVERRIDE',
        validUntil: override.validUntil ? override.validUntil.toISOString() : null,
        status: suspended ? 'SUSPENDED' : 'ACTIVE',
        reason: suspended ? 'SUBSCRIPTION_SUSPENDED' : 'OVERRIDE_ONLY',
      });
    }

    return {
      tenantId,
      subscriptionId: subscription.id,
      planId: subscription.planId,
      planCode: subscription.plan.code,
      priceId: subscription.priceId,
      currency,
      subscriptionStatus: subscription.status,
      periodStart: period.start.toISOString(),
      periodEnd: period.end.toISOString(),
      trialEndsAt: subscription.trialEndsAt ? subscription.trialEndsAt.toISOString() : null,
      state: suspended ? 'SUSPENDED' : 'ACTIVE',
      entitlements,
      resolvedAt: at.toISOString(),
    };
  }

  private isOverrideValid(
    validFrom: Date | null,
    validUntil: Date | null,
    at: Date,
  ): boolean {
    if (validFrom && validFrom > at) return false;
    if (validUntil && validUntil <= at) return false;
    return true;
  }

  private reasonFor(enabled: boolean, status: EntitlementState, suspended: boolean): string | null {
    if (suspended) return 'SUBSCRIPTION_NOT_ACTIVE';
    if (!enabled) return 'ENTITLEMENT_DISABLED';
    if (status === 'RESTRICTED') return 'LIMIT_REACHED_OR_DISABLED';
    return null;
  }

  private quantityOf(raw: unknown): number {
    if (raw === null || raw === undefined) return 0;
    const numeric = Number(String(raw));
    return Number.isFinite(numeric) ? numeric : 0;
  }

  private numericValueOf(
    integerValue: number | null | undefined,
    decimalValue: unknown,
  ): number | null {
    if (integerValue !== null && integerValue !== undefined) return integerValue;
    if (decimalValue === null || decimalValue === undefined) return null;
    // Une limite en octets/requetes n'est pas une valeur monetaire : on la lit
    // comme un nombre brut plutot que comme un montant.
    const numeric = Number(String(decimalValue));
    return Number.isFinite(numeric) ? numeric : null;
  }

  private valueOf(winner: {
    integerValue: number | null;
    decimalValue: unknown;
    stringValue: string | null;
    jsonValue: unknown;
    enabled: boolean | null;
  }): number | string | boolean | null {
    if (winner.integerValue !== null) return winner.integerValue;
    if (winner.decimalValue !== null) return Number(String(winner.decimalValue));
    if (winner.stringValue !== null) return winner.stringValue;
    if (winner.jsonValue !== null && winner.jsonValue !== undefined) return JSON.stringify(winner.jsonValue);
    return winner.enabled ?? null;
  }
}