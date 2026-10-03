# CAHIER DES CHARGES --- TECHZONE CLOUD ADMINISTRATION PLATFORM

**CDC n°16**\
**Version :** 2.0 --- Architecture consolidée Techzone Cloud\
**Date :** Septembre 2026\
**Projet :** Techzone Cloud\
**Module :** Administration Platform\
**Statut :** Spécification fonctionnelle et technique\
**Principe :** Administration Platform est la console de gouvernance et
d'exploitation administrative de Techzone Cloud. Elle administre la
plateforme sans devenir propriétaire des données métier, de l'IAM, du
Billing, du Runtime, des intégrations ou de l'Observability.

------------------------------------------------------------------------

# 1. Objet

Administration Platform fournit aux administrateurs autorisés un espace
central permettant de :

``` text
GOUVERNER LA PLATEFORME
→ paramètres globaux
→ configuration système
→ politiques plateforme

ADMINISTRER LES TENANTS
→ consultation
→ état
→ configuration
→ opérations contrôlées

SUPERVISER LES MODULES
→ disponibilité
→ configuration
→ capacités

GÉRER LES RÉFÉRENTIELS TRANSVERSAUX
→ feature flags
→ paramètres
→ providers
→ templates

PILOTER LES OPÉRATIONS ADMINISTRATIVES
→ maintenance
→ jobs
→ migrations
→ diagnostics

AUDITER LES ACTIONS
→ qui
→ quoi
→ quand
→ résultat
```

------------------------------------------------------------------------

# 2. Position dans l'architecture

``` text
                    TECHZONE CLOUD
                         │
        ┌────────────────┼────────────────┐
        │                │                │
     MODULES          PLATFORM        OPERATIONS
        │                │                │
        └────────────────┼────────────────┘
                         ↓
              ADMINISTRATION PLATFORM
                         ↓
          GOVERNANCE • CONFIGURATION
           TENANTS • MODULES • POLICIES
             JOBS • MAINTENANCE
                         ↓
               IAM • AUDIT • OBSERVABILITY
```

Administration Platform orchestre des actions administratives via les
APIs officielles des modules propriétaires.

------------------------------------------------------------------------

# 3. Principe de non-duplication

Administration Platform ne doit pas devenir un « super module »
contenant toute la logique Techzone Cloud.

Règle :

``` text
ADMINISTRATION
→ configure
→ gouverne
→ orchestre
→ supervise
→ référence

MODULE PROPRIÉTAIRE
→ possède
→ valide
→ exécute
→ persiste son domaine
```

Exemples :

``` text
Administration peut suspendre un Tenant
mais ne remplace pas IAM/Context.

Administration peut modifier une politique Billing
mais ne remplace pas Subscription & Billing.

Administration peut demander une maintenance Runtime
mais ne remplace pas Pack Runtime.

Administration peut afficher des diagnostics
mais ne remplace pas Observability.
```

------------------------------------------------------------------------

# 4. Responsabilités

Administration Platform couvre :

``` text
Platform Overview
Platform Settings
Tenant Administration
Module Administration
Feature Flags
Configuration Registry
Provider Configuration
Platform Policies
Reference Data
Templates
System Jobs
Maintenance
Operational Tools
Data Governance Controls
Administrative Diagnostics
Platform Audit Access
System Information
```

------------------------------------------------------------------------

# 5. Hors responsabilité

Le module ne possède pas :

``` text
Users / Roles / Permissions       → Auth + IAM + Context
Subscriptions / Invoices          → Subscription & Billing
Business Applications             → Business Manager
UI Definitions                    → UI Builder
Workflows                         → Automation
Packs                             → Pack Manager
Runtime Contexts                  → Pack Runtime
Business Data                     → Data Platform / Runtime
ERP Connectors                    → Integration Hub
API Clients                       → API & Integration Manager
Deployments                       → Deployment Manager
Logs / Metrics / Alerts           → Observability
Registry Entries métier/techniques→ modules propriétaires + Registry
```

------------------------------------------------------------------------

# 6. Utilisateurs cibles

Profils conceptuels :

``` text
Platform Administrator
Platform Operator
Security Administrator
Billing Administrator
Support Operator
Read-Only Auditor
Tenant Administrator
```

Ces profils ne doivent pas être hardcodés comme second système RBAC.

Ils doivent être construits avec :

``` text
IAM Roles
+
IAM Permissions
+
Platform Scope
```

------------------------------------------------------------------------

# 7. Scopes administratifs

Séparer strictement :

``` text
PLATFORM
TENANT
MODULE
RESOURCE
```

Un administrateur Tenant ne devient jamais automatiquement
administrateur plateforme.

Un Platform Operator ne doit pas nécessairement disposer des permissions
Security/Billing.

------------------------------------------------------------------------

# 8. Navigation globale

Conserver la structure :

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

Ne pas dupliquer les modules sous Administration.

------------------------------------------------------------------------

# 9. Workspace Administration

Structure proposée :

``` text
Administration
├── Vue d’ensemble
├── Tenants
├── Modules
├── Configuration
├── Feature Flags
├── Providers
├── Politiques
├── Référentiels
├── Tâches système
├── Maintenance
├── Diagnostics
└── Informations système
```

Les sous-écrans peuvent être adaptés à l'existant.

------------------------------------------------------------------------

# 10. Platform Overview

Le cockpit administratif agrège uniquement des informations réelles :

``` text
Platform Status
Active Tenants
Configured Modules
Degraded Modules
Open Critical Alerts
Failed System Jobs
Maintenance State
Platform Version
```

Chaque indicateur doit deep-linker vers son propriétaire.

Aucun KPI fictif.

------------------------------------------------------------------------

# 11. Platform Settings

Gère des paramètres transversaux réellement administrables.

Exemples :

``` text
platform.name
platform.defaultLocale
platform.defaultTimezone
platform.supportContact
platform.maintenanceMode
```

Ne pas transformer toutes les variables techniques en paramètres
modifiables.

------------------------------------------------------------------------

# 12. Configuration Registry

Chaque paramètre administrable doit être décrit.

Concept :

``` text
key
namespace
name
description
type
scope
defaultValue?
validationSchema
sensitive
mutable
restartRequired
ownerModule
```

Types :

``` text
STRING
NUMBER
BOOLEAN
ENUM
JSON
SECRET_REF
```

------------------------------------------------------------------------

# 13. Ownership Configuration

Chaque clé possède un owner.

Exemple :

``` text
iam.*          → IAM
billing.*      → Subscription & Billing
runtime.*      → Pack Runtime
deployment.*   → Deployment
observability.*→ Observability
platform.*     → Administration Platform
```

Administration peut fournir l'interface de configuration sans prendre
ownership du comportement.

------------------------------------------------------------------------

# 14. Configuration Scope

Scopes possibles :

``` text
PLATFORM
TENANT
ENVIRONMENT
APPLICATION
MODULE
```

Uniquement lorsque le module propriétaire supporte réellement ce niveau.

------------------------------------------------------------------------

# 15. Effective Configuration

Concept :

``` text
Platform Default
↓
Tenant Override
↓
Environment Override
↓
Module/Application Override
↓
Effective Value
```

Mais la résolution finale reste au module propriétaire si son CDC le
prévoit.

Administration doit afficher :

``` text
effective value
source
override
inheritance
```

------------------------------------------------------------------------

# 16. Configuration Validation

Toute modification doit être validée :

``` text
type
schema
range
enum
dependencies
policy
permission
```

Une configuration invalide ne doit pas être enregistrée comme active.

------------------------------------------------------------------------

# 17. Sensitive Configuration

Les secrets doivent être représentés par :

``` text
secretRef
credentialRef
providerRef
```

Jamais :

``` text
plaintext secret
API key complète
password
private key
```

dans l'interface, les logs ou l'Audit.

------------------------------------------------------------------------

# 18. Configuration History

Pour les paramètres critiques :

``` text
before
after
changedBy
changedAt
reason?
correlationId
```

Les secrets restent masqués.

------------------------------------------------------------------------

# 19. Restart Required

Une configuration peut indiquer :

``` text
restartRequired = true
```

L'UI doit prévenir l'administrateur.

Ne pas redémarrer arbitrairement un service sans mécanisme officiel.

------------------------------------------------------------------------

# 20. Tenant Administration

Administration doit permettre, selon permissions :

``` text
list tenants
search/filter
view tenant
view status
view subscription summary
view IAM summary
view environments
view usage summary
view alerts
view configuration
perform controlled actions
```

------------------------------------------------------------------------

# 21. Tenant Model

Administration ne doit pas recréer le modèle Tenant si IAM/Context ou la
plateforme le possède déjà.

Elle consomme le contrat officiel :

``` text
Tenant
├── id
├── key
├── name
├── status
├── createdAt
└── metadata autorisée
```

------------------------------------------------------------------------

# 22. Tenant Status

États conceptuels :

``` text
ACTIVE
SUSPENDED
DISABLED
ARCHIVED
```

Adapter à l'existant.

Ne pas ajouter un état sans définir ses effets.

------------------------------------------------------------------------

# 23. Tenant Suspension

Une suspension plateforme est une opération sensible.

Pipeline :

``` text
REQUEST
↓
IAM AUTHORIZATION
↓
TENANT VALIDATION
↓
IMPACT ANALYSIS
↓
CONFIRMATION
↓
OWNER SERVICE COMMAND
↓
CACHE INVALIDATION
↓
EVENT
↓
AUDIT
↓
OBSERVABILITY
```

------------------------------------------------------------------------

# 24. Suspension ≠ Deletion

Suspendre un Tenant ne doit pas :

``` text
delete users
delete applications
delete packs
delete invoices
delete business data
```

Les données sont conservées selon les politiques de rétention.

------------------------------------------------------------------------

# 25. Tenant Reactivation

``` text
SUSPENDED
↓
VALIDATION
↓
REACTIVATE
↓
RECALCULATE CONTEXT / ENTITLEMENTS
↓
INVALIDATE CACHES
↓
EVENT / AUDIT
```

------------------------------------------------------------------------

# 26. Tenant Archive

L'archive est distincte de la suppression physique.

Elle doit être :

``` text
explicit
authorized
audited
reversible if policy allows
```

------------------------------------------------------------------------

# 27. Tenant Impersonation

L'impersonation est une fonction à très haut risque.

Elle est hors MVP par défaut.

Si implémentée ultérieurement :

``` text
explicit permission
reason mandatory
short-lived
visible banner
original actor preserved
effective actor preserved
full audit
no credential disclosure
restricted sensitive actions
```

Jamais de connexion silencieuse « comme le client ».

------------------------------------------------------------------------

# 28. Support Access

Préférer :

``` text
diagnostic access
read-only views
tenant-safe support tools
```

à une impersonation complète.

------------------------------------------------------------------------

# 29. Module Administration

Administration peut présenter les modules enregistrés :

``` text
Business Manager
UI Builder
Automation
Pack Manager
Runtime
Data
Integration Hub
Registry
Deployment
IAM
Observability
API Manager
Billing
```

------------------------------------------------------------------------

# 30. Module Status

Statuts conceptuels :

``` text
AVAILABLE
DEGRADED
UNAVAILABLE
DISABLED
MAINTENANCE
UNKNOWN
```

`UNKNOWN` est préférable à un faux `AVAILABLE`.

------------------------------------------------------------------------

# 31. Module Capability

Les capacités doivent provenir de Registry/owner module.

Administration peut afficher :

``` text
module
version
capabilities
dependencies
health
configuration
```

sans dupliquer le Registry.

------------------------------------------------------------------------

# 32. Enable / Disable Module

Si la plateforme supporte réellement cette fonction :

``` text
enable
disable
```

doit vérifier :

``` text
dependencies
tenant impact
runtime impact
entitlements
active deployments
permissions
```

Ne pas ajouter un toggle cosmétique sans effet backend.

------------------------------------------------------------------------

# 33. Feature Flags

Feature Flags sert au rollout technique contrôlé.

Concept :

``` text
FeatureFlag
├── key
├── description
├── owner
├── status
├── defaultValue
├── scope
├── rules
├── startsAt?
├── endsAt?
└── metadata
```

------------------------------------------------------------------------

# 34. Feature Flag ≠ Entitlement

Distinction obligatoire :

``` text
Feature Flag
→ rollout / activation technique

Entitlement
→ droit commercial

IAM Permission
→ droit de l’utilisateur
```

Accès possible :

``` text
Feature Flag ON
AND
Entitlement TRUE
AND
IAM ALLOW
```

selon la fonctionnalité.

------------------------------------------------------------------------

# 35. Feature Flag Scope

Possibles :

``` text
PLATFORM
TENANT
ENVIRONMENT
APPLICATION
```

N'implémenter que les scopes nécessaires.

------------------------------------------------------------------------

# 36. Feature Flag Lifecycle

``` text
DRAFT
ACTIVE
DISABLED
EXPIRED
ARCHIVED
```

Une feature flag temporaire doit pouvoir être identifiée comme dette à
retirer.

------------------------------------------------------------------------

# 37. Feature Flag Safety

Toute flag critique doit avoir :

``` text
owner
description
default
audit
fallback
```

Une flag supprimée ne doit pas provoquer un comportement indéterminé.

------------------------------------------------------------------------

# 38. Providers

Administration peut configurer les providers transversaux :

``` text
Email
SMS
Storage
AI
CAPTCHA
Payment
Notification
External service
```

uniquement si un contrat provider existe.

------------------------------------------------------------------------

# 39. Provider Registry

Concept :

``` text
providerKey
type
name
ownerModule
status
capabilities
configurationSchema
credentialRequirements
healthCheckCapability
```

Registry peut indexer ces informations.

------------------------------------------------------------------------

# 40. Provider Configuration

Exemple :

``` text
Provider
↓
Configuration
↓
Credential Ref
↓
Test
↓
Activate
```

Aucun secret complet ne doit être renvoyé après enregistrement.

------------------------------------------------------------------------

# 41. Provider Test

Une action `Test configuration` doit :

``` text
validate configuration
perform safe connectivity check
return real result
create diagnostic
```

Ne jamais afficher `Connected` sans vérification réelle.

------------------------------------------------------------------------

# 42. Provider Failover

Si plusieurs providers sont supportés :

``` text
primary
fallback
priority
```

uniquement si le module propriétaire implémente réellement le failover.

Administration ne simule pas ce comportement.

------------------------------------------------------------------------

# 43. Platform Policies

Administration peut gérer les politiques transversales explicitement
prévues :

``` text
security defaults
session policy defaults
credential policies
deployment protection
retention policy
billing defaults
API limits
maintenance policies
```

Chaque policy reste liée à son owner module.

------------------------------------------------------------------------

# 44. Policy Model

Concept :

``` text
key
owner
scope
version
status
configuration
effectiveFrom
effectiveUntil?
```

Les politiques critiques doivent être versionnées/auditées.

------------------------------------------------------------------------

# 45. Policy Validation

Avant activation :

``` text
schema validation
dependency validation
conflict detection
impact analysis
permission check
```

------------------------------------------------------------------------

# 46. Reference Data

Administration peut gérer des référentiels réellement transversaux :

``` text
countries
currencies
locales
timezones
document types
platform classifications
```

Ne pas déplacer les référentiels métier spécifiques hors de leur module
propriétaire.

------------------------------------------------------------------------

# 47. Reference Data Versioning

Pour un référentiel critique :

``` text
stable key
label
status
effective dates
metadata
```

Éviter de supprimer une valeur déjà référencée historiquement.

Préférer :

``` text
DEPRECATED / INACTIVE
```

------------------------------------------------------------------------

# 48. Templates

Templates transversaux possibles :

``` text
email templates
notification templates
system messages
document templates
```

uniquement si la plateforme possède cette capacité.

Les templates métier restent dans leur module propriétaire si
nécessaire.

------------------------------------------------------------------------

# 49. Localization

Administration peut gérer :

``` text
supported locales
default locale
translation resources
fallback locale
```

si une infrastructure i18n réelle existe.

Ne pas construire un CMS de traduction complet sans besoin.

------------------------------------------------------------------------

# 50. System Jobs

Les opérations asynchrones plateforme doivent être visibles.

Exemples :

``` text
maintenance jobs
cleanup
re-index
cache invalidation
usage aggregation
billing renewal
registry synchronization
diagnostic collection
```

Le job reste exécuté par son owner.

------------------------------------------------------------------------

# 51. Job Model

Concept :

``` text
jobId
type
owner
status
createdAt
startedAt?
completedAt?
progress?
requestedBy?
correlationId
errorCode?
```

------------------------------------------------------------------------

# 52. Job Status

``` text
QUEUED
RUNNING
SUCCEEDED
FAILED
CANCELLED
```

`progress` uniquement si mesurable réellement.

------------------------------------------------------------------------

# 53. Job Actions

Selon capacité :

``` text
view
retry
cancel
open diagnostics
```

Retry doit créer une nouvelle tentative traçable.

------------------------------------------------------------------------

# 54. Scheduler

Administration peut afficher les tâches planifiées.

Elle ne doit pas recréer Automation/Scheduler.

``` text
Administration
→ visualise/configure policy autorisée

Automation/Scheduler
→ orchestre/exécute
```

------------------------------------------------------------------------

# 55. Maintenance

Fonctions possibles :

``` text
Maintenance Mode
Cache Management
Re-index
Safe Cleanup
Database Migration Status
System Jobs
Service Restart Request
```

Chaque fonction doit utiliser un mécanisme backend réel.

------------------------------------------------------------------------

# 56. Maintenance Mode

Concept :

``` text
OFF
SCHEDULED
ACTIVE
```

Configuration :

``` text
startsAt?
endsAt?
message
allowedRoles?
scope
```

------------------------------------------------------------------------

# 57. Maintenance Access

Pendant maintenance :

``` text
public/business traffic
→ controlled maintenance response

authorized operators
→ administrative access if policy permits
```

Ne pas désactiver IAM pour activer une maintenance.

------------------------------------------------------------------------

# 58. Maintenance Scope

Possible :

``` text
PLATFORM
MODULE
TENANT
```

uniquement si techniquement supporté.

MVP peut se limiter à PLATFORM.

------------------------------------------------------------------------

# 59. Cache Administration

Actions possibles :

``` text
inspect metadata
invalidate namespace
invalidate tenant cache
invalidate resource cache
```

Ne jamais exposer un bouton `Flush everything` sans contrôle strict.

------------------------------------------------------------------------

# 60. Cache Invalidation

Toute invalidation doit être :

``` text
scoped
authorized
audited
observable
```

et respecter les owners :

``` text
IAM cache
Registry cache
Runtime cache
Entitlement cache
Navigation cache
```

------------------------------------------------------------------------

# 61. Database Migration Status

Administration peut afficher :

``` text
application version
schema version
pending migrations?
last migration
status
```

selon l'infrastructure.

Ne jamais permettre l'exécution arbitraire de SQL depuis l'interface.

------------------------------------------------------------------------

# 62. Migration Execution

Si une opération de migration est exposée :

``` text
protected
environment-aware
explicit confirmation
backup policy
lock/concurrency protection
audit
diagnostics
```

Par défaut, les migrations restent dans le pipeline de déploiement.

------------------------------------------------------------------------

# 63. Operational Tools

Outils possibles :

``` text
rebuild registry index
invalidate cache
retry failed platform job
verify provider
recalculate tenant entitlements
recheck deployment readiness
refresh diagnostic snapshot
```

Ils doivent appeler les services propriétaires.

------------------------------------------------------------------------

# 64. Interdit --- Arbitrary Command Console

Administration ne doit jamais fournir en production :

``` text
arbitrary shell
arbitrary SQL
arbitrary JavaScript
arbitrary HTTP proxy
eval
```

------------------------------------------------------------------------

# 65. Data Governance

Administration peut définir des politiques transversales :

``` text
retention
archiving
export controls
deletion workflow
data classification
```

Mais Data Platform et modules propriétaires exécutent les opérations sur
leurs données.

------------------------------------------------------------------------

# 66. Retention Policies

Concept :

``` text
resourceType
owner
scope
retentionPeriod
archivePolicy
deletionPolicy
legalHold?
```

Les durées réelles doivent être validées, jamais inventées.

------------------------------------------------------------------------

# 67. Data Export

Les exports administratifs doivent être :

``` text
permission-controlled
tenant-scoped
audited
limited
safe
```

Éviter les exports globaux contenant des secrets ou données personnelles
non nécessaires.

------------------------------------------------------------------------

# 68. Deletion Requests

Pour une suppression sensible :

``` text
REQUEST
↓
AUTHORIZATION
↓
DEPENDENCY ANALYSIS
↓
RETENTION CHECK
↓
CONFIRMATION
↓
OWNER MODULE ACTION
↓
AUDIT
```

Ne pas faire de cascade destructive générique depuis Administration.

------------------------------------------------------------------------

# 69. System Information

Page informative :

``` text
Platform Version
Frontend Version
Backend Version
Build Identifier
Deployment Environment
Database Schema Version
Runtime Version
Registry Version
Enabled Modules
```

Afficher uniquement les informations sûres.

------------------------------------------------------------------------

# 70. Environment Information

Ne pas exposer publiquement :

``` text
internal hostnames
private IPs
database URLs
secret names sensibles
filesystem paths
credentials
```

------------------------------------------------------------------------

# 71. Diagnostics

Administration agrège des diagnostics administratifs.

Exemple :

``` text
Tenant provisioning issue
Module unavailable
Configuration invalid
Provider unavailable
Failed job
Cache invalidation failed
Migration mismatch
```

Chaque diagnostic doit deep-linker vers son owner lorsque possible.

------------------------------------------------------------------------

# 72. Observability Integration

Administration consomme :

``` text
Health
Logs
Metrics
Errors
Alerts
Diagnostics
```

depuis Observability.

Elle ne crée pas une seconde plateforme de logs.

------------------------------------------------------------------------

# 73. Audit Integration

Toute action administrative sensible doit produire un Audit.

Exemples :

``` text
tenant.suspended
tenant.reactivated
configuration.updated
feature_flag.activated
provider.updated
policy.updated
maintenance.started
cache.invalidated
job.retried
```

------------------------------------------------------------------------

# 74. Correlation

Chaque opération sensible doit avoir :

``` text
requestId
correlationId
actor
scope
resource
result
```

Cela permet :

``` text
Admin Action
→ Owner Module
→ Runtime/Provider
→ Observability
```

------------------------------------------------------------------------

# 75. Auth + IAM + Context Integration

Administration ne possède pas son propre login.

Pipeline :

``` text
LOGIN
↓
IAM
↓
PLATFORM CONTEXT
↓
ADMIN PERMISSION
↓
ADMINISTRATION
```

Les routes backend doivent vérifier les permissions.

------------------------------------------------------------------------

# 76. Platform Permissions

Exemples conceptuels :

``` text
admin.platform.read
admin.platform.manage

admin.tenant.read
admin.tenant.manage
admin.tenant.suspend

admin.module.read
admin.module.manage

admin.config.read
admin.config.manage

admin.feature_flag.read
admin.feature_flag.manage

admin.provider.read
admin.provider.manage

admin.policy.read
admin.policy.manage

admin.job.read
admin.job.retry

admin.maintenance.read
admin.maintenance.manage

admin.diagnostics.read
```

Réutiliser le Permission Registry réel.

------------------------------------------------------------------------

# 77. Least Privilege

Un administrateur n'obtient que les droits nécessaires.

Éviter :

``` text
ADMIN = everything
```

comme seul modèle de sécurité.

------------------------------------------------------------------------

# 78. Step-Up Authentication

Pour actions critiques, l'architecture peut demander :

``` text
recent authentication
MFA
step-up
```

si IAM supporte réellement cette capacité.

Exemples :

``` text
tenant suspension
secret rotation
platform policy change
maintenance activation
critical provider change
```

------------------------------------------------------------------------

# 79. Confirmation critique

Actions destructives/sensibles :

``` text
Suspend Tenant
Disable Module
Activate Maintenance
Invalidate critical cache
Revoke provider
```

doivent demander une confirmation explicite.

Pour les opérations à fort impact, demander éventuellement une saisie de
confirmation.

------------------------------------------------------------------------

# 80. Reason

Certaines actions doivent accepter/exiger :

``` text
reason
```

Exemples :

``` text
Tenant suspension
manual override
policy exception
maintenance
```

Le reason doit être audité.

------------------------------------------------------------------------

# 81. Approval

Un workflow d'approbation est hors MVP sauf s'il existe déjà.

Ne pas inventer :

``` text
4-eyes approval
manager approval
change advisory board
```

sans infrastructure correspondante.

------------------------------------------------------------------------

# 82. Business Manager Integration

Administration peut :

``` text
view module availability
configure platform-level BM settings
view diagnostics
```

Elle ne crée/modifie pas les Business Definitions à la place de BM.

------------------------------------------------------------------------

# 83. UI Builder Integration

Administration peut :

``` text
manage global UI provider settings
view health
manage platform feature flags
```

Elle ne devient pas éditeur de pages.

------------------------------------------------------------------------

# 84. Automation Integration

Administration peut :

``` text
view scheduler health
view failed system automations
configure approved platform policies
```

Elle ne devient pas workflow builder.

------------------------------------------------------------------------

# 85. Pack Manager Integration

Administration peut :

``` text
view module status
view publication diagnostics
configure platform policy
```

Elle ne publie pas directement un Pack en contournant Pack Manager.

------------------------------------------------------------------------

# 86. Pack Runtime Integration

Administration peut demander des opérations contrôlées :

``` text
invalidate runtime cache
recheck health
open diagnostics
```

via les contrats Runtime.

Elle ne modifie pas directement un Runtime Context en DB.

------------------------------------------------------------------------

# 87. Data Platform Integration

Administration peut gérer :

``` text
platform provider configuration
retention policies
diagnostics
```

mais les données métier restent Data-owned.

------------------------------------------------------------------------

# 88. ERP / Integration Hub Integration

Administration peut :

``` text
configure provider refs
view connector status
open diagnostics
```

Les credentials/connecteurs restent gérés selon le CDC Integration Hub.

Pas d'appel direct Dolibarr depuis Administration.

------------------------------------------------------------------------

# 89. Registry Integration

Registry fournit :

``` text
modules
capabilities
providers
schemas
compatibility metadata
```

Administration peut gérer les paramètres de plateforme autour du
Registry, mais ne duplique pas les entrées.

------------------------------------------------------------------------

# 90. Environment / Deployment Integration

Administration peut :

``` text
view environments
view deployment health
configure global deployment policies
open deployment diagnostics
```

Les déploiements restent gérés par Deployment Manager.

------------------------------------------------------------------------

# 91. API & Integration Manager Integration

Administration peut gérer :

``` text
global API policies
default rate limits
credential policies
public API availability
webhook security policies
```

API Clients restent gérés par API Manager.

------------------------------------------------------------------------

# 92. Subscription & Billing Integration

Administration Platform peut offrir la console Platform Admin pour :

``` text
Plans
Pricing
Subscriptions
Billing policies
```

mais toutes les opérations passent par les services Billing.

Aucune logique financière dupliquée.

------------------------------------------------------------------------

# 93. Administration vs Tenant Settings

Séparer :

``` text
Platform Administration
→ paramètres globaux et opérations plateforme

Tenant Settings
→ paramètres propres au Tenant
```

Ne pas mélanger les deux workspaces.

------------------------------------------------------------------------

# 94. API conceptuelle

Adapter aux routes existantes :

``` http
GET  /api/admin/overview

GET  /api/admin/tenants
GET  /api/admin/tenants/:id
POST /api/admin/tenants/:id/suspend
POST /api/admin/tenants/:id/reactivate

GET  /api/admin/modules
GET  /api/admin/modules/:key

GET  /api/admin/configuration
PATCH /api/admin/configuration/:key

GET  /api/admin/feature-flags
POST /api/admin/feature-flags
PATCH /api/admin/feature-flags/:id

GET  /api/admin/providers
PATCH /api/admin/providers/:id
POST /api/admin/providers/:id/test

GET  /api/admin/policies

GET  /api/admin/jobs
POST /api/admin/jobs/:id/retry

GET  /api/admin/maintenance
POST /api/admin/maintenance/start
POST /api/admin/maintenance/stop

GET  /api/admin/system
GET  /api/admin/diagnostics
```

Ne pas créer de doublons si les modules propriétaires exposent déjà les
contrats nécessaires.

------------------------------------------------------------------------

# 95. Backend Architecture

Découpage indicatif :

``` text
AdministrationModule
├── Overview
├── TenantAdmin
├── ModuleAdmin
├── Configuration
├── FeatureFlags
├── Providers
├── Policies
├── ReferenceData
├── SystemJobs
├── Maintenance
├── SystemInfo
└── Diagnostics
```

Les services doivent appeler les APIs/services propriétaires plutôt que
leurs tables directement lorsque cela préserve les frontières.

------------------------------------------------------------------------

# 96. Persistence conceptuelle

À auditer avant création :

``` text
PlatformSetting
ConfigurationDefinition
ConfigurationOverride
FeatureFlag
FeatureFlagRule
PlatformPolicy
ReferenceData
SystemJob
MaintenanceWindow
AdminOperation
AdminDiagnostic
```

Ne pas créer toutes ces tables automatiquement.

------------------------------------------------------------------------

# 97. Feature Flag Evaluation

Pipeline :

``` text
FLAG KEY
↓
DEFINITION
↓
STATUS
↓
SCOPE
↓
TARGET CONTEXT
↓
RULE
↓
EFFECTIVE VALUE
```

Évaluation déterministe.

------------------------------------------------------------------------

# 98. Configuration Resolution

Pipeline :

``` text
CONFIG KEY
↓
DEFINITION
↓
OWNER
↓
SCOPE
↓
DEFAULT
↓
VALID OVERRIDES
↓
EFFECTIVE VALUE
↓
OWNER MODULE
```

------------------------------------------------------------------------

# 99. Admin Operation Contract

Une action administrative sensible peut être représentée :

``` text
operationId
type
actor
scope
resource
requestedAt
status
reason?
correlationId
result?
```

Cela facilite audit, retry et diagnostic.

------------------------------------------------------------------------

# 100. Operation Status

``` text
PENDING
RUNNING
SUCCEEDED
FAILED
CANCELLED
```

Ne pas afficher `SUCCEEDED` avant confirmation réelle du module
propriétaire.

------------------------------------------------------------------------

# 101. Error Contract

Réutiliser le contrat global.

Codes conceptuels :

``` text
ADMIN_ACCESS_DENIED
PLATFORM_CONFIG_INVALID
CONFIGURATION_READ_ONLY
CONFIGURATION_RESTART_REQUIRED
TENANT_NOT_FOUND
TENANT_SUSPENSION_FAILED
TENANT_REACTIVATION_FAILED
MODULE_NOT_FOUND
MODULE_DEPENDENCY_CONFLICT
FEATURE_FLAG_NOT_FOUND
FEATURE_FLAG_INVALID
PROVIDER_NOT_FOUND
PROVIDER_CONFIGURATION_INVALID
PROVIDER_UNAVAILABLE
POLICY_INVALID
SYSTEM_JOB_NOT_FOUND
SYSTEM_JOB_RETRY_NOT_ALLOWED
MAINTENANCE_ALREADY_ACTIVE
MAINTENANCE_NOT_ACTIVE
OPERATION_CONFLICT
```

Chaque erreur critique doit avoir un `traceId`.

------------------------------------------------------------------------

# 102. Concurrence

Protéger :

``` text
double tenant suspension
simultaneous configuration edits
feature flag race
double maintenance activation
job retry race
provider update race
```

Utiliser :

``` text
transactions
version fields
optimistic locking
unique constraints
idempotency
```

selon le besoin.

------------------------------------------------------------------------

# 103. Idempotence

Actions pertinentes :

``` text
suspend tenant
reactivate tenant
start maintenance
stop maintenance
retry operation
cache invalidation request
```

doivent éviter les effets multiples dangereux.

------------------------------------------------------------------------

# 104. Security

Obligatoire :

``` text
IAM authentication
platform-scoped authorization
tenant isolation
least privilege
secret redaction
input validation
CSRF where applicable
CORS
rate limiting for sensitive endpoints
audit
correlation
```

------------------------------------------------------------------------

# 105. Input Validation

Valider :

``` text
IDs
keys
enum values
configuration schemas
URLs
provider values
dates
reason length
pagination
filters
```

Interdire les clés de configuration arbitraires si elles ne sont pas
enregistrées.

------------------------------------------------------------------------

# 106. SSRF

Toute configuration d'URL externe administrable doit respecter les
protections SSRF de la plateforme.

Exemples :

``` text
provider endpoint
webhook endpoint
external service URL
```

------------------------------------------------------------------------

# 107. Secret Redaction

Réponses :

``` text
credentialRef: configured
secret: ********
```

Jamais :

``` text
secret: actual-secret-value
```

------------------------------------------------------------------------

# 108. UI/UX

Direction :

**Techzone Cloud --- Platform Administration Console 2026**

Principes :

``` text
professionnel
dense mais lisible
orienté opérations
forte hiérarchie visuelle
actions critiques distinctes
états explicites
diagnostics accessibles
pas de dashboards décoratifs
```

Design :

``` text
fond slate clair
cards blanches
Techzone Blue
bordures fines
radius 10–12 px
ombres très discrètes
tables efficaces
responsive
accessible
```

------------------------------------------------------------------------

# 109. Admin Overview UI

Sections :

``` text
Platform Health
Tenants
Modules
Critical Alerts
Failed Jobs
Maintenance
Recent Admin Activity
Quick Actions
```

Les Quick Actions respectent IAM.

------------------------------------------------------------------------

# 110. Tenant List UI

Colonnes :

``` text
Tenant
Status
Subscription
Users
Applications
Environment
Alerts
Created
Actions
```

Afficher seulement les colonnes alimentées par des sources réelles.

------------------------------------------------------------------------

# 111. Tenant Workspace

``` text
Overview
Configuration
IAM Summary
Subscription Summary
Usage
Applications
Environments
Alerts
Audit
Operations
```

Chaque section référence son module propriétaire.

------------------------------------------------------------------------

# 112. Module List UI

``` text
Module
Version
Status
Capabilities
Dependencies
Last Check
Diagnostics
```

Pas de faux statut.

------------------------------------------------------------------------

# 113. Configuration UI

Fonctions :

``` text
search
namespace filter
scope filter
owner filter
effective value
source
override
validation
history
```

Les secrets sont masqués.

------------------------------------------------------------------------

# 114. Feature Flags UI

Colonnes :

``` text
Flag
Owner
Status
Default
Scope
Targets
Updated
```

Workspace :

``` text
Overview
Rules
Targets
History
Diagnostics
```

------------------------------------------------------------------------

# 115. Providers UI

Colonnes :

``` text
Provider
Type
Owner
Status
Capabilities
Last Check
```

Actions :

``` text
Configure
Test
Activate/Disable if supported
Diagnostics
```

------------------------------------------------------------------------

# 116. Jobs UI

Colonnes :

``` text
Job
Owner
Status
Started
Duration
Requested By
Correlation
```

Filtres :

``` text
status
owner
type
period
```

------------------------------------------------------------------------

# 117. Maintenance UI

Afficher :

``` text
Current State
Scope
Message
Started At
Ends At
Started By
Affected Modules
```

Actions critiques clairement séparées.

------------------------------------------------------------------------

# 118. System Info UI

Lecture seule :

``` text
Versions
Build
Environment
Schema
Modules
Runtime
Registry
```

Sans secrets.

------------------------------------------------------------------------

# 119. États UI

``` text
LOADING
LOADED
EMPTY
ERROR
FORBIDDEN
UNAVAILABLE
```

Opérations :

``` text
VALIDATING
APPLYING
TESTING
QUEUED
RUNNING
SUCCEEDED
FAILED
```

------------------------------------------------------------------------

# 120. Partial Failure

Une erreur d'un widget ne doit pas casser tout le cockpit.

Exemple :

``` text
Tenant count → OK
Billing summary → unavailable
Observability alerts → OK
```

Afficher l'indisponibilité localement.

------------------------------------------------------------------------

# 121. Accessibilité

Prévoir :

``` text
keyboard navigation
visible focus
aria labels
accessible dialogs
accessible tables
status text + icon
not color-only
confirmations accessibles
```

------------------------------------------------------------------------

# 122. Performance

Utiliser :

``` text
pagination
server-side filtering
lazy detail
aggregated endpoints
memoized navigation
controlled polling
cache with invalidation
```

Éviter :

``` text
N+1
global reload
continuous polling
loading all tenants
loading all logs
```

------------------------------------------------------------------------

# 123. Business Rules

**RG-ADMIN-001** --- Administration Platform ne remplace pas les modules
propriétaires.\
**RG-ADMIN-002** --- Toute action administrative passe par IAM.\
**RG-ADMIN-003** --- Platform Admin et Tenant Admin sont distincts.\
**RG-ADMIN-004** --- Least Privilege s'applique aux administrateurs.\
**RG-ADMIN-005** --- Une action UI cachée reste protégée côté backend.\
**RG-ADMIN-006** --- Toute configuration possède un owner.\
**RG-ADMIN-007** --- Une clé de configuration inconnue est refusée sauf
mécanisme explicite.\
**RG-ADMIN-008** --- Les configurations sensibles utilisent des
références de secrets.\
**RG-ADMIN-009** --- Aucun secret complet n'est exposé dans l'UI.\
**RG-ADMIN-010** --- Les modifications critiques sont auditées.\
**RG-ADMIN-011** --- Feature Flag, Entitlement et Permission sont trois
concepts distincts.\
**RG-ADMIN-012** --- Une Feature Flag inactive ne doit pas être
présentée comme active.\
**RG-ADMIN-013** --- Une Feature Flag possède un owner.\
**RG-ADMIN-014** --- Les flags temporaires doivent pouvoir être
identifiées et retirées.\
**RG-ADMIN-015** --- Un provider n'est AVAILABLE qu'après état réel.\
**RG-ADMIN-016** --- UNKNOWN est préférable à un faux AVAILABLE.\
**RG-ADMIN-017** --- Un Provider Test produit un résultat réel.\
**RG-ADMIN-018** --- Une suspension Tenant ne supprime aucune donnée
métier.\
**RG-ADMIN-019** --- Une réactivation invalide les caches concernés.\
**RG-ADMIN-020** --- L'impersonation n'est pas activée silencieusement.\
**RG-ADMIN-021** --- Toute impersonation future conserve acteur original
et effectif.\
**RG-ADMIN-022** --- Maintenance Mode ne désactive pas les contrôles
IAM.\
**RG-ADMIN-023** --- Une opération Maintenance est auditée.\
**RG-ADMIN-024** --- Une invalidation cache est scoped et auditée.\
**RG-ADMIN-025** --- Administration n'exécute pas de SQL arbitraire.\
**RG-ADMIN-026** --- Administration n'exécute pas de shell arbitraire.\
**RG-ADMIN-027** --- Administration ne fournit pas de proxy HTTP
arbitraire.\
**RG-ADMIN-028** --- Les migrations sont gérées via mécanismes
contrôlés.\
**RG-ADMIN-029** --- Un Job SUCCEEDED correspond à une confirmation
réelle.\
**RG-ADMIN-030** --- Un retry crée une tentative traçable.\
**RG-ADMIN-031** --- Les actions concurrentes critiques sont protégées.\
**RG-ADMIN-032** --- Les opérations sensibles sont idempotentes lorsque
nécessaire.\
**RG-ADMIN-033** --- Les diagnostics deep-linkent vers le propriétaire
lorsque possible.\
**RG-ADMIN-034** --- Administration consomme Observability au lieu de
dupliquer logs/metrics.\
**RG-ADMIN-035** --- Les référentiels métier restent chez leur owner.\
**RG-ADMIN-036** --- Les suppressions respectent dépendances et
rétention.\
**RG-ADMIN-037** --- Les exports sont permissionnés, scoped et audités.\
**RG-ADMIN-038** --- Les informations système n'exposent aucun secret ou
détail dangereux.\
**RG-ADMIN-039** --- Aucun KPI/statut n'est inventé en mode REAL.\
**RG-ADMIN-040** --- Aucun mock/fallback silencieux n'est autorisé en
mode REAL.

------------------------------------------------------------------------

# 124. Tests unitaires

Tester :

``` text
configuration validation
effective configuration
scope resolution
feature flag evaluation
provider configuration validation
policy validation
tenant operation rules
maintenance state
job retry rules
secret redaction
permission mapping
error normalization
```

------------------------------------------------------------------------

# 125. Tests d'intégration

Scénarios :

``` text
Admin
→ IAM
→ Platform Permission
→ Configuration Update
→ Owner Module
→ Audit
```

``` text
Admin
→ Tenant Suspension
→ Context/IAM
→ Cache Invalidation
→ Dashboard/Sidebar effect
```

``` text
Admin
→ Provider Test
→ Owner Adapter
→ Real Result
→ Observability
```

``` text
Admin
→ Maintenance
→ Platform State
→ User Request
→ Maintenance Response
```

------------------------------------------------------------------------

# 126. Tests sécurité

Tester :

``` text
anonymous admin access
tenant admin → platform endpoint
wrong tenant
forged role
forged permission
direct API access
CSRF
CORS
secret leakage
configuration injection
SSRF
arbitrary URL
arbitrary SQL attempt
arbitrary command attempt
cross-tenant export
unauthorized cache invalidation
unauthorized maintenance
concurrent critical operations
```

------------------------------------------------------------------------

# 127. E2E --- Configuration

``` text
LOGIN
↓
PLATFORM CONTEXT
↓
ADMINISTRATION
↓
CONFIGURATION
↓
SELECT REGISTERED KEY
↓
EDIT
↓
VALIDATE
↓
APPLY
↓
OWNER MODULE
↓
AUDIT
↓
EFFECTIVE VALUE
```

------------------------------------------------------------------------

# 128. E2E --- Tenant Suspension

``` text
ACTIVE TENANT
↓
ADMIN AUTHORIZATION
↓
IMPACT REVIEW
↓
CONFIRM
↓
SUSPEND
↓
CONTEXT INVALIDATION
↓
ENTITLEMENT/NAVIGATION EFFECT
↓
AUDIT
↓
OBSERVABILITY
```

Vérifier qu'aucune donnée n'est supprimée.

------------------------------------------------------------------------

# 129. E2E --- Feature Flag

``` text
CREATE/SELECT FLAG
↓
SET TARGET
↓
VALIDATE
↓
ACTIVATE
↓
EVALUATE CONTEXT
↓
FEATURE AVAILABLE/UNAVAILABLE
↓
AUDIT
```

------------------------------------------------------------------------

# 130. E2E --- Provider

``` text
CONFIGURE PROVIDER
↓
SAVE SECRET REF
↓
TEST
↓
REAL CONNECTIVITY RESULT
↓
ACTIVATE IF VALID
↓
OWNER MODULE USE
↓
OBSERVABILITY
```

------------------------------------------------------------------------

# 131. E2E --- Maintenance

``` text
ADMIN
↓
START MAINTENANCE
↓
CONFIRM
↓
PLATFORM STATE ACTIVE
↓
NORMAL USER REQUEST
↓
CONTROLLED MAINTENANCE RESPONSE
↓
AUTHORIZED ADMIN ACCESS
↓
STOP MAINTENANCE
↓
NORMAL OPERATION
```

------------------------------------------------------------------------

# 132. Recette navigateur

Tester :

``` text
Admin Overview
Tenants
Tenant Detail
Modules
Configuration
Feature Flags
Providers
Policies
Reference Data
Jobs
Maintenance
Diagnostics
System Info
```

Et :

``` text
Desktop
Tablet
Mobile
Loading
Empty
Error
Forbidden
Unavailable
Partial Failure
```

------------------------------------------------------------------------

# 133. Gap Matrix obligatoire

  Domaine         Exigence                  Existant   État   Décision           Tests
  --------------- ------------------------- ---------- ------ ------------------ -------
  Overview        Platform cockpit          ...        ...    KEEP/IMPROVE/...   ...
  Tenants         Tenant administration     ...        ...    ...                ...
  Modules         Module registry/status    ...        ...    ...                ...
  Config          Configuration Registry    ...        ...    ...                ...
  Config          Effective config          ...        ...    ...                ...
  Flags           Feature Flags             ...        ...    ...                ...
  Providers       Provider Registry         ...        ...    ...                ...
  Policies        Platform Policies         ...        ...    ...                ...
  Reference       Reference Data            ...        ...    ...                ...
  Jobs            System Jobs               ...        ...    ...                ...
  Maintenance     Maintenance Mode          ...        ...    ...                ...
  Cache           Controlled invalidation   ...        ...    ...                ...
  System          Version/build info        ...        ...    ...                ...
  Security        IAM integration           ...        ...    ...                ...
  Audit           Admin audit               ...        ...    ...                ...
  Observability   Diagnostics               ...        ...    ...                ...
  UI              Admin workspace           ...        ...    ...                ...

Ne jamais conclure `IMPLEMENT` avant recherche réelle.

------------------------------------------------------------------------

# 134. Audit préalable obligatoire

Rechercher avant développement :

``` text
existing admin routes
existing settings
existing tenant management
feature flag code
environment variables
config services
provider registries
health endpoints
jobs/queues
scheduler
maintenance middleware
cache services
Prisma admin/config models
IAM admin permissions
audit
observability
frontend admin pages
sidebar routes
```

------------------------------------------------------------------------

# 135. Plan d'implémentation recommandé

``` text
PHASE 0
Audit + Gap Matrix

PHASE 1
Administration foundation
+ IAM Platform Scope

PHASE 2
Platform Overview

PHASE 3
Tenant Administration

PHASE 4
Configuration Registry
+ validation
+ history

PHASE 5
Feature Flags

PHASE 6
Provider Administration

PHASE 7
Platform Policies
+ Reference Data

PHASE 8
System Jobs
+ Maintenance

PHASE 9
Operational Tools
+ controlled cache actions

PHASE 10
Observability
+ Diagnostics
+ Audit

PHASE 11
Sidebar / Dashboard / Module integration

PHASE 12
UI/UX

PHASE 13
Security
+ Tests
+ E2E
+ Browser Recipe
```

------------------------------------------------------------------------

# 136. MVP recommandé

Le MVP doit prioriser :

``` text
Platform Admin authorization
Admin Overview
Tenant list/detail
Tenant controlled status actions
Configuration Registry
Safe configuration editor
Feature Flags
Provider configuration/readiness
System Jobs visibility
Maintenance Mode
Audit
Observability links
System Information
```

P1/P2 :

``` text
Advanced Policy Editor
Reference Data administration
Complex provider failover
Data governance workflows
Advanced operational tools
Support impersonation
Approval workflows
```

------------------------------------------------------------------------

# 137. Non-régression

Tester :

``` text
Authentication
IAM
Tenant Context
Dashboard
Sidebar
Business Manager
UI Builder
Automation
Pack Manager
Pack Runtime
Data
ERP / Integration Hub
Registry
Environment / Deployment
Observability
API & Integration Manager
Subscription & Billing
```

Administration ne doit pas casser les frontières des modules existants.

------------------------------------------------------------------------

# 138. Definition of Done

Administration Platform v2 est DONE uniquement si :

-   audit initial réalisé ;
-   Gap Matrix réalisée ;
-   permissions Platform réelles ;
-   séparation Platform/Tenant respectée ;
-   Overview alimenté par données réelles ;
-   Tenant administration réelle ;
-   aucune suppression implicite lors d'une suspension ;
-   Configuration Registry réel ;
-   ownership des paramètres explicite ;
-   validation de configuration réelle ;
-   secrets protégés ;
-   historique critique disponible ;
-   Feature Flags réelles ;
-   distinction Flag/Entitlement/Permission respectée ;
-   Providers réellement testables si configurables ;
-   aucun faux AVAILABLE ;
-   Platform Policies contrôlées ;
-   Jobs réels ;
-   Maintenance réelle ;
-   opérations critiques protégées ;
-   aucun SQL/shell/eval/proxy arbitraire ;
-   Audit réel ;
-   Observability intégrée ;
-   diagnostics exploitables ;
-   Sidebar intégrée ;
-   Dashboard intégré ;
-   UI responsive/accessibilité ;
-   aucun faux KPI ;
-   aucun faux statut ;
-   aucun mock silencieux en REAL ;
-   Prisma validate/generate passe si schéma modifié ;
-   backend build passe ;
-   frontend build passe ;
-   tests unitaires passent ;
-   tests intégration passent ;
-   tests sécurité passent ;
-   E2E passent ;
-   recette navigateur passe.

------------------------------------------------------------------------

# 139. Principe final

Administration Platform doit rester une **tour de contrôle**, pas
devenir le moteur de tous les domaines.

``` text
ADMINISTRATION PLATFORM
        │
        ├── gouverne
        ├── configure
        ├── supervise
        ├── orchestre
        └── audite
                ↓
        MODULE PROPRIÉTAIRE
                │
                ├── valide
                ├── persiste
                ├── exécute
                └── expose son état
```

Les trois contrôles transversaux restent distincts :

``` text
FEATURE FLAG
→ la fonctionnalité est-elle techniquement activée ?

ENTITLEMENT
→ le Tenant y a-t-il droit commercialement ?

IAM PERMISSION
→ cet acteur précis est-il autorisé ?
```

Accès effectif :

``` text
MODULE AVAILABLE
AND
FEATURE FLAG
AND
ENTITLEMENT si applicable
AND
IAM AUTHORIZATION
AND
VALID CONTEXT
= EFFECTIVE ACCESS
```

Règle de développement :

``` text
AUDIT
→ GAP MATRIX
→ KEEP
→ FIX
→ COMPLETE
→ CONNECT OWNERS
→ SECURE
→ GOVERN
→ OBSERVE
→ TEST
```
