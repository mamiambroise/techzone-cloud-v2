# SPEC UI — TECHZONE CLOUD DATA PLATFORM / DATA RUNTIME

---

# 1. Design

Style Data :

- sidebar bleu nuit ;
- fond très clair ;
- accent cyan/bleu ;
- white surfaces ;
- 10–12 px radius ;
- subtle shadows ;
- Lucide icons ;
- professional density ;
- responsive.

Le module ressemble à un cockpit Data, pas à un DBA tool.

---

# 2. Navigation

```text
DONNÉES & INTÉGRATIONS
└── Données
    ├── Vue d’ensemble
    ├── Sources
    ├── Modèles & Contrats
    ├── Requêtes
    ├── Politiques
    └── Diagnostics
```

---

# 3. Overview

Cards réelles :

- Data Sources ;
- Available ;
- Degraded ;
- Contracts ;
- Repositories ;
- Queries ;
- Mutation Errors ;
- Runtime Denials.

---

# 4. Sources

Table :

```text
Source
Type
Provider
Status
Capabilities
Environment
Last Check
Diagnostics
```

---

# 5. Source Detail

Tabs :

```text
Overview
Capabilities
Configuration
Contracts
Health
Diagnostics
History
```

Credential values never shown.

---

# 6. Contracts List

Columns :

- Entity ;
- Source ;
- Operations ;
- Fields ;
- Relations ;
- Permissions ;
- Version ;
- Status.

---

# 7. Contract Detail

Sections :

- Entity ;
- Repository ;
- Provider ;
- allowed operations ;
- fields ;
- filters ;
- sorting ;
- pagination ;
- permissions ;
- policies ;
- runtime requirements.

---

# 8. Repository Registry

Table :

```text
Entity
Repository
Source
Provider
Operations
Transaction
Availability
```

---

# 9. Query Explorer

Controls :

```text
Entity
Fields
Filters
Sort
Limit
Runtime Context if required
Run
```

No raw SQL.

---

# 10. Query Result

Show :

- columns ;
- rows ;
- duration ;
- count ;
- pagination ;
- provider ;
- correlation ID.

Mask sensitive fields according policy.

---

# 11. Query Explain Summary

Optional admin view :
- contract ;
- repository ;
- provider ;
- filters applied ;
- security policies applied.

No raw secrets.

---

# 12. Mutation Tester

Restricted technical/admin screen.

Fields :
- Entity ;
- Operation ;
- Record ID ;
- allowed fields ;
- payload.

Strong confirmation.

---

# 13. Policies

Matrix :

| Entity | READ | CREATE | UPDATE | DELETE |
|---|---|---|---|---|

Cell shows IAM permission/policy.

---

# 14. Field Access

If supported:

```text
Field
Read
Write
Mask
Policy
```

---

# 15. Row Policy

If supported:
- policy name ;
- entity ;
- operation ;
- backend condition description ;
- status.

No arbitrary code editor.

---

# 16. Runtime Data Context

Admin diagnostics card :

```text
Tenant
Application
Application Version
Pack Version
Environment
Resolution
Runtime Context
User
```

Read-only.

---

# 17. Resolution Required State

If runtime call missing/invalid resolution:

```text
Runtime data access blocked
```

Show controlled error code/correlation ID.

---

# 18. Provider Health

Cards :

- Prisma ;
- ERP ;
- Internal Service.

States :
- AVAILABLE ;
- DEGRADED ;
- UNAVAILABLE.

---

# 19. Diagnostics

Table :

```text
Stage
Severity
Code
Entity
Provider
Message
Timestamp
Correlation ID
```

---

# 20. Transaction Diagnostics

Display:
- transaction ID ;
- operations ;
- status ;
- rollback ;
- duration.

No raw records unless explicitly authorized.

---

# 21. Audit

Timeline:
- source changed ;
- policy changed ;
- CREATE ;
- UPDATE ;
- DELETE ;
- sensitive operation.

---

# 22. Empty States

- no source ;
- no contract ;
- no repository ;
- no query results ;
- no diagnostics.

---

# 23. Error States

- 401 ;
- 403 ;
- resolution blocked ;
- provider unavailable ;
- validation failed ;
- timeout ;
- conflict.

---

# 24. Responsive

Desktop :
- dense tables + side panel.

Tablet :
- cards/drawers.

Mobile :
- cards ;
- compact filters ;
- query explorer simplified.

---

# 25. UI DoD

- no raw SQL ;
- no credential ;
- real source status ;
- permissions reflected ;
- runtime resolution status visible in diagnostics ;
- loading/empty/error ;
- responsive.
