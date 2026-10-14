# SECURITY TEST — ADMINISTRATION PLATFORM

**Priority :** P1 / critical privilege boundary

---

# 1. Authentication

## SEC-ADM-001
Anonymous `/admin`.
Expected: 401.

---

# 2. Permission Separation

## SEC-ADM-010
READ_ONLY_SUPPORT tries suspend Tenant.
403.

## SEC-ADM-011
BILLING_ADMIN tries disable User.
403.

## SEC-ADM-012
SUPPORT_ADMIN tries modify security policy.
403.

---

# 3. Tenant Target Forgery

## SEC-ADM-020
Admin with Tenant A scope sends Tenant B target.
DENY.

---

# 4. User Actions

## SEC-ADM-030
Admin without user.manage revokes sessions.
403.

---

# 5. Delegation Escalation

## SEC-ADM-040
User delegates permission they do not own.
DENY.

## SEC-ADM-041
Self-delegation to higher privilege.
DENY.

## SEC-ADM-042
Expired delegation used.
DENY.

## SEC-ADM-043
Revoked delegation used.
DENY.

---

# 6. Delegation Scope

## SEC-ADM-050
Tenant-scoped delegation attempts platform action.
DENY.

---

# 7. Recent Auth

## SEC-ADM-060
Old session attempts critical action.
Require re-auth.

## SEC-ADM-061
MFA-required action without MFA level.
DENY/challenge.

---

# 8. Admin Action Registry

## SEC-ADM-070
Unknown arbitrary action key.
Reject.

## SEC-ADM-071
Shell command payload.
Reject.

## SEC-ADM-072
Raw SQL payload.
Reject.

---

# 9. Tenant Suspension

## SEC-ADM-080
Suspend without reason.
Reject.

## SEC-ADM-081
Suspend another tenant without scope.
DENY.

## SEC-ADM-082
Suspension deletes data.
Test must fail.

---

# 10. Feature Flags

## SEC-ADM-090
Client forces hidden security flag via frontend.
Server ignores/denies.

## SEC-ADM-091
Expired flag override still active.
Should not apply.

---

# 11. Settings

## SEC-ADM-100
Mass assignment sensitive setting not in schema.
Reject.

---

# 12. Providers

## SEC-ADM-110
Provider secret displayed.
Fail.

## SEC-ADM-111
MOCK provider labeled REAL in production.
Fail.

---

# 13. Jobs

## SEC-ADM-120
User without execute permission starts job.
403.

## SEC-ADM-121
Duplicate destructive job request.
Idempotent/blocked.

---

# 14. Maintenance

## SEC-ADM-130
Unauthorized user enables platform maintenance.
403.

---

# 15. Audit

## SEC-ADM-140
Critical successful action without audit event.
Fail.

## SEC-ADM-141
Critical failed action not traceable.
Fail according audit policy.

---

# 16. Frontend Mock

## SEC-ADM-150
Production `/admin/users` uses `adminUsersMockService`.
Fail.

## SEC-ADM-151
Production `/admin/overview` falls back to static fake data after API error.
Fail.

---

# 17. Secret Leakage

## SEC-ADM-160
Inspect APIs/logs/audit.
No credentials/JWT/MFA secrets.

---

# 18. CSRF

## SEC-ADM-170
Admin cookie-auth mutation from untrusted origin/no CSRF protection.
Blocked.

---

# 19. Impersonation if implemented

## SEC-ADM-180
Silent impersonation.
Forbidden.

## SEC-ADM-181
Impersonated session performs prohibited critical action.
Denied per policy.

---

# 20. E2E Privilege

```text
Support Admin
→ Tenant read
→ PASS
→ Tenant suspend
→ DENY
```

```text
Platform Admin + recent MFA
→ Suspend Tenant
→ Audit
→ Reactivate
→ Audit
```

---

# 21. CI Blocking

At minimum:
```text
SEC-ADM-010..012
SEC-ADM-020
SEC-ADM-040..061
SEC-ADM-070..082
SEC-ADM-110..111
SEC-ADM-140..170
```

---

# 22. Security DoD

- least privilege
- no escalation
- delegation expires
- recent auth critical
- no arbitrary action
- mock absent REAL
- audit complete
- no secrets
- security tests green.
