# CAHIER DES CHARGES — TECHZONE CLOUD AUTH + IAM + CONTEXT
## Étape 2 — État réel, Gap Matrix et plan de consolidation

**Base fonctionnelle :** `01_CDC_AUTH_IAM_ETAPE_1_CIBLE.md`  
**Audit de référence :** audit Codex en lecture seule — octobre 2026  
**Branche canonique auditée :** `origin/main`  
**Commit canonique identifié :** `d226cb52`  
**Commits IAM notables :** `e59c073f` (MFA), `02cc221b` (TenantGuard)

> ## Mise à jour vérifiée — 14 octobre 2026
>
> Les constats historiques ci-dessous sont conservés pour la traçabilité, mais ne
> décrivent plus entièrement l’état du code. Vérification réalisée sur `mami` :
>
> | Domaine | Statut vérifié | Preuve |
> |---|---|---|
> | MFA backend (challenge lié au login, TOTP, anti-rejeu) | **DONE** | `iam-mfa.security.spec.ts`, 129 tests IAM ciblés réussis |
> | Membership avant session, rate-limit/lockout, guards fail-closed, JWT/session | **DONE** | suites IAM ciblées réussies |
> | Parcours MFA frontend | **DONE** | challenge en mémoire, écran six chiffres, tests UI ciblés réussis |
> | Administration IAM Users/Roles/Policies/Tenants/Sessions/Identities | **PARTIAL** | APIs réelles utilisées ; couverture UI et détail fonctionnel restent à compléter |
> | E2E PostgreSQL et matrice cross-tenant réelle | **DONE** | `backend/test/iam-cross-tenant.e2e-spec.ts` : 15 scénarios réels réussis sur `techzone_test`, lancé par un runner qui force `DATABASE_URL = TEST_DATABASE_URL` |
>
> Le test E2E `backend/test/app.e2e-spec.ts` démarre avec la configuration ESM
> correcte. Le seeder déterministe `backend/test/iam-cross-tenant.seed.ts` crée,
> exclusivement dans `techzone_test`, les tenants A/B, utilisateurs, memberships,
> rôles, permissions, sessions et ressources UI Builder ; son nettoyage cible
> uniquement ces fixtures. La suite passe par les APIs Nest, les guards, JWT,
> sessions, RBAC et Prisma réels — aucun mock n’est utilisé pour ses décisions.

> ## Mise à jour E2E vérifiée — 14 octobre 2026
>
> `npm run test:e2e` a réussi sur `TEST_DATABASE_URL` : 2 suites, 16 tests.
> La matrice vérifie A→A et B→B (GET autorisés), A→B et B→A (GET/UPDATE/DELETE
> refusés), tenantId falsifié (body, query, header et login), token malformé ou
> absent, ressource inconnue, permission/role insuffisants, session révoquée,
> membership révoquée après expiration du cache, MFA TOTP invalide/autre identité,
> challenge expiré et challenge rejoué. Les statuts **DONE** ci-dessus reposent
> désormais sur cette exécution PostgreSQL réelle.

---

# 1. Verdict actuel

```text
ÉTAT AUTH / IAM / CONTEXT : 🟢 DONE (périmètre vérifié)
PREUVE : IAM unitaires/intégration + E2E PostgreSQL cross-tenant + MFA + guards
```

Le module n’est pas vide ni à réécrire.

Il contient déjà des éléments solides :

- guards IAM globaux enregistrés ;
- JWT recoupé avec une session active ;
- recalcul serveur des permissions effectives ;
- sessions réelles ;
- refresh tokens réels ;
- devices présents ;
- MFA présent ;
- frontend avec service MFA partiel.

Le problème est essentiellement un **écart de sécurité entre la cible et le comportement réel**.

---

# 2. Ce qui est déjà bon — KEEP

## IAM Guards globaux
**Décision : KEEP + TEST**

Le projet possède déjà des guards IAM globaux.

Action :
- conserver ;
- documenter leur ordre ;
- renforcer les scénarios négatifs.

## Session active
**Décision : KEEP**

Le JWT est recoupé avec une session active.

Action :
- préserver ce comportement ;
- ajouter tests session revoked/expired.

## Permissions effectives
**Décision : KEEP + HARDEN**

Les permissions sont recalculées côté serveur.

Action :
- conserver ;
- vérifier invalidation cache ;
- appliquer fail-closed.

## Session / Refresh / Device
**Décision : KEEP / COMPLETE**

Les modèles/services existent réellement.

Action :
- ne pas reconstruire ;
- compléter les tests de rotation, revoke et reuse.

---

# 3. Problèmes P0 confirmés

## P0-AUTH-001 — MFA verify peut créer session/token sans challenge login suffisamment lié

État :

```text
POST /api/iam/mfa/challenge/verify
→ endpoint public
→ vérification MFA
→ possibilité d’émission session/token
```

Risque :
- contournement du pipeline d’authentification ;
- création de session sans preuve complète du login attendu.

Décision :

```text
FIX
```

Cible :

```text
PASSWORD VALID
↓
server creates loginAttemptId
↓
server creates opaque mfaChallengeId
↓
challenge linked to identity + loginAttempt
↓
TOTP verify
↓
challenge consumed
↓
session created
```

Aucun endpoint MFA autonome ne peut transformer une simple validation MFA en session authentifiée complète.

---

## P0-AUTH-002 — TOTP fixe `000000`

État :

```text
code accepté = 000000
```

Décision :

```text
FIX IMMEDIATELY
```

Action :
- supprimer toute valeur fixe ;
- utiliser TOTP réel ;
- secret individuel protégé ;
- validation time-step ;
- fenêtre contrôlée ;
- anti-replay ;
- tests invalid/expired/reused.

---

## P0-AUTH-003 — tenantId fourni par le client accepté avant validation Membership

Risque :
- contexte forgé ;
- session sur Tenant non autorisé ;
- pivot vers vulnérabilité cross-tenant.

Décision :

```text
FIX IMMEDIATELY
```

Cible :

```text
requestedTenantId
↓
find ACTIVE Membership(identity, tenant)
↓
if missing => DENY
↓
if valid => continue
↓
create session/context
```

Le Tenant effectif est décidé côté serveur.

---

# 4. Problèmes P1 confirmés

## P1-AUTH-001 — Rate limiting non branché au login

Le mécanisme existe/configuration présente mais n’est pas dans le pipeline effectif.

Décision :

```text
COMPLETE
```

## P1-AUTH-002 — Lockout non branché

Décision :

```text
COMPLETE
```

Le lock sécurité temporaire doit être distingué du statut métier du User.

## P1-AUTH-003 — TenantGuard fail-open

L’audit global indique que le TenantGuard autorise lorsqu’un delegate Prisma attendu est inconnu.

Décision :

```text
FIX
```

Cible :

```text
resource delegate unknown
=> DENY

resource not found
=> DENY

resource tenant unresolved
=> DENY
```

## P1-AUTH-004 — Routes sans métadonnées permission

Le modèle actuel autorise certaines routes sans metadata.

Décision :
- routes publiques explicitement marquées Public ;
- routes authentifiées non sensibles explicitement classées ;
- routes métier/administratives sensibles avec permission obligatoire ;
- défaut : deny pour ressource sensible.

---

# 5. Problèmes P2

## P2-AUTH-001 — Parcours MFA frontend incomplet

Le frontend possède un service de vérification mais le parcours Login n’est pas relié complètement.

Décision :

```text
COMPLETE
```

## P2-AUTH-002 — Permissions navigation à harmoniser

La navigation ne doit pas être la sécurité, mais elle doit refléter l’autorisation backend.

Décision :

```text
IMPROVE
```

---

# 6. Gap Matrix

| Domaine | Exigence cible | Existant | État | Décision | Priorité |
|---|---|---|---|---|---|
| Foundation | NestJS IAM | Oui | Bon | KEEP | P2 |
| Session | JWT + session active | Oui | Bon | KEEP | P1 tests |
| Authorization | Effective permissions serveur | Oui | Bon/partiel | KEEP + HARDEN | P1 |
| MFA | Module/service | Oui | Vulnérable | FIX | P0 |
| MFA | TOTP réel | Non | Faux TOTP | FIX | P0 |
| MFA | Challenge lié au login | Partiel | Vulnérable | FIX | P0 |
| Login | Tenant membership validation | Non suffisante | Vulnérable | FIX | P0 |
| Security | Rate limit | Configuré | Non appliqué | COMPLETE | P1 |
| Security | Temporary lock | Configuré | Non appliqué | COMPLETE | P1 |
| Tenant | TenantGuard | Oui | Fail-open | FIX | P1 |
| AuthZ | Deny by Default | Partiel | Non garanti | FIX | P1 |
| Frontend | MFA flow | Partiel | Incomplet | COMPLETE | P2 |
| Tests | IAM généraux | Oui | Présents | KEEP | P1 |
| Tests | MFA dédié | Non trouvé | Manquant | IMPLEMENT | P0 |
| Tests | Brute force | Insuffisant | Manquant | IMPLEMENT | P1 |
| Tests | Cross-tenant E2E | Insuffisant | Manquant | IMPLEMENT | P0/P1 |

---

# 7. Fichiers critiques identifiés

À inspecter/modifier en priorité :

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

Le nom exact des tests existants doit être confirmé dans le repository avant création de nouveaux fichiers.

---

# 8. Plan de correction

## LOT IAM-0 — Protection du worktree

Avant correction :
- vérifier `git status` ;
- préserver les changements locaux ;
- ne pas écraser les travaux BM/UI Builder ;
- travailler depuis la base canonique appropriée ;
- aucun merge aveugle.

Critère :
- aucune modification locale perdue.

---

## LOT IAM-1 — Fermer le chemin MFA vulnérable

Objectif :
- empêcher toute session complète issue d’un MFA non lié à une tentative de login.

Actions :
1. introduire/normaliser `loginAttemptId` ou équivalent ;
2. produire un `mfaChallengeId` opaque ;
3. lier challenge ↔ identity ↔ login attempt ;
4. ajouter TTL ;
5. max attempts ;
6. consumedAt ;
7. vérifier challenge avant TOTP ;
8. créer session seulement après succès global.

Critères :
- challenge inexistant → 4xx ;
- challenge expiré → refus ;
- challenge consommé → refus ;
- challenge pour autre identity → refus ;
- MFA success seul → aucune session si login attempt invalide.

Commit recommandé :

```text
fix(iam): bind MFA challenge to login attempt
```

---

## LOT IAM-2 — TOTP réel

Actions :
- supprimer `000000` ;
- utiliser secret MFA réel ;
- vérifier TOTP ;
- protéger le secret au repos ;
- ne jamais le retourner/loguer ;
- rotation/re-enrollment selon lifecycle.

Tests :
- valid TOTP ;
- invalid TOTP ;
- previous/future excessive step ;
- replay selon stratégie ;
- disabled MFA method.

Commit :

```text
fix(iam): replace fixed MFA code with real TOTP verification
```

---

## LOT IAM-3 — Tenant membership avant session

Actions :

```text
login identity
↓
credentials
↓
requested tenant?
↓
membership lookup
↓
membership ACTIVE?
↓
tenant allowed?
↓
continue
```

Ne jamais faire confiance au DTO comme autorité.

Tests :
- Tenant A membership → allow ;
- Tenant B sans membership → deny ;
- membership suspended → deny ;
- forged tenant UUID → deny ;
- no tenant + one membership → deterministic resolution ;
- multiple memberships → context selection policy.

Commit :

```text
fix(iam): validate tenant membership before session creation
```

---

## LOT IAM-4 — Rate limit et temporary lock

Actions :
- brancher au login ;
- brancher à MFA verify ;
- brancher recovery ;
- compteur contrôlé ;
- fenêtre temporelle ;
- réponse générique ;
- security event.

Tests :
- N échecs ;
- verrou temporaire ;
- expiration verrou ;
- succès remet compteur selon policy ;
- autre compte non affecté indûment.

Commit :

```text
fix(iam): enforce authentication rate limits and temporary lockout
```

---

## LOT IAM-5 — Fail-closed TenantGuard / Permission Guards

Actions :
- delegate inconnu = DENY ;
- erreur résolution = DENY ;
- resource not found = DENY/404 selon contrat sans fuite ;
- permission inconnue = DENY ;
- métadonnée absente sur route sensible = DENY ;
- routes publiques explicitement déclarées.

Tests :
- delegate invalide ;
- wrong tenant ;
- forged resource id ;
- no permission metadata ;
- no tenant context ;
- cross-tenant IDOR.

Commit :

```text
fix(iam): make tenant and permission guards fail closed
```

---

## LOT IAM-6 — Frontend Login + MFA

États :

```text
LOGIN_FORM
AUTHENTICATING
CAPTCHA_REQUIRED
MFA_REQUIRED
AUTHENTICATED
ERROR
TEMP_LOCK
```

Actions :
- login renvoie un état MFA_REQUIRED sans session complète ;
- afficher challenge TOTP ;
- vérifier ;
- seulement ensuite initialiser AuthProvider ;
- `/me` + context + permissions ;
- redirect dashboard.

Commit :

```text
feat(auth-ui): complete login and MFA challenge flow
```

---

## LOT IAM-7 — Tests et CI

Tests obligatoires :
- MFA bypass ;
- fixed-code regression ;
- challenge expiry ;
- challenge replay ;
- challenge wrong identity ;
- Tenant forged ;
- membership missing ;
- brute force ;
- temp lock ;
- TenantGuard fail-closed ;
- unknown permission ;
- cross-tenant resource ;
- revoked session ;
- refresh reuse.

La CI backend doit exécuter réellement les tests.

---

# 9. Ordre d’exécution recommandé

```text
IAM-0 Protect worktree
↓
IAM-1 MFA challenge
↓
IAM-2 Real TOTP
↓
IAM-3 Tenant membership before session
↓
IAM-4 Rate limit / lockout
↓
IAM-5 Guards fail-closed
↓
IAM-6 Frontend MFA
↓
IAM-7 Tests / CI
↓
Security E2E
↓
Browser recipe
```

---

# 10. Conditions de blocage production

Déploiement production interdit si au moins un des points suivants subsiste :

- TOTP fixe ;
- session créée avant MFA requis ;
- challenge MFA non lié au login ;
- tenantId client accepté sans Membership ;
- TenantGuard fail-open ;
- cross-tenant test échoue ;
- secrets MFA exposés ;
- tests P0 absents/rouges.

---

# 11. Definition of Done réelle

Le module passe de 🔴 à 🟢 uniquement lorsque :

- tous les P0 sont corrigés ;
- guards fail-closed ;
- rate limiting actif ;
- MFA réel ;
- tenant membership validée ;
- aucune session pré-MFA ;
- frontend MFA complet ;
- tests négatifs présents ;
- E2E cross-tenant passe ;
- build backend/frontend passe ;
- Prisma valide si touché ;
- aucune régression Business Manager / Runtime / Deployment ;
- audit et Security Events enregistrent les refus sensibles.
