# TECH — PRISMA / TENANT FOUNDATION

**Stack :** NestJS + Prisma 7 + PostgreSQL

---

# 1. Fichiers prioritaires

```text
backend/prisma/schema.prisma
backend/prisma/migrations/*
backend/prisma/migrations_legacy/*
backend/prisma/reconcile_iam.sql
backend/src/prisma/prisma.service.ts
backend/.env.example
```

---

# 2. Canonical schema

Audit actuel à résoudre :

```text
PrismaService => public
baseline => business_manager
```

Choisir une convention unique.

Exemple si `business_manager` retenu :

```text
DATABASE_URL=postgresql://.../db?schema=business_manager
```

Ne pas appliquer avant vérification de l’existant réel.

---

# 3. PrismaService

Doit :
- lire la config canonique ;
- ne pas remplacer silencieusement le schema ;
- gérer shutdown proprement ;
- supporter tests ;
- exposer transactions.

---

# 4. tenantId

Créer un standard :

```text
Tenant.id = UUID
All tenant FK = UUID
```

uniquement si confirmé par modèle Tenant actuel.

Puis migration progressive.

---

# 5. Migration reconciliation

Pattern sécurisé :

1. add/alter compatible ;
2. backfill si nécessaire ;
3. validate ;
4. add constraints ;
5. switch app ;
6. remove legacy plus tard.

Éviter conversion destructive directe.

---

# 6. Tenant Scope Helper

Évaluer un accès centralisé :

```ts
type TenantContext = {
  tenantId: string;
  identityId?: string;
}
```

et helpers/repositories pour limiter les oublis de filtre.

Ne pas créer une abstraction qui cache les transactions RLS.

---

# 7. RLS Architecture

Option recommandée à tester :

```text
request
↓
effective tenant from IAM
↓
Prisma interactive transaction
↓
SET LOCAL app.current_tenant_id = ...
↓
tenant queries
↓
COMMIT
```

La validité dépend du comportement Prisma/pool.

---

# 8. SQL conceptuel

Exemple uniquement :

```sql
ALTER TABLE business_entity ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_select
ON business_entity
FOR SELECT
USING (
  tenant_id = current_setting('app.current_tenant_id', true)::uuid
);
```

Adapter noms/types réels.

---

# 9. INSERT policy

Utiliser `WITH CHECK`.

```sql
WITH CHECK (
  tenant_id = current_setting('app.current_tenant_id', true)::uuid
)
```

Même principe UPDATE.

---

# 10. Missing tenant context

Policy doit retourner aucune ligne/refuser.

Ne jamais interpréter contexte absent comme plateforme globale.

---

# 11. Platform Operations

Créer un chemin séparé :

```text
PLATFORM OPERATION
→ explicit platform permission
→ dedicated service/role
→ audit
```

Pas de bypass implicite.

---

# 12. Prisma Middleware / Extensions

Évaluer soigneusement.

Un extension Prisma peut aider à :
- détecter modèles tenant-scoped ;
- exiger tenant context ;
- compléter certains filters.

Mais :
- ne doit pas être seule défense ;
- doit gérer nested writes ;
- relations ;
- raw queries ;
- transactions.

---

# 13. Raw SQL

`$queryRaw` / `$executeRaw` :
- inventorier ;
- paramètres bindés ;
- tenant context explicite ;
- tests ;
- aucune concaténation SQL utilisateur.

---

# 14. Connection Pool

Tester :
- connexion réutilisée ;
- transaction A puis B ;
- requêtes concurrentes ;
- rollback ;
- exception.

Assert :
- aucun tenant context ne fuit.

---

# 15. RLS + Pool Test

Pseudo :

```text
Parallel:
 Tx A SET LOCAL tenant=A → query
 Tx B SET LOCAL tenant=B → query

Repeat N times

Assert:
 A rows only A
 B rows only B
```

---

# 16. Database Roles

Runtime :
- CONNECT ;
- usage schema ;
- CRUD nécessaire ;
- pas superuser ;
- pas BYPASSRLS.

Migration :
- DDL nécessaire ;
- séparé si possible.

---

# 17. Indexes

Auditer :
- every FK ;
- tenantId ;
- tenantId + id/key ;
- frequent status filters.

RLS predicates doivent pouvoir utiliser les indexes.

---

# 18. Migration Test Harness

Prévoir scripts dédiés :

```text
create temp postgres/db
migrate deploy
run validation
seed minimal tenant A/B
run tenant tests
destroy temp db
```

---

# 19. Fresh DB Validation

Doit prouver :
- baseline + migrations suffisent ;
- aucun script manuel ;
- application démarre.

---

# 20. Upgrade DB Validation

Doit prouver :
- données conservées ;
- IDs conservés ;
- FK valides ;
- types convertis ;
- indexes présents ;
- app fonctionne.

---

# 21. CI

Ajouter job PostgreSQL service container si CI le permet.

Séquence :

```text
npm ci
prisma validate
prisma generate
prisma migrate deploy
DB integration tests
tenant/RLS tests
nest build
```

---

# 22. Technical DoD

- schema canonique ;
- no drift connu ;
- tenantId type unique ;
- migrations testées ;
- runtime role minimal ;
- RLS pilotée puis étendue ;
- pool leakage test vert ;
- raw SQL audité ;
- CI DB verte.
