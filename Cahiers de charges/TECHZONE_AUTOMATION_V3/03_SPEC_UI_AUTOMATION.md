# SPEC UI — TECHZONE CLOUD AUTOMATION

---

# 1. Design

Automation identity :

- dark navy sidebar ;
- light workspace ;
- orange/amber accent ;
- white cards ;
- colored node types ;
- Lucide icons ;
- responsive ;
- operational cockpit.

---

# 2. Navigation

```text
Automatisation
├── Vue d’ensemble
├── Workflows
├── Rules
├── Triggers
├── Actions
├── Executions
├── History
└── Diagnostics
```

---

# 3. Cockpit

Cards :
- Rules Active ;
- Workflows Active ;
- Triggers Active ;
- Executions Today ;
- Success ;
- Failed ;
- Running ;
- Retrying ;
- Average Duration ;
- Attention Required.

Real metrics only.

---

# 4. Workflows List

Table :

```text
Workflow
Application
Version
Status
Trigger
Last Execution
Success Rate
Updated
Actions
```

---

# 5. Create Workflow

Fields :
- Name ;
- Key ;
- ApplicationVersion ;
- Description ;
- Trigger type ;
- metadata.

---

# 6. Workflow Editor

Layout :

```text
Top Context Bar
Left Node Library
Center Graph Canvas
Right Inspector
Bottom/Side Validation
```

---

# 7. Node Library

Categories :
- Trigger ;
- Logic ;
- Data ;
- Integration ;
- Notification ;
- Flow.

---

# 8. Trigger Node

Inspector :
- trigger type ;
- Business Event ;
- schedule ;
- manual ;
- input schema.

---

# 9. Condition Node

Visual rule builder :
- field ;
- operator ;
- value ;
- AND / OR groups.

---

# 10. Data Action Node

Select:
- Entity ;
- Operation ;
- Fields/Payload mapping ;
- Data Contract.

---

# 11. Integration Action Node

Select:
- registered Integration Contract ;
- operation ;
- input mapping.

No credentials.

---

# 12. Notification Node

Select provider/capability and template/ref.

---

# 13. Variables Panel

Groups :
- Inputs ;
- Context ;
- Workflow variables ;
- Step outputs.

Sensitive variables masked.

---

# 14. Validation Cockpit

Checks:
- Trigger
- Graph
- Conditions
- Actions
- References
- Permissions
- Data Contracts
- Integrations
- Runtime compatibility.

---

# 15. Simulation

Dedicated mode banner:

```text
SIMULATION — aucun effet réel
```

Inputs form + explain trace.

Requires permission.

---

# 16. Test Mode

Clearly distinguish:

```text
TEST
```

Sandbox providers if configured.

---

# 17. Rules List

Table :
- Rule ;
- Entity/Event ;
- Status ;
- Priority ;
- Last modified ;
- Actions.

---

# 18. Rule Builder

Structured UI:
- IF ;
- conditions ;
- THEN ;
- result/action.

---

# 19. Triggers

Table:
- Trigger
- Type
- Workflow
- Status
- Last Fire
- Next Run
- Actions.

---

# 20. Schedules

Calendar/table:
- Workflow
- Schedule
- Timezone
- Next Run
- Status.

---

# 21. Executions

Table:
- Execution
- Workflow
- Trigger
- Status
- Started
- Duration
- Attempt
- Trace ID
- Actions.

---

# 22. Execution Detail

Header:
- status ;
- workflow ;
- tenant/application context ;
- traceId.

Timeline:
- Trigger
- Rule
- Step 1
- Step 2
- Retry
- Result.

---

# 23. Step Detail

Show:
- node ;
- status ;
- duration ;
- sanitized input ;
- sanitized output ;
- error.

---

# 24. Retry UI

Show:
- prior error ;
- retry policy ;
- attempt count.

Confirmation.

---

# 25. Cancel UI

Only running/cancellable executions.

Permission-aware.

---

# 26. History

Persisted history filters:
- application ;
- workflow ;
- status ;
- period ;
- traceId.

---

# 27. Diagnostics

Table:
- Severity
- Code
- Workflow
- Execution
- Message
- Time
- Trace ID.

---

# 28. Engine Status

Show real:
- DB persistence ;
- scheduler ;
- queue if used ;
- provider health ;
- current load.

---

# 29. Restart Recovery State

Admin view:
- recovered schedules ;
- recovered pending executions ;
- failed recoveries.

Only if implemented.

---

# 30. Permission States

Read-only:
- inspect.

Editor:
- edit.

Operator:
- test/simulate/retry according perms.

---

# 31. Error States

Handle:
- 401 ;
- 403 ;
- tenant denied ;
- workflow not found ;
- provider unavailable ;
- timeout ;
- runtime blocked.

---

# 32. Responsive

Desktop:
- workflow graph.

Tablet:
- graph + drawers.

Mobile:
- lists, execution monitoring, diagnostics ;
- editor limited but functional if supported.

---

# 33. UI DoD

- no fake metrics ;
- workflow route renders ;
- Bell icon imported ;
- simulation clearly marked ;
- execution history persistent ;
- permissions reflected ;
- responsive.
