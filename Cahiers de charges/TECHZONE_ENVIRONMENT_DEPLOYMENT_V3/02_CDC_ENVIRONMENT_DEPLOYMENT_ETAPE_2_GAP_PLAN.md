# CAHIER DES CHARGES — ENVIRONMENT & DEPLOYMENT MANAGER
## Étape 2 — État réel, Gap Matrix et plan de consolidation

**Audit :** octobre 2026  
**Commit Deployment notable :** `2cb9021f`  
**Priorité actuelle :** P0

---

# 1. Verdict

```text
ÉTAT GLOBAL : 🔴
API présente mais isolation tenant dangereusement incomplète.
```

---

# 2. KEEP

Déjà bon :

- module enregistré dans `app.module.ts` ;
- ValidationPipe présent ;
- Helmet présent ;
- CORS configurable ;
- trace IDs présents ;
- CRUD/services Integration présents ;
- tests unitaires Deployment présents ;
- architecture fonctionnelle Environment/Deployment déjà définie.

Décision :

```text
KEEP + HARDEN
```

---

# 3. P0 — routes Deployment sans permission/tenant resource

Audit :

```text
Deployment
Release
Gates
Rollback
Cockpit
```

n’ont pas systématiquement :

- permission ;
- TenantResource ;
- filtre tenant.

Décision :

```text
FIX IMMEDIATELY
```

---

# 4. P0 — services non tenant-scoped

Cas identifié :

```text
findMany()
find by id
update by id
```

sans `tenantId` effectif.

Risque :

```text
Tenant A → ID Tenant B → read/update/deploy/rollback
```

Décision :

```text
FIX IMMEDIATELY
```

---

# 5. P1 — audit fields contrôlés par frontend

Champs identifiés :

```text
createdBy
approvedBy
bypassedBy
```

Décision :

```text
FIX
```

Source correcte :

```text
IAM Principal
ou
Service Identity
```

---

# 6. P2 — MockIntegrationProvider

Le provider mock existe dans des chemins Integration.

Décision :

```text
ISOLATE
```

En mode REAL :

```text
mock = forbidden unless explicit test/dev mode
```

---

# 7. P2 — CSRF incomplet

Le filtre repose en partie sur `sec-fetch-site`.

Décision :

```text
HARDEN
```

Coordonner avec le socle sécurité global.

---

# 8. Gap Matrix

| Domaine | Cible | Existant | État | Décision | Priorité |
|---|---|---|---|---|---|
| Environment CRUD | tenant-scoped | présent | à durcir | KEEP/FIX | P1 |
| Environment status | réel | présent/à vérifier | partiel | COMPLETE | P1 |
| Deployment CRUD | tenant-scoped | présent | dangereux | FIX | P0 |
| Permissions | obligatoires | incomplet | dangereux | FIX | P0 |
| TenantResource | obligatoire | incomplet | dangereux | FIX | P0 |
| Service filters | tenantId | incomplet | dangereux | FIX | P0 |
| Audit fields | server-owned | client-owned partiel | mauvais | FIX | P1 |
| Pre-check | réel | à confirmer | partiel | COMPLETE | P1 |
| Runtime Bridge | réel | à confirmer | partiel | COMPLETE | P1 |
| Retry | traçable | présent/à confirmer | partiel | COMPLETE | P1 |
| Rollback | tenant-safe | présent | non certifié | FIX/TEST | P0/P1 |
| Diagnostics | tenant-safe | présent | non certifié | FIX | P1 |
| Mock provider | DEV only | présent | risque | ISOLATE | P2 |
| Cross-tenant tests | obligatoires | absents | manquant | IMPLEMENT | P0 |
| E2E | complet | non certifié | manquant | IMPLEMENT | P1 |

---

# 9. LOT ED-0 — Audit ciblé

Inventorier :

- controllers ;
- services ;
- Prisma models ;
- DTO ;
- permissions ;
- TenantResource decorators ;
- Runtime Bridge ;
- Pack publication integration ;
- Registry ;
- tests.

---

# 10. LOT ED-1 — Permissions

Ajouter/aligner :

```text
environment.read
environment.create
environment.update
environment.disable
deployment.read
deployment.create
deployment.execute
deployment.cancel
deployment.retry
deployment.rollback
deployment.diagnostics
```

Appliquer backend.

---

# 11. LOT ED-2 — Tenant Resource

Chaque route par ID doit :

1. utiliser effective tenant ;
2. résoudre resource ;
3. comparer tenant ;
4. deny fail-closed.

---

# 12. LOT ED-3 — Tenant filters services

Corriger toutes les queries.

Exemples :

```text
findMany({ where: { tenantId } })
findFirst({ where: { id, tenantId } })
updateMany({ where: { id, tenantId } })
```

Utiliser le pattern réel du repo.

---

# 13. LOT ED-4 — Audit Fields

Supprimer des DTO sensibles :

```text
createdBy
approvedBy
bypassedBy
requestedBy
```

ou les ignorer côté serveur.

Résoudre depuis IAM.

---

# 14. LOT ED-5 — Environment Security

Vérifier :

- create tenant-scoped ;
- update tenant-scoped ;
- disable ;
- status ;
- check ;
- config refs ;
- secret refs.

---

# 15. LOT ED-6 — Pre-Deployment

Compléter :

- published Pack ;
- Manifest ;
- Environment READY ;
- compatibility ;
- capabilities ;
- Data ;
- Integration ;
- config/secrets.

---

# 16. LOT ED-7 — Runtime Bridge

Un deployment ne réussit qu’après réponse réelle Runtime.

Tester :

```text
LOAD
RESOLVE
ACTIVATE
READINESS
```

---

# 17. LOT ED-8 — Retry / Rollback

Ajouter :

- previous attempt preserved ;
- previous release validation ;
- tenant check ;
- idempotency ;
- audit.

---

# 18. LOT ED-9 — Concurrency

Empêcher deux opérations incompatibles sur :

```text
tenant + environment + application
```

pendant states critiques.

---

# 19. LOT ED-10 — Mock Isolation

`MockIntegrationProvider` :

- DEV/TEST explicite ;
- jamais silencieusement PROD ;
- startup/config validation.

---

# 20. LOT ED-11 — Security Tests

Obligatoires :

- Tenant A list B ;
- get B by ID ;
- update B ;
- execute B ;
- rollback B ;
- diagnostics B ;
- forged environment ID ;
- forged packVersion ;
- missing permission ;
- client-forged `approvedBy`.

---

# 21. LOT ED-12 — UI

Appliquer SPEC UI et Maquettes.

Le frontend doit afficher seulement les actions autorisées, sans devenir autorité.

---

# 22. LOT ED-13 — CI / E2E

Ajouter :

- unit ;
- integration ;
- security ;
- E2E deployment path.

---

# 23. Conditions de blocage production

Déploiement interdit si :

- service non tenant-filtered ;
- rollback cross-tenant possible ;
- permission manquante ;
- audit field client-controlled ;
- mock provider actif en REAL ;
- Runtime success simulé ;
- cross-tenant tests rouges.

---

# 24. Ordre recommandé

```text
ED-0 Audit
↓
ED-1 Permissions
↓
ED-2 TenantResource
↓
ED-3 Service Filters
↓
ED-4 Audit Fields
↓
ED-5 Environment
↓
ED-6 Pre-Deployment
↓
ED-7 Runtime Bridge
↓
ED-8 Retry/Rollback
↓
ED-9 Concurrency
↓
ED-10 Mock Isolation
↓
ED-11 Security Tests
↓
ED-12 UI
↓
ED-13 CI/E2E
```
