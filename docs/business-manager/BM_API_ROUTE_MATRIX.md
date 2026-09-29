# BM API Route Matrix (Phase 0 — Audit)

> Maps every backend API controller/route to its CDC target, frontend service, and frontend component. Identifies gaps and duplicates.

## Route Prefix Legend

| Prefix | Backend Controller File | Module | CDC Target |
|---|---|---|---|
| `/api/business-manager/*` | `platform.controller.ts` | PlatformModule | BM-CDC-00 (Platform Foundation) |
| `/api/business-manager/applications` | `applications.controller.ts` | ApplicationsModule | BM-CDC-01 |
| `/api/business-manager` (versions) | `application-versions.controller.ts` | ApplicationVersionsModule | BM-CDC-02 |
| `/api/business-manager/configurations` | `configuration.controller.ts` (`modules/platform`) | ConfigurationModule | BM-CDC-06 |
| `/api/business-manager/environments` | `envrionment.controller.ts` | EnvironmentsModule | BM-CDC-05 (env-scoped) |
| `/api/business-manager/contracts` | `contract.controller.ts` | ContractsModule | BM-CDC-07 (Contract Registry) |
| `/api/business-manager/snapshots` | `snapshot.controller.ts` | SnapshotsModule | BM-CDC-07 (Runtime Snapshot) |
| `/api/integration/*` | `integration.controller.ts` | IntegrationModule | BM-CDC-07 (Integration) |
| `/api/connectors/*` | `connector.controller.ts` | IntegrationModule | BM-CDC-07 (Adapter Registry) |
| `/api/apis/*` | `api-manager.controller.ts` | ApiManagerModule | BM-CDC-07 (API Layer) |
| `/api/webhooks/*` | `webhook.controller.ts` | WebhooksModule | BM-CDC-07 (Outbound) |
| `/api/credentials/*` | `credentials.controller.ts` | CredentialsModule | BM-CDC-07 (Credentials) |
| `/api/sync/*` | `synchronization.controller.ts` | SynchronizationModule | BM-CDC-07 (Sync) |
| `/api/diagnostics/*` | `diagnostics.controller.ts` | DiagnosticsModule | BM-CDC-07 (Diagnostics) |
| `/api/deployment/*` | `deployment.controller.ts` | DeploymentModule | BM-CDC-02 (Release/Publish) |
| `/api/releases/*` | `release.controller.ts` | DeploymentModule | BM-CDC-02 |
| `/api/deployments/*` | `deployment.controller.ts` | DeploymentModule | BM-CDC-02 |
| `/api/gates/*` | `gate.controller.ts` | DeploymentModule | BM-CDC-02 |
| `/api/rollbacks/*` | `rollback.controller.ts` | DeploymentModule | BM-CDC-02 (Rollback) |
| `/api/automation/*` | `automation.controller.ts` | AutomationModule | WF-CDC (external) |
| `/api/iam/*` | `iam-*.controller.ts` | IAMModule | IAM (foundation) |
| `/api/erp/*` | `erp-adapter.controller.ts` | ErpAdapterModule | BM-CDC-07 (ERP Adapter) |
| `/api/data-runtime/*` | `data-runtime.controller.ts` | DataRuntimeModule | BM-CDC-07 (Data Runtime) |

---

## Existing Platform API Routes (Detailed)

### BM-CDC-01 — Application Manager

| Method | Route | Controller | Service Method | Frontend Service | Frontend Component | Test |
|---|---|---|---|---|---|---|
| GET | `/api/business-manager/applications` | `applications.controller.ts:26` | `findAll()` | `platformApplicationsService.getApplications()` | `ApplicationsView`, `ApplicationsCatalogView` | None |
| POST | `/api/business-manager/applications` | `applications.controller.ts:31` | `create(dto)` | `platformApplicationsService.createApplication()` | `CreateAppModal` | None |
| GET | `/api/business-manager/applications/:id` | `applications.controller.ts:39` | `findOne(id)` | `platformApplicationsService.getApplication()` (indirect) | `WorkspaceConfigView` | None |
| PATCH | `/api/business-manager/applications/:id` | `applications.controller.ts:47` | `update(id, dto)` | `platformApplicationsService.updateApplication()` | `ApplicationsCatalogView` | None |
| POST | `/api/business-manager/applications/:id/archive` | `applications.controller.ts:56` | `archive(id)` | (none) | `ApplicationsCatalogView` | None |

### BM-CDC-02 — Version Lifecycle Manager

| Method | Route | Controller | Service Method | Frontend Service | Frontend Component | Test |
|---|---|---|---|---|---|---|
| GET | `/api/business-manager/applications/:id/versions` | `application-versions.controller.ts:26` | `findByApplication(appId)` | (none dedicated) | `VersionsDetailView` | None |
| GET | `/api/business-manager/versions` | `application-versions.controller.ts:34` | `findAll()` | (none) | `VersionsDetailView` | None |
| POST | `/api/business-manager/applications/:id/versions` | `application-versions.controller.ts:39` | `create(appId, dto)` | (none) | `WorkspaceConfigView` | None |
| GET | `/api/business-manager/versions/:id` | `application-versions.controller.ts:48` | `findOne(id)` | (none) | `VersionsDetailView` | None |
| PATCH | `/api/business-manager/versions/:id` | `application-versions.controller.ts:56` | `update(id, dto)` | (none) | `VersionsDetailView` | None |
| POST | `/api/business-manager/versions/:id/clone` | `application-versions.controller.ts:65` | `clone(id)` | (none) | `VersionsDetailView` | None |
| POST | `/api/business-manager/versions/:id/status/:status` | `application-versions.controller.ts:73` | `changeStatus(id, status)` | (none) | `VersionsDetailView` | None |
| GET, POST | `/api/business-manager/dashboard` | `platform.controller.ts:9` | `getDashboard()` | Redux `platformSlice` | `CockpitView`, `GeneralOverviewView` | None |
| GET | `/api/business-manager/activity` | `platform.controller.ts:14` | `getActivity()` | Redux `platformSlice` | `CockpitView` | None |

### BM-CDC-06 — Configuration Manager

| Method | Route | Controller | Service Method | Frontend Service | Frontend Component | Test |
|---|---|---|---|---|---|---|
| GET | `/api/business-manager/configurations` | `configuration.controller.ts:21` | `findAll()` | `platformConfigService.getConfigs()` | `ConfigurationView` | None |
| POST | `/api/business-manager/configurations` | `configuration.controller.ts:56` | `create(dto)` | `platformConfigService.createConfig()` | `ConfigurationView` | None |
| GET | `/api/business-manager/configurations/effective/:appId/:verId/:envId` | `configuration.controller.ts:26` | `resolveEffectiveConfigurations(...)` | `platformConfigService.getEffective()` | `WorkspaceConfigView` | None |
| GET | `/api/business-manager/configurations/:id/history` | `configuration.controller.ts:41` | `getHistory(id)` | (none) | `ConfigurationView` | None |
| GET | `/api/business-manager/configurations/:scope/:scopeId` | `configuration.controller.ts:47` | `findByScope(scope, scopeId)` | (none) | `ConfigurationView` | None |
| PATCH | `/api/business-manager/configurations/:id` | `configuration.controller.ts:62` | `update(id, dto)` | (none) | `ConfigurationView` | None |
| POST | `/api/business-manager/configurations/:id/activate` | `configuration.controller.ts:71` | `activate(id)` | (none) | `ConfigurationView` | None |
| POST | `/api/business-manager/configurations/:id/validate` | `configuration.controller.ts:77` | `validate(id)` | (none) | `ConfigurationView` | None |
| GET | `/api/business-manager/configurations/:id/secret-safe` | `platform/configuration/controller.ts:101` (BROKEN DUPLICATE) | `getSecretSafe(id, principal)` | (none) | (none) | None |

### BM-CDC-07 — Contracts & Snapshots

**Contracts:**

| Method | Route | Controller | Service Method | Frontend Service | Frontend Component | Test |
|---|---|---|---|---|---|---|
| POST | `/api/business-manager/contracts` | `contract.controller.ts:24` | `create(dto)` | (none dedicated) | `ContractsView` | None |
| GET | `/api/business-manager/contracts` | `contract.controller.ts:32` | `findAll()` | (none) | `ContractsView` | None |
| GET | `/api/business-manager/contracts/:id` | `contract.controller.ts:37` | `findOne(id)` | (none) | `ContractsView` | None |
| POST | `/api/business-manager/contracts/:id/validate` | `contract.controller.ts:45` | `validate(id)` | (none) | `ContractsView` | None |
| POST | `/api/business-manager/contracts/:id/lock` | `contract.controller.ts:53` | `lock(id)` | (none) | `ContractsView` | None |
| GET | `/api/business-manager/contracts/:id/history` | `contract.controller.ts:61` | `getHistory(id)` | (none) | `ContractsView` | None |
| GET | `/api/business-manager/contracts/:id/compatibility` | `contract.controller.ts:69` | `getCompatibility(id)` | (none) | `ContractsView` | None |

**Snapshots:**

| Method | Route | Controller | Service Method | Frontend Service | Frontend Component | Test |
|---|---|---|---|---|---|---|
| POST | `/api/business-manager/snapshots` | `snapshot.controller.ts:26` | `create(dto, traceId)` | (none) | `CreateSnapshotModal` | None |
| GET | `/api/business-manager/snapshots` | `snapshot.controller.ts:35` | `findAll()` | (none) | `SnapshotsView` | None |
| GET | `/api/business-manager/snapshots/compare?left=X&right=Y` | `snapshot.controller.ts:40` | `compare(left, right)` | (none) | `SnapshotsView` | None |
| GET | `/api/business-manager/snapshots/:id/history` | `snapshot.controller.ts:49` | `getHistory(id)` | (none) | `SnapshotsView` | None |
| GET | `/api/business-manager/snapshots/:id` | `snapshot.controller.ts:57` | `findOne(id)` | (none) | `SnapshotsView` | None |
| POST | `/api/business-manager/snapshots/:id/validate` | `snapshot.controller.ts:65` | `validate(id, traceId)` | (none) | `SnapshotsView` | None |
| POST | `/api/business-manager/snapshots/:id/activate` | `snapshot.controller.ts:74` | `activate(id, traceId)` | (none) | `SnapshotsView` | None |
| POST | `/api/business-manager/snapshots/:id/archive` | `snapshot.controller.ts:83` | `archive(id, traceId)` | (none) | `SnapshotsView` | None |

### BM-CDC-07 — Integration (connectors, APIs, webhooks, credentials, sync, diagnostics)

| Method | Route | Controller | Service | Frontend Component | CDC Requirement |
|---|---|---|---|---|---|
| GET,POST,PATCH,DELETE | `/api/connectors/*` | `connector.controller.ts` | `connector.service.ts` | `ConnectorManagerView` | Adapter Registry |
| GET,POST | `/api/apis/*` | `api-manager.controller.ts` | `api-manager.service.ts` | `ApiManagerView`, `ApiSpecificationsView` | API Layer |
| GET,POST | `/api/webhooks/*` | `webhook.controller.ts` | `webhook.service.ts` | `WebhookManagerView` | Webhooks |
| GET,POST | `/api/credentials/*` | `credentials.controller.ts` | `credentials.service.ts` | `CredentialsManagerView` | Credential References |
| GET,POST | `/api/sync/*` | `synchronization.controller.ts` | `synchronization.service.ts` | `SyncManagerView` | Synchronization |
| GET,POST | `/api/diagnostics/*` | `diagnostics.controller.ts` | `diagnostics.service.ts` | `IntegrationDiagnosticsView` | Diagnostics |

### BM-CDC-08 — MISSING (Quality/Validation)

All BM-CDC-08 endpoints are **MISSING**. No quality controller, service, or model exists in the backend. The only frontend artifact is `PackValidationCockpitView.jsx` (renders with mock/static data).

---

## Missing API Endpoints (Required by CDCs, Not Yet Implemented)

### BM-CDC-03 — Data Model Manager

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/business/data-models` | List all data models |
| POST | `/api/business/data-models` | Create data model |
| GET | `/api/business/data-models/:id` | Get data model detail |
| PATCH | `/api/business/data-models/:id` | Update data model |
| POST | `/api/business/data-models/:id/diff` | Schema diff vs previous |
| GET | `/api/business/data-models/:id/migration-plan` | Migration plan for data loss risk |

### BM-CDC-04 — Feature & Capability Manager

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/business/features` | List features |
| POST | `/api/business/features` | Create feature (uses existing `Feature` model) |
| GET | `/api/business/features/:code` | Get feature |
| PATCH | `/api/business/features/:code` | Update feature |
| GET | `/api/business/capabilities` | List capabilities |
| POST | `/api/business/capabilities` | Create capability |

### BM-CDC-05 — Menu Engine & Navigation Manager

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/business/navigation` | Get navigation tree |
| POST | `/api/business/navigation` | Create/update navigation |
| GET | `/api/business/navigation/:versionId` | Get version-scoped navigation |
| POST | `/api/business/navigation/:versionId/validate` | Validate routes |

### BM-CDC-07 — Runtime Bridge (Missing Core)

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/business/contracts/contributors` | Register a contract contributor (namespace) |
| GET | `/api/business/contracts/contributors` | List all contributors |
| POST | `/api/business/contracts/:id/register-provider` | Register provider on contract |
| POST | `/api/business/contracts/:id/register-consumer` | Register consumer on contract |
| GET | `/api/business-manager/versions/:versionId/runtime-manifest` | Generate RuntimeManifest (aggregates all contracts) |
| POST | `/api/business-manager/versions/:versionId/runtime-readiness` | Check readiness for publication |
| POST | `/api/business-manager/snapshots/:id/hash` | Generate deterministic hash |
| GET | `/api/business-manager/snapshots/:id/verify-hash` | Verify snapshot immutability |
| POST | `/api/business/integrations/bindings` | Create integration binding (version→adapter+mappingProfile) |
| GET | `/api/business/integrations/bindings` | List bindings |
| POST | `/api/business/integrations/bindings/:id/validate` | Validate a binding |
| POST | `/api/business/integrations/bindings/:id/test-connection` | Test adapter connection |
| POST | `/api/business/adapters/registry/:key/test` | Test adapter connectivity |
| GET | `/api/business/contracts/:id/compatibility/check` | Full compatibility check vs consumers |

### BM-CDC-08 — Quality Engine (All Missing)

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/business/quality/validators` | Register a quality validator |
| GET | `/api/business/quality/validators` | List validators |
| POST | `/api/business/quality/campaigns` | Create a validation campaign |
| GET | `/api/business/quality/campaigns` | List campaigns |
| GET | `/api/business/quality/campaigns/:id` | Campaign detail |
| POST | `/api/business/quality/campaigns/:id/run` | Run validation campaign |
| GET | `/api/business/quality/campaigns/:id/issues` | List issues from campaign |
| GET | `/api/business/quality/campaigns/:id/gate` | Get gate decision |
| POST | `/api/business/quality/waivers` | Request a waiver |
| GET | `/api/business/quality/waivers` | List waivers |
| POST | `/api/business/quality/approvals` | Submit approval |
| GET | `/api/business/quality/reports/:id` | Get quality report |
| GET | `/api/business/quality/metrics` | Get quality metrics |

---

## Frontend Service Layer Gaps

| Service File | Exists | API Calls | Uses Mock | Notes |
|---|---|---|---|---|
| `platformApplicationsService.js` | Yes | `/platform/applications/*` | No | Real API calls. |
| `platformConfigService.js` | Yes | `/platform/config/*` | No | Real API calls. |
| `platformEnvironmentsService.js` | Yes | `/platform/envs/*` | No | Real API calls. |
| Contracts service | No | — | — | No dedicated service; `ContractsView` calls `api` directly or via store. |
| Snapshots service | No | — | — | No dedicated service; `SnapshotsView` calls `api` directly. |
| Versions service | No | — | — | No dedicated service; `VersionsDetailView` calls `api` directly. |
| Data Models service | No | — | — | MISSING entirely. |
| Features service | No | — | — | MISSING entirely. |
| Navigation service | No | — | — | MISSING (frontend-only config exists). |
| Runtime Manifest service | No | — | — | MISSING entirely. |
| Quality/Validation service | No | — | — | MISSING entirely. |
| Integration Bindings service | No | — | — | MISSING entirely. |
| Adapter Test Connection service | No | — | — | MISSING entirely. |

---

## Duplicate / Conflicting Routes

| Conflict | Details |
|---|---|
| `ConfigurationController` x2 | `src/modules/platform/configuration/configuration.controller.ts` (registered, functional, no permission guards) vs `src/platform/configuration/configuration.controller.ts` (unregistered, references non-existent `./configuration.service`, has `@RequirePermission` + `@CurrentPrincipal` + secret-safe endpoint). The second is BROKEN and DUPLICATE. |
| Applications controller file name | File is `applications..module.ts` (double dot) — typo in filename but module still imports correctly. |
| Environment controller typo | File is `envrionment.controller.ts` (misspelled "envrionment" instead of "environment"). |

---

## Route vs Navigation Config Alignment

The `navigationConfig.js` `pageDefinitions` array maps each route to a component. Pages with `component: null` or `DemoPage` have no real implementation:

| Route | Component | Classification | CDC |
|---|---|---|---|
| `/business` | null | PLACEHOLDER / MISSING_PAGE | BM-CDC-05 |
| `/business/models` | null | PLACEHOLDER / MISSING_PAGE | BM-CDC-03 |
| `/business/features` | null | PLACEHOLDER / MISSING_PAGE | BM-CDC-04 |
| `/business/navigation` | null | PLACEHOLDER / MISSING_PAGE | BM-CDC-05 |
| `/business/validation` | `ValidationRoute` (PackValidationCockpitView) | PLACEHOLDER (backend missing) | BM-CDC-08 |
| `/packs/runtime` | null | PLACEHOLDER / MISSING_PAGE | BM-CDC-07 (Runtime) |
| `/packs/manager` | null | PLACEHOLDER / MISSING_PAGE | BM-CDC-07 |
| `/packs/dependencies` | null | PLACEHOLDER / MISSING_PAGE | BM-CDC-07 |
| `/ui/builder/:pageId` | null | PLACEHOLDER / MISSING_PAGE | UI Builder (out of scope for BM) |
| `/billing/*` | `DemoPage` | PLACEHOLDER (mock) | Billing (Commercial) |
| `/iam/organizations` | `DemoPage` | PLACEHOLDER | IAM |
| `/billing` | `DemoPage` | PLACEHOLDER | Billing |
| `/admin` | `DemoPage` | PLACEHOLDER | IAM |
| `/demo/*` | `DemoPage` | PLACEHOLDER | Development |

---

## Test Coverage Gap Summary

### Backend (`.spec.ts` files exist for):
- ✅ Automation engine (rules, conditions, triggers, workflows, actions)
- ✅ Deployment (cockpit, deployments, environment-deployments, gates, releases, rollbacks)
- ✅ Integration (API manager, credentials, diagnostics, synchronizations, webhook signatures)
- ✅ IAM (auth, JWT guard, permission guard, client)
- ✅ Data runtime (query engine, execution engine, validation, erp-adapter provider)
- ✅ Lifecycle utilities (integration lifecycle)
- ✅ ERP adapter (Dolibarr adapter, mock adapter)

### Backend NO tests for:
- ❌ `applications` module (no spec file)
- ❌ `application-versions` module (no spec file)
- ❌ `configuration` module (no spec file)
- ❌ `contracts` module (no spec file)
- ❌ `environments` module (no spec file)
- ❌ `snapshots` module (no spec file)
- ❌ `platform` module (no spec file)

### Frontend:
- ❌ Zero test files in `frontend/src/`
- ❌ No test runner configured in `package.json`
- ❌ `lint` script is just `tsc --noEmit` (type check only)

---

## Next Phase Recommendations

1. **Phase 1 (Week 1-2):** Fix tenant isolation — add `tenantId` to platform models, enforce in `TenantGuard` + services. Remove broken duplicate configuration controller.
2. **Phase 2 (Week 2-3):** BM-CDC-01/02 harden — tenant-scoped queries, publication flow integration points.
3. **Phase 3 (Week 3-5):** BM-CDC-03 — Data Model entity + CRUD + diff/migration-plan.
4. **Phase 4 (Week 4-6):** BM-CDC-04 — Feature entity CRUD + Capability model.
5. **Phase 5 (Week 5-7):** BM-CDC-05 — Navigation contract generation, route validation.
6. **Phase 6 (Week 6-9):** BM-CDC-07 core — Runtime Manifest/Resolver/Readiness/Snapshot, Integration Binding, Adapter Registry, SSRF, Cache.
7. **Phase 7 (Week 8-10):** BM-CDC-08 — Quality engine (validators, campaigns, gate, waivers, approvals, reports).
8. **Phase 8 (Week 9-11):** UI/UX — Build missing frontend pages, wire real services.
9. **Phase 9 (Week 10-12):** Tests — Backend specs for all platform modules + frontend test infrastructure.


## Vérification runtime Phase 1.5

**Mise à jour P0.5 :** le tenant de recette existe maintenant et la sélection de session est validée. Le blocage courant est `BLOCKED_DATABASE` : `applications.tenantId` et `configurations.tenantId` sont absents du schéma local. Le texte ci-dessous décrit le constat historique avant provisioning. Voir `docs/audit/P0_5_RUNTIME_WINDOWS_REPORT.md`.

Le service frontend platformConfigService.getConfigs appelle GET /api/business-manager/configurations. ConfigurationController, importé par ConfigurationModule puis PlatformModule/AppModule, expose ce même chemin. Il appelle ConfigurationService.findAll(principal.tenantId), puis Prisma configuration.findMany avec filtre tenant. Aucun endpoint de convenance ajouté. La requête authentifiée sans tenant retourne 403 (guard), et non 404. La réussite métier reste BLOCKED_AUTH tant que le compte de recette ne possède pas de membership actif.

## Recette du 29 septembre 2026

Les contrats BM par version utilisent désormais GET/POST `/api/business-manager/contracts/versions/:versionId` pour éviter la collision avec les contrats plateforme `GET /contracts/:id`. Capabilities : PATCH `/features/capabilities/:capabilityId`, POST `/features/capabilities/:capabilityId/archive`. Les routes BM principales sont reliées à BMWorkspaceRoute et aux API existantes. Voir [recette réelle](BM_RUNTIME_ACCEPTANCE_REPORT.md).
