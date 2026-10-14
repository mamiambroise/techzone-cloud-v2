# MAQUETTES — TECHZONE CLOUD UI BUILDER

---

# M01 — UI Builder Overview

Cards:
- Pages
- Components
- Forms
- Errors
- Warnings
- Completion

Sections:
- Recent Pages
- Incomplete Pages
- Last Validation
- Save status.

---

# M02 — Pages List

Table:
- Page
- Route
- Layout
- Components
- Status
- Validation
- Updated
- Actions

---

# M03 — Create Page

Form:
- Name
- Route
- Title
- Page Type
- Layout
- Permission
- Description

---

# M04 — Page Detail

Tabs:
- General
- Components
- Data
- Actions
- Responsive
- Validation

---

# M05 — Visual Editor

3-column layout:

```text
Pages/Components | Canvas | Inspector
```

Context bar at top.

---

# M06 — Empty Editor

If no pages:
- illustration
- “Aucune page”
- CTA “Créer une page”.

---

# M07 — Auto-selected Editor

When pages exist:
- first valid page selected ;
- URL synchronized ;
- canvas rendered.

---

# M08 — Component Library

Search + categories:
- Layout
- Content
- Data
- Forms
- Navigation
- Feedback

---

# M09 — Layers Tree

Nested tree:
- Page
- Section
- Grid
- Card
- DataTable
- Buttons.

Drag/reorder.

---

# M10 — Inspector Properties

Schema-driven fields:
- label
- size
- variant
- spacing
- style tokens.

---

# M11 — Inspector Data

Controls:
- Entity
- Operation
- Fields
- Filter
- Sort
- Pagination.

---

# M12 — Binding Picker

Rich selector:
- Entity
- Fields
- Relations
- Data Contract
- Permission
- Status.

---

# M13 — Binding Error

Inline red validation:
- unknown field
- operation unsupported
- permission missing.

---

# M14 — Inspector Actions

Rows:
- Event
- Action Type
- Target
- Status.

---

# M15 — Navigate Action

Fields:
- target page
- params
- replace/history option if supported.

---

# M16 — Automation Action

Select:
- registered workflow
- event/action
- payload mapping.

No free workflow ID from other tenant.

---

# M17 — Forms List

Cards:
- Form
- Entity
- Fields
- Submit Action
- Status
- Validation.

---

# M18 — Form Builder

Left:
- BM Fields

Center:
- Form Canvas

Right:
- Field Inspector

---

# M19 — Field Mapping

Table:
- UI Component
- Business Field
- Required
- Validation
- Visibility.

---

# M20 — Navigation Builder

Tree:
- visual label
- icon
- order
- visibility

Business semantic structure shown read-only.

---

# M21 — Theme Overview

Cards:
- Colors
- Typography
- Spacing
- Radius
- Shadows
- Breakpoints.

---

# M22 — Color Tokens

Token table:
- primary
- secondary
- surface
- text
- success
- warning
- error.

Live preview.

---

# M23 — Typography

Controls:
- font family reference
- size scale
- weight
- line height.

---

# M24 — Responsive Editor

Toggle:
`Desktop | Tablet | Mobile`

Canvas width changes.

Inspector shows breakpoint overrides.

---

# M25 — Preview

Full app preview using Shared Renderer.

Top bar:
- Device
- Route
- User context mode
- Exit Preview.

---

# M26 — Validation Cockpit

Sections:
- Pages
- Routes
- Components
- Bindings
- Forms
- Actions
- Navigation
- Theme
- Responsive
- Runtime Compatibility.

---

# M27 — Validation Issues

Table:
- Severity
- Code
- Page
- Component
- Message
- Open.

---

# M28 — Revision History

Timeline:
- actor
- page
- action
- timestamp
- revision.

---

# M29 — Save Conflict

Modal:
- local revision
- server revision
- reload
- compare
- resolve.

---

# M30 — Published Snapshot View

Read-only:
- ApplicationVersion
- snapshot ID
- hash
- validation
- Pack usage.

---

# M31 — Runtime Compatibility

Matrix:
- Component
- Registry Version
- Renderer Support
- Result.

---

# M32 — Page Deep Link Error

Controlled page-not-found state:
- requested page
- “Retour aux pages”
- “Ouvrir première page”.

---

# M33 — Permission Denied

Workspace 403:
- no data leak
- return action.

---

# M34 — Mobile UI Builder

Responsive:
- page list
- component list
- inspector drawers
- preview
- limited canvas interactions.

---

# M35 — Integration Flow

Visual status flow:

```text
Business Manager
↓
UI Builder
↓
UI Validation
↓
UI Snapshot
↓
Pack Manager
↓
Pack Runtime
↓
Shared Renderer
↓
Data Runtime / Automation
```

---

# Visual Direction

Use approved Techzone Cloud style:

- premium SaaS ;
- dark navy sidebar ;
- light workspace ;
- violet/indigo UI Builder accent ;
- white cards ;
- subtle shadows ;
- modern canvas ;
- clear inspector ;
- Lucide icons ;
- clean forms ;
- responsive ;
- no fake metrics ;
- no arbitrary code editor.
