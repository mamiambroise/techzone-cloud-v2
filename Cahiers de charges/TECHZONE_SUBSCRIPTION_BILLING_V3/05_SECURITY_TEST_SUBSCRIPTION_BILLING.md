# SECURITY TEST — SUBSCRIPTION & BILLING

---

# 1. Tenant Isolation

## SEC-BILL-001
Tenant A reads Subscription B.
Expected: DENY.

## SEC-BILL-002
Tenant A reads Invoice B.
DENY.

## SEC-BILL-003
Tenant A reads Payment B.
DENY.

## SEC-BILL-004
Tenant A reads Usage B.
DENY.

---

# 2. Forged Tenant

## SEC-BILL-010
Send tenantId B in payload.
Server ignores/rejects.

---

# 3. Plan Administration

## SEC-BILL-020
Tenant user tries create/update global Plan.
403.

---

# 4. Entitlement Bypass

## SEC-BILL-030
Tenant has no Automation entitlement but user has IAM permission.
Feature blocked commercially.

## SEC-BILL-031
Tenant has entitlement but user lacks IAM permission.
403.

---

# 5. Frontend-only Gate

## SEC-BILL-040
Call protected backend directly despite hidden UI.
Backend must enforce entitlement/IAM.

---

# 6. Money Tampering

## SEC-BILL-050
Client sends lower payment amount.
Server does not trust it.

## SEC-BILL-051
Currency mismatch.
Reject/reconciliation fails.

---

# 7. Manual Payment

## SEC-BILL-060
User without billing.payment.manual.
403.

## SEC-BILL-061
Manual payment actor forged in body.
Server principal wins.

---

# 8. Duplicate Payment

## SEC-BILL-070
Same provider payment twice.
One logical payment.

---

# 9. Webhook

## SEC-BILL-080
Invalid signature.
Reject.

## SEC-BILL-081
Replay same event.
Deduplicate.

## SEC-BILL-082
Valid signature but amount mismatch.
Do not mark invoice paid.

## SEC-BILL-083
Currency mismatch.
Reject.

---

# 10. Usage

## SEC-BILL-090
Duplicate usage event.
Count once.

## SEC-BILL-091
Concurrent usage near hard quota.
Cannot bypass policy via race.

---

# 11. Invoice Integrity

## SEC-BILL-100
Change plan price after invoice issue.
Historical invoice unchanged.

## SEC-BILL-101
Modify PAID invoice lines without adjustment mechanism.
Reject.

---

# 12. Suspension

## SEC-BILL-110
Suspension operation deletes tenant/business data.
Test must fail if any deletion.

---

# 13. Reactivation

## SEC-BILL-120
Unverified payment attempts reactivation.
DENY.

---

# 14. Provider Secrets

## SEC-BILL-130
Responses/logs/diagnostics.
No secret/token.

---

# 15. Mock Provider

## SEC-BILL-140
REAL environment silently uses mock and marks paid.
Must fail.

---

# 16. Quota

## SEC-BILL-150
Hard limit reached.
Server denies guarded operation.

---

# 17. Cross-Currency

## SEC-BILL-160
Apply payment currency A to invoice currency B.
Reject unless explicit FX workflow exists.

---

# 18. E2E Security

```text
Tenant A Invoice
→ Tenant B request
→ DENY
```

```text
Webhook tampered amount
→ payment not confirmed
→ invoice not paid
→ subscription state unchanged
```

---

# 19. CI Blocking

Block on:
- cross tenant
- entitlement bypass
- money/currency tampering
- duplicate payment
- webhook replay/signature
- secret leakage
- mock REAL
- suspension deletion.

---

# 20. Security DoD

Critical financial/tenant tests green.
