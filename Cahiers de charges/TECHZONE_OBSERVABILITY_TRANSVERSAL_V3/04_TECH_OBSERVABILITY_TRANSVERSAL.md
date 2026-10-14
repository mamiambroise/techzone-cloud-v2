# TECH — OBSERVABILITY TRANSVERSAL

**Stack :** NestJS + Prisma/PostgreSQL + optional specialized telemetry backends + React/Vite

---

# 1. Audit Existing

Inspect:
```text
logger
interceptors
exception filters
trace middleware
audit services
observability routes
health endpoints
alerts
metrics
frontend mocks
```

---

# 2. Trace Context

Define request-scoped context:

```ts
type TraceContext = {
  traceId: string
  requestId: string
  correlationId?: string
  tenantId?: string
  identityId?: string
  applicationId?: string
  environmentId?: string
}
```

---

# 3. Middleware

Inbound:
- accept validated trace header or create traceId ;
- create requestId ;
- attach principal context after auth.

Outbound:
- propagate trace headers.

---

# 4. Logger

Structured JSON logger.

Mandatory fields:
- timestamp
- level
- service
- module
- traceId.

---

# 5. Redaction

Central redaction middleware/serializer.

Patterns:
```text
authorization
cookie
set-cookie
password
token
secret
apiKey
credential
DATABASE_URL
```

---

# 6. Exception Filter

Map errors to:
- safe client response ;
- internal structured log ;
- traceId.

No stack in production response.

---

# 7. Metric Abstraction

```ts
MetricRecorder
```

Methods:
- increment
- gauge
- observe.

Backend adapter pluggable.

---

# 8. Cardinality Guard

Reject/unregister unsafe labels.

---

# 9. Health Registry

```ts
HealthContributor
```

Each module can register checks.

---

# 10. Diagnostic Provider

```ts
DiagnosticProvider {
  key
  check(context)
}
```

---

# 11. Audit Sink

Persist structured audit.

Append-only semantics.

---

# 12. Security Event Sink

Persistent/event-driven depending current architecture.

---

# 13. Alert Evaluator

Reads metrics/events/log patterns.

Persist:
- alert
- occurrences
- state transitions.

---

# 14. Dedup

Fingerprint:
```text
rule + tenant + resource + normalized condition
```

---

# 15. Incidents

Minimal persisted models:
```text
Incident
IncidentAlertLink
IncidentTimelineEvent
```

Only if absent.

---

# 16. Storage Strategy

Use Prisma for:
- alert config
- incidents
- audit if volume acceptable
- settings.

Use specialized backend for high-volume logs/metrics/traces when available.

---

# 17. Retention Job

Scheduled cleanup/archive by type.

Tenant-safe.

---

# 18. Query API

All search endpoints enforce:
- tenant scope
- max range
- pagination
- result cap
- permission.

---

# 19. Export

Separate service and permission.

Audit exports.

---

# 20. Frontend

Replace:
```text
logsMock
auditMock
securityEventsMock
monitoringMock
alertsMock
```

No fallback to mock in REAL.

---

# 21. Observability Failure Handling

Telemetry send should:
- timeout quickly
- buffer/retry
- not block business operation unless audit is legally critical and policy says otherwise.

---

# 22. Event Integration

Reuse outbox/event bus.

Do not create duplicate bus.

---

# 23. Module Instrumentation

Shared helper:
```ts
withTrace
recordMetric
logEvent
auditAction
emitSecurityEvent
```

---

# 24. OpenTelemetry

Optional/adapt if already present.

Do not introduce complexity before basic trace/log contracts are stable.

---

# 25. Error Codes

```text
OBS_QUERY_RANGE_TOO_LARGE
OBS_TENANT_DENIED
OBS_SOURCE_UNAVAILABLE
OBS_ALERT_RULE_INVALID
OBS_INCIDENT_NOT_FOUND
OBS_EXPORT_FORBIDDEN
OBS_DIAGNOSTIC_UNAVAILABLE
```

---

# 26. Tests

Unit:
- redaction
- trace propagation
- alert dedup
- retention.

Integration:
- real DB
- cross-module diagnostic
- alert lifecycle.

Security:
- cross tenant
- secret leakage
- query abuse.

---

# 27. Commit Plan

```text
feat(observability): standardize trace context contracts
fix(observability): enforce structured logging and redaction
feat(observability): connect real health and metrics providers
feat(observability): persist alerts and incident lifecycle
feat(observability): aggregate module diagnostics
fix(observability-ui): replace mock data with real APIs
test(observability): add cross tenant redaction and trace coverage
```

---

# 28. Technical DoD

- trace context
- structured logs
- redaction
- metrics
- health
- audit
- security events
- alerts
- diagnostics
- no REAL mocks
- resilient pipeline
- tests/build green.
