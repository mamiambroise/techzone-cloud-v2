# TECH — TECHZONE CLOUD AUTOMATION

**Stack :** NestJS + Prisma/PostgreSQL + React/Vite

---

# 1. Existing code to preserve

Audit confirms real:
- endpoints ;
- rule engine ;
- workflow engine ;
- triggers ;
- actions ;
- history APIs ;
- frontend APIs.

Do not rewrite engines without need.

---

# 2. Known files

Inspect :

```text
backend/src/automation/
backend/src/automation/workflow/workflow.engine.ts
backend/src/automation/automation.controller.ts
frontend/src/pages/AutomationWorkflows.jsx
backend/prisma/schema.prisma
```

---

# 3. Current critical architecture problem

Global Maps are process memory.

Target:

```text
Controller
↓
Automation Service
↓
Repository
↓
Prisma
↓
PostgreSQL
```

Engine loads definitions from repository.

---

# 4. Prisma Models

Audit before creating.

Conceptual set:

```text
AutomationDefinition
AutomationWorkflow
AutomationWorkflowVersion
AutomationWorkflowNode
AutomationWorkflowEdge
AutomationRule
AutomationTrigger
AutomationSchedule
AutomationExecution
AutomationStepExecution
AutomationIdempotency
```

---

# 5. Tenant Keys

Every root model:
- tenantId ;
- applicationVersionId as applicable.

Child rows derive tenant through FK and may also include tenantId for safer indexes/RLS if design requires.

---

# 6. Indexes

Potential:
- tenantId ;
- tenant + applicationVersion ;
- tenant + workflow key ;
- execution status ;
- startedAt ;
- traceId ;
- schedule nextRunAt.

---

# 7. Repositories

No global Map as authority.

Interfaces:

```ts
WorkflowRepository
RuleRepository
ExecutionRepository
ScheduleRepository
IdempotencyRepository
```

---

# 8. Transactions

Use transaction for:
- create workflow + version ;
- persist execution + first step ;
- state transitions requiring consistency.

---

# 9. Engine Separation

Workflow engine receives immutable definition + runtime context.

It should not fetch arbitrary tenant data without repository/service contract.

---

# 10. Context Builder

Build server-side from:
- IAM ;
- ApplicationVersion ;
- Pack Runtime context ;
- event.

---

# 11. Permission Guards

Controller routes must declare explicit permissions.

Especially:

```text
rules/simulate
workflows/test
executions/retry
executions/cancel
schedules
```

---

# 12. Simulation Service

Use side-effect adapters:

```text
RealActionExecutor
SimulationActionExecutor
```

Simulation executor returns predicted result but does not mutate external systems.

---

# 13. Rule Engine

No `eval()`.

Use AST/declarative operators.

---

# 14. Formula Parser

If existing parser uses safe parser, keep.

If arbitrary JS eval exists, replace.

---

# 15. Workflow Graph Validation

Check:
- orphan node ;
- invalid edge ;
- no trigger ;
- unreachable nodes ;
- forbidden cycle ;
- duplicate IDs ;
- invalid action types.

---

# 16. Execution Persistence

Before running:
- insert execution PENDING/RUNNING.

During:
- persist step transitions.

End:
- SUCCEEDED/FAILED/etc.

---

# 17. Payload Storage

Avoid storing huge/sensitive raw payloads.

Options:
- sanitized JSON ;
- refs to secure storage ;
- redaction.

---

# 18. Restart Recovery

On startup:
- detect RUNNING/PENDING stale executions ;
- follow explicit recovery policy ;
- do not silently mark success.

---

# 19. Scheduler

Persist schedules.

Scheduler startup loads due schedules by tenant.

Prevent duplicate fire:
- DB lock/claim ;
- idempotency key ;
- unique run key.

---

# 20. Idempotency

Record:

```text
tenantId
scope
key
fingerprint
status
resultRef
expiresAt
```

---

# 21. Retry

Persist attempts.

Backoff:
- fixed/exponential as configured.

Classify retryable errors.

---

# 22. Loop Protection

Context:
- workflow call stack ;
- depth ;
- step count ;
- event chain.

Block cycles.

---

# 23. Data Runtime Adapter

Action calls Data Runtime service/API with trusted context.

For published runtime:
- preserve resolutionId/runtimeContext.

---

# 24. Integration Adapter

Use Integration Hub contracts.

No direct ERP secrets.

---

# 25. Pack Snapshot

Serialize validated Automation Definition deterministically.

Pack Manager links same ApplicationVersion.

---

# 26. Pack Runtime

Runtime loads effective Automation Definition from Pack.

No latest-draft fetch during published execution.

---

# 27. Mock Isolation

Configuration:

```text
AUTOMATION_PROVIDER_MODE=REAL|MOCK
```

Production REAL must reject mock fallback.

---

# 28. Frontend Bell Fix

Import correct Lucide icon or remove use.

Add render test.

---

# 29. API Error Codes

```text
AUTOMATION_NOT_FOUND
AUTOMATION_TENANT_DENIED
AUTOMATION_PERMISSION_DENIED
AUTOMATION_RULE_INVALID
AUTOMATION_WORKFLOW_INVALID
AUTOMATION_SIMULATION_FORBIDDEN
AUTOMATION_ACTION_FAILED
AUTOMATION_TIMEOUT
AUTOMATION_LOOP_DETECTED
AUTOMATION_PROVIDER_UNAVAILABLE
AUTOMATION_IDEMPOTENCY_CONFLICT
```

---

# 30. Observability

Structured logs:
- executionId ;
- workflowId ;
- tenantId ;
- traceId ;
- nodeId ;
- duration ;
- status.

No raw secrets.

---

# 31. CI

Run:
- Prisma validate/generate ;
- Automation unit ;
- integration DB ;
- cross-tenant ;
- restart/recovery ;
- frontend render ;
- build.

---

# 32. Commit Plan

```text
fix(automation): persist workflows and rules by tenant
fix(automation): persist executions and history
fix(automation): enforce tenant scoped queries
fix(automation): require simulation permission
fix(automation): isolate mock provider from real mode
fix(automation-ui): fix workflows page icon import
feat(automation): add idempotent retry and schedule persistence
test(automation): add cross tenant and restart coverage
```

---

# 33. Technical DoD

- no global Map truth ;
- Prisma persistence ;
- tenant scoped ;
- explicit permissions ;
- simulation safe ;
- restart recovery ;
- idempotency/retry ;
- no eval ;
- frontend stable ;
- tests/build green.
