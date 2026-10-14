# TECH — TECHZONE CLOUD BUSINESS MANAGER

**Stack :** React/Vite + NestJS + Prisma/PostgreSQL

---

# 1. Existing structure to preserve

Audit confirms real modules for :

```text
data-model
features
navigation
contracts
quality/validation
runtime bridge
```

Do not rebuild.

---

# 2. Known files to inspect

```text
backend/src/modules/business-manager/
frontend/src/components/views/business-manager/
frontend/src/pages/
frontend/src/app/navigationConfig.js
backend/prisma/schema.prisma
```

Known important examples :

```text
contracts/contracts.controller.ts
data-model/data-model.controller.ts
runtime/runtime-bridge.service.ts
```

---

# 3. Tenant Context

All services should receive effective tenant from IAM.

Never from body as authority.

---

# 4. TenantResource

Audit every decorator.

Incorrect pattern :

```text
bm_entity
bm_feature
bm_menu
bm_contracts
```

if TenantGuard expects Prisma delegate names.

Create a controlled mapping if needed.

Unknown resource/delegate => DENY.

---

# 5. Permission Guards

Standardize :

```text
BM_READ
BM_WRITE
BM_CONTRACT_READ
BM_CONTRACT_WRITE
BM_VALIDATE
```

or equivalent actual Permission Registry keys.

---

# 6. Applications Service

Queries :

```text
findMany where tenantId
findFirst where id + tenantId
update scoped
archive scoped
```

Server-controlled audit fields.

---

# 7. Version Service

Invariant :

```text
ApplicationVersion.tenantId
must match
Application.tenantId
```

PUBLISHED immutable.

New DRAFT from clone uses transaction.

---

# 8. Entity Registry

Unique keys by intended scope.

Tenant/version filters mandatory.

Deletion:
- detect broken refs ;
- block or soft transition according to current lifecycle.

---

# 9. Fields

Validate:
- key ;
- type ;
- default ;
- nullable/required coherence ;
- references.

---

# 10. Relations

Before save :
- source exists ;
- target exists ;
- same allowed tenant/version scope ;
- no invalid self/duplicate relation according rules.

---

# 11. Feature Registry

Stable keys.

Tenant/version scoped.

---

# 12. Capability Registry

Expose contracts usable by :
- UI Builder ;
- Automation ;
- Pack Manager ;
- Runtime.

Do not claim runtime availability merely because BM declares capability.

---

# 13. Business Events

Contract versioning.

Payload schema validated.

Stable event key.

---

# 14. Navigation

Business structure only.

Frontend UI Builder owns visual layout.

---

# 15. Configuration

Implement deterministic resolver.

Do not resolve from frontend.

Consider service :

```ts
resolveConfiguration({
  tenantId,
  applicationId,
  versionId,
  environmentId?
})
```

---

# 16. Contracts

Controller must have explicit permissions.

Every Contract:
- tenant scoped ;
- version scoped if applicable ;
- stable key ;
- version ;
- consumer metadata.

---

# 17. Validation Engine

Central service should aggregate validators.

Example:

```ts
validateApplication()
validateEntities()
validateFields()
validateRelations()
validateFeatures()
validateCapabilities()
validateEvents()
validatePermissions()
validateConfiguration()
validateContracts()
```

---

# 18. Validation Result

Structure :

```ts
type ValidationIssue = {
  severity: 'ERROR'|'WARNING'|'INFO'
  code: string
  resourceType: string
  resourceId?: string
  message: string
  path?: string
}
```

---

# 19. READY transition

Only if :

```text
ERROR count = 0
```

and required validation rules pass.

---

# 20. PUBLISHED immutability

Backend blocks writes to published version content.

Do not rely only on disabled UI.

---

# 21. Business Definition Serializer

Should create deterministic structure.

Ordering should be stable where needed for diff/hash.

---

# 22. Consumer Contracts

Prefer dedicated DTOs over exposing Prisma objects directly.

Avoid internal DB fields leaking to consumers.

---

# 23. Runtime Bridge

BM Runtime Bridge should expose definition contract only.

It must not execute runtime behavior owned by Pack Runtime.

---

# 24. Prisma

Before changes :
- audit models ;
- reuse ;
- preserve FK ;
- tenantId ;
- indexes ;
- migrations additive.

Coordinate with Prisma/Tenant Foundation.

---

# 25. API Error Contract

Use controlled errors :

```text
BM_APPLICATION_NOT_FOUND
BM_VERSION_IMMUTABLE
BM_ENTITY_DUPLICATE_KEY
BM_RELATION_INVALID
BM_REFERENCE_BROKEN
BM_VALIDATION_FAILED
BM_PERMISSION_REFERENCE_INVALID
BM_TENANT_DENIED
```

---

# 26. Audit

Track :
- application create/update/archive ;
- version create/status ;
- entity/field/relation changes ;
- contracts ;
- validation ;
- READY transition.

No secret/sensitive unnecessary payload.

---

# 27. Frontend State

Use existing API client/state management.

Avoid duplicated local truth.

Context changes should invalidate relevant cache.

---

# 28. Navigation Access

Frontend permission-aware :
- read-only ;
- editor ;
- validator.

But backend checks remain mandatory.

---

# 29. Tests

Unit :
- validators ;
- lifecycle ;
- serializer ;
- config resolver.

Integration :
- IAM ;
- Prisma ;
- consumer contracts.

Security :
- cross-tenant ;
- unauthorized contracts ;
- unknown delegate.

---

# 30. Commit Plan

```text
fix(bm): correct tenant resource resolution
fix(bm): enforce business manager permissions
fix(bm): secure contracts access
fix(bm): enforce tenant-scoped service queries
fix(bm): enforce published version immutability
feat(bm): strengthen business definition validation
test(bm): add cross-tenant and permission coverage
feat(bm-ui): align workspace access and validation states
```

---

# 31. Technical DoD

- no wrong TenantResource ;
- no fail-open ;
- contracts protected ;
- all queries tenant scoped ;
- PUBLISHED immutable ;
- validation deterministic ;
- consumer contracts stable ;
- tests green ;
- build green.
