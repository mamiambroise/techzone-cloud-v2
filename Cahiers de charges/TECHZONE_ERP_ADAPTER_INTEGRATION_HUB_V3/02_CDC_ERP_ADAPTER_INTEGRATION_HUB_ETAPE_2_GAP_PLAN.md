# CAHIER DES CHARGES — ERP ADAPTER / INTEGRATION HUB
## Étape 2 — État réel, Gap Matrix et plan de consolidation

**Audit :** octobre 2026  
**Commit canonique :** `d226cb52`  
**Priorité :** P2 fonctionnel, P1 si ERP doit être utilisé immédiatement.

---

# 1. État global

```text
🟡 Implémentation réelle présente ;
connectivité ERP réelle non certifiée.
```

---

# 2. KEEP

Déjà bon :

- `DolibarrAdapter` réellement implémenté ;
- ERP Registry réel ;
- permissions ERP ;
- contexte tenant ;
- contrôleurs catalogue/resources/commands ;
- tests adapter présents ;
- Integration Hub architecture déjà documentée.

Décision :

```text
KEEP + CERTIFY
```

---

# 3. P1 — MockAdapter aussi enregistré

Risque :
- fallback mock ;
- faux succès ;
- environnement production non réel.

Décision :

```text
FIX CONFIGURATION
```

---

# 4. P1 — live connectivity non confirmée

Audit n’a effectué aucun appel ERP réel.

À confirmer :
- credentials ;
- base URL ;
- mappings ;
- pagination ;
- resources ;
- commands.

Décision :

```text
CERTIFY WITH SAFE STAGING TEST
```

---

# 5. P1 — ERPRegistry tenantId drift

Dérive Prisma/migration :
- type UUID vs varchar/text selon versions.

Décision :

```text
FIX WITH TENANT FOUNDATION
```

---

# 6. Risque singleton adapter

Des audits antérieurs ont relevé qu’un `DolibarrAdapter.configure()` sur singleton peut créer un risque de reconfiguration cross-tenant.

Décision :

```text
AUDIT CURRENT CODE
→ eliminate shared mutable tenant config
```

---

# 7. Gap Matrix

| Domaine | Cible | Existant | État | Décision | Priorité |
|---|---|---|---|---|---|
| DolibarrAdapter | réel | oui | bon | KEEP | P2 |
| Registry | tenant-aware | oui | bon | KEEP/TEST | P1 |
| Provider mode | strict | Mock + Real | risque | FIX | P1 |
| Live connectivity | certified | non testée | inconnu | TEST | P1 |
| Credentials | protected | présent/à certifier | partiel | VERIFY | P1 |
| SSRF | blocked | à auditer | inconnu | COMPLETE | P1 |
| Mappings | persisted | présent/à auditer | partiel | COMPLETE | P1 |
| External links | tenant-safe | à tester | partiel | FIX/TEST | P1 |
| Commands | real | présent | à certifier | TEST | P1 |
| Queries | real | présent | à certifier | TEST | P1 |
| Sync | traceable | partiel | à compléter | COMPLETE | P2 |
| Webhooks | secure | partiel | à compléter | COMPLETE | P2 |
| tenantId type | canonical | drift | mauvais | FIX | P1 |
| Integration tests | staging | absent | manque | IMPLEMENT | P1 |

---

# 8. LOT ERP-0 — Audit

Inspecter :
- erp-adapter.module ;
- service ;
- DolibarrAdapter ;
- MockAdapter ;
- ERPRegistry ;
- Integration module ;
- mappings ;
- credentials ;
- tests.

---

# 9. LOT ERP-1 — Prisma drift

Reconcile :
- Tenant.id type ;
- ERPRegistry.tenantId ;
- FK ;
- migration fresh/upgrade.

---

# 10. LOT ERP-2 — Provider Resolution

Ensure:

```text
tenant
→ integration instance
→ connector
→ adapter
```

No arbitrary query provider selection.

---

# 11. LOT ERP-3 — Adapter Isolation

Remove shared mutable tenant configuration.

Use per-instance client/factory or immutable config.

---

# 12. LOT ERP-4 — REAL/MOCK

Production:
- MOCK disabled ;
- startup/config validation ;
- visible mode.

---

# 13. LOT ERP-5 — Credentials

Verify:
- encrypted/ref storage ;
- no frontend ;
- no logs ;
- rotation support.

---

# 14. LOT ERP-6 — SSRF

Implement/audit URL safety and redirect policy.

---

# 15. LOT ERP-7 — Mapping

Validate:
- resource mapping ;
- field mapping ;
- same tenant ;
- supported fields ;
- transformation rules.

---

# 16. LOT ERP-8 — ExternalResourceLink

Enforce tenant relation at create/update/read.

---

# 17. LOT ERP-9 — Live Read Test

On staging Dolibarr:
- auth ;
- health ;
- GET Product/Customer safe ;
- pagination ;
- mapping.

Non-destructive.

---

# 18. LOT ERP-10 — Commands

Certify writes against dedicated staging fixture only.

Add idempotency.

---

# 19. LOT ERP-11 — Retry/Timeout

Verify real HTTP client:
- timeout ;
- 429 ;
- retry 5xx ;
- no retry validation error.

---

# 20. LOT ERP-12 — Sync

Persist SyncRuns/checkpoints.

Conflict policy explicit.

---

# 21. LOT ERP-13 — Webhooks

Signature/auth, replay/dedup, tenant mapping.

---

# 22. LOT ERP-14 — Data Runtime

Ensure Data Runtime uses official Integration Hub/provider.

No direct Dolibarr bypass.

---

# 23. LOT ERP-15 — Automation

Ensure ERP actions pass Integration Contract.

---

# 24. LOT ERP-16 — UI

Complete:
- Overview ;
- Instances ;
- Mapping ;
- Sync ;
- Webhooks ;
- Diagnostics ;
- REAL/MOCK badge.

---

# 25. LOT ERP-17 — Tests/CI

Add:
- cross-tenant ;
- live staging contract test ;
- SSRF ;
- secret leakage ;
- fresh DB ;
- upgrade DB.

---

# 26. Production blockers

Do not certify production if :

- Mock can fallback ;
- tenant adapter config can leak ;
- ERPRegistry drift unresolved ;
- credentials exposed ;
- arbitrary URLs ;
- no live safe connectivity test ;
- Data Runtime bypasses Hub ;
- cross-tenant tests fail.

---

# 27. Order

```text
ERP-0 Audit
↓
ERP-1 Prisma
↓
ERP-2 Provider Resolution
↓
ERP-3 Adapter Isolation
↓
ERP-4 REAL/MOCK
↓
ERP-5 Credentials
↓
ERP-6 SSRF
↓
ERP-7 Mapping
↓
ERP-8 External Links
↓
ERP-9 Live Read
↓
ERP-10 Commands
↓
ERP-11 Retry/Timeout
↓
ERP-12 Sync
↓
ERP-13 Webhooks
↓
ERP-14 Data Runtime
↓
ERP-15 Automation
↓
ERP-16 UI
↓
ERP-17 Tests/CI
```
