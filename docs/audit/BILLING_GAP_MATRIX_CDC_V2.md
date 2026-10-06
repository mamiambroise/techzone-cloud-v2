# BILLING_GAP_MATRIX_CDC_V2

**Mission** : CDC n°15 — Subscription & Billing Techzone Cloud V2
**Branche** : `mami`
**HEAD de référence (audit)** : `ef51eb47`
**Date d'audit** : 2026-10-03
**Périmètre audité** : `backend/src`, `backend/prisma/schema.prisma`, `backend/prisma/migrations`, `frontend/src`, navigation, tests, `git log`
**PostgreSQL** : disponible (`SELECT 1` OK, base `business_manager`)

---

## 0. Méthode d'audit

Recherche réelle effectuée sur les termes (insensible à la casse) :
`billing, subscription, plan, pricing, price, entitlement, quota, limit, usage, meter,
invoice, payment, renewal, trial, billing account, billing profile, credit, adjustment,
webhook, stripe, mobile money, mvola, orange money, airtel money, money, currency, mga,
contractRef, feature flag, abonnement, facture, paiement`.

Sources inspectées :

| Source | Emplacement |
| --- | --- |
| Schéma Prisma | `backend/prisma/schema.prisma` (3850 lignes) |
| Service billing | `backend/src/iam/iam-billing.service.ts` (837 lignes) |
| Contrôleur billing | `backend/src/iam/iam-billing.controller.ts` (387 lignes) |
| Constantes IAM | `backend/src/iam/iam.constants.ts` |
| Module IAM | `backend/src/iam/iam.module.ts` |
| Client API | `frontend/src/services/apiClient.js:417` (`iamBillingService`, 50+ méthodes) |
| Navigation | `frontend/src/app/navigationConfig.js:192-201` |
| Routes | `frontend/src/app/routes.js:64-70,118-121` |
| Pages démo | `frontend/src/app/demoPages.json:43-85` (11 pages billing mock) |
| Tests | 48 `*.spec.ts` backend, 12 `*.test.jsx` frontend — **aucun test billing** |

---

## 1. CONSTAT MAJEUR — le code Billing existant est non fonctionnel

`backend/src/iam/iam-billing.service.ts` **compile** (`npx nest build` passe) mais
**échoue à l'exécution** : valeurs d'enum et champs Prisma inexistants. Vérifié par
grep sur `backend/dist/iam/iam-billing.service.js`.

| # | Défaut | Emplacement | Conséquence runtime |
| --- | --- | --- | --- |
| B-01 | `status: 'DEPRECATED'` — absent de `PlanStatus` (DRAFT/ACTIVE/DISABLED/ARCHIVED) | `iam-billing.service.ts:114` | Prisma error |
| B-02 | `status: 'CANCELED'` — l'enum est `CANCELLED` | `:298` | Prisma error |
| B-03 | `canceledAt` / `cancelReason` — champs inexistants (modèle : `cancelledAt` / `cancellationReason`) | `:299-301` | Prisma error |
| B-04 | `expiresAt` — le modèle Subscription expose `endsAt` | `:236` | Prisma error |
| B-05 | `booleanValue` — champ inexistant sur `PlanEntitlement` / `SubscriptionEntitlementOverride` | `:182`, `:630` | Prisma error |
| B-06 | `status: 'ISSUED'` — absent de `InvoiceStatus` (l'enum a `OPEN`) | `:395` | Prisma error |
| B-07 | `status: 'REFUNDED'` sur Invoice — absent de `InvoiceStatus` | `:578` | Prisma error |
| B-08 | Filtre `params.type` — `Feature` n'a pas de colonne `type` | `:715` | requête invalide |
| B-09 | `newPlanVersion` réinsère le même `code` unique | `:137` | P2002 systématique |
| B-10 | Argent en flottant binaire : `total += item.amount * (item.quantity ?? 1)` | `:348, :370, :377` | **violation RG-BILL-006** |
| B-11 | `invoiceNumber = \`INV-${Date.now()}\`` | `:354` | non stable, non auditable (CDC §35) |
| B-12 | `metadata: JSON.stringify(items)` dans une colonne `Json` | `:56, :364` | forme JSON incorrecte |
| B-13 | `listInvoices` / `listSubscriptions` / `listPayments` acceptent un `tenantId` libre en query string, sans recoupement avec le principal | `:322-324, :194-195, :456` | **violation RG-BILL-027** |
| B-14 | Aucun audit, aucun événement, aucun `traceId` | ensemble | **violations RG-BILL-020, RG-BILL-033** |
| B-15 | Aucune isolation de devise (`currency: 'EUR'` en dur, cf. `:54, :361`) | `:54`, `:361` | **violation RG-BILL-007** |
| B-16 | Aucune clé d'idempotence sur les paiements | `:399-429` | **violation RG-BILL-021** |
| B-17 | `applyPaymentToInvoice` confond `provider` et `paymentMethod` (met la méthode dans le provider) | `:411-412` | données trompeuses |
| B-18 | `markPaymentSucceeded` incrémente `amountPaid` sans recalculer `amountDue` | `:534` | états incohérents |
| B-19 | `getEntitlements` ne retourne **que les overrides**, jamais les entitlements du Plan | `:587-589` | resolver inexistant |
| B-20 | `checkAccess` ne consulte ni le statut de la subscription pour le tenant, ni les overrides en cours de validité | `:801-835` | contournement d'entitlement |

**Conclusion Phase 0** : il ne s'agit pas de « compléter » un module existant mais de
le **remplacer**. Les données sont toutes vides (`plan`, `plan_entitlement`, `subscription`,
`subscription_entitlement_override`, `quota_usage`, `invoice`, `invoice_item`, `payment`,
`billing_event`, `feature` = **0 lignes** ; `tenant` = 3 lignes), donc aucune migration
de données n'est nécessaire.

**Décision structurante** : créer un vrai `backend/src/modules/billing/` (CDC §85) et
retirer le service billing d'`IamModule`. Subscription & Billing est transversal et
ne doit pas vivre dans IAM (CDC §2, §4, RG-BILL-002).

---

## 2. Gap Matrix

Statuts : `ABSENT` = inexistant · `BROKEN` = présent mais non fonctionnel · `PARTIAL` =
présent et partiellement exploitable · `REAL` = présent et conforme.

### 2.1 Catalog / Plans / Pricing / Currency

| CDC Requirement | Existant Backend | Existant Frontend | Existant Prisma | Existant API | Tests | Status | Decision | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| §7 Product / Offer Catalog | absent | absent | absent | absent | — | ABSENT | **IMPLEMENT** | `schema.prisma:2243` démarre directement à `Plan` |
| §8 Plan (id,key,name,description,status,billingModel,entitlements,metadata) | `iam-billing.service.ts:9-167` — CRUD existe mais 5 défauts | ComingSoon `billingPlans` | `Plan` — `price` collé au Plan (viole RG-BILL-005) | `GET/POST/PATCH /api/iam/billing/plans` | aucun | BROKEN | **COMPLETE** → `modules/billing/catalog` | `schema.prisma:2243-2266` |
| §9 Price séparé du Plan | absent | absent | absent | absent | — | ABSENT | **IMPLEMENT** | aucun `model Price` dans le schéma |
| §45 Price versioning | `newPlanVersion` casse sur l'unique `code` | — | — | `POST /plans/:id/new-version` | — | BROKEN | **IMPLEMENT** | `iam-billing.service.ts:129-167` |
| §10 Devise MGA/EUR/USD | `currency` en colonne, mais `'EUR'` en dur par défaut | — | `Plan.currency VarChar(3)` | — | aucun | PARTIAL | **COMPLETE** | `schema.prisma:2251, 2373, 2425` |
| §97 Précision monétaire déterministe | **flottant binaire** | — | `Decimal(18,2)` | — | aucun | BROKEN | **IMPLEMENT** (`money.ts`, unités mineures entières) | `iam-billing.service.ts:348` |
| §11 Billing Cycle | `BillingInterval` existe (MONTHLY/QUARTERLY/SEMESTER/YEARLY/CUSTOM) | — | `Plan.billingInterval` | — | aucun | PARTIAL | **ADAPT** (renommer SEMESTER→SEMI_ANNUAL, YEARLY→ANNUAL) | `schema.prisma` enum `BillingInterval` |
| §12 Pricing Models | absent | absent | absent | — | — | ABSENT | **IMPLEMENT** (`FLAT` only, MVP) | CDC §118 |
| §66 §94 Plan Builder (draft/validate/activate/archive) | 部分 existe, cassé | ComingSoon | — | admin only | — | BROKEN | **COMPLETE** | — |

### 2.2 Subscription / Lifecycle

| CDC Requirement | Existant Backend | Existant Frontend | Existant Prisma | Existant API | Tests | Status | Decision | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| §13 Subscription (tenantId, planId, status, startedAt, period, trial/grace/cancel/ended) | `iam-billing.service.ts:192-315` — 6 défauts | ComingSoon `billingSubscriptions` | `Subscription` existe, **sans** `billingAccountId`, `priceId`, `graceEndsAt`, `cancelAt`, `endedAt` | admin only | aucun | BROKEN | **COMPLETE** | `schema.prisma:2289-2324` |
| §14 Lifecycle (DRAFT/TRIALING/ACTIVE/PAST_DUE/GRACE_PERIOD/SUSPENDED/CANCELLED/EXPIRED/ENDED) | enums divergents (`TRIAL` vs CDC `TRIALING`; pas de GRACE_PERIOD) | — | `SubscriptionStatus` incomplet | — | aucun | PARTIAL | **COMPLETE** | tables vides → renommage sans risque |
| §15 Transitions contrôlées backend | `activate`/`suspend`/`resume`/`cancel` sans machine à états ni audit | — | — | — | aucun | BROKEN | **IMPLEMENT** (`subscription-lifecycle.ts`) | aucun `canTransition` |
| §16 Trial | `trialDays` + `trialEndsAt` existent, **jamais consommés** | — | `Plan.trialDays`, `Subscription.trialEndsAt` | — | aucun | PARTIAL | **ADAPT** — trial uniquement si `trialDays > 0` (RG-BILL-034) | aucune transition automatique |
| §30 Cancellation IMMEDIATE / END_OF_PERIOD | `cancel` force `CANCELLED` | — | aucun `cancelAt` / `cancellationMode` | — | aucun | BROKEN | **IMPLEMENT** | `iam-billing.service.ts:290-304` |
| §55 §56 Upgrade / Downgrade | `changeSubscriptionPlan` sans contrôle de compatibilité | — | — | — | aucun | BROKEN | **IMPLEMENT** (éligibilité + incompatibilités, RG-BILL-018) | `iam-billing.service.ts:252-266` |
| §57 Proration | absent | absent | absent | — | — | ABSENT | **DIFFÉRÉ** (hors MVP CDC §118) | — |
| §59 Commercial Contracts | absent | absent | absent | — | — | ABSENT | **DIFFÉRÉ** (hors MVP) | — |

### 2.3 Entitlements / Resolver / Limits / Quotas

| CDC Requirement | Existant Backend | Existant Frontend | Existant Prisma | Existant API | Tests | Status | Decision | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| §17 §18 Entitlements (BOOLEAN/LIMIT/QUOTA/CAPABILITY) | `getEntitlements` ne retourne **que les overrides** | ComingSoon | `PlanEntitlement` (BOOLEAN/INTEGER/DECIMAL/STRING/JSON) | — | aucun | BROKEN | **COMPLETE** | `iam-billing.service.ts:586-590` |
| §60 Effective Entitlement Resolver | `checkAccess` incomplet (B-19/B-20) | — | — | `POST /billing/access/decide` | aucun | BROKEN | **IMPLEMENT** (`entitlement-resolver.service.ts`) | pipeline CDC §60 |
| §61 Entitlement Cache + invalidation | absent | absent | absent | — | — | ABSENT | **IMPLEMENT** | — |
| §20 Limits (key, unit, limit, usage, policy) | `QuotaUsage.usedValue/limitValue`, pas de policy | ComingSoon `billingQuotas` | `QuotaUsage` sans `unit`/`enforcement` | — | aucun | PARTIAL | **COMPLETE** | `schema.prisma:2349-2365` |
| §21 Quotas (période, reset, agrégation, overage) | période mensuelle codée en dur `:685-686` | — | — | — | aucun | BROKEN | **IMPLEMENT** (période liée au cycle de facturation) | — |
| §28 Enforcement SOFT/HARD/OVERAGE/NOTIFY_ONLY | absent | absent | absent | — | — | ABSENT | **IMPLEMENT** | — |
| §29 Near-limit (50/75/90/100 %) | absent | — | — | — | — | ABSENT | **IMPLEMENT** (seuils configurables) | — |

### 2.4 Usage / Metering

| CDC Requirement | Existant Backend | Existant Frontend | Existant Prisma | Existant API | Tests | Status | Decision | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| §22 Pipeline Metering | absent | absent | absent | absent | — | ABSENT | **IMPLEMENT** | — |
| §23 UsageEvent (eventId, tenantId, meterKey, quantity, unit, occurredAt, source, resourceId, correlationId, metadata) | absent | absent | absent | absent | — | ABSENT | **IMPLEMENT** | — |
| §24 Meter (key, name, unit, aggregation, period, status) | absent | absent | absent | — | — | ABSENT | **IMPLEMENT** | — |
| §26 Idempotence Usage | `consumeEntitlementQuota` incrémente sans clé | — | — | `POST .../quota/consume` | aucun | BROKEN | **IMPLEMENT** (unique sur `eventId`, RG-BILL-011/012) | `iam-billing.service.ts:664-709` |
| §27 Usage Aggregation | absent | — | — | — | — | ABSENT | **IMPLEMENT** | — |
| §25 Sources d'usage (IAM seats, BM applications, Automation executions…) | aucun module ne produit d'événement | — | — | — | — | ABSENT | **IMPLEMENT** (API d'émission ; branchement module par module hors MVP) | CDC §25 : chaque module reste propriétaire |

### 2.5 Billing Account

| CDC Requirement | Existant Backend | Existant Frontend | Existant Prisma | Existant API | Tests | Status | Decision | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| §30 Billing Account | absent | absent | absent | absent | — | ABSENT | **IMPLEMENT** | aucun `model BillingAccount` |
| §31 Billing Profile (legalName, contact, address, taxIdentifier, invoiceLanguage, paymentTerms) | absent | absent | absent | absent | — | ABSENT | **IMPLEMENT** | — |
| §6 « ne pas supposer User = payeur » | les paiements s'appuient sur l'Invoice, pas sur un payeur | — | — | — | — | ABSENT | **IMPLEMENT** | — |

### 2.6 Invoice

| CDC Requirement | Existant Backend | Existant Frontend | Existant Prisma | Existant API | Tests | Status | Decision | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| §32 Invoice | `generateInvoice` — 4 défauts | ComingSoon `billingInvoices` | `Invoice` sans `billingAccountId` | admin only | aucun | BROKEN | **COMPLETE** | `iam-billing.service.ts:346-386` |
| §34 Invoice Lines explicables | `InvoiceItem` créé mais sans `sourceType`/`sourceRef`/`period`/`discount` | — | `InvoiceItem` incomplet | — | — | PARTIAL | **COMPLETE** | `schema.prisma:2399-2415` |
| §33 Invoice Status | `'ISSUED'` inexistant, `'REFUNDED'` inexistant | — | `InvoiceStatus` correct | — | — | BROKEN | **COMPLETE** | `schema.prisma` `InvoiceStatus` |
| §35 Invoice Number stable/auditable | `INV-${Date.now()}` | — | `@unique` présent | — | aucun | BROKEN | **IMPLEMENT** (compteur transactionnel) | `iam-billing.service.ts:354` |
| §36 Taxes | `taxTotal` existe, jamais calculé, taux = 0 | — | `Invoice.taxTotal` | — | aucun | PARTIAL | **COMPLÈTE** : 0 par défaut, **aucun taux inventé** (RG-BILL-010) | aucune règle fiscale |
| §37 Discounts | `discountTotal` existe, jamais alimenté | — | `Invoice.discountTotal` | — | aucun | PARTIAL | **ADAPT** : discounts via `Adjustment`/`Credit` (traçables) | pas de moteur marketing (CDC §38) |
| §39 Credits | absent | absent | absent | absent | — | ABSENT | **IMPLEMENT** | — |
| §40 Adjustments | absent | absent | absent | absent | — | ABSENT | **IMPLEMENT** | — |
| §96 Historical Integrity | non保证了 (catalog mutable, pas de Price figé) | — | — | — | aucun | ABSENT | **IMPLEMENT** (ligne fige unitPrice/currency) | — |

### 2.7 Payments / Providers / Webhooks

| CDC Requirement | Existant Backend | Existant Frontend | Existant Prisma | Existant API | Tests | Status | Decision | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| §41 Payment | `Payment` sans `tenantId`, sans `idempotencyKey`, sans `method` | DemoPage `billing-payments` (mock) | `Payment` incomplet | admin only | aucun | BROKEN | **COMPLETE** | `schema.prisma:2417-2440` |
| §42 Payment Status | enum complet et correct | — | `PaymentStatus` | — | — | REAL | **KEEP** | aucun défaut relevé |
| §47 Idempotence Payment | aucune clé | — | — | — | aucun | ABSENT | **IMPLEMENT** (unique `idempotencyKey`) | `IdempotencyService` existe mais en mémoire, inutilisé |
| §49 Manual Payment + validation + permission IAM | `applyPaymentToInvoice` sans validation ni `validatedBy` | — | absent | admin only | aucun | BROKEN | **IMPLEMENT** (`billing:payment:record`) | CDC §23 |
| §45 Payment Provider Adapter | aucun contrat billing | — | — | — | — | ABSENT | **PREPARE ONLY** — interface sans adaptateur | **aucun provider inventé** (CDC §44) |
| §48 Webhooks (signature, dédup, réconciliation) | le webhook de l'Integration Hub existe mais ne concerns pas les paiements | DemoPage `billing-webhooks` (mock) | `WebhookEvent` (hub, pas billing) | `/api/integrations/webhooks/inbound/*` | aucun | ABSENT | **IMPLEMENT** (endpoint + vérification + dédup) | aucun provider réel |
| §46 Payment Attempt | absent | absent | absent | — | — | ABSENT | **IMPLEMENT** | — |

### 2.8 Renewal / Grace / Suspension / Reactivation

| CDC Requirement | Existant Backend | Existant Frontend | Existant Prisma | Existant API | Tests | Status | Decision | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| §50 Renewal | `renewSubscription` = simple `status:'ACTIVE'` | — | — | `POST /renew` | aucun | BROKEN | **IMPLEMENT** (nouvelle période + facture) | `iam-billing.service.ts:306-315` |
| §51 Grace Period configurable | absent | — | aucun `graceEndsAt` | — | — | ABSENT | **IMPLEMENT** (env + surcharge abonnement, jamais codé en dur arbitraire) | — |
| §52 Suspension sans perte de données | `suspendSubscription` — ne touche pas aux données | — | `Subscription.suspendedAt` | — | aucun | PARTIAL | **COMPLETE** (restriction d'entitlements) | RG-BILL-016 |
| §53 Reactivation (recalcul + invalidation cache) | `resumeSubscription` = `status:'ACTIVE'` | — | — | `POST /resume` | aucun | BROKEN | **IMPLEMENT** | — |
| §50自动 | **aucun scheduler dans le projet** (`@nestjs/schedule` absent) | — | — | — | — | ABSENT | **IMPLEMENT** (sweep explicite + polling optionnel `BILLING_SCHEDULER_ENABLED`) | aucun cron dans le repo |

### 2.9 IAM / Multi-tenant / Plateforme

| CDC Requirement | Existant Backend | Existant Frontend | Existant Prisma | Existant API | Tests | Status | Decision | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| §80 Permissions billing | **aucune** des 13 permissions | navigation billing sans `permission` | — | tout derrière `iam:admin` | aucun | ABSENT | **IMPLEMENT** dans `iam.constants.ts` | `iam.constants.ts:18-74` — 55 permissions, aucune `billing:*` |
| §62 §6 IAM ≠ Entitlement | `checkAccess` mélange les deux | `navigationAccess.js:10` lit `user.entitlements` (champ **inexistant** côté API) | — | — | aucun | BROKEN | **COMPLETE** (resolver commercial séparé ; permissions IAM inchangées) | `iam-auth.service.ts` ne renvoie pas `entitlements` |
| §81 Rôles | `ROLES = {admin,user}` | — | — | — | — | PARTIAL | **KEEP** — aucun rôle billing inventé, on s'appuie sur `ROLE_PERMISSIONS` | CDC §81 |
| §82 Multi-tenant | `TenantGuard` global existe ; billing l'ignore | `TenantProvider` + `TenantBoundary` existent | `tenantId` sur Subscription/Invoice, **absent sur Payment** | — | aucun | PARTIAL | **IMPLEMENT** (scoping strict + tests A→B) | B-13 |
| §83 Platform Scope (Plans globaux vs données tenant) | non explicité | — | — | — | — | ABSENT | **IMPLEMENT** (contrats explicites) | — |
| §87 Sidebar | groupe `billing` existe, section `platform`, **10 entrées toutes `implemented:false`** | ComingSoon × 6 + DemoPage × 4 | — | — | `session-navigation.test.jsx:63` | PARTIAL | **COMPLETE** (une seule entrée globale + workspace interne) | `navigationConfig.js:92-97, 192-201` |
| §64 Dashboard | aucun KPI billing | — | — | — | — | ABSENT | **IMPLEMENT** (uniquement données réelles) | — |

### 2.10 ERP / Observability / Diagnostics / Audit

| CDC Requirement | Existant Backend | Existant Frontend | Existant Prisma | Existant API | Tests | Status | Decision | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| §71 §72 ERP via Integration Hub | aucun lien billing↔ERP | — | — | — | — | ABSENT | **PREPARE ONLY** — contrat d'export, **jamais d'accès direct à la DB Dolibarr** (RG-BILL-024/025) | ERP Adapter/Hub déjà en place (CDC07) |
| §75 Observability | aucun metric billing | — | — | — | — | ABSENT | **IMPLEMENT** (events + diagnostics, sans secret) | — |
| §76 Billing Events | modèle `BillingEvent` existe, **jamais écrit** | — | `BillingEvent` | — | — | ABSENT | **IMPLEMENT** | `schema.prisma:2442-2460` |
| §79 Audit | **aucun** | — | `AuditEvent` existe | — | aucun | ABSENT | **IMPLEMENT** (11 actions exigées) | motif d'audit existant : `ui-builder.service.ts:548-566` |
| §101 §102 Diagnostics + Health | absent | ComingSoon implicite | — | `/api/integrations/diagnostics/*` (hub) | — | ABSENT | **IMPLEMENT** (8 stages CDC §101, 6 healths CDC §102) | — |

### 2.11 UI

| CDC Requirement | Existant Backend | Existant Frontend | Status | Decision | Evidence |
| --- | --- | --- | --- | --- | --- |
| §89 Vue d'ensemble Tenant | — | absent | ABSENT | **IMPLEMENT** | `navigationConfig.js:192` |
| §90 Offre actuelle | — | absent | ABSENT | **IMPLEMENT** | idem |
| §91 Utilisation | — | absent | ABSENT | **IMPLEMENT** | idem |
| §92 Factures UI | API admin cassée | absent | ABSENT | **IMPLEMENT** | idem |
| §93 Paiements UI | API admin cassée | absent (mock) | ABSENT | **IMPLEMENT** | idem |
| §42 Paramètres de facturation | — | absent | ABSENT | **IMPLEMENT** | — |
| §88 Administration Billing Platform | — | absent | ABSENT | **IMPLEMENT** | — |
| §52 Responsive / a11y | — | design system présent (`index.css`, tokens `--bm-*`, radius 12px) | PARTIAL | **KEEP** le design existant | `frontend/src/index.css` |

---

## 3. Points explicitement NON inventés (interdictions CDC §44, §54)

- **Aucun** provider Mobile Money (Mvola / Orange Money / Airtel Money) : aucun numéro, aucune API, aucun frais, aucun credential.
- **Aucun** taux de TVA ni règle fiscale Madagascar : `taxTotal` reste 0 tant qu'aucune décision comptable n'est validée.
- **Aucun** montant, facture, paiement, statut, entitlement ni limite en dur côté React.
- **Aucun** accès direct à la base Dolibarr depuis Billing.
- **Aucun** second RBAC : les permissions rejoignent le registre IAM existant.
- **Aucun** rôle Billing inventé : seules des permissions sont ajoutées au registre existant.
- **Aucune** simulation de provider : le contrat d'interface est fourni sans adaptateur.

---

## 4. Registre de permissions — Gap et adaptation

Le registre réel (`iam.constants.ts:18-74`) compte 55 permissions et **deux conventions
historiques** :

| Convention | Domaines | Exemple |
| --- | --- | --- |
| `domain.verb` (point) | `pack.*`, `runtime.*` | `pack.feature.create` |
| `domain:verb` (deux-points) | `erp:*`, `integration:*`, `automation:*`, `data-runtime:*`, `iam:*`, `config:*` | `integration:read` |

Le CDC §80 propose `billing.read` (point) mais impose « Réutiliser les conventions
réelles du Permission Registry ». **Décision : `ADAPT` vers la convention deux-points**,
dominante sur tous les modules ajoutés récemment et cohérente avec le CDC §62
(« Billing fournit : commercial entitlement » ≠ permission).

| Permission CDC §80 | Permission Techzone retenue |
| --- | --- |
| `billing.read` | `billing:read` |
| `billing.manage` | `billing:manage` |
| `billing.plan.read` | `billing:plan:read` |
| `billing.plan.manage` | `billing:plan:manage` |
| `billing.subscription.read` | `billing:subscription:read` |
| `billing.subscription.manage` | `billing:subscription:manage` |
| `billing.invoice.read` | `billing:invoice:read` |
| `billing.invoice.manage` | `billing:invoice:manage` |
| `billing.payment.read` | `billing:payment:read` |
| `billing.payment.record` | `billing:payment:record` |
| `billing.payment.refund` | `billing:payment:refund` |
| `billing.usage.read` | `billing:usage:read` |
| `billing.override.manage` | `billing:override:manage` |
| (diagnostics, CDC §48/§101) | `billing:diagnostic:read` |

---

## 5. Modèles Prisma — sort retenu

### 5.1 Réutilisés (conservés)

`Plan`, `PlanEntitlement`, `Subscription`, `SubscriptionEntitlementOverride`,
`QuotaUsage`, `Invoice`, `InvoiceItem`, `Payment`, `BillingEvent`, `Feature`, `Tenant`.

### 5.2 Créés

`BillingProduct`, `Price`, `BillingAccount`, `Meter`, `UsageEvent`, `UsageAggregate`,
`PaymentAttempt`, `Credit`, `Adjustment`, `BillingDiagnostic`, `BillingWebhookEvent`.

### 5.3 Étendus

| Modèle | Ajouts |
| --- | --- |
| `Plan` | `productId`, `billingModel`, `prices[]` ; `price`/`currency` dépréciés au profit de `Price` |
| `PlanEntitlement` | `enforcement`, `unit`, `meterKey` |
| `Subscription` | `billingAccountId`, `priceId`, `graceEndsAt`, `graceDays`, `cancelAt`, `cancelRequestedAt`, `cancelRequestedBy`, `cancellationMode`, `endedAt` |
| `Invoice` | `billingAccountId`, `creditApplied` |
| `InvoiceItem` | `sourceType`, `sourceRef`, `periodStart`, `periodEnd`, `discount` |
| `Payment` | `tenantId`, `method`, `idempotencyKey` (unique), `proofReference`, `notes`, `validatedBy`, `validatedAt`, `refundAmount`, `attempts[]` |
| `Feature` | `unit`, `enforcement`, `meterKey`, `kind` |

### 5.4 Enums

Nouveaux : `PricingModel`, `PriceStatus`, `BillingAccountStatus`, `PaymentMethod`,
`EnforcementPolicy`, `MeterAggregation`, `MeterPeriod`, `CancellationMode`,
`CreditStatus`, `AdjustmentType`, `BillingStage`, `BillingDiagnosticStatus`, `EntitlementKind`.

Étendus : `PlanStatus` (+`DEPRECATED`), `SubscriptionStatus` (`TRIAL`→`TRIALING`,
+`DRAFT`,`GRACE_PERIOD`,`ENDED`), `BillingInterval` (`SEMESTER`→`SEMI_ANNUAL`,
`YEARLY`→`ANNUAL`).

> Les tables étant vides, ces renommages d'enum ne demandent aucune migration de données.

### 5.5 Supprimés

`model AdminDelegation`, `model AdministrativeAction` : **conservés** (hors périmètre).

Aucun modèle supprimé — l'existant est étendu, pas reconstruit. Le service
`iam-billing.service.ts` et son contrôleur sont **retirés** du câblage d'`IamModule`
(ils sont `BROKEN`, non fonctionnels, et leur API mixe administration plateforme et
données tenant sans isolation).

---

## 6. Deviations assumées par rapport au CDC

| # | CDC | Décision | Justification |
| --- | --- | --- | --- |
| D-1 | §84 `GET /api/billing/plans` etc. | `/api/billing/*` (tenant) + `/api/billing/admin/*` (plateforme) | CDC §88 : séparer l'administration plateforme du workspace tenant ; l'API existante ne sépare rien et fuit les `tenantId` |
| D-2 | §80 `billing.read` | `billing:read` | §80 impose de réutiliser les conventions réelles du registre |
| D-3 | §34 `InvoiceLine` | `InvoiceItem` (table `invoice_item`) | tables vides, mais le renommage n'apporte rien de fonctionnel ; modèle adapté avec les champs CDC |
| D-4 | §14 `TRIALING` | `TRIALING` (renommé) | §14 : « Ne pas créer deux états ayant exactement la même signification » |
| D-5 | §11 `SEMI_ANNUAL` / `ANNUAL` | renommés depuis `SEMESTER` / `YEARLY` | cohérence avec le vocabulaire CDC |
| D-6 | §10 MGA | exposant 2 (ISO 4217), aligné sur `Decimal(18,2)` | le CDC n'arrête pas l'exposant ; le choix est isolé dans une constante unique et testé, pas dispersé |
| D-7 | §51 Grace Period | `BILLING_GRACE_DAYS` (défaut 7) + surcharge par abonnement | §51 : « Ne pas coder arbitrairement un nombre de jours » → configurable et exposé dans les diagnostics |
| D-8 | §44 Mobile Money | contrat d'interface seul, aucun adaptateur | §44 : rien ne doit être inventé |
| D-9 | §50 automatisation | sweep invoqué explicitement + polling optionnel | le projet n'a aucun scheduler ; le CDC n'impose pas cron |

---

## 7. Matrice de traçabilité MVP (CDC §118) → décision

| # | Item MVP | Decision | Portée |
| --- | --- | --- | --- |
| 1 | Plan Catalog | IMPLEMENT | Products + Plans + Features |
| 2 | Flat Pricing | IMPLEMENT | `Price` + `PricingModel.FLAT` |
| 3 | Subscription | IMPLEMENT | modèle + création tenant |
| 4 | Lifecycle ACTIVE/SUSPENDED/CANCELLED | IMPLEMENT | machine à états complète |
| 5 | Boolean + Limit Entitlements | IMPLEMENT | 4 `EntitlementKind` |
| 6 | Effective Entitlement Resolver | IMPLEMENT | resolver central + cache |
| 7 | Simple Usage Counters | IMPLEMENT | UsageEvent/Meter/Aggregate |
| 8 | Invoice | IMPLEMENT | calcul exact + numérotation stable |
| 9 | Manual Payment | IMPLEMENT | enregistrement + validation permission |
| 10 | Payment Status | KEEP | enum existant correct |
| 11 | Basic Renewal | IMPLEMENT | nouvelle période + facture |
| 12 | Grace Policy | IMPLEMENT | configurable |
| 13 | IAM Integration | IMPLEMENT | 14 permissions |
| 14 | Dashboard/Sidebar Integration | IMPLEMENT | 1 entrée globale + 6 workspace + 8 admin |
| 15 | Audit | IMPLEMENT | 11 actions CDC §79 |
| 16 | Diagnostics | IMPLEMENT | 8 stages CDC §101 |

---

## 8. Verdict Phase 0

- **Aucune fonction ne peut être déclarée `KEEP`** au sens « fonctionnelle » : le
  périmètre Billing existant est intégralement `BROKEN` ou `ABSENT`.
- `KEEP` réel : `InvoiceStatus`, `PaymentStatus`, `EntitlementValueType`, `BillingEvent`,
  `AuditEvent`, `Feature`, `TenantGuard`, `IamPermissionsGuard`, `TenantProvider`,
  design system frontend.
- Le reste est `COMPLETE` / `IMPLEMENT` selon §2.
- L'audit est **seulement** la Phase 0 : la suite de ce document décrit l'implémentation
  réellement effectuée.