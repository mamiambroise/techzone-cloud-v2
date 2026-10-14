# CAHIER DES CHARGES — TECHZONE CLOUD AUTH + IAM + CONTEXT
## Étape 1 — Cible fonctionnelle et architecturale

**Projet :** Techzone Cloud  
**Module :** Auth + IAM + Context  
**Version cible :** 3.0  
**Statut :** Spécification cible  
**Branche canonique :** `origin/main`  
**Principe directeur :** Auth/IAM/Context est la frontière universelle d’identité, d’authentification, de contexte, d’autorisation et de sécurité de Techzone Cloud.

---

# 1. Objet

Le module Auth + IAM + Context doit répondre à cinq questions :

```text
QUI ?
→ Identity

COMMENT A-T-IL PROUVÉ SON IDENTITÉ ?
→ Authentication

DANS QUEL CONTEXTE AGIT-IL ?
→ Tenant / Organization / Site / Application Context

QUE PEUT-IL FAIRE ?
→ Roles / Permissions / Policies / Authorization Decision

L’ACTION EST-ELLE SÛRE ?
→ Security Decision / MFA / Rate Limit / Risk / Audit
```

Il constitue une dépendance transverse de :

- Dashboard ;
- Business Manager ;
- UI Builder ;
- Automation ;
- Pack Manager ;
- Pack Runtime ;
- Data Runtime ;
- ERP Adapter / Integration Hub ;
- Registry ;
- Environment & Deployment ;
- API & Integration Manager ;
- Subscription & Billing ;
- Administration Platform ;
- Observability.

---

# 2. Décisions architecturales non négociables

Architecture cible :

```text
Frontend React
      ↓ HTTPS / JSON
Backend NestJS
      ↓
AUTH + IAM + CONTEXT
      ↓
Prisma
      ↓
PostgreSQL Techzone Cloud
```

Le Core IAM est autonome de l’ERP.

Flux autorisé pour une interaction ERP :

```text
IAM
 ↓
ERP ADAPTER CONTRACT
 ↓
INTEGRATION HUB
 ↓
ERP EXTERNE
```

Sont interdits dans le Core IAM :

- accès direct à la base ERP ;
- session ERP utilisée comme session IAM ;
- mot de passe ERP utilisé comme credential IAM ;
- rôle ERP utilisé comme autorité IAM ;
- API key ERP utilisée comme token IAM ;
- dépendance bloquante à Dolibarr.

L’arrêt de l’ERP ne doit pas empêcher :

- login ;
- logout ;
- session ;
- Context Resolution ;
- Context Switch ;
- RBAC ;
- IAM UI ;
- gestion des utilisateurs IAM.

---

# 3. Principe de continuité

Aucune fonctionnalité saine n’est réécrite sans nécessité.

Chaque composant est classé :

```text
KEEP       → présent et fonctionnel
IMPROVE    → fonctionnel mais améliorable
FIX        → présent mais incorrect / vulnérable
COMPLETE   → partiel
ADAPT      → réutilisable après adaptation
IMPLEMENT  → réellement absent
```

Avant développement :

```text
AUDIT
→ GAP MATRIX
→ KEEP
→ FIX
→ COMPLETE
→ IMPLEMENT
→ TEST
```

---

# 4. Contrats fondamentaux

IAM expose au minimum :

1. Universal Identity Contract
2. Authentication Contract
3. Session Contract
4. Context Contract
5. Authorization Decision Contract
6. Error Contract
7. Security Event Contract
8. Audit Contract

Les modules consommateurs ne doivent pas recréer un moteur parallèle d’identité ou d’autorisation.

---

# 5. Architecture fonctionnelle

```text
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
├── Refresh Tokens
├── MFA
├── Password Security
├── Brute Force Protection
├── CAPTCHA
├── Recovery
├── Devices / Session Devices
├── Audit
├── Security Events
└── IAM Dashboard
```

---

# 6. Universal Identity

`Identity` est l’identifiant interne stable d’un acteur.

```text
Identity
├── id
├── identityId immutable
├── type
├── status
├── createdAt
└── updatedAt
```

Type minimum MVP :

```text
HUMAN
```

Évolution possible :

```text
SERVICE
API_CLIENT
SYSTEM
```

`identityId` ne doit jamais être confondu avec :

- email ;
- username ;
- tenantId ;
- sessionId ;
- userId ERP.

---

# 7. User

Le `User` est le profil humain lié à une Identity.

```text
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

Lifecycle :

```text
ACTIVE
SUSPENDED
LOCKED
DISABLED
ARCHIVED
```

Un utilisateur non actif ne peut pas s’authentifier selon la policy applicable.

---

# 8. Authentication Orchestrator

Pipeline obligatoire :

```text
LOGIN REQUEST
↓
NORMALIZE IDENTIFIER
↓
IDENTITY / USER DISCOVERY
↓
CREDENTIAL VERIFICATION
↓
TENANT / MEMBERSHIP ELIGIBILITY
↓
BRUTE FORCE / RATE LIMIT DECISION
↓
CAPTCHA IF REQUIRED
↓
MFA CHALLENGE IF REQUIRED
↓
MFA VERIFICATION
↓
SECURITY DECISION
↓
CREATE SESSION
↓
ISSUE SESSION / TOKENS
↓
RESOLVE CONTEXT
↓
RESOLVE EFFECTIVE PERMISSIONS
↓
AUTH SUCCESS
↓
AUDIT + SECURITY EVENT
```

**Règle critique : aucune session authentifiée complète ne doit être créée avant la validation de toutes les étapes obligatoires, dont MFA lorsque requis.**

Identifiants possibles selon policy :

- username ;
- email ;
- phone.

La réponse ne doit pas permettre l’énumération de comptes.

---

# 9. Tenant et Membership au login

Le frontend ne constitue jamais l’autorité du Tenant.

Si un `tenantId` est fourni comme préférence ou contexte demandé :

```text
tenantId demandé
↓
rechercher Membership active de l’Identity
↓
vérifier statut Tenant/Membership
↓
autoriser ou refuser
↓
seulement ensuite créer le contexte/session
```

Cas sans Tenant explicitement choisi :

- 0 membership valide → accès limité / erreur contrôlée ;
- 1 membership valide → résolution automatique possible ;
- plusieurs memberships → sélecteur de contexte.

Un `tenantId` arbitraire envoyé par le navigateur ne suffit jamais à autoriser l’accès.

---

# 10. Password Security

Exigences :

- aucun mot de passe en clair ;
- hash moderne ;
- salt approprié ;
- policy configurable ;
- minimum/maximum ;
- strength ;
- prévention de réutilisation si activée ;
- changement mot de passe ;
- révocation/session policy après changement ;
- erreurs génériques.

Le credential IAM reste indépendant de l’ERP.

---

# 11. Brute Force & Rate Limiting

Doit protéger au minimum :

- login ;
- MFA verify ;
- recovery request ;
- recovery complete ;
- refresh sensible ;
- context-switch sensible si policy requise.

Dimensions possibles :

- identity ;
- IP ;
- device ;
- endpoint ;
- fenêtre temporelle.

Décisions :

```text
ALLOW
DENY
TEMPORARY_LOCK
CAPTCHA_REQUIRED
MFA_REQUIRED
```

Le lock temporaire de sécurité est distinct du lifecycle métier `LOCKED`.

---

# 12. MFA

Méthode MVP cible :

```text
TOTP
```

Évolutions possibles :

```text
Email OTP
Recovery Codes
WebAuthn / Passkeys
```

Lifecycle :

```text
ENROLL
→ CONFIRM
→ ENABLED
→ CHALLENGE
→ VERIFY
→ RECOVER / REMOVE
```

Flux login MFA :

```text
PASSWORD VALID
↓
MFA REQUIRED
↓
CREATE OPAQUE MFA CHALLENGE
↓
TTL + MAX ATTEMPTS + ONE-TIME USE
↓
VERIFY TOTP
↓
CONSUME CHALLENGE
↓
CREATE SESSION
```

Le challenge doit être lié à :

- identité ;
- tentative de login ;
- contexte demandé si applicable ;
- expiration ;
- état consumed/not consumed.

Un challenge ne peut pas être réutilisé.

---

# 13. CAPTCHA adaptatif

Le CAPTCHA n’est pas systématique.

```text
Security Decision
↓
CAPTCHA Provider
↓
Challenge
↓
Server-side Verification
```

Contraintes :

- TTL ;
- max attempts ;
- anti-replay ;
- provider abstraction ;
- mock uniquement DEV/TEST ;
- aucun fallback silencieux en production.

---

# 14. Recovery

```text
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
AUDIT + SECURITY EVENT
```

La première réponse est toujours générique.

---

# 15. Sessions

Le module maintient son propre Session Registry.

Une session contient au minimum :

- sessionId ;
- identityId ;
- userId ;
- tenant/context effectif ;
- createdAt ;
- expiresAt ;
- revokedAt éventuel ;
- lastSeenAt ;
- device metadata contrôlée ;
- security state.

Actions :

- lister mes sessions ;
- révoquer une session ;
- révoquer toutes les autres sessions ;
- expiration ;
- invalidation après événements sensibles.

Le backend recoupe les tokens avec une session active.

---

# 16. Refresh Tokens

Si utilisés :

- rotation ;
- révocation ;
- stockage sûr ;
- détection de reuse ;
- lien avec session ;
- TTL ;
- audit des anomalies.

Un refresh token révoqué ou réutilisé doit être refusé.

---

# 17. Organizations, Sites et Memberships

Hiérarchie conceptuelle :

```text
Identity/User
↓
Membership
↓
Tenant
├── Organization
└── Site
```

Une Membership définit :

- identity ;
- tenant ;
- organization/site éventuel ;
- statut ;
- rôles ;
- dates de validité éventuelles.

Elle est révocable et tenant-scoped.

---

# 18. Roles et Permissions

RBAC est la base.

```text
Identity
↓
Membership
↓
Role(s)
↓
Permission(s)
↓
Policy
↓
Authorization Decision
```

Règle :

```text
UNKNOWN PERMISSION = DENY
MISSING METADATA ON SENSITIVE ROUTE = DENY
INVALID RESOURCE RESOLUTION = DENY
UNKNOWN TENANT = DENY
```

Le backend est l’autorité.

Masquer un menu ou un bouton ne constitue jamais une sécurité.

---

# 19. Authorization Decision

Contrat conceptuel :

```json
{
  "decision": "ALLOW | DENY",
  "identityId": "...",
  "tenantId": "...",
  "permission": "...",
  "resource": "...",
  "reasonCode": "...",
  "traceId": "..."
}
```

Le moteur doit être **fail-closed**.

---

# 20. Context Engine

Contexte possible :

```text
Tenant
Organization
Site
Application
Environment
```

Contexte minimal effectif :

```text
Identity
+ Session
+ Tenant
+ Membership
+ Effective Permissions
```

---

# 21. Context Switch

Pipeline :

```text
REQUEST TARGET CONTEXT
↓
VALIDATE SESSION
↓
VALIDATE TARGET TENANT
↓
VALIDATE MEMBERSHIP
↓
RESOLVE ROLES
↓
RESOLVE PERMISSIONS
↓
APPLY POLICIES
↓
INVALIDATE OLD AUTHORIZATION CACHE
↓
CREATE/UPDATE EFFECTIVE CONTEXT
↓
REFRESH FRONTEND
```

Après switch :

- aucune donnée du Tenant précédent ;
- permissions recalculées ;
- navigation recalculée ;
- cache invalidé ;
- audit généré.

---

# 22. Authorization Cache

Si utilisé :

- clé tenant + identity + membership + version/policy ;
- TTL ;
- invalidation lors de changement rôle/permission/membership ;
- invalidation lors de Context Switch ;
- jamais utilisé comme autorité permanente.

---

# 23. Audit

Actions minimales auditables :

- login success/failure ;
- logout ;
- session created/revoked ;
- MFA enrollment/challenge/failure/success ;
- recovery ;
- password change ;
- context switch ;
- membership changes ;
- role/permission changes ;
- access denied ;
- privilege administration.

Ne jamais journaliser :

- password ;
- token complet ;
- TOTP secret ;
- recovery codes ;
- secrets provider.

---

# 24. Security Events

Exemples :

```text
auth.login.success
auth.login.failed
auth.bruteforce.detected
auth.mfa.required
auth.mfa.failed
auth.mfa.replay_detected
auth.token.reuse_detected
context.switch.denied
permission.denied
tenant.cross_access.blocked
```

Chaque événement critique doit être corrélable par `traceId/requestId`.

---

# 25. UI fonctionnelle

Workspace IAM :

```text
Sécurité & IAM
├── Vue d’ensemble
├── Identités
├── Utilisateurs
├── Organisations
├── Sites
├── Memberships
├── Rôles
├── Permissions
├── Policies
├── Sessions
├── MFA
├── Security Events
└── Audit
```

Espace utilisateur :

```text
Profil
├── Mon profil
├── Mot de passe
├── Mes sessions
├── MFA
├── Recovery
└── Contexte actif
```

---

# 26. États UI

Génériques :

```text
LOADING
LOADED
EMPTY
ERROR
FORBIDDEN
UNAVAILABLE
```

Authentication :

```text
AUTHENTICATING
CAPTCHA_REQUIRED
MFA_REQUIRED
AUTHENTICATED
SESSION_EXPIRED
LOCKED_TEMPORARILY
```

L’application protégée n’est jamais rendue avant validation suffisante de session et contexte.

---

# 27. Intégrations

## Business Manager
Consomme Identity, Context, Permission, Authorization Decision.

## UI Builder
Peut utiliser les permissions pour visibilité/configuration ; le Runtime refait l’autorisation.

## Automation
Doit porter une identité ou service identity et un tenant explicites.

## Pack Manager
Les opérations sensibles passent par IAM.

## Pack Runtime
Reçoit un contexte IAM validé ; aucun tenant arbitraire frontend.

## Data Runtime
Chaque query/mutation est tenant + identity + permission + policy scoped.

## ERP / Integration Hub
L’ERP n’est jamais autorité IAM.

## Deployment
Les opérations sont protégées par permissions et tenant scope.

## Subscription
`Entitlement ≠ Permission`.

## Administration
Les privilèges plateforme sont séparés des privilèges Tenant.

---

# 28. API conceptuelle

Adapter aux routes existantes sans duplication.

```http
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/recovery/request
POST /api/auth/recovery/complete

GET  /api/iam/me
GET  /api/iam/context
POST /api/iam/context/switch

GET  /api/iam/users
GET  /api/iam/identities
GET  /api/iam/organizations
GET  /api/iam/sites
GET  /api/iam/memberships
GET  /api/iam/roles
GET  /api/iam/permissions
GET  /api/iam/policies

GET  /api/iam/sessions
POST /api/iam/sessions/:id/revoke

POST /api/iam/mfa/enroll
POST /api/iam/mfa/challenge
POST /api/iam/mfa/challenge/verify
POST /api/iam/mfa/remove

GET  /api/iam/security/events
GET  /api/iam/audit
```

---

# 29. Règles métier critiques

1. Identity est immutable.
2. IAM fonctionne sans ERP.
3. Session IAM est autonome.
4. Tenant demandé doit être autorisé par Membership.
5. MFA requis est validé avant création d’une session authentifiée.
6. Deny by Default.
7. Permission inconnue = DENY.
8. Resource resolver invalide = DENY.
9. Le frontend ne constitue jamais l’autorité d’accès.
10. Context Switch invalide les droits/caches précédents.
11. Aucune donnée cross-tenant.
12. Aucun mock silencieux en mode REAL.
13. Secrets, tokens et passwords absents des logs.
14. Toute opération administrative sensible est auditée.

---

# 30. MVP

Obligatoire :

- Identity/User ;
- password login ;
- Tenant/Membership validation ;
- Sessions ;
- Refresh Tokens si utilisés ;
- RBAC ;
- Permission Registry ;
- Context Resolution ;
- Context Switch ;
- TOTP MFA si MFA exposé ;
- rate limiting / temporary lock ;
- Recovery ;
- Audit ;
- Security Events ;
- IAM UI minimale ;
- tests cross-tenant.

P1 :

- passkeys ;
- SSO/OIDC ;
- risk engine avancé ;
- device trust avancé ;
- ABAC/ReBAC ;
- délégation temporaire.

---

# 31. Critères d’acceptation

Un utilisateur doit pouvoir :

1. se connecter avec credentials valides ;
2. être refusé avec credentials invalides sans révélation du compte ;
3. être limité après tentatives abusives ;
4. compléter MFA si requis ;
5. obtenir une session uniquement après MFA ;
6. charger `/me` ;
7. obtenir un contexte valide ;
8. changer de Tenant uniquement avec Membership valide ;
9. voir ses permissions effectives ;
10. appeler une API autorisée ;
11. être refusé sur une API non autorisée ;
12. être refusé sur une ressource d’un autre Tenant ;
13. révoquer ses sessions ;
14. récupérer son compte avec token à usage unique ;
15. laisser une trace d’audit exploitable.

---

# 32. Definition of Done

Auth/IAM/Context est DONE uniquement si :

- architecture autonome ;
- login sécurisé ;
- aucun TOTP fixe ;
- MFA challenge opaque, TTL, one-time et lié à l’authentification ;
- aucune session complète avant MFA lorsque requis ;
- tenant membership vérifiée ;
- TenantGuard et authorization fail-closed ;
- RBAC réel ;
- Context Switch sûr ;
- session/token rotation/revocation ;
- brute-force/rate-limit effectif ;
- Recovery sûr ;
- Audit et Security Events ;
- aucun secret dans logs ;
- aucun mock silencieux en REAL ;
- tests unitaires passent ;
- tests intégration passent ;
- tests sécurité passent ;
- E2E passe ;
- frontend build passe ;
- backend build passe ;
- Prisma validate/generate passe si modifié ;
- IAM reste fonctionnel ERP OFF.
