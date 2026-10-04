-- ==================================================================================================================
-- CDC 15 — SUBSCRIPTION & BILLING
--
-- `prisma db push` estcurrently bloque par une derive PREEXISTANTE hors perimetre
-- Billing : les colonnes `tenant.id`, `membership.tenantId` et `erp_registry.tenantId`
-- sont `text` en base alors que le schema les declare `@db.Uuid`. Supprimer ces
-- colonnes detruirait des donnees vivantes, donc cette migration est appliquee
-- manuellement et de maniere CIBLEE sur le seul perimetre Billing.
--
-- Toutes les tables billing sont vides avant migration :
--   plan, plan_entitlement, subscription, subscription_entitlement_override,
--   quota_usage, invoice, invoice_item, payment, billing_event, feature => 0 lignes
-- Les renommages de labels d'enum sont donc sans perte.
--
-- Les identifiants billing restent `text` comme le reste de la famille en base
-- (contrainte de cle etrangere vers `tenant.id text`).
-- ==================================================================================================================

-- ---------------------------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------------------------

ALTER TYPE "PlanStatus" RENAME VALUE 'DISABLED' TO 'DEPRECATED';
ALTER TYPE "PlanStatus" ADD VALUE IF NOT EXISTS 'DEPRECATED';

-- CDC 14 : pas deux etats de meme signification (TRIAL -> TRIALING).
ALTER TYPE "SubscriptionStatus" RENAME VALUE 'TRIAL' TO 'TRIALING';
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'GRACE_PERIOD';
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'ENDED';

ALTER TYPE "BillingInterval" RENAME VALUE 'SEMESTER' TO 'SEMI_ANNUAL';
ALTER TYPE "BillingInterval" RENAME VALUE 'YEARLY' TO 'ANNUAL';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PricingModel') THEN
    CREATE TYPE "PricingModel" AS ENUM ('FLAT','PER_SEAT','TIERED','USAGE_BASED','HYBRID','CUSTOM');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PriceStatus') THEN
    CREATE TYPE "PriceStatus" AS ENUM ('DRAFT','ACTIVE','INACTIVE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EntitlementKind') THEN
    CREATE TYPE "EntitlementKind" AS ENUM ('BOOLEAN','LIMIT','QUOTA','CAPABILITY');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EnforcementPolicy') THEN
    CREATE TYPE "EnforcementPolicy" AS ENUM ('SOFT_LIMIT','HARD_LIMIT','OVERAGE','NOTIFY_ONLY');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BillingAccountStatus') THEN
    CREATE TYPE "BillingAccountStatus" AS ENUM ('ACTIVE','SUSPENDED','CLOSED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CancellationMode') THEN
    CREATE TYPE "CancellationMode" AS ENUM ('IMMEDIATE','END_OF_PERIOD');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentMethod') THEN
    CREATE TYPE "PaymentMethod" AS ENUM ('MANUAL','BANK_TRANSFER','MOBILE_MONEY','CARD','CASH','GATEWAY');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CreditStatus') THEN
    CREATE TYPE "CreditStatus" AS ENUM ('AVAILABLE','PARTIALLY_APPLIED','APPLIED','EXPIRED','CANCELLED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdjustmentType') THEN
    CREATE TYPE "AdjustmentType" AS ENUM ('MANUAL_CORRECTION','COMMERCIAL_GESTURE','USAGE_CORRECTION','BILLING_CORRECTION');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MeterAggregation') THEN
    CREATE TYPE "MeterAggregation" AS ENUM ('SUM','MAX','COUNT','LAST');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MeterPeriod') THEN
    CREATE TYPE "MeterPeriod" AS ENUM ('BILLING_PERIOD','MONTH','DAY','YEAR');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BillingStage') THEN
    CREATE TYPE "BillingStage" AS ENUM ('SUBSCRIPTION_RESOLVER','ENTITLEMENT_RESOLVER','METERING','INVOICE_GENERATION','PAYMENT_PROVIDER','WEBHOOK','RENEWAL','ERP_SYNC');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BillingDiagnosticStatus') THEN
    CREATE TYPE "BillingDiagnosticStatus" AS ENUM ('HEALTHY','WARNING','DEGRADED','CRITICAL','UNKNOWN');
  END IF;
END
$$;

-- ---------------------------------------------------------------------------------------------
-- 2. Extensions d'enums existants
-- ---------------------------------------------------------------------------------------------

-- `Payment.paymentMethod` etait un texte libre : on le bascule sur l'enum type.
ALTER TABLE "payment" DROP COLUMN IF EXISTS "paymentMethod";
ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "method" "PaymentMethod" NOT NULL DEFAULT 'MANUAL';

-- ---------------------------------------------------------------------------------------------
-- 3. Extensions de colonnes
-- ---------------------------------------------------------------------------------------------

ALTER TABLE "plan"
  ADD COLUMN IF NOT EXISTS "billingModel" "PricingModel" NOT NULL DEFAULT 'FLAT',
  ADD COLUMN IF NOT EXISTS "intervalCount" integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "productId" text;

-- RG-BILL-005 : le prix sort du Plan. Colonnes legacy retirees.
ALTER TABLE "plan" DROP COLUMN IF EXISTS "price";
ALTER TABLE "plan" DROP COLUMN IF EXISTS "currency";

ALTER TABLE "plan_entitlement"
  ADD COLUMN IF NOT EXISTS "kind" "EntitlementKind" NOT NULL DEFAULT 'BOOLEAN',
  ADD COLUMN IF NOT EXISTS "unit" text,
  ADD COLUMN IF NOT EXISTS "enforcement" "EnforcementPolicy" NOT NULL DEFAULT 'SOFT_LIMIT',
  ADD COLUMN IF NOT EXISTS "meterKey" text;

ALTER TABLE "subscription"
  ADD COLUMN IF NOT EXISTS "billingAccountId" text,
  ADD COLUMN IF NOT EXISTS "priceId" text,
  ADD COLUMN IF NOT EXISTS "nextBillingAt" timestamp(3),
  ADD COLUMN IF NOT EXISTS "renewalAt" timestamp(3),
  ADD COLUMN IF NOT EXISTS "graceEndsAt" timestamp(3),
  ADD COLUMN IF NOT EXISTS "graceDays" integer,
  ADD COLUMN IF NOT EXISTS "suspendReason" text,
  ADD COLUMN IF NOT EXISTS "cancelAt" timestamp(3),
  ADD COLUMN IF NOT EXISTS "cancelRequestedAt" timestamp(3),
  ADD COLUMN IF NOT EXISTS "cancelRequestedBy" text,
  ADD COLUMN IF NOT EXISTS "cancellationMode" "CancellationMode",
  ADD COLUMN IF NOT EXISTS "endedAt" timestamp(3);

ALTER TABLE "quota_usage"
  ADD COLUMN IF NOT EXISTS "unit" text,
  ADD COLUMN IF NOT EXISTS "enforcement" "EnforcementPolicy" NOT NULL DEFAULT 'SOFT_LIMIT';

ALTER TABLE "invoice"
  ADD COLUMN IF NOT EXISTS "billingAccountId" text,
  ADD COLUMN IF NOT EXISTS "creditApplied" numeric(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "periodStart" timestamp(3),
  ADD COLUMN IF NOT EXISTS "periodEnd" timestamp(3),
  ADD COLUMN IF NOT EXISTS "voidedAt" timestamp(3),
  ADD COLUMN IF NOT EXISTS "voidReason" text,
  ADD COLUMN IF NOT EXISTS "createdBy" text;

ALTER TABLE "invoice_item"
  ADD COLUMN IF NOT EXISTS "priceId" text,
  ADD COLUMN IF NOT EXISTS "discount" numeric(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "sourceType" text,
  ADD COLUMN IF NOT EXISTS "sourceRef" text,
  ADD COLUMN IF NOT EXISTS "periodStart" timestamp(3),
  ADD COLUMN IF NOT EXISTS "periodEnd" timestamp(3),
  ADD COLUMN IF NOT EXISTS "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "payment"
  ADD COLUMN IF NOT EXISTS "tenantId" text,
  ADD COLUMN IF NOT EXISTS "idempotencyKey" text,
  ADD COLUMN IF NOT EXISTS "proofReference" text,
  ADD COLUMN IF NOT EXISTS "notes" text,
  ADD COLUMN IF NOT EXISTS "validatedBy" text,
  ADD COLUMN IF NOT EXISTS "validatedAt" timestamp(3),
  ADD COLUMN IF NOT EXISTS "refundAmount" numeric(18,2),
  ADD COLUMN IF NOT EXISTS "refundReason" text;

ALTER TABLE "feature"
  ADD COLUMN IF NOT EXISTS "kind" "EntitlementKind" NOT NULL DEFAULT 'BOOLEAN',
  ADD COLUMN IF NOT EXISTS "unit" text,
  ADD COLUMN IF NOT EXISTS "meterKey" text,
  ADD COLUMN IF NOT EXISTS "enforcement" "EnforcementPolicy" NOT NULL DEFAULT 'SOFT_LIMIT';

-- ---------------------------------------------------------------------------------------------
-- 4. Nouvelles tables
-- ---------------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "billing_product" (
  "id" text NOT NULL,
  "key" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "status" text NOT NULL DEFAULT 'ACTIVE',
  "features" jsonb,
  "metadata" jsonb,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" text,
  "updatedAt" timestamp(3) NOT NULL,
  "updatedBy" text,
  "archivedAt" timestamp(3),
  CONSTRAINT "billing_product_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "billing_product_key_key" ON "billing_product"("key");
CREATE INDEX IF NOT EXISTS "billing_product_status_idx" ON "billing_product"("status");

-- RG-BILL-005 / CDC 45 : prix versionné, jamais écrasé.
CREATE TABLE IF NOT EXISTS "billing_price" (
  "id" text NOT NULL,
  "planId" text NOT NULL,
  "currency" varchar(3) NOT NULL,
  "amount" numeric(18,2) NOT NULL,
  "interval" "BillingInterval" NOT NULL,
  "intervalCount" integer NOT NULL DEFAULT 1,
  "pricingModel" "PricingModel" NOT NULL DEFAULT 'FLAT',
  "effectiveFrom" timestamp(3) NOT NULL,
  "effectiveUntil" timestamp(3),
  "status" "PriceStatus" NOT NULL DEFAULT 'ACTIVE',
  "metadata" jsonb,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" text,
  "updatedAt" timestamp(3) NOT NULL,
  CONSTRAINT "billing_price_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "billing_price_planId_currency_interval_intervalCount_effectiveFrom_key"
  ON "billing_price"("planId","currency","interval","intervalCount","effectiveFrom");
CREATE INDEX IF NOT EXISTS "billing_price_planId_status_idx" ON "billing_price"("planId","status");
CREATE INDEX IF NOT EXISTS "billing_price_currency_idx" ON "billing_price"("currency");

-- CDC 30/31 : le payeur n'est pas l'utilisateur.
CREATE TABLE IF NOT EXISTS "billing_account" (
  "id" text NOT NULL,
  "tenantId" text NOT NULL,
  "customerName" text NOT NULL,
  "billingEmail" text NOT NULL,
  "billingAddress" jsonb,
  "taxInformation" jsonb,
  "currency" varchar(3) NOT NULL DEFAULT 'MGA',
  "status" "BillingAccountStatus" NOT NULL DEFAULT 'ACTIVE',
  "legalName" text,
  "billingContact" text,
  "taxIdentifier" text,
  "invoiceLanguage" text NOT NULL DEFAULT 'fr',
  "paymentTerms" integer,
  "metadata" jsonb,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" text,
  "updatedAt" timestamp(3) NOT NULL,
  "updatedBy" text,
  CONSTRAINT "billing_account_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "billing_account_tenantId_idx" ON "billing_account"("tenantId");
CREATE INDEX IF NOT EXISTS "billing_account_status_idx" ON "billing_account"("status");

-- CDC 24 : definitions de meters, PLATFORM GLOBAL.
CREATE TABLE IF NOT EXISTS "meter" (
  "id" text NOT NULL,
  "key" text NOT NULL,
  "name" text NOT NULL,
  "unit" text NOT NULL,
  "aggregation" "MeterAggregation" NOT NULL DEFAULT 'SUM',
  "period" "MeterPeriod" NOT NULL DEFAULT 'BILLING_PERIOD',
  "status" text NOT NULL DEFAULT 'ACTIVE',
  "entitlementCode" text,
  "description" text,
  "metadata" jsonb,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL,
  CONSTRAINT "meter_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "meter_key_key" ON "meter"("key");
CREATE INDEX IF NOT EXISTS "meter_status_idx" ON "meter"("status");
CREATE INDEX IF NOT EXISTS "meter_entitlementCode_idx" ON "meter"("entitlementCode");

-- CDC 23/26 : eventId rend l'evenement idempotent.
CREATE TABLE IF NOT EXISTS "usage_event" (
  "id" text NOT NULL,
  "eventId" text NOT NULL,
  "tenantId" text NOT NULL,
  "subscriptionId" text,
  "meterKey" text NOT NULL,
  "quantity" numeric(18,4) NOT NULL,
  "unit" text NOT NULL,
  "occurredAt" timestamp(3) NOT NULL,
  "source" text NOT NULL,
  "resourceId" text,
  "correlationId" text,
  "metadata" jsonb,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "usage_event_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "usage_event_eventId_key" ON "usage_event"("eventId");
CREATE INDEX IF NOT EXISTS "usage_event_tenantId_meterKey_occurredAt_idx"
  ON "usage_event"("tenantId","meterKey","occurredAt");
CREATE INDEX IF NOT EXISTS "usage_event_tenantId_idx" ON "usage_event"("tenantId");
CREATE INDEX IF NOT EXISTS "usage_event_meterKey_idx" ON "usage_event"("meterKey");

CREATE TABLE IF NOT EXISTS "usage_aggregate" (
  "id" text NOT NULL,
  "tenantId" text NOT NULL,
  "subscriptionId" text,
  "meterKey" text NOT NULL,
  "periodStart" timestamp(3) NOT NULL,
  "periodEnd" timestamp(3) NOT NULL,
  "value" numeric(18,4) NOT NULL DEFAULT 0,
  "updatedAt" timestamp(3) NOT NULL,
  CONSTRAINT "usage_aggregate_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "usage_aggregate_tenantId_meterKey_periodStart_periodEnd_key"
  ON "usage_aggregate"("tenantId","meterKey","periodStart","periodEnd");
CREATE INDEX IF NOT EXISTS "usage_aggregate_tenantId_idx" ON "usage_aggregate"("tenantId");

CREATE TABLE IF NOT EXISTS "payment_attempt" (
  "id" text NOT NULL,
  "attemptId" text NOT NULL,
  "paymentId" text NOT NULL,
  "provider" text,
  "providerReference" text,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "errorCode" text,
  "correlationId" text,
  "startedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" timestamp(3),
  CONSTRAINT "payment_attempt_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "payment_attempt_attemptId_key" ON "payment_attempt"("attemptId");
CREATE INDEX IF NOT EXISTS "payment_attempt_paymentId_idx" ON "payment_attempt"("paymentId");

CREATE TABLE IF NOT EXISTS "billing_credit" (
  "id" text NOT NULL,
  "tenantId" text NOT NULL,
  "billingAccountId" text,
  "invoiceId" text,
  "amount" numeric(18,2) NOT NULL,
  "remainingAmount" numeric(18,2) NOT NULL,
  "currency" varchar(3) NOT NULL DEFAULT 'MGA',
  "reason" text NOT NULL,
  "source" text NOT NULL,
  "status" "CreditStatus" NOT NULL DEFAULT 'AVAILABLE',
  "expiresAt" timestamp(3),
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" text,
  CONSTRAINT "billing_credit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "billing_credit_tenantId_idx" ON "billing_credit"("tenantId");
CREATE INDEX IF NOT EXISTS "billing_credit_status_idx" ON "billing_credit"("status");

CREATE TABLE IF NOT EXISTS "billing_adjustment" (
  "id" text NOT NULL,
  "tenantId" text NOT NULL,
  "invoiceId" text,
  "type" "AdjustmentType" NOT NULL,
  "amount" numeric(18,2) NOT NULL,
  "currency" varchar(3) NOT NULL DEFAULT 'MGA',
  "reason" text NOT NULL,
  "createdBy" text NOT NULL,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "billing_adjustment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "billing_adjustment_tenantId_idx" ON "billing_adjustment"("tenantId");
CREATE INDEX IF NOT EXISTS "billing_adjustment_invoiceId_idx" ON "billing_adjustment"("invoiceId");

CREATE TABLE IF NOT EXISTS "billing_diagnostic" (
  "id" text NOT NULL,
  "stage" "BillingStage" NOT NULL,
  "status" "BillingDiagnosticStatus" NOT NULL DEFAULT 'UNKNOWN',
  "code" text,
  "message" text,
  "resource" text,
  "correlationId" text,
  "traceId" text,
  "tenantId" text,
  "details" jsonb,
  "checkedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "billing_diagnostic_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "billing_diagnostic_stage_idx" ON "billing_diagnostic"("stage");
CREATE INDEX IF NOT EXISTS "billing_diagnostic_status_idx" ON "billing_diagnostic"("status");
CREATE INDEX IF NOT EXISTS "billing_diagnostic_tenantId_idx" ON "billing_diagnostic"("tenantId");
CREATE INDEX IF NOT EXISTS "billing_diagnostic_checkedAt_idx" ON "billing_diagnostic"("checkedAt");

-- RG-BILL-022 : un webhook non verifie ne modifie jamais un Payment.
CREATE TABLE IF NOT EXISTS "billing_webhook_event" (
  "id" text NOT NULL,
  "provider" text NOT NULL,
  "providerEventId" text NOT NULL,
  "signatureValid" boolean NOT NULL,
  "processed" boolean NOT NULL DEFAULT false,
  "processedAt" timestamp(3),
  "payload" jsonb NOT NULL,
  "receivedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "billing_webhook_event_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "billing_webhook_event_provider_providerEventId_key"
  ON "billing_webhook_event"("provider","providerEventId");
CREATE INDEX IF NOT EXISTS "billing_webhook_event_provider_idx" ON "billing_webhook_event"("provider");

-- ---------------------------------------------------------------------------------------------
-- 5. Contraintes et index manquants sur les tables existantes
-- ---------------------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS "subscription_nextBillingAt_idx" ON "subscription"("nextBillingAt");
CREATE INDEX IF NOT EXISTS "payment_tenantId_idx" ON "payment"("tenantId");
CREATE INDEX IF NOT EXISTS "invoice_item_sourceType_idx" ON "invoice_item"("sourceType");
CREATE INDEX IF NOT EXISTS "feature_kind_idx" ON "feature"("kind");

-- RG-BILL-021 : une meme cle d'idempotence ne peut produire deux debits.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_tenantId_idempotencyKey_key'
  ) THEN
    ALTER TABLE "payment" ADD CONSTRAINT "payment_tenantId_idempotencyKey_key"
      UNIQUE ("tenantId","idempotencyKey");
  END IF;
END
$$;

-- Les anciennes lignes (0 dans ce deploiement) ne peuvent pas avoir de tenantId.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "payment" WHERE "tenantId" IS NULL) THEN
    RAISE EXCEPTION 'payment.tenantId : lignes orphelines a migrer manuellement avant d''appliquer la contrainte NOT NULL';
  END IF;
END
$$;

ALTER TABLE "payment" ALTER COLUMN "tenantId" SET NOT NULL;
