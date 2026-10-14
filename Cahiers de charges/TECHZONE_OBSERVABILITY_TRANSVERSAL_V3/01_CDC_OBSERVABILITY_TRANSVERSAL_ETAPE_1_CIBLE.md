# CAHIER DES CHARGES — TECHZONE CLOUD OBSERVABILITY TRANSVERSAL
## Étape 1 — Cible fonctionnelle et architecturale

**Projet :** Techzone Cloud  
**Module :** Observability & Diagnostics  
**Version cible :** 3.0  
**Nature :** Transversale  
**Statut :** Spécification cible

---

# 1. Objet

Observability est la couche transversale qui permet de comprendre :

```text
CE QUI FONCTIONNE
CE QUI EST DÉGRADÉ
CE QUI EST INDISPONIBLE
CE QUI A ÉCHOUÉ
OÙ L’ERREUR S’EST PRODUITE
QUAND ELLE S’EST PRODUITE
POUR QUEL TENANT / APP / PACK / ENV
COMMENT CORRÉLER LES SIGNAUX
```

Elle couvre :

```text
HEALTH
LOGS
METRICS
TRACES
CORRELATION
EVENTS
ERRORS
ALERTS
DIAGNOSTICS
INCIDENT CONTEXT
AUDIT LINKS
SECURITY EVENTS
```

---

# 2. Position dans Techzone Cloud

```text
AUTH / IAM
BUSINESS MANAGER
UI BUILDER
AUTOMATION
PACK MANAGER
PACK RUNTIME
DATA RUNTIME
ERP / INTEGRATION HUB
API MANAGER
REGISTRY
ENVIRONMENT / DEPLOYMENT
SUBSCRIPTION / BILLING
ADMINISTRATION
        ↓
OBSERVABILITY CONTRACTS
        ↓
OBSERVABILITY & DIAGNOSTICS
        ↓
DASHBOARD / OPERATIONS / ADMINISTRATION
```

---

# 3. Principe transversal

Observability :

```text
OBSERVE
CORRELATE
MEASURE
ALERT
DIAGNOSE
EXPLAIN
```

mais ne doit jamais :

```text
OWN BUSINESS DATA
EXECUTE BUSINESS LOGIC
BYPASS IAM
MODIFY TENANT DATA
BECOME REQUIRED FOR BUSINESS SUCCESS
```

---

# 4. Résilience

Règle :

```text
OBSERVABILITY DOWN
≠
BUSINESS PLATFORM DOWN
```

Prévoir :
- buffering ;
- retry ;
- async export ;
- local fallback logs ;
- degraded mode.

---

# 5. Contrats transversaux

À versionner :

```text
Observability Event Contract
Log Event Contract
Audit Event Contract
Security Event Contract
Metric Contract
Health Contract
Trace Contract
Alert Contract
Incident Contract
Diagnostic Contract
Error Contract
```

---

# 6. Contexte commun

Chaque signal transporte selon le cas :

```text
timestamp
traceId
requestId
correlationId
tenantId
identityId/userId
applicationId
applicationVersionId
packVersionId
environmentId
deploymentId
runtimeContextId
module
service
component
operation
eventType
severity
status
duration
```

---

# 7. Trace ID

`traceId` doit être propagé de bout en bout :

```text
Frontend
↓
API
↓
Service
↓
Data / Runtime / Integration
↓
External call
↓
Diagnostics
```

Un même flux métier doit pouvoir être retracé.

---

# 8. Request ID vs Trace ID

```text
requestId
→ une requête HTTP

traceId
→ un flux distribué complet

correlationId
→ relation métier/technique complémentaire
```

Éviter la confusion.

---

# 9. Logs

Logs structurés :

```json
{
  "timestamp": "...",
  "level": "INFO",
  "traceId": "...",
  "tenantId": "...",
  "module": "pack-runtime",
  "component": "resolver",
  "event": "resolution.completed",
  "message": "..."
}
```

---

# 10. Log Levels

```text
DEBUG
INFO
NOTICE
WARNING
ERROR
CRITICAL
```

---

# 11. Log Categories

Exemples :

```text
APPLICATION
SECURITY
AUDIT
RUNTIME
DEPLOYMENT
DATA
INTEGRATION
BILLING
ADMIN
SYSTEM
```

---

# 12. Redaction

Interdire :

```text
password
access token
refresh token
API key
client secret
MFA secret
database URL
credential
payment secret
provider token
```

Redaction automatique + revue contractuelle.

---

# 13. PII / Sensitive Data

Log minimal.

Éviter :
- full request body ;
- full response body ;
- business records ;
- personal data non nécessaire.

---

# 14. Metrics

Types :

```text
COUNTER
GAUGE
HISTOGRAM
SUMMARY
```

selon backend choisi.

---

# 15. Metric Naming

Convention :

```text
techzone_<domain>_<metric>
```

Exemples :

```text
techzone_api_requests_total
techzone_runtime_resolution_duration
techzone_deployment_failures_total
techzone_automation_executions_total
techzone_billing_payment_failures_total
```

---

# 16. Metric Labels

Limiter cardinalité.

Labels recommandés :

```text
module
environment
status
operation
provider
```

Éviter par défaut :

```text
userId
requestId
recordId
free text
```

---

# 17. Health

Distinguer :

```text
PROCESS HEALTH
DEPENDENCY HEALTH
MODULE HEALTH
READINESS
AVAILABILITY
```

---

# 18. Health Status

```text
HEALTHY
DEGRADED
UNHEALTHY
UNKNOWN
MAINTENANCE
```

---

# 19. Readiness

Readiness répond :

```text
CE COMPOSANT PEUT-IL SERVIR SON TRAFIC ?
```

Ne pas confondre avec simple process alive.

---

# 20. Tracing

Une trace contient :

```text
traceId
spanId
parentSpanId
service
operation
start
duration
status
attributes
```

---

# 21. Span Propagation

Propager sur :
- HTTP interne ;
- Data Runtime ;
- Automation ;
- Integration Hub ;
- ERP ;
- provider externe ;
- jobs.

---

# 22. Trace Sampling

Configurable :

```text
ALWAYS for errors/critical
sample normal traffic
```

MVP possible sans tracing distribué complet si contracts/trace IDs sont déjà cohérents.

---

# 23. Events

Observability peut recevoir des événements techniques.

Ne pas créer un second bus métier.

Utiliser l’infrastructure event/outbox existante.

---

# 24. Errors

Error event :

```text
code
category
module
operation
traceId
severity
retryable
safeMessage
detailsSanitized
```

---

# 25. Security Events

Exemples :

```text
LOGIN_FAILED
MFA_FAILED
PERMISSION_DENIED
TENANT_ACCESS_DENIED
SESSION_REVOKED
SUSPICIOUS_ADMIN_ACTION
RATE_LIMIT_TRIGGERED
SECRET_ACCESS_FAILED
```

---

# 26. Security Severity

```text
LOW
MEDIUM
HIGH
CRITICAL
```

---

# 27. Audit

Audit ≠ log debug.

Audit porte sur action significative :

```text
actor
action
target
tenant
result
reason
timestamp
traceId
```

---

# 28. Audit Immutability

Audit doit être logiquement append-only.

Correction éventuelle :
- nouvel événement ;
- jamais modification silencieuse.

---

# 29. Alerting

Alert Rule :

```text
metric/log/event condition
threshold
window
severity
scope
cooldown
notification policy
```

---

# 30. Alert Status

```text
OPEN
ACKNOWLEDGED
RESOLVED
SUPPRESSED
```

---

# 31. Alert Deduplication

Éviter alert storm.

Clé :

```text
rule + scope + fingerprint
```

---

# 32. Alert Cooldown

Une alerte persistante ne doit pas notifier continuellement sans policy.

---

# 33. Alert Routing

Destinations via Notification capability :

```text
in-app
email
SMS
WhatsApp
external webhook
```

selon configuration.

Observability ne stocke pas credentials.

---

# 34. Incident Context

Incident regroupe :

```text
alerts
logs
traces
metrics
deployments
runtime events
security events
audit links
```

---

# 35. Incident Lifecycle

```text
OPEN
INVESTIGATING
MITIGATED
RESOLVED
CLOSED
```

---

# 36. Diagnostic Contract

Chaque module expose si possible :

```text
status
checks
errors
warnings
dependencies
trace/correlation refs
```

Observability agrège.

---

# 37. Module Diagnostics

Modules cibles :

```text
IAM
Business Manager
UI Builder
Automation
Pack Manager
Pack Runtime
Data Runtime
Integration Hub
API Manager
Deployment
Billing
Administration
Database
```

---

# 38. Diagnostic Status

```text
PASS
WARNING
ERROR
UNAVAILABLE
UNKNOWN
```

---

# 39. Tenant Isolation

Tenant A ne peut jamais voir :
- logs B ;
- metrics B ;
- traces B ;
- alerts B ;
- diagnostics B ;
- audit B.

Platform operators peuvent avoir scope transverse explicite.

---

# 40. Platform vs Tenant Observability

Tenant :
- own applications ;
- own environments ;
- own alerts ;
- own logs if exposed.

Platform :
- infrastructure ;
- all tenants according permission ;
- security ;
- operations.

---

# 41. Permissions

Conceptuelles :

```text
observability.overview.read
observability.logs.read
observability.metrics.read
observability.traces.read
observability.alerts.read
observability.alerts.manage
observability.incidents.read
observability.incidents.manage
observability.audit.read
observability.security.read
observability.diagnostics.read
observability.settings.manage
```

---

# 42. Retention

Policies par signal :

```text
logs
metrics
traces
audit
security events
alerts
incidents
```

Audit/security peuvent avoir retention supérieure.

---

# 43. Retention Rules

Ne jamais hard-delete arbitrairement sans policy.

Retention doit être :
- configurable ;
- auditable ;
- tenant/platform aware.

---

# 44. Storage

Possibles :

```text
PostgreSQL for small structured audit/config
specialized log backend
metrics backend
trace backend
object/archive storage
```

Ne pas tout forcer dans Prisma si inadéquat.

---

# 45. Backend Abstraction

Créer contracts/adapters :

```text
LogSink
MetricSink
TraceSink
AuditSink
AlertStore
DiagnosticProvider
```

---

# 46. REAL / MOCK

Mocks permis :
```text
DEV
TEST
DEMO
```

En REAL :
- aucune métrique fictive ;
- aucun faux service health ;
- aucun faux log.

---

# 47. Frontend

Routes :

```text
/observability/overview
/observability/logs
/observability/metrics
/observability/traces
/observability/security-events
/observability/alerts
/observability/incidents
/observability/diagnostics
```

---

# 48. Overview

KPIs réels :

```text
Services Healthy
Services Degraded
Active Alerts
Critical Alerts
Requests/min
Error Rate
P95 Latency
Open Incidents
```

---

# 49. Logs Explorer

Filtres :

```text
time range
tenant
environment
module
service
level
traceId
text
```

---

# 50. Metrics Explorer

Filtres :
- metric ;
- time range ;
- module ;
- environment ;
- labels allowed.

---

# 51. Trace Explorer

Recherche :
- traceId ;
- service ;
- operation ;
- duration ;
- error.

---

# 52. Security Events

Table :
- severity ;
- event ;
- actor ;
- tenant ;
- source ;
- time ;
- status.

---

# 53. Alerts

Table :
- severity ;
- rule ;
- resource ;
- status ;
- opened ;
- last occurrence ;
- assignee.

---

# 54. Incidents

Table :
- incident ;
- severity ;
- status ;
- affected modules ;
- started ;
- owner.

---

# 55. Diagnostics

Matrix :
- module ;
- health ;
- readiness ;
- dependencies ;
- errors ;
- last check.

---

# 56. Correlation View

Given traceId :

```text
Request
↓
Logs
↓
Trace
↓
Deployment
↓
Runtime
↓
Data
↓
Integration
↓
Alerts
```

---

# 57. Source Module Requirements

Chaque module doit au minimum produire :
- traceId ;
- error code ;
- operation ;
- status ;
- duration where meaningful.

---

# 58. Auth / IAM Signals

- login success/failure ;
- MFA ;
- session ;
- permission deny ;
- tenant deny.

---

# 59. Business Manager Signals

- validation ;
- snapshot ;
- contract errors.

---

# 60. UI Builder Signals

- validation ;
- snapshot ;
- renderer errors.

---

# 61. Automation Signals

- execution ;
- retries ;
- failures ;
- timeout.

---

# 62. Pack Manager Signals

- validation ;
- manifest ;
- publication.

---

# 63. Pack Runtime Signals

- resolution ;
- activation ;
- readiness ;
- blocked reasons.

---

# 64. Data Runtime Signals

- query duration ;
- mutation ;
- provider errors ;
- policy deny.

---

# 65. Integration Signals

- provider health ;
- latency ;
- sync ;
- webhook ;
- external errors.

---

# 66. Deployment Signals

- stage ;
- status ;
- duration ;
- rollback ;
- readiness.

---

# 67. Billing Signals

- invoice ;
- payment ;
- webhook ;
- quota ;
- subscription lifecycle.

---

# 68. Administration Signals

- critical actions ;
- delegation ;
- maintenance ;
- jobs.

---

# 69. API Conceptuelle

```http
GET /api/observability/overview
GET /api/observability/logs
GET /api/observability/metrics
GET /api/observability/traces
GET /api/observability/security-events
GET /api/observability/alerts
GET /api/observability/incidents
GET /api/observability/diagnostics
```

Management :

```http
POST /api/observability/alerts/:id/ack
POST /api/observability/alerts/:id/resolve
POST /api/observability/incidents
PATCH /api/observability/incidents/:id
```

Adapter aux APIs réelles.

---

# 70. Security

Defense :
- IAM ;
- tenant filter ;
- field redaction ;
- sensitive log restrictions ;
- query limits ;
- export controls ;
- audit on sensitive searches.

---

# 71. Query Limits

Log/trace search :
- max range ;
- max result count ;
- pagination ;
- timeout ;
- export permission.

---

# 72. Export

Export logs/audit :
- dedicated permission ;
- tenant scope ;
- redaction ;
- audit export event.

---

# 73. Observability Settings

Configure :
- retention ;
- sampling ;
- alert rules ;
- notification routes ;
- redaction policy refs ;
- health intervals.

---

# 74. Tests

Unit :
- logger ;
- redaction ;
- trace propagation ;
- alert rule ;
- dedup ;
- retention ;
- tenant filter.

Integration :
- module signal → store ;
- alert generation ;
- diagnostics ;
- notification.

Security :
- secret leakage ;
- cross tenant ;
- query abuse ;
- fake/mocked data in REAL.

---

# 75. E2E

```text
Request
↓
Trace ID
↓
Module Logs
↓
Metric
↓
Error
↓
Alert
↓
Incident
↓
Diagnostics
↓
Resolution
```

---

# 76. Definition of Done

Observability transversal est DONE si :

- contracts v1/v3 cohérents ;
- traceId end-to-end ;
- structured logs ;
- real metrics ;
- real health ;
- correlation ;
- tenant isolation ;
- redaction ;
- security events ;
- audit append-only ;
- alerting deduplicated ;
- incidents ;
- diagnostics agrégés ;
- retention ;
- no mock REAL frontend ;
- observability failure non bloquante ;
- security/E2E/build/CI verts.
