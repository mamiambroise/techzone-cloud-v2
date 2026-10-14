# CAHIER DES CHARGES — BUSINESS MANAGER
## Étape 2 — État réel, Gap Matrix et plan de consolidation

**Audit :** octobre 2026  
**Commit de consolidation :** `d226cb52`  
**Priorité :** P1 après socle Auth/Tenant/Prisma

---

# 1. État global

```text
🟡 Fonctionnel côté données, sécurité d'accès incomplète.
```

---

# 2. Déjà bon — KEEP

Audit confirme :

- modèles de données réels ;
- Features réelles ;
- Navigation réelle ;
- Contracts réels ;
- Quality Gate réel ;
- Runtime bridge BM existant ;
- modèles Prisma BM présents ;
- UI consomme les endpoints réels ;
- services majoritairement filtrés `tenantId`.

Décision :

```text
KEEP + HARDEN
```

---

# 3. Travaux UI locaux

Des modifications UI BM locales non commitées existent dans le worktree.

Décision :

```text
PRESERVE
```

Ne pas écraser.

---

# 4. P1 — TenantResource mal déclaré

Certains décorateurs utilisent des noms SQL :

```text
bm_entity
bm_feature
bm_menu
bm_contracts
```

au lieu de delegates Prisma attendus.

Le TenantGuard peut alors échouer ouvertement.

Décision :

```text
FIX
```

---

# 5. P1 — Contracts Controller permissions

Le contrôleur Contracts ne possède pas de permissions explicites suffisantes.

Risque :
- session authentifiée Tenant pouvant muter Contracts.

Décision :

```text
FIX
```

Permissions :

```text
bm.contract.read
bm.contract.write
```

ou équivalents Registry existants.

---

# 6. P2 — navigation frontend permissions

Navigation BM insuffisamment granulaire.

Décision :

```text
IMPROVE
```

Backend reste autorité.

---

# 7. Gap Matrix

| Domaine | Cible | Existant | État | Décision | Priorité |
|---|---|---|---|---|---|
| Applications | réel | oui | bon | KEEP | P2 |
| Versions | réel | oui | bon/partiel | KEEP/COMPLETE | P1 |
| Entity Registry | réel | oui | bon | KEEP | P2 |
| Fields | réel | oui | bon | KEEP | P2 |
| Relations | réel | oui | bon | KEEP | P2 |
| Features | réel | oui | bon | KEEP | P2 |
| Capabilities | réel | oui | présent | VERIFY | P1 |
| Navigation | réel | oui | présent | KEEP | P2 |
| Configuration | réel | oui | présent | KEEP/HARDEN | P1 |
| Contracts | sécurisé | oui | permissions faibles | FIX | P1 |
| Validation | Quality Gate | oui | bon | KEEP/COMPLETE | P1 |
| TenantResource | fail-closed | incorrect sur certains | mauvais | FIX | P1 |
| Cross-tenant tests | obligatoires | insuffisants | manque | IMPLEMENT | P1 |
| Navigation UI perms | fine | partielle | faible | IMPROVE | P2 |

---

# 8. LOT BM-0 — Protection worktree

Avant modification :

- git status ;
- identifier changements BM locaux ;
- ne pas écraser ;
- isoler les fichiers du lot.

---

# 9. LOT BM-1 — TenantResource

Auditer tous :

```text
@TenantResource(...)
```

Vérifier :
- delegate Prisma réel ;
- resource id ;
- tenant field ;
- fail-closed.

Corriger noms SQL incorrects.

---

# 10. LOT BM-2 — Permission Matrix

Définir matrice :

| Domaine | Read | Write | Admin |
|---|---|---|---|

Minimum :

```text
bm.read
bm.write
bm.contract.read
bm.contract.write
bm.validate
```

Adapter au Registry réel.

---

# 11. LOT BM-3 — Contracts Security

Corriger :
- GET ;
- POST ;
- PATCH ;
- DELETE ;
- validation contracts.

Ajouter tenant scope + permission.

---

# 12. LOT BM-4 — Cross-Tenant Services

Auditer toutes queries :

```text
Application
Version
Entity
Field
Relation
Feature
Capability
Event
Navigation
Configuration
Contract
Validation
```

Chaque accès par ID doit vérifier Tenant.

---

# 13. LOT BM-5 — Version Integrity

Vérifier :

- DRAFT isolation ;
- PUBLISHED immutable ;
- clone/new version ;
- no accidental mutation older version.

---

# 14. LOT BM-6 — Reference Validation

Renforcer :

- invalid Entity refs ;
- invalid Field refs ;
- invalid Permission refs ;
- broken Contract refs ;
- duplicate keys.

---

# 15. LOT BM-7 — Consumer Contracts

Tester :

```text
BM → UI Builder
BM → Automation
BM → Pack Manager
BM → Runtime
```

Contrats versionnés/stables.

---

# 16. LOT BM-8 — Validation Cockpit

Vérifier :
- erreurs réelles ;
- warnings réels ;
- deep links ;
- READY bloqué sur ERROR.

---

# 17. LOT BM-9 — UI Permissions

Context-aware navigation :

```text
read only
editor
validator
admin
```

Masquer/désactiver actions selon permission.

Backend reste autorité.

---

# 18. LOT BM-10 — Tests

Tests obligatoires :

- Application cross-tenant ;
- Version cross-tenant ;
- Entity cross-tenant ;
- Contract cross-tenant ;
- unauthorized contract write ;
- TenantResource unknown delegate ;
- invalid permission reference ;
- PUBLISHED mutation ;
- validation blocking.

---

# 19. LOT BM-11 — CI/E2E

Ajouter suite BM sécurité au pipeline.

E2E :
- create app ;
- create version ;
- model ;
- validate ;
- consumer flow.

---

# 20. Conditions de blocage

Ne pas considérer BM stable si :

- TenantResource fail-open ;
- Contracts modifiables sans permission ;
- cross-tenant test rouge ;
- PUBLISHED mutable ;
- validation incohérente ;
- consumer contract cassé.

---

# 21. Ordre recommandé

```text
BM-0 Protect worktree
↓
BM-1 TenantResource
↓
BM-2 Permissions
↓
BM-3 Contracts
↓
BM-4 Cross-tenant services
↓
BM-5 Version integrity
↓
BM-6 Reference validation
↓
BM-7 Consumer contracts
↓
BM-8 Validation cockpit
↓
BM-9 UI permissions
↓
BM-10 Tests
↓
BM-11 CI/E2E
```
