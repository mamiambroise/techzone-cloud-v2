# SPEC UI — PRISMA / TENANT FOUNDATION

**Principe :** ce module est principalement backend/DB. L’UI est une interface d’administration et de diagnostic, jamais un éditeur SQL libre.

---

# 1. Position UX

Sous :

```text
PLATEFORME
→ Administration
→ Base de données / Tenant Foundation
```

Accès réservé aux rôles plateforme autorisés.

---

# 2. Navigation

```text
Tenant Foundation
├── Vue d’ensemble
├── Schéma & Prisma
├── Migrations
├── Tenant Isolation
├── RLS
├── Diagnostics
└── Préflight
```

---

# 3. Vue d’ensemble

Cards réelles :

- Prisma status ;
- migration status ;
- schema cible ;
- DB connectivity ;
- Tenant tables ;
- RLS coverage ;
- failed preflight.

Aucun KPI fictif.

---

# 4. Schéma & Prisma

Afficher :

- Prisma version ;
- datasource ;
- PostgreSQL schema ;
- nombre modèles ;
- nombre tenant-scoped ;
- warnings type mismatch ;
- FK/index diagnostics.

Lecture seule en MVP.

---

# 5. Migrations

Table :

- migration ;
- appliedAt ;
- status ;
- checksum/status si disponible ;
- environment ;
- duration ;
- warning.

Actions :
- voir détail ;
- lancer preflight si backend le permet ;
- jamais `DROP` ou SQL arbitraire depuis UI.

---

# 6. Tenant Isolation

Table matrice :

| Table | Scope | tenantId | FK | Index | Service Filter | RLS |
|---|---|---|---|---|---|---|

Filtres :
- module ;
- status ;
- RLS missing ;
- type mismatch.

---

# 7. RLS

Afficher :

- status enabled ;
- FORCE RLS si retenu ;
- policies ;
- operations couvertes ;
- last test ;
- concurrency test status.

Actions sensibles :
- aucune activation directe sans workflow contrôlé.

---

# 8. Preflight

Checklist :

```text
Prisma validate
Prisma generate
Migration status
Fresh DB
Upgrade DB
Cross-tenant tests
RLS tests
Build
Backup confirmed
```

Résultat :
- PASS ;
- FAIL ;
- BLOCKED ;
- NOT RUN.

---

# 9. Diagnostics

Afficher :
- erreurs migration ;
- drift ;
- schema mismatch ;
- tenant type mismatch ;
- RLS policy missing ;
- DB connection issue.

Aucun secret DB.

---

# 10. États UI

- loading ;
- empty ;
- error ;
- forbidden ;
- unavailable ;
- degraded.

---

# 11. Sécurité UI

Ne jamais afficher :
- DATABASE_URL complète ;
- password DB ;
- secret ;
- token ;
- connection string avec credential.

Masquer host/user si policy le demande.

---

# 12. Critères d’acceptation

- diagnostics reposent sur backend réel ;
- aucune action destructive libre ;
- toutes les vues permission-aware ;
- aucun secret exposé ;
- états responsive ;
- résultats preflight traçables.
