# SPEC UI — TECHZONE CLOUD UI BUILDER

---

# 1. Visual identity

Techzone Cloud UI Builder :

- sidebar bleu nuit ;
- fond très clair ;
- accent violet/indigo ;
- surfaces blanches ;
- canvas gris très clair ;
- inspector propre ;
- Lucide icons ;
- responsive ;
- densité professionnelle.

---

# 2. Navigation

```text
UI Builder
├── Vue d’ensemble
├── Pages
├── Éditeur visuel
├── Composants
├── Formulaires
├── Navigation
├── Thème
└── Aperçu & Test
```

---

# 3. Context Bar

Toujours visible :

```text
Tenant
Application
Application Version
Page
Device
Status
```

Exemple :

```text
TechBoutique / v1.2.0 / Produits / Desktop / DRAFT
```

---

# 4. Overview

Cards :
- Pages ;
- Components ;
- Forms ;
- Errors ;
- Warnings ;
- Completion.

Sections :
- recently modified ;
- incomplete pages ;
- validation ;
- last save.

CTA :
`Continuer la conception`.

---

# 5. Pages

Table/cards :

```text
Page
Route
Layout
Status
Components
Validation
Updated
Actions
```

Actions :
- Open ;
- Duplicate ;
- Rename ;
- Delete ;
- Validate.

---

# 6. Create Page

Fields :
- Name ;
- Route ;
- Type ;
- Layout ;
- Title ;
- Permission ;
- Metadata basics.

Live route validation.

---

# 7. Editor Shell

```text
┌─────────────────────────────────────────────┐
│ Context Bar                                 │
├──────────┬──────────────────────┬───────────┤
│ Left     │ Canvas               │ Inspector │
│ Panel    │                      │           │
│          │                      │           │
└──────────┴──────────────────────┴───────────┘
```

---

# 8. Left Panel

Tabs :
- Pages ;
- Components ;
- Layers/Tree.

Search field must use stable value callback.

---

# 9. Canvas

Show current page.

Controls :
- zoom ;
- device ;
- select ;
- drag/drop ;
- reorder.

No page selected + pages exist → auto select valid page.

---

# 10. Empty Canvas

If zero pages :

```text
Aucune page
Créez votre première page
[Créer une page]
```

---

# 11. Inspector

Tabs :

```text
Properties
Data
Actions
Visibility
Responsive
Advanced
```

Generated from schemas.

---

# 12. Component Library

Categories :
- Layout ;
- Content ;
- Data ;
- Forms ;
- Navigation ;
- Feedback.

Searchable.

---

# 13. Component Card

Display :
- icon ;
- name ;
- category ;
- compatibility ;
- drag handle.

---

# 14. Data Binding

Selector sequence :

```text
Entity
→ Operation
→ Fields
→ Filters
→ Sort
→ Pagination
```

Only registered contracts.

---

# 15. Binding Status

Badges :
- Valid ;
- Missing Entity ;
- Missing Field ;
- Permission issue ;
- Unsupported operation.

---

# 16. Forms Builder

List forms.

Editor :
- Business Entity ;
- mapped fields ;
- layout ;
- submit action ;
- success action ;
- validation.

---

# 17. Form Field Mapping

Table :
- UI Field ;
- BM Field ;
- Component ;
- Required ;
- Validation ;
- Visibility.

---

# 18. Actions Editor

List:
- Event ;
- Action Type ;
- Target ;
- Status.

Examples:
- onClick → NAVIGATE ;
- onSubmit → TRIGGER_AUTOMATION.

---

# 19. Navigation Editor

Tree + visual metadata.

Controls :
- order ;
- label ;
- icon ;
- visibility.

No duplication of BM functional hierarchy.

---

# 20. Theme Editor

Tabs :
- Colors ;
- Typography ;
- Spacing ;
- Radius ;
- Shadows ;
- Breakpoints.

Live preview.

---

# 21. Responsive Editor

Top toggle :

```text
Desktop | Tablet | Mobile
```

Allow supported overrides only.

---

# 22. Preview

Full-screen or side-by-side.

Uses Shared Renderer.

Mode badge :
`PREVIEW`.

---

# 23. Validation Cockpit

Sections :

```text
Pages
Routes
Components
Bindings
Forms
Actions
Navigation
Theme
Responsive
Runtime Compatibility
```

---

# 24. Validation Issue

Each issue:
- severity ;
- code ;
- page ;
- component ;
- message ;
- Open.

---

# 25. Revision History

Timeline :
- page changed ;
- component added ;
- binding changed ;
- theme changed ;
- validation ;
- snapshot.

---

# 26. Save Status

Top bar :

```text
Saving...
Saved
Save failed
Conflict
```

---

# 27. Conflict UI

If concurrent edit detected :
- current server revision ;
- local revision ;
- compare/reload/resolve.

No silent overwrite.

---

# 28. Permission States

Read-only users :
- inspect ;
- preview.

Editors :
- modify.

Validators :
- run validation.

Backend remains authority.

---

# 29. Errors

Handle :
- 401 ;
- 403 ;
- page not found ;
- app version not found ;
- tenant denied ;
- invalid component ;
- save conflict ;
- runtime preview error.

---

# 30. Responsive

Desktop :
- 3-column editor.

Tablet :
- inspector drawer.

Mobile :
- page/component management ;
- limited editor if practical ;
- full preview.

---

# 31. Accessibility

- keyboard navigation ;
- focus ;
- labels ;
- drag alternative where possible ;
- contrast ;
- not color-only.

---

# 32. UI DoD

- select/search stable ;
- editor opens valid page ;
- context visible ;
- inspector schema-driven ;
- preview parity ;
- validation deep links ;
- save status ;
- responsive ;
- permission-aware.
