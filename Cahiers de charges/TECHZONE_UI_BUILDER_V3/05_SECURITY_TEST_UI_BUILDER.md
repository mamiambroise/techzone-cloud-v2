# SECURITY TEST — TECHZONE CLOUD UI BUILDER

**Priority :** P1

---

# 1. Tenant Isolation

## SEC-UI-001
Tenant A reads UI Definition B.

Expected:
- DENY.

## SEC-UI-002
Tenant A edits Page B.

DENY.

## SEC-UI-003
Tenant A clones Form B.

DENY.

---

# 2. Application Version

## SEC-UI-010
Use applicationVersionId from another Tenant.

DENY.

## SEC-UI-011
Page belongs to different ApplicationVersion.

DENY.

---

# 3. Permissions

## SEC-UI-020
Read-only user tries page update.

403.

## SEC-UI-021
User without theme write edits Theme.

403.

---

# 4. Component Registry

## SEC-UI-030
Unknown component type.

Expected:
- controlled validation error ;
- no arbitrary component import.

## SEC-UI-031
Malicious component type/path.

Rejected.

---

# 5. Props Injection

## SEC-UI-040
Inject event handler/code string into props.

Expected:
- not executed ;
- rejected/sanitized by schema.

## SEC-UI-041
Inject dangerous HTML into text component.

Expected:
- sanitized/escaped according component contract.

---

# 6. Binding Security

## SEC-UI-050
Binding references Entity from another Tenant.

Validation fails.

## SEC-UI-051
Binding requests field not permitted by Data Contract.

Validation fails/Runtime denies.

---

# 7. CALL_API

## SEC-UI-060
Arbitrary external URL.

Expected:
- rejected unless registered contract.

## SEC-UI-061
Custom Authorization header stored in UI Definition.

Rejected/no secret storage.

---

# 8. Automation Reference

## SEC-UI-070
Workflow ref from another Tenant.

DENY/invalid.

---

# 9. Permission Visibility

## SEC-UI-080
Hide button by frontend but call action directly.

Backend authorization must still deny.

---

# 10. Deep Links

## SEC-UI-090
Direct URL to Page B cross-tenant.

DENY.

## SEC-UI-091
Invalid/deleted page.

Controlled fallback/404, no crash.

---

# 11. Callback Regression

## SEC-UI-100
Change BmSelect.

Expected:
- no runtime exception.

## SEC-UI-101
Search Page.

Expected:
- no `event.target.value` crash.

---

# 12. Snapshot

## SEC-UI-110
Snapshot AppVersion differs from PackVersion AppVersion.

Pack validation/runtime blocks.

## SEC-UI-111
Modify immutable snapshot.

Denied/integrity failure.

---

# 13. Runtime Renderer

## SEC-UI-120
Unknown component in published snapshot.

Runtime fails safely.

## SEC-UI-121
Blocked Pack Runtime tries render UI.

No render.

---

# 14. Secret Leakage

## SEC-UI-130
Inspect UI Definition/Theme/Actions.

No DB/API/ERP secrets.

---

# 15. Mass Assignment

## SEC-UI-140
Client sends:
- tenantId ;
- createdBy ;
- snapshot hash ;
- READY/PUBLISHED-like status.

Server rejects/ignores protected fields.

---

# 16. E2E Security

```text
Login Tenant A
→ UI Builder AppVersion A
→ Create Page
→ Bind Product
→ Preview
→ Validate
→ Try open Page B
→ DENY
```

---

# 17. CI Blocking

At minimum:

```text
SEC-UI-001..003
SEC-UI-010..011
SEC-UI-020..021
SEC-UI-030..031
SEC-UI-040..041
SEC-UI-050..051
SEC-UI-060..061
SEC-UI-090..101
SEC-UI-110..121
SEC-UI-130
```

---

# 18. Security DoD

- tenant isolation ;
- no arbitrary component/code ;
- safe props/actions ;
- bindings validated ;
- deep links secure ;
- callback regression fixed ;
- runtime respects Pack gate ;
- no secrets ;
- tests green.
