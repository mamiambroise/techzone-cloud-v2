# SPEC UI — TECHZONE CLOUD PACK MANAGER

---

# 1. Style

Techzone Cloud premium :

- dark navy sidebar ;
- very light background ;
- white rounded cards ;
- blue/indigo/violet accents ;
- clean tables ;
- Lucide icons ;
- responsive ;
- no fake metrics.

---

# 2. Navigation

```text
Pack Manager
├── Vue d’ensemble
├── Packs
└── Workspace Pack
    ├── Overview
    ├── Versions
    ├── Dependencies
    ├── Requirements
    ├── Validation
    ├── Manifest
    ├── Publications
    └── History
```

---

# 3. Overview

Cards :
- Packs ;
- Draft Versions ;
- Ready ;
- Published ;
- Validation Errors ;
- Recent Publications.

Recent activity list.

---

# 4. Packs List

Columns :

```text
Pack
Application
Current Version
Draft Version
Status
Last Validation
Last Publication
Actions
```

---

# 5. Create Pack

Fields :
- Application ;
- Name ;
- Key ;
- Description ;
- metadata minimal.

---

# 6. Pack Detail

Header :
- Pack ;
- Application ;
- status ;
- actions.

Tabs :
- Overview ;
- Versions ;
- Dependencies ;
- Requirements ;
- Validation ;
- Manifest ;
- Publications ;
- History.

---

# 7. Versions List

Columns :
- Version ;
- Application Version ;
- Status ;
- Validation ;
- Snapshot ;
- Manifest ;
- Published ;
- Actions.

---

# 8. Create PackVersion

Fields :

```text
Application Version *
Version Number *
Label
Release Notes
```

ApplicationVersion selector displays :
- version ;
- status ;
- validation ;
- updated date.

Do not allow free-text ID.

---

# 9. ApplicationVersion Selector

Search/filter by :
- version ;
- status.

Only current Tenant + current Application.

---

# 10. Version Detail

Sections :
- ApplicationVersion ;
- Business Definition ;
- UI Definition ;
- Automation Definition ;
- Config Snapshot ;
- Dependencies ;
- Requirements ;
- validation.

---

# 11. Composition

Cards :

```text
Business
UI
Automation
Configuration
```

Each card :
- version/ref ;
- status ;
- hash if relevant ;
- validation.

---

# 12. Dependencies

Table :
- Dependency ;
- Type ;
- Version/Constraint ;
- Status ;
- Required ;
- Resolution.

---

# 13. Requirements

Groups :
- Runtime ;
- Data ;
- Integration ;
- Capabilities ;
- Schema versions.

---

# 14. Validation Cockpit

Summary :

```text
Business       ✓
UI             ✓
Automation     ✓
Configuration  ✓
Dependencies   ⚠
Requirements   ✓
Integrity      ✓
```

Issue list with deep links.

---

# 15. Snapshot View

Read-only :
- snapshot id ;
- created at ;
- source refs ;
- hash ;
- integrity.

---

# 16. Manifest Viewer

Tabs :
- Structured ;
- JSON ;
- Compatibility ;
- Integrity.

No secret.

---

# 17. Publication Review

Display :
- Pack ;
- PackVersion ;
- ApplicationVersion ;
- validation ;
- snapshot ;
- Manifest ;
- dependencies ;
- warnings ;
- hash.

CTA :
`Publier`.

---

# 18. Publication Success

Show :
- Published badge ;
- publication timestamp ;
- immutable notice ;
- Manifest hash ;
- CTA `Déployer`.

---

# 19. Published Version

Banner :

```text
PUBLISHED — Read only
```

Actions :
- Create next version ;
- View Manifest ;
- Go to Deployment.

---

# 20. Failed Validation

Error summary + deep links.

No publication CTA.

---

# 21. History

Timeline :
- version created ;
- validation ;
- snapshot ;
- Manifest ;
- publication ;
- archive.

---

# 22. Permissions

Frontend actions:
- create ;
- edit ;
- validate ;
- publish ;
- archive.

Backend remains authority.

---

# 23. Responsive

Desktop :
- tables + side inspector.

Tablet :
- compact cards/drawers.

Mobile :
- cards ;
- step forms ;
- sticky action.

---

# 24. UI DoD

- ApplicationVersion selection works ;
- no raw ID input ;
- PUBLISHED read-only ;
- validation real ;
- manifest real ;
- tenant context visible ;
- 401/403/404 handled ;
- responsive.
