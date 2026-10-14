# TECH — TECHZONE CLOUD UI BUILDER

**Stack :** React/Vite + NestJS + Prisma/PostgreSQL

---

# 1. Existing components to preserve

Audit confirms :
- `/api/ui-builder/*` ;
- store ;
- pages ;
- theme ;
- validation ;
- renderer ;
- UI Definition ;
- Pack/Runtime consumption.

Do not rebuild.

---

# 2. Known files

Inspect:

```text
frontend/src/components/business-manager/bm/ui.jsx
frontend/src/features/ui-builder/components/UiPagesManager.jsx
frontend/src/features/ui-builder/components/UiFormsBuilder.jsx
frontend/src/features/ui-builder/components/UiVisualEditor.jsx
frontend/src/features/ui-builder/components/UiBuilderLayout.jsx
frontend/src/features/ui-builder/store/uiBuilderSlice.js
backend/src/modules/ui-builder/
backend/prisma/schema.prisma
```

---

# 3. Worktree Safety

Local uncommitted changes exist around:

```text
UiBuilderLayout.jsx
UiVisualEditor.jsx
```

Review and preserve.

No blind reset.

---

# 4. Callback Standard

Recommended abstraction contract:

```tsx
<BmSelect onChange={(value) => ...} />
<BmSearchInput onChange={(value) => ...} />
```

Consumers must not use:

```ts
event.target.value
```

unless underlying component contract explicitly emits DOM event.

---

# 5. Migration of callbacks

Search all usages:

```text
BmSelect
BmSearchInput
onChange
event.target.value
```

Update atomically with tests.

---

# 6. Editor Route Resolver

Concept:

```ts
resolveEditorPage({
  routePageId,
  pages,
  selectedPageId
})
```

Priority:

```text
valid route page
→ valid selected state
→ first page
→ null empty state
```

---

# 7. URL synchronization

When selecting page:
- update route if design uses pageId ;
- browser reload returns same page ;
- deleted page falls back cleanly.

---

# 8. UI Definition State

Store normalized state:

```text
definition
pages
selectedPageId
components
theme
validation
saveState
```

Avoid duplicated page truth.

---

# 9. Tenant/AppVersion

Backend lookup must verify:

```text
principal.tenantId
+
applicationVersionId
```

Each UI resource must belong to that context.

---

# 10. API DTO

Protected fields not client-controlled:

```text
tenantId
createdBy
updatedBy
validationStatus privileged transition
snapshot hash
```

---

# 11. Page Model

Ensure:
- tenant/appVersion relation ;
- route uniqueness ;
- indexes ;
- deterministic order.

---

# 12. Component Registry

Registry is whitelist.

Renderer should resolve:

```text
component.type
→ registry definition
→ runtime component
```

Unknown → controlled error/placeholder in editor, block snapshot if required.

---

# 13. Properties Schema

Use schema-based inspector.

Do not allow arbitrary prop injection into DOM/runtime component.

---

# 14. Binding Schema

Typed structure.

Validate BM refs via Business Manager contracts.

---

# 15. Data Runtime

UI Definition references:
- entity ;
- operation ;
- fields.

Runtime uses Data Runtime API.

UI Builder does not store SQL.

---

# 16. Automation

Action stores workflow/action reference.

Validate existence/compatibility.

---

# 17. CALL_API

If retained:
- use registered API contract ;
- no arbitrary URL ;
- no custom secret headers from UI definition.

---

# 18. Navigation

Distinguish:
- BM navigation semantics ;
- UI presentation metadata.

---

# 19. Theme

Persist tokens, not arbitrary executable styles.

Allow safe CSS-like values only through schema.

---

# 20. Responsive

Store per breakpoint declarative overrides.

Shared Renderer interprets same structure.

---

# 21. Shared Renderer

Single rendering contract for:
- editor preview ;
- preview page ;
- Pack Runtime.

Environment-specific adapters allowed, semantics should remain same.

---

# 22. Validation Engine

Validators:

```text
validatePages
validateRoutes
validateComponents
validateBindings
validateForms
validateActions
validateNavigation
validateTheme
validateResponsive
validateRuntimeCompatibility
validateApplicationVersion
```

---

# 23. Snapshot

Canonical serialize validated definition.

Pack Manager receives immutable snapshot reference.

---

# 24. Revision / Save

If autosave:
- debounce ;
- optimistic revision ;
- 409 conflict ;
- user-visible recovery.

---

# 25. Error Contract

Examples:

```text
UI_DEFINITION_NOT_FOUND
UI_PAGE_NOT_FOUND
UI_ROUTE_DUPLICATE
UI_COMPONENT_UNKNOWN
UI_BINDING_INVALID
UI_ACTION_INVALID
UI_TENANT_DENIED
UI_APPLICATION_VERSION_MISMATCH
UI_SAVE_CONFLICT
UI_VALIDATION_FAILED
```

---

# 26. Frontend Tests

Add:
- `BmSelect` emits value ;
- consumer handles value ;
- `BmSearchInput` emits string ;
- page search works ;
- editor root picks first page ;
- valid deep link ;
- invalid deep link ;
- no pages empty state.

---

# 27. Backend Tests

Add:
- tenant scope ;
- AppVersion scope ;
- route uniqueness ;
- invalid registry ref ;
- snapshot validation.

---

# 28. Security Tests

Cross-tenant resources, forged IDs, arbitrary prop/action payloads.

---

# 29. Runtime Contract Test

Given same snapshot:

```text
Preview Render Tree
≈
Runtime Render Tree
```

within expected runtime differences.

---

# 30. Commit Plan

```text
fix(ui-builder): standardize shared control value callbacks
fix(ui-builder): resolve default editor page and deep links
fix(ui-builder): enforce tenant and application version scope
fix(ui-builder): validate data and automation bindings
feat(ui-builder): strengthen ui definition validation
test(ui-builder): cover select search and editor routing
test(ui-builder): add snapshot runtime compatibility coverage
```

---

# 31. Technical DoD

- callback contract uniform ;
- editor route stable ;
- worktree preserved ;
- tenant/AppVersion enforced ;
- registry schema validated ;
- renderer parity ;
- tests green ;
- build green.
