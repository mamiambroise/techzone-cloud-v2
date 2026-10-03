# CAHIER DES CHARGES --- TECHZONE CLOUD SUBSCRIPTION & BILLING

**CDC n°15**\
**Version :** 2.0 --- Architecture consolidée Techzone Cloud\
**Date :** Septembre 2026\
**Projet :** Techzone Cloud\
**Module :** Subscription & Billing\
**Statut :** Spécification fonctionnelle et technique\
**Principe :** Subscription & Billing gère les offres commerciales SaaS,
abonnements, droits commerciaux, consommation facturable, facturation et
paiements sans devenir l'autorité IAM ni dupliquer les fonctions métier
des autres modules.

------------------------------------------------------------------------

# 1. Objet

Subscription & Billing répond aux questions :

``` text
QUELLE OFFRE ?
→ Plan / Product / Pricing

QUI EST ABONNÉ ?
→ Tenant / Customer / Subscription

À QUOI A-T-IL DROIT COMMERCIALEMENT ?
→ Entitlements / Limits / Quotas

QU’A-T-IL CONSOMMÉ ?
→ Usage / Metering

QUE DOIT-IL PAYER ?
→ Billing / Invoice

A-T-IL PAYÉ ?
→ Payment / Payment Status

QUE SE PASSE-T-IL ENSUITE ?
→ Renewal / Grace Period / Suspension / Reactivation
```

------------------------------------------------------------------------

# 2. Position dans Techzone Cloud

``` text
AUTH + IAM + CONTEXT
        ↓
Tenant / Identity / Permissions
        ↓
SUBSCRIPTION & BILLING
Plans • Pricing • Subscription • Entitlements
Usage • Billing • Invoice • Payment
        ↓
MODULES TECHZONE CLOUD
Business Manager • UI Builder • Automation
Pack Manager • Runtime • Data • Integrations
        ↓
ERP / PAYMENT PROVIDERS
via contrats/adapters officiels
```

Subscription & Billing est transversal mais ne devient pas propriétaire
des données métier des autres modules.

------------------------------------------------------------------------

# 3. Responsabilités

Le module possède :

``` text
Product / Offer Catalog
Plans
Prices
Billing Cycles
Subscriptions
Subscription Items
Entitlements
Commercial Limits / Quotas
Usage Records
Meters
Billing Accounts
Invoices
Invoice Lines
Payments
Payment Attempts
Credits / Adjustments
Renewals
Grace Periods
Subscription Lifecycle
Billing Events
Billing Diagnostics
```

------------------------------------------------------------------------

# 4. Hors responsabilité

Subscription & Billing ne possède pas :

``` text
Identity / User / Roles / Permissions → IAM
Business Applications → Business Manager
Pack publication → Pack Manager
Runtime activation → Pack Runtime
Environment / Deployment → Deployment Manager
Business data → Data Platform / Runtime
ERP resources → ERP Adapter / Integration Hub
Logs/traces → Observability
Generic notifications → Notification capability
```

------------------------------------------------------------------------

# 5. Principe Entitlement ≠ Permission

Règle fondamentale :

``` text
SUBSCRIPTION
→ l'organisation a-t-elle acheté/obtenu la fonctionnalité ?

IAM
→ cet utilisateur précis est-il autorisé à l'utiliser ?
```

Accès effectif :

``` text
Entitlement
AND
IAM Authorization
AND
Tenant Context
AND
Module Availability
= Effective Access
```

Exemple :

``` text
Plan PRO
→ autorise Automation

Utilisateur A
→ permission automation.read

Utilisateur B
→ aucune permission Automation

Résultat :
A peut accéder selon ses permissions.
B reste interdit même si le Tenant paie PRO.
```

------------------------------------------------------------------------

# 6. Contexte SaaS

Contexte principal :

``` text
Tenant
↓
Billing Account
↓
Subscription
↓
Plan / Price
↓
Entitlements
↓
Usage
↓
Invoice
↓
Payment
```

Un Tenant peut avoir un Billing Account selon le modèle retenu.

Ne pas supposer automatiquement qu'un User individuel est le payeur.

------------------------------------------------------------------------

# 7. Product / Offer Catalog

Le catalogue décrit ce qui peut être commercialisé.

Concept :

``` text
Product
├── key
├── name
├── description
├── status
├── features
└── metadata
```

Un Product peut avoir plusieurs Plans ou Prices.

Le catalogue commercial ne doit pas dupliquer le Registry technique.

------------------------------------------------------------------------

# 8. Plans

Un Plan définit un ensemble commercial cohérent.

Exemples conceptuels :

``` text
FREE
STARTER
PRO
BUSINESS
ENTERPRISE
CUSTOM
```

Ces noms sont indicatifs uniquement.

Ne pas créer automatiquement ces offres si elles ne sont pas validées
commercialement.

Concept :

``` text
Plan
├── id
├── key
├── name
├── description
├── status
├── billingModel
├── entitlements
└── metadata
```

------------------------------------------------------------------------

# 9. Price

Séparer Plan et Price permet de modifier les prix sans réécrire
l'identité du Plan.

Concept :

``` text
Price
├── id
├── planId
├── currency
├── amount
├── interval
├── intervalCount
├── pricingModel
├── effectiveFrom
├── effectiveUntil?
└── status
```

------------------------------------------------------------------------

# 10. Devise

Le système doit gérer explicitement la devise.

Exemples possibles :

``` text
MGA
EUR
USD
```

Ne jamais supposer que toutes les offres utilisent la même devise.

Pour Madagascar, les montants MGA doivent éviter les erreurs d'arrondi.

Le stockage monétaire doit utiliser une représentation déterministe
adaptée, jamais un flottant imprécis.

------------------------------------------------------------------------

# 11. Billing Cycle

Cycles possibles selon offre :

``` text
MONTHLY
QUARTERLY
SEMI_ANNUAL
ANNUAL
CUSTOM
```

N'implémenter que les cycles réellement utilisés.

Concept :

``` text
billingPeriodStart
billingPeriodEnd
nextBillingAt
renewalAt
```

------------------------------------------------------------------------

# 12. Pricing Models

Architecture extensible :

``` text
FLAT
PER_SEAT
TIERED
USAGE_BASED
HYBRID
CUSTOM
```

MVP recommandé :

``` text
FLAT
```

puis ajouter les autres uniquement lorsque les besoins commerciaux
existent.

------------------------------------------------------------------------

# 13. Subscription

Concept :

``` text
Subscription
├── id
├── tenantId
├── billingAccountId
├── planId
├── priceId
├── status
├── startedAt
├── currentPeriodStart
├── currentPeriodEnd
├── trialEndsAt?
├── graceEndsAt?
├── cancelAt?
├── cancelledAt?
├── endedAt?
└── metadata
```

------------------------------------------------------------------------

# 14. Lifecycle Subscription

États conceptuels :

``` text
DRAFT
TRIALING
ACTIVE
PAST_DUE
GRACE_PERIOD
SUSPENDED
CANCELLED
EXPIRED
ENDED
```

Adapter aux états déjà existants.

Ne pas créer deux états ayant exactement la même signification.

------------------------------------------------------------------------

# 15. Transitions

Exemple :

``` text
DRAFT
↓
TRIALING
↓
ACTIVE
↓
PAST_DUE
↓
GRACE_PERIOD
↓
SUSPENDED
```

Après paiement valide :

``` text
PAST_DUE / GRACE_PERIOD / SUSPENDED
↓
ACTIVE
```

Annulation :

``` text
ACTIVE
↓
CANCELLED
↓
ENDED
```

selon politique `cancelImmediately` ou `cancelAtPeriodEnd`.

------------------------------------------------------------------------

# 16. Trial

Si utilisé :

``` text
trialStartsAt
trialEndsAt
trialEntitlements
conversionPolicy
```

Un Trial ne doit pas être simulé si aucune offre d'essai n'existe.

À expiration :

``` text
convert
expire
restrict
```

selon politique réelle.

------------------------------------------------------------------------

# 17. Entitlements

Un Entitlement représente un droit commercial.

Exemples :

``` text
business_manager.enabled
ui_builder.enabled
automation.enabled
runtime.enabled
integration.erp.enabled
deployment.enabled
api.enabled
```

Les clés doivent être stables et cohérentes avec les modules.

------------------------------------------------------------------------

# 18. Entitlement Types

Types conceptuels :

``` text
BOOLEAN
LIMIT
QUOTA
CAPABILITY
```

Exemples :

``` text
automation.enabled = true
applications.max = 5
users.max = 20
storage.gb = 50
api.requests.month = 100000
```

------------------------------------------------------------------------

# 19. Feature Availability

Résolution :

``` text
Tenant Subscription
↓
Plan
↓
Entitlements
↓
Overrides autorisés
↓
Effective Entitlements
```

Puis :

``` text
Effective Entitlement
+
IAM Permission
+
Runtime/Module Availability
→ Effective Feature Access
```

------------------------------------------------------------------------

# 20. Limits

Exemples :

``` text
maximum users
maximum applications
maximum environments
maximum workflows
maximum API clients
maximum storage
```

Chaque limite doit avoir :

``` text
stable key
unit
limit
current usage
enforcement policy
```

------------------------------------------------------------------------

# 21. Quotas

Une Quota est généralement liée à une période.

Exemple :

``` text
api.requests.month
automation.executions.month
data.storage.gb
integration.calls.month
```

Le système doit définir précisément :

``` text
measurement
period
reset
aggregation
overage behavior
```

------------------------------------------------------------------------

# 22. Metering

Le Metering collecte une consommation facturable ou limitée.

Pipeline :

``` text
SOURCE MODULE
↓
USAGE EVENT
↓
VALIDATION
↓
DEDUPLICATION
↓
METER
↓
AGGREGATION
↓
USAGE SUMMARY
↓
BILLING / QUOTA CHECK
```

------------------------------------------------------------------------

# 23. Usage Event

Concept :

``` text
eventId
tenantId
meterKey
quantity
unit
occurredAt
source
resourceId?
correlationId?
metadata?
```

`eventId` doit permettre l'idempotence.

------------------------------------------------------------------------

# 24. Meter

Concept :

``` text
Meter
├── key
├── name
├── unit
├── aggregation
├── period
└── status
```

Aggregations possibles :

``` text
SUM
MAX
COUNT
LAST
```

N'utiliser que celles justifiées.

------------------------------------------------------------------------

# 25. Sources d'usage

Exemples possibles :

``` text
IAM → active/registered seats
Business Manager → applications
Automation → executions
Data Platform → storage
API Manager → requests
Integration Hub → calls
Environment Manager → environments
```

Chaque module reste propriétaire de son événement source.

Billing ne doit pas recalculer arbitrairement les données internes d'un
autre module.

------------------------------------------------------------------------

# 26. Idempotence Usage

Le même événement ne doit pas être comptabilisé deux fois.

``` text
same eventId
→ same billing effect
```

Les imports/retries doivent être idempotents.

------------------------------------------------------------------------

# 27. Usage Aggregation

Agrégats :

``` text
tenant
meter
billing period
subscription
```

Exemple :

``` text
Tenant A
automation.executions.month
2026-09
18 425 executions
```

------------------------------------------------------------------------

# 28. Enforcement

Comportements possibles :

``` text
SOFT_LIMIT
HARD_LIMIT
OVERAGE
NOTIFY_ONLY
```

La politique doit être explicite.

Ne pas bloquer un service critique sans règle commerciale validée.

------------------------------------------------------------------------

# 29. Near-Limit

Le système peut produire :

``` text
50%
75%
90%
100%
```

ou seuils configurés.

Ces seuils sont des politiques, pas des valeurs codées en dur si
l'architecture prévoit leur configuration.

------------------------------------------------------------------------

# 30. Billing Account

Concept :

``` text
BillingAccount
├── id
├── tenantId
├── customerName
├── billingEmail
├── billingAddress?
├── taxInformation?
├── currency?
├── status
└── metadata
```

Séparer les données de facturation des données IAM.

------------------------------------------------------------------------

# 31. Billing Profile

Peut inclure :

``` text
legalName
billingContact
address
taxIdentifier
invoiceLanguage
paymentTerms
```

selon les besoins légaux/commerciaux réellement validés.

------------------------------------------------------------------------

# 32. Invoice

Concept :

``` text
Invoice
├── id
├── number
├── tenantId
├── billingAccountId
├── subscriptionId?
├── status
├── currency
├── subtotal
├── tax
├── discount
├── total
├── amountPaid
├── amountDue
├── issuedAt
├── dueAt
├── paidAt?
└── lines
```

------------------------------------------------------------------------

# 33. Invoice Status

Conceptuellement :

``` text
DRAFT
OPEN
PARTIALLY_PAID
PAID
OVERDUE
VOID
CANCELLED
```

Adapter aux besoins comptables réels.

------------------------------------------------------------------------

# 34. Invoice Lines

Une ligne doit expliquer le montant :

``` text
description
quantity
unitPrice
subtotal
tax
discount
total
sourceType
sourceRef?
period?
```

Exemples :

``` text
Plan mensuel
10 utilisateurs supplémentaires
Usage API
Crédit commercial
```

------------------------------------------------------------------------

# 35. Invoice Number

Le numéro doit être :

``` text
unique
stable
non ambigu
auditable
```

La règle de numérotation doit être configurée conformément aux besoins
administratifs/comptables retenus.

Ne pas modifier silencieusement le numéro d'une facture émise.

------------------------------------------------------------------------

# 36. Taxes

Prévoir une abstraction :

``` text
TaxRule
TaxRate
TaxAmount
TaxContext
```

Mais ne pas inventer des taux fiscaux.

Les règles fiscales réelles doivent être validées avant implémentation
production.

------------------------------------------------------------------------

# 37. Discounts

Concept :

``` text
Discount
├── type
├── value
├── duration
├── validFrom
├── validUntil
└── conditions
```

Types possibles :

``` text
PERCENTAGE
FIXED_AMOUNT
```

------------------------------------------------------------------------

# 38. Coupons / Promotions

Optionnel :

``` text
Coupon
Promotion
Promo Code
```

Ne pas construire un moteur marketing complet si le besoin est seulement
une remise manuelle.

------------------------------------------------------------------------

# 39. Credits

Crédit client :

``` text
Credit
├── amount
├── currency
├── reason
├── source
├── remainingAmount
└── expiresAt?
```

Toute utilisation doit être traçable.

------------------------------------------------------------------------

# 40. Adjustments

Ajustements possibles :

``` text
manual correction
commercial gesture
usage correction
billing correction
```

Ils doivent être autorisés et audités.

------------------------------------------------------------------------

# 41. Payment

Concept :

``` text
Payment
├── id
├── tenantId
├── invoiceId?
├── amount
├── currency
├── method
├── provider
├── providerReference?
├── status
├── paidAt?
└── metadata
```

------------------------------------------------------------------------

# 42. Payment Status

Concept :

``` text
PENDING
PROCESSING
SUCCEEDED
FAILED
CANCELLED
REFUNDED
PARTIALLY_REFUNDED
```

N'utiliser que les états réellement supportés.

------------------------------------------------------------------------

# 43. Payment Methods

Architecture extensible :

``` text
Mobile Money
Bank Transfer
Card
Cash / Manual
External Payment Gateway
```

Le support effectif dépend des providers réellement intégrés.

------------------------------------------------------------------------

# 44. Mobile Money

Pour un contexte Madagascar, l'architecture peut prévoir des adapters
Mobile Money.

Mais :

``` text
aucun provider
aucune API
aucun numéro marchand
aucun frais
```

ne doit être inventé dans le CDC technique.

Chaque intégration passe par un contrat provider.

------------------------------------------------------------------------

# 45. Payment Provider Adapter

Architecture :

``` text
Billing
↓
Payment Provider Contract
↓
Provider Adapter
↓
External Payment Service
```

Interface conceptuelle :

``` text
createPayment
getPaymentStatus
cancelPayment
refundPayment
verifyWebhook
```

selon capacité réelle du provider.

------------------------------------------------------------------------

# 46. Payment Attempt

Chaque tentative doit être traçable :

``` text
attemptId
paymentId
provider
startedAt
completedAt?
status
errorCode?
providerReference?
correlationId
```

------------------------------------------------------------------------

# 47. Idempotence Payment

Les opérations sensibles doivent utiliser une clé d'idempotence.

``` text
same payment request
+ same idempotency key
→ no duplicate charge
```

------------------------------------------------------------------------

# 48. Webhooks Payment

Pipeline :

``` text
PROVIDER
↓
WEBHOOK ENDPOINT
↓
AUTH / SIGNATURE VERIFICATION
↓
VALIDATION
↓
DEDUPLICATION
↓
PAYMENT RESOLUTION
↓
STATE TRANSITION
↓
INVOICE UPDATE
↓
SUBSCRIPTION EFFECT
↓
AUDIT / EVENT
```

Ne jamais faire confiance à un webhook non vérifié.

------------------------------------------------------------------------

# 49. Manual Payment

Pour virement/cash/Mobile Money non automatisé, prévoir si nécessaire :

``` text
record payment
reference
proof/reference metadata
validation
validatedBy
validatedAt
```

Une validation manuelle nécessite une permission IAM explicite.

------------------------------------------------------------------------

# 50. Renewal

Pipeline :

``` text
CURRENT PERIOD END
↓
RENEWAL POLICY
↓
CREATE BILLING PERIOD
↓
INVOICE
↓
PAYMENT
↓
SUCCESS
→ ACTIVE / NEW PERIOD
```

En cas d'échec :

``` text
PAST_DUE
→ GRACE_PERIOD
→ SUSPENDED
```

selon politique.

------------------------------------------------------------------------

# 51. Grace Period

Concept :

``` text
graceStartsAt
graceEndsAt
accessPolicy
notificationPolicy
```

La durée doit être configurable selon offre/politique.

Ne pas coder arbitrairement un nombre de jours.

------------------------------------------------------------------------

# 52. Suspension

Une suspension commerciale ne doit pas détruire les données du Tenant.

Effet possible :

``` text
subscription → SUSPENDED
entitlements → restricted
write operations → restricted according to policy
data → retained
admin/billing access → maintained as required
```

Le comportement exact doit être défini par entitlement/policy.

------------------------------------------------------------------------

# 53. Reactivation

Après paiement/régularisation :

``` text
PAYMENT VERIFIED
↓
SUBSCRIPTION VALIDATION
↓
REACTIVATE
↓
RECALCULATE ENTITLEMENTS
↓
INVALIDATE ENTITLEMENT CACHE
↓
EVENT
```

------------------------------------------------------------------------

# 54. Cancellation

Modes :

``` text
IMMEDIATE
END_OF_PERIOD
```

Conserver :

``` text
requestedAt
requestedBy
reason?
effectiveAt
```

Une annulation ne doit pas supprimer automatiquement les données métier.

------------------------------------------------------------------------

# 55. Upgrade

Flux :

``` text
CURRENT PLAN
↓
TARGET PLAN
↓
ELIGIBILITY
↓
PRICE IMPACT
↓
PRORATION POLICY
↓
CONFIRMATION
↓
SUBSCRIPTION UPDATE
↓
ENTITLEMENT RECALCULATION
```

------------------------------------------------------------------------

# 56. Downgrade

Avant downgrade :

``` text
check current usage
check target limits
detect incompatibilities
```

Exemple :

``` text
current apps = 10
target max apps = 5
```

Le système doit appliquer une politique explicite, pas supprimer
automatiquement cinq applications.

------------------------------------------------------------------------

# 57. Proration

Si utilisée :

``` text
unused current plan credit
+
remaining target plan charge
=
prorated adjustment
```

La règle doit être déterministe, testée et affichable.

Si non requise en MVP, ne pas la simuler.

------------------------------------------------------------------------

# 58. Subscription Overrides

Pour contrat spécifique :

``` text
Plan
+
Tenant Override
=
Effective Entitlements
```

Override doit être :

``` text
explicit
scoped
dated
audited
```

------------------------------------------------------------------------

# 59. Commercial Contracts

Pour Enterprise/Custom, possibilité de référencer :

``` text
contractRef
customPrice
customLimits
effectiveFrom
effectiveUntil
```

Le système Billing ne remplace pas un outil de gestion documentaire
juridique.

------------------------------------------------------------------------

# 60. Effective Entitlement Resolver

Pipeline :

``` text
TENANT
↓
ACTIVE SUBSCRIPTION
↓
PLAN
↓
PRICE / CONTRACT
↓
BASE ENTITLEMENTS
↓
VALID OVERRIDES
↓
USAGE / LIMIT STATE
↓
EFFECTIVE ENTITLEMENTS
```

Sortie conceptuelle :

``` text
key
enabled
limit?
used?
remaining?
source
validUntil?
status
```

------------------------------------------------------------------------

# 61. Entitlement Cache

Peut être mis en cache.

Invalidation lors de :

``` text
subscription activated
subscription suspended
subscription cancelled
plan changed
override changed
payment effect
quota reset
usage crosses enforced limit
```

Aucun entitlement révoqué ne doit rester actif par cache obsolète.

------------------------------------------------------------------------

# 62. Integration IAM

IAM fournit :

``` text
identity
tenant
permission
context
```

Billing fournit :

``` text
commercial entitlement
```

Exemple :

``` text
IAM: automation.execute = ALLOW
Billing: automation.enabled = FALSE

Effective result:
feature unavailable commercially
```

Inversement :

``` text
Billing: automation.enabled = TRUE
IAM: automation.execute = DENY

Effective result:
access denied
```

------------------------------------------------------------------------

# 63. Integration Sidebar

La Sidebar peut masquer/désactiver une fonction non incluse dans
l'abonnement pour améliorer l'UX.

Mais l'API doit également vérifier l'Entitlement.

``` text
UI gating ≠ backend enforcement
```

------------------------------------------------------------------------

# 64. Integration Dashboard

Dashboard peut afficher :

``` text
Current Plan
Subscription Status
Next Billing Date
Usage Summary
Invoices Due
Payment Status
Quota Alerts
```

uniquement avec données réelles.

------------------------------------------------------------------------

# 65. Integration Business Manager

Exemples d'entitlements :

``` text
business_manager.enabled
applications.max
application_versions.max?
```

Ne pas créer une limite si elle n'existe pas commercialement.

------------------------------------------------------------------------

# 66. Integration UI Builder

Exemples :

``` text
ui_builder.enabled
ui.pages.max?
premium_components.enabled?
```

Les composants premium ne doivent être modélisés que si le catalogue
commercial les prévoit.

------------------------------------------------------------------------

# 67. Integration Automation

Exemples :

``` text
automation.enabled
automation.workflows.max
automation.executions.month
```

Usage event possible :

``` text
automation.execution.completed
→ billing meter
```

Le comptage exact doit définir quels statuts sont facturables.

------------------------------------------------------------------------

# 68. Integration Pack Manager / Runtime

Possibles entitlements :

``` text
packs.max
published_versions.max?
runtime.enabled
```

La suspension commerciale ne doit jamais corrompre un Runtime Context.

Elle doit passer par une politique de restriction contrôlée.

------------------------------------------------------------------------

# 69. Integration Data Platform

Exemples :

``` text
data.enabled
storage.gb
data_sources.max
```

Les valeurs réelles proviennent du Data Platform/Runtime.

------------------------------------------------------------------------

# 70. Integration API Manager

Exemples :

``` text
api.enabled
api.clients.max
api.requests.month
```

API Manager produit l'usage ; Billing agrège et applique le contrat
commercial.

------------------------------------------------------------------------

# 71. Integration ERP / Integration Hub

Billing peut :

``` text
export invoice
sync customer
sync payment
retrieve accounting reference
```

uniquement via Integration Hub / ERP Adapter.

Interdit :

``` text
Billing → DB Dolibarr directe
```

------------------------------------------------------------------------

# 72. Invoice vs ERP Invoice

La facture Billing Techzone Cloud et une facture ERP ne doivent pas être
confondues implicitement.

Si l'ERP est système comptable de référence :

``` text
Billing Invoice
↓
Integration Contract
↓
ERP Invoice
↓
ExternalResourceLink
```

Définir clairement quel système est source de vérité pour chaque champ.

------------------------------------------------------------------------

# 73. Integration Registry

Registry peut exposer les capacités techniques :

``` text
billing.provider.*
payment.provider.*
meter.*
```

Billing reste propriétaire des règles commerciales.

------------------------------------------------------------------------

# 74. Integration Environment / Deployment

Un entitlement peut conditionner :

``` text
number of environments
production deployment capability
advanced deployment features
```

uniquement si commercialement prévu.

Deployment Manager reste propriétaire de l'exécution du déploiement.

------------------------------------------------------------------------

# 75. Integration Observability

Billing émet :

``` text
logs
metrics
traces
diagnostics
correlation IDs
```

Exemples metrics :

``` text
subscriptions_active
subscriptions_past_due
invoices_open
payments_failed
payment_success_rate
usage_events_processed
usage_events_rejected
webhook_failures
```

Pas de données bancaires/secrets dans les labels.

------------------------------------------------------------------------

# 76. Billing Events

Catalogue possible :

``` text
subscription.created
subscription.activated
subscription.plan_changed
subscription.past_due
subscription.suspended
subscription.reactivated
subscription.cancelled
subscription.ended

invoice.created
invoice.issued
invoice.overdue
invoice.paid
invoice.voided

payment.created
payment.succeeded
payment.failed
payment.refunded

usage.recorded
quota.warning
quota.exceeded
```

Éviter les événements redondants sans consommateur.

------------------------------------------------------------------------

# 77. Automation Integration

Automation peut réagir aux événements Billing :

``` text
invoice.overdue
payment.succeeded
quota.warning
subscription.suspended
```

Exemples :

``` text
payment.succeeded
→ envoyer notification
```

``` text
quota.warning
→ notifier administrateur Tenant
```

Automation ne doit pas modifier directement une facture sans commande
Billing autorisée.

------------------------------------------------------------------------

# 78. Notifications

Notifications possibles :

``` text
trial ending
renewal approaching
invoice issued
invoice due
payment success
payment failure
grace period
subscription suspended
quota warning
```

Billing produit l'événement.

La plateforme de notification gère le canal si elle existe.

------------------------------------------------------------------------

# 79. Audit

Auditer :

``` text
plan creation/update
price change
subscription activation
plan change
override
manual payment validation
invoice adjustment
refund
suspension
reactivation
cancellation
```

Champs :

``` text
actor
tenant
action
resource
before?
after?
reason?
traceId
timestamp
```

------------------------------------------------------------------------

# 80. Permissions IAM

Exemples conceptuels :

``` text
billing.read
billing.manage
billing.plan.read
billing.plan.manage
billing.subscription.read
billing.subscription.manage
billing.invoice.read
billing.invoice.manage
billing.payment.read
billing.payment.record
billing.payment.refund
billing.usage.read
billing.override.manage
```

Réutiliser les conventions réelles du Permission Registry.

------------------------------------------------------------------------

# 81. Rôles

Ne pas hardcoder des rôles Billing si IAM possède déjà le modèle de
rôles.

Profils fonctionnels possibles :

``` text
Tenant Admin
Billing Admin
Billing Viewer
Platform Billing Admin
```

Ils sont des exemples de configuration, pas une seconde implémentation
RBAC.

------------------------------------------------------------------------

# 82. Multi-Tenant

Toutes les données doivent être scoped.

``` text
Tenant A
≠
Tenant B
```

Tester particulièrement :

``` text
subscriptions
usage
invoices
payments
billing profiles
entitlements
```

------------------------------------------------------------------------

# 83. Platform Scope

Les Plans/Pricing peuvent être :

``` text
PLATFORM GLOBAL
```

alors que :

``` text
Subscription
Invoice
Payment
Usage
```

sont tenant-scoped.

Cette différence doit être explicite.

------------------------------------------------------------------------

# 84. API conceptuelle

Adapter aux endpoints existants.

``` http
GET    /api/billing/plans
POST   /api/billing/plans
GET    /api/billing/prices

GET    /api/billing/subscription
POST   /api/billing/subscriptions
PATCH  /api/billing/subscriptions/:id
POST   /api/billing/subscriptions/:id/cancel
POST   /api/billing/subscriptions/:id/reactivate
POST   /api/billing/subscriptions/:id/change-plan

GET    /api/billing/entitlements
GET    /api/billing/usage
POST   /api/billing/usage/events

GET    /api/billing/invoices
GET    /api/billing/invoices/:id

GET    /api/billing/payments
POST   /api/billing/payments
POST   /api/billing/payments/:id/refund

POST   /api/billing/webhooks/:provider
```

Ne pas créer des doublons si l'API actuelle est stable.

------------------------------------------------------------------------

# 85. Backend Modules

Découpage indicatif :

``` text
BillingModule
├── Catalog
├── Plans
├── Pricing
├── Subscriptions
├── Entitlements
├── Usage
├── Invoices
├── Payments
├── Providers
├── Webhooks
└── Diagnostics
```

Adapter à la structure NestJS existante.

------------------------------------------------------------------------

# 86. Modèles conceptuels Prisma

À auditer avant création :

``` text
BillingProduct
BillingPlan
BillingPrice
BillingAccount
Subscription
SubscriptionItem
EntitlementDefinition
PlanEntitlement
SubscriptionOverride
Meter
UsageEvent
UsageAggregate
Invoice
InvoiceLine
Payment
PaymentAttempt
Credit
Adjustment
BillingEvent
BillingDiagnostic
```

Ne pas créer toutes ces tables aveuglément.

------------------------------------------------------------------------

# 87. UI --- Sidebar

Dans la Sidebar globale :

``` text
PLATEFORME
├── Registry
├── Environnements
├── Déploiements
├── Sécurité & IAM
├── Observabilité
├── Abonnements
└── Administration
```

Le menu global reste simplement :

``` text
Abonnements
```

Le workspace interne peut gérer Billing.

------------------------------------------------------------------------

# 88. UI --- Workspace Subscription & Billing

Structure proposée :

``` text
Abonnements
├── Vue d'ensemble
├── Offre actuelle
├── Utilisation
├── Factures
├── Paiements
└── Paramètres de facturation
```

Pour Platform Admin :

``` text
Administration Billing
├── Catalogue
├── Plans
├── Tarification
├── Abonnements
├── Factures
├── Paiements
├── Usage
└── Diagnostics
```

Ne pas exposer l'administration globale à un Tenant ordinaire.

------------------------------------------------------------------------

# 89. Vue d'ensemble Tenant

Afficher :

``` text
Current Plan
Subscription Status
Billing Period
Next Billing Date
Amount Due
Usage / Limits
Recent Invoices
Recent Payments
Alerts
```

Données réelles uniquement.

------------------------------------------------------------------------

# 90. Offre actuelle

Afficher :

``` text
Plan
Price
Cycle
Included Features
Limits
Effective Entitlements
Renewal
Cancellation State
```

Les droits commerciaux doivent être compréhensibles par le client.

------------------------------------------------------------------------

# 91. Usage

Présentation :

``` text
Metric
Used
Included
Remaining
Period
Status
```

Exemple :

``` text
Automation executions
18 425
25 000
6 575
Sep 2026
OK
```

Uniquement si cette métrique est réellement mesurée.

------------------------------------------------------------------------

# 92. Invoices UI

Fonctions :

``` text
list
filter
detail
status
amount
issued date
due date
download if document exists
payment linkage
```

Ne pas afficher un bouton PDF si aucun document n'est réellement généré.

------------------------------------------------------------------------

# 93. Payments UI

Afficher :

``` text
amount
method
status
date
invoice
provider/reference
```

Les références sensibles doivent être masquées si nécessaire.

------------------------------------------------------------------------

# 94. Admin Plan Builder

Permet :

``` text
create/edit draft plan
attach price
configure entitlements
configure limits
validate
activate
archive
```

Une modification de Plan utilisé ne doit pas rétroactivement altérer un
contrat historique sans politique explicite.

------------------------------------------------------------------------

# 95. Versioning Pricing

Les Prices publiés/actifs utilisés historiquement doivent rester
référencables.

Préférer :

``` text
old price → inactive
new price → new record/version
```

plutôt qu'écraser l'historique financier.

------------------------------------------------------------------------

# 96. Historical Integrity

Une facture payée doit conserver :

``` text
price
quantity
tax
discount
total
currency
```

même si le catalogue commercial change ensuite.

------------------------------------------------------------------------

# 97. Financial Precision

Obligatoire :

``` text
deterministic decimal/integer monetary representation
currency-aware
no binary floating-point calculation for money
```

Tester tous les arrondis.

------------------------------------------------------------------------

# 98. Time & Billing Period

Utiliser des dates/timezones déterministes.

Le début/fin de période doit être clairement défini.

Tester :

``` text
month length
year transition
leap year
timezone
renewal boundary
```

------------------------------------------------------------------------

# 99. Concurrency

Protéger :

``` text
double payment
double webhook
double renewal
simultaneous plan change
payment + cancellation race
quota event replay
```

Utiliser :

``` text
transactions
unique constraints
idempotency keys
optimistic/pessimistic control
```

selon besoin.

------------------------------------------------------------------------

# 100. Error Contract

Réutiliser le contrat d'erreur global Techzone Cloud.

Codes conceptuels :

``` text
PLAN_NOT_FOUND
PRICE_NOT_FOUND
SUBSCRIPTION_NOT_FOUND
SUBSCRIPTION_NOT_ACTIVE
SUBSCRIPTION_ALREADY_CANCELLED
ENTITLEMENT_NOT_AVAILABLE
LIMIT_EXCEEDED
USAGE_EVENT_DUPLICATE
INVOICE_NOT_FOUND
INVOICE_ALREADY_PAID
PAYMENT_NOT_FOUND
PAYMENT_FAILED
PAYMENT_PROVIDER_UNAVAILABLE
PAYMENT_WEBHOOK_INVALID
PAYMENT_DUPLICATE
REFUND_NOT_ALLOWED
BILLING_CONFIGURATION_INVALID
```

Chaque erreur possède `traceId`.

------------------------------------------------------------------------

# 101. Diagnostics

Diagnostics :

``` text
Subscription Resolver
Entitlement Resolver
Metering
Invoice Generation
Payment Provider
Webhook
Renewal
ERP Sync
```

Afficher :

``` text
stage
status
code
message
resource
timestamp
correlationId
safe details
```

------------------------------------------------------------------------

# 102. Health

Séparer :

``` text
Billing Process Health
Billing DB Health
Entitlement Resolver Health
Payment Provider Health
Webhook Processing Health
ERP Sync Health
```

Un provider externe indisponible ne doit pas automatiquement signifier
que toute l'application Techzone Cloud est down.

------------------------------------------------------------------------

# 103. Security

Exigences :

``` text
IAM authorization
strict tenant isolation
provider signature verification
idempotency
secret management
safe logs
no card secrets
no raw credentials
no payment token leakage
audit
```

------------------------------------------------------------------------

# 104. PCI / Sensitive Payment Data

Si un provider carte est intégré, privilégier une architecture où
Techzone Cloud ne stocke pas les données carte sensibles.

Ne jamais stocker sans nécessité :

``` text
full card number
CVV
provider secret
raw authentication payload
```

Les exigences de conformité dépendent du provider et du mode
d'intégration retenu.

------------------------------------------------------------------------

# 105. Retention

Définir des politiques distinctes pour :

``` text
usage events
invoices
payments
webhook payloads
diagnostics
audit
```

Ne pas supprimer arbitrairement les documents financiers historiques.

------------------------------------------------------------------------

# 106. Business Rules

**RG-BILL-001** --- Subscription & Billing est tenant-aware.\
**RG-BILL-002** --- Entitlement et Permission IAM sont distincts.\
**RG-BILL-003** --- L'accès effectif exige entitlement et autorisation
lorsque les deux s'appliquent.\
**RG-BILL-004** --- Un Plan n'est pas une Permission.\
**RG-BILL-005** --- Un Price est séparé du Plan.\
**RG-BILL-006** --- Les montants utilisent une précision déterministe.\
**RG-BILL-007** --- Toute donnée monétaire possède une devise.\
**RG-BILL-008** --- Les Prices historiques nécessaires restent
traçables.\
**RG-BILL-009** --- Une facture émise ne change pas silencieusement avec
le catalogue.\
**RG-BILL-010** --- Les taxes ne sont jamais inventées par le système.\
**RG-BILL-011** --- Les événements Usage sont idempotents.\
**RG-BILL-012** --- Une consommation n'est comptée qu'une fois.\
**RG-BILL-013** --- Chaque Meter possède une unité et une agrégation
explicites.\
**RG-BILL-014** --- Les quotas ont une période et une politique
d'enforcement explicites.\
**RG-BILL-015** --- Un dépassement ne bloque pas arbitrairement un
service sans policy.\
**RG-BILL-016** --- Une suspension commerciale ne supprime pas les
données métier.\
**RG-BILL-017** --- Une réactivation recalcule les entitlements.\
**RG-BILL-018** --- Un downgrade incompatible ne supprime pas
automatiquement les ressources excédentaires.\
**RG-BILL-019** --- Une annulation est traçable.\
**RG-BILL-020** --- Une modification sensible est auditée.\
**RG-BILL-021** --- Les opérations Payment critiques sont idempotentes.\
**RG-BILL-022** --- Un webhook non vérifié ne modifie jamais un
Payment.\
**RG-BILL-023** --- Un Payment provider externe est encapsulé derrière
un Adapter.\
**RG-BILL-024** --- Billing n'accède jamais directement à la DB ERP.\
**RG-BILL-025** --- La synchronisation ERP passe par Integration Hub.\
**RG-BILL-026** --- Une facture Billing et une facture ERP ont un
mapping explicite.\
**RG-BILL-027** --- Les données Tenant sont strictement isolées.\
**RG-BILL-028** --- Le frontend ne constitue pas la barrière
d'entitlement.\
**RG-BILL-029** --- Les APIs contrôlent les entitlements applicables.\
**RG-BILL-030** --- Les permissions Billing sont contrôlées par IAM.\
**RG-BILL-031** --- Les secrets Provider ne sont jamais exposés au
frontend.\
**RG-BILL-032** --- Les logs ne contiennent pas de secrets de paiement.\
**RG-BILL-033** --- Chaque erreur critique est corrélable.\
**RG-BILL-034** --- Un Trial n'existe que s'il est réellement
configuré.\
**RG-BILL-035** --- Une Grace Period est explicitement configurée.\
**RG-BILL-036** --- Les entitlements révoqués invalident les caches
concernés.\
**RG-BILL-037** --- Le Dashboard n'invente aucun KPI financier.\
**RG-BILL-038** --- Les états Payment reflètent une information réelle
du système/provider.\
**RG-BILL-039** --- Aucun fallback Payment silencieux n'est autorisé.\
**RG-BILL-040** --- Aucun mock Billing/Payment n'est utilisé
silencieusement en REAL.

------------------------------------------------------------------------

# 107. Tests unitaires

Tester :

``` text
Plan
Price
Subscription lifecycle
Entitlement resolution
Limit resolution
Usage deduplication
Meter aggregation
Invoice calculation
Discount
Credit
Payment state transitions
Renewal
Grace Period
Suspension
Reactivation
Cancellation
Upgrade/Downgrade
Proration if implemented
currency precision
```

------------------------------------------------------------------------

# 108. Tests d'intégration

``` text
Tenant
→ Subscription
→ Entitlements
→ IAM
→ Feature Access
```

``` text
Usage Event
→ Meter
→ Aggregate
→ Limit
→ Entitlement State
```

``` text
Invoice
→ Payment
→ Webhook
→ Paid
→ Subscription
```

``` text
Billing
→ Integration Hub
→ ERP
```

------------------------------------------------------------------------

# 109. Tests sécurité

Tester :

``` text
cross-tenant subscription
cross-tenant invoice
cross-tenant payment
forged tenantId
unauthorized plan management
unauthorized manual payment
duplicate payment
duplicate webhook
invalid signature
replayed webhook
tampered amount
currency mismatch
provider secret leakage
entitlement bypass
frontend-only gating bypass
```

------------------------------------------------------------------------

# 110. E2E --- Subscription

``` text
CREATE/SELECT PLAN
↓
CREATE SUBSCRIPTION
↓
ACTIVATE
↓
RESOLVE ENTITLEMENTS
↓
IAM CHECK
↓
FEATURE AVAILABLE
```

------------------------------------------------------------------------

# 111. E2E --- Billing

``` text
ACTIVE SUBSCRIPTION
↓
BILLING PERIOD
↓
GENERATE INVOICE
↓
PAYMENT
↓
VERIFIED SUCCESS
↓
INVOICE PAID
↓
SUBSCRIPTION REMAINS ACTIVE
```

------------------------------------------------------------------------

# 112. E2E --- Failed Payment

``` text
INVOICE DUE
↓
PAYMENT FAILED
↓
PAST_DUE
↓
GRACE PERIOD
↓
NO PAYMENT
↓
SUSPENDED
↓
ENTITLEMENT RECALCULATION
```

selon politique configurée.

------------------------------------------------------------------------

# 113. E2E --- Reactivation

``` text
SUSPENDED
↓
PAYMENT VERIFIED
↓
REACTIVATE
↓
ENTITLEMENTS RECALCULATED
↓
CACHE INVALIDATED
↓
FEATURE ACCESS RESTORED
```

------------------------------------------------------------------------

# 114. E2E --- Usage Limit

``` text
USAGE EVENTS
↓
METER
↓
90% LIMIT
↓
QUOTA WARNING
↓
100%
↓
POLICY
↓
SOFT / HARD / OVERAGE
```

------------------------------------------------------------------------

# 115. Recette navigateur

Tester :

``` text
Subscription Overview
Current Plan
Usage
Invoices
Invoice Detail
Payments
Billing Settings
Upgrade/Downgrade if implemented
Cancellation
Platform Plan Admin
Subscription Admin
Billing Diagnostics
```

États :

``` text
loading
empty
error
forbidden
unavailable
past due
grace
suspended
paid
overdue
```

------------------------------------------------------------------------

# 116. Gap Matrix obligatoire

  Domaine         Exigence                 Existant   État   Décision           Tests
  --------------- ------------------------ ---------- ------ ------------------ -------
  Catalog         Products/Plans           ...        ...    KEEP/IMPROVE/...   ...
  Pricing         Prices/Currency          ...        ...    ...                ...
  Subscription    Lifecycle                ...        ...    ...                ...
  Entitlement     Resolver                 ...        ...    ...                ...
  Limits          Limits/Quotas            ...        ...    ...                ...
  Usage           Metering                 ...        ...    ...                ...
  Invoice         Generation               ...        ...    ...                ...
  Payment         Payments                 ...        ...    ...                ...
  Provider        Adapters                 ...        ...    ...                ...
  Webhook         Verification             ...        ...    ...                ...
  Renewal         Renewal/Grace            ...        ...    ...                ...
  IAM             Permissions              ...        ...    ...                ...
  ERP             Integration Hub          ...        ...    ...                ...
  Observability   Metrics/Diagnostics      ...        ...    ...                ...
  UI              Tenant Billing           ...        ...    ...                ...
  UI              Platform Billing Admin   ...        ...    ...                ...

Ne jamais déclarer une fonction absente avant recherche réelle du
projet.

------------------------------------------------------------------------

# 117. Plan d'implémentation recommandé

``` text
PHASE 0
Audit + Gap Matrix

PHASE 1
Billing foundation + money/currency contracts

PHASE 2
Catalog + Plans + Prices

PHASE 3
Subscriptions + lifecycle

PHASE 4
Entitlements + Resolver + cache

PHASE 5
Limits + Usage + Metering

PHASE 6
Invoices

PHASE 7
Payments + Provider Adapter + Webhooks

PHASE 8
Renewal + Grace + Suspension + Reactivation

PHASE 9
IAM + Sidebar + Dashboard integration

PHASE 10
ERP / Integration Hub integration

PHASE 11
Observability + Diagnostics + Audit

PHASE 12
UI/UX

PHASE 13
Tests + Security + E2E + Browser Recipe
```

------------------------------------------------------------------------

# 118. MVP recommandé

Le MVP doit privilégier :

``` text
Plan Catalog
Flat Pricing
Subscription
Active/Suspended/Cancelled lifecycle
Boolean + Limit Entitlements
Effective Entitlement Resolver
Simple Usage Counters where needed
Invoice
Manual Payment
Payment status
Renewal basic
Grace policy
IAM integration
Dashboard/Sidebar integration
Audit
Diagnostics
```

Les fonctionnalités complexes suivantes peuvent venir ensuite :

``` text
Usage-based charging
Tiered pricing
Proration
Coupons
Automated card payment
Advanced refunds
Tax engine
Multiple subscriptions
Complex contract pricing
```

------------------------------------------------------------------------

# 119. Definition of Done

Le CDC n°15 est considéré implémenté lorsque :

-   catalogue réel ;
-   Plans réels ;
-   Prices réels ;
-   devise et précision monétaire correctes ;
-   Subscription lifecycle réel ;
-   Entitlements réels ;
-   Entitlement Resolver fonctionnel ;
-   IAM et Entitlements correctement séparés ;
-   tenant isolation stricte ;
-   Limits/Quotas réels si activés ;
-   Metering réel si utilisé ;
-   idempotence Usage ;
-   factures réelles ;
-   lignes de facture explicables ;
-   paiements réels ou manuels clairement identifiés ;
-   providers encapsulés ;
-   webhooks vérifiés ;
-   idempotence Payment ;
-   renouvellement réel ;
-   Grace/Suspension/Reactivation cohérentes ;
-   aucun effacement de données lors d'une suspension ;
-   historique financier conservé ;
-   audit réel ;
-   Observability/Diagnostics réels ;
-   Sidebar intégrée ;
-   Dashboard intégré ;
-   UI Tenant fonctionnelle ;
-   UI Platform Admin sécurisée ;
-   ERP uniquement via Integration Hub ;
-   aucun faux prix/facture/paiement/statut ;
-   aucun mock silencieux en REAL ;
-   Prisma validate/generate passe si schéma modifié ;
-   backend build passe ;
-   frontend build passe ;
-   tests unitaires passent ;
-   tests sécurité passent ;
-   tests intégration passent ;
-   E2E passent ;
-   recette navigateur passe.

------------------------------------------------------------------------

# 120. Principe final

``` text
PLAN
Que vend Techzone Cloud ?
↓
PRICE
À quel prix et selon quel cycle ?
↓
SUBSCRIPTION
À quoi le Tenant est-il abonné ?
↓
ENTITLEMENTS
Quelles capacités commerciales possède-t-il ?
↓
IAM
Quel utilisateur peut réellement les utiliser ?
↓
USAGE
Quelle quantité est consommée ?
↓
INVOICE
Quel montant est dû ?
↓
PAYMENT
Le paiement est-il réellement confirmé ?
↓
LIFECYCLE
Renouveler • Grace • Suspendre • Réactiver
```

Règle d'architecture :

``` text
SUBSCRIPTION ≠ IAM
ENTITLEMENT ≠ PERMISSION
BILLING ≠ ERP
PAYMENT ≠ INVOICE
USAGE ≠ BUSINESS DATA
```

Règle de développement :

``` text
AUDIT
→ GAP MATRIX
→ PRESERVE
→ COMPLETE
→ CONNECT IAM
→ METER
→ BILL
→ PAY
→ OBSERVE
→ TEST
```
