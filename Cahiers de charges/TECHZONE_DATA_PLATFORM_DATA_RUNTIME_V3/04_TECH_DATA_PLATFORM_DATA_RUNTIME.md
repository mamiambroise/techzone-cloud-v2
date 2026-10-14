# TECH — TECHZONE CLOUD DATA PLATFORM / DATA RUNTIME

**Stack :** NestJS + Prisma/PostgreSQL + React/Vite

---

# 1. Existing code to preserve

Audit confirms :

```text
real query/read/execute endpoints
server-side context
BM provider tenant filtering
authorization checks
published renderer integration
```

Do not rebuild.

---

# 2. Known files

Inspect :

```text
backend/src/data-runtime/
backend/src/data-runtime/data-runtime.controller.ts
backend/src/data-runtime/data-access/bm-records.provider.ts
backend/src/modules/pack-runtime/
backend/prisma/schema.prisma
frontend published renderer/data bindings
```

---

# 3. Execution Context

Introduce/reuse trusted internal context :

```ts
type RuntimeDataContext = {
  tenantId: string;
  identityId: string;
  userId?: string;
  applicationId?: string;
  applicationVersionId?: string;
  packVersionId?: string;
  environmentId?: string;
  resolutionId?: string;
  runtimeContextId?: string;
  permissions: string[];
}
```

For published runtime path, resolution fields come from Pack Runtime.

---

# 4. Resolution Gate

Preferred server contract :

```ts
const runtime = await packRuntime.assertExecutableResolution(
  principal.tenantId,
  resolutionId
);
```

Then derive app/version/pack/environment.

---

# 5. Separation of Paths

Possible paths:

## Runtime App Path
Requires executable resolution.

## Platform/Admin Query Explorer
May use a distinct permissioned context without pretending to be Pack Runtime.

Do not weaken runtime gate to preserve Query Explorer.

---

# 6. Controller

Concept :

```ts
@Post('query')
query(@Principal() principal, @Body() dto) {
  return service.query(principal, dto);
}
```

Never accept authoritative tenant in DTO.

---

# 7. Query DTO

Allow declarative contract fields only.

Reject:
- SQL ;
- Prisma where raw object if unsafe ;
- provider-specific arbitrary expressions ;
- JavaScript.

---

# 8. Query Compiler

Convert controlled DTO into repository query.

Use whitelist from Data Contract.

---

# 9. Filter AST

Recommended controlled structure:

```text
field
operator
value
```

Operators whitelisted:

```text
eq
ne
gt
gte
lt
lte
in
contains
startsWith
endsWith
```

Only when field/provider supports.

---

# 10. Sort

Whitelist fields + direction.

---

# 11. Pagination

Enforce:
- default limit ;
- max limit ;
- cursor/page validation.

---

# 12. Repository Resolver

Pipeline:

```text
entity
→ Data Contract
→ Repository Registry
→ Provider
→ Source
```

No dynamic arbitrary class/path from user input.

---

# 13. Provider Interface

Concept :

```ts
findMany
findOne
count
aggregate
create
update
delete
transaction
```

Capabilities checked before call.

---

# 14. BM Records Provider

Preserve tenant/auth behavior.

Add runtime resolution validation at service/gateway layer to avoid provider duplication if cleaner.

---

# 15. Prisma Provider

Every tenant-scoped query:
- tenant filter ;
- RLS defense where enabled ;
- no `$queryRawUnsafe` user input.

---

# 16. RLS

Coordinate with Tenant Foundation.

If `SET LOCAL app.current_tenant_id` strategy used:
- transaction scoped ;
- no connection leakage ;
- concurrency tests.

---

# 17. Mutation DTO

Whitelist fields from contract.

Never bind body directly to Prisma update/create.

---

# 18. Protected Fields

Server-controlled examples:

```text
tenantId
createdBy
updatedBy
createdAt
updatedAt
status privileged fields
internal audit fields
```

according domain contract.

---

# 19. Policy Engine

Evaluate:

```text
IAM permission
+
Data Contract operation
+
Data Policy
+
row/field rules if supported
+
Runtime capability
```

---

# 20. Transaction Manager

Use Prisma transactions for local DB operations.

For external providers:
- no fake ACID ;
- use compensation/retry/idempotency.

---

# 21. Idempotency

For appropriate mutations:
- key ;
- scope tenant + operation ;
- request fingerprint ;
- stored result/status.

---

# 22. Optimistic Lock

Where needed:
- updatedAt/version ;
- conflict error.

---

# 23. ERP Provider

Must route:

```text
Data Runtime
→ ERP Provider
→ Integration Hub
→ ERP Adapter
```

No direct Axios to Dolibarr inside Data Runtime.

---

# 24. Source Registry

Source config stores:
- refs ;
- status ;
- capability metadata.

Credentials handled by secure provider/secret store.

---

# 25. Diagnostics

Use structured codes.

Sanitize:
- SQL ;
- URLs with secrets ;
- headers ;
- tokens ;
- DB connection strings.

---

# 26. Logging

Log:
- entity ;
- operation ;
- tenant ID if policy allows ;
- duration ;
- provider ;
- result ;
- traceId.

Never business sensitive payload by default.

---

# 27. Audit

Writes:
- actor ;
- tenant ;
- entity ;
- operation ;
- record id if appropriate ;
- outcome ;
- trace.

---

# 28. Cache

Keys include:
- tenant ;
- contract version ;
- entity/query fingerprint ;
- Pack/ApplicationVersion when runtime-specific.

---

# 29. Cache Invalidation

On mutation:
- invalidate affected entity/query ranges using practical strategy.

Do not promise perfect invalidation without implementation.

---

# 30. Error Mapping

Provider errors → stable Data Runtime errors.

Do not expose Prisma stack traces.

---

# 31. Timeouts

Set controlled timeouts for:
- external providers ;
- expensive operations.

PostgreSQL statement timeout if architecture supports.

---

# 32. Query Complexity

Limits:
- filter count ;
- relation depth ;
- fields ;
- result size ;
- aggregation cost.

---

# 33. Tests

Unit:
- compiler ;
- policies ;
- validation ;
- resolver ;
- transaction.

Integration:
- real PostgreSQL ;
- Pack Runtime gate ;
- ERP provider contract.

Security:
- injection ;
- tenant ;
- blocked resolution ;
- mass assignment.

---

# 34. CI

Ensure PostgreSQL service/test DB executes.

No skipped conditional Postgres suite in release certification.

---

# 35. Commit Plan

```text
fix(data-runtime): require executable pack runtime resolution
fix(data-runtime): derive runtime data context server side
fix(data-runtime): enforce controlled query and mutation contracts
fix(data-runtime): harden tenant-scoped providers
test(data-runtime): add blocked resolution and cross-tenant coverage
test(data-runtime): enable postgres integration suite
test(data-runtime): add published ui runtime e2e flow
feat(data-platform-ui): complete sources contracts policies diagnostics
```

---

# 36. Technical DoD

- existing endpoints preserved where valid ;
- executable resolution gate ;
- server context ;
- tenant filters ;
- policies ;
- safe query compiler ;
- safe mutations ;
- real Postgres tests ;
- E2E runtime flow ;
- build green.
