# Report 15: Integration Recommendation

**Scope:** Actionable recommendations for integrating findings from 3 external repositories into the local Techzone Cloud V2 project
**Date:** 2026-09-29

---

## 15.1 Recommendation Framework

This report is organized by four recommendation categories:

| Category | Description |
|----------|-------------|
| **KEEP_CURRENT** | Local implementation is canonical; no changes needed |
| **IMPROVE_CURRENT** | Local implementation exists but should be enhanced with patterns from sources |
| **MISSING_IN_CURRENT** | Feature is absent in local but available in source — must implement |
| **DO_NOT_IMPORT** | Source code is architecturally incompatible — never import |

Each recommendation includes priority tier:

| Tier | Description |
|------|-------------|
| **P0** | Critical security, architecture, or missing core modules |
| **P1** | Core modules — IAM routes, billing, observability |
| **P2** | Frontend features, additional IAM capabilities |
| **P3** | Tests for new and existing implementations |
| **P4** | Documentation, optimization |

---

## Section A: KEEP_CURRENT

These items are already correctly implemented in the local project. No changes required.

### A.1 Core Architecture (P0)

| # | Item | Local Path | Reason |
|---|------|-----------|--------|
| A1 | NestJS Backend (single app) | `backend/src/` | Consolidated all modules into one NestJS 12 app — correct architecture |
| A2 | Single Prisma schema | `backend/prisma/schema.prisma` (3416 lines) | Canonical schema with 80+ models — correct approach |
| A3 | React 19 + Vite Frontend | `frontend/src/` | Modern frontend stack — correct |
| A4 | TailwindCSS | `frontend/` | Correct CSS framework |
| A5 | `useIams` prefixing | `schema.prisma` | Clear model naming (IamUser, iam_users) — preferred over taratra31's unprefixed names |
| A6 | `/api/*` route prefix | All controllers | Consistent with `vite.config.ts` proxy mapping |
| A7 | Single-App Architecture Policy | N/A | All code consolidated; DO NOT create separate backends |

### A.2 Security (P0)

| # | Item | Local Path | Reason |
|---|------|-----------|--------|
| A8 | IamJwtGuard | `iam/iam-jwt.guard.ts` | Systematic JWT validation with session lookup, user lookup, role derivation |
| A9 | IamPermissionGuard + @Permissions() | `iam/iam-permission.guard.ts` | Fine-grained permission checking |
| A10 | TenantGuard | `iam/tenant.guard.ts` | Enforces `tenant_id` on all routes — CRITICAL |
| A11 | @TenantResource() / @TenantOptional() | `iam/tenant.guard.ts` | Fine-grained tenant-aware route params |
| A12 | Helmet Security Headers | `main.ts:40-54` | HSTS, frameguard, noSniff, xssFilter, hidePoweredBy, referrerPolicy |
| A13 | Cross-site POST Blocking | `main.ts:19-21` | `sec-fetch-site: cross-site` → 403 — CRITICAL |
| A14 | CORS Configuration | `main.ts:27-38` | Configurable via `CORS_ORIGIN` env |
| A15 | ValidationPipe | `main.ts:58-65` | Global pipe with `whitelist`, `forbidNonWhitelisted`, `disableErrorMessages` in prod |
| A16 | AllExceptionsFilter | `common/filters/all-exceptions.filter.ts` | Structured error handling |
| A17 | IamError class | `iam/iam-error.ts` | Structured error codes |
| A18 | IamLogger | `iam/iam.logger.ts` | Auth success/failure logging |
| A19 | Cookie-based Auth | `iam-jwt.guard.ts:34-36` | Bearer + Cookie (`iam_access_token`) support |

### A.3 Existing Modules (P0)

| # | Item | Local Path | Reason |
|---|------|-----------|--------|
| A20 | Platform Module | `modules/platform/` | IDENTICAL to jasmina/develop — 6 CDCs compliant |
| A21 | Integration Module | `modules/integration/` | IDENTICAL to jasmina/develop — 9 CDCs compliant |
| A22 | Deployment Module | `modules/deployment/` | IDENTICAL to jasmina/develop — 9 CDCs compliant |
| A23 | Business Manager | `modules/business-manager/` | FULLY IMPLEMENTED (Prisma) — 8 CDCs compliant |
| A24 | ERP Adapter | `erp-adapter/` | 47 endpoints — IDENTICAL to taratra31/ERP-full + `/api` prefix |
| A25 | Data Runtime | `data-runtime/` | 12 endpoints — IDENTICAL to taratra31/ERP-full |
| A26 | Automation | `automation/` | 19 endpoints — IDENTICAL to taratra31/ERP-full + security |
| A27 | ERP Registry | `erp-registry/` | 6 endpoints — IDENTICAL to taratra31/ERP-full |
| A28 | Frontend Architecture | `navigationConfig.js`, `routes.js` | 4 sections, 11 groups, 18 routes — well structured |

### A.4 Test Coverage (P0)

| # | Item | Local Path | Reason |
|---|------|-----------|--------|
| A29 | Backend Tests | `backend/src/**/*.spec.ts` (44 files) | Comprehensive Jest test coverage |
| A30 | Frontend Tests | `frontend/src/**/*.test.{js,jsx}` (9 files) | Vitest + happy-dom tests |

### A.5 Do NOT Touch

| # | Item | Path | Reason |
|---|------|------|--------|
| A31 | Legacy techzone/ | `techzone/` | PHP/Dolibarr — DO NOT MODIFY |

---

## Section B: IMPROVE_CURRENT

These items exist in local but should be enhanced with patterns from source repositories.

### B.1 IAM Enhancement (P1)

| # | Item | Local Path | Source Path | Action |
|---|------|-----------|-------------|--------|
| B1 | Add admin delegation routes | `iam/` (create `iam-admin-delegation.controller.ts`) | `taratra31/main: Auth_AIM/backend/src/routes/adminDelegation.routes.js` | Implement 5 routes: GET, POST, GET:id, PATCH, DELETE |
| B2 | Add admin actions routes | `iam/` (create `iam-admin-actions.controller.ts`) | `taratra31/main: Auth_AIM/backend/src/routes/adminActions.routes.js` | Implement 4 routes: GET, POST, GET:id, PATCH |
| B3 | Add admin monitoring routes | `iam/` (create `iam-admin-monitoring.controller.ts`) | `taratra31/main: Auth_AIM/backend/src/routes/adminMonitoringDiagnostics.routes.js` | Implement health/metrics/monitoring endpoints |
| B4 | Add security events routes | `iam/iam-observability.controller.ts` (extend) | `taratra31/main: Auth_AIM/backend/src/routes/adminSecurityAudit.routes.js` | Extend with admin security audit endpoints |
| B5 | Add API key management | `iam/` (new controller/service) | `taratra31/main: Auth_AIM/backend/src/services/credential.service.js` | Implement API key CRUD |
| B6 | Add service account management | `iam/` (new controller/service) | `taratra31/main: Auth_AIM/backend/src/services/` | Implement service account CRUD |
| B7 | Add device trust features | `iam/` (extend IamDevice model) | `taratra31/main: Auth_AIM/backend/src/services/device.service.js` | Extend device trust level tracking |
| B8 | Add MFA remember-device | `iam-mfa.controller.ts` (extend) | `taratra31/main: mfa.routes.js` | Add `challenge/remember-device` endpoint |

### B.2 Billing Routes (P1)

| # | Item | Local Path | Source Path | Action |
|---|------|-----------|-------------|--------|
| B9 | Extend iam-billing.controller.ts | `iam/iam-billing.controller.ts` | `taratra31/main: Auth_AIM/backend/src/routes/billing/` | Import 8 billing route patterns: plans, subscriptions, invoices, payments, webhooks, entitlements, features, access-rules |
| B10 | Add billing webhooks | `iam/iam-billing.controller.ts` | `taratra31/main: Auth_AIM/backend/src/routes/webhook.routes.js` | Implement webhook endpoint for billing events |
| B11 | Add entitlement management | `iam/iam-billing.controller.ts` | `taratra31/main: Auth_AIM/backend/src/routes/entitlement.routes.js` | Implement entitlement CRUD + quota consume |
| B12 | Add access decision | `iam/iam-billing.controller.ts` | `taratra31/main: Auth_AIM/backend/src/routes/accessDecision.routes.js` | Already partially present — enhance |

### B.3 Observability Routes (P1)

| # | Item | Local Path | Source Path | Action |
|---|------|-----------|-------------|--------|
| B13 | Extend iam-observability.controller.ts | `iam/iam-observability.controller.ts` | `taratra31/main: Auth_AIM/backend/src/routes/observability.routes.js` | Add observability overview endpoint |
| B14 | Add logs manager | `iam/iam-observability.controller.ts` | `taratra31/main: Auth_AIM/backend/src/routes/logsManager.routes.js` | Implement `/logs/search` with advanced filters |
| B15 | Add alert manager | `iam/iam-observability.controller.ts` | `taratra31/main: Auth_AIM/backend/src/routes/alertManager.routes.js` | Implement alert CRUD + rules |
| B16 | Add monitoring health metrics | `iam/iam-observability.controller.ts` | `taratra31/main: tests/monitoringHealthMetrics.test.js` | Implement `/observability/dashboard` with metrics |

### B.4 Prisma Schema Enhancement (P1)

| # | Item | Local Path | Source Path | Action |
|---|------|-----------|-------------|--------|
| B17 | Import missing IAM models | `backend/prisma/schema.prisma` | `taratra31/main: Auth_AIM/backend/prisma/schema.prisma` | Add: Credential, AdminDelegation, AdministrativeAction, AuthorizationDecision |
| B18 | Import missing enums | `backend/prisma/schema.prisma` | `taratra31/main: Auth_AIM/backend/prisma/schema.prisma` | Add ~10 enums: GroupType, SiteStatus, SecuritySeverity, PlatformServiceStatus, BillingInterval, PaymentStatus, SubscriptionStatus, PlanStatus, InvoiceStatus, AdminActionStatus, AuthorizationResult, PolicyEffect |
| B19 | Import Credential model | `backend/prisma/schema.prisma` | `taratra31/main: Auth_AIM/backend/prisma/schema.prisma` | Add full Credential model (distinct from CredentialReference) |

### B.5 Frontend Enhancement (P2)

| # | Item | Local Path | Source Path | Action |
|---|------|-----------|-------------|--------|
| B20 | Replace mock data in iam-demo | `frontend/src/features/iam-demo/` | — | Connect to real API endpoints |
| B21 | Import chart components | `frontend/src/components/ui/` | `taratra31/Lianah: Auth_AIM/frontend/src/components/` | Import DonutChart, LineChart |
| B22 | Import loading/error states | `frontend/src/components/ui/` | `taratra31/Lianah: components/observability/` | Import LoadingState, EmptyState, ErrorState, KpiCard, DataTable |
| B23 | Add admin layout | `frontend/src/components/` | `taratra31/Lianah: components/Layout.jsx` | Import AdminLayout with drawer + overlay |
| B24 | Import toast notification | `frontend/src/` | `taratra31/Lianah: components/observability/useToast.js` | Add toast notification system |
| B25 | Import confirmation modal | `frontend/src/components/ui/` | `taratra31/Lianah: components/observability/ConfirmationModal.jsx` | Add confirmation dialog |
| B26 | Import search/filter bar | `frontend/src/components/ui/` | `taratra31/Lianah: components/observability/` | Import SearchBar, FilterBar for tables |

### B.6 Automation Enhancement (P2)

| # | Item | Local Path | Source Path | Action |
|---|------|-----------|-------------|--------|
| B27 | Import automation DTOs | `backend/src/automation/dto/` | `taratra31/ERP-full: automation/dto/` | Import EventPayloadDto, SimulateRuleDto, StartWorkflowDto, FireTriggerDto if missing |
| B28 | Add tenant context to automation | `automation/automation.controller.ts` | — | Ensure TenantGuard on all automation routes |

## Section C: MISSING_IN_CURRENT

These items are completely absent from the local project and must be implemented from source.

### C.1 Pack Manager (P0) — From jasmina-bm/Mami

| # | Item | Local Target Path | Source Path | Action |
|---|------|-------------------|-------------|--------|
| C1 | Pack Manager Prisma models | `backend/prisma/schema.prisma` | `jasmina-bm/Mami: Backend/prisma/schema.prisma` | Import 13 models: Pack, PackVersion, PackModule, PackFeature, PackCapability, PackFeatureCapability, PackDependency, PackRule, PackValidation, PackSnapshot, PackManifest, PackAuditEvent, PackOutboxEvent |
| C2 | Pack Manager backend module | `backend/src/modules/pack-manager/` | `jasmina-bm/Mami: Backend/src/modules/pack-manager/` | Create module, controller, service with all functions (createPack, getPack, updatePack, deletePack, publishPack, listVersions, createPackModule, createPackFeature, createPackCapability, createPackDependency, createPackRule, validateManifest, generateManifest, snapshotManifest) |
| C3 | Pack Manager frontend views | `frontend/src/components/views/pack-manager/` | `jasmina-bm/Mami: Frontend/src/components/views/pack-manager/` | Create 12 views: PackManagerCockpitView, PackList/CatalogView, PackEditorView, ModuleEditorView, FeatureEditorView, CapabilityEditorView, DependencyEditorView, RuleEditorView, ValidationEditorView, ManifestView, PublishView, SnapshotView |
| C4 | Register pack-manager in AppModule | `backend/src/app.module.ts` | — | Add to imports + routes in navigationConfig.js |
| C5 | Remove "ComingSoon" from Packs navigation | `frontend/src/app/navigationConfig.js` | jasmina-bm/Mami | Activate Packs section with 11 nav items |

### C.2 Pack Runtime (P0) — From jasmina-bm/Mami

| # | Item | Local Target Path | Source Path | Action |
|---|------|-------------------|-------------|--------|
| C6 | Pack Runtime Prisma models | `backend/prisma/schema.prisma` | `jasmina-bm/Mami: Backend/prisma/schema.prisma` | Import 4 models: RuntimeDiagnostic, RuntimeEffectiveManifest, RuntimeResolution, RuntimeResolutionStep |
| C7 | Pack Runtime backend module | `backend/src/modules/pack-runtime/` | `jasmina-bm/Mami: Backend/src/modules/pack-runtime/` | Create 12 service files: manifest-loader, runtime-resolver, effective-manifest, runtime-context, cache-manager, diagnostics, resilience, capabilities-resolver, dependencies-resolver, rules-context + controller + module |
| C8 | Pack Runtime frontend views | `frontend/src/components/views/pack-runtime/` | `jasmina-bm/Mami: Frontend/src/components/views/pack-runtime/` | Create 10 views including RuntimeCockpitView (8 modes) |
| C9 | Register pack-runtime in AppModule | `backend/src/app.module.ts` | — | Add to imports + routes in navigationConfig.js |
| C10 | Remove "ComingSoon" from Runtime navigation | `frontend/src/app/navigationConfig.js` | jasmina-bm/Mami | Activate Runtime section |

### C.3 Shared Components (P1) — From jasmina-bm/Mami

| # | Item | Local Target Path | Source Path | Action |
|---|------|-------------------|-------------|--------|
| C11 | Shared UI components | `frontend/src/components/common/` | `jasmina-bm/Mami: Frontend/src/components/common/` | Import: EmptyState, ErrorState, JsonViewer, PageHeader, StatusBadge, TechnicalDetails, formatDateTime, AppContext, api |

### C.4 Billing Frontend (P2) — From taratra31/Lianah

| # | Item | Local Target Path | Source Path | Action |
|---|------|-------------------|-------------|--------|
| C12 | Billing pages | `frontend/src/features/iam-demo/billing/` | `taratra31/Lianah: Auth_AIM/frontend/src/pages/billing/` | Create 9 pages: Overview, Plans, Subscriptions, Invoices, Payments, Webhooks, Entitlements, AccessRules, Features |
| C13 | Admin pages | `frontend/src/features/iam-demo/admin/` | `taratra31/Lianah: Auth_AIM/frontend/src/pages/Admin/` | Create 7 pages: Overview, Users, Org/Tenant, Governance, Delegation, SecurityAudit, Monitoring, Actions |
| C14 | Observability pages | `frontend/src/features/iam-demo/observability/` | `taratra31/Lianah: Auth_AIM/frontend/src/pages/Observability/` | Create 6 pages: Overview, Logs, Audit, SecurityEvents, Monitoring, AlertManager |
| C15 | Chart components | `frontend/src/components/charts/` | `taratra31/Lianah: Auth_AIM/frontend/src/components/` | Import DonutChart, LineChart, SectionIcon |

### C.5 Observability Components (P1) — From taratra31/Lianah

| # | Item | Local Target Path | Source Path | Action |
|---|------|-------------|--------|
| C16 | Observability component library | `frontend/src/components/observability/` | `taratra31/Lianah: Auth_AIM/frontend/src/components/observability/` | Import KpiCard, DataTable, StatusBadge, SeverityBadge, Timeline, DetailPanel, ConfirmationModal, useToast, FilterBar, SearchBar, EmptyState, ErrorState, LoadingState |

## Section D: DO_NOT_IMPORT

These items must never be imported into the local project.

| # | Item | Source Path | Reason |
|---|------|-------------|--------|
| D1 | taratra31/main Express.js backend | `Auth_AIM/backend/` | Express.js is architecturally incompatible with NestJS |
| D2 | taratra31/Lianah Express.js backend | `Auth_AIM/backend/` | Same Express.js incompatibility |
| D3 | taratra31/Nassa Express.js backend | `Auth_AIM/backend/` | Same Express.js incompatibility |
| D4 | taratra31/ERP-full bare routes (no `/api` prefix) | `new erp-adapter-platform/backend/src/**/*.controller.ts` | Routes lack `/api` prefix — incompatible with `vite.config.ts` proxy. MUST add `/api` prefix before importing any code. |
| D5 | taratra31/ERP-full IAM (no tenant_id) | `new erp-adapter-platform/backend/src/iam/` | Critical security gap — no tenant isolation |
| D6 | jasmina-bm/Mami TypeORM entities | `Backend/src/entities/` | TypeORM is incompatible with local's Prisma-only architecture |
| D7 | taratra31/ERP-full frontend (4 pages only) | `new erp-adapter-platform/frontend/` | Minimal frontend — use taratra31/Lianah instead for rich UI |
| D8 | jasmina-bm/develop routes (without PM/PR) | `Backend/src/modules/integration/`, `Backend/src/modules/platform/` | Already absorbed into local — no separate modules exist |

---

## 15.2 Priority-Action Matrix

```
┌──────────────┬──────────────────────────────────────────┬─────────────────────────────────────────────┐
│ Priority     │ Action                                   │ Source Repository/Branch                    │
├──────────────┼──────────────────────────────────────────┼─────────────────────────────────────────────┤
│ P0           │ Import 13 pack-manager Prisma models     │ jasmina-bm/Mami: Backend/prisma/schema.prisma │
│ P0           │ Import 4 pack-runtime Prisma models      │ jasmina-bm/Mami: Backend/prisma/schema.prisma │
│ P0           │ Create pack-manager backend module       │ jasmina-bm/Mami: Backend/src/modules/pack-manager/ │
│ P0           │ Create pack-runtime backend module       │ jasmina-bm/Mami: Backend/src/modules/pack-runtime/ │
│ P0           │ Create pack-manager frontend views       │ jasmina-bm/Mami: Frontend/src/components/views/pack-manager/ │
│ P0           │ Create pack-runtime frontend views       │ jasmina-bm/Mami: Frontend/src/components/views/pack-runtime/ │
│ P0           │ Activate Packs/Runtime navigation        │ Local: navigationConfig.js                  │
│ P1           │ Implement billing routes (8 route files) │ taratra31/main: Auth_AIM/backend/src/routes/billing/ │
│ P1           │ Implement admin routes (5 route files)   │ taratra31/main: Auth_AIM/backend/src/routes/admin*.js │
│ P1           │ Implement observability routes (3 files) │ taratra31/main: Auth_AIM/backend/src/routes/ │
│ P1           │ Import shared frontend components        │ taratra31/Lianah: Auth_AIM/frontend/src/components/observability/ │
│ P1           │ Import jasmina-bm/Mami shared components │ jasmina-bm/Mami: Frontend/src/components/common/ │
│ P1           │ Import 4 missing IAM models + 10 enums   │ taratra31/main: Auth_AIM/backend/prisma/schema.prisma │
│ P2           │ Implement billing/admin/observability pages │ taratra31/Lianah: Auth_AIM/frontend/src/pages/ │
│ P2           │ Import chart components                  │ taratra31/Lianah: Auth_AIM/frontend/src/components/ │
│ P2           │ Add MFA remember-device, API keys, service accounts │ taratra31/main |
│ P2           │ Import automation DTOs if missing        │ taratra31/ERP-full: automation/dto/         │
│ P3           │ Add tests for pack-manager (8 CDS)       | Pattern from local specs                    │
│ P3           │ Add tests for pack-runtime (8 CDCs)      | Pattern from local specs                    │
│ P3           │ Add tests for billing/admin/observability routes │ Pattern from taratra31/main tests   │
│ P4           │ Document BM-CDC-09 through BM-CDC-16     | Local docs                                │
│ P4           │ Document PM-CDC-08/PR-CDC-08 (tests)     | Local docs                                │
└──────────────┴──────────────────────────────────────────┴─────────────────────────────────────────────┘
```

## 15.3 Implementation Order

### Phase 1 (P0 — Week 1-2): Pack Manager + Pack Runtime

```
Step 1: Add 17 pack-manager + pack-runtime Prisma models to schema.prisma
Step 2: Run `npx prisma generate` + create migration
Step 3: Create backend/src/modules/pack-manager/ (module, controller, service)
Step 4: Create backend/src/modules/pack-runtime/ (12 service files, controller, module)
Step 5: Register both in app.module.ts
Step 6: Create frontend/src/components/views/pack-manager/ (12 views)
Step 7: Create frontend/src/components/views/pack-runtime/ (10 views)
Step 8: Update navigationConfig.js (remove ComingSoon, add nav items)
Step 9: Add tests (8 pack-manager + 8 pack-runtime spec files)
Step 10: Run `npm test` to verify
```

### Phase 2 (P1 — Week 3-4): IAM/Billing/OBS Routes + Schema

```
Step 1: Add 4 missing IAM models (Credential, AdminDelegation, AdministrativeAction, AuthorizationDecision)
Step 2: Import 10 missing enums from taratra31/main
Step 3: Create iam-admin-delegation.controller.ts
Step 4: Create iam-admin-actions.controller.ts
Step 5: Create iam-admin-monitoring.controller.ts
Step 6: Extend iam-observability.controller.ts with security audit endpoints
Step 7: Create billing routes (8 NestJS controllers)
Step 8: Implement billing routes as extensions to iam-billing.controller.ts
Step 9: Add tests for new controllers
```

### Phase 3 (P2 — Week 5-6): Frontend Enhancement

```
Step 1: Import shared components from jasmina-bm/Mami (EmptyState, ErrorState, etc.)
Step 2: Import observability components from taratra31/Lianah
Step 3: Import chart components (DonutChart, LineChart)
Step 4: Create billing/admin/observability frontend pages (22 pages)
Step 5: Replace iam-demo mock data with real API calls
Step 6: Add frontend tests for new pages
```

### Phase 4 (P3-P4 — Week 7+): Tests & Documentation

```
Step 1: Add tests for all new modules
Step 2: Document undocumented CDCs (BM-CDC-09-16, PM-CDC-08, PR-CDC-08)
Step 3: Write integration test suite
Step 4: Performance optimization
```

## 15.4 Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| TypeORM entities from jasmina-bm/Mami | CRITICAL | DO NOT IMPORT — use Prisma equivalent pattern only |
| Express.js from taratra31/main | CRITICAL | DO NOT IMPORT backend — use for route patterns only |
| Missing tenant_id from taratra31/ERP-full | CRITICAL | DO NOT IMPORT taratra31/ERP-full IAM — use local IAM only |
| Route prefix mismatch | HIGH | All taratra31/ERP-full routes need `/api` prefix before import |
| Schema migration data loss | MEDIUM | Test migrations on dev database first; use `prisma db push` in dev only |
| Test coverage gap during migration | MEDIUM | Add tests as part of each phase |
| Frontend component CSS conflicts | LOW | Use TailwindCSS classes; avoid importing raw CSS files |

## 15.5 Source File Path Index

### For Pack Manager Implementation

```
jasmina-bm/Mami:
  Backend/prisma/schema.prisma              → Local: backend/prisma/schema.prisma (append)
  Backend/src/modules/pack-manager/          → Local: backend/src/modules/pack-manager/ (create)
  Frontend/src/components/views/pack-manager/ → Local: frontend/src/components/views/pack-manager/ (create)
  Frontend/src/components/common/             → Local: frontend/src/components/common/ (create)
```

### For Pack Runtime Implementation

```
jasmina-bm/Mami:
  Backend/src/modules/pack-runtime/           → Local: backend/src/modules/pack-runtime/ (create)
  Frontend/src/components/views/pack-runtime/  → Local: frontend/src/components/views/pack-runtime/ (create)
```

### For IAM/Billing/OBS Routes

```
taratra31/main:
  Auth_AIM/backend/src/routes/adminDelegation.routes.js     → Local: backend/src/iam/ (NestJS controller)
  Auth_AIM/backend/src/routes/adminActions.routes.js        → Local: backend/src/iam/ (NestJS controller)
  Auth_AIM/backend/src/routes/adminMonitoringDiagnostics.routes.js → Local: backend/src/iam/ (NestJS controller)
  Auth_AIM/backend/src/routes/security.routes.js            → Local: backend/src/iam/iam-observability.controller.ts (extend)
  Auth_AIM/backend/src/routes/adminSecurityAudit.routes.js  → Local: backend/src/iam/iam-observability.controller.ts (extend)
  Auth_AIM/backend/src/routes/billing/*.routes.js (8)       → Local: backend/src/iam/iam-billing.controller.ts (extend)
  Auth_AIM/backend/prisma/schema.prisma                     → Local: backend/prisma/schema.prisma (models + enums)
  Auth_AIM/backend/tests/*.test.js (11)                     → Local: backend/src/**/*.spec.ts (pattern)
```

### For Frontend Enhancement

```
taratra31/Lianah:
  Auth_AIM/frontend/src/components/observability/  → Local: frontend/src/components/observability/ (create)
  Auth_AIM/frontend/src/components/DonutChart.jsx   → Local: frontend/src/components/charts/ (create)
  Auth_AIM/frontend/src/components/LineChart.jsx    → Local: frontend/src/components/charts/ (create)
  Auth_AIM/frontend/src/components/SectionIcon.jsx  → Local: frontend/src/components/ (create)
  Auth_AIM/frontend/src/components/Layout.jsx       → Local: frontend/src/components/ (AdminLayout create)
  Auth_AIM/frontend/src/pages/billing/ (9)          → Local: frontend/src/features/iam-demo/billing/ (create)
  Auth_AIM/frontend/src/pages/Admin/ (7)            → Local: frontend/src/features/iam-demo/admin/ (create)
  Auth_AIM/frontend/src/pages/Observability/ (6)    → Local: frontend/src/features/iam-demo/observability/ (create)
  Auth_AIM/frontend/src/services/*.js               → Local: frontend/src/services/ (pattern reference)
```

---

*Report generated: 2026-09-29 00:15 UTC*
*No files were modified. This is a read-only audit.*