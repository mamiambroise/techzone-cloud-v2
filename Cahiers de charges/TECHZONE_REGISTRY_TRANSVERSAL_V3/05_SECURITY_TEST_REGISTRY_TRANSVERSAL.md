# SECURITY TEST — REGISTRY TRANSVERSAL

---

# 1. Tenant Isolation

## SEC-REG-001
Tenant A discovers tenant-scoped entry B.
Expected: no result / DENY.

## SEC-REG-002
Tenant A resolves entry B.
DENY.

## SEC-REG-003
Tenant A updates entry B.
DENY.

---

# 2. Namespace Ownership

## SEC-REG-010
UI Builder registers `integration.connector.*`.
DENY.

## SEC-REG-011
Integration Hub overwrites `ui.component.*`.
DENY.

---

# 3. Duplicate Injection

## SEC-REG-020
Same namespace/key/version with different owner.
Conflict.

## SEC-REG-021
Same stable key replaced silently.
Forbidden.

---

# 4. Provider Injection

## SEC-REG-030
Client forces arbitrary provider.
Ignore/deny.

---

# 5. Version Resolution

## SEC-REG-040
Published Pack locked 1.2.0 while 1.3.0 exists.
Runtime must resolve 1.2.0 exactly.

## SEC-REG-041
Unsupported range/malformed version.
Reject.

---

# 6. Disabled / Deprecated

## SEC-REG-050
Disabled entry selected for new resolution.
DENY.

## SEC-REG-051
Deprecated entry selected when policy disallows.
Warn/deny according policy.

---

# 7. Availability

## SEC-REG-060
REGISTERED but provider unreachable.
Must not return AVAILABLE.

---

# 8. Environment

## SEC-REG-070
Entry available DEV but not PROD.
PROD resolution must fail.

---

# 9. Schema

## SEC-REG-080
Pack requires unsupported schema.
Compatibility fails.

---

# 10. Capability

## SEC-REG-090
Required capability missing.
Resolution fails.

---

# 11. Removal Safety

## SEC-REG-100
Remove entry used by published Pack.
Blocked.

## SEC-REG-101
Remove entry used by active Runtime Context.
Blocked.

---

# 12. Metadata

## SEC-REG-110
Metadata includes script/executable content.
Rejected/sanitized as contract requires.

## SEC-REG-111
Metadata includes secret.
Must not persist/expose.

---

# 13. Mass Assignment

## SEC-REG-120
Client sends owner=platform/tenantId=B/status=AVAILABLE.
Server enforces authority.

---

# 14. Cache Isolation

## SEC-REG-130
Tenant A cache result reused for B.
Must not happen.

## SEC-REG-131
DEV availability cache reused for PROD.
Must not happen.

---

# 15. Permission

## SEC-REG-140
User with read only registers entry.
403.

## SEC-REG-141
User without deprecate deprecates entry.
403.

---

# 16. Diagnostics

## SEC-REG-150
Tenant user sees platform-only Registry diagnostics.
DENY.

---

# 17. REAL / MOCK

## SEC-REG-160
REAL Registry displays mocked availability.
Fail.

---

# 18. E2E Security

```text
Module A registers owned namespace
→ PASS

Module A registers foreign namespace
→ DENY
```

```text
Pack locks exact version
→ newer version registered
→ runtime still uses locked version
```

---

# 19. CI Blocking

Block on:
- cross tenant
- namespace takeover
- duplicate override
- dynamic published substitution
- false availability
- removal of active reference
- secret metadata
- cache scope leak.

---

# 20. Security DoD

Critical Registry isolation/ownership/determinism tests green.
