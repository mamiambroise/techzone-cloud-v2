# CAHIER DES CHARGES --- TECHZONE CLOUD AUTH + IAM + CONTEXT

**CDC n°14**\
**Version :** 2.0 --- Consolidation V4 / architecture Techzone Cloud\
**Date :** Septembre 2026\
**Projet :** Techzone Cloud\
**Module :** Auth + IAM + Context\
**Statut :** Spécification consolidée\
**Principe :** Auth/IAM/Context est un socle autonome de Techzone Cloud.
Il doit fonctionner sans ERP et fournir à tous les modules un contrat
universel d'identité, d'authentification, de contexte, d'autorisation et
de sécurité.

------------------------------------------------------------------------

# 1. Objet

Le module répond aux cinq questions fondamentales :

``` text
QUI ?                  → Identity
COMMENT ?              → Authentication
OÙ / DANS QUEL CONTEXTE ? → Context
QUE PEUT-IL FAIRE ?    → Authorization
EST-CE SÛR ?           → Security / Risk
```

Il constitue la frontière de sécurité commune pour :

``` text
Dashboard
Business Manager
UI Builder
Automation
Pack Manager
Pack Runtime
Data Runtime
ERP Adapter / Integration Hub
Registry
Environment / Deployment
Observability
API & Integration Manager
Subscription & Billing
Administration
```

------------------------------------------------------------------------

# 2. Décision architecturale non négociable

Architecture cible :

``` text
Frontend React / TypeScript
        ↓ HTTPS / JSON
Backend NestJS / TypeScript
        ↓ Prisma / ORM
PostgreSQL Techzone Cloud
```

Auth/IAM/Context doit être **indépendant de l'ERP**.

Toute interaction ERP suit :

``` text
AUTH / IAM / CONTEXT
        ↓
ERP ADAPTER CONTRACT
        ↓
ERP ADAPTER / INTEGRATION HUB
        ↓
ERP EXTERNE
```

Interdit au Core IAM :

``` text
accès direct aux tables ERP
accès direct à la DB ERP
classes/fonctions internes ERP
session ERP comme session IAM
password ERP comme credential IAM
rôles/permissions ERP comme autorité IAM
API key ERP comme token IAM
```

Le système doit continuer à fonctionner si Dolibarr est arrêté ou
absent.

------------------------------------------------------------------------

# 3. Continuité et migration

Les implémentations historiques doivent être classées :

``` text
KEEP
IMPROVE
FIX
COMPLETE
ADAPT
PORT
REIMPLEMENT
IMPLEMENT
```

Avant modification, produire une Gap Matrix.

Les concepts historiques réutilisables incluent notamment :

``` text
Identity immutable
User lifecycle
Error Contract
trace/request ID
Password Policy
Security Decision
CAPTCHA Provider Registry
Audit/Event nomenclature
UI IAM existante si découplée
```

Une fonctionnalité ancienne n'est pas considérée DONE dans la cible
simplement parce qu'elle fonctionnait avec le backend ERP historique.

------------------------------------------------------------------------

# 4. Contrats fondamentaux

Le socle expose cinq contrats transversaux :

``` text
Universal Identity Contract
Context Contract
Authorization Decision Contract
Error Contract
Security Event Contract
```

Tous les modules Techzone Cloud doivent les consommer plutôt que recréer
leur propre identité ou moteur de droits.

------------------------------------------------------------------------

# 5. Architecture fonctionnelle

``` text
AUTH + IAM + CONTEXT
├── Authentication
├── Identity Registry
├── User Management
├── Organizations
├── Sites
├── Memberships
├── Roles
├── Permission Registry
├── RBAC
├── Policy Engine
├── Authorization Cache
├── Context Engine
├── Context Switch
├── Sessions
├── Tokens
├── MFA
├── Password Security
├── Brute Force Protection
├── CAPTCHA
├── Recovery
├── Audit
├── Security Events
└── IAM Dashboard
```

------------------------------------------------------------------------

# 6. Universal Identity

Une `Identity` est l'identifiant universel et stable d'un acteur.

Modèle conceptuel :

``` text
Identity
├── id
├── identityId immutable
├── type
├── status
├── createdAt
└── updatedAt
```

Le type initial obligatoire est :

``` text
HUMAN
```

Le modèle doit rester extensible pour de futurs types techniques si
nécessaire.

`identityId` ne doit jamais être remplacé par :

``` text
userId ERP
email
username
tenantId
sessionId
```

------------------------------------------------------------------------

# 7. User

`User` représente le profil humain associé à une Identity HUMAN.

Conceptuellement :

``` text
Identity HUMAN
      1:1
       ↓
User
├── username
├── email
├── phone
├── firstName
├── lastName
├── displayName
├── locale
├── timezone
└── status
```

Le User Techzone Cloud est autonome de l'utilisateur ERP.

------------------------------------------------------------------------

# 8. Lifecycle User

États à aligner sur l'existant consolidé :

``` text
ACTIVE
SUSPENDED
LOCKED
DISABLED
ARCHIVED
```

Actions :

``` text
activate
suspend
lock
unlock
disable
archive
```

Un utilisateur non actif ne doit pas pouvoir s'authentifier selon les
règles de lifecycle.

L'archive doit rester traçable et ne pas supprimer silencieusement
l'Identity.

------------------------------------------------------------------------

# 9. Authentication Orchestrator

Pipeline cible :

``` text
LOGIN REQUEST
↓
IDENTITY / USER DISCOVERY
↓
CREDENTIAL VERIFICATION
↓
BRUTE FORCE / RATE LIMIT DECISION
↓
CAPTCHA IF REQUIRED
↓
MFA IF REQUIRED
↓
SECURITY DECISION
↓
CREATE SESSION
↓
ISSUE TOKENS / SESSION STATE
↓
RESOLVE CONTEXT
↓
RESOLVE PERMISSIONS / POLICIES
↓
AUTH SUCCESS
↓
AUDIT + SECURITY EVENT
```

Le login doit pouvoir utiliser, selon politique :

``` text
username
email
phone
```

sans révéler si un compte précis existe.

------------------------------------------------------------------------

# 10. Login UI

L'écran doit gérer :

``` text
identifier
password
CAPTCHA conditionnel
MFA challenge
loading
generic error
recovery
```

Après succès :

``` text
LOGIN
→ CURRENT USER
→ VALID CONTEXT
→ EFFECTIVE PERMISSIONS
→ DASHBOARD
```

Une redirection ne doit pas précéder la résolution minimale du contexte
nécessaire.

------------------------------------------------------------------------

# 11. Password Security

Exigences :

``` text
password jamais en clair
hash moderne
policy configurable
minimum / maximum length
strength evaluation
history/reuse si activé
change password
compromised-password hook si supporté
```

Argon2id peut être privilégié si compatible avec l'implémentation
retenue.

Ne jamais réutiliser le password store ERP comme store IAM cible.

------------------------------------------------------------------------

# 12. Brute Force & Rate Limiting

Protéger au minimum :

``` text
login
recovery
MFA verification
sensitive authentication endpoints
```

Signaux possibles :

``` text
identity/user
IP
device
endpoint
time window
```

Décisions :

``` text
ALLOW
DENY
TEMPORARY_LOCK
CAPTCHA_REQUIRED
MFA_REQUIRED
```

Le lock temporaire de sécurité doit être distingué du lifecycle métier
`User LOCKED` si les deux concepts existent.

------------------------------------------------------------------------

# 13. CAPTCHA adaptatif

Le CAPTCHA doit être déclenché selon une décision de sécurité, pas
systématiquement.

Architecture :

``` text
Security Decision
↓
CAPTCHA Provider Registry
↓
Challenge
↓
Server-side Validation
```

Prévoir :

``` text
expiration
max attempts
anti-replay
provider abstraction
mock uniquement DEV/TEST
```

Aucun Mock provider ne doit être actif silencieusement en production.

------------------------------------------------------------------------

# 14. MFA

MVP/évolution selon capacité réelle :

``` text
TOTP
Email OTP
Recovery Codes
```

Lifecycle :

``` text
enroll
challenge
verify
remove
recover
```

Le système doit permettre d'imposer MFA par policy lorsque cette
fonction est activée.

------------------------------------------------------------------------

# 15. Recovery

Flux :

``` text
RESET REQUEST
↓
GENERIC RESPONSE
↓
ONE-TIME TOKEN
↓
TTL
↓
VERIFY
↓
RESET IAM CREDENTIAL
↓
SESSION REVOCATION POLICY
↓
AUDIT / EVENT
```

La réponse initiale ne doit pas révéler l'existence d'un compte.

------------------------------------------------------------------------

# 16. Sessions

Le système doit posséder son propre Session Registry.

Conceptuellement :

``` text
sessionId
identityId
userId
tenant/context
createdAt
lastSeenAt
idleExpiresAt
absoluteExpiresAt
deviceInfo?
ipInfo?
status
```

Fonctions :

``` text
list sessions
revoke session
revoke other sessions
revoke all sessions
concurrent-session policy
```

Aucune session ERP ne constitue la session IAM Techzone Cloud.

------------------------------------------------------------------------

# 17. Tokens

Si architecture tokenisée :

``` text
access token
refresh token
rotation
revocation
reuse detection
expiry
key management
```

Un refresh token rejoué après rotation doit pouvoir être détecté selon
la stratégie retenue.

Ne jamais réutiliser une API Key ERP comme token IAM.

------------------------------------------------------------------------

# 18. Organizations

Une Organization représente une structure organisationnelle IAM.

Conceptuellement :

``` text
id
tenantId?
key
name
status
metadata
```

Ne pas confondre automatiquement :

``` text
Organization IAM
≠
ERP entity
```

Un mapping ERP éventuel passe par Adapter/Integration Hub.

------------------------------------------------------------------------

# 19. Sites

Un Site appartient à une Organization.

``` text
Organization
   ↓
Sites
```

Il peut représenter une subdivision opérationnelle ou géographique
utilisée pour le contexte et les accès.

------------------------------------------------------------------------

# 20. Memberships

Membership lie une Identity/User à une Organization et éventuellement un
Site.

``` text
identityId
organizationId
siteId?
status
validFrom?
validUntil?
```

Actions :

``` text
create
activate
revoke
expire
```

La présence d'un User ne lui donne pas automatiquement accès à toutes
les Organizations.

------------------------------------------------------------------------

# 21. Tenant Context

Le Tenant reste la frontière SaaS principale.

Tout accès métier doit être évalué dans un contexte tenant valide.

Conceptuellement :

``` text
Identity
↓
Membership
↓
Tenant / Organization / Site
↓
Application
↓
Effective Context
```

Aucune valeur `tenantId` fournie par le frontend n'est suffisante sans
validation de membership/autorisation.

------------------------------------------------------------------------

# 22. Roles

Un Role regroupe des permissions.

Concept :

``` text
Role
├── key
├── name
├── scope
├── status
└── permissions
```

Scopes possibles selon architecture :

``` text
PLATFORM
TENANT
ORGANIZATION
SITE
APPLICATION
RESOURCE
```

Ne pas créer des scopes non utilisés.

------------------------------------------------------------------------

# 23. Permission Registry

Convention recommandée :

``` text
resource.action
```

Exemples :

``` text
business.read
business.update
pack.read
pack.publish
runtime.read
deployment.execute
observability.read
```

Le Registry IAM décrit les permissions disponibles.

Les modules propriétaires peuvent déclarer leurs permissions, mais IAM
reste l'autorité de décision.

------------------------------------------------------------------------

# 24. Deny by Default

Principe obligatoire :

``` text
UNKNOWN PERMISSION → DENY
NO ROLE → DENY
NO MEMBERSHIP → DENY
INVALID CONTEXT → DENY
POLICY DENY → DENY
```

L'absence de règle d'autorisation ne doit jamais signifier ALLOW.

------------------------------------------------------------------------

# 25. RBAC

Chaîne :

``` text
Identity / User
↓
Role Assignment
↓
Role
↓
Permission
↓
Scope
↓
Authorization Decision
```

Le backend doit disposer de Guards/Services cohérents.

Masquer un bouton frontend n'est pas une autorisation.

------------------------------------------------------------------------

# 26. Policy Engine

Le Policy Engine permet des décisions contextuelles au-delà du RBAC.

Entrées conceptuelles :

``` text
Subject
Resource
Action
Context
Conditions
```

Sorties possibles :

``` text
ALLOW
DENY
STEP_UP
APPROVAL
```

`APPROVAL` ne doit être utilisé que si une infrastructure d'approbation
existe réellement.

------------------------------------------------------------------------

# 27. Authorization Decision Contract

Format conceptuel :

``` text
decision
reasonCode
permissions
policyRefs?
context
requiresStepUp?
traceId
```

Une décision doit être déterministe et explicable.

------------------------------------------------------------------------

# 28. Authorization Cache

Peut mettre en cache :

``` text
effective permissions
resolved context
policy evaluation inputs/results adaptés
```

Invalider fortement lors de :

``` text
role change
permission change
policy change
membership change
context switch
user suspension
credential/security change pertinent
```

Aucune permission obsolète ne doit survivre à une révocation critique.

Prévoir une architecture Redis-ready si le déploiement distribué le
nécessite.

------------------------------------------------------------------------

# 29. Context Engine

Le Context Engine construit le contexte effectif.

Entrées :

``` text
identity
user
tenant
organization
site
application
session
roles
permissions
security state
```

Sortie :

``` text
ResolvedIAMContext
```

------------------------------------------------------------------------

# 30. ResolvedIAMContext

Contrat conceptuel :

``` text
identity
user
tenant
organization?
site?
application?
session
roles
permissions
security
contextVersion?
resolvedAt
```

Les modules consommateurs doivent pouvoir obtenir ce contexte de manière
stable.

------------------------------------------------------------------------

# 31. Context Switch

Exemple :

``` text
Tenant A
→ switch
Tenant B
```

Pipeline obligatoire :

``` text
REQUEST SWITCH
↓
VALIDATE MEMBERSHIP
↓
VALIDATE TARGET CONTEXT
↓
RECALCULATE ROLES
↓
RECALCULATE PERMISSIONS
↓
RECALCULATE POLICIES
↓
INVALIDATE OLD CONTEXT CACHE
↓
CREATE/UPDATE EFFECTIVE CONTEXT
↓
EVENT + AUDIT
↓
RELOAD NAVIGATION / DASHBOARD / MODULE
```

Aucune donnée du Tenant précédent ne doit rester visible après switch.

------------------------------------------------------------------------

# 32. Sidebar & Navigation Integration

Navigation effective :

``` text
Base Navigation
+ IAM Permissions
+ Tenant Context
+ Features
+ Module Availability
= Effective Navigation
```

Pendant le chargement IAM/Context :

``` text
skeleton / stable loading state
```

Interdit :

``` text
afficher tous les menus puis les masquer
```

Un utilisateur ne doit pas voir un flash de menus non autorisés.

------------------------------------------------------------------------

# 33. Route Protection

Une route protégée doit vérifier côté backend et, pour UX, côté
frontend.

États :

``` text
401 → authentication required
403 → authenticated but forbidden
404 → resource not found / hidden according to policy
```

Ne pas rediriger silencieusement toutes les erreurs vers Dashboard.

------------------------------------------------------------------------

# 34. API Protection

Pipeline type :

``` text
REQUEST
↓
AUTH GUARD
↓
SESSION/TOKEN VALIDATION
↓
TENANT CONTEXT
↓
PERMISSION
↓
POLICY
↓
RESOURCE OWNERSHIP
↓
CONTROLLER
```

Chaque module métier réutilise les composants IAM communs.

------------------------------------------------------------------------

# 35. Error Contract

Format d'erreur unique avec :

``` text
code
message public
traceId / trace_id
details sûrs
HTTP status
```

Codes minimum :

``` text
AUTH_INVALID_CREDENTIALS
AUTH_ACCOUNT_LOCKED
AUTH_ACCOUNT_DISABLED
AUTH_MFA_REQUIRED
AUTH_MFA_INVALID
AUTH_CAPTCHA_REQUIRED

IDENTITY_NOT_FOUND
IDENTITY_ALREADY_EXISTS

SESSION_EXPIRED
SESSION_REVOKED

TOKEN_INVALID
TOKEN_EXPIRED
TOKEN_REVOKED

CONTEXT_INVALID
CONTEXT_ACCESS_DENIED

PERMISSION_DENIED
POLICY_DENIED
STEP_UP_REQUIRED
```

Les messages publics ne doivent pas exposer les détails internes.

------------------------------------------------------------------------

# 36. Security Events

Événements possibles :

``` text
identity.created
user.status.changed
auth.login.success
auth.login.failed
auth.account.locked
auth.mfa.required
auth.mfa.failed
session.created
session.revoked
token.reuse.detected
context.switched
permission.denied
policy.denied
password.changed
recovery.completed
```

Le catalogue doit être contrôlé.

------------------------------------------------------------------------

# 37. Audit

Audit répond à :

``` text
QUI
a fait QUOI
sur QUELLE ressource
dans QUEL CONTEXTE
QUAND
avec QUEL RÉSULTAT
```

Champs :

``` text
actorIdentityId
effectiveIdentityId?
tenantId?
organizationId?
siteId?
sessionId?
device?
action
resourceType
resourceId
result
traceId
timestamp
```

Préférer une stratégie append-only pour les événements d'audit
critiques.

------------------------------------------------------------------------

# 38. Audit vs Security Event

``` text
Audit
→ traçabilité d’action

Security Event
→ événement de sécurité exploitable
```

Un login failed peut produire un Security Event et, selon politique, un
Audit.

Ne pas fusionner tous les concepts sans distinction.

------------------------------------------------------------------------

# 39. Observability Integration

Auth/IAM doit produire :

``` text
structured logs
requestId
correlationId
metrics
health
security diagnostics
```

Metrics possibles :

``` text
login_success_count
login_failure_count
locked_account_count
active_session_count
mfa_challenge_count
permission_denied_count
context_switch_count
```

Pas de labels contenant password/token/email brut.

------------------------------------------------------------------------

# 40. IAM Dashboard

Le cockpit IAM peut afficher des données réelles :

``` text
Active Users
Failed Logins
Locked Accounts
Active Sessions
MFA Coverage
Security Alerts
```

Aucun KPI ne doit être inventé.

Le Dashboard global Techzone Cloud peut agréger un sous-ensemble et
deep-linker vers IAM.

------------------------------------------------------------------------

# 41. Self-Service

Utilisateur authentifié :

``` text
My Profile
Change Password
My Sessions
MFA
Recovery Methods
Current Context
Available Contexts
```

Selon permissions/policies.

------------------------------------------------------------------------

# 42. Admin IAM

Administrateur autorisé :

``` text
Identities
Users
Organizations
Sites
Memberships
Roles
Permissions
Policies
Sessions
Security
Audit
```

La Sidebar globale peut rester compacte :

``` text
PLATEFORME
└── Sécurité & IAM
```

Les sous-sections restent dans le workspace IAM.

------------------------------------------------------------------------

# 43. External Identity Providers

Évolution possible :

``` text
OIDC
SAML
Social Login
Enterprise SSO
```

Ils sont hors MVP sauf implémentation réelle.

Toute fédération doit mapper vers l'Identity Techzone Cloud, qui reste
la référence interne.

------------------------------------------------------------------------

# 44. Passkeys / Passwordless

P1 possible :

``` text
WebAuthn / Passkeys
Magic Link
Passwordless
```

Ne pas afficher ces fonctions comme disponibles avant implémentation.

------------------------------------------------------------------------

# 45. Device Trust / Risk

P1 possible :

``` text
Device Manager
Device Trust
Risk Engine
Adaptive Authentication
Advanced Step-Up
```

Le modèle doit rester extensible sans obliger le MVP à simuler un moteur
de risque.

------------------------------------------------------------------------

# 46. Groups / Teams

P1 possible :

``` text
Groups
Teams
```

Ils ne remplacent pas automatiquement Organization/Site/Role.

Définir leur responsabilité avant implémentation.

------------------------------------------------------------------------

# 47. ABAC / ReBAC

RBAC est la base.

Des évolutions peuvent ajouter :

``` text
ABAC
ReBAC
```

uniquement si les cas métier le justifient.

Ne pas construire un moteur surcomplexe avant besoins réels.

------------------------------------------------------------------------

# 48. Delegation / Temporary Access

P1 possible :

``` text
Delegation
Temporary Access
Access Expiration
```

Toute délégation doit être :

``` text
scoped
time-bounded
audited
revocable
```

------------------------------------------------------------------------

# 49. Access Simulator / Explanation

P1 possible :

``` text
Can user X perform action Y on resource Z in context C?
Why ALLOW / DENY?
```

L'outil doit réutiliser le moteur réel, pas simuler une logique
différente.

------------------------------------------------------------------------

# 50. ERP Integration

IAM ne dépend pas de Dolibarr.

Si un mapping est nécessaire :

``` text
IAM Identity/User
↓
ERP Adapter Contract
↓
Integration Hub
↓
Dolibarr User
```

Le mapping externe ne change pas l'identité IAM.

------------------------------------------------------------------------

# 51. Business Manager Integration

Business Manager consomme :

``` text
Identity
Context
Permissions
Authorization Decision
```

Il ne crée pas un moteur IAM propre.

Les permissions fonctionnelles déclarées par BM doivent rejoindre le
Permission Registry selon les contrats retenus.

------------------------------------------------------------------------

# 52. UI Builder Integration

UI Builder utilise les permissions pour :

``` text
configuration-time visibility
action requirements
preview context
```

Le Runtime doit refaire l'autorisation réelle.

Une règle de visibilité UI ne remplace jamais une permission backend.

------------------------------------------------------------------------

# 53. Automation Integration

Automation doit vérifier :

``` text
actor
tenant
permissions
workflow permissions
service identity si exécution asynchrone
```

Une exécution différée doit conserver une identité/contexte d'exécution
explicite.

Ne pas utiliser implicitement les droits d'un super-admin système.

------------------------------------------------------------------------

# 54. Pack Manager Integration

Actions sensibles :

``` text
pack.create
pack.update
pack.validate
pack.publish
```

doivent passer par IAM.

Une publication doit être auditée.

------------------------------------------------------------------------

# 55. Pack Runtime Integration

Runtime reçoit un contexte IAM stable pour :

``` text
effective tenant
identity
permissions
security context
```

Runtime ne doit pas faire confiance à un tenantId arbitraire du
frontend.

------------------------------------------------------------------------

# 56. Data Runtime Integration

Toute query/mutation doit être scoped par :

``` text
tenant
identity/service identity
permissions
data policies
resource context
```

IAM décide l'accès ; Data Runtime exécute la politique Data
correspondante.

------------------------------------------------------------------------

# 57. Integration Hub Integration

Les opérations ERP sensibles passent par :

``` text
IAM Decision
↓
Integration Contract
↓
Integration Hub
```

Le connecteur externe n'est pas une autorité IAM.

------------------------------------------------------------------------

# 58. Registry Integration

Registry peut indexer :

``` text
permissions
roles metadata si nécessaire
IAM capabilities
authentication capabilities
```

IAM reste propriétaire de leur signification et décision.

------------------------------------------------------------------------

# 59. Environment & Deployment Integration

Déployer en environnement protégé nécessite les permissions adaptées.

Exemple conceptuel :

``` text
deployment.read
deployment.execute
deployment.rollback
```

Les noms réels doivent provenir du Permission Registry.

------------------------------------------------------------------------

# 60. API & Integration Manager Integration

API Clients et service identities doivent s'intégrer à IAM.

Distinction :

``` text
Human Identity
Service Identity / API Client
Credential
Scope
Permission
Tenant
```

API Manager gère exposition/clients/scopes ; IAM reste l'autorité
d'identité/autorisation selon le contrat défini.

------------------------------------------------------------------------

# 61. Subscription & Billing

Un plan peut conditionner l'accès à certaines fonctionnalités, mais :

``` text
Entitlement ≠ Permission
```

Flux :

``` text
Subscription Entitlement
AND
IAM Authorization
→ Effective Access
```

Un abonnement actif ne donne pas automatiquement des droits
administrateur.

------------------------------------------------------------------------

# 62. Administration Platform

Administration globale utilise IAM pour :

``` text
platform admins
tenant admins
security admins
support roles
```

Les privilèges plateforme doivent être explicitement séparés des
privilèges Tenant.

------------------------------------------------------------------------

# 63. Modèles conceptuels

À auditer avant Prisma :

``` text
Identity
User
UserProfile
IdentityCredential
PasswordHistory
Organization
Site
Membership
Role
Permission
RolePermission
IdentityRole
Policy
Session
RefreshToken
MfaMethod
RecoveryCode
SecurityCounter
TemporaryLock
CaptchaChallenge
SecurityEvent
AuditLog
ExternalAccountMapping
```

Ne pas créer toutes les tables aveuglément.

Procédure :

``` text
AUDIT
→ MAP EXISTING MODELS
→ KEEP / ADAPT / REIMPLEMENT
→ MINIMAL SCHEMA CHANGE
```

------------------------------------------------------------------------

# 64. API conceptuelle

Adapter aux routes existantes.

``` http
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/recovery/request
POST /api/auth/recovery/complete

GET  /api/iam/me
GET  /api/iam/context
POST /api/iam/context/switch

GET  /api/iam/identities
GET  /api/iam/users
GET  /api/iam/organizations
GET  /api/iam/sites
GET  /api/iam/memberships
GET  /api/iam/roles
GET  /api/iam/permissions
GET  /api/iam/policies

GET  /api/iam/sessions
POST /api/iam/sessions/:id/revoke

GET  /api/iam/security/events
GET  /api/iam/audit
```

Ne pas créer des doublons si les endpoints existants sont stables.

------------------------------------------------------------------------

# 65. API `/me`

Doit permettre au frontend de récupérer une représentation sûre :

``` text
identity
user
currentContext
availableContexts
effectiveRoles
effectivePermissions
securityState
```

Ne pas exposer :

``` text
password hashes
refresh token
MFA secret
recovery codes
internal secrets
```

------------------------------------------------------------------------

# 66. Security Headers / Transport

Production :

``` text
HTTPS obligatoire
secure cookies si cookies
HttpOnly si pertinent
SameSite selon architecture
CORS contrôlé
CSRF si session/cookie
```

Ne pas dépendre d'un CSRF ERP historique.

------------------------------------------------------------------------

# 67. Secret Management

Secrets concernés :

``` text
token signing keys
MFA secrets
provider credentials
recovery secrets
session secrets
```

Ils doivent utiliser un stockage adapté et ne jamais apparaître dans les
logs.

------------------------------------------------------------------------

# 68. PII

Les données User sont personnelles.

Appliquer :

``` text
least exposure
permission-based access
safe logging
controlled exports
retention rules
```

Ne pas journaliser inutilement email/téléphone complet.

------------------------------------------------------------------------

# 69. Concurrence

Les opérations sensibles doivent être sûres face aux courses :

``` text
double context switch
double password reset
double token refresh
simultaneous revocation
role change during request
```

Utiliser transactions/verrous/versioning lorsque nécessaire.

------------------------------------------------------------------------

# 70. Security Cache Invalidation

Événements déclencheurs :

``` text
membership.revoked
role.updated
permission.updated
policy.updated
user.suspended
session.revoked
context.switched
credential.changed
```

Les caches de sécurité concernés doivent être invalidés.

------------------------------------------------------------------------

# 71. Health

Distinguer :

``` text
IAM Process Health
IAM DB Health
Authentication Readiness
Session Store Health
Authorization Readiness
External IdP Health if used
```

IAM doit rester healthy/readable indépendamment de l'ERP lorsque ses
propres dépendances fonctionnent.

------------------------------------------------------------------------

# 72. UI/UX

Direction :

**Techzone Cloud Security Console 2026**

Principes :

-   interface SaaS B2B ;
-   claire et dense ;
-   états explicites ;
-   actions sensibles confirmées ;
-   permissions lisibles ;
-   contexte visible ;
-   Techzone Blue ;
-   fond slate clair ;
-   cards blanches ;
-   bordures fines ;
-   radius 10--12 px ;
-   ombres discrètes ;
-   responsive ;
-   accessible.

------------------------------------------------------------------------

# 73. Header global

Afficher selon architecture :

``` text
Current Tenant
Current Organization/Site si utile
User
Notifications
Profile
```

Le sélecteur Tenant doit utiliser le Context Switch officiel.

------------------------------------------------------------------------

# 74. États UI

``` text
LOADING
LOADED
EMPTY
ERROR
FORBIDDEN
UNAVAILABLE
```

Authentication :

``` text
AUTHENTICATING
MFA_REQUIRED
CAPTCHA_REQUIRED
AUTHENTICATED
SESSION_EXPIRED
```

Ne jamais afficher l'application protégée avant validation suffisante du
contexte.

------------------------------------------------------------------------

# 75. Accessibilité

Prévoir :

-   clavier ;
-   focus visible ;
-   labels ;
-   erreurs associées aux champs ;
-   modales accessibles ;
-   contraste ;
-   état non communiqué uniquement par couleur ;
-   MFA/CAPTCHA accessibles selon provider.

------------------------------------------------------------------------

# 76. Business Rules

**RG-IAM-001** --- Identity est la référence universelle interne.\
**RG-IAM-002** --- `identityId` est immutable.\
**RG-IAM-003** --- User et Identity sont distincts.\
**RG-IAM-004** --- Le Core IAM fonctionne sans ERP.\
**RG-IAM-005** --- Aucun accès direct IAM à la DB/API interne ERP hors
Adapter Contract.\
**RG-IAM-006** --- Les credentials IAM sont propres à Techzone Cloud.\
**RG-IAM-007** --- Les sessions IAM sont propres à Techzone Cloud.\
**RG-IAM-008** --- Aucun password n'est stocké en clair.\
**RG-IAM-009** --- Les erreurs login ne permettent pas l'énumération de
comptes.\
**RG-IAM-010** --- Un User désactivé/suspendu selon policy ne peut pas
s'authentifier.\
**RG-IAM-011** --- Brute Force Protection précède la création de
session.\
**RG-IAM-012** --- CAPTCHA est adaptatif et server-side validated.\
**RG-IAM-013** --- Un CAPTCHA DEV/TEST ne devient pas provider
production silencieusement.\
**RG-IAM-014** --- MFA respecte son lifecycle et ses policies.\
**RG-IAM-015** --- Recovery utilise un token à usage unique et TTL.\
**RG-IAM-016** --- Session expiration/revocation est appliquée côté
backend.\
**RG-IAM-017** --- Refresh token rotation/revocation est appliquée si
tokens utilisés.\
**RG-IAM-018** --- Tenant Context est validé côté backend.\
**RG-IAM-019** --- Context Switch valide le membership cible.\
**RG-IAM-020** --- Context Switch recalcule les droits effectifs.\
**RG-IAM-021** --- Context Switch invalide les caches de contexte/droits
concernés.\
**RG-IAM-022** --- Aucun résidu de données du Tenant précédent ne doit
subsister après switch.\
**RG-IAM-023** --- Deny by Default s'applique à l'autorisation.\
**RG-IAM-024** --- Une permission inconnue est refusée.\
**RG-IAM-025** --- Les Guards backend restent l'autorité d'accès.\
**RG-IAM-026** --- Cacher un menu ou bouton ne constitue pas une
sécurité.\
**RG-IAM-027** --- Les policies produisent une décision explicite.\
**RG-IAM-028** --- Une permission révoquée ne doit pas survivre dans un
cache obsolète.\
**RG-IAM-029** --- Les rôles plateforme et Tenant sont séparés.\
**RG-IAM-030** --- Les Memberships sont scoped et révocables.\
**RG-IAM-031** --- Organization IAM n'est pas automatiquement une entity
ERP.\
**RG-IAM-032** --- Les Security Events utilisent un catalogue contrôlé.\
**RG-IAM-033** --- L'Audit conserve acteur, contexte, action et
résultat.\
**RG-IAM-034** --- Les secrets/tokens ne sont jamais journalisés.\
**RG-IAM-035** --- Les erreurs publiques n'exposent pas les détails
internes.\
**RG-IAM-036** --- Chaque erreur critique est corrélable via
trace/request ID.\
**RG-IAM-037** --- Les modules métiers consomment le contrat IAM
commun.\
**RG-IAM-038** --- Les service identities n'obtiennent pas implicitement
les droits super-admin.\
**RG-IAM-039** --- Entitlement Subscription et Permission IAM restent
distincts.\
**RG-IAM-040** --- Aucun mock/fallback silencieux n'est autorisé en mode
REAL.

------------------------------------------------------------------------

# 77. Tests unitaires

Tester au minimum :

``` text
Identity creation / immutable ID
User lifecycle
password policy
credential verification
brute-force decisions
CAPTCHA lifecycle / replay
MFA lifecycle
recovery token TTL / one-time use
session expiry/revocation
token rotation/reuse
membership
role/permission resolution
policy decisions
deny-by-default
context resolution
context switch
cache invalidation
error contract
audit/event normalization
```

------------------------------------------------------------------------

# 78. Tests d'intégration

Scénarios :

``` text
LOGIN
→ Session
→ Context
→ Permission
→ Protected API
```

``` text
Context Switch
→ Membership
→ Recalculate
→ Cache Invalidation
→ Sidebar
→ Dashboard
```

``` text
Role Revocation
→ Authorization Cache Invalidation
→ API Denied
```

``` text
IAM
→ ERP Adapter Contract
→ ERP
```

avec preuve que IAM reste opérationnel si ERP indisponible.

------------------------------------------------------------------------

# 79. Tests sécurité

Tester :

``` text
anonymous
invalid credentials
user enumeration
brute force
CAPTCHA replay
MFA replay
recovery replay
session fixation
session revocation
refresh reuse
wrong tenant
forged tenantId
forged membership
privilege escalation
role escalation
permission cache stale
cross-tenant access
CSRF
CORS
token leakage
secret leakage
stack trace leakage
```

------------------------------------------------------------------------

# 80. E2E principal

``` text
LOGIN
↓
IDENTITY
↓
USER
↓
AUTHENTICATION
↓
SESSION
↓
CONTEXT RESOLUTION
↓
TENANT
↓
EFFECTIVE PERMISSIONS
↓
DASHBOARD
↓
OPEN BUSINESS MANAGER
↓
AUTHORIZED
```

------------------------------------------------------------------------

# 81. E2E Context Switch

``` text
TENANT A
↓
OPEN DATA
↓
SWITCH TENANT B
↓
VALIDATE MEMBERSHIP
↓
RECALCULATE CONTEXT
↓
INVALIDATE CACHE
↓
RELOAD NAVIGATION
↓
RELOAD DASHBOARD
↓
NO TENANT A DATA
```

------------------------------------------------------------------------

# 82. E2E Security

``` text
FAILED LOGIN × N
↓
SECURITY DECISION
↓
CAPTCHA / TEMP LOCK
↓
SECURITY EVENT
↓
OBSERVABILITY
```

MFA :

``` text
VALID PASSWORD
↓
MFA_REQUIRED
↓
VALID OTP
↓
SESSION CREATED
```

------------------------------------------------------------------------

# 83. Recette navigateur

Vérifier :

``` text
Login
Logout
Session expiry
Recovery
MFA
Identity list/detail
Users list/detail
User lifecycle
Organizations
Sites
Memberships
Roles
Permissions
Policies
Context selector
Context switch
Sessions
Security Events
Audit
IAM Dashboard
```

Tester :

``` text
Desktop
Tablet
Mobile
401
403
404
loading
empty
error
unavailable
```

------------------------------------------------------------------------

# 84. Gap Matrix obligatoire

  Domaine       Exigence              Existant   État   Décision        Tests
  ------------- --------------------- ---------- ------ --------------- -------
  Foundation    NestJS IAM            ...        ...    KEEP/PORT/...   ...
  Foundation    PostgreSQL/Prisma     ...        ...    ...             ...
  Contract      Error Contract        ...        ...    ...             ...
  Identity      Identity Registry     ...        ...    ...             ...
  User          User Management       ...        ...    ...             ...
  Auth          Login Orchestrator    ...        ...    ...             ...
  Security      Password              ...        ...    ...             ...
  Security      Brute Force           ...        ...    ...             ...
  Security      CAPTCHA               ...        ...    ...             ...
  Security      MFA                   ...        ...    ...             ...
  Session       Sessions              ...        ...    ...             ...
  Session       Tokens                ...        ...    ...             ...
  Recovery      Password Recovery     ...        ...    ...             ...
  Structure     Organizations         ...        ...    ...             ...
  Structure     Sites                 ...        ...    ...             ...
  Structure     Memberships           ...        ...    ...             ...
  AuthZ         Roles                 ...        ...    ...             ...
  AuthZ         Permission Registry   ...        ...    ...             ...
  AuthZ         RBAC                  ...        ...    ...             ...
  AuthZ         Policy Engine         ...        ...    ...             ...
  AuthZ         Authorization Cache   ...        ...    ...             ...
  Context       Resolver              ...        ...    ...             ...
  Context       Context Switch        ...        ...    ...             ...
  Audit         Audit                 ...        ...    ...             ...
  Events        Security Events       ...        ...    ...             ...
  UI            IAM Dashboard         ...        ...    ...             ...
  Integration   Sidebar/Dashboard     ...        ...    ...             ...
  Integration   ERP Adapter           ...        ...    ...             ...
  Integration   Observability         ...        ...    ...             ...

Ne jamais déclarer `IMPLEMENT` avant recherche réelle.

------------------------------------------------------------------------

# 85. Ordre d'implémentation recommandé

``` text
FOUNDATION
↓
IAM-024 Error Contract
↓
IAM-001 Identity
↓
IAM-002 User
```

Structure et autorisation :

``` text
IAM-007 Organizations
↓
IAM-008 Sites
↓
IAM-009 Memberships
      +
IAM-010 Roles
      +
IAM-011 Permission Registry
↓
IAM-012 RBAC
↓
IAM-013 Policy Engine
↓
IAM-023 Authorization Cache
↓
IAM-014 Context Engine
↓
IAM-015 Context Switch
```

Authentification :

``` text
IAM-004 Password Security
↓
IAM-006 Brute Force / Rate Limit
↓
IAM-005 CAPTCHA
      +
IAM-016 Sessions
↓
IAM-017 Tokens
↓
IAM-018 MFA
↓
IAM-003 Authentication Orchestrator
↓
IAM-019 Recovery
```

Finalisation :

``` text
IAM-020 Audit
+
IAM-021 Security Events
↓
IAM-022 Admin Dashboard
↓
RECETTE GLOBALE
```

Les dépendances exactes doivent être adaptées à l'état réel du projet.

------------------------------------------------------------------------

# 86. Plan de consolidation

## Phase 0 --- Audit réel

Rechercher frontend, backend, Prisma, guards, middleware, sessions,
auth, routes, tests, anciens adapters et couplages ERP.

## Phase 1 --- Gap Matrix

Classer chaque exigence.

## Phase 2 --- Foundation

Stabiliser NestJS, PostgreSQL/Prisma, contracts, health IAM indépendant
ERP.

## Phase 3 --- Identity/User

Porter/stabiliser Identity et User.

## Phase 4 --- Organization & Authorization

Organizations, Sites, Memberships, Roles, Permissions, RBAC, Policy.

## Phase 5 --- Context

Resolver et Switch avec invalidation forte.

## Phase 6 --- Authentication

Password, protections, CAPTCHA, Sessions, Tokens, MFA, Login, Recovery.

## Phase 7 --- Audit/Security

Audit, Security Events, Observability.

## Phase 8 --- UI

Login, IAM workspace, selectors, sessions, security, Dashboard.

## Phase 9 --- Integration

Sidebar, Dashboard global et tous modules consommateurs.

## Phase 10 --- Tests

Unit, integration, security, E2E, browser recipe.

------------------------------------------------------------------------

# 87. Anti-couplage ERP

La recette doit inclure un contrôle spécifique :

``` text
ERP OFF
↓
IAM STARTS
↓
LOGIN WORKS
↓
SESSION WORKS
↓
CONTEXT WORKS
↓
PERMISSIONS WORK
↓
IAM UI WORKS
```

Les seules fonctionnalités nécessitant réellement l'ERP peuvent être
indisponibles/degraded via Integration Hub.

------------------------------------------------------------------------

# 88. Non-régression

Vérifier :

``` text
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
```

Aucune consolidation IAM ne doit casser les routes fonctionnelles
existantes.

------------------------------------------------------------------------

# 89. Definition of Done

Le CDC n°14 est considéré implémenté uniquement si :

-   architecture IAM autonome ;
-   aucun couplage direct ERP dans le Core ;
-   Identity stable/immutable ;
-   User lifecycle réel ;
-   authentification réelle ;
-   passwords sécurisés ;
-   brute-force/rate-limit réel ;
-   CAPTCHA adaptatif si activé ;
-   MFA réel si activé ;
-   Recovery sécurisé ;
-   Session Registry réel ;
-   tokens sûrs si utilisés ;
-   Organizations/Sites/Memberships fonctionnels selon périmètre ;
-   Roles/Permissions/RBAC fonctionnels ;
-   Policy Engine selon périmètre ;
-   Deny by Default ;
-   Authorization Cache avec invalidation sûre si utilisé ;
-   Context Resolver réel ;
-   Context Switch sûr ;
-   aucun stale Tenant data après switch ;
-   Error Contract commun ;
-   Audit réel ;
-   Security Events réels ;
-   Observability intégrée ;
-   Sidebar permission-aware ;
-   Dashboard permission-aware ;
-   backend protège directement les routes ;
-   aucun secret/token/password dans logs ;
-   aucun faux KPI ;
-   aucun mock silencieux en REAL ;
-   Prisma validate/generate passe si modifié ;
-   backend build passe ;
-   frontend build passe ;
-   tests applicables passent ;
-   tests sécurité passent ;
-   E2E passe ;
-   recette navigateur passe ;
-   scan anti-couplage ERP passe.

------------------------------------------------------------------------

# 90. Principe final

``` text
IDENTITY
Qui est l’acteur ?
      ↓
AUTHENTICATION
A-t-il prouvé son identité ?
      ↓
SESSION
Son authentification est-elle encore valide ?
      ↓
CONTEXT
Dans quel Tenant / Organization / Site / Application agit-il ?
      ↓
AUTHORIZATION
Peut-il effectuer cette action sur cette ressource ?
      ↓
SECURITY
Une protection supplémentaire est-elle nécessaire ?
      ↓
BUSINESS / PLATFORM MODULE
Exécution autorisée
```

Et la frontière ERP reste :

``` text
IAM
↓
ERP ADAPTER CONTRACT
↓
INTEGRATION HUB
↓
ERP
```

Règle de développement :

``` text
AUDIT
→ PRESERVE VALID CONTRACTS
→ DECOUPLE ERP
→ PORT / REIMPLEMENT
→ SECURE
→ CONNECT CONTEXT
→ AUTHORIZE
→ OBSERVE
→ TEST
```
