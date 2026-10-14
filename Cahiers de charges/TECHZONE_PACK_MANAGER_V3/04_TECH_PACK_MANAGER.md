# TECH — TECHZONE CLOUD PACK MANAGER

**Stack :** NestJS + Prisma/PostgreSQL + React/Vite

---

# 1. Existing Backend

Audit says keep :

```text
pack → version → validation → snapshot → manifest → publication
```

Do not rebuild.

---

# 2. Known code paths

Inspect :

```text
backend/src/modules/pack-manager/
frontend/src/components/views/pack-manager/
frontend/src/pages/
scripts/consolidation-acceptance.cjs
backend/prisma/schema.prisma
```

---

# 3. createVersion Contract

Current backend requires :

```ts
applicationVersionId: string
```

Frontend must align.

Do not loosen backend requirement merely to preserve old UI.

---

# 4. ApplicationVersion Lookup

Use existing BM API/service.

Filters :
- tenant ;
- application ;
- status if required.

---

# 5. DTO

CreateVersion DTO concept :

```ts
{
  applicationVersionId: string;
  versionNumber: string;
  label?: string;
  releaseNotes?: string;
}
```

Server ignores/rejects protected fields.

---

# 6. Server Validation

Before create :

```text
Pack belongs Tenant
ApplicationVersion exists
ApplicationVersion belongs same Tenant
Application relation compatible
status allowed
```

---

# 7. PackVersion Model

Ensure indexes/FK :

```text
tenantId
packId
applicationVersionId
status
versionNumber
```

Potential unique :
`tenantId + packId + versionNumber`.

Use actual schema conventions.

---

# 8. Snapshot Contract

Snapshot should contain or reference :

```text
applicationVersionId
businessDefinitionRef
uiDefinitionRef
automationDefinitionRef
configurationSnapshotRef
```

---

# 9. UI Snapshot Integrity

Validate same ApplicationVersion.

If mismatch :
`PACK_UI_APPLICATION_VERSION_MISMATCH`.

---

# 10. Validation Engine

Aggregate checks :

```text
application version
business definition
ui definition
automation
configuration
dependencies
requirements
capabilities
references
integrity
```

---

# 11. Manifest Serializer

Deterministic ordering.

Never include secrets.

Include schemaVersion.

---

# 12. Hash

Hash canonical snapshot/manifest per existing architecture.

Verify before publish.

---

# 13. Publication Transaction

Prefer atomic logical flow :

```text
revalidate
verify snapshot
verify hash
persist manifest
mark published
write publication record
audit
```

Use transaction where appropriate.

---

# 14. Published Immutability

Service-level enforcement.

UI read-only is secondary.

---

# 15. Clone

Clone may reuse source refs only if safe/immutable.

Must set target `applicationVersionId`.

---

# 16. Tenant Scope

Every query :
- tenant scoped ;
- ID + tenant ;
- no client authority.

---

# 17. IAM

Permissions per controller/action.

Unknown/missing permission => deny according IAM foundation.

---

# 18. Error Contract

Examples :

```text
APPLICATIONVERSIONID_REQUIRED
APPLICATION_VERSION_NOT_FOUND
APPLICATION_VERSION_TENANT_MISMATCH
PACK_VERSION_DUPLICATE
PACK_VALIDATION_FAILED
PACK_SNAPSHOT_INVALID
PACK_HASH_MISMATCH
PACK_MANIFEST_INVALID
PACK_PUBLISHED_IMMUTABLE
PACK_TENANT_DENIED
```

---

# 19. Frontend

Update create form.

Fetch ApplicationVersions on Pack context load.

Handle :
- loading ;
- empty ;
- error ;
- forbidden.

---

# 20. Acceptance Script

Update old payload.

Do not hardcode invalid IDs.

Resolve/create a valid ApplicationVersion fixture.

---

# 21. Tests

Unit :
- createVersion missing AppVersion ;
- wrong tenant ;
- clone ;
- validation ;
- hash ;
- publish.

Integration :
- BM version → PackVersion ;
- UI snapshot ;
- publication.

E2E :
- browser create → validate → publish.

---

# 22. Prisma

Coordinate with Tenant Foundation.

No destructive migration.

---

# 23. Observability

Track :
- validation duration ;
- publication failures ;
- hash mismatch ;
- correlation ID.

No secrets.

---

# 24. Commit Plan

```text
fix(pack-manager): require application version in create flow
fix(pack-manager-ui): add application version selector
test(pack-manager): update consolidation acceptance payload
test(pack-manager): add application version tenant checks
test(pack-manager): add publication regression coverage
feat(pack-manager-ui): improve validation and manifest workspace
```

---

# 25. Technical DoD

- UI/backend DTO aligned ;
- AppVersion same tenant ;
- acceptance green ;
- snapshot consistent ;
- Manifest deterministic ;
- publication safe ;
- immutable published ;
- security tests green ;
- build green.
