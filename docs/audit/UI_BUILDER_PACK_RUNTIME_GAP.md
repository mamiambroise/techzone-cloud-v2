# UI Builder → Pack Manager → Pack Runtime — audit ciblé

| Requirement | Existing | Missing | Decision | Evidence | Status |
|---|---|---|---|---|---|
| Canonical UI Definition | Persisted `UiPage` and `UiThemeSetting`; exporter returns schema `1.1`, pages, navigation, data sources and permissions | No published artifact reference | Keep the exporter as the sole UI contract | `UiBuilderService.getUiDefinition` | PARTIAL |
| UI validation before READY | Page, route, component, binding and action validation exists | Pack READY does not invoke UI validation | Do not infer an application version from a pack | `UiBuilderService.validate`; `PackManagerService.validate` | PARTIAL |
| Pack-to-application linkage | Nullable `PackVersion.applicationVersionId` is tenant-validated for new versions | Historical versions remain unlinked by design | No code/name matching; legacy source fails closed | Prisma relation; `createVersion` | DONE |
| Immutable UI snapshot | Pack validation embeds the canonical UI definition in existing `PackSnapshot.content` | Browser runtime route still pending | Published Pack reads the snapshot, never mutable UI rows | `definitionWithUi` | DONE |
| Manifest UI section | Existing manifest hashes the validated snapshot, including `definition.ui` | No separate UI artifact endpoint | Keep one manifest format and one integrity hash | `generateManifest` | DONE |
| Runtime loader | Resolves `definition.ui` from the published manifest and rejects absent/schema-invalid/unknown components | Browser runtime route still pending | Fail closed with controlled diagnostic codes | `PackRuntimeService.resolve` | DONE |
| Runtime renderer | Shared declarative renderer supports preview and runtime mode | No published-runtime route/loader supplies a UI definition | Reuse the shared renderer after loader integration | `frontend/.../renderer/Renderer.jsx` | PARTIAL |
| Data Runtime integration | Query and execute endpoints are authenticated; renderer calls them | Published runtime is not wired to the resolved pack UI | Preserve preview mutation block; runtime integration awaits loader | Data Runtime controller; shared renderer | PARTIAL |
| Cache isolation | Cache key includes tenant plus resolution identity and source manifest hash | UI artifact is absent from the source manifest | Manifest hash will naturally version UI once packaged | `RuntimeCacheService`, `PackRuntimeService` | READY |
| Sidebar | Eight UI Builder destinations, permission gate and deep-link mapping exist | Browser recipe not run in this environment | Keep current canonical `/ui/*` routes | `navigationConfig.js`, sidebar tests | PARTIAL |

## Safety decision

Pack versions created before the additive relation remain deliberately unlinked.
They cannot be silently mapped to a current ApplicationVersion. A new PackVersion
must pass a tenant-validated `applicationVersionId`; its canonical UI Definition is
embedded in the existing pack snapshot during validation and therefore stays stable
after publication.

The work already present is safe to publish: it improves the UI Builder workspace,
Data Runtime rendering, validation, and audit without claiming a Pack Runtime UI
publication path that does not exist.
