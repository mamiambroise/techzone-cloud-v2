# SECURITY TEST — TECHZONE CLOUD PACK MANAGER

---

# 1. Pack Access

## SEC-PM-001
Tenant A GET Pack B.

Expected : DENY.

## SEC-PM-002
Tenant A update Pack B.

DENY.

---

# 2. ApplicationVersion

## SEC-PM-010
Create PackVersion without `applicationVersionId`.

Expected :
- controlled validation error.

## SEC-PM-011
Tenant A submits ApplicationVersion B.

Expected :
- DENY.

## SEC-PM-012
ApplicationVersion exists but belongs other Application.

Expected :
- DENY/validation error.

---

# 3. PackVersion

## SEC-PM-020
Tenant A GET PackVersion B.

DENY.

## SEC-PM-021
Tenant A PATCH PackVersion B.

DENY.

---

# 4. Validation Permissions

## SEC-PM-030
User without `pack.validate`.

Expected : 403.

---

# 5. Publish Permissions

## SEC-PM-040
User without `pack.publish`.

403.

---

# 6. Published Immutability

## SEC-PM-050
Modify published PackVersion.

Expected : DENY.

## SEC-PM-051
Change Manifest after publish.

Expected : DENY / integrity error.

---

# 7. Snapshot Integrity

## SEC-PM-060
UI snapshot references different ApplicationVersion.

Expected :
- validation ERROR.

## SEC-PM-061
Forged snapshot ref from other Tenant.

DENY.

---

# 8. Manifest

## SEC-PM-070
Manifest contains secret value.

Expected :
- test FAIL ;
- publication blocked if detected.

## SEC-PM-071
Tamper Manifest after hash.

Expected :
- hash mismatch ;
- publish/runtime refusal.

---

# 9. Dependencies

## SEC-PM-080
Unresolved mandatory dependency.

Expected :
- publication blocked.

---

# 10. Cross-Tenant Publication

## SEC-PM-090
Tenant A attempts publish PackVersion B.

DENY.

---

# 11. Mass Assignment

## SEC-PM-100
Client sends :
- tenantId B ;
- status PUBLISHED ;
- publishedAt ;
- createdBy.

Expected :
- reject/ignore ;
- server authority.

---

# 12. Replay

## SEC-PM-110
Duplicate publish request.

Expected :
- idempotent/no duplicate publication.

---

# 13. Acceptance Regression

## SEC-PM-120
UI create payload without AppVersion should fail clearly.

## SEC-PM-121
Correct payload should succeed.

---

# 14. RLS if enabled

Tenant A DB context cannot read/write Pack/PackVersion B.

---

# 15. E2E Security

```text
Login Tenant A
↓
Create Pack A
↓
Select AppVersion A
↓
Create PackVersion
↓
Validate
↓
Publish
↓
Try access Pack B
↓
DENY
```

---

# 16. CI Blocking

At minimum :

```text
SEC-PM-001..002
SEC-PM-010..012
SEC-PM-020..021
SEC-PM-030
SEC-PM-040
SEC-PM-050..051
SEC-PM-060..061
SEC-PM-070..071
SEC-PM-080
SEC-PM-090
SEC-PM-121
```

---

# 17. Security DoD

- AppVersion forgery blocked ;
- cross-tenant blocked ;
- unauthorized publish blocked ;
- published immutable ;
- hash integrity ;
- no secrets ;
- suite green.
