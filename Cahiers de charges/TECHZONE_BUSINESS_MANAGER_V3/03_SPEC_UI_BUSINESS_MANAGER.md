# SPEC UI — TECHZONE CLOUD BUSINESS MANAGER

---

# 1. Style

Design cible :

- SaaS premium ;
- sidebar bleu nuit ;
- fond très clair ;
- cards blanches arrondies ;
- ombres légères ;
- accents bleu / indigo / violet ;
- pastel par fonction ;
- typographie nette ;
- Lucide icons ;
- responsive.

---

# 2. Navigation

```text
Business Manager
├── Vue d’ensemble
├── Applications
├── Modèles de données
├── Fonctionnalités
├── Navigation
├── Configuration
└── Validation & publication
```

Versions via Context Bar.

---

# 3. Context Bar

Afficher :

```text
Tenant
Application
Version
Status
```

Exemple :

```text
TechBoutique / v1.2.0 / DRAFT
```

Actions :
- switch app ;
- switch version ;
- create version.

---

# 4. Overview

Cards :

- Entities ;
- Fields ;
- Relations ;
- Features ;
- Capabilities ;
- Events ;
- Errors ;
- Warnings.

Sections :
- progression ;
- recent changes ;
- incomplete elements ;
- validation summary.

CTA :
`Continuer la configuration`.

---

# 5. Applications List

Colonnes :

```text
Application
Key
Status
Current Version
Draft Version
Entities
Last Update
Actions
```

Actions :
- Open ;
- Edit ;
- Duplicate ;
- Archive ;
- New Version.

---

# 6. Application Detail

Header :
- name ;
- key ;
- status ;
- versions ;
- actions.

Tabs :

```text
Overview
Versions
Metadata
Contracts
Audit
```

---

# 7. Versions

Cards/table :
- version ;
- status ;
- createdAt ;
- validation ;
- source version ;
- actions.

PUBLISHED readonly.

---

# 8. Create Version

Options :
- empty ;
- clone previous version.

Review differences if clone.

---

# 9. Data Model Overview

Graph/list hybrid :

- Entities ;
- Relations ;
- unresolved refs.

Actions :
- Add Entity ;
- open diagram ;
- validate.

---

# 10. Entity List

Table :
- Entity ;
- Key ;
- Fields ;
- Relations ;
- Status ;
- Issues ;
- Actions.

---

# 11. Entity Detail

Tabs :

```text
General
Fields
Relations
Metadata
Permissions
Validation
```

---

# 12. Field Editor

Fields :
- key ;
- label ;
- type ;
- required ;
- nullable ;
- default ;
- validation ;
- metadata.

Preview summary.

---

# 13. Relation Editor

Visual selector :

```text
Source Entity
Relation Type
Target Entity
Cardinality
Required
```

Display invalid refs immediately.

---

# 14. Features Workspace

Cards/table :
- Feature key ;
- label ;
- capabilities ;
- permissions ;
- status.

---

# 15. Capabilities Workspace

Table :
- capability ;
- source feature ;
- consumers ;
- status ;
- validation.

---

# 16. Business Events

Table :
- event key ;
- source ;
- payload contract ;
- version ;
- consumers.

---

# 17. Navigation Workspace

Tree editor :

```text
Catalogue
├── Produits
├── Catégories
└── Marques
```

Business navigation only, not UI layout.

---

# 18. Configuration

Sections :
- definitions ;
- scopes ;
- defaults ;
- overrides ;
- snapshot status.

Show effective resolution preview.

---

# 19. Contracts

Table :
- contract ;
- type ;
- version ;
- consumers ;
- status ;
- validation.

Read/write actions permission-aware.

---

# 20. Permissions Reference

Registry selector from IAM.

Do not allow arbitrary invisible permission strings if Registry contract exists.

---

# 21. Validation Cockpit

Summary :

```text
Application       ✓
Entities          ✓
Fields            ✓
Relations         ✓
Features          ✓
Capabilities      ✓
Events            ✓
Configuration     ⚠
Contracts         ✕
```

Issues list :
- severity ;
- resource ;
- message ;
- open action.

---

# 22. Validation & Publication page

Business Manager side :

```text
Business Definition status
READY / NOT READY
```

Pack Manager side CTA :

```text
Continuer vers Pack Manager
```

Do not publish Pack inside BM.

---

# 23. Revision / Diff

Compare :

```text
v1.1.0
vs
v1.2.0 DRAFT
```

Categories :
- added ;
- changed ;
- removed.

---

# 24. Empty States

Provide specific empty states :
- no applications ;
- no entities ;
- no features ;
- no events ;
- no contracts.

CTA appropriate.

---

# 25. Error States

Handle :
- 401 ;
- 403 ;
- 404 ;
- validation errors ;
- stale version ;
- cross-tenant denied ;
- network error.

---

# 26. Responsive

Desktop:
- sidebar + content + inspector.

Tablet:
- collapsible sidebar ;
- drawers.

Mobile:
- cards ;
- stacked forms ;
- context bar compact.

---

# 27. Accessibility

- keyboard ;
- focus ;
- labels ;
- error association ;
- contrast ;
- modals ;
- not color-only.

---

# 28. UI DoD

- no fake KPI ;
- context always visible ;
- PUBLISHED readonly ;
- permissions reflected ;
- validation deep links ;
- loading/empty/error ;
- responsive ;
- existing UI preserved when better.
