# CAHIER DES CHARGES — OBSERVABILITY TRANSVERSAL
## Étape 2 — État réel, Gap Matrix et plan

**Audit disponible :** historique repository  
**Priorité :** P1

---

# 1. Verdict

```text
🟡 Backend observability/security partiel.
🔴 Frontend observability principalement mock.
```

---

# 2. KEEP confirmé

Historique :
- routes/services observability ;
- logs ;
- audit ;
- security events ;
- alerts ;
- certains événements persistés ;
- infrastructure de trace IDs présente dans le backend principal.

Décision :
`KEEP + CONSOLIDATE`.

---

# 3. Frontend Mock

Routes :

```text
/observability/logs
/observability/audit
/observability/security-events
/observability/monitoring
/observability/alerts
```

utilisent historiquement :

```text
logsMock
auditMock
securityEventsMock
monitoringMock
alertsMock
```

Décision :
`REPLACE WITH REAL APIs`.

---

# 4. Fake Monitoring Risk

Audit mentionne :
```text
données fixes pour monitoring
PARTIAL / MOCK
```

Interdit en REAL.

---

# 5. Trace IDs

Backend global a déjà des trace IDs.

À vérifier :
- propagation frontend → backend ;
- internal calls ;
- Data Runtime ;
- Automation ;
- Integration ;
- Deployment ;
- Billing.

---

# 6. Gap Matrix

| Domaine | Cible | Existant | État | Décision | Priorité |
|---|---|---|---|---|---|
| Trace ID | end-to-end | partiel | à compléter | COMPLETE | P1 |
| Logs | structurés | présent | partiel | HARDEN | P1 |
| Redaction | no secret | à auditer | risque | COMPLETE | P1 |
| Metrics | réelles | partiel/mock | faible | IMPLEMENT/CONNECT | P1 |
| Health | réel | partiel | inconnu | COMPLETE | P1 |
| Traces | distribué | à auditer | inconnu | AUDIT | P2 |
| Audit | persistant | partiel | bon/partiel | COMPLETE | P1 |
| Security events | réel | backend partiel/UI mock | partiel | CONNECT | P1 |
| Alerts | réel | backend/mock UI | partiel | COMPLETE | P1 |
| Incidents | target | à auditer | inconnu | IMPLEMENT | P2 |
| Diagnostics | multiple modules | dispersé | partiel | AGGREGATE | P1 |
| Retention | policy | à auditer | inconnu | IMPLEMENT | P2 |
| Frontend | real data | mock | mauvais | FIX | P1 |
| Tenant isolation | strict | à tester | inconnu | TEST | P1 |

---

# 7. LOT OBS-0 — Inventory

Inspecter :
- loggers ;
- interceptors ;
- filters ;
- trace middleware ;
- audit ;
- security events ;
- metrics ;
- health ;
- alerts ;
- diagnostics ;
- frontend mocks.

---

# 8. LOT OBS-1 — Contracts

Standardiser :
- log event ;
- audit ;
- metric ;
- health ;
- security event ;
- alert ;
- diagnostic.

---

# 9. LOT OBS-2 — Trace Context

Propager :
```text
traceId
requestId
correlationId
```

dans tous modules.

---

# 10. LOT OBS-3 — Structured Logging

Centraliser fields et levels.

---

# 11. LOT OBS-4 — Redaction

Implement/test filters for:
- tokens
- secrets
- credentials
- passwords
- DB URL.

---

# 12. LOT OBS-5 — Metrics

Brancher vraies métriques.

Retirer données statiques.

---

# 13. LOT OBS-6 — Health

Real health endpoints + dependency health.

---

# 14. LOT OBS-7 — Audit

Consolider persistence + immutable semantics.

---

# 15. LOT OBS-8 — Security Events

Connect IAM/Admin/API signals.

---

# 16. LOT OBS-9 — Alerts

Rules + dedup + status lifecycle.

---

# 17. LOT OBS-10 — Incidents

Si absent, implémenter lightweight incident tracking.

---

# 18. LOT OBS-11 — Diagnostics Aggregation

Adapters par module.

---

# 19. LOT OBS-12 — Retention

Policies + cleanup jobs.

---

# 20. LOT OBS-13 — Frontend

Replace mocks in:
- logs
- audit
- security events
- monitoring
- alerts.

---

# 21. LOT OBS-14 — Tenant Security

Cross-tenant searches and exports.

---

# 22. LOT OBS-15 — E2E

Trigger known failure:
```text
request
→ error
→ log
→ trace
→ metric
→ alert
→ diagnostic
```

---

# 23. Production blockers

Ne pas release si :
- frontend shows mock monitoring in REAL ;
- secrets can appear in logs ;
- cross-tenant search possible ;
- alerts based on fake metrics ;
- trace IDs lost between core modules ;
- diagnostics expose credentials ;
- observability outage breaks business flow.

---

# 24. Order

```text
OBS-0 Inventory
↓
OBS-1 Contracts
↓
OBS-2 Trace Context
↓
OBS-3 Logs
↓
OBS-4 Redaction
↓
OBS-5 Metrics
↓
OBS-6 Health
↓
OBS-7 Audit
↓
OBS-8 Security Events
↓
OBS-9 Alerts
↓
OBS-10 Incidents
↓
OBS-11 Diagnostics
↓
OBS-12 Retention
↓
OBS-13 Frontend
↓
OBS-14 Security
↓
OBS-15 E2E
```
