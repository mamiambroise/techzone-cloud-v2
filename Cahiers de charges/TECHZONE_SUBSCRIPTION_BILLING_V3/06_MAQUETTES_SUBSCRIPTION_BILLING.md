# MAQUETTES — SUBSCRIPTION & BILLING

# M01 — Subscription Overview
Cards:
- Current Plan
- Status
- Next Renewal
- Amount Due
- Usage Alert
- Last Payment

# M02 — Current Plan
Plan/price/cycle/renewal/entitlements.

# M03 — Entitlements
Capability cards with Enabled/Limit/Usage.

# M04 — Usage Overview
Progress bars by meter.

# M05 — Usage Detail
Period, records summary, quota, reset.

# M06 — Quota Warning
90% amber.

# M07 — Quota Reached
100% policy state.

# M08 — Invoices List
Number/period/issued/due/total/status.

# M09 — Invoice Detail
Lines + totals + payments + timeline.

# M10 — Invoice Line Detail
Source/period/quantity/unit/total.

# M11 — Payments List
Invoice/amount/mode/provider/status/date.

# M12 — Payment Detail
Reference/provider/status/reconciliation/audit.

# M13 — Manual Payment
Admin modal with amount/currency/reference.

# M14 — Past Due
Banner + due invoice + grace deadline.

# M15 — Grace Period
Countdown + policy + payment CTA/info.

# M16 — Suspended Subscription
Critical state + data preserved notice.

# M17 — Reactivated
Success state + restored entitlements.

# M18 — Cancel Subscription
Immediate/end-period options.

# M19 — Upgrade Plan
Compare plans + next-period effect.

# M20 — Downgrade Plan
Impact on entitlements/limits.

# M21 — Billing Settings
Legal name/email/address/tax ID.

# M22 — Product Catalog Admin
Products/plans/status.

# M23 — Plans Admin
Plan/prices/subscribers/status.

# M24 — Plan Detail
General/prices/entitlements/limits/history.

# M25 — Create Plan
Key/name/product/status.

# M26 — Price List
Currency/amount/cycle/validity.

# M27 — Price Editor
Money-safe fields.

# M28 — Entitlement Editor
Key/type/value/limit.

# M29 — Limits Editor
Meter/limit/policy.

# M30 — Tenant Subscription Admin
Tenant/plan/status/period/due.

# M31 — Subscription Detail Admin
Lifecycle, entitlements, invoices, payments.

# M32 — Invoice Generation Review
Period/price snapshot/usage/adjustments.

# M33 — Credit / Adjustment
Controlled financial correction.

# M34 — Payment Provider Status
REAL/MANUAL/MOCK visible.

# M35 — Webhook Deliveries
Provider/event/status/reconciliation.

# M36 — Billing Diagnostics
Plans, entitlement, usage, invoice, payment, ERP.

# M37 — Financial Audit
Actor/action/object/amount/date.

# M38 — ERP Bridge
Billing → Integration Hub → ERP status.

# M39 — Mobile Billing
Plan/usage/invoices/payment cards.

# M40 — Lifecycle Flow

```text
ACTIVE
↓
INVOICE
↓
PAYMENT
├── SUCCESS → ACTIVE
└── FAILED → PAST_DUE → GRACE → SUSPENDED
                               ↓
                         VERIFIED PAYMENT
                               ↓
                           REACTIVATE
```

---

# Visual Direction

- Techzone Cloud premium
- dark navy sidebar
- very light workspace
- blue/indigo billing accent
- green ACTIVE/PAID
- amber DUE/GRACE
- red FAILED/SUSPENDED
- white rounded cards
- clean financial tables
- explicit currency
- Lucide icons
- responsive
- no fake financial metrics/status
