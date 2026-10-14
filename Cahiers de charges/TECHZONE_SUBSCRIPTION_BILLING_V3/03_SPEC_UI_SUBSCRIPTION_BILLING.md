# SPEC UI — SUBSCRIPTION & BILLING

---

# 1. Design

Platform style :
- dark navy sidebar ;
- light workspace ;
- blue/indigo financial accent ;
- green paid/active ;
- amber due/grace ;
- red suspended/failed ;
- white cards ;
- responsive.

---

# 2. Navigation

Tenant:

```text
Abonnements
├── Vue d’ensemble
├── Offre actuelle
├── Utilisation
├── Factures
├── Paiements
└── Paramètres de facturation
```

Platform Admin:
- Products
- Plans
- Prices
- Subscriptions
- Billing Diagnostics.

---

# 3. Overview

Cards:
- Current Plan
- Subscription Status
- Next Renewal
- Amount Due
- Usage Alerts
- Last Payment.

---

# 4. Current Plan

Show:
- Plan
- Price
- Currency
- Billing Cycle
- Active Since
- Next Renewal
- Entitlements.

---

# 5. Entitlements

Cards/list:
- Automation
- Applications
- Users
- API quota
- Storage
- other configured capabilities.

---

# 6. Usage

Progress bars:
- consumed
- limit
- remaining
- reset date
- policy.

---

# 7. Usage Warning

90%:
- amber warning.

100%:
- display SOFT/HARD behavior.

---

# 8. Invoices

Table:
- Number
- Period
- Issued
- Due
- Total
- Paid
- Due
- Status.

---

# 9. Invoice Detail

Sections:
- Billing Account
- Lines
- Subtotal
- Discount
- Tax
- Total
- Payments
- Adjustments
- Timeline.

---

# 10. Payments

Table:
- Payment
- Invoice
- Amount
- Mode
- Method
- Status
- Confirmed
- Reference.

---

# 11. Manual Payment

Admin-only modal:
- Invoice
- Amount
- Currency
- Date
- Method
- Reference
- Note.

Strong audit notice.

---

# 12. Past Due

Banner:
```text
Paiement en retard
```

Show:
- due invoice
- grace end
- consequences.

---

# 13. Grace Period

Countdown + policy explanation.

---

# 14. Suspended

Critical banner:
- subscription suspended
- data preserved
- capabilities limited
- reactivation action/info.

---

# 15. Cancellation

Options:
- end period
- immediate if allowed.

Impact preview.

---

# 16. Upgrade/Downgrade

MVP:
- select plan
- effective next period
- no fake proration.

---

# 17. Billing Settings

Fields:
- Legal Name
- Billing Email
- Address
- Tax ID optional
- Default Currency if policy allows.

---

# 18. Platform Plan List

Columns:
- Plan
- Product
- Status
- Prices
- Subscribers
- Entitlements
- Updated.

---

# 19. Plan Editor

Tabs:
- General
- Prices
- Entitlements
- Limits
- History.

---

# 20. Price Editor

Fields:
- Currency
- Amount
- Cycle
- Valid From
- Valid To
- Status.

---

# 21. Subscription Admin

Search tenant.

Show:
- Plan
- Status
- Period
- Grace
- Amount Due
- Actions.

---

# 22. Diagnostics

Checks:
- plan/price
- entitlement resolution
- quota
- usage
- invoice
- payment provider
- webhooks
- ERP bridge.

---

# 23. States

Support:
```text
loading
empty
error
forbidden
unavailable
past_due
grace
suspended
paid
overdue
```

---

# 24. Responsive

Mobile:
- plan card
- usage bars
- invoice cards
- payment history
- alerts.

---

# 25. UI DoD

- no fake payment status ;
- amount/currency explicit ;
- plan/entitlement readable ;
- grace/suspend visible ;
- financial history clear ;
- admin controls permission-aware ;
- responsive.
