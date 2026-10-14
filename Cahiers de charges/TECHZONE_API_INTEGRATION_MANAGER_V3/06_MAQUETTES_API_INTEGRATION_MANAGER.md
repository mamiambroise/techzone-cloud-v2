# MAQUETTES — API & INTEGRATION MANAGER

---

# M01 — API Overview
Cards:
- Active APIs
- Clients
- Requests
- Errors
- Rate Limited
- Webhook Failures

# M02 — API Catalog
Table:
- API
- Owner
- Visibility
- Version
- Status
- Consumers
- Docs

# M03 — API Detail
Tabs:
- Overview
- Versions
- Endpoints
- Scopes
- Limits
- Usage
- Docs
- Changelog

# M04 — API Versions
Timeline/table:
- Version
- Status
- Released
- Deprecated
- Sunset
- Replacement

# M05 — Endpoint List
Method/path/scope/limit/status.

# M06 — Endpoint Detail
Request/response/errors/examples.

# M07 — API Clients
Client/type/context/status/scopes/last used.

# M08 — Create Client
Wizard:
Identity → APIs → Scopes → Limits → Credential → Review.

# M09 — Credential One-Time Reveal
Secret shown once with copy action and warning.

# M10 — Client Detail
Tabs:
Overview / APIs / Scopes / Credentials / Usage / Audit.

# M11 — Credential List
Prefix/status/created/expiry/last used.

# M12 — Rotate Credential
Grace period + confirmation.

# M13 — Revoke Client/Credential
Strong confirmation.

# M14 — Scopes Registry
Scope/APIs/operations/clients/status.

# M15 — Access Matrix
Client × API × scopes.

# M16 — Policy Detail
Tenant/app/environment/entitlement rules.

# M17 — Rate Limits
Client/API/window/burst/current status.

# M18 — Quotas
Limit/used/remaining/reset.

# M19 — Usage Dashboard
Requests/errors/latency/top APIs/top clients.

# M20 — Usage Detail
Per API/client/version/status.

# M21 — Webhook Subscriptions
Event/endpoint/status/success/last delivery.

# M22 — Create Webhook
Event/endpoint/signing/retry/filter.

# M23 — Webhook Detail
Overview/deliveries/security/retry/diagnostics.

# M24 — Delivery History
Event/attempt/status/HTTP/time/next retry.

# M25 — Delivery Detail
Sanitized headers/payload metadata + signature status.

# M26 — Failed Webhooks
Queue of failures + retry action.

# M27 — Developer Portal Home
API cards + search + versions.

# M28 — API Documentation
Navigation + endpoint docs + auth/scopes.

# M29 — Authentication Docs
M2M flow, credential use, rotation.

# M30 — Rate Limit Docs
Current policy and headers.

# M31 — Deprecation Notice
Old/new version + sunset date.

# M32 — Diagnostics
Auth/Registry/scopes/limiter/quota/webhook/docs.

# M33 — Diagnostic Detail
Stage/severity/code/message/trace.

# M34 — 429 State
Rate limit exceeded with retry metadata.

# M35 — Quota Exceeded
Usage bar + reset date.

# M36 — Scope Denied
403 with required scope safely shown.

# M37 — Revoked Credential
401 controlled state.

# M38 — Mock Provider Warning
DEV/TEST only banner.

# M39 — Mobile API Cockpit
Cards + clients + webhook status + usage.

# M40 — Architecture Flow

```text
Techzone Internal APIs
↓
API Contracts
↓
API Manager
↓
Client Auth / Scopes / Limits
↓
Consumers
```

---

# Visual Direction

- premium SaaS ;
- dark navy sidebar ;
- light workspace ;
- cyan/blue API accent ;
- white rounded cards ;
- code panels ;
- green ACTIVE ;
- amber DEPRECATED ;
- red REVOKED/ERROR ;
- Lucide icons ;
- responsive ;
- no visible secrets ;
- no fake usage metrics.
