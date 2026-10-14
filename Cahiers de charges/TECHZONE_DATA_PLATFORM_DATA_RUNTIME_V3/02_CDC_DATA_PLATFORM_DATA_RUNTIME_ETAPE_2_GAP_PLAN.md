# CAHIER DES CHARGES — DATA PLATFORM / DATA RUNTIME
## Étape 2 — État réel, Gap Matrix et plan de consolidation

**Audit :** octobre 2026  
**Commit notable :** `82609ca`  
**Priorité :** P1

---

# 1. État global

```text
🟡 Data Runtime réel et relativement bien cloisonné,
mais non lié obligatoirement à une résolution Pack Runtime exécutable.
```

---

# 2. KEEP

Déjà bon :

- endpoints query/read/execute réels ;
- contexte construit côté serveur ;
- provider Business Manager applique tenant et autorisations ;
- renderer UI publié appelle Data Runtime ;
- binding UI ↔ contexte métier existe ;
- tests unitaires présents.

Décision :

```text
KEEP + HARDEN
```

---

# 3. P1 — absence de preuve Pack Runtime

État :

```text
Published UI
↓
Data Runtime
```

sans obligation de vérifier :

```text
resolutionId
status = EXECUTABLE
```

Décision :

```text
FIX
```

---

# 4. Risque

Un Runtime `BLOCKED` peut actuellement être rendu par le frontend Pack Runtime et potentiellement appeler Data Runtime.

Data Runtime doit donc posséder sa propre vérification serveur ou passer par une gateway unique qui impose cette vérification.

---

# 5. P2 — E2E absent

Aucun test complet ne prouve :

```text
UI
→ Pack Runtime
→ Executable Resolution
→ Data Runtime
→ Provider
```

Décision :

```text
IMPLEMENT
```

---

# 6. Tests PostgreSQL

Tests Postgres identifiés comme conditionnels/non exécutés durant audit.

Décision :

```text
ENABLE / CERTIFY
```

---

# 7. Gap Matrix

| Domaine | Cible | Existant | État | Décision | Priorité |
|---|---|---|---|---|---|
| Query endpoints | réels | oui | bon | KEEP | P2 |
| Read/execute | réel | oui | bon | KEEP | P2 |
| Tenant Context | serveur | oui | bon | KEEP/TEST | P1 |
| BM Provider | tenant/auth | oui | bon | KEEP | P1 |
| UI Binding | réel | oui | partiel | KEEP | P2 |
| Pack Resolution Gate | obligatoire | non | critique | FIX | P1 |
| resolutionId | vérifié | non obligatoire | manque | IMPLEMENT | P1 |
| Data Policies | contractuelles | partiel/à auditer | à compléter | AUDIT/COMPLETE | P1 |
| Postgres tests | exécutés | conditionnels | insuffisant | FIX | P1 |
| E2E | complet | absent | manque | IMPLEMENT | P2 |
| RLS | defense-in-depth | dépend Foundation | à coordonner | ADAPT | P1/P2 |

---

# 8. LOT DATA-0 — Audit

Inspecter :

```text
backend/src/data-runtime/
data-runtime.controller.ts
bm-records.provider.ts
providers
repositories
policies
tests
frontend published renderer bindings
Pack Runtime integration
schema.prisma
```

---

# 9. LOT DATA-1 — Runtime Resolution Gate

Créer/réutiliser :

```text
assertExecutableResolution(resolutionId)
```

Avant toute opération provenant d’une application publiée.

Vérifier :
- Tenant ;
- status EXECUTABLE ;
- ApplicationVersion ;
- PackVersion ;
- Environment ;
- Data capabilities.

---

# 10. LOT DATA-2 — Runtime Data Context

Construire depuis données serveur :

```text
IAM principal
+
Pack Runtime resolution
+
Data Contract
+
Repository
```

Ne pas dupliquer tenant/app/version depuis frontend comme autorité.

---

# 11. LOT DATA-3 — API Contract

Ajouter `resolutionId` aux requêtes runtime publiées.

Maintenir compatibilité avec les routes admin/techniques si elles ont un autre contrat clairement séparé.

---

# 12. LOT DATA-4 — Provider Security

Auditer tous providers :

- Prisma ;
- BM records ;
- ERP ;
- internal services.

Chaque provider doit :
- recevoir tenant context ;
- appliquer contract/policy ;
- refuser scope invalide.

---

# 13. LOT DATA-5 — Query Controls

Renforcer :
- whitelist fields ;
- filters ;
- sort ;
- pagination ;
- limits ;
- no raw SQL/Prisma.

---

# 14. LOT DATA-6 — Mutation Security

Renforcer :
- allowed operation ;
- input schema ;
- mass assignment ;
- protected fields ;
- permission ;
- transaction ;
- audit.

---

# 15. LOT DATA-7 — Policies

Auditer et compléter :

```text
READ
CREATE
UPDATE
DELETE
```

Associer IAM permissions.

---

# 16. LOT DATA-8 — Transactions

Tester :
- commit ;
- rollback ;
- nested behavior ;
- provider failure.

Ne pas simuler transaction distribuée.

---

# 17. LOT DATA-9 — PostgreSQL / RLS

Coordonner avec Tenant Foundation :

- DB user ;
- tenant filters ;
- RLS where enabled ;
- SET LOCAL transaction strategy ;
- concurrency tests.

---

# 18. LOT DATA-10 — ERP Provider

Vérifier :
- passe par Integration Hub ;
- aucun client Dolibarr direct ;
- no mock silently in REAL.

---

# 19. LOT DATA-11 — Diagnostics

Ajouter/normaliser :
- resolution denial ;
- provider unavailable ;
- policy denied ;
- transaction failure ;
- query timeout.

---

# 20. LOT DATA-12 — Tests Security

Ajouter :
- blocked resolution ;
- forged resolutionId ;
- Tenant A row B ;
- mass assignment ;
- forbidden field ;
- SQL/Prisma injection attempt ;
- unauthorized mutation.

---

# 21. LOT DATA-13 — Postgres Tests

Faire réellement tourner les tests PostgreSQL en CI/recette.

---

# 22. LOT DATA-14 — E2E

Positive :

```text
UI Builder published UI
→ Pack Runtime EXECUTABLE
→ Data Runtime
→ PostgreSQL
```

Negative :

```text
Pack Runtime BLOCKED
→ Data Runtime
→ DENY
```

---

# 23. LOT DATA-15 — UI Data Platform

Compléter cockpit :
- sources ;
- contracts ;
- query explorer ;
- policies ;
- diagnostics.

---

# 24. Production blockers

Ne pas considérer Data Runtime prêt si :

- runtime published calls sans résolution ;
- BLOCKED peut lire/écrire ;
- tenant scope dépend du frontend ;
- Postgres tests jamais exécutés ;
- raw SQL arbitrary exposé ;
- provider contourne IAM/policies.

---

# 25. Ordre recommandé

```text
DATA-0 Audit
↓
DATA-1 Resolution Gate
↓
DATA-2 Runtime Context
↓
DATA-3 API Contract
↓
DATA-4 Providers
↓
DATA-5 Query Controls
↓
DATA-6 Mutation Security
↓
DATA-7 Policies
↓
DATA-8 Transactions
↓
DATA-9 PostgreSQL/RLS
↓
DATA-10 ERP Provider
↓
DATA-11 Diagnostics
↓
DATA-12 Security Tests
↓
DATA-13 Postgres Tests
↓
DATA-14 E2E
↓
DATA-15 UI
```
