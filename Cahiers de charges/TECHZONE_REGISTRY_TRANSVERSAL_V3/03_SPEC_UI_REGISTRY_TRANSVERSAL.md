# SPEC UI — REGISTRY TRANSVERSAL

---

# 1. Visual Identity

- dark navy sidebar ;
- very light workspace ;
- gray-blue Platform accent ;
- blue/violet Registry identity ;
- white rounded cards ;
- compatibility badges ;
- Lucide icons ;
- responsive.

---

# 2. Navigation

```text
PLATEFORME
└── Registry
    ├── Vue d’ensemble
    ├── Entrées
    ├── Capacités
    ├── Providers
    ├── Schémas
    ├── Compatibilité
    ├── Disponibilité
    └── Diagnostics
```

---

# 3. Overview

Cards :

```text
Entries
Available
Deprecated
Unavailable
Disabled
Conflicts
Providers
Schemas
```

Source distribution:
- Business
- UI
- Automation
- Data
- Integration
- Runtime
- API.

---

# 4. Entries List

Columns :

```text
Key
Namespace
Version
Owner
Provider
Scope
Status
Availability
Updated
Actions
```

Filters :
- Namespace
- Owner
- Provider
- Scope
- Status
- Availability
- Version.

---

# 5. Entry Detail

Header :
- stable key
- version
- status
- effective availability.

Tabs :

```text
Overview
Versions
Capabilities
Schemas
Compatibility
Availability
References
Diagnostics
History
```

---

# 6. Versions

Table :
- Version
- Status
- Provider
- Schema
- Availability
- Deprecated
- Used By.

---

# 7. Capabilities Explorer

Search:
- capability key
- namespace
- provider
- environment.

Results:
- supported by
- versions
- availability.

---

# 8. Capability Detail

Show :
- key
- type
- owner
- providers
- entries
- environments
- consumers.

---

# 9. Providers

Table :
- Provider
- Owner
- Types
- Entries
- Status
- Health
- Environments.

---

# 10. Provider Detail

Show :
- capabilities
- versions
- entries
- health
- diagnostics.

No credentials.

---

# 11. Schemas

Table :
- Schema
- Version
- Owner
- Supported By
- Status
- Compatibility.

---

# 12. Schema Detail

Show :
- reference
- version
- owners
- consumers
- runtime support
- compatibility warnings.

---

# 13. Compatibility Explorer

Input :

```text
Requirement
Version / Range
Capability
Schema
Provider
Tenant
Environment
```

CTA:
`Vérifier`.

---

# 14. Compatibility Result

Show :

```text
Status
Selected Candidate
Candidates Evaluated
Rejected Candidates
Reason Codes
Warnings
```

---

# 15. Availability Matrix

Rows :
- Entry/Capability.

Columns :
- Environments.

Cells :
- AVAILABLE
- DEGRADED
- UNAVAILABLE
- NOT_CONFIGURED.

---

# 16. Availability Detail

Show :
- registry status
- provider configured
- provider health
- environment
- effective availability
- timestamp.

---

# 17. References

List :
- PackVersions
- RuntimeContexts
- Deployments
- Applications.

Used for removal safety.

---

# 18. Deprecation

Modal :
- replacement key/version
- message
- target removal date
- affected references.

---

# 19. Disable

Strong confirmation:
- affected PackVersions
- active contexts
- environments.

---

# 20. Remove

Critical modal.

Block when references are unsafe.

---

# 21. Namespace Governance

Admin technical screen :
- Namespace
- Owner
- Allowed Writers
- Scope
- Status.

---

# 22. Registration History

Timeline :
- registered
- metadata updated
- deprecated
- availability changed
- disabled.

---

# 23. Diagnostics

Cards :
- Business Registry
- UI Registry
- Automation Registry
- Data Registry
- Integration Registry
- Runtime Registry
- API Registry.

States real only.

---

# 24. Resolution Diagnostics

Show :
- requirement
- candidates
- filters
- selected
- rejected reasons
- trace ID.

---

# 25. Collision Screen

Show:
- namespace/key/version
- conflicting owners/providers
- action required.

---

# 26. Cache Diagnostics

Admin:
- hit ratio
- entries
- invalidations
- scopes.

No sensitive payload.

---

# 27. Error States

Support :
- Not Found
- Namespace Denied
- Scope Forbidden
- Version Conflict
- Schema Unsupported
- Provider Unavailable
- Environment Mismatch.

---

# 28. Permission States

Read-only:
- discovery/resolution.

Manager:
- register/update.

Platform owner:
- namespace governance.

---

# 29. Responsive

Mobile:
- entry cards
- capability search
- compatibility result
- diagnostics.

---

# 30. UI DoD

- real entries
- stable keys visible
- source owner visible
- REGISTERED distinct from AVAILABLE
- compatibility reasons explicit
- references before removal
- no fake health
- responsive.
