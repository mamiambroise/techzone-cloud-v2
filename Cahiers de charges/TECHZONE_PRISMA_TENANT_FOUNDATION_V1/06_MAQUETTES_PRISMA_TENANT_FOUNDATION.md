# MAQUETTES — PRISMA / TENANT FOUNDATION

Module principalement technique. Les maquettes servent à l’administration et au diagnostic.

---

# M01 — Foundation Overview

Cards :
- Prisma : Healthy
- Database : Connected
- Schema : business_manager/public selon cible
- Migrations : Up to date / Drift
- Tenant Isolation
- RLS Coverage
- Preflight status

---

# M02 — Schema & Prisma

Panels :
- Prisma version
- PostgreSQL version
- active schema
- model count
- tenant-scoped count

Table warnings :
- model
- field
- Prisma type
- DB type
- status

---

# M03 — Migrations

Table :
- migration name
- status
- applied date
- duration
- environment
- warning

Badges :
- Applied
- Pending
- Failed
- Drift
- Legacy

---

# M04 — Migration Detail

Sections :
- metadata
- SQL preview read-only
- affected tables
- destructive-operation warnings
- preflight results
- rollback notes

---

# M05 — Tenant Isolation Matrix

Table :

| Resource | Module | Scope | tenantId | FK | Index | App Filter | RLS |

Filters :
- insecure
- missing RLS
- missing FK
- type mismatch

---

# M06 — RLS Policies

List :
- table
- RLS enabled
- SELECT
- INSERT
- UPDATE
- DELETE
- last test

Detail drawer :
- policy metadata
- no secrets
- test results

---

# M07 — Preflight

Checklist visual:

```text
✓ Prisma validate
✓ Prisma generate
✓ Fresh DB
✕ Upgrade DB
✓ Cross Tenant
○ RLS concurrency
✓ Backend build
```

CTA :
- Re-run preflight

---

# M08 — Database Diagnostics

Issues grouped :

- Schema mismatch
- Type mismatch
- Missing index
- Missing FK
- Missing RLS
- Migration drift
- Connection issue

Priority badges P0/P1/P2.

---

# M09 — Tenant Test Results

Table :
- test
- Tenant A
- Tenant B
- operation
- expected
- result
- duration

---

# M10 — Environment Database Configuration

Read-only safe view :

- environment
- database provider
- schema name
- SSL status
- pool mode
- migration status

Never display credentials.

---

# M11 — Mobile Diagnostics

Compact cards for:
- migration health
- tenant security
- P0 alerts
- preflight.

---

# Visual style

Respect Techzone Cloud :

- sidebar bleu nuit ;
- fond clair ;
- cards blanches ;
- bleu/indigo/violet ;
- vert/ambre/rouge pour statuts ;
- icônes Lucide ;
- tables premium ;
- responsive ;
- aucun secret affiché.
