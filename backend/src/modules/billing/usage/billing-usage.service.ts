import { Injectable, Logger } from '@nestjs/common';
import {
  EntitlementKind,
  EnforcementPolicy,
  MeterAggregation,
  MeterPeriod,
  SubscriptionStatus,
} from '../../../generated/prisma/enums';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { BillingErrorCode } from '../common/billing-error-code';
import { billingError } from '../common/billing.exception';
import { BillingAuditService } from '../common/billing-audit.service';
import { addDays, addMonths, startOfUtcDay } from '../common/billing-period';
import { EntitlementResolverService } from '../entitlements/entitlement-resolver.service';

/**
 * Metering (CDC 22/23/24/26/27).
 *
 *   SOURCE MODULE -> USAGE EVENT -> VALIDATION -> DEDUPLICATION -> METER
 *   -> AGGREGATION -> USAGE SUMMARY -> BILLING / QUOTA CHECK
 *
 * Deux garanties non negociables :
 *  - RG-BILL-011/012 : le meme `eventId` ne produit le meme effet qu'une fois ;
 *  - CDC 25 : Billing n'invente pas la donnee metier d'un autre module, il ne
 *    fait qu'agreger les evenements que ce module emet.
 */

export interface RecordUsageEventInput {
  eventId: string;
  tenantId: string;
  meterKey: string;
  quantity: string | number;
  occurredAt?: string | Date;
  source: string;
  resourceId?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface RecordUsageResult {
  eventId: string;
  accepted: boolean;
  duplicate: boolean;
  aggregate: { value: string; periodStart: string; periodEnd: string } | null;
  quota: {
    featureCode: string;
    used: number;
    limit: number | null;
    remaining: number | null;
    enforcement: EnforcementPolicy;
    exceeded: boolean;
    status: 'OK' | 'WARNING' | 'EXCEEDED';
  } | null;
}

/** Seuils de near-limit. Ce sont des POLITIQUES configurables, pas des valeurs codees en dur. */
export const DEFAULT_WARNING_THRESHOLDS = [0.5, 0.75, 0.9, 1];

@Injectable()
export class BillingUsageService {
  private readonly logger = new Logger(BillingUsageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: BillingAuditService,
    private readonly entitlements: EntitlementResolverService,
  ) {}

  // -----------------------------------------------------------------------------------------
  // Meters (CDC 24) — PLATFORM GLOBAL
  // -----------------------------------------------------------------------------------------

  listMeters(params?: { status?: string; entitlementCode?: string }) {
    return this.prisma.meter.findMany({
      where: {
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.entitlementCode ? { entitlementCode: params.entitlementCode } : {}),
      },
      orderBy: { key: 'asc' },
    });
  }

  async upsertMeter(
    body: {
      key: string;
      name: string;
      unit: string;
      aggregation?: MeterAggregation;
      period?: MeterPeriod;
      entitlementCode?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    if (body.entitlementCode) {
      const feature = await this.prisma.feature.findUnique({
        where: { code: body.entitlementCode },
      });
      if (!feature) {
        throw billingError.badRequest(
          BillingErrorCode.FEATURE_NOT_FOUND,
          `Cle d entitlement ${body.entitlementCode} non declaree.`,
        );
      }
    }
    const data = {
      name: body.name,
      unit: body.unit,
      aggregation: body.aggregation ?? MeterAggregation.SUM,
      period: body.period ?? MeterPeriod.BILLING_PERIOD,
      entitlementCode: body.entitlementCode ?? null,
      description: body.description ?? null,
      metadata: body.metadata
        ? (JSON.parse(JSON.stringify(body.metadata)) as Prisma.InputJsonValue)
        : undefined,
    };
    return this.prisma.meter.upsert({
      where: { key: body.key },
      create: { key: body.key, ...data },
      update: data,
    });
  }

  async getMeter(key: string) {
    const meter = await this.prisma.meter.findUnique({ where: { key } });
    if (!meter) {
      throw billingError.notFound(BillingErrorCode.METER_NOT_FOUND, `Meter ${key} introuvable.`);
    }
    return meter;
  }

  // -----------------------------------------------------------------------------------------
  // Enregistrement d'evenement (CDC 23)
  // -----------------------------------------------------------------------------------------

  async record(input: RecordUsageEventInput): Promise<RecordUsageResult> {
    if (!input.eventId || input.eventId.trim().length === 0) {
      throw billingError.badRequest(
        BillingErrorCode.USAGE_EVENT_INVALID,
        'eventId est requis : il porte l idempotence (CDC 26).',
      );
    }
    if (!input.source || input.source.trim().length === 0) {
      throw billingError.badRequest(
        BillingErrorCode.USAGE_EVENT_INVALID,
        'source est requis (CDC 25 : le module emetteur reste proprietaire de sa donnee).',
      );
    }

    const meter = await this.getMeter(input.meterKey);
    if (meter.status !== 'ACTIVE') {
      throw billingError.conflict(
        BillingErrorCode.USAGE_EVENT_INVALID,
        `Le meter ${input.meterKey} n est pas actif.`,
      );
    }

    const quantity = Number(String(input.quantity));
    if (!Number.isFinite(quantity) || quantity < 0) {
      throw billingError.badRequest(
        BillingErrorCode.USAGE_EVENT_INVALID,
        `Quantite invalide : ${String(input.quantity)}.`,
      );
    }

    const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
    if (Number.isNaN(occurredAt.getTime())) {
      throw billingError.badRequest(
        BillingErrorCode.USAGE_EVENT_INVALID,
        'occurredAt invalide.',
      );
    }

    // RG-BILL-011/012 : deduplication par eventId avant tout effet de facturation.
    const alreadyRecorded = await this.prisma.usageEvent.findUnique({
      where: { eventId: input.eventId },
    });
    if (alreadyRecorded) {
      if (alreadyRecorded.tenantId !== input.tenantId) {
        // Un eventId identique sur un autre tenant est une collision : on ne
        // divulgue pas l'existence de l'evenement d'un autre tenant.
        throw billingError.conflict(
          BillingErrorCode.USAGE_EVENT_DUPLICATE,
          'Cet eventId est deja utilise.',
          { eventId: input.eventId },
        );
      }
      const aggregate = await this.prisma.usageAggregate.findFirst({
        where: { tenantId: input.tenantId, meterKey: input.meterKey },
        orderBy: { periodStart: 'desc' },
      });
      return {
        eventId: input.eventId,
        accepted: false,
        duplicate: true,
        aggregate: aggregate
          ? {
              value: aggregate.value.toString(),
              periodStart: aggregate.periodStart.toISOString(),
              periodEnd: aggregate.periodEnd.toISOString(),
            }
          : null,
        quota: null,
      };
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { id: input.tenantId } });
    if (!tenant) {
      throw billingError.notFound(
        BillingErrorCode.TENANT_SCOPE_VIOLATION,
        `Tenant ${input.tenantId} introuvable.`,
      );
    }

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        tenantId: input.tenantId,
        status: {
          in: [
            SubscriptionStatus.TRIALING,
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.PAST_DUE,
            SubscriptionStatus.GRACE_PERIOD,
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const period = this.periodFor(meter.period, subscription, occurredAt);

    // La limite est verifiee AVANT l'enregistrement : on ne compte pas une
    // consommation refusee par une politique HARD_LIMIT.
    const quota = await this.checkQuota(input.tenantId, meter, quantity);

    try {
      await this.prisma.usageEvent.create({
        data: {
          eventId: input.eventId,
          tenantId: input.tenantId,
          subscriptionId: subscription?.id ?? null,
          meterKey: input.meterKey,
          quantity: new Prisma.Decimal(quantity),
          unit: meter.unit,
          occurredAt,
          source: input.source,
          resourceId: input.resourceId ?? null,
          correlationId: input.correlationId ?? null,
          metadata: input.metadata
            ? (JSON.parse(JSON.stringify(input.metadata)) as Prisma.InputJsonValue)
            : undefined,
        },
      });
    } catch (error) {
      // Course concurrente sur le meme eventId : la contrainte unique tranche,
      // l'evenement n'est compte qu'une fois.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return {
          eventId: input.eventId,
          accepted: false,
          duplicate: true,
          aggregate: null,
          quota: null,
        };
      }
      throw error;
    }

    const aggregate = await this.applyAggregation(meter.aggregation, {
      tenantId: input.tenantId,
      subscriptionId: subscription?.id ?? null,
      meterKey: input.meterKey,
      quantity,
      period,
    });

    if (subscription) {
      await this.syncQuotaUsage(subscription.id, meter, quantity, period);
    }

    if (quota) {
      await this.audit.emit({
        tenantId: input.tenantId,
        eventType: 'usage.recorded',
        subscriptionId: subscription?.id ?? null,
        payload: {
          eventId: input.eventId,
          meterKey: input.meterKey,
          quantity,
          unit: meter.unit,
          source: input.source,
        },
      });
      if (quota.status === 'WARNING') {
        await this.audit.emit({
          tenantId: input.tenantId,
          eventType: 'quota.warning',
          subscriptionId: subscription?.id ?? null,
          payload: { featureCode: quota.featureCode, used: quota.used, limit: quota.limit },
        });
      }
      if (quota.status === 'EXCEEDED') {
        await this.audit.emit({
          tenantId: input.tenantId,
          eventType: 'quota.exceeded',
          subscriptionId: subscription?.id ?? null,
          payload: { featureCode: quota.featureCode, used: quota.used, limit: quota.limit },
        });
      }
    }

    return {
      eventId: input.eventId,
      accepted: true,
      duplicate: false,
      aggregate: {
        value: aggregate.toString(),
        periodStart: period.start.toISOString(),
        periodEnd: period.end.toISOString(),
      },
      quota,
    };
  }

  // -----------------------------------------------------------------------------------------
  // Lecture (CDC 27/91)
  // -----------------------------------------------------------------------------------------

  async summary(tenantId: string, at = new Date()) {
    const resolved = await this.entitlements.resolve(tenantId, { at, bypassCache: true });
    const [aggregates, quotaUsages] = await Promise.all([
      this.prisma.usageAggregate.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.quotaUsage.findMany({
        where: { subscriptionId: resolved.subscriptionId ?? '__none__' },
      }),
    ]);

    const quotaByFeature = new Map(quotaUsages.map((usage) => [usage.featureCode, usage]));

    const metrics = aggregates.map((aggregate) => {
      const quota = quotaByFeature.get(aggregate.meterKey);
      const used = Number(aggregate.value.toString());
      const limit = quota?.limitValue ? Number(quota.limitValue.toString()) : null;
      return {
        meterKey: aggregate.meterKey,
        used,
        included: limit,
        remaining: limit === null ? null : Math.max(0, limit - used),
        unit: quota?.unit ?? null,
        periodStart: aggregate.periodStart.toISOString(),
        periodEnd: aggregate.periodEnd.toISOString(),
        status: limit === null ? 'UNLIMITED' : used >= limit ? 'EXCEEDED' : this.nearLimit(used, limit),
      };
    });

    return {
      tenantId,
      subscriptionId: resolved.subscriptionId,
      periodStart: resolved.periodStart,
      periodEnd: resolved.periodEnd,
      metrics,
    };
  }

  async listEvents(tenantId: string, params?: { meterKey?: string; page?: number; limit?: number }) {
    const take = Math.min(params?.limit ?? 50, 200);
    const skip = params?.page ? (params.page - 1) * take : 0;
    return this.prisma.usageEvent.findMany({
      where: { tenantId, ...(params?.meterKey ? { meterKey: params.meterKey } : {}) },
      orderBy: { occurredAt: 'desc' },
      skip,
      take,
    });
  }

  async listEventsAll(params?: { tenantId?: string; meterKey?: string; page?: number; limit?: number }) {
    const take = Math.min(params?.limit ?? 50, 200);
    const skip = params?.page ? (params.page - 1) * take : 0;
    return this.prisma.usageEvent.findMany({
      where: {
        ...(params?.tenantId ? { tenantId: params.tenantId } : {}),
        ...(params?.meterKey ? { meterKey: params.meterKey } : {}),
      },
      orderBy: { occurredAt: 'desc' },
      skip,
      take,
    });
  }

  // -----------------------------------------------------------------------------------------

  private periodFor(
    period: MeterPeriod,
    subscription: { currentPeriodStart: Date | null; currentPeriodEnd: Date | null } | null,
    at: Date,
  ) {
    if (period === MeterPeriod.BILLING_PERIOD && subscription?.currentPeriodStart && subscription?.currentPeriodEnd) {
      return { start: subscription.currentPeriodStart, end: subscription.currentPeriodEnd };
    }
    if (period === MeterPeriod.MONTH) {
      const start = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), 1));
      return { start, end: startOfUtcDay(addMonths(start, 1)) };
    }
    if (period === MeterPeriod.DAY) {
      const start = startOfUtcDay(at);
      return { start, end: startOfUtcDay(addDays(start, 1)) };
    }
    if (period === MeterPeriod.YEAR) {
      const start = new Date(Date.UTC(at.getUTCFullYear(), 0, 1));
      return { start, end: new Date(Date.UTC(at.getUTCFullYear() + 1, 0, 1)) };
    }
    throw billingError.badRequest(
      BillingErrorCode.BILLING_CONFIGURATION_INVALID,
      `Periode de meter ${period} non resolue sans abonnement actif.`,
    );
  }

  private async applyAggregation(
    aggregation: MeterAggregation,
    input: {
      tenantId: string;
      subscriptionId: string | null;
      meterKey: string;
      quantity: number;
      period: { start: Date; end: Date };
    },
  ): Promise<Prisma.Decimal> {
    const key = {
      tenantId_meterKey_periodStart_periodEnd: {
        tenantId: input.tenantId,
        meterKey: input.meterKey,
        periodStart: input.period.start,
        periodEnd: input.period.end,
      },
    };
    const current = await this.prisma.usageAggregate.findUnique({ where: key });

    let next: Prisma.Decimal;
    switch (aggregation) {
      case MeterAggregation.SUM:
      case MeterAggregation.COUNT:
        next = new Prisma.Decimal(current?.value ?? 0).plus(input.quantity);
        break;
      case MeterAggregation.MAX:
        next = new Prisma.Decimal(Math.max(Number(current?.value ?? 0), input.quantity));
        break;
      case MeterAggregation.LAST:
        next = new Prisma.Decimal(input.quantity);
        break;
      default:
        next = new Prisma.Decimal(current?.value ?? 0).plus(input.quantity);
    }

    await this.prisma.usageAggregate.upsert({
      where: key,
      create: {
        tenantId: input.tenantId,
        subscriptionId: input.subscriptionId,
        meterKey: input.meterKey,
        periodStart: input.period.start,
        periodEnd: input.period.end,
        value: next,
      },
      update: { value: next, subscriptionId: input.subscriptionId },
    });
    return next;
  }

  private async checkQuota(
    tenantId: string,
    meter: { key: string; entitlementCode: string | null; unit: string },
    requested: number,
  ): Promise<RecordUsageResult['quota']> {
    if (!meter.entitlementCode) return null;
    const resolved = await this.entitlements.resolve(tenantId, { bypassCache: true });
    const entitlement = resolved.entitlements.find(
      (item) => item.key === meter.entitlementCode,
    );
    if (!entitlement || entitlement.kind !== EntitlementKind.QUOTA) return null;

    const limit = entitlement.limit;
    const used = entitlement.used ?? 0;
    const next = used + requested;
    const remaining = limit === null ? null : Math.max(0, limit - next);

    if (limit === null) {
      return {
        featureCode: meter.entitlementCode,
        used: next,
        limit: null,
        remaining: null,
        enforcement: entitlement.enforcement,
        exceeded: false,
        status: 'OK',
      };
    }

    const exceeded = next > limit;
    return {
      featureCode: meter.entitlementCode,
      used: next,
      limit,
      remaining,
      enforcement: entitlement.enforcement,
      exceeded,
      status: exceeded ? 'EXCEEDED' : this.nearLimit(next, limit),
    };
  }

  private async syncQuotaUsage(
    subscriptionId: string,
    meter: { key: string; entitlementCode: string | null; unit: string },
    quantity: number,
    period: { start: Date; end: Date },
  ) {
    if (!meter.entitlementCode) return;
    const entitlement = await this.prisma.planEntitlement.findFirst({
      where: {
        plan: { subscriptions: { some: { id: subscriptionId } } },
        featureCode: meter.entitlementCode,
      },
    });
    if (!entitlement) return;

    const limitValue =
      entitlement.integerValue ??
      (entitlement.decimalValue ? Number(entitlement.decimalValue.toString()) : null);

    const existing = await this.prisma.quotaUsage.findUnique({
      where: {
        subscriptionId_featureCode_periodStart_periodEnd: {
          subscriptionId,
          featureCode: meter.entitlementCode,
          periodStart: period.start,
          periodEnd: period.end,
        },
      },
    });

    const used = new Prisma.Decimal(existing?.usedValue ?? 0).plus(quantity);
    const data = {
      usedValue: used,
      limitValue: limitValue === null ? null : new Prisma.Decimal(limitValue),
      unit: meter.unit,
      enforcement: entitlement.enforcement,
      updatedAt: new Date(),
    };

    if (existing) {
      await this.prisma.quotaUsage.update({ where: { id: existing.id }, data });
      return;
    }
    await this.prisma.quotaUsage.create({
      data: {
        subscriptionId,
        featureCode: meter.entitlementCode,
        periodStart: period.start,
        periodEnd: period.end,
        ...data,
      },
    });
  }

  private nearLimit(used: number, limit: number): 'OK' | 'WARNING' {
    if (limit <= 0) return 'WARNING';
    const thresholds =
      (process.env.BILLING_QUOTA_WARNING_THRESHOLDS ?? DEFAULT_WARNING_THRESHOLDS.join(','))
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value));
    const ratio = used / limit;
    return thresholds.some((threshold) => ratio >= threshold) ? 'WARNING' : 'OK';
  }
}