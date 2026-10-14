# MAQUETTES — TECHZONE CLOUD AUTOMATION

---

# M01 — Automation Cockpit

Cards:
- Rules Active
- Workflows Active
- Triggers Active
- Executions Today
- Success
- Failed
- Running
- Retrying
- Avg Duration
- Attention

Charts:
- executions over time
- status distribution.

---

# M02 — Workflows List

Table:
- Workflow
- App Version
- Status
- Trigger
- Last Execution
- Success Rate
- Updated
- Actions

---

# M03 — Create Workflow

Form:
- Name
- Key
- Application Version
- Description
- Trigger Type

---

# M04 — Workflow Editor

3-column:
- Nodes
- Graph
- Inspector

Top:
- Context
- Save
- Validate
- Simulate
- Test.

---

# M05 — Node Library

Categories:
- Trigger
- Logic
- Data
- Integration
- Notification
- Flow.

---

# M06 — Trigger Node

Inspector:
- Event
- Schedule
- Manual
- UI Action
- Input Mapping.

---

# M07 — Condition Node

Visual builder:
- Field
- Operator
- Value
- AND/OR.

---

# M08 — Branch Node

Paths:
- True
- False
- Multiple cases.

---

# M09 — Data Query Node

Select:
- Entity
- Operation
- Fields
- Filters
- Output variable.

---

# M10 — Data Mutation Node

Select:
- Entity
- Create/Update/Delete
- Input mapping
- Idempotency.

---

# M11 — ERP / Integration Action

Select:
- Integration Contract
- Action
- Input mapping
- Timeout
- Retry.

No credentials.

---

# M12 — Notification Action

Provider/template/recipient mapping.

---

# M13 — Delay Node

Duration / until time.

Bounded values.

---

# M14 — Variables Panel

Tabs:
- Inputs
- Context
- Workflow
- Outputs.

Sensitive values masked.

---

# M15 — Workflow Validation

Summary:
- Trigger
- Graph
- Conditions
- Actions
- Data
- Integrations
- Permissions
- Runtime.

---

# M16 — Simulation Mode

Strong banner:
`SIMULATION — AUCUN EFFET RÉEL`

Input fields + predicted path.

---

# M17 — Simulation Trace

Timeline:
- trigger
- condition evaluation
- branch
- simulated actions
- result.

---

# M18 — Rules List

Table:
- Rule
- Context
- Priority
- Status
- Last Update
- Actions.

---

# M19 — Rule Builder

IF / AND / OR / THEN graphical editor.

---

# M20 — Triggers List

Table:
- Trigger
- Type
- Workflow
- Status
- Last Fire
- Next Run.

---

# M21 — Schedules

Calendar/list:
- Workflow
- Cron/Interval
- Timezone
- Next Run
- Status.

---

# M22 — Actions Registry

Table:
- Action
- Type
- Provider
- Capability
- Available
- Sandbox Support.

---

# M23 — Executions List

Table:
- Execution
- Workflow
- Trigger
- Status
- Started
- Duration
- Attempt
- Trace ID.

---

# M24 — Execution Detail

Header status.

Timeline of steps.

Context cards.

---

# M25 — Step Execution Detail

Show:
- node
- status
- duration
- sanitized input/output
- error
- retry info.

---

# M26 — Failed Execution

Red error banner.

Actions:
- Retry
- Diagnostics
- Open Workflow.

---

# M27 — Retry Confirmation

Show:
- prior error
- attempt
- retry policy
- idempotency status.

---

# M28 — Running Execution

Live/polling timeline.

Cancel if allowed.

---

# M29 — History

Persistent timeline/table.

Filters:
- workflow
- status
- period
- traceId.

---

# M30 — Diagnostics

Table:
- Severity
- Code
- Workflow
- Execution
- Message
- Time
- Trace ID.

---

# M31 — Engine Health

Cards:
- Database
- Scheduler
- Queue/Workers if used
- Data Runtime
- Integration Hub
- Pack Runtime.

---

# M32 — Restart Recovery

Admin panel:
- recovered schedules
- stale running
- recovered retries
- errors.

---

# M33 — Idempotency Records

Technical/admin table:
- key
- scope
- status
- execution
- expires.

No sensitive payload.

---

# M34 — Permission Denied

403 workspace state.

---

# M35 — Runtime Blocked

Orange/red screen:
- Pack Runtime BLOCKED
- workflow not executed
- diagnostics.

---

# M36 — Mock Mode Warning

DEV/TEST only banner:
`MOCK AUTOMATION ACTIVE`

Never present in REAL silently.

---

# M37 — Automation Definition Snapshot

Read-only:
- ApplicationVersion
- snapshot
- validation
- hash
- Pack usage.

---

# M38 — Mobile Automation

Cards:
- cockpit
- workflows
- execution monitoring
- diagnostics.

Graph editor may be read-only/limited.

---

# M39 — Integration Flow

Visual:

```text
Business Event / UI Action
↓
Trigger
↓
Rules
↓
Workflow
↓
Data Runtime / Integration Hub
↓
Execution History
```

---

# M40 — Pack Lifecycle

Visual:

```text
Automation Definition
↓
Validation
↓
Snapshot
↓
Pack Manager
↓
Pack Runtime
↓
Automation Runtime
```

---

# Visual Direction

Techzone Cloud Automation:

- premium SaaS ;
- dark navy sidebar ;
- light workspace ;
- orange/amber Automation accent ;
- violet for logic ;
- cyan for data ;
- green success ;
- red failure ;
- white rounded cards ;
- subtle shadows ;
- Lucide icons ;
- visual workflow graph ;
- responsive ;
- no fake runtime status.
