# SECURITY TEST — TECHZONE CLOUD ERP ADAPTER / INTEGRATION HUB

**Priority :** P1 before real ERP production use

---

# 1. Tenant Isolation

## SEC-ERP-001
Tenant A lists integrations.

Expected:
- A only.

## SEC-ERP-002
Tenant A GET integration B.

DENY.

## SEC-ERP-003
Tenant A executes command on B.

DENY.

## SEC-ERP-004
Tenant A reads mapping B.

DENY.

## SEC-ERP-005
Tenant A creates ExternalResourceLink to integration B.

DENY.

---

# 2. Provider Resolution

## SEC-ERP-010
Client sends `?erp=DOLIBARR` to force provider.

Expected:
- ignored/not authority.

## SEC-ERP-011
Forged connector key.

DENY/contract validation.

---

# 3. Singleton Isolation

## SEC-ERP-020
Parallel requests Tenant A and B with distinct endpoints.

Expected:
- A never uses B config ;
- B never uses A credentials/base URL.

---

# 4. Mock in Production

## SEC-ERP-030
Production REAL config with MockAdapter fallback.

Expected:
- explicit failure ;
- no fake success.

---

# 5. Credentials

## SEC-ERP-040
GET integration detail.

No secret.

## SEC-ERP-041
Logs after failed auth.

No token/password.

## SEC-ERP-042
Diagnostics.

No credential.

---

# 6. SSRF

## SEC-ERP-050
Endpoint `http://127.0.0.1`.

Reject unless explicit controlled allowlist.

## SEC-ERP-051
Endpoint metadata IP.

Reject.

## SEC-ERP-052
Redirect public → private IP.

Reject.

## SEC-ERP-053
Alternative numeric/IPv6 loopback notation.

Reject.

---

# 7. URL Scheme

## SEC-ERP-060
`file://`, `ftp://`, unsupported scheme.

Reject.

---

# 8. Capabilities

## SEC-ERP-070
Command requires WRITE but instance READ only.

DENY.

---

# 9. Mapping

## SEC-ERP-080
Field mapping references resource other tenant.

DENY.

## SEC-ERP-081
Invalid transformation type.

Reject.

---

# 10. External Resource Links

## SEC-ERP-090
Cross-tenant external link.

Reject.

## SEC-ERP-091
Duplicate external link.

Conflict controlled.

---

# 11. Idempotency

## SEC-ERP-100
Same create command twice, same idempotency key.

One external effect.

---

# 12. Retry

## SEC-ERP-110
Remote 400 validation error.

No automatic retry.

## SEC-ERP-111
Remote 503.

Bounded retry.

## SEC-ERP-112
Remote 429.

Respect policy/Retry-After where implemented.

---

# 13. Timeout

## SEC-ERP-120
Remote hangs.

Controlled timeout.

---

# 14. Webhooks

## SEC-ERP-130
Invalid signature.

Reject.

## SEC-ERP-131
Replay same event ID.

Deduplicate.

## SEC-ERP-132
Webhook tenant/integration mismatch.

Reject.

---

# 15. Sync

## SEC-ERP-140
Sync run Tenant A attempts mapping B.

Reject.

## SEC-ERP-141
Conflict.

Must not silently overwrite.

---

# 16. Live Staging

## SEC-ERP-150
REAL staging health.

Must perform real safe network call.

## SEC-ERP-151
Read a safe fixture/resource.

Mapped canonical response.

---

# 17. Prisma Drift

## SEC-ERP-160
Fresh DB migration.

ERPRegistry FK/type valid.

## SEC-ERP-161
Upgrade DB.

Existing tenant references preserved.

---

# 18. Data Runtime

## SEC-ERP-170
Data Runtime call tries direct provider bypass.

Architecture/test should ensure official path.

---

# 19. Automation

## SEC-ERP-180
Automation action includes raw Dolibarr URL/token.

Reject.

---

# 20. Mass Assignment

## SEC-ERP-190
Client sends tenantId B/status AVAILABLE/createdBy admin.

Server rejects/ignores.

---

# 21. E2E Positive

```text
Tenant A
→ Integration A
→ REAL Dolibarr
→ Health
→ Query Product
→ Mapping
→ canonical result
```

---

# 22. E2E Negative

```text
Tenant A
→ Integration B
→ DENY
```

and:

```text
Production REAL
→ Mock only
→ FAIL
```

---

# 23. CI Blocking

At minimum:

```text
SEC-ERP-001..005
SEC-ERP-010..020
SEC-ERP-030
SEC-ERP-040..053
SEC-ERP-070
SEC-ERP-080..100
SEC-ERP-120
SEC-ERP-130..132
SEC-ERP-160..161
SEC-ERP-190
```

Live staging tests may be a protected CI/staging job, but must be run before real ERP release.

---

# 24. Security DoD

- no cross-tenant ;
- no provider injection ;
- no config leakage ;
- no mock PROD fallback ;
- no secrets ;
- SSRF protected ;
- webhook replay protected ;
- idempotent writes ;
- DB migrations safe ;
- live contract test certified.
