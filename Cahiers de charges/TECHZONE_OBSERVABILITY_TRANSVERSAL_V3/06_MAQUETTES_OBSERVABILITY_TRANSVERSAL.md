# MAQUETTES — OBSERVABILITY TRANSVERSAL

# M01 — Observability Overview
Cards:
- Healthy Services
- Degraded
- Critical Alerts
- Requests/min
- Error Rate
- P95
- Open Incidents
- Security Events

# M02 — Service Health
Module/service/env/health/readiness/last check.

# M03 — Logs Explorer
Filters + structured table.

# M04 — Log Detail
Attributes/trace/related events.

# M05 — Metrics Overview
Traffic/latency/errors/saturation.

# M06 — Metrics Explorer
Metric/labels/time/aggregation.

# M07 — Metric Detail
Chart + thresholds + related alerts.

# M08 — Trace Explorer
Trace/service/operation/duration/status.

# M09 — Trace Detail
Waterfall spans.

# M10 — Trace Correlation
Logs + metrics + errors around trace.

# M11 — Security Events
Severity/event/actor/tenant/source/time.

# M12 — Security Event Detail
Context + related audit/session.

# M13 — Alerts List
Severity/rule/resource/status/opened/assignee.

# M14 — Alert Detail
Condition/signals/occurrences/trace links.

# M15 — ACK Alert
Assignee/note modal.

# M16 — Resolve Alert
Resolution note.

# M17 — Incidents List
Incident/severity/status/modules/owner.

# M18 — Incident Detail
Timeline and evidence.

# M19 — Create Incident
From one/multiple alerts.

# M20 — Incident Timeline
Signals/actions/notes.

# M21 — Diagnostics Matrix
All modules health/readiness/errors.

# M22 — Diagnostic Detail
Checks/codes/messages/trace.

# M23 — Runtime Diagnostics
Resolution/activation/readiness.

# M24 — Deployment Diagnostics
Stages/failures/rollback.

# M25 — Data Diagnostics
Provider/query/errors.

# M26 — Integration Diagnostics
Connector/health/sync/webhook.

# M27 — Billing Diagnostics
Payments/webhooks/quota.

# M28 — IAM Diagnostics
Auth/MFA/session/permission.

# M29 — Audit Explorer
Actor/action/tenant/target/result.

# M30 — Audit Detail
Immutable structured event.

# M31 — Correlation Search
Search by traceId/requestId/deploymentId.

# M32 — Correlation Graph
Request → API → Runtime → Data → Integration.

# M33 — Alert Rules
Rule/signal/threshold/window/status.

# M34 — Create Alert Rule
Wizard.

# M35 — Notification Routing
Severity → channels/routes.

# M36 — Retention Settings
Logs/metrics/traces/audit/security.

# M37 — Redaction Settings
Rules + test sample.

# M38 — Sampling Settings
Trace/log sampling policies.

# M39 — Export Logs
Scoped export + permission warning.

# M40 — Platform Health
Module grid.

# M41 — Tenant Observability
Own applications/environments only.

# M42 — Provider Unavailable
Controlled degraded state.

# M43 — No Data
Empty observability state.

# M44 — Mock Warning
DEV/TEST explicit banner.

# M45 — Mobile Observability
Alerts/incidents/health first.

# M46 — Architecture Flow

```text
ALL MODULES
↓
Observability Contracts
↓
Logs • Metrics • Traces • Audit • Alerts
↓
Diagnostics / Operations
```

---

# Visual Direction

- premium Techzone Cloud
- dark navy sidebar
- light canvas
- blue/gray observability
- cyan metrics
- purple traces
- green healthy
- amber degraded
- red critical
- dense tables
- charts with real data only
- Lucide icons
- responsive
- no fake service health
