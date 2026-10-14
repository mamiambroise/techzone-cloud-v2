# SECURITY TEST — API & INTEGRATION MANAGER

---

# 1. Client Authentication

## SEC-API-001
Invalid API key.
Expected: 401.

## SEC-API-002
Revoked credential.
401.

## SEC-API-003
Expired credential.
401.

---

# 2. Secret Storage

## SEC-API-010
Inspect DB/API/logs.
Plain client secret must not appear.

## SEC-API-011
Credential rotation.
Old credential revoked after policy window.

---

# 3. Tenant Isolation

## SEC-API-020
Tenant A manages client B.
DENY.

## SEC-API-021
Client A calls tenant B API context.
DENY.

## SEC-API-022
Tenant A reads usage B.
DENY.

---

# 4. Scopes

## SEC-API-030
Client has read scope, calls write operation.
403.

## SEC-API-031
Forge scope in request body/header.
Ignored; server grant authoritative.

---

# 5. Rate Limits

## SEC-API-040
Exceed client rate.
429.

## SEC-API-041
Switch IP but same client.
Limit still applies.

---

# 6. Quotas

## SEC-API-050
Exceed monthly quota.
Controlled deny.

## SEC-API-051
Concurrent requests cannot bypass atomic quota.

---

# 7. API Version

## SEC-API-060
Unsupported version.
Controlled error.

## SEC-API-061
SUNSET version.
Reject according policy.

---

# 8. Payload

## SEC-API-070
Unknown/mass-assignment fields.
Reject/strip per DTO policy.

## SEC-API-071
Oversized body.
413/controlled rejection.

---

# 9. Webhook SSRF

## SEC-API-080
Webhook endpoint localhost/private.
Reject.

## SEC-API-081
Redirect to private target.
Reject.

---

# 10. Webhook Signing

## SEC-API-090
Verify HMAC/timestamp.

## SEC-API-091
Tampered payload signature fails.

---

# 11. Webhook Retry

## SEC-API-100
500 remote => bounded retry.

## SEC-API-101
Permanent 4xx => policy-based failure/no infinite retry.

---

# 12. Replay / Duplicate

## SEC-API-110
Duplicate event delivery scheduling.
One logical delivery per subscription/event unless policy says otherwise.

---

# 13. CORS

## SEC-API-120
Unapproved browser origin.
Blocked.

---

# 14. CSRF

## SEC-API-130
Cookie-auth management mutation without valid CSRF/origin protections.
Blocked.

M2M bearer flows are tested separately.

---

# 15. Documentation Leakage

## SEC-API-140
Public docs must not reveal internal-only APIs or secret examples.

---

# 16. Mock Production

## SEC-API-150
REAL environment uses MockIntegrationProvider fallback.
Must fail explicitly.

---

# 17. Usage Privacy

## SEC-API-160
Usage records contain no auth token/full sensitive body.

---

# 18. Service Identity

## SEC-API-170
Disabled service identity/client.
Cannot call APIs.

---

# 19. E2E

```text
Create Client
→ Issue Secret
→ Grant Scope
→ Call v1
→ Usage Recorded
→ Revoke Secret
→ Same Call DENIED
```

Webhook:
```text
Create Subscription
→ Emit Event
→ Signed Delivery
→ Failure
→ Retry
→ History
```

---

# 20. CI Blocking

Block on:
- secret leakage ;
- cross tenant ;
- scope bypass ;
- revoked key ;
- limiter bypass ;
- quota race ;
- SSRF ;
- webhook signature ;
- mock production fallback.

---

# 21. Security DoD

All critical M2M and webhook tests green.
