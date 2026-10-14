# SPEC UI — TECHZONE CLOUD PACK RUNTIME

---

# 1. Design

Style Techzone Cloud :

- sidebar bleu nuit ;
- fond clair ;
- Runtime accents vert/turquoise ;
- cartes blanches ;
- badges de santé ;
- Lucide icons ;
- responsive ;
- pas de faux statut.

---

# 2. Navigation

```text
EXÉCUTION
└── Runtime
```

Workspace :

```text
Runtime
├── Overview
├── Applications
├── Resolutions
├── Activations
├── Cache
└── Diagnostics
```

---

# 3. Runtime Overview

Cards :
- Active Applications ;
- Active Contexts ;
- Executable Resolutions ;
- Blocked ;
- Degraded ;
- Cache hit ratio if real.

---

# 4. Applications

Table :

```text
Application
Application Version
Pack Version
Environment
Runtime Status
Readiness
Last Activation
Actions
```

---

# 5. Launch Application

Flow UI :

```text
Resolve
↓
Executable?
↓
Activate/Reuse Context
↓
Readiness
↓
Open Application
```

---

# 6. Resolving State

Display :
- loading indicator ;
- PackVersion ;
- Environment ;
- validation stages.

No app renderer yet.

---

# 7. Blocked Screen

Prominent status :

```text
RUNTIME BLOCKED
```

Show:
- code ;
- reason ;
- failed requirements ;
- correlation ID.

Actions:
- diagnostics ;
- return ;
- retry resolution if allowed.

No render iframe/app.

---

# 8. Executable Resolution

Show:
- resolutionId shortened ;
- ApplicationVersion ;
- PackVersion ;
- Environment ;
- capabilities ;
- effective config status ;
- integrity.

CTA:
- Activate.

---

# 9. Runtime Context Detail

Sections:
- identity ;
- resolution ;
- activation ;
- readiness ;
- manifest ;
- data ;
- integrations ;
- automation ;
- cache ;
- diagnostics.

---

# 10. Effective Manifest

Read-only structured viewer.

Tabs:
- Summary
- Business
- UI
- Automation
- Configuration
- Capabilities
- Data
- Integrations
- Integrity.

---

# 11. Activation

Progress timeline:

```text
Resolution
Context Creation
Cache
Providers
Readiness
Active
```

---

# 12. Active Runtime

Header:
- ACTIVE ;
- Application ;
- Version ;
- Environment.

Actions:
- Open app ;
- Diagnostics ;
- Deactivate if permitted.

---

# 13. Readiness

Checklist:
- Manifest
- Business
- UI
- Data Provider
- Mandatory Connectors
- Automation
- Required Capabilities.

---

# 14. Resolution List

Columns:
- Resolution
- Application
- PackVersion
- Environment
- Status
- Created
- Expires
- Diagnostics.

---

# 15. Activations List

Columns:
- Application
- PackVersion
- Environment
- Context
- Status
- Activated
- Actor
- Actions.

---

# 16. Cache

Display:
- layer ;
- entries ;
- hit/miss if real ;
- last invalidation.

Admin action:
- invalidate scoped cache.

---

# 17. Diagnostics

Table:
- Stage
- Severity
- Code
- Message
- Resource
- Time
- Correlation ID.

---

# 18. PublishedApplication

Rendered only after:
- EXECUTABLE resolution ;
- ACTIVE/ready context according flow.

Pass runtime context internally.

---

# 19. Session/Permission Errors

Handle:
- 401 ;
- 403 ;
- Resolution expired ;
- Context inactive ;
- Environment unavailable.

---

# 20. Version Mismatch

Dedicated blocking panel:

```text
Application Version incompatible
```

Show expected/actual identifiers safely.

---

# 21. Deactivation

Confirmation:
- Application
- Environment
- current PackVersion
- consequence.

---

# 22. Empty States

- no active applications ;
- no resolutions ;
- no diagnostics.

---

# 23. Responsive

Desktop:
- tables + detail panel.

Tablet:
- cards/drawers.

Mobile:
- runtime cards ;
- readiness accordion ;
- blocked screen optimized.

---

# 24. UI DoD

- no render before resolution ;
- BLOCKED visibly blocks ;
- Effective Manifest only ;
- runtime context visible ;
- real health/readiness ;
- no secret ;
- responsive ;
- permissions reflected.
