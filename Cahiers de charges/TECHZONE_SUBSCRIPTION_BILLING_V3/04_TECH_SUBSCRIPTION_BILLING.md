# TECH — SUBSCRIPTION & BILLING

**Stack :** NestJS/legacy services + Prisma/PostgreSQL + React/Vite

---

# 1. Audit first

Locate:
- Plan
- Subscription
- Invoice
- Payment
- Entitlement
- Quota
- Usage/Meter
- frontend services/pages.

Preserve working code.

---

# 2. Money Type

Never use JS floating-point as financial authority.

Preferred:
```ts
amountMinor: bigint | number-safe-range
currency: string
```

Or Prisma Decimal with explicit serialization.

---

# 3. Price Snapshot

Invoice line stores immutable financial values.

Do not recalculate historical invoice from current price.

---

# 4. Entitlement Resolver

Central service:

```ts
resolveEffectiveEntitlements(tenantId)
```

Sources:
- active subscription
- plan
- limits
- controlled overrides
- lifecycle.

---

# 5. Entitlement Cache

Cache key tenant.

Invalidate on lifecycle/plan/payment changes.

---

# 6. Module Guard

Create/reuse:
```text
RequireEntitlement
```

Must compose with IAM, not replace it.

---

# 7. Subscription State Machine

Centralize valid transitions.

Reject direct arbitrary status updates.

---

# 8. Invoice Generator

Inputs:
- subscription
- billing period
- price snapshot
- usage snapshot if enabled
- adjustments.

Use transaction.

---

# 9. Invoice Number

Generate unique immutable number according chosen strategy.

---

# 10. Payment Service

Never trust:
- client amount
- client currency
- client status.

Server loads invoice and provider result.

---

# 11. Manual Payments

Separate endpoint/command and permission.

Server-controlled `createdBy`.

---

# 12. Payment Provider

Interface:
```ts
createPayment
getPayment
verifyWebhook
refund?
```

Provider adapter encapsulates secrets.

---

# 13. Webhook Handler

Requirements:
- raw body if signature scheme needs it ;
- verify signature before state mutation ;
- event dedup ;
- transaction ;
- audit.

---

# 14. Reconciliation

Compare:
```text
invoiceId/reference
amount
currency
provider status
tenant/customer mapping
```

---

# 15. Idempotency

Unique provider event/payment identifiers.

Usage also unique via idempotency key.

---

# 16. Quota

Atomic/consistent usage aggregation.

Avoid race allowing limit bypass.

---

# 17. Usage Ingestion

Endpoint/internal event accepts:
- meter
- quantity
- idempotency key
- source.

Tenant from trusted context.

---

# 18. Renewal Job

Persist/claim renewal operation to avoid double invoice in multi-instance.

---

# 19. Suspension Job

Idempotent.

Never deletes tenant/business records.

---

# 20. ERP Bridge

Use Integration Hub contract.

No direct Dolibarr client in Billing.

---

# 21. Events

Examples:
```text
billing.subscription.activated
billing.invoice.issued
billing.payment.succeeded
billing.payment.failed
billing.subscription.suspended
billing.subscription.reactivated
```

Use existing event/outbox if present.

---

# 22. Error Contract

Stable codes.

No provider secrets/error raw dumps.

---

# 23. Audit

Financial audit append-only where possible.

Avoid destructive delete.

---

# 24. Prisma

Models may include:
- BillingPlan
- BillingPrice
- Subscription
- Entitlement
- UsageRecord
- Invoice
- InvoiceLine
- Payment
- PaymentAttempt
- BillingAdjustment.

Reuse existing names.

---

# 25. Indexes

Important:
- tenantId
- subscription status
- invoice number
- invoice status/dueAt
- providerPaymentId
- usage idempotency
- webhook event id.

---

# 26. Tests

Use deterministic clock for billing cycles.

Money/currency fixtures.

Postgres integration for unique/idempotency constraints.

---

# 27. CI

Run:
- Prisma validate
- billing unit
- integration Postgres
- security
- frontend tests
- build.

---

# 28. Commit Plan

```text
fix(billing): standardize money and currency handling
fix(billing): centralize subscription lifecycle
feat(billing): complete entitlement resolver and cache invalidation
feat(billing): enforce tenant quotas and usage idempotency
fix(billing): make invoice generation deterministic
fix(billing): secure payment reconciliation and webhook idempotency
feat(billing-ui): connect tenant billing workspace to real services
test(billing): add cross tenant financial security coverage
```

---

# 29. Technical DoD

- safe money
- tenant scope
- state machine
- entitlement + IAM
- idempotency
- historical financial integrity
- provider secrets safe
- real/manual/mock clear
- tests/build green.
