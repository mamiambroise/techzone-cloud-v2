import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Journalisation Billing.
 *
 * Deux flux distincts et volontairement non melanges :
 *  - AuditEvent  : qui a fait quoi, sur quelle ressource, avant/apres, pourquoi
 *                   (CDC 79). C'est la tracabilite des operations sensibles.
 *  - BillingEvent: ce que le moteur a produit (CDC 76), destine aux
 *                   consommateurs (Automation, notifications, reporting).
 */

export interface BillingAuditInput {
  actorId: string;
  tenantId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  result?: 'SUCCESS' | 'FAILURE' | 'DENIED';
  reason?: string | null;
  before?: unknown;
  after?: unknown;
  traceId?: string;
  metadata?: Record<string, unknown>;
}

export interface BillingEventInput {
  tenantId: string;
  eventType: string;
  subscriptionId?: string | null;
  invoiceId?: string | null;
  paymentId?: string | null;
  payload?: Record<string, unknown>;
  traceId?: string;
}

/**
 * Catalogue des evenements Billing (CDC 76). Un evenement n'est declare ici que
 * s'il a un consommateur justifie ; la liste est fermee pour eviter les
 * evenements redondants sans consommateur.
 */
export const BILLING_EVENTS = [
  'subscription.created',
  'subscription.activated',
  'subscription.trial_started',
  'subscription.trial_expired',
  'subscription.plan_changed',
  'subscription.past_due',
  'subscription.grace_started',
  'subscription.suspended',
  'subscription.reactivated',
  'subscription.cancelled',
  'subscription.ended',
  'invoice.created',
  'invoice.issued',
  'invoice.overdue',
  'invoice.paid',
  'invoice.voided',
  'payment.created',
  'payment.succeeded',
  'payment.failed',
  'payment.refunded',
  'usage.recorded',
  'quota.warning',
  'quota.exceeded',
] as const;

export type BillingEventType = (typeof BILLING_EVENTS)[number];

/** Actions auditees au minimum (CDC 79). */
export const BILLING_AUDIT_ACTIONS = [
  'billing.plan.created',
  'billing.plan.updated',
  'billing.plan.activated',
  'billing.plan.deprecated',
  'billing.plan.archived',
  'billing.price.created',
  'billing.price.deactivated',
  'billing.subscription.created',
  'billing.subscription.activated',
  'billing.subscription.plan_changed',
  'billing.subscription.suspended',
  'billing.subscription.reactivated',
  'billing.subscription.cancelled',
  'billing.subscription.renewed',
  'billing.subscription.override_upserted',
  'billing.subscription.override_removed',
  'billing.invoice.generated',
  'billing.invoice.issued',
  'billing.invoice.voided',
  'billing.invoice.adjusted',
  'billing.payment.recorded',
  'billing.payment.validated',
  'billing.payment.refunded',
  'billing.credit.granted',
  'billing.billing_account.updated',
  'billing.webhook.rejected',
  'billing.webhook.processed',
] as const;

@Injectable()
export class BillingAuditService {
  private readonly logger = new Logger(BillingAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * L'audit ne doit jamais faire echouer une operation metier deja reussie :
   * une perte de trace est signalee mais n'annule pas l'ecriture (meme choix que
   * `ui-builder.service.ts`).
   */
  async audit(input: BillingAuditInput): Promise<void> {
    try {
      await this.prisma.auditEvent.create({
        data: {
          traceId: input.traceId ?? randomUUID(),
          actorId: input.actorId,
          tenantId: input.tenantId,
          action: input.action,
          targetType: input.targetType,
          targetId: input.targetId,
          result: input.result ?? 'SUCCESS',
          reason: input.reason ?? null,
          before: this.toJson(input.before),
          after: this.toJson(input.after),
          metadata: this.toJson(input.metadata),
        },
      });
    } catch (error) {
      this.logger.warn(
        `Audit Billing non bloquant en echec: ${input.action} (${String(error)})`,
      );
    }
  }

  async emit(input: BillingEventInput): Promise<void> {
    if (!(BILLING_EVENTS as readonly string[]).includes(input.eventType)) {
      this.logger.warn(
        `Evenement Billing refuse (hors catalogue CDC 76): ${input.eventType}. Aucun evenement n est invente.`,
      );
      return;
    }
    try {
      await this.prisma.billingEvent.create({
        data: {
          traceId: input.traceId ?? randomUUID(),
          tenantId: input.tenantId,
          subscriptionId: input.subscriptionId ?? null,
          invoiceId: input.invoiceId ?? null,
          paymentId: input.paymentId ?? null,
          eventType: input.eventType,
          payload: this.toJson(input.payload),
        },
      });
    } catch (error) {
      this.logger.warn(
        `Evenement Billing non bloquant en echec: ${input.eventType} (${String(error)})`,
      );
    }
  }

  /** Prisma attend un objet JSON, jamais une chaine JSON.stringify. */
  private toJson(value: unknown): Prisma.InputJsonValue | undefined {
    if (value === undefined || value === null) return undefined;
    try {
      const parsed = JSON.parse(JSON.stringify(value)) as unknown;
      if (parsed === null || typeof parsed !== 'object') {
        return (parsed ?? {}) as Prisma.InputJsonValue;
      }
      return parsed as Prisma.InputJsonValue;
    } catch {
      return undefined;
    }
  }
}