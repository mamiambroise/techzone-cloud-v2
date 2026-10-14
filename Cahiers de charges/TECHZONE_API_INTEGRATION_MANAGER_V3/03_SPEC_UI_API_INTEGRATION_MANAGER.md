# SPEC UI — API & INTEGRATION MANAGER

---

# 1. Design

Techzone Cloud API identity :
- dark navy sidebar ;
- light workspace ;
- blue/cyan accents ;
- white rounded cards ;
- code/documentation panels ;
- Lucide icons ;
- responsive.

---

# 2. Navigation

```text
API
├── Vue d’ensemble
├── Catalogue API
├── Clients API
├── Accès & Scopes
├── Webhooks
├── Usage & Limites
├── Documentation
└── Diagnostics
```

---

# 3. Overview

Cards :
- Active APIs
- API Clients
- Requests
- Error Rate
- Rate Limited
- Webhook Failures

Real metrics only.

---

# 4. API Catalog

Columns :
- API
- Owner
- Visibility
- Version
- Status
- Consumers
- Documentation
- Actions

---

# 5. API Detail

Tabs :
- Overview
- Versions
- Endpoints
- Scopes
- Limits
- Usage
- Documentation
- Changelog

---

# 6. API Version

Display :
- version
- status
- released
- deprecated
- sunset
- compatibility.

---

# 7. Endpoint List

Table :
- Method
- Path
- Summary
- Required Scope
- Rate Limit
- Status

---

# 8. API Clients

Table :
- Client
- Type
- Tenant/Application
- Status
- Scopes
- Last Used
- Quota
- Actions

---

# 9. Create Client

Wizard :
1 Identity
2 Scope
3 APIs
4 Limits
5 Credential
6 Review.

---

# 10. Credential Created

One-time reveal screen.

Warning:
`Ce secret ne sera plus affiché.`

---

# 11. Credential Management

Show only:
- prefix
- created
- expiry
- last used
- status.

Actions:
- rotate
- revoke.

---

# 12. Scopes

Matrix :
- Scope
- APIs
- Operations
- Clients
- Status.

---

# 13. Client Access

Show:
- allowed APIs
- scopes
- tenant/app restriction
- policies
- effective access.

---

# 14. Rate Limits

Table :
- Client/API
- requests
- window
- burst
- status.

---

# 15. Quotas

Display :
- limit
- used
- remaining
- reset date.

---

# 16. Usage

Charts :
- requests over time
- errors
- latency
- top APIs
- top clients.

---

# 17. Webhooks

Table :
- Event
- Endpoint Host
- Status
- Success Rate
- Last Delivery
- Failures.

---

# 18. Create Webhook

Fields :
- Event
- Endpoint
- signing config
- retry policy
- filters.

Security validation inline.

---

# 19. Webhook Detail

Tabs :
- Overview
- Deliveries
- Retry
- Security
- Diagnostics.

---

# 20. Delivery Detail

Show:
- event ID
- attempt
- status
- HTTP result
- duration
- next retry
- trace ID.

Payload sanitized.

---

# 21. Documentation Portal

Left:
- APIs
- versions

Center:
- docs

Right:
- auth/scopes/examples.

---

# 22. Try API

Optional controlled sandbox.

Never expose real client secret in page.

---

# 23. Deprecation Banner

Show:
- deprecated version
- replacement
- sunset date.

---

# 24. Diagnostics

Checks :
- auth
- Registry
- scopes
- limiter
- usage
- webhooks
- docs
- provider mode.

---

# 25. Error States

401/403/429/quota/404/version retired/webhook SSRF.

---

# 26. Responsive

Mobile :
- API cards
- client cards
- usage summary
- webhook status.

---

# 27. UI DoD

- no secret after creation ;
- real metrics ;
- scope visibility ;
- clear version lifecycle ;
- webhook delivery history ;
- documentation matches backend ;
- responsive.
