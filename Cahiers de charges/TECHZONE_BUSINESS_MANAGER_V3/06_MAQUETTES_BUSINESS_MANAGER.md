# MAQUETTES — TECHZONE CLOUD BUSINESS MANAGER

---

# M01 — Business Manager Overview

Header :
- Application Context Bar ;
- version ;
- status.

Cards :
- Entities
- Fields
- Relations
- Features
- Capabilities
- Events
- Errors
- Warnings

Sections :
- progress ;
- recent changes ;
- validation.

---

# M02 — Applications List

Cards/table :
- Name
- Key
- Status
- Current Version
- Draft
- Entities
- Last Update
- Actions

CTA :
- New Application.

---

# M03 — Create Application

Form :
- Name
- Key
- Description
- Category
- Icon
- Metadata basics

---

# M04 — Application Detail

Tabs :
- Overview
- Versions
- Metadata
- Contracts
- Audit

---

# M05 — Versions

Timeline/table :
- Version
- Status
- Source
- Created
- Validation
- Actions

---

# M06 — Create Version

Options :
- Blank
- Clone previous

Preview source.

---

# M07 — Data Model Overview

Canvas/list hybrid.

Show :
- Entities
- Relations
- errors.

CTA :
- Add Entity.

---

# M08 — Entity List

Table :
- Entity
- Key
- Fields
- Relations
- Issues
- Status

---

# M09 — Entity Detail

Tabs :
- General
- Fields
- Relations
- Metadata
- Permissions
- Validation

---

# M10 — Create/Edit Entity

Form :
- Key
- Label
- Description
- Category
- Metadata

Live validation.

---

# M11 — Fields List

Table :
- Field
- Type
- Required
- Default
- Validation
- Actions

---

# M12 — Field Editor

Right-side inspector or page.

Controls :
- key
- type
- required
- nullable
- default
- validation
- metadata

---

# M13 — Relations Diagram

Visual graph.

Nodes = Entities.

Edges = Relations.

Click edge → inspector.

---

# M14 — Relation Editor

Source
Type
Target
Cardinality
Required
Delete policy if supported

---

# M15 — Features

Cards/table :
- key
- label
- capabilities
- permissions
- consumers
- status

---

# M16 — Capability Registry

Table :
- capability
- feature
- consumers
- status
- validation

---

# M17 — Business Events

Table :
- Event
- Source
- Payload
- Version
- Consumers

Drawer detail.

---

# M18 — Navigation

Tree editor :

```text
Catalogue
├── Produits
├── Catégories
└── Marques
```

No visual layout.

---

# M19 — Configuration

Panels :
- Defaults
- Scopes
- Overrides
- Effective Preview
- Snapshot

---

# M20 — Metadata Manager

Structured fields :
- description
- tags
- documentation
- display hints
- integration hints

---

# M21 — Permission References

IAM Registry picker.

Show :
- permission key
- module
- description
- validity

---

# M22 — Contracts List

Table :
- Contract
- Type
- Version
- Consumers
- Status
- Issues

---

# M23 — Contract Detail

Sections :
- schema
- version
- consumers
- references
- validation
- audit

---

# M24 — Validation Cockpit

Large summary :

```text
✓ Application
✓ Entities
✓ Fields
✓ Relations
✓ Features
⚠ Capabilities
✓ Events
✕ Contracts
```

Issues table:
- severity
- code
- resource
- message
- Open.

---

# M25 — Validation & Publication

Business Definition status.

Cards :
- Ready / Not Ready
- Errors
- Warnings
- Snapshot status

CTA :
- Go to Pack Manager.

---

# M26 — Version Diff

Compare two versions.

Columns :
- Added
- Changed
- Removed

Filter by resource type.

---

# M27 — Audit / Revisions

Timeline :
- actor
- action
- resource
- date
- version
- result

---

# M28 — Read-only Published Version

Banner :

```text
PUBLISHED — Read only
```

Actions :
- Create new version
- Compare
- Open Pack Manager

No write controls.

---

# M29 — Forbidden / No Permission

Standard 403 inside workspace.

---

# M30 — Mobile Business Manager

Responsive:
- compact Context Bar ;
- cards ;
- entity list ;
- validation issues ;
- bottom primary actions.

---

# Visual direction

Use Techzone Cloud approved style :

- premium SaaS ;
- navy sidebar ;
- very light workspace ;
- white rounded cards ;
- subtle shadows ;
- blue / indigo / violet ;
- pastel functional accents ;
- Lucide icons ;
- clean data tables ;
- clear badges ;
- responsive ;
- no fake data state presented as real.
