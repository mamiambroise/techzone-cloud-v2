# SECURITY TEST — TECHZONE CLOUD PACK RUNTIME

**Priority :** P1 / potentially P0

---

# 1. Resolution Tenant Isolation

## SEC-PR-001
Tenant A uses resolutionId B.

Expected:
- DENY.

## SEC-PR-002
Tenant A resolves PackVersion B.

DENY.

---

# 2. BLOCKED Runtime

## SEC-PR-010
Resolution returns BLOCKED.

Expected:
- PublishedApplication not rendered.

## SEC-PR-011
BLOCKED resolution calls Data Runtime read.

Expected:
- DENY.

## SEC-PR-012
BLOCKED resolution calls Data Runtime write.

Expected:
- DENY.

## SEC-PR-013
BLOCKED resolution triggers Automation.

Expected:
- DENY/no execution.

---

# 3. Missing Resolution

## SEC-PR-020
PublishedApplication/Data Runtime request without resolutionId.

Expected:
- DENY for runtime-published execution path.

---

# 4. Forged Status

## SEC-PR-030
Client sends status EXECUTABLE.

Expected:
- ignored ;
- server status used.

---

# 5. Version Mismatch

## SEC-PR-040
PackVersion.applicationVersionId != requested BM version.

Expected:
- BLOCKED.

## SEC-PR-041
UI Snapshot belongs to another ApplicationVersion.

BLOCKED.

---

# 6. Manifest Integrity

## SEC-PR-050
Manifest tampered after publish.

Expected:
- hash mismatch ;
- BLOCKED.

---

# 7. Expired Resolution

## SEC-PR-060
Use expired resolutionId.

DENY.

---

# 8. Activation Permission

## SEC-PR-070
User without runtime.activate.

403.

---

# 9. Cross Environment

## SEC-PR-080
Resolution for Environment A used in Environment B.

DENY.

---

# 10. Runtime Context

## SEC-PR-090
Inactive context attempts execution.

DENY.

## SEC-PR-091
Deactivated context reuse.

DENY.

---

# 11. Data Runtime Integration

## SEC-PR-100
Valid resolution but IAM user lacks business data permission.

Expected:
- DENY by Data Runtime/IAM.

Resolution does not override IAM.

---

# 12. Capabilities

## SEC-PR-110
Required capability declared but unavailable.

Expected:
- BLOCKED.

---

# 13. Integration Requirement

## SEC-PR-120
Required connector unavailable.

Expected:
- BLOCKED or readiness failure according lifecycle.

---

# 14. Secret Exposure

## SEC-PR-130
Inspect Effective Manifest frontend.

Expected:
- no secret values.

## SEC-PR-131
Inspect diagnostics.

No credentials/tokens.

---

# 15. Cache Isolation

## SEC-PR-140
Same PackVersion IDs across tenants/config contexts.

Expected:
- no cross-tenant cache hit.

---

# 16. Cache Stale

## SEC-PR-141
New publication/config invalidates old cached effective manifest where required.

---

# 17. Activation Concurrency

## SEC-PR-150
Two activate requests same scope.

Expected:
- one logical active context ;
- idempotent/serialized.

---

# 18. Publication Event Replay

## SEC-PR-160
Duplicate outbox event.

Expected:
- idempotent cache/update effect.

---

# 19. E2E Positive

```text
Published Pack
→ Resolve EXECUTABLE
→ Activate
→ Readiness
→ Render
→ Data Read
→ Data Write allowed by IAM
```

---

# 20. E2E Negative

```text
Published Pack
→ Resolve BLOCKED
→ Render attempt
→ DENY

Data write attempt
→ DENY
```

---

# 21. CI Blocking

At minimum:

```text
SEC-PR-001..002
SEC-PR-010..013
SEC-PR-020
SEC-PR-040..041
SEC-PR-050
SEC-PR-060
SEC-PR-080
SEC-PR-090..091
SEC-PR-100
SEC-PR-130..131
SEC-PR-140
SEC-PR-150
```

---

# 22. Security DoD

- BLOCKED means no execution ;
- resolution required ;
- tenant isolation ;
- AppVersion consistency ;
- integrity checks ;
- IAM still enforced ;
- no secrets ;
- cache isolated ;
- tests green.
