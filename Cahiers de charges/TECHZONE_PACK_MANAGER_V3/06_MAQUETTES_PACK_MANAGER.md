# MAQUETTES — TECHZONE CLOUD PACK MANAGER

---

# M01 — Pack Manager Overview

Cards :
- Packs
- Draft Versions
- Ready
- Published
- Validation Errors
- Recent Publications

Recent activity.

---

# M02 — Packs List

Table :
- Pack
- Application
- Current Version
- Draft
- Status
- Last Validation
- Last Publication
- Actions

---

# M03 — Create Pack

Form :
- Application
- Name
- Key
- Description

---

# M04 — Pack Detail

Header :
- Pack
- Application
- status

Tabs :
- Overview
- Versions
- Dependencies
- Requirements
- Validation
- Manifest
- Publications
- History

---

# M05 — Versions List

Table :
- Pack Version
- Application Version
- Status
- Validation
- Snapshot
- Manifest
- Publication
- Actions

---

# M06 — Create PackVersion

Fields :

```text
Application Version *
Version Number *
Label
Release Notes
```

Main correction from audit.

---

# M07 — ApplicationVersion Selector

Rich dropdown/table :

- Version
- Status
- Validation
- Updated
- Business definition status

Only same Tenant/Application.

---

# M08 — PackVersion Detail

Summary cards :
- App Version
- Business
- UI
- Automation
- Config
- Validation

---

# M09 — Composition

Four main cards :

```text
Business Definition
UI Definition
Automation Definition
Configuration Snapshot
```

Each :
- ref/version
- status
- validation

---

# M10 — Dependencies

Table :
- dependency
- type
- constraint
- required
- resolution
- status

---

# M11 — Requirements

Sections :
- Runtime
- Data
- Integration
- Capabilities
- Schema Versions

---

# M12 — Validation Cockpit

Cards/rows :

```text
Business       ✓
UI             ✓
Automation     ✓
Configuration  ✓
Dependencies   ⚠
Requirements   ✓
Integrity      ✓
```

---

# M13 — Validation Issue Drawer

Fields :
- severity
- code
- resource
- message
- open source.

---

# M14 — Snapshot

Read-only summary :
- snapshot ID
- ApplicationVersion
- created
- source refs
- hash

---

# M15 — Manifest Structured View

Tree :
- application
- version
- business
- ui
- automation
- requirements
- integrity.

---

# M16 — Manifest JSON View

Code viewer, read-only.

---

# M17 — Integrity Panel

Show :
- algorithm
- hash
- verified badge
- last verification.

---

# M18 — Publication Review

Summary :
- Pack
- PackVersion
- ApplicationVersion
- validation
- snapshot
- Manifest
- dependencies
- warnings
- hash.

---

# M19 — Publish Confirmation

Strong confirmation.

CTA :
`Publier cette version`.

---

# M20 — Publication Success

Badge :
`PUBLISHED`

Show :
- timestamp
- publication ID
- hash
- immutable notice

CTA :
`Déployer`.

---

# M21 — Published Read-only Version

All editors disabled.

Actions :
- New Version
- Compare
- Manifest
- Deployment.

---

# M22 — Failed Publication

Display :
- stage
- error code
- correlation ID
- retry after correction.

---

# M23 — Version Clone

Select :
- source PackVersion
- target ApplicationVersion
- new version number
- label.

---

# M24 — Publication History

Timeline/table :
- version
- actor
- date
- hash
- status.

---

# M25 — Audit History

Events :
- created
- updated
- validated
- snapshot
- manifest
- published
- archived.

---

# M26 — Empty Pack

Empty state :
- no versions
- CTA Create PackVersion.

---

# M27 — No ApplicationVersion Available

Explain :
- no eligible Application Version
- CTA Go to Business Manager.

---

# M28 — Permission Denied

403 state.

---

# M29 — Mobile Pack Manager

Cards :
- Pack
- AppVersion
- Validation
- Manifest
- Publish CTA.

---

# M30 — Integration Flow

Visual read-only flow :

```text
Business Manager
↓
UI Builder
↓
Automation
↓
Pack Manager
↓
Deployment
↓
Runtime
```

Status badges per source.

---

# Visual direction

Use Techzone Cloud approved design :

- premium SaaS ;
- dark navy sidebar ;
- very light workspace ;
- white rounded cards ;
- subtle shadows ;
- blue / indigo / violet ;
- validation green/amber/red ;
- Lucide icons ;
- clean tables ;
- responsive ;
- no fake metrics.
