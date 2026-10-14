# TECH — REGISTRY TRANSVERSAL

**Stack :** NestJS + Prisma/PostgreSQL + React/Vite

---

# 1. Audit First

Search :

```text
Registry
FeatureRegistry
CapabilityRegistry
ComponentRegistry
AutomationRegistry
ProviderRegistry
ConnectorRegistry
RuntimeCapability
SchemaRegistry
```

Do not introduce duplicate registry infrastructure before inventory.

---

# 2. Architecture

Preferred :

```text
RegistryFacade
├── BusinessRegistrySource
├── UiRegistrySource
├── AutomationRegistrySource
├── DataRegistrySource
├── IntegrationRegistrySource
├── RuntimeRegistrySource
└── ApiRegistrySource
```

---

# 3. Canonical Entry Contract

```ts
type RegistryEntry = {
  namespace: string;
  key: string;
  version: string;
  owner: string;
  provider?: string;
  scope: RegistryScope;
  tenantId?: string;
  applicationId?: string;
  environmentId?: string;
  status: RegistryStatus;
  capabilities: string[];
  schemaRef?: string;
  metadata?: Record<string, unknown>;
  compatibility?: RegistryCompatibilityMetadata;
}
```

---

# 4. Storage

Do not persist every source entry if source module is authoritative.

Options :
- derived views ;
- code registrations ;
- normalized index ;
- cache ;
- selective persistence.

---

# 5. Source Adapter

Each source exposes :

```ts
list(context, filter)
get(context, key, version?)
getCapabilities(context)
getAvailability(context, entry)
```

---

# 6. Namespace Policy

Persist/configure :

```text
namespace
owner
allowedWriters
scopeRules
```

Server-side check.

---

# 7. Registration

Validate :
- stable key
- namespace
- owner
- version
- scope
- duplicates
- metadata schema.

---

# 8. Version Parser

Use one SemVer implementation if SemVer applies.

Reject malformed ranges.

---

# 9. Resolver

Algorithm :

```text
load candidates
filter tenant/scope
filter status
filter provider
filter schema
filter capabilities
filter environment availability
apply version constraint
sort deterministic
select
return diagnostics
```

---

# 10. Published Resolution

Pack publication stores exact selected version.

Runtime exact lookup, not range resolution.

---

# 11. Compatibility Engine

Pure function where possible.

Input normalized.

Output structured with rejection reasons.

---

# 12. Availability Resolver

Sources :
- Registry status
- Environment
- Integration health
- Runtime capability
- Provider config.

Cache short-lived.

---

# 13. Batch Resolution

Support multiple requirements in one call.

Avoid N+1 source lookups.

---

# 14. Removal Guard

Before remove:
- query references;
- block if active.

Use owner module contracts.

---

# 15. Cache

Use stable serialized key.

Include:
- tenant
- app
- env
- namespace
- key
- version/range.

---

# 16. Invalidation

Events:
- registry lifecycle
- provider health
- deployment/env changes.

---

# 17. Prisma

Potential models only if needed :

```text
RegistryEntryIndex
RegistryNamespacePolicy
RegistryDeprecation
RegistryAvailabilitySnapshot
RegistryAuditEvent
```

Avoid tables duplicating owner models.

---

# 18. IAM

Explicit permissions.

Internal module registration may use service principal.

---

# 19. Tenant Context

Never trust tenant from DTO.

Use principal/context.

---

# 20. Metadata Security

Whitelist/validate metadata.

Never accept executable code or secrets.

---

# 21. API

Controllers thin.

Services perform scope/ownership.

---

# 22. Observability

Instrument:
- resolution duration
- candidates count
- misses
- conflicts
- cache hit
- unavailable result.

---

# 23. Errors

Stable structured errors with traceId.

---

# 24. Frontend

Connect to real endpoints.

No static Registry examples in REAL.

---

# 25. Tests

Unit:
- resolver
- namespace
- collisions
- cache
- schema
- availability.

Integration:
- source adapters
- Pack Manager
- Runtime.

Security:
- cross tenant
- namespace takeover
- malicious metadata.

---

# 26. Commit Plan

```text
feat(registry): define canonical registry entry contract
feat(registry): aggregate specialized registry sources
fix(registry): enforce namespace ownership and tenant scope
feat(registry): implement deterministic version resolution
feat(registry): add schema and capability compatibility checks
feat(registry): add environment-aware availability resolution
fix(registry): guard removal of referenced entries
feat(registry-ui): connect registry workspace to real APIs
test(registry): add cross-tenant namespace and runtime compatibility coverage
```

---

# 27. Technical DoD

- no duplicated ownership
- canonical contract
- deterministic resolver
- namespace auth
- tenant scope
- availability
- compatibility
- batch resolution
- safe cache
- real diagnostics
- tests/build green.
