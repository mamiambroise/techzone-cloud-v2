# TECH — TECHZONE CLOUD AUTH + IAM + CONTEXT

**Version :** 1.0  
**Stack :** React/Vite + NestJS + Prisma/PostgreSQL  
**Principe :** modifier minimalement l’existant et sécuriser les chemins confirmés vulnérables.

---

# 1. Architecture cible

```text
React
 ↓
Auth API
 ↓
NestJS Authentication Orchestrator
 ├── Credential Verification
 ├── Security Counter / Rate Limit
 ├── CAPTCHA
 ├── MFA Challenge
 ├── Membership Resolver
 ├── Session Registry
 ├── Token Service
 ├── Context Resolver
 └── Authorization Service
 ↓
Prisma
 ↓
PostgreSQL
```

---

# 2. Composants existants à préserver

Selon audit :

```text
Global IAM Guards
Session validation
JWT + active session cross-check
Effective permissions server resolution
MFA module
Refresh token module
Device/session support
```

Ne pas réimplémenter sans raison.

---

# 3. Backend — Login

Pseudo-flow :

```ts
normalize(identifier)
user = resolveIdentity(identifier)
verifyPassword(user)
securityDecision = evaluateRateLimit(...)
if securityDecision requires captcha:
  verifyCaptcha()

membership = resolveRequestedTenantMembership(identityId, requestedTenantId)
if !membership:
  deny()

if requiresMfa(identity):
  loginAttempt = createLoginAttempt(...)
  challenge = createMfaChallenge(loginAttempt)
  return MFA_REQUIRED

session = createSession(...)
tokens = issueTokens(session)
return authResult(...)
```

Point critique :
- `requestedTenantId` est une entrée, pas une décision.

---

# 4. MFA Challenge Model

Modèle conceptuel minimal :

```text
MfaChallenge
├── id
├── challengeId opaque
├── identityId
├── loginAttemptId
├── methodId
├── tenantId? requested context
├── expiresAt
├── attemptCount
├── maxAttempts
├── consumedAt?
├── createdAt
└── metadata controlled
```

Le stockage exact doit être adapté aux modèles existants avant migration.

---

# 5. MFA Verification

```text
load challenge
→ exists?
→ not expired?
→ not consumed?
→ attempts < max?
→ identity/loginAttempt matches?
→ method enabled?
→ verify TOTP
→ mark consumed atomically
→ complete login
→ create session
```

La consommation doit être atomique pour limiter le replay concurrent.

---

# 6. TOTP

Exigences :
- secret unique par méthode MFA ;
- stockage protégé ;
- jamais logué ;
- vérification serveur ;
- fenêtre temporelle limitée ;
- clock drift contrôlé ;
- lifecycle enrollment/confirmed/enabled/disabled.

Ne jamais accepter une constante de test en production.

---

# 7. Login Attempt

Option recommandée si aucun concept équivalent n’existe :

```text
LoginAttempt
├── id
├── identityId
├── requestedTenantId?
├── status
├── passwordVerifiedAt
├── mfaRequired
├── mfaVerifiedAt?
├── expiresAt
├── completedAt?
├── ipHash/metadata?
└── createdAt
```

Éviter une nouvelle table si un modèle existant couvre déjà correctement ce rôle.

---

# 8. Tenant Membership Resolution

Service central recommandé :

```text
resolveEffectiveTenant(identityId, requestedTenantId?)
```

Règles :
- membership active obligatoire ;
- tenant active selon policy ;
- tenant fourni par client non digne de confiance ;
- aucune session avec tenant non validé.

---

# 9. TenantGuard

Comportement cible :

```text
missing principal        => DENY
missing tenant context   => DENY
unknown delegate         => DENY
resource not found       => DENY/404 contract
resource tenant mismatch => DENY
resolver error           => DENY + internal log
valid tenant             => continue
```

Le guard ne doit jamais autoriser une requête parce qu’il n’a pas réussi à vérifier.

---

# 10. Permission Guards

Politique :

```text
@Public()
→ explicit public

@Authenticated()
→ active session required

@RequirePermission("x")
→ permission x required
```

Pour une route sensible :
- metadata absente = erreur de configuration ou DENY ;
- permission inconnue = DENY.

---

# 11. Rate Limit / Temporary Lock

Réutiliser les primitives présentes si existantes.

Clé conceptuelle :

```text
subject + endpoint + timeWindow
```

Ne jamais utiliser uniquement IP pour éviter blocage partagé abusif.

Persist/Cache selon architecture réelle.

Événements :
- threshold reached ;
- temp lock started ;
- temp lock expired ;
- excessive MFA failures.

---

# 12. Sessions

Session créée après auth complète.

Session validation :
- exists ;
- not revoked ;
- not expired ;
- identity active ;
- context valid selon stratégie.

Actions :
- revoke one ;
- revoke all ;
- revoke on recovery/password/security event si policy.

---

# 13. Refresh Token

Rotation :

```text
refresh token A
↓ valid
issue B
revoke A
↓
reuse A
=> security event
=> session revocation policy
```

---

# 14. Context Resolution

Contrat interne :

```ts
type EffectiveContext = {
  identityId: string
  userId: string
  tenantId: string
  membershipId: string
  organizationId?: string
  siteId?: string
  roles: string[]
  permissions: string[]
  sessionId: string
}
```

Ne pas prendre ces valeurs directement du body pour autoriser une ressource.

---

# 15. Context Switch

Transaction logique :

```text
validate current session
validate target membership
resolve new permissions
invalidate authz cache
persist/update context if architecture requires
emit context.switched
return new /me/context
```

Frontend recharge :
- navigation ;
- dashboard ;
- module data.

---

# 16. Prisma

Avant modification :

1. auditer modèles existants ;
2. vérifier types tenant UUID/text ;
3. éviter création doublon ;
4. générer migration minimale ;
5. tester fresh DB ;
6. tester upgrade DB de recette ;
7. `prisma validate` ;
8. `prisma generate`.

Aucun script destructive `DROP SCHEMA` dans le chemin normal.

---

# 17. API

Conserver routes stables existantes.

Pour MFA :

```http
POST /api/iam/mfa/challenge/verify
```

doit accepter un identifiant de challenge opaque et non un simple code suffisant à créer une session.

Exemple conceptuel :

```json
{
  "challengeId": "...",
  "code": "123456"
}
```

Le serveur retrouve identity/loginAttempt depuis le challenge.

---

# 18. Frontend AuthProvider

Responsabilités :
- session state ;
- current user ;
- effective context ;
- permissions ;
- logout ;
- refresh ;
- context switch.

Ne pas :
- décider tenant ownership ;
- décider permission backend ;
- considérer MFA validé localement.

---

# 19. Login State Machine

```text
ANONYMOUS
→ AUTHENTICATING
→ CAPTCHA_REQUIRED?
→ MFA_REQUIRED?
→ ESTABLISHING_SESSION
→ LOADING_CONTEXT
→ AUTHENTICATED
```

Erreurs :
- INVALID_AUTH ;
- TEMP_LOCK ;
- MFA_EXPIRED ;
- SESSION_EXPIRED ;
- NETWORK_ERROR.

---

# 20. Audit / Events

Tous les P0 doivent produire des événements structurés.

Exemples :

```text
auth.login.failed
auth.login.success
auth.mfa.challenge.created
auth.mfa.failed
auth.mfa.success
auth.mfa.replay
auth.tenant.denied
permission.denied
session.revoked
token.reuse.detected
```

---

# 21. Observabilité

Métriques possibles sans PII brute :

- login_success_count ;
- login_failure_count ;
- mfa_failure_count ;
- temp_lock_count ;
- permission_denied_count ;
- context_switch_count ;
- active_session_count.

Pas de password/token/email brut dans labels.

---

# 22. Tests techniques

Unit :
- auth service ;
- MFA service ;
- tenant resolver ;
- TenantGuard ;
- permission guard ;
- rate limiter ;
- session ;
- refresh.

Integration :
- login → MFA → session → context ;
- context switch ;
- role revoke → deny ;
- tenant cross access denied.

E2E :
- navigateur réel ;
- rôle limité ;
- Tenant A/B ;
- session revoke ;
- MFA.

---

# 23. CI

Pipeline minimal :

```text
npm ci
prisma generate
prisma validate
backend lint/typecheck
backend test
backend build
frontend typecheck
frontend test
frontend build
security test suite
```

---

# 24. Fichiers critiques connus

```text
backend/src/iam/iam-mfa.controller.ts
backend/src/iam/iam-mfa.service.ts
backend/src/iam/iam-auth.service.ts
backend/src/iam/dto/login.dto.ts
backend/src/iam/tenant.guard.ts
backend/src/iam/iam-permission.guard.ts
backend/src/iam/iam-permissions.guard.ts
frontend/src/auth/AuthProvider.jsx
frontend/src/pages/LoginPage.jsx
```

Créer de nouveaux fichiers seulement après recherche réelle.

---

# 25. Ordre de commit recommandé

```text
1 fix(iam): bind MFA challenge to login attempt
2 fix(iam): implement real TOTP verification
3 fix(iam): validate tenant membership before session
4 fix(iam): enforce rate limit and lockout
5 fix(iam): make authorization guards fail closed
6 feat(auth-ui): complete MFA login flow
7 test(iam): add security regression suite
8 ci(iam): run backend security tests
```

---

# 26. Technical Definition of Done

- aucun code fixe MFA ;
- challenge one-time/TTL ;
- session post-MFA uniquement ;
- tenant server-resolved ;
- fail-closed guards ;
- rate-limit actif ;
- tests cross-tenant ;
- refresh/session regression tests ;
- build OK ;
- Prisma OK ;
- CI exécute backend tests.
