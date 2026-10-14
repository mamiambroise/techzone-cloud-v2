# SPEC UI — OBSERVABILITY TRANSVERSAL

---

# 1. Design

- dark navy sidebar
- very light workspace
- gray/blue observability identity
- green healthy
- amber degraded
- red critical
- purple traces
- cyan metrics
- Lucide icons
- dense operational tables
- responsive.

---

# 2. Navigation

```text
PLATEFORME
└── Observabilité
    ├── Vue d’ensemble
    ├── Logs
    ├── Métriques
    ├── Traces
    ├── Événements sécurité
    ├── Alertes
    ├── Incidents
    ├── Diagnostics
    └── Paramètres
```

---

# 3. Overview

Cards:
- Healthy Services
- Degraded
- Critical Alerts
- Requests/min
- Error Rate
- P95 Latency
- Open Incidents
- Security Events.

---

# 4. Service Health

Table:
- Module
- Service
- Environment
- Health
- Readiness
- Last Check
- Dependencies.

---

# 5. Logs Explorer

Filters:
- Time
- Tenant
- Environment
- Module
- Level
- Trace ID
- Search.

Columns:
- Time
- Level
- Service
- Message
- Trace
- Tenant.

---

# 6. Log Detail

Show:
- structured attributes
- trace links
- related error
- related deployment
- redaction indicators.

---

# 7. Metrics

Metric selector + chart.

Controls:
- range
- aggregation
- module
- environment
- allowed labels.

---

# 8. Metric Dashboard

Panels:
- traffic
- latency
- errors
- saturation
- queue
- runtime.

---

# 9. Traces

Table:
- Trace
- Root Service
- Operation
- Duration
- Spans
- Status
- Time.

---

# 10. Trace Detail

Waterfall/spans.

Show:
- parent-child
- duration
- errors
- attributes
- related logs.

---

# 11. Security Events

Table:
- Severity
- Event
- Actor
- Tenant
- Source
- Status
- Time.

---

# 12. Security Event Detail

Timeline + IAM/session context + related audit.

---

# 13. Alerts

Table:
- Severity
- Rule
- Resource
- Status
- Opened
- Last
- Assignee.

---

# 14. Alert Detail

Sections:
- Condition
- Signal
- Occurrences
- Related logs/traces
- Incident
- Notifications.

---

# 15. Acknowledge Alert

Modal:
- assignee
- note.

---

# 16. Incidents

Table:
- Incident
- Severity
- Status
- Affected Modules
- Owner
- Started
- Duration.

---

# 17. Incident Detail

Timeline:
- first signal
- alerts
- deployments
- runtime errors
- notes
- mitigation
- resolution.

---

# 18. Correlation View

Graph:
```text
Request
→ API
→ Runtime
→ Data
→ Integration
```

Linked:
- logs
- metrics
- traces
- alerts.

---

# 19. Diagnostics Matrix

Rows:
- IAM
- BM
- UI Builder
- Automation
- Pack Manager
- Pack Runtime
- Data
- ERP
- API
- Deployment
- Billing
- DB.

Columns:
- Health
- Readiness
- Dependencies
- Errors.

---

# 20. Diagnostic Detail

Show:
- checks
- severity
- code
- message
- traceId
- timestamp
- recommended next step.

---

# 21. Audit Explorer

Filters:
- Actor
- Action
- Tenant
- Target
- Result
- Date.

---

# 22. Audit Detail

Immutable event view.

---

# 23. Settings

Tabs:
- Retention
- Sampling
- Alert Rules
- Notification Routes
- Redaction
- Health Checks.

---

# 24. Alert Rules

Table:
- Rule
- Signal
- Threshold
- Window
- Severity
- Scope
- Status.

---

# 25. Create Alert Rule

Wizard:
- signal
- condition
- threshold
- scope
- severity
- cooldown
- notification.

---

# 26. Retention

Table:
- Signal Type
- Hot Retention
- Archive
- Delete Policy.

---

# 27. Empty/Error States

- no logs
- no metrics
- provider unavailable
- no trace
- permission denied.

---

# 28. Mock Warning

DEV/TEST only:
`OBSERVABILITY MOCK DATA`.

Never silent in REAL.

---

# 29. Responsive

Mobile:
- overview
- alerts
- incidents
- diagnostics
- simplified log search.

---

# 30. UI DoD

- all data real in REAL mode
- filters tenant-safe
- trace links work
- secrets redacted
- alert states real
- diagnostics actionable
- responsive.
