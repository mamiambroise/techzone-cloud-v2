/**
 * Contrats d'entree du module Billing (CDC 15 V2).
 *
 * Ces types sont la source de verite unique des corps de requete : les
 * controleurs les importent (`import type`, exigence `isolatedModules` avec
 * `emitDecoratorMetadata`) et les services les reutilisent. Un controleur ne
 * peut donc jamais accepter une forme que la couche metier ne comprend pas.
 */

import type {
  AdjustmentType,
  BillingInterval,
  CancellationMode,
  EntitlementKind,
  EnforcementPolicy,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  PlanStatus,
  PriceStatus,
  PricingModel,
  SubscriptionStatus,
} from '../../generated/prisma/enums';
import type { CurrencyCode } from './common/money';

// -------------------------------------------------------------------------------------------
// Catalogue (CDC 7/8/9/14)
// -------------------------------------------------------------------------------------------

export interface ListProductsParams {
  status?: string;
  search?: string;
}

export interface CreateProductInput {
  key: string;
  name: string;
  description?: string;
  features?: unknown;
  metadata?: Record<string, unknown>;
}

export interface ListPlansParams {
  status?: PlanStatus;
  productId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreatePlanInput {
  code: string;
  name: string;
  description?: string;
  billingModel?: PricingModel;
  billingInterval?: BillingInterval;
  intervalCount?: number;
  trialDays?: number;
  productId?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdatePlanInput {
  name?: string;
  description?: string;
  billingInterval?: BillingInterval;
  intervalCount?: number;
  trialDays?: number | null;
  metadata?: Record<string, unknown>;
}

export interface UpsertPlanEntitlementInput {
  featureCode: string;
  kind: EntitlementKind;
  enabled?: boolean;
  integerValue?: number | null;
  decimalValue?: string | number | null;
  stringValue?: string | null;
  jsonValue?: unknown;
  unit?: string | null;
  enforcement?: EnforcementPolicy;
  meterKey?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ListPricesParams {
  planId?: string;
  currency?: string;
  status?: PriceStatus;
  page?: number;
  limit?: number;
}

export interface CreatePriceInput {
  planId: string;
  amount: string | number;
  currency: CurrencyCode | string;
  interval: BillingInterval;
  intervalCount?: number;
  pricingModel?: PricingModel;
  effectiveFrom?: string | Date;
  effectiveUntil?: string | Date;
  metadata?: Record<string, unknown>;
}

export interface ListFeaturesParams {
  status?: string;
  kind?: EntitlementKind;
  search?: string;
}

export interface UpsertFeatureInput {
  code: string;
  name: string;
  description?: string;
  kind?: EntitlementKind;
  unit?: string;
  metered?: boolean;
  meterKey?: string;
  enforcement?: EnforcementPolicy;
  quotaCode?: string;
  metadata?: Record<string, unknown>;
}

// -------------------------------------------------------------------------------------------
// Subscriptions et comptes de facturation (CDC 13/30/31/54-58)
// -------------------------------------------------------------------------------------------

export interface UpsertBillingAccountInput {
  id?: string;
  customerName: string;
  billingEmail: string;
  currency?: string;
  billingAddress?: unknown;
  taxInformation?: unknown;
  legalName?: string | null;
  billingContact?: string | null;
  taxIdentifier?: string | null;
  invoiceLanguage?: string;
  paymentTerms?: number | null;
  metadata?: Record<string, unknown>;
}

export interface ListSubscriptionsParams {
  status?: SubscriptionStatus;
  tenantId?: string;
  page?: number;
  limit?: number;
}

export interface CreateSubscriptionInput {
  tenantId: string;
  planId: string;
  priceId?: string;
  billingAccountId?: string;
  status?: SubscriptionStatus;
  startsAt?: string | Date;
  trialDays?: number;
  graceDays?: number | null;
  autoRenew?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CancelSubscriptionInput {
  mode: CancellationMode;
  reason?: string;
  at?: Date;
}

export interface ChangePlanInput {
  planId: string;
  priceId?: string;
  reason?: string;
  effectiveAt?: string;
}

export interface UpsertOverrideInput {
  featureCode: string;
  enabled?: boolean;
  integerValue?: number | null;
  decimalValue?: string | null;
  stringValue?: string | null;
  reason?: string;
  validFrom?: string;
  validUntil?: string;
}

export interface ActivateSubscriptionOptions {
  period?: { start: Date; end: Date };
  at?: Date;
}

// -------------------------------------------------------------------------------------------
// Factures et paiements (CDC 32-49)
// -------------------------------------------------------------------------------------------

export interface InvoiceLineInput {
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  currency: string;
  priceId?: string;
  sourceType?: string;
  sourceRef?: string;
  periodStart?: string | Date;
  periodEnd?: string | Date;
  metadata?: Record<string, unknown>;
}

export interface CreateInvoiceInput {
  tenantId: string;
  subscriptionId?: string;
  billingAccountId?: string;
  periodStart?: Date;
  periodEnd?: Date;
  dueDays?: number;
  lines: InvoiceLineInput[];
}

export interface ListInvoicesParams {
  tenantId?: string;
  status?: InvoiceStatus;
  page?: number;
  limit?: number;
}

export interface GenerateInvoiceOptions {
  period?: { start: Date; end: Date };
  dueDays?: number;
}

export interface AdjustInvoiceInput {
  type: AdjustmentType;
  amount: string | number;
  reason: string;
}

export interface ListPaymentsParams {
  tenantId?: string;
  status?: PaymentStatus;
  invoiceId?: string;
  page?: number;
  limit?: number;
}

export interface RecordManualPaymentInput {
  invoiceId: string;
  amount: string | number;
  currency?: string;
  method?: PaymentMethod;
  proofReference?: string;
  notes?: string;
  idempotencyKey?: string;
  validate?: boolean;
}

export interface MarkPaymentFailedInput {
  code?: string;
  message?: string;
}

export interface RefundPaymentInput {
  amount?: string | number;
  reason: string;
}