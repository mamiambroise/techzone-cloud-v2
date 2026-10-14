# CAHIER DES CHARGES — TECHZONE CLOUD ADMINISTRATION PLATFORM
## Étape 1 — Cible fonctionnelle et architecturale

**Projet :** Techzone Cloud  
**Module :** Administration Platform  
**Version cible :** 3.0  
**Statut :** Spécification cible  
**Principe :** Administration Platform est la console centrale de gouvernance et d’exploitation administrative. Elle orchestre les modules propriétaires via leurs APIs officielles sans recréer IAM, Billing, Runtime, Integration Hub ni Observability.

---

# 1. Objet

Administration Platform répond à :

```text
GOUVERNER LA PLATEFORME
→ paramètres globaux
→ politiques
→ référentiels
→ feature flags

ADMINISTRER LES TENANTS
→ consulter
→ configurer
→ suspendre / réactiver
→ diagnostiquer

ADMINISTRER LES UTILISATEURS
→ consulter
→ gouverner
→ opérer via IAM

DÉLÉGUER L’ADMINISTRATION
→ scopes
→ durée
→ limites
→ audit

SUPERVISER LES MODULES
→ disponibilité
→ capacités
→ configuration
→ diagnostics

PILOTER LES OPÉRATIONS
→ maintenance
→ jobs
→ migrations contrôlées
→ actions administratives

AUDITER
→ qui
→ quoi
→ quand
→ résultat
```

---

# 2. Position dans Techzone Cloud

```text
IAM + TENANT CONTEXT
        ↓
SUBSCRIPTION & BILLING
        ↓
OBSERVABILITY & SECURITY
        ↓
ADMINISTRATION PLATFORM
├── Users Administration
├── Tenants Administration
├── Access Governance
├── Delegation
├── Security & Audit
├── Monitoring
├── Platform Settings
├── Feature Flags
├── Providers
├── Jobs / Maintenance
└── Administrative Actions
```

---

# 3. Règle de non-duplication

```text
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

```text
Administration peut suspendre un Tenant
mais IAM/Context reste propriétaire de l’état d’accès.

Administration peut modifier une policy Billing
mais Billing reste propriétaire du calcul et du lifecycle.

Administration peut lancer un diagnostic Runtime
mais Pack Runtime reste propriétaire de l’exécution.

Administration affiche logs/metrics
mais Observability reste propriétaire des données.
```

---

# 4. Navigation

Dans :

```text
PLATEFORME
└── Administration
```

Sous-navigation cible :

```text
Vue d’ensemble
Utilisateurs
Organisations & Tenants
Gouvernance des accès
Délégation
Sécurité & Audit
Modules & Providers
Feature Flags
Paramètres plateforme
Jobs & Maintenance
Actions administratives
Diagnostics
Informations système
```

---

# 5. Acteurs

```text
PLATFORM_SUPER_ADMIN
PLATFORM_ADMIN
SECURITY_ADMIN
SUPPORT_ADMIN
BILLING_ADMIN
OPERATIONS_ADMIN
TENANT_ADMIN
AUDITOR
READ_ONLY_SUPPORT
```

Les rôles exacts doivent correspondre à IAM réel.

---

# 6. Séparation des privilèges

Ne pas donner automatiquement tous les pouvoirs à `admin`.

Différencier :

```text
READ
SUPPORT
OPERATE
SECURITY
BILLING
GOVERNANCE
SUPER_ADMIN
```

---

# 7. Re-authentication

Actions critiques peuvent exiger :

```text
active session
+
recent re-authentication
+
MFA if policy requires
```

Exemples :
- suspend tenant ;
- revoke all sessions ;
- elevate delegation ;
- disable provider ;
- maintenance globale ;
- rotate secret/config critique.

---

# 8. Platform Overview

Afficher uniquement des informations réelles :

- Tenants actifs ;
- Tenants suspendus ;
- Users actifs ;
- Modules disponibles ;
- Providers dégradés ;
- Jobs en erreur ;
- Security alerts ;
- Recent admin actions ;
- System health summary.

---

# 9. User Administration

Administration ne modifie pas directement les tables IAM.

Actions via contrat IAM :

```text
list users
get user
disable user
enable user
revoke sessions
reset/require MFA if supported
view roles/permissions
view tenant memberships
```

---

# 10. User Detail

Sections :

```text
Profile
Tenant Memberships
Roles
Permissions
Sessions
Devices
Security Events
Audit
```

---

# 11. User Status

```text
ACTIVE
SUSPENDED
DISABLED
LOCKED
INVITED
```

Adapter aux états IAM existants.

---

# 12. Tenant Administration

Actions :

```text
view
edit controlled metadata
suspend
reactivate
view subscription
view limits
view modules
view users
view environments
view diagnostics
```

---

# 13. Tenant Status

Concept :

```text
ACTIVE
SUSPENDED
DISABLED
PENDING
ARCHIVED
```

Ne pas supprimer un Tenant pour une suspension opérationnelle.

---

# 14. Tenant Suspension

Pipeline :

```text
Admin permission
↓
Re-auth/MFA if policy
↓
Reason required
↓
IAM/Tenant owner API
↓
Subscription impact checked
↓
Runtime/Deployment impact evaluated
↓
Audit
↓
Notifications/event
```

---

# 15. Tenant Reactivation

Inverse contrôlé :
- verify permission ;
- resolve billing/subscription state ;
- reactivate context ;
- invalidate caches ;
- audit.

---

# 16. Access Governance

Vue de gouvernance :

```text
Role Registry
Permission Registry
Role Assignments
Permission Assignments
Tenant Memberships
Privileged Accounts
Unused Privileges
Conflicts
```

Administration orchestre IAM.

---

# 17. Permission Governance

Fonctions :

- search permission ;
- see usage ;
- see roles ;
- see modules ;
- identify orphan permission ;
- identify dangerous wildcard/elevation ;
- controlled assignment.

---

# 18. Role Governance

- role list ;
- system vs tenant role ;
- permission set ;
- assigned users ;
- risk level ;
- lifecycle.

---

# 19. Privileged Access

Identifier :
- super admins ;
- security admins ;
- support elevated users ;
- active delegations ;
- stale privileges.

---

# 20. Delegation

Permet d’accorder temporairement une capacité d’administration.

Modèle :

```text
AdminDelegation
├── id
├── grantedBy
├── grantedTo
├── scope
├── tenantId?
├── permissions
├── startsAt
├── expiresAt
├── status
├── reason
├── ticketRef?
└── createdAt
```

---

# 21. Delegation Rules

- durée obligatoire ;
- scope minimal ;
- permissions explicites ;
- pas d’auto-élévation ;
- grantor doit posséder droit de déléguer ;
- expiration automatique ;
- audit complet.

---

# 22. Delegation Status

```text
PENDING
ACTIVE
EXPIRED
REVOKED
REJECTED
```

---

# 23. Break-glass

Optionnel si implémenté :

```text
emergency access
```

Exige :
- justification ;
- MFA ;
- expiration très courte ;
- audit renforcé ;
- alerting.

---

# 24. Security & Audit

Administration peut consulter :

- auth events ;
- permission denials ;
- tenant denials ;
- session revocations ;
- MFA events ;
- privileged actions ;
- suspicious admin actions.

Elle ne remplace pas la collecte Security/Observability.

---

# 25. Platform Audit

Chaque action admin sensible produit :

```text
actor
principal type
target
tenant
action
reason
before summary
after summary
result
timestamp
traceId
```

Sans secrets.

---

# 26. Module Administration

Administration maintient un catalogue opérationnel des modules :

```text
module
version
status
capabilities
configuration status
dependencies
health
owner
```

Registry reste la source transverse si déjà propriétaire.

---

# 27. Module Status

```text
AVAILABLE
DEGRADED
UNAVAILABLE
MAINTENANCE
DISABLED
UNKNOWN
```

Status réel seulement.

---

# 28. Providers

Administration configure/référence :

```text
Payment Providers
Integration Providers
Notification Providers
Storage Providers
Runtime Providers
Data Providers
```

Mais le module propriétaire exécute.

---

# 29. Provider Configuration

Utiliser :
- configuration refs ;
- credential refs ;
- environment scope ;
- validation ;
- health.

Aucun secret en clair.

---

# 30. REAL / MOCK

Badge explicite :

```text
REAL
MOCK
SANDBOX
```

Production ne doit jamais présenter un mock comme provider réel.

---

# 31. Feature Flags

Feature Flag :

```text
key
description
scope
status
defaultValue
rules
owner
expiresAt?
```

Scopes :
```text
PLATFORM
TENANT
ENVIRONMENT
USER
```

selon support réel.

---

# 32. Feature Flag Rules

- deterministic ;
- auditable ;
- server-side for security-sensitive feature ;
- no secret ;
- expiration for temporary flags.

Feature flag ≠ permission.

---

# 33. Platform Settings

Paramètres globaux gouvernés :

- branding ;
- security policy refs ;
- runtime defaults ;
- limits ;
- maintenance settings ;
- defaults ;
- allowed providers ;
- API limits.

Ne pas dupliquer les settings propriétaires.

---

# 34. Configuration Registry

Expose :
- key ;
- owner module ;
- scope ;
- type ;
- effective source ;
- editable? ;
- sensitive? ;
- validation schema.

---

# 35. Reference Data

Référentiels transversaux non métier :
- regions/environments definitions ;
- platform categories ;
- allowed provider types ;
- system enums configurable if designed.

Ne pas déplacer le catalogue métier ici.

---

# 36. Templates

Templates administratifs :
- tenant bootstrap ;
- environment defaults ;
- notification templates refs ;
- configuration presets.

---

# 37. System Jobs

Job model :

```text
SystemJob
├── id
├── type
├── scope
├── tenantId?
├── status
├── progress
├── requestedBy
├── startedAt
├── completedAt
├── error
└── traceId
```

---

# 38. Job Types

Exemples :
- cache invalidation ;
- data reconciliation ;
- registry refresh ;
- diagnostic scan ;
- maintenance task ;
- safe migration/preflight.

Ne pas exposer arbitrary shell command.

---

# 39. Job Lifecycle

```text
QUEUED
RUNNING
SUCCEEDED
FAILED
CANCELLED
TIMEOUT
```

---

# 40. Job Idempotency

Les jobs répétables doivent être idempotents ou explicitement non-idempotents avec confirmation.

---

# 41. Maintenance

Maintenance scope :

```text
PLATFORM
MODULE
ENVIRONMENT
TENANT
```

Actions :
- enable maintenance mode ;
- disable ;
- planned window ;
- message ;
- affected capabilities.

---

# 42. Maintenance Safety

Maintenance ne doit pas :
- supprimer données ;
- bypass IAM ;
- masquer une erreur comme succès.

---

# 43. Migrations

Administration peut afficher/orkestrer uniquement des migrations contrôlées.

Règles :
- migration catalogued ;
- preflight ;
- backup/rollback plan ;
- destructive action manual approval ;
- no arbitrary SQL console.

---

# 44. Prisma / Database Admin

Administration peut fournir un diagnostic :

```text
Prisma schema status
Migrations
Database connectivity
Tenant isolation checks
RLS checks
```

Pas d’éditeur SQL libre.

---

# 45. Administrative Actions

Catalogue d’actions contrôlées :

```text
Suspend Tenant
Reactivate Tenant
Disable User
Revoke Sessions
Invalidate Cache
Restart/Refresh Module if supported
Rebuild Registry
Re-run Job
Enable Maintenance
Disable Provider
```

Chaque action doit avoir :
- permission ;
- input schema ;
- target validation ;
- confirmation policy ;
- audit.

---

# 46. Action Safety Levels

```text
LOW
MEDIUM
HIGH
CRITICAL
```

HIGH/CRITICAL :
- reason required ;
- re-auth ;
- MFA policy ;
- confirmation ;
- stronger audit.

---

# 47. Dry Run

Pour actions supportant simulation :

```text
DRY RUN
```

Aucun effet réel.

Résultat explicite.

---

# 48. Diagnostics

Administration agrège via contrats :

```text
IAM diagnostics
Billing diagnostics
Runtime diagnostics
Data diagnostics
Integration diagnostics
Deployment diagnostics
API diagnostics
Database diagnostics
```

Pas de logique dupliquée.

---

# 49. Diagnostic Result

```text
module
stage
code
severity
message
status
timestamp
traceId
```

---

# 50. Monitoring

Vue synthétique seulement :
- health ;
- incidents ;
- provider status ;
- job failures ;
- tenant anomalies.

Observability reste propriétaire des logs/metrics/traces.

---

# 51. System Information

Afficher :
- platform version ;
- commit/build ;
- environment ;
- runtime version ;
- DB schema version ;
- module versions ;
- feature flags count ;
- maintenance status.

Aucune info sensible.

---

# 52. IAM Permissions

Conceptuelles :

```text
admin.overview.read
admin.users.read
admin.users.manage
admin.tenants.read
admin.tenants.manage
admin.governance.read
admin.governance.manage
admin.delegation.read
admin.delegation.manage
admin.security.read
admin.audit.read
admin.modules.read
admin.modules.manage
admin.settings.read
admin.settings.manage
admin.feature_flags.read
admin.feature_flags.manage
admin.jobs.read
admin.jobs.execute
admin.maintenance.manage
admin.actions.execute
admin.diagnostics.read
```

Adapter au Registry réel.

---

# 53. Tenant Isolation

Même un Platform Admin doit respecter :
- scope de permission ;
- tenant target explicite ;
- action contract ;
- audit.

Support Admin ≠ Super Admin.

---

# 54. Impersonation

Si implémentée :
- explicite ;
- visible ;
- durée limitée ;
- no silent impersonation ;
- actions auditables ;
- forbidden for some operations.

Si absente, ne pas l’ajouter au MVP sans besoin.

---

# 55. Secrets

Jamais afficher :
- JWT secret ;
- DB password ;
- API keys ;
- provider secrets ;
- MFA secrets.

Afficher seulement refs/status.

---

# 56. API conceptuelle

Overview :

```http
GET /api/admin/overview
```

Users :

```http
GET  /api/admin/users
GET  /api/admin/users/:id
POST /api/admin/users/:id/disable
POST /api/admin/users/:id/enable
POST /api/admin/users/:id/revoke-sessions
```

Tenants :

```http
GET  /api/admin/tenants
GET  /api/admin/tenants/:id
POST /api/admin/tenants/:id/suspend
POST /api/admin/tenants/:id/reactivate
```

Governance :

```http
GET /api/admin/governance/roles
GET /api/admin/governance/permissions
GET /api/admin/governance/privileged-access
```

Delegation :

```http
GET  /api/admin/delegations
POST /api/admin/delegations
POST /api/admin/delegations/:id/revoke
```

Jobs / Maintenance :

```http
GET  /api/admin/jobs
POST /api/admin/jobs/:type
GET  /api/admin/jobs/:id
POST /api/admin/maintenance
DELETE /api/admin/maintenance/:id
```

Adapter aux APIs réelles.

---

# 57. Frontend

Les pages existantes `/admin/*` doivent consommer les services réels.

Interdit en REAL :
```text
adminUsersMockService
adminTenantsMockService
accessGovernanceMockService
delegationMockService
securityAuditMockService
adminMonitoringMockService
```

sauf DEV/TEST explicitement marqué.

---

# 58. UI Overview

Cards :
- tenants ;
- users ;
- critical alerts ;
- active delegations ;
- module health ;
- failed jobs ;
- maintenance.

---

# 59. User Admin UI

Table :
- User ;
- Status ;
- Tenant memberships ;
- Roles ;
- MFA ;
- Last sign-in ;
- Actions.

---

# 60. Tenant Admin UI

Table :
- Tenant ;
- Status ;
- Subscription ;
- Users ;
- Environments ;
- Last activity ;
- Alerts ;
- Actions.

---

# 61. Governance UI

Matrix :
- roles ;
- permissions ;
- assignments ;
- risk ;
- usage.

---

# 62. Delegation UI

Table :
- grantee ;
- grantor ;
- scope ;
- permissions ;
- starts ;
- expires ;
- status.

---

# 63. Security Audit UI

Filters :
- actor ;
- action ;
- target ;
- tenant ;
- severity ;
- period.

---

# 64. Module Admin UI

Table :
- Module ;
- Version ;
- Status ;
- Health ;
- Capabilities ;
- Owner ;
- Actions.

---

# 65. Feature Flags UI

Table :
- key ;
- scope ;
- default ;
- rules ;
- status ;
- owner ;
- expiry.

---

# 66. Jobs UI

Table :
- job ;
- scope ;
- status ;
- progress ;
- requested by ;
- duration ;
- actions.

---

# 67. Maintenance UI

Calendar/list :
- scope ;
- window ;
- status ;
- impact ;
- actor.

---

# 68. Tests unitaires

- permission matrix ;
- action policy ;
- delegation ;
- feature flag resolution ;
- job lifecycle ;
- maintenance ;
- target validation ;
- re-auth requirement.

---

# 69. Tests intégration

```text
Admin → IAM User Action
Admin → Tenant Action
Admin → Billing Policy
Admin → Runtime Diagnostic
Admin → Observability
Admin → Registry
```

---

# 70. Security Tests

- cross-scope admin ;
- support admin elevation ;
- forged target tenant ;
- self-delegation escalation ;
- expired delegation ;
- missing re-auth ;
- mock frontend in production ;
- arbitrary admin action ;
- secret leakage.

---

# 71. E2E

```text
Platform Admin Login + MFA
↓
Admin Overview
↓
Open Tenant
↓
Suspend with reason
↓
IAM/Tenant API
↓
Audit
↓
Tenant access blocked
↓
Reactivate
↓
Audit
```

Delegation :

```text
Security Admin
↓
Create temporary support delegation
↓
Support uses allowed read action
↓
Forbidden write denied
↓
Delegation expires
```

---

# 72. Definition of Done

Administration Platform est DONE si :

- backend admin existant réutilisé ;
- frontend mock remplacé par APIs réelles ;
- Administration n’accède pas directement aux tables des modules ;
- IAM/Billing/Observability non dupliqués ;
- permissions administratives explicites ;
- least privilege ;
- tenant scope ;
- délégation limitée/expirable ;
- re-auth/MFA sur actions critiques ;
- feature flags gouvernés ;
- providers sans secrets ;
- jobs persistés/traçables ;
- maintenance contrôlée ;
- no arbitrary SQL/shell ;
- diagnostics via contrats ;
- audit complet ;
- cross-admin/security tests verts ;
- E2E verts ;
- build/CI verts.
