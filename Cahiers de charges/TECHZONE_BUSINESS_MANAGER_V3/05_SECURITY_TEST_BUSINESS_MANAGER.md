# SECURITY TEST — TECHZONE CLOUD BUSINESS MANAGER

**Priority :** P1

---

# 1. Applications

## SEC-BM-001
Tenant A GET Application B.

Expected :
- DENY.

## SEC-BM-002
Tenant A PATCH Application B.

Expected :
- DENY.

## SEC-BM-003
Tenant A archive Application B.

Expected :
- DENY.

---

# 2. Versions

## SEC-BM-010
Tenant A GET Version B.

Expected :
- DENY.

## SEC-BM-011
Create Version under Application B.

Expected :
- DENY.

## SEC-BM-012
Modify PUBLISHED Version.

Expected :
- DENY.

---

# 3. Entity

## SEC-BM-020
Tenant A reads Entity B.

DENY.

## SEC-BM-021
Tenant A updates Entity B.

DENY.

## SEC-BM-022
Tenant A deletes Entity B.

DENY.

---

# 4. Fields

## SEC-BM-030
Forged Entity ID B when creating Field.

DENY.

---

# 5. Relations

## SEC-BM-040
Create relation from Entity A to Entity B cross-tenant.

DENY.

## SEC-BM-041
Broken target entity.

Validation ERROR.

---

# 6. Features / Capabilities

## SEC-BM-050
Cross-tenant Feature access.

DENY.

## SEC-BM-051
Cross-tenant Capability update.

DENY.

---

# 7. Contracts

## SEC-BM-060
Authenticated user without contract read permission.

Expected : 403.

## SEC-BM-061
User with read but without write tries mutation.

403.

## SEC-BM-062
Tenant A reads Contract B.

DENY.

## SEC-BM-063
Tenant A mutates Contract B.

DENY.

---

# 8. TenantResource fail-open

## SEC-BM-070
Route with unknown delegate.

Expected :
- DENY.

## SEC-BM-071
Resolver throws.

Expected :
- DENY ;
- internal log.

---

# 9. Permission References

## SEC-BM-080
Unknown IAM permission reference.

Expected :
- validation issue.

## SEC-BM-081
Frontend sends privileged permission not in Registry.

Expected :
- rejected/invalid.

---

# 10. Validation

## SEC-BM-090
Business Definition with invalid relation.

Expected :
- ERROR ;
- cannot READY.

## SEC-BM-091
Duplicate Entity key.

ERROR.

## SEC-BM-092
Broken Contract reference.

ERROR/WARNING according rule, never silently valid.

---

# 11. Version Integrity

## SEC-BM-100
Modify DRAFT.

Expected :
- no changes to previous PUBLISHED version.

## SEC-BM-101
Clone version.

Expected :
- independent copy/reference model according architecture.

---

# 12. Audit Field Forgery

## SEC-BM-110
Client sends :

```json
{
  "createdBy": "platform-admin",
  "validatedBy": "other-user"
}
```

Expected :
- ignored/rejected ;
- server principal used.

---

# 13. Consumer Contracts

## SEC-BM-120
UI Builder requests Business Definition from other Tenant.

DENY.

## SEC-BM-121
Automation requests Event Registry from other Tenant.

DENY.

## SEC-BM-122
Pack Manager accesses Version B cross-tenant.

DENY.

---

# 14. Malformed Definition

## SEC-BM-130
Malformed metadata/definition payload.

Expected :
- DTO/schema validation ;
- no crash ;
- controlled error.

---

# 15. Mass Assignment

## SEC-BM-140
Send protected fields :
- tenantId ;
- status PUBLISHED ;
- validatedBy ;
- internal IDs.

Expected :
- ignored/rejected based contract.

---

# 16. RLS if enabled

Direct DB Tenant A:
- cannot read/write BM rows Tenant B.

---

# 17. E2E Security

```text
Login Tenant A
↓
Create Application A
↓
Create Version
↓
Create Entity
↓
Validate
↓
Try GET Application B
↓
DENY
```

---

# 18. CI Blocking

At minimum :

```text
SEC-BM-001..003
SEC-BM-010..012
SEC-BM-020..022
SEC-BM-040
SEC-BM-060..063
SEC-BM-070..071
SEC-BM-090..092
SEC-BM-100
SEC-BM-120..122
```

---

# 19. Security DoD

- cross-tenant blocked ;
- contracts protected ;
- no fail-open TenantResource ;
- PUBLISHED immutable ;
- forged audit fields blocked ;
- consumer contracts tenant-safe ;
- security suite green.
