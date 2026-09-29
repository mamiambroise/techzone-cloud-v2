# Report 04: Pack Runtime Comparison

**CDCs Referenced:** PR-CDC-00 through PR-CDC-07
**Local Path:** `backend/src/modules/pack-runtime/` (ComingSoon / PLANNED)
**Source Path:** `Backend/src/modules/pack-runtime/` (jasmina-bm/Mami)
**Status Vocabulary:** IDENTICAL, SOURCE_MORE_COMPLETE, CURRENT_MORE_COMPLETE, DIFFERENT_IMPLEMENTATION, MISSING_IN_CURRENT, MISSING_IN_SOURCE, PARTIAL_IN_CURRENT, PARTIAL_IN_SOURCE
**Date:** 2026-09-29

---

## 4.1 Executive Summary

| Aspect | Local | jasmina-bm/Mami | Match |
|--------|-------|-----------------|-------|
| Framework | NestJS 12 | NestJS 12 | IDENTICAL |
| ORM | Prisma 7 | Prisma 7 | IDENTICAL |
| Implementation Status | ComingSoon / PLANNED | FULLY IMPLEMENTED | SOURCE_MORE_COMPLETE |
| Database Models | NOT present | Runtime context + cache models | MISSING_IN_CURRENT |
| Tests | None | Unknown | MISSING_IN_SOURCE |
| Tenant Isolation | Unknown | Unknown | UNKNOWN |

**Overall Status:** `SOURCE_MORE_COMPLETE` — jasmina-bm/Mami has a complete Pack Runtime implementation; local project has only navigation markers.
**Recommendation:** `MISSING_IN_CURRENT` — Adopt pack-runtime module and PR-CDC implementations from jasmina-bm/Mami.

## 4.2 Backend Status

### Local Backend (Pack Runtime)

| File | Function | Status |
|------|----------|--------|
| (search result) | No pack-runtime module found in `backend/src/modules/` | MISSING_IN_CURRENT |
| `frontend/src/app/navigationConfig.js` | Runtime section marked "ComingSoon" | PLANNED |

**Backend Status:** MISSING_IN_CURRENT — No Pack Runtime backend module exists in local project.

### jasmina-bm/Mami Backend (Pack Runtime)

| File | Function | Status |
|------|----------|--------|
| `Backend/src/modules/pack-runtime/pack-runtime.module.ts` | NestJS module registration | FULLY IMPLEMENTED |
| `Backend/src/modules/pack-runtime/pack-runtime.controller.ts` | REST API for runtime resolution | FULLY IMPLEMENTED |
| `Backend/src/modules/pack-runtime/manifest-loader.service.ts` | Manifest loading from PM registry | FULLY IMPLEMENTED |
| `Backend/src/modules/pack-runtime/runtime-resolver.service.ts` | Effective manifest resolution | FULLY IMPLEMENTED |
| `Backend/src/modules/pack-runtime/effective-manifest.service.ts` | Effective manifest computation | FULLY IMPLEMENTED |
| `Backend/src/modules/pack-runtime/runtime-context.service.ts` | TenantContext, IAMContext, SubscriptionContext | FULLY IMPLEMENTED |
| `Backend/src/modules/pack-runtime/cache-manager.service.ts` | Tenant-safe cache | FULLY IMPLEMENTED |
| `Backend/src/modules/pack-runtime/diagnostics.service.ts` | Diagnostics (errors, warnings) | FULLY IMPLEMENTED |
| `Backend/src/modules/pack-runtime/resilience.service.ts` | Fallback/resilience patterns | FULLY IMPLEMENTED |
| `Backend/src/modules/pack-runtime/rules-context.service.ts` | Rules evaluation context | FULLY IMPLEMENTED |
| `Backend/src/modules/pack-runtime/capabilities-resolver.service.ts` | Feature/Capability resolution | FULLY IMPLEMENTED |
| `Backend/src/modules/pack-runtime/dependencies-resolver.service.ts` | Dependency resolution | FULLY IMPLEMENTED |

### PackRuntime Service — Detailed Functions

| Service File | Functions | CDC Mapping |
|--------------|-----------|-------------|
| `manifest-loader.service.ts` | `loadManifest(versionId)`, `loadPublishedManifest(packId)`, `cacheManifest()` | PR-CDC-01 |
| `runtime-resolver.service.ts` | `resolveManifest(context, versionId)`, `resolveEffectiveManifest()` | PR-CDC-02 |
| `effective-manifest.service.ts` | `computeEffective()`, `mergeManifests()`, `resolveOverrides()` | PR-CDC-02 |
| `runtime-context.service.ts` | `TenantContext`, `IAMContext`, `SubscriptionContext` builder | PR-CDC-03 |
| `cache-manager.service.ts` | `getCached(key)`, `setCached(key, value)`, `evict(key)`, tenant-safe keys | PR-CDC-04 |
| `diagnostics.service.ts` | `logError()`, `logWarning()`, `getDiagnostics()`, `clearDiagnostics()` | PR-CDC-05 |
| `resilience.service.ts` | `withFallback()`, `retry()`, `circuitBreaker()` | PR-CDC-06 |
| `capabilities-resolver.service.ts` | `resolveCapabilities()`, `getEnabledCapabilities()` | PR-CDC-01 |
| `dependencies-resolver.service.ts` | `resolveDependencies()`, `checkConflicts()` | PR-CDC-01 |

### PR-CDC Compliance Matrix

| PR-CDC | Requirement | Local | jasmina-bm/Mami | Status |
|--------|-------------|-------|-----------------|--------|
| PR-CDC-00 | Pack Runtime Core | MISSING | `pack-runtime.module.ts`, controller, all services | MISSING_IN_CURRENT |
| PR-CDC-01 | Manifest Loading & Resolution | MISSING | Manifest Loader, Dependencies Resolver, Capabilities Resolver | MISSING_IN_CURRENT |
| PR-CDC-02 | Effective Manifest Computation | MISSING | Runtime Resolver, Effective Manifest Service | MISSING_IN_CURRENT |
| PR-CDC-03 | Context Management | MISSING | TenantContext, IAMContext, SubscriptionContext | MISSING_IN_CURRENT |
| PR-CDC-04 | Cache Management | MISSING | Cache Manager (tenant-safe) | MISSING_IN_CURRENT |
| PR-CDC-05 | Diagnostics | MISSING | Diagnostics Service (errors, warnings) | MISSING_IN_CURRENT |
| PR-CDC-06 | Resilience/Fallback | MISSING | Resilience Service (circuit breaker, retry) | MISSING_IN_CURRENT |
| PR-CDC-07 | Runtime API Endpoints | MISSING | pack-runtime.controller.ts (REST) | MISSING_IN_CURRENT |

**Backend Status:** MISSING_IN_CURRENT — Full Pack Runtime implementation exists in jasmina-bm/Mami.

## 4.3 Frontend Status

### Local Frontend (Pack Runtime)

| File | Function | Status |
|------|----------|--------|
| `frontend/src/app/navigationConfig.js` | Runtime section marked "ComingSoon" | PLANNED (no views) |

### jasmina-bm/Mami Frontend (Pack Runtime)

| File | Function | Status |
|------|----------|--------|
| `Frontend/src/components/views/pack-runtime/RuntimeCockpitView.jsx` | Main runtime cockpit (8 modes) | FULLY IMPLEMENTED |
| `Frontend/src/components/views/pack-runtime/FeatureCatalogView.jsx` | Feature catalog | FULLY IMPLEMENTED |
| `Frontend/src/components/views/pack-runtime/CapabilitiesView.jsx` | Capabilities view | FULLY IMPLEMENTED |
| `Frontend/src/components/views/pack-runtime/ModuleCatalogView.jsx` | Module catalog | FULLY IMPLEMENTED |
| `Frontend/src/components/views/pack-runtime/DependencyResolverView.jsx` | Dependency resolver | FULLY IMPLEMENTED |
| `Frontend/src/components/views/pack-runtime/ManifestInspectionView.jsx` | Manifest inspection | FULLY IMPLEMENTED |
| `Frontend/src/components/views/pack-runtime/ContextManagementView.jsx` | Context management | FULLY IMPLEMENTED |
| `Frontend/src/components/views/pack-runtime/DiagnosticsView.jsx` | Diagnostics viewer | FULLY IMPLEMENTED |
| `Frontend/src/components/views/pack-runtime/CacheManagementView.jsx` | Cache management | FULLY IMPLEMENTED |
| `Frontend/src/components/views/pack-runtime/ApiContractsView.jsx` | API contracts | FULLY IMPLEMENTED |

### RuntimeCockpitView — 8 Modes

| Mode | Title | Description |
|------|-------|-------------|
| overview | État effectif Runtime | Current effective state |
| context | Runtime Context | Select business names for resolution |
| resolver | Resolver | Resolve published PM manifest in explicit context |
| manifest | Effective Manifest | Inspect executable result from last resolution |
| status | Runtime Status | Health of providers required by resolver |
| cache | Cache & résilience | Tenant-safe cache state and active protections |
| diagnostics | Diagnostics | Persisted errors and warnings from resolution |
| api | API Runtime | Technical contracts exposed by backend |

### Frontend Comparison

| Aspect | Local | jasmina-bm/Mami | Status |
|--------|-------|-----------------|--------|
| Runtime Views | 0 ( ComingSoon) | 10 views | MISSING_IN_CURRENT |
| Runtime Cockpit | Missing | 8 modes | MISSING_IN_CURRENT |
| Shared Components | N/A | EmptyState, ErrorState, JsonViewer, PageHeader, StatusBadge, TechnicalDetails | PARTIAL_IN_SOURCE |
| Navigation | Runtime marked "ComingSoon" | `runtime.pr` section in navigationConfig | MISSING_IN_CURRENT |
| Tests | None for PR | Unknown | MISSING_IN_SOURCE |

**Frontend Status:** MISSING_IN_CURRENT — jasmina-bm/Mami has 10 fully implemented Pack Runtime views including an 8-mode cockpit.

## 4.4 Database Status

### Local Prisma Schema (Pack Runtime)

No pack-runtime models exist in local `schema.prisma`.

### jasmina-bm/Mami Prisma Schema (Pack Runtime Models)

| Model | Description | Local Equivalent |
|-------|-------------|-----------------|
| `pr_runtime_contexts` | Runtime context definitions | MISSING |
| `pr_runtime_resolutions` | Resolution results | MISSING |
| `pr_runtime_cache` | Tenant-safe cache entries | MISSING |
| `pr_runtime_diagnostics` | Error/warning logs | MISSING |
| `pr_runtime_status` | Provider health status | MISSING |

**Database Status:** MISSING_IN_CURRENT — 5 runtime models exist in jasmina-bm/Mami but are absent from local schema.

## 4.5 Test Status

| Local Tests | Source Tests | Status |
|-------------|-------------|--------|
| 0 pack-runtime test files | Unknown | MISSING_IN_SOURCE |

**Test Status:** MISSING_IN_BOTH — Neither project has Pack Runtime tests.

## 4.6 Tenant Classification

| Aspect | Local | jasmina-bm/Mami | Status |
|--------|-------|-----------------|--------|
| Runtime tenant isolation | Unknown (not implemented) | `pr_runtime_cache` uses tenant-safe keys | MISSING_IN_CURRENT |
| Cache isolation | N/A | Tenant-safe cache keys | MISSING_IN_CURRENT |

**Multi-tenant Classification:** NOT_APPLICABLE — Pack Runtime not implemented in local.

## 4.7 Key Findings

1. **Complete Gap (CRITICAL):** Local project has ZERO Pack Runtime implementation — no backend, no frontend, no database models. Only navigation markers exist.
2. **Full Implementation Available:** jasmina-bm/Mami has a complete Pack Runtime with 12 service files, REST controller, 10 frontend views including an 8-mode RuntimeCockpitView.
3. **Compatible ORM:** Both use Prisma 7 — Runtime models can be directly imported.
4. **Shared Components:** jasmina-bm/Mami frontend has reusable components (EmptyState, ErrorState, JsonViewer, StatusBadge, TechnicalDetails) that are also useful for local project.
5. **Cache Tenant Safety:** jasmina-bm/Mami explicitly implements tenant-safe cache keys — a pattern local should adopt.

## 4.8 Recommendations

| Priority | Category | Recommendation | Source |
|----------|----------|----------------|--------|
| P0 | MISSING_IN_CURRENT | Import pack-runtime Prisma models (pr_runtime_contexts, pr_runtime_resolutions, pr_runtime_cache, pr_runtime_diagnostics, pr_runtime_status) | jasmina-bm/Mami: Backend/src/prisma/schema.prisma |
| P0 | MISSING_IN_CURRENT | Create `backend/src/modules/pack-runtime/` with all 12 service files + controller + module | jasmina-bm/Mami: Backend/src/modules/pack-runtime/ |
| P0 | MISSING_IN_CURRENT | Create `frontend/src/components/views/pack-runtime/` with 10 views | jasmina-bm/Mami: Frontend/src/components/views/pack-runtime/ |
| P1 | MISSING_IN_CURRENT | Import shared UI components (EmptyState, ErrorState, JsonViewer, StatusBadge, TechnicalDetails) from jasmina-bm/Mami frontend | jasmina-bm/Mami: Frontend/src/components/common/ |
| P1 | MISSING_IN_CURRENT | Ensure cache uses tenant-safe keys | jasmina-bm/Mami: cache-manager.service.ts |
| P2 | MISSING_IN_CURRENT | Add tests for all runtime services | Local: backend/src/modules/pack-runtime/ |

---

*Report generated: 2026-09-29 00:15 UTC*
*No files were modified. This is a read-only audit.*