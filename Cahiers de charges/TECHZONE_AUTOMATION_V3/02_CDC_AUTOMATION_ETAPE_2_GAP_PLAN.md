# CAHIER DES CHARGES — AUTOMATION
## Étape 2 — État réel, Gap Matrix et plan de consolidation

**Audit :** octobre 2026  
**Commit notable :** `dd68059e`  
**Priorité :** P1

---

# 1. État global

```text
🔴 Démonstrateur fonctionnel,
non prêt pour production multi-tenant.
```

---

# 2. KEEP

Déjà bon :

- endpoints Automation existants ;
- workflows ;
- rules ;
- triggers ;
- actions ;
- history ;
- frontend sur `/api/automation/*` ;
- workflow/rule engines réellement exécutables en mémoire ;
- une partie du contexte dérivée du principal IAM ;
- tests unitaires présents.

Décision :

```text
KEEP + REPLATFORM PERSISTENCE
```

---

# 3. P1 — Global Maps

État :

```text
workflows
rules
executions
history
→ global Map in process
```

Risques :
- données perdues au restart ;
- cross-tenant ;
- multi-instance impossible ;
- historique non fiable.

Décision :

```text
FIX
```

---

# 4. P1 — no tenant filtering

List/read/update ne filtrent pas systématiquement par tenant.

Décision :

```text
FIX IMMEDIATELY
```

---

# 5. P1 — simulate permission

Route :

```text
POST /rules/simulate
```

sans permission dédiée.

Décision :

```text
FIX
```

---

# 6. P1 — frontend Bell crash

`AutomationWorkflows.jsx` utilise :

```jsx
<Bell />
```

sans import.

Décision :

```text
FIX
```

---

# 7. P2 — MockAutomation

Mock présent.

Décision :

```text
ISOLATE DEV/TEST ONLY
```

---

# 8. Gap Matrix

| Domaine | Cible | Existant | État | Décision | Priorité |
|---|---|---|---|---|---|
| Workflows | persistés | Map | dangereux | FIX | P1 |
| Rules | persistées | Map | dangereux | FIX | P1 |
| Executions | persistées | Map | dangereux | FIX | P1 |
| History | durable | Map | dangereux | FIX | P1 |
| Tenant filtering | strict | incomplet | dangereux | FIX | P1 |
| IAM context | serveur | partiel | bon/partiel | KEEP/COMPLETE | P1 |
| Simulate permission | dédiée | absente | risque | FIX | P1 |
| Trigger engine | réel | oui | bon | KEEP | P2 |
| Rule engine | réel | oui | bon | KEEP | P2 |
| Workflow engine | réel | oui | bon | KEEP | P2 |
| Retry/idempotency | cible | à auditer | partiel | COMPLETE | P1 |
| Schedules | durable | à auditer | partiel | COMPLETE | P1 |
| Frontend workflows | stable | Bell cassé | cassé | FIX | P1 |
| Mock | dev/test | présent | risque | ISOLATE | P2 |
| Cross-tenant tests | requis | absent | manque | IMPLEMENT | P1 |
| Restart tests | requis | absent | manque | IMPLEMENT | P1 |

---

# 9. LOT AUTO-0 — Audit

Inspecter :
- workflow engine ;
- automation controller ;
- rules ;
- triggers ;
- history ;
- frontend ;
- Prisma ;
- tests ;
- mocks.

---

# 10. LOT AUTO-1 — Prisma Models

Créer/réutiliser modèles :

```text
AutomationDefinition
Workflow
WorkflowVersion
WorkflowNode
WorkflowEdge
Rule
Trigger
Schedule
WorkflowExecution
WorkflowStepExecution
IdempotencyRecord
```

Seulement après audit réel.

---

# 11. LOT AUTO-2 — Persistence Layer

Remplacer Maps comme source principale par repositories Prisma.

Mémoire éventuellement cache.

---

# 12. LOT AUTO-3 — Tenant Scope

Toutes queries :

```text
tenantId from principal/context
```

Jamais tenant frontend autoritaire.

---

# 13. LOT AUTO-4 — IAM Permissions

Appliquer :
- read ;
- write ;
- simulate ;
- test ;
- retry ;
- cancel ;
- schedule ;
- diagnostics.

---

# 14. LOT AUTO-5 — Simulation

Séparer simulation de real execution.

No side effects externes.

---

# 15. LOT AUTO-6 — Workflow Engine Persistence

Execution state écrit en DB.

Step history persistée.

---

# 16. LOT AUTO-7 — Restart Recovery

Tester redémarrage :
- definitions survive ;
- history survive ;
- pending/running policy explicite ;
- retries récupérables.

---

# 17. LOT AUTO-8 — Idempotency / Retry

Ajouter/renforcer :
- keys ;
- attempt count ;
- backoff ;
- retryable classification.

---

# 18. LOT AUTO-9 — Scheduler

Rendre schedules tenant-scoped et persistés.

Éviter duplication après restart.

---

# 19. LOT AUTO-10 — Data Runtime

Actions métier passent par Data Runtime.

No direct uncontrolled Prisma access.

---

# 20. LOT AUTO-11 — Integration Hub

ERP/external actions passent via contracts.

Mocks interdits en REAL.

---

# 21. LOT AUTO-12 — Pack Runtime

Pour workflows du Pack publié :
- require executable context ;
- blocked runtime → block automation.

---

# 22. LOT AUTO-13 — Frontend

Corriger import `Bell`.

Puis vérifier :
- cockpit ;
- rules ;
- workflows ;
- triggers ;
- history ;
- diagnostics.

---

# 23. LOT AUTO-14 — Security

Ajouter :
- cross-tenant ;
- simulate permission ;
- restart ;
- mock prod ;
- arbitrary expression ;
- SSRF ;
- secret leakage.

---

# 24. LOT AUTO-15 — E2E

Tester :
- event trigger ;
- rule ;
- workflow ;
- Data action ;
- Integration action ;
- history.

---

# 25. Production blockers

Production interdite si :

- Map globale source de vérité ;
- lists non tenant-filtered ;
- simulation sans permission ;
- history volatile ;
- schedule perdu au restart ;
- MockAutomation fallback ;
- frontend workflow route crash ;
- cross-tenant tests rouges.

---

# 26. Ordre recommandé

```text
AUTO-0 Audit
↓
AUTO-1 Prisma
↓
AUTO-2 Persistence
↓
AUTO-3 Tenant Scope
↓
AUTO-4 IAM
↓
AUTO-5 Simulation
↓
AUTO-6 Execution Persistence
↓
AUTO-7 Restart
↓
AUTO-8 Idempotency/Retry
↓
AUTO-9 Scheduler
↓
AUTO-10 Data Runtime
↓
AUTO-11 Integration Hub
↓
AUTO-12 Pack Runtime
↓
AUTO-13 Frontend
↓
AUTO-14 Security Tests
↓
AUTO-15 E2E
```
