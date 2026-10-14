# CAHIER DES CHARGES — TECHZONE CLOUD PRISMA / TENANT FOUNDATION
## Étape 2 — Gap Matrix et plan de consolidation

**Audit de référence :** octobre 2026  
**Commits notables :** `b537c12f`, `d555170a`  
**Priorité actuelle :** P0 déploiement

---

# 1. État réel

```text
ÉTAT GLOBAL : 🔴
```

Prisma est syntaxiquement valide, mais la chaîne de migration et l’isolation DB ne sont pas encore certifiées.

---

# 2. KEEP

## Prisma schema/client
- structurés ;
- `prisma validate` passe.

Décision :
```text
KEEP + HARDEN
```

## Migrations actives
- huit migrations actives identifiées.

Décision :
```text
KEEP + VERIFY
```

## migrations_legacy
- séparées explicitement.

Décision :
```text
KEEP
```

## Tenant FK / modèles Pack Runtime
- présents.

Décision :
```text
KEEP + NORMALIZE
```

---

# 3. P0 confirmé — schema PostgreSQL incohérent

Audit :

```text
PrismaService → public
baseline → business_manager
.env.example → ne précise pas le schéma
```

Décision :

```text
FIX BEFORE ANY DB DEPLOYMENT
```

Action :
1. choisir le schéma canonique ;
2. aligner DATABASE_URL ;
3. aligner PrismaService ;
4. aligner baseline ;
5. aligner docs ;
6. fresh DB test ;
7. upgrade DB test.

---

# 4. P1 — dérive des types tenantId

Cas confirmés :

```text
ERPRegistry.tenantId
Prisma : UUID
baseline : varchar

IamSession.tenantId
Prisma : UUID
baseline : text
```

Décision :

```text
FIX WITH RECONCILIATION MIGRATIONS
```

Ne pas modifier seulement `schema.prisma`.

Le SQL réel doit être rapproché.

---

# 5. P2 — reconcile_iam.sql dangereux

Le script contient :

```text
DROP SCHEMA auth_aim CASCADE
```

Décision :

```text
REMOVE FROM NORMAL DEPLOYMENT PATH
MARK MANUAL / DANGEROUS
```

Ne pas exécuter automatiquement.

---

# 6. P1/P2 — absence de RLS

Aucune policy PostgreSQL RLS trouvée.

Décision :

```text
IMPLEMENT SELECTIVELY
```

Priorité aux tables réellement tenant-scoped et sensibles.

RLS vient après :
- classification des tables ;
- harmonisation tenantId ;
- correction migration ;
- tests transaction/pool.

---

# 7. Gap Matrix

| Domaine | Cible | Existant | État | Décision | Priorité |
|---|---|---|---|---|---|
| Prisma validate | PASS | PASS | Bon | KEEP | P3 |
| Schema canonique | unique | divergent | Critique | FIX | P0 |
| Baseline | cohérente | partielle | Critique | FIX | P0 |
| `.env.example` | explicite | incomplet | Critique | FIX | P0 |
| tenantId types | homogènes | dérive | Mauvais | FIX | P1 |
| FK tenant | Oui | partiel | Partiel | COMPLETE | P1 |
| indexes tenant | Oui | à auditer | À confirmer | COMPLETE | P1 |
| migrations legacy | archivées | Oui | Bon | KEEP | P3 |
| destructive scripts | hors pipeline | présent | Risque | FIX | P2 |
| RLS | defense-in-depth | absent | Manquant | IMPLEMENT | P1/P2 |
| fresh DB test | obligatoire | non certifié | Manquant | IMPLEMENT | P0 |
| upgrade DB test | obligatoire | non certifié | Manquant | IMPLEMENT | P0 |
| cross-tenant DB tests | obligatoire | non trouvé | Manquant | IMPLEMENT | P0/P1 |

---

# 8. LOT PF-0 — Audit DB réel

Lister :

- modèles Prisma ;
- tables SQL ;
- schemas PostgreSQL ;
- migrations actives ;
- legacy ;
- types réels des colonnes ;
- FK ;
- indexes ;
- unique constraints ;
- tables tenant-scoped.

Livrable :
`PRISMA_TENANT_INVENTORY.md`

---

# 9. LOT PF-1 — Canonical PostgreSQL Schema

Choisir et appliquer une seule convention :

```text
public
OU
business_manager
```

mais pas les deux silencieusement.

Mettre à jour :
- PrismaService ;
- `.env.example` ;
- migrations ;
- docs ;
- tests.

---

# 10. LOT PF-2 — tenantId type normalization

Créer matrice :

| Table | Prisma Type | SQL Type | FK | Décision |
|---|---|---|---|---|

Corriger par migrations non destructives.

---

# 11. LOT PF-3 — Constraints / Indexes

Pour chaque table tenant-scoped :

- `tenantId NOT NULL` si applicable ;
- FK ;
- index ;
- composite unique ;
- cascade policy.

---

# 12. LOT PF-4 — Fresh DB

Créer DB vide.

Tester :

```text
prisma migrate deploy
prisma generate
backend start
minimal smoke tests
```

Aucun patch manuel autorisé.

---

# 13. LOT PF-5 — Upgrade DB

Sur copie anonymisée représentative :

- inspect migrate status ;
- backup ;
- run migrations ;
- validate rows ;
- compare constraints/types ;
- app smoke tests.

---

# 14. LOT PF-6 — RLS design

Ne pas coder avant preuve du mécanisme de propagation tenant.

Tester :

```text
Prisma interactive transaction
+
SET LOCAL
+
current_setting
+
pool reuse
```

---

# 15. LOT PF-7 — RLS pilot

Commencer sur un petit groupe de tables critiques.

Critères :
- A voit A ;
- A ne voit pas B ;
- insert B refusé ;
- update B refusé ;
- delete B refusé ;
- admin path contrôlé.

---

# 16. LOT PF-8 — RLS extension

Étendre par domaine après succès du pilote.

Ne pas activer massivement toutes les tables en une seule migration.

---

# 17. LOT PF-9 — Deployment / Automation tenant fixes

Une fois Foundation stable :

- Deployment doit filtrer par tenant ;
- Automation doit devenir tenant-scoped ;
- services existants doivent utiliser le contexte IAM effectif.

---

# 18. LOT PF-10 — CI

Ajouter :

- Prisma validate ;
- Prisma generate ;
- fresh DB migration ;
- DB integration tests ;
- cross-tenant security tests.

---

# 19. Conditions bloquant déploiement

Production interdite si :

- schéma runtime ≠ schéma migration ;
- type tenantId incohérent ;
- migration fresh DB échoue ;
- upgrade DB non testé ;
- script destructive présent dans pipeline ;
- test cross-tenant rouge ;
- RLS activée sans test pool/concurrency.

---

# 20. Ordre recommandé

```text
PF-0 Audit
↓
PF-1 Canonical schema
↓
PF-2 Normalize tenantId
↓
PF-3 Constraints/indexes
↓
PF-4 Fresh DB
↓
PF-5 Upgrade DB
↓
PF-6 RLS design
↓
PF-7 RLS pilot
↓
PF-8 RLS extension
↓
PF-9 Modules tenant fixes
↓
PF-10 CI
```
