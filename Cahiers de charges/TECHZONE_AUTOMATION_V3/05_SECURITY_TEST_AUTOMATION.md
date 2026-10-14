# SECURITY TEST — TECHZONE CLOUD AUTOMATION

**Priority :** P1

---

# 1. Tenant Isolation

## SEC-AUTO-001
Tenant A lists workflows.

Expected:
- A only.

## SEC-AUTO-002
Tenant A GET workflow B.

DENY.

## SEC-AUTO-003
Tenant A PATCH workflow B.

DENY.

## SEC-AUTO-004
Tenant A reads execution B.

DENY.

## SEC-AUTO-005
Tenant A retries execution B.

DENY.

---

# 2. Persistence

## SEC-AUTO-010
Create workflow, restart backend.

Expected:
- workflow persists.

## SEC-AUTO-011
Execution history after restart.

Expected:
- persists.

## SEC-AUTO-012
Schedules after restart.

Expected:
- no loss/no duplicate trigger.

---

# 3. Simulation Permission

## SEC-AUTO-020
User without `automation.simulate`.

POST simulate.

Expected:
- 403.

---

# 4. Simulation Side Effects

## SEC-AUTO-021
Simulation includes ERP action.

Expected:
- no real ERP call.

## SEC-AUTO-022
Simulation includes Data mutation.

Expected:
- no real mutation unless explicit sandbox transaction rolled back.

---

# 5. Arbitrary Code

## SEC-AUTO-030
Condition contains JavaScript.

Reject.

## SEC-AUTO-031
Formula attempts `process`, `require`, filesystem/network.

Reject.

---

# 6. Workflow Graph

## SEC-AUTO-040
Malicious recursive workflow.

Expected:
- loop/depth protection.

## SEC-AUTO-041
Excessive nodes/steps.

Expected:
- controlled limits.

---

# 7. Runtime Gate

## SEC-AUTO-050
Published workflow executed with BLOCKED Pack Runtime resolution.

DENY/BLOCKED.

## SEC-AUTO-051
Forged resolutionId other Tenant.

DENY.

---

# 8. IAM

## SEC-AUTO-060
Read permission only attempts update.

403.

## SEC-AUTO-061
No retry permission attempts retry.

403.

---

# 9. Data Actions

## SEC-AUTO-070
Workflow attempts update without business permission.

Data Runtime/IAM DENY.

---

# 10. Integration

## SEC-AUTO-080
Arbitrary URL external action.

Reject.

## SEC-AUTO-081
SSRF localhost/private target.

Reject.

## SEC-AUTO-082
Credential embedded in action definition.

Reject/no secret persistence.

---

# 11. Mock Provider

## SEC-AUTO-090
Production REAL mode with MockAutomation only.

Expected:
- startup/action fails explicitly ;
- no fallback.

---

# 12. Idempotency

## SEC-AUTO-100
Same business event delivered twice with same key.

Expected:
- no duplicate side effect where idempotency applies.

---

# 13. Retry

## SEC-AUTO-110
Retryable provider error.

Expected:
- bounded retries.

## SEC-AUTO-111
Non-retryable validation error.

No pointless retry.

---

# 14. Timeout

## SEC-AUTO-120
Hanging external action.

Expected:
- timeout ;
- execution FAILED/TIMEOUT ;
- worker freed.

---

# 15. Sensitive Payloads

## SEC-AUTO-130
Input contains password/token.

History/log output:
- redacted/not persisted raw.

---

# 16. Mass Assignment

## SEC-AUTO-140
Client sends tenantId B/status SUCCEEDED/createdBy admin.

Server rejects/ignores protected fields.

---

# 17. Schedules

## SEC-AUTO-150
Tenant A edits schedule B.

DENY.

## SEC-AUTO-151
Two workers claim same due schedule.

One logical execution.

---

# 18. Frontend Regression

## SEC-AUTO-160
Open `/automation/workflows`.

Expected:
- no `Bell is not defined` crash.

---

# 19. E2E Positive

```text
Business Event
→ Trigger
→ Rule
→ Workflow
→ Data Runtime
→ Integration
→ SUCCEEDED
→ Persistent History
```

---

# 20. E2E Negative

```text
Tenant A
→ Workflow B
→ DENY
```

and:

```text
Runtime BLOCKED
→ Workflow execution
→ BLOCKED
```

---

# 21. CI Blocking

At minimum:

```text
SEC-AUTO-001..005
SEC-AUTO-010..012
SEC-AUTO-020..022
SEC-AUTO-030..031
SEC-AUTO-040
SEC-AUTO-050..051
SEC-AUTO-060..061
SEC-AUTO-080..090
SEC-AUTO-100
SEC-AUTO-120
SEC-AUTO-130
SEC-AUTO-150..160
```

---

# 22. Security DoD

- tenant isolated ;
- persisted after restart ;
- simulate permission ;
- no real side effects in simulation ;
- no arbitrary code ;
- runtime gate respected ;
- mock blocked in REAL ;
- secrets protected ;
- idempotency ;
- tests green.
