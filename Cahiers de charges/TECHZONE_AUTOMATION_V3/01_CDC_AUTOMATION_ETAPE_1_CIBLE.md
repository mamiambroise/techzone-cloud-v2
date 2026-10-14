# CAHIER DES CHARGES — TECHZONE CLOUD AUTOMATION
## Étape 1 — Cible fonctionnelle et architecturale

**Projet :** Techzone Cloud  
**Module :** Automation  
**Version cible :** 3.0  
**Statut :** Spécification cible  
**Principe :** consolider l’Automation existante en moteur de règles et workflows persistant, multi-tenant, déterministe, observable et sécurisé, sans contourner IAM, Data Runtime, Integration Hub ou Pack Runtime.

---

# 1. Objet

Automation répond à :

```text
QUE DOIT FAIRE AUTOMATIQUEMENT LE SYSTÈME
LORSQU’UN ÉVÉNEMENT OU UNE CONDITION SURVIENT ?
```

Il gère :

- Rules ;
- Workflows ;
- Workflow Versions ;
- Triggers ;
- Conditions ;
- Actions ;
- Variables ;
- Schedules ;
- Executions ;
- Step Executions ;
- Retry ;
- Idempotency ;
- History ;
- Diagnostics.

---

# 2. Position dans Techzone Cloud

```text
BUSINESS MANAGER
Entities • Fields • Events • Features • Permissions
        ↓
AUTOMATION
Rules
Workflows
Triggers
Conditions
Actions
Schedules
        ↓
PACK MANAGER
Automation Definition / Snapshot
        ↓
PACK RUNTIME
Effective Runtime Context
        ↓
AUTOMATION RUNTIME
        ├── Data Runtime
        ├── Integration Hub / ERP Adapter
        ├── Internal Services
        └── Notifications
```

---

# 3. Distinction avec Pack Runtime Rules

```text
PACK RUNTIME RULES
→ composition
→ activation
→ disponibilité
→ compatibilité
→ configuration

AUTOMATION RULES / WORKFLOWS
→ processus métier
→ triggers
→ conditions
→ actions
→ orchestration
→ historique métier
```

Ne jamais fusionner ces responsabilités.

---

# 4. Responsabilités

Automation possède :

- Automation Definition ;
- Workflow ;
- Workflow Version ;
- Rule ;
- Trigger ;
- Condition ;
- Action ;
- Schedule ;
- Execution ;
- Step Execution ;
- Retry state ;
- Idempotency state ;
- History ;
- Diagnostics ;
- execution policies.

---

# 5. Hors périmètre

Automation ne possède pas :

## Business Manager
- Entities ;
- Fields ;
- Relations ;
- Business Events definitions.

## Data Runtime
- repositories ;
- query engine ;
- transaction engine.

## Integration Hub
- credentials ;
- ERP connectors ;
- webhooks providers.

## Pack Manager
- Pack composition ;
- publication globale.

## Pack Runtime
- resolution globale ;
- Runtime Context global ;
- activation globale.

## IAM
- identité ;
- rôles ;
- permission registry.

---

# 6. Architecture fonctionnelle

```text
Automation
├── Vue d’ensemble
├── Workflows
├── Rules
├── Triggers
├── Conditions
├── Actions
├── Schedules
├── Executions
├── History
└── Diagnostics
```

---

# 7. Navigation

Dans :

```text
CONSTRUCTION
└── Automatisation
```

Sous-navigation :

```text
Vue d’ensemble
Workflows
Rules
Triggers
Actions
Executions
History
Diagnostics
```

Conditions peuvent rester dans l’éditeur plutôt qu’en menu principal.

---

# 8. Contexte obligatoire

Toute ressource est attachée à :

```text
Tenant
↓
Application
↓
Application Version
↓
Automation Definition
```

Et à l’exécution :

```text
Tenant
Application
ApplicationVersion
PackVersion
Environment
Runtime Context
WorkflowVersion
Execution
```

selon les contrats disponibles.

---

# 9. Automation Definition

Modèle conceptuel :

```text
AutomationDefinition
├── id
├── tenantId
├── applicationId
├── applicationVersionId
├── schemaVersion
├── status
├── workflows
├── rules
├── triggers
├── schedules
├── validationStatus
├── revision
├── createdAt
└── updatedAt
```

---

# 10. Workflow

Modèle conceptuel :

```text
Workflow
├── id
├── tenantId
├── applicationVersionId
├── key
├── name
├── description
├── status
├── activeVersionId?
├── metadata
├── createdBy
├── createdAt
└── updatedAt
```

---

# 11. Workflow Version

```text
WorkflowVersion
├── id
├── tenantId
├── workflowId
├── version
├── status
├── triggerDefinition
├── nodes
├── edges
├── variables
├── inputSchema
├── outputSchema
├── validationStatus
├── createdAt
└── updatedAt
```

Une version publiée/snapshotée est immuable.

---

# 12. Workflow Nodes

Types conceptuels :

```text
TRIGGER
CONDITION
RULE
ACTION
DELAY
BRANCH
DATA_QUERY
DATA_MUTATION
AUTOMATION_CALL
INTEGRATION_ACTION
NOTIFICATION
END
```

Les types exacts doivent provenir du Registry réel.

---

# 13. Workflow Edges

```text
id
workflowVersionId
sourceNodeId
targetNodeId
sourceHandle?
targetHandle?
condition?
```

Le graphe doit être validé.

---

# 14. Workflow Validation

Vérifier :

- un trigger valide ;
- nodes connus ;
- edges valides ;
- aucune référence cassée ;
- pas de boucle interdite ;
- actions supportées ;
- permissions ;
- Business Event references ;
- Data Contracts ;
- Integration Contracts ;
- runtime compatibility.

---

# 15. Rules

Une Rule est déclarative.

Exemple :

```text
IF
Order.total > 1_000_000
AND
Customer.status = ACTIVE
THEN
route = manager-approval
```

Pas de JavaScript arbitraire.

---

# 16. Condition Engine

Conditions structurées :

```text
field
operator
value
```

ou groupes :

```text
AND
OR
NOT
```

Allowlist opérateurs.

---

# 17. Formula Engine

Si formules supportées :

- parser contrôlé ;
- fonctions allowlistées ;
- pas de `eval()` ;
- pas d’accès filesystem/network arbitraire.

---

# 18. Determinisme

À définition, inputs et contexte identiques :

```text
Rule evaluation
→ same result
```

hors données explicitement dynamiques.

---

# 19. Trigger Registry

Types potentiels :

```text
BUSINESS_EVENT
MANUAL
SCHEDULE
WEBHOOK_EVENT
UI_ACTION
DATA_CHANGE
SYSTEM_EVENT
```

Ne retenir que ceux réellement implémentés.

---

# 20. Business Event Trigger

Business Manager fournit le Event Contract.

Automation référence :

```text
eventKey
eventVersion
payloadSchema
```

---

# 21. Manual Trigger

Réservé à :
- test ;
- admin ;
- operation explicite.

Permissions dédiées.

---

# 22. Schedules

Support conceptuel :

```text
CRON
ONCE
INTERVAL
```

Timezone explicite.

Aucune planification globale non tenant-scoped.

---

# 23. UI Trigger

UI Builder peut référencer :

```text
TRIGGER_AUTOMATION
```

avec inputs explicitement mappés.

---

# 24. Actions

Actions possibles :

```text
DATA_QUERY
DATA_CREATE
DATA_UPDATE
DATA_DELETE
TRIGGER_WORKFLOW
ERP_ACTION
INTEGRATION_ACTION
NOTIFICATION
DELAY
SET_VARIABLE
HTTP_REGISTERED_CONTRACT
```

Pas d’action arbitraire exécutant du code fourni par client.

---

# 25. Data Actions

Passent par Data Runtime.

Automation ne doit pas accéder directement à Prisma pour le métier si Data Runtime possède le contrat.

---

# 26. ERP Actions

Pipeline :

```text
Automation
↓
Integration Contract
↓
Integration Hub
↓
ERP Adapter
↓
Dolibarr
```

Aucun client ERP direct.

---

# 27. HTTP Actions

Si présentes :
- destination enregistrée ;
- SSRF protections ;
- no arbitrary URL ;
- no arbitrary Authorization header ;
- timeout ;
- retry policy.

---

# 28. Notification Actions

Via provider/Integration Hub :
- email ;
- SMS ;
- WhatsApp ;
- in-app.

Ne pas embarquer credentials dans workflow.

---

# 29. Variables

Scopes :

```text
INPUT
WORKFLOW
STEP
OUTPUT
CONTEXT
```

Contexte exposé via allowlist.

---

# 30. Runtime Context

Minimum :

```text
tenantId
identityId/userId
applicationId
applicationVersionId
packVersionId?
environmentId?
resolutionId?
runtimeContextId?
eventId?
executionId
traceId
permissions
authorized variables
```

---

# 31. Pack Runtime Gate

Pour workflows exécutés dans une application publiée :

```text
Pack Runtime Resolution = EXECUTABLE
```

peut être exigé selon le chemin d’exécution.

BLOCKED doit empêcher l’automation runtime liée au Pack.

---

# 32. Execution

Modèle conceptuel :

```text
WorkflowExecution
├── id
├── tenantId
├── applicationVersionId
├── workflowId
├── workflowVersionId
├── status
├── triggerType
├── triggerPayloadRef / sanitized payload
├── context
├── startedAt
├── finishedAt
├── duration
├── errorCode
├── errorMessage
├── traceId
└── idempotencyKey?
```

---

# 33. Step Execution

```text
WorkflowStepExecution
├── id
├── tenantId
├── executionId
├── nodeId
├── status
├── inputSanitized
├── outputSanitized
├── startedAt
├── finishedAt
├── duration
└── error
```

Attention aux données sensibles.

---

# 34. Execution Status

```text
PENDING
RUNNING
SUCCEEDED
FAILED
RETRYING
CANCELLED
TIMEOUT
BLOCKED
```

---

# 35. Persistence

Règle V3 :

```text
NO GLOBAL IN-MEMORY MAP
AS SOURCE OF TRUTH
```

Les définitions, règles, workflows, exécutions et historique doivent être persistés dans Prisma/PostgreSQL ou une infrastructure durable adaptée.

Mémoire possible uniquement comme cache.

---

# 36. Restart Safety

Après redémarrage backend :

- Workflows toujours présents ;
- Rules toujours présentes ;
- Schedules récupérables ;
- Execution history conservé ;
- running/retry state traité selon stratégie.

---

# 37. Tenant Isolation

Toute ressource :

```text
tenantId
```

ou relation tenant déterministe.

Tenant A ne voit/modifie/exécute jamais les ressources Tenant B.

---

# 38. Idempotency

Triggers/actions à effet de bord doivent supporter l’idempotence.

Scope :

```text
tenant
workflow
action
business operation
idempotency key
```

---

# 39. Retry

Retry policy :

```text
maxAttempts
backoff
retryable error classes
timeout
```

Éviter retry infini.

---

# 40. Timeout

Appliquer timeout :
- workflow ;
- step/action ;
- external request.

---

# 41. Circuit Breaker

Pour providers externes si infrastructure le supporte.

MVP peut documenter/implémenter un mécanisme simple.

---

# 42. Dead Letter / Recovery

Pour exécutions non récupérables :
- FAILED ;
- diagnostics ;
- possibilité retry contrôlé ;
- dead-letter concept si queue existe.

---

# 43. Loop Protection

Détecter :
- recursive workflow call ;
- event loop ;
- excessive step count ;
- excessive nested automation depth.

---

# 44. Concurrency

Définir :
- max executions ;
- per workflow ;
- per tenant ;
- per trigger ;
- queue/backpressure.

---

# 45. Execution Ordering

Si ordering requis :
- key/partition ;
- sequence ;
- explicit policy.

Ne pas supposer ordre global.

---

# 46. Simulation

Simulation doit :

- être permissionnée ;
- ne pas produire d’effets externes réels ;
- utiliser providers mock/sandbox explicites ;
- expliquer décisions ;
- masquer secrets.

---

# 47. Permission de simulation

Dédier :

```text
automation.simulate
```

ou équivalent Registry.

`POST /rules/simulate` ne doit pas être accessible simplement parce que l’utilisateur est authentifié.

---

# 48. Test Workflow

Test peut exécuter en sandbox.

Séparer clairement :

```text
SIMULATION
TEST
REAL EXECUTION
```

---

# 49. Mock Automation

`MockAutomation` est autorisé uniquement :

```text
DEV
TEST
EXPLICIT SANDBOX
```

Jamais fallback silencieux en PROD/REAL.

---

# 50. IAM

Permissions conceptuelles :

```text
automation.read
automation.create
automation.update
automation.delete
automation.test
automation.simulate
automation.validate
automation.activate
automation.deactivate
automation.execution.read
automation.execution.retry
automation.execution.cancel
automation.schedule.manage
automation.diagnostics
```

---

# 51. Validation

Validation niveaux :

```text
ERROR
WARNING
INFO
```

ERROR bloque snapshot/publication Automation Definition.

---

# 52. Automation Snapshot

Avant Pack Manager :

```text
Automation Definition
↓
Validation
↓
Immutable Snapshot
↓
Pack Manager
```

ApplicationVersion doit correspondre.

---

# 53. Pack Manager Integration

Une PackVersion référence :

```text
Automation Definition / Snapshot
```

si Automation utilisée.

---

# 54. Pack Runtime Integration

Pack Runtime résout la version Automation effective.

Automation Runtime ne doit pas exécuter une définition différente du Pack actif.

---

# 55. Data Runtime Integration

Toutes Data Actions respectent :
- tenant ;
- IAM ;
- resolution/runtime context si applicable ;
- Data Contract ;
- Data Policies.

---

# 56. Integration Hub

Actions externes passent par contrats enregistrés.

---

# 57. Observability

Chaque exécution porte :
- executionId ;
- workflowId ;
- tenantId ;
- traceId ;
- correlation IDs.

Metrics possibles :

```text
automation_executions_total
automation_execution_duration
automation_failures_total
automation_retries_total
automation_timeouts_total
automation_blocked_total
```

---

# 58. Audit

Auditer :
- workflow create/update ;
- activate/deactivate ;
- simulate ;
- manual trigger ;
- retry ;
- cancel ;
- schedule change ;
- sensitive external action.

---

# 59. Secrets

Interdit dans :
- definitions ;
- execution history ;
- input/output logs ;
- frontend ;
- diagnostics.

Utiliser credential refs.

---

# 60. API conceptuelle

Workflows :

```http
GET    /api/automation/workflows
POST   /api/automation/workflows
GET    /api/automation/workflows/:id
PATCH  /api/automation/workflows/:id
DELETE /api/automation/workflows/:id
POST   /api/automation/workflows/:id/duplicate
```

Definition :

```http
GET /api/automation/workflows/:id/definition
PUT /api/automation/workflows/:id/definition
```

Validation / simulation :

```http
POST /api/automation/workflows/:id/validate
POST /api/automation/workflows/:id/test
POST /api/automation/workflows/:id/simulate
POST /api/automation/rules/:id/simulate
```

Executions :

```http
GET  /api/automation/executions
GET  /api/automation/executions/:id
POST /api/automation/executions/:id/retry
POST /api/automation/executions/:id/cancel
```

Schedules :

```http
GET    /api/automation/schedules
POST   /api/automation/schedules
PATCH  /api/automation/schedules/:id
DELETE /api/automation/schedules/:id
```

Adapter aux routes réelles.

---

# 61. Frontend

Pages :

```text
Automation Cockpit
Rules
Workflows
Triggers
Actions
Executions
History
Diagnostics
```

---

# 62. Cockpit

KPIs réels :

```text
Rules Active
Workflows Active
Triggers Active
Executions Today
Success
Failed
Running
Retrying
Average Duration
Attention Required
```

Pas de données fictives.

---

# 63. Workflow Editor

Disposition :

```text
Left: Nodes
Center: Graph Canvas
Right: Inspector
Top: Context / Validation / Save / Test
```

---

# 64. Rule Builder

UI déclarative :
- field ;
- operator ;
- value ;
- AND/OR groups ;
- result/action.

---

# 65. Execution Detail

Afficher :
- context ;
- trigger ;
- timeline ;
- steps ;
- retry ;
- errors ;
- traceId ;
- sanitized input/output.

---

# 66. History

Persisted history.

Filtres :
- tenant context implicit ;
- application ;
- workflow ;
- status ;
- period ;
- traceId.

---

# 67. Diagnostics

Codes possibles :

```text
AUTOMATION_RULE_INVALID
AUTOMATION_TRIGGER_INVALID
AUTOMATION_ACTION_FAILED
AUTOMATION_WORKFLOW_LOOP
AUTOMATION_PERMISSION_DENIED
AUTOMATION_TIMEOUT
AUTOMATION_PROVIDER_UNAVAILABLE
AUTOMATION_TENANT_DENIED
AUTOMATION_RUNTIME_BLOCKED
AUTOMATION_IDEMPOTENCY_CONFLICT
```

---

# 68. Tests unitaires

- rule evaluator ;
- condition parser ;
- workflow graph ;
- triggers ;
- actions ;
- retry ;
- idempotency ;
- loop protection ;
- simulation.

---

# 69. Tests intégration

```text
BM Event → Automation
UI Action → Automation
Automation → Data Runtime
Automation → Integration Hub
Automation → ERP Adapter
Pack Runtime → Automation
```

---

# 70. Security Tests

- cross-tenant ;
- unauthorized simulate ;
- arbitrary code ;
- malicious formula ;
- mock in production ;
- SSRF action ;
- credential leakage ;
- forged workflow ID ;
- retry other tenant execution.

---

# 71. E2E

```text
Login
↓
Application Version
↓
Create Workflow
↓
Trigger Business Event
↓
Conditions
↓
Data Action
↓
Integration Action
↓
Execution History
↓
Success / Failure Diagnostics
```

Pack path :

```text
Validate Automation Definition
↓
Pack Manager Snapshot
↓
Publish
↓
Pack Runtime EXECUTABLE
↓
Trigger
↓
Workflow Executes
```

---

# 72. Definition of Done

Automation est DONE si :

- aucune Map globale comme source de vérité ;
- workflows/rules/executions persistés ;
- isolation tenant stricte ;
- restart persistence test vert ;
- simulation permissionnée ;
- `Bell` frontend corrigé ;
- no mock fallback PROD ;
- no `eval()` ;
- Data Runtime/Integration Hub utilisés ;
- retry/idempotency/timeout contrôlés ;
- Pack Runtime gate respecté ;
- tests cross-tenant verts ;
- E2E vert ;
- build/Prisma/CI verts.
