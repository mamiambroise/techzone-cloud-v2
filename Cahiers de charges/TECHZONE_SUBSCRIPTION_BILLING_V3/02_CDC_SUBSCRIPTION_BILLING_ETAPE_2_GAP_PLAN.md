# CAHIER DES CHARGES — SUBSCRIPTION & BILLING
## Étape 2 — État réel, Gap Matrix et plan

**Audit disponible :** historique repository  
**État :** backend actif, frontend/integrations à certifier.

---

# 1. Verdict

```text
🟡 Backend Subscription/Billing présent.
Intégration frontend et paiements réels non certifiés.
```

---

# 2. KEEP confirmé

Audit historique identifie :

```text
plan
subscription
invoice
payment
entitlement
quota
```

avec persistance Prisma.

Décision :
`KEEP + VERIFY`.

---

# 3. Attention

L’existence des services/tables ne prouve pas :
- paiement provider réel ;
- webhook réel ;
- invoice lifecycle correct ;
- entitlement gating effectif ;
- frontend connecté.

---

# 4. Frontend

Audit historique :
```text
frontend integration incomplete
```

Décision :
`COMPLETE`.

---

# 5. Gap Matrix

| Domaine | Cible | Existant | État | Décision | Priorité |
|---|---|---|---|---|---|
| Plans | réel | présent | à certifier | KEEP/TEST | P1 |
| Prices | money-safe | à auditer | inconnu | AUDIT | P1 |
| Subscription | lifecycle | présent | à certifier | KEEP/COMPLETE | P1 |
| Entitlements | resolver | présent/à auditer | partiel | COMPLETE | P1 |
| Quotas | réel | présent | à certifier | TEST | P1 |
| Usage | metering | à auditer | inconnu | AUDIT | P2 |
| Invoice | réel | présent | à certifier | KEEP/TEST | P1 |
| Payment | real/manual explicit | présent | real unknown | FIX/CERTIFY | P1 |
| Webhooks | verified/idempotent | à auditer | inconnu | IMPLEMENT/COMPLETE | P1 |
| Renewal | réel | à auditer | inconnu | COMPLETE | P1 |
| Grace | réel | à auditer | inconnu | COMPLETE | P1 |
| Suspension | no deletion | à auditer | inconnu | TEST | P1 |
| Frontend Tenant | connected | incomplete | faible | COMPLETE | P1 |
| Platform Admin | secure | backend active | UI unknown | COMPLETE | P2 |
| ERP | via Hub | à vérifier | inconnu | TEST | P2 |

---

# 6. LOT BILL-0 — Inventory

Inspecter :
- Prisma models ;
- plan service ;
- subscription service ;
- entitlement resolver ;
- quota ;
- invoice ;
- payment ;
- routes ;
- frontend.

---

# 7. LOT BILL-1 — Money

Auditer tous montants.

Éliminer float unsafe.

Standardiser :
```text
amountMinor + currency
```
ou Decimal maîtrisé.

---

# 8. LOT BILL-2 — Plan / Price

Valider lifecycle et historical pricing.

---

# 9. LOT BILL-3 — Subscription Lifecycle

Tester transitions valides et invalides.

---

# 10. LOT BILL-4 — Entitlement Resolver

Centraliser effective entitlements.

Cache + invalidation.

---

# 11. LOT BILL-5 — Module Gating

Connecter :
```text
Entitlement AND IAM
```
sur modules concernés.

---

# 12. LOT BILL-6 — Quotas

Auditer quota enforcement serveur.

---

# 13. LOT BILL-7 — Usage

Si activé :
- persistent ;
- idempotent ;
- aggregated.

---

# 14. LOT BILL-8 — Invoice

Snapshot price/period.

Calcul explicable.

---

# 15. LOT BILL-9 — Payment Modes

Classer :
```text
REAL
MANUAL
MOCK
```

Interdire faux REAL.

---

# 16. LOT BILL-10 — Payment Idempotency

Duplicate confirmation/webhook must not duplicate payment.

---

# 17. LOT BILL-11 — Webhooks

Signature, replay, amount/currency check.

---

# 18. LOT BILL-12 — Grace/Suspension

Implement/test state transitions.

No deletion.

---

# 19. LOT BILL-13 — Reactivation

Payment verified → active → entitlement cache invalidation.

---

# 20. LOT BILL-14 — ERP

Invoice export/accounting only through Integration Hub.

---

# 21. LOT BILL-15 — Tenant UI

Complete:
- overview ;
- plan ;
- usage ;
- invoices ;
- payments ;
- settings.

---

# 22. LOT BILL-16 — Platform UI

Plans/prices/subscriptions/diagnostics.

---

# 23. LOT BILL-17 — Security Tests

Cross-tenant financial suite + webhook/payment tampering.

---

# 24. LOT BILL-18 — E2E

Subscription, billing, failed payment, reactivation, quota.

---

# 25. Production blockers

Do not release if:
- floats for money uncontrolled ;
- tenant can access invoice other tenant ;
- entitlement only frontend ;
- mock payment marked real ;
- duplicate webhook duplicates payment ;
- amount/currency from provider not verified ;
- suspension deletes data ;
- no financial audit.

---

# 26. Recommended Order

```text
BILL-0 Inventory
↓
BILL-1 Money
↓
BILL-2 Plan/Price
↓
BILL-3 Lifecycle
↓
BILL-4 Entitlements
↓
BILL-5 Module Gating
↓
BILL-6 Quotas
↓
BILL-7 Usage
↓
BILL-8 Invoice
↓
BILL-9 Payment Modes
↓
BILL-10 Idempotency
↓
BILL-11 Webhooks
↓
BILL-12 Grace/Suspend
↓
BILL-13 Reactivate
↓
BILL-14 ERP
↓
BILL-15 Tenant UI
↓
BILL-16 Platform UI
↓
BILL-17 Security
↓
BILL-18 E2E
```
