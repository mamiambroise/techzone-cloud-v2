# CAHIER DES CHARGES — TECHZONE CLOUD REGISTRY TRANSVERSAL
## Étape 1 — Cible fonctionnelle et architecturale

**Projet :** Techzone Cloud  
**Module :** Registry Platform  
**Version cible :** 3.0  
**Nature :** Transversale  
**Statut :** Spécification cible

---

# 1. Vision

Registry Platform répond aux questions suivantes :

```text
Qu'est-ce qui existe dans Techzone Cloud ?
Quel module en est propriétaire ?
Quelle version est disponible ?
Quelles capacités sont supportées ?
Quel schéma ou contrat est compatible ?
L'élément est-il disponible dans ce Tenant ?
L'élément est-il disponible dans cet Environment ?
Peut-il être utilisé par Pack Manager ?
Peut-il être résolu par Pack Runtime ?
```

Le Registry :

```text
RÉFÉRENCE
INDEXE
DÉCRIT
VERSIONNE
REND DÉCOUVRABLE
VÉRIFIE LA COMPATIBILITÉ
RÉSOUT
```

mais ne réinvente pas les définitions des modules.

---

# 2. Position dans Techzone Cloud

```text
BUSINESS MANAGER ──────────────┐
UI BUILDER ────────────────────┤
AUTOMATION ────────────────────┤
DATA PLATFORM ─────────────────┤
INTEGRATION HUB ───────────────┤
API MANAGER ───────────────────┤
PACK RUNTIME ──────────────────┤
PLATFORM SERVICES ─────────────┤
                               ↓
                    REGISTRY PLATFORM
              Discovery • Versioning
              Capabilities • Schemas
              Availability • Compatibility
                               ↓
                     PACK MANAGER
                               ↓
                      PACK RUNTIME
                               ↓
                 ENVIRONMENT / DEPLOYMENT
```

---

# 3. Principe de propriété

```text
MODULE OWNER
définit • implémente • valide
        ↓
REGISTRY
indexe • décrit • versionne • expose
        ↓
CONSUMERS
découvrent • résolvent • vérifient
```

Registry ne devient jamais propriétaire :
- des Features BM ;
- des Components UI ;
- des Nodes Automation ;
- des Providers Data ;
- des Connectors Integration ;
- des Runtime Capabilities.

---

# 4. Registres spécialisés

```text
BUSINESS REGISTRY
├── Features
├── Capabilities
└── Business Events

UI REGISTRY
├── Components
├── Actions
└── Templates

AUTOMATION REGISTRY
├── Nodes
├── Triggers
├── Actions
└── Transforms

DATA REGISTRY
├── Providers
├── Repositories
├── Contracts
└── Capabilities

INTEGRATION REGISTRY
├── Connectors
├── Contracts
└── Capabilities

RUNTIME REGISTRY
├── Runtime Capabilities
├── Definition Schemas
└── Compatibility

PLATFORM REGISTRY
├── API Contracts
├── Platform Capabilities
└── Shared Schemas
```

---

# 5. Registry Core

Fonctions :

```text
REGISTER
UPDATE METADATA
DISCOVER
GET
LIST
RESOLVE
CHECK AVAILABILITY
CHECK COMPATIBILITY
DEPRECATE
DISABLE
DEREGISTER
DIAGNOSE
```

---

# 6. Registry Entry

Modèle conceptuel :

```text
RegistryEntry
├── id
├── namespace
├── key
├── version
├── type
├── owner
├── provider
├── scope
├── tenantId?
├── applicationId?
├── applicationVersionId?
├── environmentId?
├── status
├── capabilities
├── schemaRef
├── metadata
├── compatibility
├── createdAt
└── updatedAt
```

Toutes les propriétés ne nécessitent pas une table Prisma dédiée.

---

# 7. Stable Keys

Les clés inter-modules sont stables et indépendantes des labels UI.

Exemples :

```text
business.feature.inventory
business.capability.invoice.generate
business.event.order.created

ui.component.datatable
ui.action.navigate
ui.template.admin-list

automation.node.condition
automation.trigger.business-event
automation.action.send-email

data.provider.prisma
data.capability.transaction

integration.connector.dolibarr
integration.capability.invoice.create

runtime.capability.business-definition-v2
runtime.capability.ui-definition-v1
```

---

# 8. Namespaces

Namespaces recommandés :

```text
business
ui
automation
data
integration
runtime
api
platform
```

Sous-domaines :

```text
business.feature
business.capability
business.event

ui.component
ui.action
ui.template

automation.node
automation.trigger
automation.action

data.provider
data.repository
data.contract
data.capability

integration.connector
integration.contract
integration.capability

runtime.capability
runtime.schema

api.contract
api.version
api.scope

platform.capability
platform.schema
```

---

# 9. Namespace Ownership

Règle critique :

```text
OWNER OF NAMESPACE
=
ONLY DEFAULT WRITER
```

Exemple :

```text
ui-builder
→ ui.component.*

integration-hub
→ integration.connector.*
```

Une écriture inter-namespace exige une permission/exception explicite.

---

# 10. Registration

Enregistrement possible :

```text
startup registration
deployment registration
controlled API registration
event-driven registration
configuration loading
```

Choisir la stratégie la plus simple compatible avec le code réel.

---

# 11. Registration Contract

Exemple :

```json
{
  "namespace": "ui.component",
  "key": "datatable",
  "version": "1.2.0",
  "owner": "ui-builder",
  "provider": "core",
  "scope": "GLOBAL",
  "status": "AVAILABLE",
  "capabilities": [
    "binding",
    "pagination",
    "sorting"
  ]
}
```

---

# 12. Owner

Chaque entrée possède un owner stable.

Exemples :

```text
business-manager
ui-builder
automation
data-platform
integration-hub
pack-runtime
api-manager
platform
plugin:<provider>
```

---

# 13. Provider

Owner ≠ Provider.

Exemple :

```text
Owner: integration-hub
Provider: dolibarr
```

ou :

```text
Owner: ui-builder
Provider: core
```

---

# 14. Scope

Scopes :

```text
GLOBAL
TENANT
APPLICATION
APPLICATION_VERSION
ENVIRONMENT
```

N’utiliser que ceux réellement nécessaires.

---

# 15. Tenant Isolation

Entrée TENANT scoped :

```text
tenantId mandatory
```

Tenant A ne peut jamais :
- découvrir B ;
- résoudre B ;
- modifier B ;
- diagnostiquer B.

---

# 16. Lifecycle

États :

```text
REGISTERED
AVAILABLE
DEPRECATED
DISABLED
UNAVAILABLE
REMOVED
```

Règle :

```text
REGISTERED ≠ AVAILABLE
```

---

# 17. Availability

Availability combine :

```text
Registry metadata
+
Provider state
+
Tenant config
+
Environment config
+
Health
=
Effective Availability
```

---

# 18. Availability Dimensions

Exemple :

```text
integration.connector.dolibarr
Registered       YES
Configured       YES
Reachable        NO
Effective Status UNAVAILABLE
```

---

# 19. Environment Availability

Registry doit pouvoir répondre :

```text
Capability X available in DEV?
Capability X available in STAGING?
Capability X available in PRODUCTION?
```

sans inventer les environnements.

---

# 20. Capabilities

Une capability doit représenter une capacité réelle.

Exemples :

```text
binding
sorting
pagination
transaction
aggregate
invoice.create
ui-definition.v1
```

---

# 21. Capability Types

Ne pas fusionner :

```text
Business Capability
UI Capability
Automation Capability
Data Capability
Connector Capability
Runtime Capability
Platform Capability
```

---

# 22. Capability Availability

Distinction :

```text
DECLARED
REGISTERED
AVAILABLE
SUPPORTED
EXECUTABLE
```

Registry n’annonce pas `AVAILABLE` sans preuve/état réel approprié.

---

# 23. Versioning

SemVer lorsque pertinent :

```text
MAJOR.MINOR.PATCH
```

mais sans remplacer un versioning existant fiable.

---

# 24. Version Resolution

Exemple :

```text
Required:
ui.component.datatable >= 1.1.0

Candidates:
1.0.0
1.2.0
1.3.0

Resolved:
1.3.0
```

uniquement si les règles du projet autorisent la plage.

---

# 25. Publication Determinism

Pour une PackVersion publiée :

```text
PREPARATION
→ version range acceptable

PUBLICATION
→ exact version locked

RUNTIME
→ exact version reproducible
```

Le Runtime ne doit jamais prendre automatiquement une version plus récente.

---

# 26. Dependency Boundary

Registry aide à résoudre :

```text
key
version
schema
capability
provider
availability
```

Mais ne remplace pas le Dependency Resolver complet du Pack Manager.

---

# 27. Schema Registry

Schémas référencés :

```text
business.definition.v2
ui.definition.v1
automation.definition.v1
data.contract.v1
pack.manifest.v1
runtime.context.v1
```

---

# 28. Schema Support

Runtime Registry peut exposer :

```text
business.definition.v2 → SUPPORTED
ui.definition.v1 → SUPPORTED
automation.definition.v1 → SUPPORTED
```

---

# 29. Schema Compatibility

Si Pack exige :

```text
ui.definition.v2
```

et Runtime ne le supporte pas :

```text
REGISTRY_SCHEMA_UNSUPPORTED
```

---

# 30. Compatibility Engine

Input :

```text
required key
version/range
schema
capabilities
provider
scope
environment
```

Output :

```text
COMPATIBLE
INCOMPATIBLE
UNAVAILABLE
MISSING
DEPRECATED
DISABLED
```

---

# 31. Compatibility Result

Structure :

```text
requirement
candidates
selectedCandidate?
rejectedCandidates
reasons
warnings
status
traceId
```

---

# 32. Discovery

Recherche par :

```text
namespace
key
type
capability
provider
version
status
scope
owner
environment
```

---

# 33. Search

Search frontend/backend :
- server-side ;
- paginated ;
- tenant-aware ;
- indexed.

---

# 34. Collision Detection

Détecter :

```text
same namespace
same key
same version
different owner/provider
```

Erreur :

```text
REGISTRY_DUPLICATE_KEY
```

---

# 35. Override

Aucun remplacement silencieux.

Plugin/provider override :
- explicit policy ;
- explicit priority ;
- audit.

---

# 36. Deprecation

Métadonnées :

```text
replacementKey
replacementVersion?
deprecatedSince
removalTarget
message
```

---

# 37. Removal Safety

Avant `REMOVED` :

```text
published Pack references?
active Runtime Contexts?
active Deployments?
dependent Registry Entries?
```

Si oui :
- block/remove later ;
- or explicit safe policy.

---

# 38. References

Registry peut indexer les références connues :

```text
Used by PackVersion
Used by RuntimeContext
Used by Environment
Used by Module
```

sans devenir propriétaire de ces ressources.

---

# 39. Cache

Caches :

```text
entry lookup
version lookup
capability lookup
compatibility
availability
schema support
```

---

# 40. Cache Key

Doit inclure selon besoin :

```text
namespace
key
version/range
tenant
application
environment
provider
```

---

# 41. Cache Invalidation

Invalider sur :

```text
REGISTER
UPDATE
DEPRECATE
DISABLE
REMOVE
PROVIDER STATE CHANGE
DEPLOYMENT
ENVIRONMENT AVAILABILITY CHANGE
```

---

# 42. Distributed Registry

Si sources distribuées :

```text
startup registration
event-driven update
API discovery
configuration load
```

Éviter sync complexe inutile.

---

# 43. Resilience

Si Registry temporairement indisponible :

```text
existing active Runtime Context
→ may continue from validated snapshot

new resolution
→ MUST NOT invent result
```

---

# 44. Snapshots

Pack Manager / Pack Runtime peuvent figer :

```text
key
resolvedVersion
provider
capabilities
schema
compatibility metadata
```

Registry ne devient pas propriétaire du snapshot.

---

# 45. Business Registry

Business Manager expose :

```text
Features
Business Capabilities
Business Events
Contract Versions
```

---

# 46. UI Registry

UI Builder expose :

```text
Components
Actions
Templates
Responsive capabilities
Binding capabilities
```

---

# 47. Automation Registry

Automation expose :

```text
Nodes
Triggers
Actions
Transforms
Execution capabilities
```

---

# 48. Data Registry

Data Platform expose :

```text
Providers
Repositories
Data Contracts
Data Capabilities
```

---

# 49. Integration Registry

Integration Hub expose :

```text
Connectors
Integration Contracts
Connector Capabilities
Provider Versions
```

---

# 50. Runtime Registry

Pack Runtime expose :

```text
Runtime Capabilities
Definition Schemas
Runtime Schema Support
Compatibility metadata
```

---

# 51. API Registry

API Manager peut exposer :

```text
API Contracts
API Versions
Scopes
Compatibility
```

sans dupliquer son catalogue complet.

---

# 52. Pack Manager Integration

Pack Manager consomme Registry pour :

```text
Feature existence
UI component support
Automation node support
Data provider support
Connector availability
Runtime capability support
Schema compatibility
```

Puis verrouille les références publiées.

---

# 53. Pack Runtime Integration

Runtime :

```text
loads exact Manifest refs
↓
checks Registry/runtime support
↓
checks availability
↓
builds Effective Manifest
```

Aucune substitution silencieuse.

---

# 54. Environment & Deployment Integration

Preflight peut demander :

```text
required capability
provider
environment
availability
compatibility
```

---

# 55. Observability Integration

Registry produit :

```text
registration events
resolution events
compatibility failures
availability changes
conflicts
cache metrics
```

---

# 56. Registry Events

Exemples :

```text
registry.entry.registered
registry.entry.updated
registry.entry.deprecated
registry.entry.disabled
registry.entry.removed
registry.conflict.detected
registry.availability.changed
```

---

# 57. API

Lecture :

```http
GET /api/registry/entries
GET /api/registry/entries/:namespace/:key
GET /api/registry/entries/:namespace/:key/versions
GET /api/registry/capabilities
GET /api/registry/providers
GET /api/registry/schemas
```

Resolution :

```http
POST /api/registry/resolve
POST /api/registry/resolve/batch
POST /api/registry/compatibility/check
POST /api/registry/availability/check
```

Diagnostics :

```http
GET /api/registry/diagnostics
```

Gestion contrôlée :

```http
POST  /api/registry/entries
PATCH /api/registry/entries/:id
POST  /api/registry/entries/:id/deprecate
POST  /api/registry/entries/:id/disable
POST  /api/registry/entries/:id/remove
```

---

# 58. Internal Registration

Privilégier :
- service-to-service registration ;
- startup registrations ;
- deployment controlled registration.

Éviter une API publique générique permettant de publier n’importe quoi.

---

# 59. IAM

Permissions :

```text
registry.read
registry.resolve
registry.compatibility.read
registry.availability.read
registry.diagnostics.read
registry.manage
registry.deprecate
registry.disable
registry.remove
```

---

# 60. Namespace Authorization

En plus de permission IAM :

```text
registry.manage
+
namespace ownership
```

---

# 61. Audit

Auditer :

```text
ENTRY_REGISTERED
ENTRY_UPDATED
ENTRY_DEPRECATED
ENTRY_DISABLED
ENTRY_REMOVED
REGISTRY_CONFLICT_DETECTED
NAMESPACE_OVERRIDE
```

---

# 62. Error Contract

```text
REGISTRY_ENTRY_NOT_FOUND
REGISTRY_DUPLICATE_KEY
REGISTRY_VERSION_NOT_FOUND
REGISTRY_VERSION_CONFLICT
REGISTRY_ENTRY_DISABLED
REGISTRY_ENTRY_UNAVAILABLE
REGISTRY_CAPABILITY_MISSING
REGISTRY_SCHEMA_UNSUPPORTED
REGISTRY_PROVIDER_UNAVAILABLE
REGISTRY_SCOPE_FORBIDDEN
REGISTRY_OWNER_MISMATCH
REGISTRY_NAMESPACE_DENIED
REGISTRY_COMPATIBILITY_FAILED
REGISTRY_ENVIRONMENT_MISMATCH
REGISTRY_REFERENCE_IN_USE
```

---

# 63. Observability

Fields :

```text
requestId
traceId
tenantId
applicationId
environmentId
namespace
key
version
provider
operation
duration
status
errorCode
```

---

# 64. Metrics

Exemples :

```text
registry_entries_total
registry_resolution_total
registry_resolution_errors_total
registry_compatibility_failures_total
registry_conflicts_total
registry_cache_hit_ratio
registry_unavailable_entries
registry_availability_changes_total
```

---

# 65. Navigation

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

# 66. Overview

KPIs réels :

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

---

# 67. Entries

Colonnes :

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
```

---

# 68. Entry Detail

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

# 69. Capability Explorer

Permet :
- search capability ;
- see providers ;
- see versions ;
- see environments ;
- see current availability.

---

# 70. Compatibility Explorer

Input :
- requirement ;
- environment ;
- tenant/app context.

Output :
- candidates ;
- selected ;
- rejected ;
- reasons.

---

# 71. Availability View

Matrix :

```text
Entry × Environment
```

Status :
- AVAILABLE ;
- DEGRADED ;
- UNAVAILABLE ;
- NOT_CONFIGURED.

---

# 72. Diagnostics

Afficher :

```text
Business Registry
UI Registry
Automation Registry
Data Registry
Integration Registry
Runtime Registry
API Registry
```

avec états réels.

---

# 73. REAL / MOCK

En mode REAL :
- aucun faux entry ;
- aucune fake availability ;
- aucun mock provider silencieux.

---

# 74. Performance

Prévoir :

```text
indexed stable keys
pagination
server-side filters
cache
batch resolution
lazy diagnostics
```

---

# 75. Tests unitaires

```text
StableKey
Namespace
Registration
Duplicate
VersionResolver
CapabilityResolver
SchemaCompatibility
ProviderResolution
ScopeResolver
AvailabilityResolver
Deprecation
RemovalSafety
CacheKey
```

---

# 76. Tests intégration

```text
Business Manager → Registry
UI Builder → Registry
Automation → Registry
Data Platform → Registry
Integration Hub → Registry
API Manager → Registry
Pack Manager → Registry
Pack Runtime → Registry
Environment → Registry
```

---

# 77. Security Tests

```text
Cross-tenant discover
Cross-tenant resolve
Cross-tenant update
Namespace takeover
Unauthorized register
Unauthorized deprecate
Unauthorized disable
Provider injection
Malicious metadata
Reference removal in use
```

---

# 78. Compatibility Tests

```text
exact version
compatible range
missing version
missing capability
deprecated version
disabled entry
unavailable provider
unsupported schema
environment mismatch
```

---

# 79. E2E

```text
Module registers definition
↓
Registry discovery
↓
Pack Manager resolves requirement
↓
Pack validation
↓
Exact version locked
↓
Publish
↓
Pack Runtime loads exact ref
↓
Registry compatibility check
↓
Environment availability
↓
Runtime Context
```

---

# 80. Definition of Done

Registry transversal est DONE si :

- stable keys ;
- namespaces ;
- namespace ownership ;
- tenant isolation ;
- owner/provider distinction ;
- lifecycle ;
- REGISTERED ≠ AVAILABLE ;
- capability registry réel ;
- schemas versionnés ;
- compatibility engine ;
- environment-aware availability ;
- deterministic published resolution ;
- collision detection ;
- removal safety ;
- cache scoped ;
- batch resolution ;
- Pack Manager/Runtime integrated ;
- no silent substitution ;
- no REAL mock ;
- diagnostics réels ;
- security/E2E/build/CI verts.
