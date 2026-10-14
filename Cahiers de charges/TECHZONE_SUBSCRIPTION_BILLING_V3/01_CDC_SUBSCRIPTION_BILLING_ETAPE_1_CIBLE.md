# CAHIER DES CHARGES — TECHZONE CLOUD SUBSCRIPTION & BILLING
## Étape 1 — Cible fonctionnelle et architecturale

**Projet :** Techzone Cloud  
**Module :** Subscription & Billing  
**Version cible :** 3.0  
**Statut :** Spécification cible

---

# 1. Objet

Subscription & Billing répond à :

```text
PLAN
→ Que vend Techzone Cloud ?

PRICE
→ À quel prix et selon quel cycle ?

SUBSCRIPTION
→ À quoi le Tenant est-il abonné ?

ENTITLEMENTS
→ Quelles capacités commerciales possède-t-il ?

IAM
→ Quel utilisateur peut réellement les utiliser ?

USAGE
→ Quelle quantité est consommée ?

INVOICE
→ Quel montant est dû ?

PAYMENT
→ Le paiement est-il réellement confirmé ?

LIFECYCLE
→ Renew • Grace • Suspend • Reactivate
```

---

# 2. Position dans Techzone Cloud

```text
IAM / TENANT CONTEXT
        ↓
SUBSCRIPTION & BILLING
Plans • Prices • Subscription
Entitlements • Limits • Usage
Invoices • Payments
        ↓
MODULES TECHZONE CLOUD
Business Manager
UI Builder
Automation
Pack Manager / Runtime
Data / Integrations
        ↓
PAYMENT / ERP PROVIDERS
via contrats officiels
```

---

# 3. Règles d’architecture

```text
SUBSCRIPTION ≠ IAM
ENTITLEMENT ≠ PERMISSION
BILLING ≠ ERP
PAYMENT ≠ INVOICE
USAGE ≠ BUSINESS DATA
```

---

# 4. Responsabilités

Le module possède :

- Product / Offer Catalog ;
- Plans ;
- Prices ;
- Billing Cycles ;
- Subscriptions ;
- Subscription Items ;
- Entitlements ;
- Commercial Limits ;
- Quotas ;
- Usage Records ;
- Meters ;
- Billing Accounts ;
- Invoices ;
- Invoice Lines ;
- Payments ;
- Payment Attempts ;
- Credits ;
- Adjustments ;
- Renewals ;
- Grace Periods ;
- Suspension/Reactivation ;
- Billing Events ;
- Billing Diagnostics.

---

# 5. Hors périmètre

Ne possède pas :

- User/Role/Permission → IAM ;
- Business Definitions → BM ;
- Pack Publication → Pack Manager ;
- Runtime activation → Pack Runtime ;
- business data → Data Runtime ;
- ERP resources → Integration Hub ;
- generic logs → Observability ;
- notifications infrastructure.

---

# 6. Entitlement ≠ Permission

Accès effectif :

```text
Commercial Entitlement
AND
IAM Authorization
AND
Tenant Context
AND
Module Availability
=
Effective Access
```

Un Plan autorise une capacité au Tenant.

IAM autorise un utilisateur précis.

---

# 7. Product / Offer

Modèle conceptuel :

```text
BillingProduct
├── id
├── key
├── name
├── description
├── status
├── metadata
└── createdAt/updatedAt
```

---

# 8. Plan

```text
Plan
├── id
├── productId
├── key
├── name
├── status
├── description
├── entitlements
├── limits
├── metadata
└── createdAt/updatedAt
```

---

# 9. Plan Status

```text
DRAFT
ACTIVE
DEPRECATED
ARCHIVED
```

Un plan archivé ne doit pas invalider l’historique des abonnements existants.

---

# 10. Price

```text
Price
├── id
├── planId
├── currency
├── amountMinor
├── billingCycle
├── intervalCount
├── status
├── validFrom
├── validTo?
└── metadata
```

---

# 11. Money

Règle obligatoire :

```text
No floating point for money.
```

Utiliser :
- integer minor units ;
- ou decimal DB maîtrisé.

Toujours stocker :
- amount ;
- currency.

---

# 12. Currency

Exemples :
- MGA ;
- USD ;
- EUR.

Aucune conversion implicite.

Une facture possède une devise explicite.

---

# 13. Billing Cycle

```text
MONTHLY
QUARTERLY
YEARLY
ONE_TIME
CUSTOM
```

Ne retenir que ceux réellement implémentés.

---

# 14. Subscription

```text
Subscription
├── id
├── tenantId
├── billingAccountId
├── planId
├── priceId
├── status
├── currentPeriodStart
├── currentPeriodEnd
├── cancelAtPeriodEnd
├── graceUntil?
├── suspendedAt?
├── createdAt
└── updatedAt
```

---

# 15. Subscription Lifecycle

Concept :

```text
DRAFT
TRIALING
ACTIVE
PAST_DUE
GRACE
SUSPENDED
CANCELLED
EXPIRED
```

Adapter aux états réels.

---

# 16. Activation

Une Subscription ACTIVE :
- possède Plan/Price valides ;
- appartient au Tenant ;
- produit un ensemble d’Entitlements déterministe.

---

# 17. Entitlement

```text
Entitlement
├── id
├── tenantId
├── subscriptionId
├── key
├── type
├── value
├── status
├── source
└── validUntil?
```

Exemples :

```text
module.automation = true
pack.max = 10
users.max = 25
api.requests.month = 100000
```

---

# 18. Entitlement Resolver

Entrées :

```text
tenantId
subscription
plan
subscription items
overrides
lifecycle status
```

Sortie :

```text
EffectiveEntitlements
```

Le résultat doit être :
- déterministe ;
- cacheable ;
- invalidable ;
- auditable.

---

# 19. Entitlement Cache

Invalider sur :
- subscription activate ;
- plan change ;
- upgrade/downgrade ;
- payment state affecting access ;
- suspend ;
- reactivate ;
- cancellation ;
- entitlement override.

---

# 20. Limits / Quotas

Un Entitlement peut contenir une limite.

Exemples :
- users ;
- apps ;
- pack publications ;
- API requests ;
- storage ;
- automation executions.

---

# 21. Limit Policies

```text
SOFT
HARD
OVERAGE
```

Ne pas implémenter OVERAGE sans billing support réel.

---

# 22. Usage

Usage Record :

```text
UsageRecord
├── id
├── tenantId
├── meterKey
├── quantity
├── occurredAt
├── idempotencyKey
├── source
├── dimension
└── metadata
```

---

# 23. Usage Idempotency

Même usage event ne doit pas compter deux fois.

Unique logical key :
```text
tenant + meter + idempotencyKey
```

---

# 24. Meter

```text
Meter
├── key
├── unit
├── aggregation
├── resetPolicy
├── billable
└── status
```

Aggregations :
```text
SUM
COUNT
MAX
LAST
```

---

# 25. Usage ≠ Business Data

Billing ne stocke pas les records métier.

Il stocke seulement la mesure nécessaire.

---

# 26. Quota Resolution

```text
Entitlement limit
↓
Usage aggregate
↓
Remaining
↓
Policy
↓
ALLOW / WARN / DENY
```

---

# 27. Invoice

```text
Invoice
├── id
├── tenantId
├── billingAccountId
├── subscriptionId
├── number
├── currency
├── status
├── subtotalMinor
├── discountMinor
├── taxMinor
├── totalMinor
├── amountPaidMinor
├── amountDueMinor
├── issuedAt
├── dueAt
└── paidAt?
```

---

# 28. Invoice Status

```text
DRAFT
OPEN
PAID
VOID
OVERDUE
UNCOLLECTIBLE
```

Adapter au code existant.

---

# 29. Invoice Lines

Chaque ligne doit être explicable :

```text
description
quantity
unitAmount
period
subtotal
discount
tax
total
source
```

---

# 30. Invoice Calculation

Pipeline :

```text
Subscription
↓
Billing Period
↓
Plan / Price Snapshot
↓
Usage if applicable
↓
Credits / Adjustments
↓
Invoice Lines
↓
Totals
```

Une facture émise doit conserver son snapshot financier.

---

# 31. Historical Integrity

Modifier un Plan/Price aujourd’hui ne modifie pas rétroactivement une facture historique.

---

# 32. Payment

```text
Payment
├── id
├── tenantId
├── invoiceId
├── amountMinor
├── currency
├── provider
├── providerPaymentId?
├── method
├── status
├── confirmedAt?
├── createdAt
└── updatedAt
```

---

# 33. Payment ≠ Invoice

Une facture peut exister sans paiement.

Un paiement ne marque pas automatiquement une facture PAID tant qu’il n’est pas validé et rapproché.

---

# 34. Payment Status

```text
PENDING
SUCCEEDED
FAILED
CANCELLED
REFUNDED
PARTIALLY_REFUNDED
```

Ne retenir que les états implémentés.

---

# 35. Manual Payment

Si paiement manuel :

```text
MANUAL
```

doit être explicitement identifié.

Requiert :
- permission ;
- référence ;
- actor ;
- date ;
- preuve/metadata si applicable ;
- audit.

---

# 36. Real Payment Provider

Providers derrière interface :

```text
PaymentProvider
├── createPayment
├── getStatus
├── verifyWebhook
├── refund? 
└── diagnostics
```

Pas d’intégration directe depuis UI.

---

# 37. REAL / MOCK / MANUAL

Distinction obligatoire :

```text
REAL
MOCK
MANUAL
```

Jamais afficher `PAID` comme réel si généré par mock silencieux.

---

# 38. Webhooks Payment

Pipeline :

```text
Provider
↓
Signature Verification
↓
Event Dedup
↓
Payment Lookup
↓
Amount/Currency Check
↓
State Transition
↓
Invoice Reconciliation
↓
Subscription Lifecycle
↓
Audit
```

---

# 39. Webhook Security

Vérifier :
- signature ;
- timestamp ;
- replay ;
- event ID ;
- amount ;
- currency ;
- provider object relation.

---

# 40. Payment Idempotency

Même provider event/payment confirmation ne doit pas créer plusieurs paiements.

---

# 41. Renewal

Avant période suivante :

```text
ACTIVE
↓
Renewal
↓
Invoice
↓
Payment according policy
↓
Next Period
```

---

# 42. Failed Payment

```text
Invoice due
↓
Payment failed/unpaid
↓
PAST_DUE
↓
GRACE
↓
No payment
↓
SUSPENDED
```

selon policy.

---

# 43. Grace Period

Grace :
- conserve données ;
- limite ou maintient certains accès selon policy ;
- date de fin explicite ;
- warning visible.

---

# 44. Suspension

Suspension :
- n’efface aucune donnée ;
- recalcule Entitlements ;
- bloque les capacités commerciales concernées ;
- conserve historique.

---

# 45. Reactivation

```text
SUSPENDED
↓
Payment verified / admin action allowed
↓
ACTIVE
↓
Entitlements recalculated
↓
Cache invalidated
```

---

# 46. Cancellation

Support :
- immediate ;
- end of period.

Doit être explicite.

---

# 47. Upgrade / Downgrade

MVP recommandé :
- next-period change ;
- sans proration complexe.

Proration uniquement si réellement implémentée/testée.

---

# 48. Credits / Adjustments

Mouvements financiers traçables.

Jamais modification silencieuse d’une facture payée.

---

# 49. Taxes

Si Tax Engine absent :
- tax = explicit/manual configuration ;
- ne pas prétendre gérer fiscalité complexe.

---

# 50. Billing Account

```text
BillingAccount
├── id
├── tenantId
├── legalName
├── billingEmail
├── address
├── taxIdentifier?
├── defaultCurrency
└── metadata
```

---

# 51. Tenant Isolation

Tenant A ne peut jamais :
- lire subscription B ;
- invoice B ;
- payment B ;
- usage B ;
- billing account B.

---

# 52. IAM Permissions

Exemples :

```text
billing.read
billing.subscription.manage
billing.invoice.read
billing.invoice.manage
billing.payment.read
billing.payment.manual
billing.plan.read
billing.plan.manage
billing.usage.read
billing.entitlement.read
billing.entitlement.manage
billing.diagnostics
```

---

# 53. Platform vs Tenant

Tenant UI :
- current plan ;
- usage ;
- invoices ;
- payments ;
- billing settings.

Platform Admin :
- products ;
- plans ;
- prices ;
- tenant subscriptions ;
- adjustments ;
- diagnostics.

---

# 54. Integration IAM

Entitlement n’accorde jamais une permission utilisateur.

Module guard effectif :

```text
Entitlement Resolver
+
IAM Permission
```

---

# 55. Integration API Manager

API usage/quota peut envoyer Usage Records.

API Manager ne modifie pas directement invoice.

---

# 56. Integration Automation

Automation execution counts peuvent être metered.

---

# 57. Integration Pack Manager

Exemples :
- number of published apps ;
- pack limits.

---

# 58. Integration Runtime

Runtime peut vérifier entitlement de module/capability.

Mais ne calcule pas factures.

---

# 59. Integration ERP

Factures/paiements ERP éventuels via Integration Hub uniquement.

Billing ne dépend pas du modèle Dolibarr.

---

# 60. Payment Providers

Provider externe derrière contrat officiel.

Credentials backend-only.

---

# 61. Observability

Metrics :

```text
subscriptions_active
subscriptions_past_due
billing_invoices_total
billing_invoice_amount
billing_payments_total
billing_payment_failures
billing_usage_events
billing_quota_denials
```

---

# 62. Audit

Auditer :
- plan/price changes ;
- subscription changes ;
- manual payments ;
- invoice adjustments ;
- entitlement override ;
- suspension/reactivation ;
- payment reconciliation.

---

# 63. Diagnostics

Codes :

```text
BILLING_PLAN_NOT_FOUND
BILLING_PRICE_INVALID
BILLING_SUBSCRIPTION_INVALID
BILLING_ENTITLEMENT_DENIED
BILLING_QUOTA_EXCEEDED
BILLING_USAGE_DUPLICATE
BILLING_INVOICE_INVALID
BILLING_PAYMENT_INVALID
BILLING_PAYMENT_DUPLICATE
BILLING_WEBHOOK_INVALID
BILLING_AMOUNT_MISMATCH
BILLING_CURRENCY_MISMATCH
BILLING_PROVIDER_UNAVAILABLE
BILLING_TENANT_DENIED
```

---

# 64. API conceptuelle

Plans :

```http
GET /api/billing/plans
POST /api/billing/plans
PATCH /api/billing/plans/:id
```

Subscriptions :

```http
GET /api/billing/subscription
POST /api/billing/subscriptions
PATCH /api/billing/subscriptions/:id
POST /api/billing/subscriptions/:id/cancel
POST /api/billing/subscriptions/:id/reactivate
```

Entitlements :

```http
GET /api/billing/entitlements/effective
```

Usage :

```http
POST /api/billing/usage
GET  /api/billing/usage/summary
```

Invoices :

```http
GET  /api/billing/invoices
GET  /api/billing/invoices/:id
POST /api/billing/invoices/generate
```

Payments :

```http
GET  /api/billing/payments
POST /api/billing/payments/manual
POST /api/billing/providers/:provider/webhook
```

Adapter aux routes existantes.

---

# 65. UI Subscription Overview

Afficher :
- Current Plan ;
- status ;
- renewal ;
- entitlements ;
- usage ;
- amount due ;
- recent invoices.

---

# 66. Current Plan

Show :
- plan ;
- price ;
- billing cycle ;
- active since ;
- renewal date ;
- status.

---

# 67. Usage

Bars :
- users ;
- apps ;
- API calls ;
- automation executions ;
- storage if metered.

Uniquement métriques réelles.

---

# 68. Invoices

Table :
- number ;
- period ;
- issue date ;
- due date ;
- total ;
- paid ;
- due ;
- status.

---

# 69. Invoice Detail

Afficher :
- lines ;
- totals ;
- currency ;
- payments ;
- adjustments ;
- audit.

---

# 70. Payments

Table :
- payment ;
- invoice ;
- amount ;
- method ;
- provider/mode ;
- status ;
- date.

---

# 71. Past Due UI

Banner :
- invoice due ;
- grace deadline ;
- consequence.

---

# 72. Suspended UI

Banner :
- subscription suspended ;
- no data deletion ;
- how to reactivate.

---

# 73. Platform Plan Admin

Manage :
- products ;
- plans ;
- prices ;
- entitlements ;
- limits.

---

# 74. Tests unitaires

- money precision ;
- currency ;
- plan/price ;
- lifecycle ;
- entitlement resolution ;
- quotas ;
- usage dedup ;
- invoice calculation ;
- payment states ;
- renewal ;
- grace ;
- suspension ;
- reactivation.

---

# 75. Tests intégration

```text
Tenant → Subscription → Entitlement → IAM
```

```text
Usage → Meter → Quota
```

```text
Invoice → Payment → Webhook → Paid
```

```text
Billing → Integration Hub → ERP
```

---

# 76. Security Tests

- cross tenant ;
- forged tenant ;
- unauthorized plan ;
- unauthorized manual payment ;
- duplicate payment ;
- webhook replay ;
- tampered amount ;
- currency mismatch ;
- secret leakage ;
- entitlement bypass.

---

# 77. E2E

Subscription :

```text
Select Plan
→ Subscribe
→ Activate
→ Resolve Entitlements
→ IAM Check
→ Feature Available
```

Billing :

```text
Billing Period
→ Invoice
→ Verified Payment
→ Paid
→ Remain Active
```

Failure :

```text
Failed Payment
→ Past Due
→ Grace
→ Suspended
```

Reactivation :

```text
Verified Payment
→ Reactivate
→ Entitlements recalculated
```

---

# 78. MVP

MVP recommandé :
- plans/prices ;
- one primary subscription per Tenant ;
- entitlements ;
- simple limits ;
- invoice generation ;
- manual payment ;
- lifecycle ;
- diagnostics.

---

# 79. Hors MVP initial

À différer si non existant :
- usage-based charging complexe ;
- tiered pricing ;
- proration ;
- coupons ;
- automatic card payment ;
- complex refunds ;
- tax engine ;
- multiple concurrent subscriptions ;
- contract pricing.

---

# 80. Definition of Done

DONE si :
- Plans/Prices réels ;
- money precision sûre ;
- subscription lifecycle réel ;
- Entitlement Resolver réel ;
- IAM séparé ;
- tenant isolation ;
- quota/usage réels si activés ;
- usage idempotent ;
- invoices réelles ;
- payments clairement REAL/MANUAL/MOCK ;
- webhook sécurisé ;
- payment idempotent ;
- renewal/grace/suspend/reactivate ;
- no data deletion ;
- financial history immutable/auditable ;
- ERP via Hub ;
- no fake financial status ;
- tests/build/E2E verts.
