# TECH — TECHZONE CLOUD PACK RUNTIME

**Stack :** NestJS + Prisma/PostgreSQL + React/Vite

---

# 1. Existing components to preserve

Audit confirms:
- real pack-runtime service ;
- resolution ;
- diagnostics ;
- cache ;
- PublishedApplication ;
- RuntimePage ;
- published UI snapshot rendering ;
- Data Runtime calls.

Do not rebuild.

---

# 2. Known paths

Inspect:

```text
backend/src/modules/pack-runtime/
backend/src/modules/business-manager/runtime/
backend/src/modules/data-runtime/
frontend/src/components/pack-runtime/RuntimePage.jsx
frontend/src/components/pack-runtime/PublishedApplication.jsx
backend/prisma/schema.prisma
```

---

# 3. Central Execution Gate

Implement/reuse:

```ts
assertExecutableResolution({
  resolutionId,
  tenantId,
  applicationId?,
  applicationVersionId?,
  packVersionId?,
  environmentId?
})
```

Return trusted server context.

---

# 4. Resolution Lookup

Never trust fields duplicated from client if resolution already owns them.

Client should mainly send `resolutionId`.

Server resolves:
- tenant ;
- app ;
- version ;
- pack ;
- environment ;
- capabilities.

---

# 5. Status

Only `EXECUTABLE` passes.

```ts
if (resolution.status !== 'EXECUTABLE') throw ...
```

---

# 6. Effective Manifest

Generate/store/cache server-side.

Renderer endpoint should return sanitized effective definition.

Published raw Manifest is input, not execution authority.

---

# 7. Version Integrity

Compare:

```text
PackVersion.applicationVersionId
Runtime requested applicationVersionId
BusinessDefinition applicationVersionId
UISnapshot applicationVersionId
AutomationDefinition applicationVersionId
```

Use exact available refs.

---

# 8. Runtime Resolution persistence

Audit existing models first.

If resolution currently ephemeral, decide whether persistence is required for:
- audit ;
- expiration ;
- activation relation ;
- diagnostics.

Prefer minimal schema change.

---

# 9. Activation Model

Potential:

```text
RuntimeActivation
id
tenantId
applicationId
applicationVersionId
packVersionId
environmentId
resolutionId
runtimeContextId
status
activatedAt
deactivatedAt
activatedBy
```

Only create if no equivalent exists.

---

# 10. Unique Active Constraint

Enforce one active context by logical scope where required.

Can use:
- transaction ;
- unique partial index via SQL if appropriate ;
- service locking.

---

# 11. Activation Transaction

Logical flow:

```text
assert executable
deactivate/replace previous if policy
create activation
create context
mark activating
perform readiness
mark active
audit
```

Handle failure atomically/compensating.

---

# 12. Data Runtime

Modify Runtime-originated data requests to include:

```text
resolutionId
```

Backend Data Runtime:
- validate resolution ;
- derive tenant/applicationVersion ;
- then execute existing BM/Data authorization.

Do not remove IAM checks.

---

# 13. UI Renderer

`RuntimePage`:
1. resolve ;
2. require executable ;
3. get active context/activate ;
4. readiness ;
5. render.

---

# 14. PublishedApplication

Props should become conceptually:

```text
resolutionId
runtimeContext
effectiveManifest
```

not raw pack code/version as execution authority.

---

# 15. API Token / Internal Calls

If internal server calls occur, do not accept arbitrary browser-issued service identity.

Preserve user/session context or controlled server principal.

---

# 16. Cache Key

At minimum:

```text
tenantId
packVersionId
environmentId
configHash
manifestHash
```

---

# 17. Cache Invalidation

On:
- publication event ;
- context activate/deactivate ;
- configuration version change ;
- provider availability changes as needed.

---

# 18. Outbox Consumer

Search `pack.version.published`.

If outbox infrastructure real:
- implement idempotent consumer ;
- invalidate/warm cache.

If not:
- do not pretend event-driven path works.

---

# 19. Diagnostics Contract

Return sanitized structured diagnostics.

Never include:
- secrets ;
- credentials ;
- DB URL ;
- provider token.

---

# 20. Error Codes

```text
RUNTIME_RESOLUTION_NOT_FOUND
RUNTIME_RESOLUTION_BLOCKED
RUNTIME_RESOLUTION_EXPIRED
RUNTIME_TENANT_MISMATCH
RUNTIME_APPLICATION_VERSION_MISMATCH
RUNTIME_PACK_VERSION_MISMATCH
RUNTIME_MANIFEST_INVALID
RUNTIME_HASH_MISMATCH
RUNTIME_CAPABILITY_MISSING
RUNTIME_CONTEXT_NOT_ACTIVE
RUNTIME_READINESS_FAILED
```

---

# 21. IAM

Admin endpoints:
- runtime.read ;
- runtime.resolve ;
- runtime.activate ;
- runtime.deactivate ;
- runtime.diagnostics.

App execution also checks user permissions/data permissions through existing IAM/Data Runtime.

---

# 22. Prisma

Coordinate with Tenant Foundation.

Requirements:
- tenantId ;
- FK ;
- indexes ;
- activation persistence ;
- no destructive migration.

---

# 23. Concurrency

Two activation requests same scope:
- serialize/idempotent ;
- prevent two ACTIVE contexts unless explicitly supported.

---

# 24. Idempotency

Activation with same resolution/context should not duplicate runtime contexts.

---

# 25. Expiration

Resolution expiry:
- reject further execution ;
- active context lifecycle policy explicitly defined.

Do not silently extend client-side.

---

# 26. Frontend

Remove direct "code/version => render" path.

Use state machine:

```text
IDLE
RESOLVING
BLOCKED
EXECUTABLE
ACTIVATING
VERIFYING
ACTIVE
ERROR
```

---

# 27. Tests

Unit:
- gate ;
- resolver ;
- version mismatch ;
- cache ;
- activation.

Integration:
- Pack Manager ;
- Deployment ;
- Data Runtime.

Security:
- cross tenant ;
- blocked no execution.

---

# 28. CI

Add runtime security suite and E2E path.

---

# 29. Commit Plan

```text
fix(pack-runtime): enforce executable resolution gate
fix(pack-runtime): render effective manifest only
fix(pack-runtime): enforce application version consistency
feat(pack-runtime): persist runtime activation context
fix(data-runtime): require executable runtime resolution for published app
test(pack-runtime): block render and data access on blocked resolution
feat(pack-runtime-ui): align runtime page with resolution lifecycle
```

---

# 30. Technical DoD

- central execution gate ;
- effective manifest only ;
- no blocked render ;
- no blocked data operation ;
- persisted activation ;
- version consistency ;
- cache scoped ;
- tests green ;
- build green.
