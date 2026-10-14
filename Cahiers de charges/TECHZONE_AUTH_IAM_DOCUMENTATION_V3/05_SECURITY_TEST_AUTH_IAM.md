# SECURITY TEST — TECHZONE CLOUD AUTH + IAM + CONTEXT

**Version :** 1.0  
**Niveau :** Bloquant production  
**Priorité actuelle :** P0

---

# 1. Objectif

Prouver que :

- aucune authentification ne peut être contournée ;
- aucun Tenant ne peut être forgé ;
- aucune session n’est créée avant les facteurs requis ;
- aucune permission inconnue n’est autorisée ;
- aucun guard n’échoue en mode fail-open ;
- aucune ressource cross-tenant n’est accessible ;
- aucun secret n’est exposé.

---

# 2. Matrice de sévérité

```text
P0 = contournement auth / cross-tenant / secret critique / session frauduleuse
P1 = contrôle important incomplet
P2 = durcissement
P3 = qualité / observabilité
```

---

# 3. Authentication Tests

## SEC-AUTH-001 — Invalid credentials
Entrée : identifier valide + password faux  
Attendu :
- 401/erreur générique ;
- aucune session ;
- aucun refresh ;
- audit failure.

## SEC-AUTH-002 — User enumeration
Comparer réponse :
- email inexistant ;
- email existant + mauvais password.

Attendu :
- message public non discriminant ;
- timings raisonnablement homogènes.

## SEC-AUTH-003 — Disabled user
Attendu :
- login refusé ;
- aucune session.

## SEC-AUTH-004 — Revoked session
Attendu :
- JWT associé refusé.

---

# 4. MFA Tests — P0

## SEC-MFA-001 — Code fixe historique
Essayer `000000` sans que ce soit le TOTP réel.

Attendu :
- refus.

## SEC-MFA-002 — Verify sans challenge
Appeler MFA verify sans challengeId valide.

Attendu :
- refus ;
- aucune session/token.

## SEC-MFA-003 — Challenge inconnu
Attendu :
- refus générique.

## SEC-MFA-004 — Challenge expiré
Attendu :
- refus ;
- aucune session.

## SEC-MFA-005 — Challenge déjà consommé
1. réussir une fois ;
2. rejouer challenge/code.

Attendu :
- second appel refusé.

## SEC-MFA-006 — Challenge autre identity
Challenge User A + code User B.

Attendu :
- refus.

## SEC-MFA-007 — Challenge autre loginAttempt
Attendu :
- refus.

## SEC-MFA-008 — Mauvais TOTP
Attendu :
- refus ;
- attemptCount augmente ;
- event.

## SEC-MFA-009 — Trop d’essais
Attendu :
- challenge bloqué/invalidé selon policy.

## SEC-MFA-010 — Session créée seulement après MFA
Vérifier DB/session registry avant MFA.

Attendu :
- aucune session authentifiée complète.

---

# 5. Tenant Tests — P0

## SEC-TENANT-001 — Forged tenantId
User membre Tenant A envoie Tenant B au login.

Attendu :
- DENY ;
- aucune session Tenant B.

## SEC-TENANT-002 — Membership suspendue
Attendu :
- DENY.

## SEC-TENANT-003 — Membership révoquée
Attendu :
- DENY immédiat.

## SEC-TENANT-004 — Cross-tenant resource
Session Tenant A tente resource Tenant B.

Attendu :
- 403/404 selon contrat ;
- aucune donnée.

## SEC-TENANT-005 — Context switch forged
Attendu :
- switch refusé ;
- contexte A conservé.

## SEC-TENANT-006 — Stale data après switch
A → B.

Attendu :
- aucune donnée A dans UI/API/cache B.

---

# 6. Guard Tests — P0/P1

## SEC-GUARD-001 — Unknown Prisma delegate
Attendu :
- DENY.

## SEC-GUARD-002 — Resolver exception
Attendu :
- DENY ;
- erreur interne corrélée ;
- pas de allow.

## SEC-GUARD-003 — Resource not found
Attendu :
- refus contrôlé ;
- pas de fuite cross-tenant.

## SEC-GUARD-004 — Missing permission metadata on sensitive route
Attendu :
- DENY ou erreur de configuration bloquante.

## SEC-GUARD-005 — Unknown permission
Attendu :
- DENY.

## SEC-GUARD-006 — Client-side permission only
Contourner UI et appeler API directement.

Attendu :
- backend refuse.

---

# 7. Brute Force / Rate Limit

## SEC-RATE-001 — Repeated failed login
Attendu :
- rate-limit/temporary lock après threshold.

## SEC-RATE-002 — MFA brute force
Attendu :
- throttling + invalidation.

## SEC-RATE-003 — Recovery abuse
Attendu :
- rate limit ;
- réponse générique.

## SEC-RATE-004 — Lock expiry
Attendu :
- retour contrôlé après TTL.

## SEC-RATE-005 — IP-only collateral
Vérifier qu’un utilisateur légitime différent n’est pas bloqué indûment uniquement parce qu’il partage une IP, selon stratégie retenue.

---

# 8. Session Tests

## SEC-SESSION-001 — Fixation
Attendu :
- nouvel identifiant de session après authentification.

## SEC-SESSION-002 — Expiration
Attendu :
- refus après expiresAt.

## SEC-SESSION-003 — Revocation
Attendu :
- effet immédiat.

## SEC-SESSION-004 — Logout
Attendu :
- session/token invalidé selon architecture.

## SEC-SESSION-005 — Revoke all others
Attendu :
- session actuelle conservée uniquement si policy le prévoit.

---

# 9. Refresh Token

## SEC-TOKEN-001 — Rotation
A utilisé → B émis → A invalidé.

## SEC-TOKEN-002 — Reuse
Réutiliser A.

Attendu :
- refus ;
- security event ;
- politique de révocation appliquée.

## SEC-TOKEN-003 — Revoked refresh
Attendu :
- refus.

---

# 10. Recovery

## SEC-REC-001 — Account enumeration
Attendu :
- réponse générique.

## SEC-REC-002 — Expired token
Attendu :
- refus.

## SEC-REC-003 — Reuse
Attendu :
- refus.

## SEC-REC-004 — Password changed
Attendu :
- ancienne credential refusée ;
- sessions révoquées selon policy.

---

# 11. Authorization / RBAC

## SEC-RBAC-001 — Missing permission
Attendu : 403.

## SEC-RBAC-002 — Revoked role
Attendu :
- cache invalidé ;
- accès refusé immédiatement selon SLA.

## SEC-RBAC-003 — Role escalation through payload
Attendu :
- refus.

## SEC-RBAC-004 — Platform vs Tenant admin
Tenant admin tente opération plateforme.

Attendu :
- refus.

---

# 12. API / Browser Security

Tester :
- CORS ;
- CSRF selon mode cookie ;
- security headers ;
- error leakage ;
- stack traces ;
- credential exposure ;
- token in URL ;
- token in logs ;
- cache headers des pages sensibles.

---

# 13. Secret Leakage

Scanner :
- logs ;
- responses ;
- source maps ;
- frontend bundle ;
- audit payloads.

Interdit :
- password ;
- password hash ;
- refresh token ;
- access token complet ;
- MFA secret ;
- recovery code ;
- signing key ;
- provider credential.

---

# 14. Security E2E Principal

```text
LOGIN
↓
PASSWORD VALID
↓
MFA REQUIRED
↓
VALID TOTP
↓
SESSION CREATED
↓
CONTEXT RESOLVED
↓
PERMISSIONS RESOLVED
↓
PROTECTED API ALLOW
```

Variante négative :

```text
PASSWORD VALID
↓
MFA REQUIRED
↓
SKIP MFA
↓
PROTECTED API
↓
DENY
```

---

# 15. Cross-Tenant E2E

```text
User A
Tenant A
↓
Login
↓
Attempt Tenant B resource ID
↓
DENY
↓
No data leakage
↓
Security Event
```

---

# 16. Context Switch E2E

```text
Tenant A
↓
Load data A
↓
Switch Tenant B
↓
Validate Membership B
↓
Invalidate cache
↓
Reload permissions/navigation
↓
Load data B
↓
Assert no A data
```

---

# 17. CI Blocking Tests

Les tests suivants sont bloquants :

```text
SEC-MFA-001..010
SEC-TENANT-001..006
SEC-GUARD-001..006
SEC-RATE-001..004
SEC-SESSION-002..004
SEC-TOKEN-001..003
SEC-RBAC-001..004
```

Un échec P0 bloque merge/release.

---

# 18. Security Definition of Done

- aucun P0 ouvert ;
- MFA bypass impossible ;
- tenant forgery impossible ;
- guards fail-closed ;
- rate limiting effectif ;
- sessions révocables ;
- refresh reuse détecté ;
- cross-tenant suite verte ;
- secrets absents ;
- audit/security events présents ;
- CI exécute la suite.
