# UI Builder → Pack Manager → Pack Runtime — audit ciblé

| Requirement | Existing | Missing | Decision | Evidence | Status |
|---|---|---|---|---|---|
| Canonical UI Definition | Persisted `UiPage` and `UiThemeSetting`; exporter returns schema `1.1`, pages, navigation, data sources and permissions | No published artifact reference | Keep the exporter as the sole UI contract | `UiBuilderService.getUiDefinition` | PARTIAL |
| UI validation before READY | Page, route, component, binding and action validation exists | Pack READY does not invoke UI validation | Do not infer an application version from a pack | `UiBuilderService.validate`; `PackManagerService.validate` | PARTIAL |
| Pack-to-application linkage | `Pack.metadata` is persisted | No typed `applicationVersionId` contract or tenant-scoped validation | Add an explicit link before packaging UI; no code/name matching | Prisma `Pack.metadata` | MISSING |
| Immutable UI snapshot | Pack snapshot and manifest are immutable after publication | Snapshot only contains modules/features/dependencies/rules | UI must be added to the existing `PackSnapshot.content`, not a second store | `PackManagerService.validate/publish` | MISSING |
| Manifest UI section | Manifest hashes the validated pack snapshot | No `definition.ui` member | Extend the existing manifest only after explicit linkage exists | `PackManagerService.generateManifest` | MISSING |
| Runtime loader | Loads tenant-scoped published manifests, validates hash, resolves business context/capabilities | Does not load or validate UI schema | Add fail-closed UI schema/component validation with controlled diagnostics | `PackRuntimeService.resolve` | MISSING |
| Runtime renderer | Shared declarative renderer supports preview and runtime mode | No published-runtime route/loader supplies a UI definition | Reuse the shared renderer after loader integration | `frontend/.../renderer/Renderer.jsx` | PARTIAL |
| Data Runtime integration | Query and execute endpoints are authenticated; renderer calls them | Published runtime is not wired to the resolved pack UI | Preserve preview mutation block; runtime integration awaits loader | Data Runtime controller; shared renderer | PARTIAL |
| Cache isolation | Cache key includes tenant plus resolution identity and source manifest hash | UI artifact is absent from the source manifest | Manifest hash will naturally version UI once packaged | `RuntimeCacheService`, `PackRuntimeService` | READY |
| Sidebar | Eight UI Builder destinations, permission gate and deep-link mapping exist | Browser recipe not run in this environment | Keep current canonical `/ui/*` routes | `navigationConfig.js`, sidebar tests | PARTIAL |

## Safety decision

The current Pack model has no explicit application-version relation. Packaging the
latest UI page found by name, code, or tenant would make a published Pack version
silently depend on mutable UI state. That violates snapshot immutability. The
runtime pipeline therefore remains deliberately **PARTIAL** until an explicit,
validated `applicationVersionId` link is introduced and copied into the existing
pack snapshot/manifest during validation.

The work already present is safe to publish: it improves the UI Builder workspace,
Data Runtime rendering, validation, and audit without claiming a Pack Runtime UI
publication path that does not exist.
