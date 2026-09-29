# BM-CDC Feature Checklist (Phase 0 — Audit)

> Granular mapping of each CDC section to its concrete implementation status in the codebase.
> Each row references the exact CDC section number, the current code, and the status.
> Status legend: REAL | PARTIAL | MISSING | BROKEN | DUPLICATE | PLACEHOLDER | LEGACY_UNUSED

---

## BM-CDC-01 — Application Manager

| # | CDC Section | Requirement | Code Location | Status | Notes |
|---|---|---|---|---|---|
| 1 | §23 Application entity | Unique code, name, description | `schema.prisma:65-85` `Application` model | REAL | `code` unique, `name`, `description?` |
| 2 | §24 Application status | ACTIVE/ARCHIVED/DISABLED | `schema.prisma:16-20` | REAL | 3 statuses match CDC |
| 3 | §25 Tenant scope | Application belongs to a tenant | `schema.prisma:71` `tenantScope` | BROKEN | Should be `tenantId` UUID, not free-text `tenantScope` |
| 4 | §26 Create application | POST application | `applications.controller.ts:24-27` | REAL | `create(dto)` with duplicate check |
| 5 | §27 Update application | PATCH application | `applications.controller.ts:34-40` | REAL | `update(id, dto)` |
| 6 | §28 Archive application | Prevent modification when archived | `applications.service.ts:89-95` | REAL | Checks ARCHIVED status |
| 7 | §30 Application versions | One-to-many | `schema.prisma:73` `versions` relation | REAL | Relation exists |
| 8 | §50 IAM context | tenantId from JWT | `iam-jwt.guard.ts:69-81` | PARTIAL | Principal has `tenantId`, but platform services don't use it |
| 9 | §56 Permissions | `application.create/read/write` | `iam.constants.ts:18-28` | MISSING | No BM-specific permissions defined |
| 10 | §70 Publication flow | Version → contracts → snapshot | — | MISSING | No endpoint to trigger this |

---

## BM-CDC-02 — Version Lifecycle Manager

| # | CDF Section | Requirement | Code Location | Status | Notes |
|---|---|---|---|---|---|
| 1 | §17 Version entity | version, status | `schema.prisma:89-109` | REAL | `version` string, `status` enum |
| 2 | §18 Version status enum | DRAFT/CONFIGURING/VALIDATING/READY/ACTIVE/SUPERSEDED/DEPRECATED/ARCHIVED | `version-lifecycle.util.ts:1-9` | REAL | Full lifecycle enum |
| 3 | §19 Lifecycle transitions | State machine | `version-lifecycle.util.ts:11-23` | REAL | Transition map defined |
| 4 | §29 canTransitionVersion | Guard transitions | `version-lifecycle.util.ts:25-30` | REAL | Used in `changeStatus()` |
| 5 | §47 Clone version | Increment semver | `application-versions.service.ts:162-227` | REAL | `clone()` with collision avoidance |
| 6 | §57 CreatedFrom | Parent version link | `schema.prisma:95` | REAL | `createdFrom` UUID |
| 7 | §62 publishedAt | Timestamp on ACTIVE | `schema.prisma:102` | REAL | Set in `changeStatus()` |
| 8 | §100 Quality gate before publish | BM-CDC-08 gate result | — | MISSING | No gate check before status=ACTIVE |
| 9 | §101 Runtime readiness before publish | BM-CDC-07 readiness | — | MISSING | No readiness check |
| 10 | §102 Publication strict example | Min score 90, required validators | — | MISSING | No quality profile enforcement |
| 11 | §120 Tenant/application isolation | Scope by tenant+app | `application-versions.service.ts:15-26` | BROKEN | Queries have no tenantId WHERE clause |
| 12 | §121 Optimistic locking | Prevent concurrent writes | — | MISSING | No version column on ApplicationVersion |

---

## BM-CDC-03 — Data Model Manager

| # | CDC Section | Requirement | Code Location | Status | Notes |
|---|---|---|---|---|---|
| 1 | §3 DataModel entity | Entities + fields | — | MISSING | No DataModel model in schema |
| 2 | §5 Data model versioning | Revision per version | — | MISSING | No revision tracking |
| 3 | §8 Schema validation | Validate entity definitions | — | MISSING | No validator |
| 4 | §20 Schema diff | Compare two data model versions | — | MISSING | No diff endpoint |
| 5 | §21 Migration plan | Generate data migration plan | — | MISSING | No plan generation |
| 6 | §22 Data loss risk | Flag breaking changes | — | MISSING | `DATA_LOSS_RISK` not implemented |
| 7 | §91 Baseline | Compare against baseline | — | MISSING | No baseline concept |
| 8 | §137 Migration Readiness | Consume BM-CDC-03 diff for BM-CDC-08 | — | MISSING | Not started |
| 9 | Frontend /business/models | Data model UI | `navigationConfig.js:81` | PLACEHOLDER | `component: null` |
| 10 | §80 Data Model contract | Generate contract for runtime | — | MISSING | No model → contract pipeline |

---

## BM-CDC-04 — Feature & Capability Manager

| # | CDC Section | Requirement | Code Location | Status | Notes |
|---|---|---|---|---|---|
| 1 | §10 Feature entity | code, name, description, enabled | `schema.prisma:2544-2557` | REAL | `Feature` model exists but no CRUD |
| 2 | §11 Capability entity | code, name, description | — | MISSING | No Capability model |
| 3 | §20 Feature/Capability contract | Generate contract for runtime | — | MISSING | No contract generation |
| 4 | §30 Feature status | ACTIVE/INACTIVE | `schema.prisma:2548` | REAL | `status: String` default "ACTIVE" |
| 5 | §40 Metered features | Quota-linked features | `schema.prisma:2549` | REAL | `metered Boolean`, `quotaCode` |
| 6 | §45 Tenant isolation | Per-tenant features | — | MISSING | No tenantId on Feature model |
| 7 | Frontend /business/features | Feature management UI | `navigationConfig.js:82` | PLACEHOLDER | `component: null` |
| 8 | §100 Subscription features | Link features to plans | `subscriptionSlice.js` | MOCK | Uses mock service, not real Feature model |

---

## BM-CDC-05 — Menu Engine & Navigation Manager

| # | CDC Section | Requirement | Code Location | Status | Notes |
|---|---|---|---|---|---|
| 1 | §15 Navigation structure | Sections, groups, entries | `navigationConfig.js:4-72` | REAL | 4 sections, 11 groups |
| 2 | §16 Route definitions | Path per page | `routes.js:1-150` | REAL | All canonical routes |
| 3 | §18 Page definitions | Component, permission, status | `navigationConfig.js:74-179` | REAL | 92+ page definitions |
| 4 | §20 Navigation classification | REAL/PARTIAL/PLACEHOLDER/MISSING | `navigationConfig.js` | REAL | `classification` field on every page |
| 5 | §25 Legacy redirects | Old → new route mapping | `navigationConfig.js:181-271` | REAL | 28 redirects |
| 6 | §30 Route resolution | Match path to page | `navigationConfig.js:273-278` | REAL | `resolveRoute()`, `activeNavigation()` |
| 7 | §33 Navigation contract | Persist navigation per version | — | MISSING | No backend navigation model |
| 8 | §34 Navigation validation | Detect invalid routes | — | MISSING | No route validator for quality gate |
| 9 | §35 Breaking change detection | route removed, capability removed | — | MISSING | No diff/validation service |
| 10 | §40 Sidebar rendering | Render navigation tree | `Sidebar.jsx` | REAL | Filters by group, renders entries |
| 11 | §41 Active navigation | Highlight current route | `navigationConfig.js:276` | REAL | `activeNavigation()` |
| 12 | §42 Group destination | First implemented route per group | `navigationConfig.js:278` | REAL | `groupDestination()` |
| 13 | §45 Sub-navigation | Tab-based sub-routes | `RouteToTabSync.jsx` | REAL | Syncs URL to tab state |
| 14 | Frontend /business/navigation | Navigation builder UI | `navigationConfig.js:83` | PLACEHOLDER | `component: null` |

---

## BM-CDC-06 — Configuration & Metadata Manager

| # | CDC Section | Requirement | Code Location | Status | Notes |
|---|---|---|---|---|---|
| 1 | §5 Configuration scope | PLATFORM/APPLICATION/APPLICATION_VERSION/ENVIRONMENT/TENANT | `schema.prisma:270-276` | REAL | Enum defined |
| 2 | §6 Configuration type | STRING/NUMBER/BOOLEAN/ENUM/JSON/URL/DURATION | `schema.prisma:278-286` | REAL | Enum defined |
| 3 | §7 Config status | DRAFT/VALIDATING/READY/ACTIVE/DEPRECATED/ARCHIVED | `schema.prisma:288-295` | REAL | Enum defined |
| 4 | §10 Config key | Unique key per scope | `schema.prisma:298-299` | REAL | `key` + `scope` + `scopeId` unique |
| 5 | §20 Resolve effective config | Priority merge | `configuration.service.ts:143-199` | REAL | Priority merge: PLATFORM < APP < VERSION < ENV < TENANT |
| 6 | §25 Validate config | Type + schema validation | `configuration.service.ts:201-249` | PARTIAL | Validates type but not full schema |
| 7 | §26 Activate config | Status → ACTIVE | `configuration.controller.ts:71-74` | REAL | `activate()` method |
| 8 | §28 Config history | Audit trail | `schema.prisma:335-355` | REAL | `ConfigurationHistory` with actions |
| 9 | §30 Secret-safe read | Masked secret value | `platform/configuration/controller.ts:101` | BROKEN | Duplicate controller references missing service |
| 10 | §50 Tenant isolation | Scope configs by tenant | `configuration.service.ts:150-175` | BROKEN | No tenantId in query (no TENANT scopeId resolved from principal) |
| 11 | §60 Metadata entity | Non-secret configuration metadata | — | MISSING | No dedicated metadata model |
| 12 | §90 Configuration breaking change | Required key removed, type changed | — | MISSING | No breaking change detection in BM-CDC-08 |
| 13 | Frontend ConfigurationView | Config management UI | `ConfigurationView.jsx` | PARTIAL | Real component, anonymous-only |
| 14 | Frontend WorkspaceConfigView | App+version+env config | `WorkspaceConfigView.jsx` | PARTIAL | Calls getEffective, anonymous-only |
| 15 | §145 Documentation Quality | Verify docs present | — | MISSING | No documentation checklist validator |

---

## BM-CDC-07 — Integration, Contracts & Runtime Bridge

### Contract Registry

| # | CDC Section | Requirement | Code Location | Status | Notes |
|---|---|---|---|---|---|
| 1 | §12 Contract entity | code, version, schema, hash | `schema.prisma:164-191` | REAL | Full model with hash |
| 2 | §13 Contract status | DRAFT/VALIDATING/LOCKED/ACTIVE/DEPRECATED/RETIRED | `schema.prisma:48-55` | REAL | Lifecycle enum |
| 3 | §14 Create contract | POST contract | `contract.controller.ts:17-20` | REAL | `create(dto)` |
| 4 | §15 Validate contract | Schema validation | `contract.service.ts:147-238` | REAL | Minimal schema validation |
| 5 | §16 Lock contract | → LOCKED | `contract.controller.ts:37-40` | REAL | `lock()` sets LOCKED + publishedAt |
| 6 | §17 Contract history | Audit trail | `schema.prisma:203-220` | REAL | `ContractHistory` model |
| 7 | §20 Contract providers | Register provider | `schema.prisma:230-247` | REAL | `ContractProvider` model |
| 8 | §21 Contract consumers | Register consumer | `schema.prisma:249-268` | REAL | `ContractConsumer` model |
| 9 | §30 Hash determinism | SHA-256 canonical | `contract.service.ts:54-66` | REAL | Canonical JSON → SHA-256 |
| 10 | §31 Compatibility | Detect breaking changes | `contract.service.ts:295-370` | PARTIAL | `getCompatibility()` — basic schema diff only |
| 11 | §12 **Contract Contributors** | Namespace-based contributor registry | — | MISSING | No contributor model/controller |
| 12 | §125 **Contributor Isolation** | Namespace per contributor | — | MISSING | No isolation mechanism |
| 13 | §126 **Deterministic Assembly** | Order-independent manifest | — | MISSING | No contributor assembly |
| 14 | §127 **Unknown Contract Fields** | ignore/reject strategy per version | — | MISSING | No unknown field handling |
| 15 | §130 Consumer Compatibility Check | POST /runtime-compatibility/check | — | MISSING | Endpoint not implemented |

### Runtime Bridge

| # | CDC Section | Requirement | Code Location | Status | Notes |
|---|---|---|---|---|---|
| 16 | §42 RuntimeManifest | Aggregate all contracts for version | `snapshot.service.ts:93-154` | PARTIAL | Gathers all active contracts (not contributor-based, globally) |
| 17 | §43 Manifest excludes secrets | Never expose secret values | `snapshot.service.ts:140-151` | PARTIAL | Configuration values included in full (no secret masking at snapshot level) |
| 18 | §44 Runtime Resolver | Resolve version+environment+channel | `configuration.service.ts:143` | PARTIAL | Effective config resolution exists but no channel resolution |
| 19 | §45 Manifest Assembler | Assemble from contributors | — | MISSING | No contributor-based assembly |
| 20 | §46 Runtime Readiness | All-valid → READY | — | MISSING | No readiness orchestration |
| 21 | §47 Runtime Snapshot | Immutable snapshot | `snapshot.service.ts:52-200` | PARTIAL | Hash computed but no immutability enforcement; published snapshots can be regenerated |
| 22 | §48 Snapshot hash | Deterministic hash | `snapshot.service.ts:32-50,156-169` | REAL | Canonical + SHA-256 |
| 23 | §58 Environment resolution | DEV/TEST/STAGING/PROD bindings | `snapshot.service.ts` | MISSING | No environment-specific binding resolution |
| 24 | §80 Integration Binding | Version → adapter + mapping | — | MISSING | No binding model/service |
| 25 | §81 Adapter Registry | Available adapters | `schema.prisma:453-479` | REAL | `Connector` model with capabilities/health |
| 26 | §82 Binding validation | Validate target/adapter/mapping | — | MISSING | No validation pipeline |
| 27 | §83 Test connection | Test adapter connectivity | — | MISSING | No test endpoint |
| 28 | §120 Adapter observability | Trace without secrets | — | MISSING | No tracing for adapter calls |
| 29 | §121 Audit Events | Business events | — | PARTIAL | `AuditEvent` model exists but not emitted by platform services |
| 30 | §122 Security | No secret exposure, no cross-tenant | Various | BROKEN | Secrets included in snapshot config; no tenant filtering |
| 31 | §123 SSRF Protection | URL allowlists for integrations | — | MISSING | No SSRF protection |
| 32 | §128 Backward compatibility | Runtime detects too-new manifest | — | MISSING | No manifest version checking |
| 33 | §135 Required runtime capabilities | Adapter declares capabilities | `schema.prisma:466` | PARTIAL | `capabilities` JSON field exists but not validated |
| 34 | §139 Capability mapping | ERP adapter provides mapping | — | MISSING | No capability mapping service |
| 35 | §140 Data mapping | Entity/field ↔ ERP mapping | `schema.prisma:1099-1118` | REAL | `EntityMapping` model exists but not connected to BM |
| 36 | §141 Pack Runtime contract | Stable contract for pack runtime | — | MISSING | No pack runtime contract |
| 37 | §142 Application/UI contract | RuntimeManifest → app renders | — | PARTIAL | Manifest structure exists in snapshot but no runtime endpoint |
| 38 | §144 API layer | Expose contracts to external consumers | `api-manager/` | REAL | API definitions managed |
| 39 | §145 Export contract | JSON with version+hash | — | MISSING | No export endpoint |
| 40 | §146 Import contract | Reject direct internal model replacement | — | MISSING | No import handling |
| 41 | §147 Contract documentation | purpose/owner/schema/version/etc | — | MISSING | No documentation metadata |
| 42 | §155 Cache | ETag, 304, invalidation | — | MISSING | No HTTP caching layer |

### Integration Layer (connectors/apis/webhooks/credentials/sync/diagnostics)

| # | CDC Section | Requirement | Code Location | Status | Notes |
|---|---|---|---|---|---|
| 43 | §60 Integration Registry | List integrations | `integration.service.ts` | REAL | `/api/integration/*` |
| 44 | §61 Integration Definition | Define integration | `connector.controller.ts` | REAL | `/api/connectors/*` |
| 45 | §62 Integration Binding | Bind integration to version | — | MISSING | No binding service |
| 46 | §63 Test connection | Test adapter | `connector.service.ts` | PARTIAL | Validation exists but no connection test endpoint |
| 47 | §64 Required integration | Block readiness if invalid | — | MISSING | No readiness bridge |
| 48 | §65 Optional integration | Warning if unavailable | — | MISSING | No health aggregation |

---

## BM-CDC-08 — Validation, Tests & Quality Manager

> **CRITICAL: No backend quality engine exists whatsoever.**

| # | CDC Section | Requirement | Code Location | Status | Notes |
|---|---|---|---|---|---|
| 1 | §70 QualityValidatorRegistry | Register validators | — | MISSING | No model/service |
| 2 | §71 Validator execution | Run validators | — | MISSING | No execution engine |
| 3 | §73 Validator timeout | Timeout handling | — | MISSING | No timeout mechanism |
| 4 | §74 Validator failure isolation | Don't crash on validator failure | — | MISSING | No isolation |
| 5 | §80 Validation Campaign | Create campaign | — | MISSING | No campaign model |
| 6 | §81 Validation Run | Execute campaign | — | MISSING | No run engine |
| 7 | §90 QualityRule / RuleSet | Define rules | — | MISSING | No rule model |
| 8 | §91 QualityProfile | Profile = rule set collection | — | MISSING | No profile model |
| 9 | §100 QualityIssue | Create, severity, blocking | — | MISSING | No issue model |
| 10 | §101 Severity | CRITICAL/HIGH/MEDIUM/LOW | — | MISSING | No severity enum |
| 11 | §102 Blocking policy | Issue blocks publication | — | MISSING | No blocking logic |
| 12 | §110 Quality Score | Calculate score | — | MISSING | No scoring engine |
| 13 | §111 Quality Gate | PASS/PASS_WITH_WARNINGS/FAIL | — | MISSING | No gate service |
| 14 | §112 Publication gate | Gate result → publish decision | — | MISSING | BM-CDC-02 doesn't call BM-CDC-08 |
| 15 | §120 Waiver | Request/approve/revoke/expiry | — | MISSING | No waiver model/service |
| 16 | §121 Approval | Approve/reject campaign | — | MISSING | No approval model |
| 17 | §130 Quality Report | Generate report | — | MISSING | No report generation |
| 18 | §131 Baseline | Use version as baseline for regression | — | MISSING | No baseline concept |
| 19 | §133 Compare Campaigns | A/B comparison | — | MISSING | No comparison engine |
| 20 | §137 Migration readiness | Consume BM-CDC-03 diff | — | MISSING | Not started |
| 21 | §138 Data loss risk | Block if DATA_LOSS_RISK | — | MISSING | Not started |
| 22 | §139 Navigation breaking | route/menu/ capability removed | — | MISSING | Not started |
| 23 | §140 Configuration breaking | required key/type/scope changed | — | MISSING | Not started |
| 24 | §141 Contract breaking | Incompatible contract visible | — | MISSING | Not started |
| 25 | §142 Runtime consumer compat | Check against declared consumers | — | MISSING | Not started |
| 26 | §150 Metrics | Quality metrics dashboard | — | MISSING | Not started |
| 27 | §159 Stale detection | OUTDATED if version changes | — | MISSING | No revision tracking |
| 28 | §161 Publication must use current validation | campaignRevision == currentRevision | — | MISSING | Not started |
| 29 | Frontend Quality Overview | Score, gate, issues | `PackValidationCockpitView.jsx` | PLACEHOLDER | Backend missing |
| 30 | Frontend Campaign list/detail | Campaign management | — | MISSING | Not in navigationConfig |
| 31 | Frontend Waiver/Approval UI | Waiver+approval flows | — | MISSING | Not in navigationConfig |

---

## Cross-Cutting: What's Shared vs. Missing

### Present in codebase (usable by BM-CDC-01..08):
| Artifact | Location | Reused by |
|---|---|---|
| PrismaService | `prisma.service.ts` | All modules |
| PlatformException / PlatformErrorCode | `common/errors/` | Platform modules |
| version-lifecycle.util.ts | `common/lifecycle/` | ApplicationVersionsModule |
| integration-lifecycle.util.ts | `common/lifecycle/` | IntegrationModule |
| IamJwtGuard | `iam/iam-jwt.guard.ts` | All auth-protected controllers |
| TenantGuard | `iam/tenant.guard.ts` | (registered globally?) — NOT applied to platform controllers |
| PermissionGuard / RequirePermission | `iam/permission.guard.ts` | Some controllers (duplicate config controller only) |
| winston.logger.ts | `common/logger/` | Platform modules |
| idempotency.service.ts | `common/resilience/` | Integration module |
| traceId middleware | `main.ts:14-23` | All requests |
| AuditEvent model | `schema.prisma:2161` | Not emitted |
| ContextSnapshot model | `schema.prisma:2087` | Not used by platform |

### Not yet present (must be built for BM-CDC-01..08):
| Artifact | Needed by |
|---|---|
| `tenantId` column on Application, ApplicationVersion, Configuration, Contract, Environment, Snapshot | All BM domains for tenant isolation |
| DataModel model + CRUD | BM-CDC-03 |
| Capability model + CRUD | BM-CDC-04 |
| Navigation model + CRUD + validation | BM-CDC-05 |
| ContractContributor model + registry service | BM-CDC-07 |
| RuntimeManifestResolver service | BM-CDC-07 |
| RuntimeManifestAssembler service | BM-CDC-07 |
| RuntimeReadinessService | BM-CDC-07 |
| IntegrationBinding model + service | BM-CDC-07 |
| AdapterRegistry model (exists as Connector but needs contract validation) | BM-CDC-07 |
| SSrfProtectionService | BM-CDC-07 |
| CacheInvalidationService | BM-CDC-07 |
| EventContract model + versioning | BM-CDC-07 |
| QualityDomain (validator registry, orchestrator, campaign, issue, score, gate, waiver, approval, report) | BM-CDC-08 |
| TestSuite/TestCase/TestRun models | BM-CDC-08 |
| Revision tracking on all entities | BM-CDC-08 |

---

## Phase 0 Deliverables Checklist

- [x] `docs/business-manager/BM_CDC_IMPLEMENTATION_MATRIX.md` — high-level classification
- [x] `docs/business-manager/BM_API_ROUTE_MATRIX.md` — API route inventory + frontend service gaps
- [x] `docs/business-manager/BM_CDC_FEATURE_CHECKLIST.md` — this document, granular per-CDC itemization
- [ ] `docs/business-manager/BM_ARCHITECTURE.md` — target architecture blueprint (Phase 1)
- [ ] `docs/business-manager/BM_DATABASE_MODEL.md` — current vs target Prisma schema (Phase 1)
- [ ] `docs/business-manager/BM_NAVIGATION.md` — navigation contract design (Phase 5)
- [ ] `docs/business-manager/BM_TENANT_ISOLATION.md` — tenant isolation remediation plan (Phase 1 priority)
- [ ] `docs/business-manager/BM_UI_UX_AUDIT.md` — frontend component audit (Phase 8)
- [ ] `docs/business-manager/BM_TEST_REPORT.md` — test coverage gap analysis (Phase 9)
- [ ] `docs/business-manager/BM_FINAL_IMPLEMENTATION_REPORT.md` — completion report (Phase 9)

## Vérification du 29 septembre 2026

- [x] Application/version, entité/champ, feature/capability et navigation via API réelle.
- [x] Sidebar BM à six entrées et contexte tenant/application/version conservé.
- [x] Configuration : cinq scopes testés en API, aucune sauvegarde simulée dans la vue.
- [x] Validation réelle, erreurs/chargement/états vides et tests ciblés.
- [ ] Publication intégrant quality gate, runtime readiness et snapshot.
- [ ] CRUD complet relations/contraintes et UI contextuelle Contracts/Runtime.

Voir [le rapport de recette](BM_RUNTIME_ACCEPTANCE_REPORT.md) pour les limites exactes.
