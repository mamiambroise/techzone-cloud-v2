# CAHIER DES CHARGES COMPLET ET DÉTAILLÉ — BUSINESS MANAGER

## BM-CDC-07 — Integration, Contracts & Runtime Bridge

### Pont contractuel entre la configuration Business Manager, les systèmes externes et les moteurs Runtime

**Projet :** Techzone Cloud  
**Module :** Business Manager  
**Référence :** `BM-CDC-07`  
**Nom :** Integration, Contracts & Runtime Bridge  
**Priorité :** 🔴 P0 — Intégration critique  
**Type :** Transversal fonctionnel et technique — Backend + API + Contrats + Frontend + Base de données + Tests  
**Prérequis :** `BM-CDC-00` à `BM-CDC-06`  
**Consommateur principal :** `BM-CDC-08 — Validation, Tests & Quality Manager`, Pack Manager, Pack Runtime, Application/UI Runtime, ERP Adapter, API/Integration Layer  
**Statut :** Spécification fonctionnelle de référence

---

# 1. Finalité

BM-CDC-07 constitue la **frontière officielle du Business Manager avec le reste de Techzone Cloud**.

Les CDC précédents construisent une Application :

```text
BM-CDC-01 → Application
BM-CDC-02 → ApplicationVersion / Lifecycle
BM-CDC-03 → Data Model
BM-CDC-04 → Features / Capabilities
BM-CDC-05 → Menus / Navigation
BM-CDC-06 → Configuration / Metadata
```

BM-CDC-07 doit transformer ces éléments internes en **contrats stables, versionnés, validables et consommables**.

Il répond à la question :

> **Comment une ApplicationVersion configurée dans Business Manager est-elle exposée proprement aux Runtime, ERP Adapter, Pack Runtime, API Layer et autres moteurs sans leur donner accès aux structures internes du Business Manager ?**

---

# 2. Principe fondamental

Aucun consommateur externe ne doit dépendre directement :

```text
des tables BM
des repositories BM
des classes Domain internes
de la structure UI du Business Manager
des détails de stockage
```

La communication doit passer par :

```text
Contracts
Snapshots
Resolvers
Adapters
Events
Runtime Bridge
```

Principe :

```text
BUSINESS MANAGER INTERNAL MODEL
              ↓
       CONTRACT LAYER
              ↓
       RUNTIME BRIDGE
              ↓
   EXTERNAL CONSUMERS
```

---

# 3. Objectifs

BM-CDC-07 doit fournir :

```text
Business Contract Registry
Application Contract
ApplicationVersion Contract
Data Model Contract
Feature Contract
Capability Contract
Navigation Contract
Configuration Contract
Metadata Contract

Runtime Manifest
Runtime Bridge
Runtime Resolver

Integration Registry
Integration Binding
Adapter Contracts

Contract Versioning
Contract Compatibility
Contract Validation
Contract Diff

Snapshot Assembly
Snapshot Manifest
Runtime Readiness

Event Contracts
Webhook-ready Events

Caching
Revision Management
Observability
Security
Audit
Tests
```

---

# 4. Hors périmètre

BM-CDC-07 ne recrée pas :

```text
Application CRUD                  → BM-CDC-01
Version lifecycle                → BM-CDC-02
Entity / Field / Relation        → BM-CDC-03
Feature / Capability             → BM-CDC-04
Menu / Navigation authoring      → BM-CDC-05
Configuration authoring          → BM-CDC-06
ERP-specific implementation      → ERP Adapter
Pack authoring                    → Pack Manager
Runtime UI rendering              → Application/UI Runtime
Business data execution           → Data/Query/Execution Runtime
Rules / Workflow execution        → Rules/Workflow/Automation
Global quality gate               → BM-CDC-08
```

BM-CDC-07 **expose et relie** ; il ne doit pas absorber les moteurs consommateurs.

---

# 5. Position architecturale

```text
                        BUSINESS MANAGER

 BM-CDC-01  BM-CDC-02  BM-CDC-03  BM-CDC-04  BM-CDC-05  BM-CDC-06
     │          │          │          │          │          │
     └──────────┴──────────┴────┬─────┴──────────┴──────────┘
                                ▼
                         BM-CDC-07
                INTEGRATION & RUNTIME BRIDGE
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
      ERP ADAPTER          PACK RUNTIME        APP/UI RUNTIME
          │                     │                     │
          ├──────────────► DATA / QUERY ◄────────────┤
          │                     │                     │
          └──────────────► API / INTEGRATION ◄───────┘
```

---

# 6. Concepts principaux

```text
BusinessContract
ContractVersion
ContractRegistry
ContractContributor
ContractCompatibility

RuntimeManifest
RuntimeManifestSection
RuntimeSnapshot
RuntimeContext
RuntimeResolution

IntegrationDefinition
IntegrationBinding
IntegrationTarget
AdapterReference

EventContract
ContractDiff
RuntimeReadiness
BridgeRevision
```

---

# 7. Contract Registry

Créer un registre central :

```text
BusinessContractRegistry
```

Responsabilités :

```text
registerContract()
registerContributor()
getContract()
getContractVersion()
listContracts()
validateContract()
checkCompatibility()
assembleContracts()
```

---

# 8. Contract Contributor

Chaque CDC peut fournir son fragment via :

```text
BusinessContractContributor
```

Exemple :

```text
ApplicationContractContributor       → BM-CDC-01
VersionContractContributor           → BM-CDC-02
DataModelContractContributor         → BM-CDC-03
FeatureContractContributor           → BM-CDC-04
NavigationContractContributor        → BM-CDC-05
ConfigurationContractContributor     → BM-CDC-06
```

BM-CDC-07 assemble sans connaître les détails internes.

---

# 9. BusinessContract

Structure commune :

```text
BusinessContract
│
├── contractType
├── contractVersion
├── schemaVersion
├── applicationId
├── applicationVersionId
├── revision
├── generatedAt
├── generatedBy
├── content
├── dependencies
├── compatibility
└── hash
```

---

# 10. Application Contract

Expose uniquement les informations nécessaires :

```text
ApplicationContract
├── id
├── code
├── name
├── status
├── locale
├── timezone
├── icon
└── runtimeMetadata
```

Ne pas exposer automatiquement toutes les colonnes internes.

---

# 11. ApplicationVersion Contract

```text
ApplicationVersionContract
├── id
├── applicationId
├── versionNumber
├── lifecycleStatus
├── published
├── revision
├── snapshotId
└── compatibility
```

---

# 12. Data Model Contract

Produit à partir de BM-CDC-03 :

```text
DataModelContract
├── entities[]
├── fields[]
├── relations[]
├── constraints[]
├── indexes[]
└── schemaHash
```

Les IDs stables de BM-CDC-03 doivent être conservés.

---

# 13. Feature Contract

```text
FeatureContract
├── features[]
├── enabledFeatures[]
├── requiredFeatures[]
├── optionalFeatures[]
└── dependencies[]
```

---

# 14. Capability Contract

```text
CapabilityContract
├── capabilities[]
├── enabledCapabilities[]
├── dependencies[]
├── requirements[]
└── restrictions[]
```

---

# 15. Navigation Contract

Produit à partir du Navigation Resolver de BM-CDC-05 :

```text
NavigationContract
├── location
├── items[]
├── routes[]
├── requirements[]
├── visibilityRules[]
└── navigationHash
```

Le Runtime consomme une navigation résolue, pas les tables `MenuItem`.

---

# 16. Configuration Contract

Produit à partir de BM-CDC-06 :

```text
ConfigurationContract
├── environment
├── values
├── sources
├── runtimeMetadata
├── schemaVersions
└── configurationHash
```

Les secrets bruts sont interdits.

---

# 17. Metadata Contract

N’expose que les métadonnées autorisées :

```text
MetadataContract
├── application
├── version
├── entities
├── features
└── custom
```

---

# 18. Runtime Manifest

Le livrable central de BM-CDC-07 est :

```text
RuntimeManifest
```

Il représente la vision cohérente d’une `ApplicationVersion` pour les moteurs Runtime.

---

# 19. Structure RuntimeManifest

```text
RuntimeManifest
│
├── manifestVersion
├── application
├── applicationVersion
├── environment
├── dataModel
├── features
├── capabilities
├── navigation
├── configuration
├── metadata
├── integrations
├── permissions
├── compatibility
├── revisions
├── generatedAt
└── manifestHash
```

---

# 20. Flux de génération

```text
ApplicationVersion
        ↓
Check Lifecycle
        ↓
Load Contract Contributors
        ↓
Resolve Data Model
        ↓
Resolve Features / Capabilities
        ↓
Resolve Navigation
        ↓
Resolve Configuration
        ↓
Resolve Integration Bindings
        ↓
Validate Contracts
        ↓
Assemble RuntimeManifest
        ↓
Normalize
        ↓
Hash
        ↓
Cache / Snapshot
        ↓
Expose to Runtime
```

---

# 21. Runtime Context

Entrée du Bridge :

```text
RuntimeContext
├── tenantId
├── applicationId
├── applicationVersionId
├── environment
├── actorId
├── permissions
├── locale
├── deviceType
├── channel
├── traceId
└── metadata
```

Le contexte client n’est jamais l’autorité pour `tenantId`, `actorId` ou permissions.

---

# 22. Channels

Prévoir :

```text
WEB
MOBILE
APK
POS
API
INTERNAL
```

Cela permet de produire une résolution adaptée sans modifier la définition métier.

---

# 23. Runtime Bridge

Créer :

```text
BusinessRuntimeBridge
```

Fonctions :

```text
getManifest()
getApplicationContract()
getDataModelContract()
getFeatureContract()
getCapabilityContract()
getNavigationContract()
getConfigurationContract()
getIntegrationContract()
resolveRuntimeContext()
validateRuntimeReadiness()
```

---

# 24. Runtime Resolver

Créer :

```text
RuntimeResolver
```

Il orchestre les resolvers existants sans dupliquer leur logique.

```text
BM-CDC-03 Resolver
BM-CDC-04 Resolver
BM-CDC-05 Navigation Resolver
BM-CDC-06 Configuration Resolver
        ↓
RuntimeResolver
```

---

# 25. Source of Truth

Chaque moteur reste propriétaire de son domaine.

```text
Data Model       → BM-CDC-03
Capabilities     → BM-CDC-04
Navigation       → BM-CDC-05
Configuration    → BM-CDC-06
```

BM-CDC-07 ne modifie pas directement leurs ressources.

---

# 26. Runtime Readiness

Avant exposition, calculer :

```text
RuntimeReadiness
├── ready
├── blockingIssues[]
├── warnings[]
├── contractStatus
├── snapshotStatus
├── compatibilityStatus
└── metadata
```

---

# 27. Readiness minimale

Vérifier :

```text
Application exists
ApplicationVersion exists
Lifecycle compatible
Data Model valid
Features valid
Capabilities valid
Navigation valid
Configuration valid
Required integrations available
Contracts compatible
Snapshot current
No blocking issue
```

---

# 28. BM-CDC-08

BM-CDC-07 réalise les contrôles d’intégration nécessaires au Bridge.

BM-CDC-08 reste propriétaire de la **validation globale et du Quality Gate**.

---

# 29. Contract Versioning

Chaque contrat possède :

```text
contractVersion
schemaVersion
```

Exemple :

```text
application-contract@1
data-model-contract@2
navigation-contract@1
runtime-manifest@3
```

---

# 30. Semantic Versioning

Recommandation :

```text
MAJOR.MINOR.PATCH
```

```text
MAJOR → breaking contract
MINOR → compatible addition
PATCH → correction compatible
```

---

# 31. Contract Compatibility

Niveaux :

```text
COMPATIBLE
COMPATIBLE_WITH_WARNINGS
INCOMPATIBLE
UNKNOWN
```

---

# 32. Compatibility Matrix

Exemple :

```text
RuntimeManifest v2
    supports:
DataModelContract v1-v2
NavigationContract v1
ConfigurationContract v1-v3
```

---

# 33. Compatibility Service

Créer :

```text
ContractCompatibilityService
```

Fonctions :

```text
check()
compareVersions()
getSupportedVersions()
validateConsumerCompatibility()
```

---

# 34. Contract Diff

Comparer :

```text
Contract v1
vs
Contract v2
```

Résultat :

```text
ADDED
REMOVED
CHANGED
BREAKING
DEPRECATED
```

---

# 35. Breaking Changes

Exemples :

```text
suppression d’un champ obligatoire
changement de type
suppression d’une capability requise
suppression d’une route utilisée
modification incompatible d’un contrat
```

---

# 36. Contract Hash

Chaque contrat déterministe doit avoir :

```text
hash
```

Même contenu normalisé :

```text
→ même hash
```

---

# 37. Runtime Manifest Hash

Le `manifestHash` doit changer si un fragment fonctionnel exposé change.

---

# 38. Bridge Revision

Prévoir :

```text
bridgeRevision
```

pour invalider les caches et identifier l’état courant.

---

# 39. Snapshot Assembly

BM-CDC-07 assemble les snapshots fournis par les CDC précédents.

```text
Application Snapshot
Version Snapshot
Data Model Snapshot
Feature Snapshot
Navigation Snapshot
Configuration Snapshot
        ↓
Runtime Snapshot
```

---

# 40. RuntimeSnapshot

```text
RuntimeSnapshot
├── snapshotVersion
├── applicationId
├── applicationVersionId
├── environment
├── manifest
├── contributors[]
├── sourceHashes[]
├── generatedAt
└── snapshotHash
```

---

# 41. Snapshot immuable publié

Pour une version publiée :

```text
Published Runtime Snapshot
→ immutable
```

Toute évolution nécessite une nouvelle version ou le mécanisme officiel de lifecycle.

---

# 42. Snapshot Outdated

Si une contribution change :

```text
Data Model changed
Feature changed
Menu changed
Configuration changed
        ↓
Runtime Snapshot
OUTDATED
```

---

# 43. Event-driven invalidation

Événements possibles :

```text
business.data_model.changed
business.feature.changed
business.navigation.changed
business.configuration.changed
```

BM-CDC-07 invalide les éléments dérivés.

---

# 44. Integration Registry

Créer :

```text
IntegrationRegistry
```

Il référence les intégrations disponibles sans implémenter leurs détails.

---

# 45. IntegrationDefinition

```text
IntegrationDefinition
├── id
├── code
├── name
├── type
├── provider
├── adapterKey
├── contractVersion
├── capabilities[]
├── configurationSchemaRef
├── active
└── metadata
```

---

# 46. Types d’intégration

Exemples :

```text
ERP
PAYMENT
MESSAGING
STORAGE
EMAIL
SMS
ACCOUNTING
SHIPPING
IDENTITY
ANALYTICS
CUSTOM_API
```

---

# 47. Integration Binding

Associe une ApplicationVersion à une intégration.

```text
IntegrationBinding
├── id
├── applicationVersionId
├── integrationDefinitionId
├── targetId
├── environment
├── status
├── configurationRef
├── mappingRef
├── required
├── metadata
└── version
```

---

# 48. Binding Status

```text
DRAFT
CONFIGURED
VALID
INVALID
DISABLED
```

---

# 49. ERP Adapter

BM-CDC-07 ne doit pas implémenter l’ERP Adapter.

Il fournit le contrat de communication :

```text
Business Manager
      ↓
Integration Binding
      ↓
ERP Adapter Contract
      ↓
ERP Adapter
```

---

# 50. ERP Target Reference

Le Binding peut référencer :

```text
erpTargetId
mappingProfileId
capabilityMappingProfileId
```

Ces IDs appartiennent à l’ERP Adapter.

---

# 51. Pas d’accès direct ERP

Interdit :

```text
Business Manager → ERP database
Business Manager → ERP internal tables
Business Manager → ERP native classes
```

Chemin :

```text
Business Manager
→ Contract
→ ERP Adapter
→ ERP
```

---

# 52. Integration Adapter Contract

Interface conceptuelle :

```text
IntegrationAdapter
├── getMetadata()
├── validateBinding()
├── testConnection()
├── getCapabilities()
├── resolveContract()
└── health()
```

---

# 53. Adapter Registry

Créer :

```text
IntegrationAdapterRegistry
```

pour résoudre :

```text
adapterKey
→ adapter implementation
```

---

# 54. Adapter Isolation

Un adapter défaillant ne doit pas casser tout Business Manager.

Prévoir :

```text
timeout
error isolation
circuit-breaker ready
health status
fallback policy
```

---

# 55. Test Connection

BM-CDC-07 peut exposer :

```text
POST /integration-bindings/:id/test
```

Le test est délégué à l’Adapter.

---

# 56. Integration Validation

Vérifier :

```text
definition exists
adapter exists
target exists
configuration valid
mapping reference valid
capabilities compatible
connection test if required
```

---

# 57. Required Integration

Une intégration marquée :

```text
required = true
```

et invalide peut rendre :

```text
RuntimeReadiness.ready = false
```

---

# 58. Optional Integration

Si :

```text
required = false
```

l’indisponibilité peut produire un warning sans blocage, selon politique.

---

# 59. Secret Handling

Les credentials ne doivent pas être stockés en clair dans `IntegrationBinding`.

Utiliser :

```text
secretRef
credentialRef
```

vers un mécanisme sécurisé.

---

# 60. Event Contracts

BM-CDC-07 définit les contrats d’événements sortants.

Structure :

```text
BusinessEvent
├── eventId
├── eventType
├── eventVersion
├── tenantId
├── applicationId
├── applicationVersionId
├── occurredAt
├── actorId
├── traceId
├── payload
└── metadata
```

---

# 61. Event Naming

Convention :

```text
business.application.created
business.version.published
business.data_model.changed
business.feature.changed
business.navigation.changed
business.configuration.changed
business.runtime.snapshot.generated
business.integration.binding.updated
```

---

# 62. Event Versioning

Chaque payload d’événement doit être versionné.

```text
eventVersion = 1
```

---

# 63. Event Consumer Isolation

Un consommateur d’événement ne doit pas pouvoir modifier le Business Manager en contournant les API officielles.

---

# 64. Webhook readiness

BM-CDC-07 peut préparer les contrats nécessaires aux webhooks futurs.

Mais l’infrastructure globale de webhook appartient à l’API / Integration Layer.

---

# 65. Idempotence

Les opérations rejouables doivent accepter une clé d’idempotence lorsque nécessaire.

Exemples :

```text
snapshot generation
binding activation
publication integration
external synchronization
```

---

# 66. Correlation

Support :

```text
traceId
correlationId
causationId
```

pour suivre un flux inter-systèmes.

---

# 67. API — Runtime Manifest

```text
GET /application-versions/:versionId/runtime-manifest
```

Query :

```text
environment
channel
locale
```

---

# 68. API — Runtime Readiness

```text
GET /application-versions/:versionId/runtime-readiness
POST /application-versions/:versionId/runtime-readiness/validate
```

---

# 69. API — Contracts

```text
GET /application-versions/:versionId/contracts
GET /application-versions/:versionId/contracts/:contractType
GET /application-versions/:versionId/contracts/:contractType/diff
```

---

# 70. API — Snapshot

```text
POST /application-versions/:versionId/runtime-snapshot
GET  /application-versions/:versionId/runtime-snapshot
```

---

# 71. API — Integration Definitions

```text
GET    /integrations
POST   /integrations

GET    /integrations/:id
PATCH  /integrations/:id
```

La création/modification peut être réservée aux administrateurs plateforme.

---

# 72. API — Integration Bindings

```text
GET    /application-versions/:versionId/integration-bindings
POST   /application-versions/:versionId/integration-bindings

GET    /integration-bindings/:id
PATCH  /integration-bindings/:id

POST   /integration-bindings/:id/validate
POST   /integration-bindings/:id/test
POST   /integration-bindings/:id/enable
POST   /integration-bindings/:id/disable
```

---

# 73. API Response Contract

Réutiliser BM-CDC-00.

Succès :

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {
    "traceId": "..."
  }
}
```

---

# 74. Error Codes

Prévoir :

```text
CONTRACT_NOT_FOUND
CONTRACT_INVALID
CONTRACT_VERSION_UNSUPPORTED
CONTRACT_INCOMPATIBLE
CONTRACT_GENERATION_FAILED

RUNTIME_MANIFEST_FAILED
RUNTIME_NOT_READY
RUNTIME_SNAPSHOT_OUTDATED
RUNTIME_SNAPSHOT_FAILED

INTEGRATION_NOT_FOUND
INTEGRATION_ADAPTER_NOT_FOUND
INTEGRATION_BINDING_NOT_FOUND
INTEGRATION_BINDING_INVALID
INTEGRATION_TARGET_NOT_FOUND
INTEGRATION_CONNECTION_FAILED
INTEGRATION_TIMEOUT
INTEGRATION_CAPABILITY_MISMATCH

VERSION_NOT_EDITABLE
VERSION_NOT_FOUND
TENANT_MISMATCH
PERMISSION_DENIED
VERSION_CONFLICT
```

---

# 75. Backend Architecture

```text
BM-CDC-07
├── Contracts
│   ├── Registry
│   ├── Contributors
│   ├── Compatibility
│   ├── Validation
│   └── Diff
├── Runtime
│   ├── RuntimeBridge
│   ├── RuntimeResolver
│   ├── ManifestAssembler
│   ├── Readiness
│   └── Snapshot
├── Integration
│   ├── Registry
│   ├── Bindings
│   ├── AdapterRegistry
│   └── Validation
├── Events
├── API
├── Security
├── Audit
└── Tests
```

---

# 76. ManifestAssembler

Fonctions :

```text
assemble()
normalize()
hash()
validate()
getContributors()
getSourceRevisions()
```

---

# 77. RuntimeBridgeService

```text
getManifest()
getReadiness()
generateSnapshot()
getSnapshot()
invalidateSnapshot()
resolveContract()
```

---

# 78. IntegrationService

```text
listDefinitions()
createBinding()
updateBinding()
validateBinding()
testBinding()
enableBinding()
disableBinding()
resolveAdapter()
```

---

# 79. ContractService

```text
listContracts()
generateContract()
validateContract()
compareContracts()
checkCompatibility()
```

---

# 80. Database — Contract Metadata

Table possible :

```text
bm_contract_artifacts
```

Champs :

```text
id
tenant_id
application_id
application_version_id
contract_type
contract_version
schema_version
revision
content_hash
artifact_ref
status
generated_at
generated_by
```

---

# 81. Database — Runtime Snapshot

```text
bm_runtime_snapshots
```

Champs :

```text
id
tenant_id
application_id
application_version_id
environment
manifest_version
snapshot_hash
source_hashes
status
artifact_ref
generated_at
generated_by
```

---

# 82. Database — Integration Definitions

```text
bm_integration_definitions
```

---

# 83. Database — Integration Bindings

```text
bm_integration_bindings
```

Champs :

```text
id
tenant_id
application_id
application_version_id
integration_definition_id
target_id
environment
status
configuration_ref
mapping_ref
required
metadata
created_by
created_at
updated_by
updated_at
version
```

---

# 84. Ne pas dupliquer les snapshots

Si l’infrastructure de BM-CDC-00/BM-CDC-02 possède déjà un stockage générique de snapshots, BM-CDC-07 doit l’utiliser au lieu de créer une table redondante.

---

# 85. Permissions

Exemples :

```text
business.contract.read
business.contract.generate
business.contract.validate

business.runtime.read
business.runtime.validate
business.runtime.snapshot.generate

business.integration.read
business.integration.manage
business.integration.binding.read
business.integration.binding.manage
business.integration.binding.test
```

---

# 86. IAM Context

Réutiliser :

```text
tenantId
actorId
applicationId
applicationVersionId
environment
permissions
traceId
```

---

# 87. Tenant Isolation

Toute ressource :

```text
Contract
RuntimeSnapshot
IntegrationBinding
```

doit être vérifiée contre le tenant courant.

---

# 88. Version Isolation

Un Binding de version A ne doit pas être utilisable silencieusement par version B.

---

# 89. Version Guard

Toute mutation d’une configuration versionnée passe par le `VersionEditabilityGuard`.

---

# 90. Published Version

Une version publiée expose ses contrats/snapshots immuables.

Modification interdite.

---

# 91. Optimistic Locking

Utiliser `version` pour les Integration Bindings et ressources mutables.

---

# 92. Transactions

Obligatoires lors de :

```text
binding create/update complexe
snapshot assembly persistence
multi-contract generation
activation avec validation
```

---

# 93. Cache

Le Runtime Manifest peut être mis en cache.

Clé conceptuelle :

```text
tenantId
applicationId
applicationVersionId
environment
channel
manifestRevision
```

---

# 94. Cache Invalidation

Invalider lors de :

```text
version change
data model change
feature change
navigation change
configuration change
integration binding change
contract version change
```

---

# 95. ETag

Prévoir l’usage du :

```text
manifestHash
```

comme base d’ETag pour les consommateurs HTTP.

---

# 96. Conditional Fetch

Le Runtime peut envoyer :

```text
If-None-Match
```

et recevoir :

```text
304 Not Modified
```

si approprié.

---

# 97. Performance cible

Indicatif :

```text
Cached RuntimeManifest        < 200 ms
Uncached RuntimeManifest      < 1000 ms
Single Contract               < 500 ms
Readiness                     < 1000 ms
Integration list              < 500 ms
Binding detail                < 300 ms
```

hors appels externes.

---

# 98. External Timeout

Les appels Adapter externes doivent avoir un timeout contrôlé.

Aucun endpoint Business Manager ne doit attendre indéfiniment.

---

# 99. Retry

Retry uniquement pour opérations sûres/idempotentes.

Ne jamais rejouer automatiquement une opération destructive non idempotente.

---

# 100. Circuit Breaker Ready

L’architecture doit permettre d’ajouter un circuit breaker autour des adapters.

---

# 101. Frontend — Integration Workspace

Dans l’Application Workspace :

```text
Integration & Runtime
├── Vue générale
├── Runtime Manifest
├── Contrats
├── Intégrations
├── Bindings
├── Compatibilité
├── Snapshots
└── Historique
```

---

# 102. Runtime Overview

Cards :

```text
Runtime Readiness
Manifest Status
Snapshot Status
Contracts
Integrations
Required Integrations
Warnings
Blocking Issues
Last Generated
```

---

# 103. Manifest Viewer

Doit permettre :

```text
Tree View
JSON View
Search
Section filtering
Hash display
Revision display
Copy safe fragment
Download/export if authorized
```

Les secrets doivent être absents.

---

# 104. Contract Catalog UI

Colonnes :

```text
Contract
Version
Schema
Revision
Status
Compatibility
Hash
Generated
Actions
```

---

# 105. Contract Detail

Afficher :

```text
Metadata
Schema version
Dependencies
Compatibility
Content
Diff
Validation
History
```

---

# 106. Contract Diff Viewer

Comparer deux versions avec :

```text
Added
Removed
Changed
Breaking
Deprecated
```

---

# 107. Integration Catalog UI

Colonnes :

```text
Name
Type
Provider
Adapter
Version
Status
Capabilities
Actions
```

---

# 108. Binding List UI

Colonnes :

```text
Integration
Target
Environment
Required
Status
Last Test
Validation
Actions
```

---

# 109. Binding Wizard

Étapes :

```text
1. Integration
2. Target
3. Environment
4. Configuration
5. Mapping Reference
6. Requirements
7. Validate
8. Test
9. Confirm
```

---

# 110. Test Connection UX

Résultat :

```text
SUCCESS
FAILED
TIMEOUT
UNAVAILABLE
```

Afficher :

```text
message
duration
testedAt
traceId
```

sans exposer de secret.

---

# 111. Read-only Published Version UX

Pour une version publiée :

```text
Bindings
→ lecture seule

Runtime Manifest
→ consultation

Snapshot
→ consultation

Contracts
→ consultation
```

---

# 112. Runtime Readiness Panel

Afficher :

```text
READY / NOT READY

Blocking:
- Navigation invalid
- ERP mapping missing

Warnings:
- Optional SMS adapter unavailable
```

---

# 113. Loading State

```text
Chargement des contrats Runtime…
```

---

# 114. Empty State

```text
Aucune intégration configurée pour cette version.
```

---

# 115. Error State

```text
Impossible de générer le Runtime Manifest.

Code : RUNTIME_MANIFEST_FAILED
Trace : abc123
```

---

# 116. Conflict State

```text
Cette liaison d’intégration a été modifiée par un autre utilisateur.

[ Recharger ]
[ Comparer ]
```

---

# 117. Responsive

Le Manifest Viewer et Diff Viewer doivent fonctionner sur desktop/tablette.

Sur mobile :

```text
sections empilées
JSON viewer scrollable
actions critiques accessibles
```

---

# 118. Accessibility

Support :

```text
keyboard
labels
focus
accessible status
non-color-only errors
tables accessible
```

---

# 119. Observabilité

Chaque Bridge request doit tracer :

```text
traceId
tenantId
applicationId
applicationVersionId
environment
channel
manifestVersion
cacheHit
duration
result
errorCode
```

---

# 120. Adapter Observability

Tracer :

```text
adapterKey
operation
duration
status
timeout
errorCode
```

sans secret.

---

# 121. Audit Events

Exemples :

```text
business.contract.generated
business.contract.validated
business.runtime.manifest.generated
business.runtime.snapshot.generated
business.runtime.snapshot.invalidated
business.integration.binding.created
business.integration.binding.updated
business.integration.binding.validated
business.integration.binding.tested
business.integration.binding.enabled
business.integration.binding.disabled
```

---

# 122. Security

Interdire :

```text
secret exposure
cross-tenant manifest
cross-version binding
arbitrary adapter loading
arbitrary URL execution without policy
arbitrary code
eval
direct ERP DB access
unvalidated contract payload
```

---

# 123. SSRF Protection

Toute intégration permettant une URL configurable doit passer par une politique de sécurité :

```text
scheme allowlist
host policy
private-network policy
redirect policy
timeout
size limit
```

Le simple fait qu’un utilisateur puisse saisir une URL ne doit pas autoriser le serveur à contacter n’importe quelle destination.

---

# 124. Contract Payload Validation

Tous les fragments fournis par Contributors doivent être validés avant assemblage.

Un contributor invalide :

```text
→ RuntimeManifest generation fails safely
```

ou produit un blocage Readiness selon politique.

---

# 125. Contributor Isolation

Un contributor ne doit pas pouvoir écraser arbitrairement le fragment d’un autre.

Chaque contributor possède un namespace.

---

# 126. Deterministic Assembly

L’ordre d’enregistrement des Contributors ne doit pas modifier le Manifest logique.

---

# 127. Unknown Contract Fields

La stratégie doit être définie par version :

```text
ignore compatible unknown field
reject forbidden unknown field
```

---

# 128. Backward Compatibility

Un Runtime plus ancien doit pouvoir détecter qu’un Manifest est trop récent avant exécution.

---

# 129. Consumer Declaration

Un consommateur peut déclarer :

```text
consumerType
consumerVersion
supportedManifestVersions[]
supportedContractVersions
```

---

# 130. Consumer Compatibility Check

Endpoint possible :

```text
POST /application-versions/:versionId/runtime-compatibility/check
```

Payload :

```json
{
  "consumerType": "APP_RUNTIME",
  "consumerVersion": "1.4.0",
  "supportedManifestVersions": ["2.0.0"]
}
```

---

# 131. Publication Integration

BM-CDC-02 peut demander à BM-CDC-07 :

```text
Generate final contracts
Validate Runtime Readiness
Generate immutable Runtime Snapshot
```

avant publication.

---

# 132. Publication Flow

```text
BM-CDC-02
Publish Request
      ↓
BM-CDC-08
Quality Gate
      ↓
BM-CDC-07
Runtime Readiness
      ↓
Generate Contracts
      ↓
Generate Runtime Snapshot
      ↓
Hash
      ↓
Publish
```

La coordination exacte est orchestrée par le lifecycle, pas par le frontend.

---

# 133. Rollback

Lors d’un rollback :

```text
Published Version N
→ Version N-1
```

le Runtime doit pouvoir retrouver le snapshot immuable de N-1.

---

# 134. No Silent Regeneration

Un snapshot publié historique ne doit pas être régénéré silencieusement avec les règles actuelles.

---

# 135. Environment Resolution

Une même version peut avoir des bindings différents selon :

```text
DEV
TEST
STAGING
PROD
```

selon les règles de lifecycle retenues.

---

# 136. Integration Health

Chaque Adapter peut fournir :

```text
HEALTHY
DEGRADED
UNAVAILABLE
UNKNOWN
```

---

# 137. Health ≠ Binding Validity

Une intégration peut être :

```text
Binding VALID
Adapter currently UNAVAILABLE
```

Il faut distinguer configuration et disponibilité opérationnelle.

---

# 138. Required Runtime Capabilities

Une intégration peut déclarer :

```text
providedCapabilities[]
```

Le Bridge peut vérifier qu’une capability requise est effectivement fournie.

---

# 139. Capability Mapping

Le mapping Business Capability ↔ ERP Capability appartient à l’ERP Adapter.

BM-CDC-07 consomme son résultat contractuel.

---

# 140. Data Mapping

Le mapping Entity/Field ↔ ERP appartient à l’ERP Adapter.

BM-CDC-07 référence :

```text
mappingProfileId
```

sans réimplémenter le mapping.

---

# 141. Pack Runtime Contract

BM-CDC-07 doit permettre au Pack Runtime de consommer les éléments Business nécessaires via un contrat stable.

---

# 142. Application/UI Runtime Contract

L’Application Runtime peut recevoir :

```text
Application
Version
Capabilities
Navigation
Configuration
Metadata
```

via `RuntimeManifest`.

---

# 143. Data Runtime

Le Data/Query Runtime peut recevoir le `DataModelContract` ou une projection spécialisée autorisée.

---

# 144. API Layer

L’API/Integration Layer peut exposer certains contrats à des consommateurs externes, selon permissions et politiques.

---

# 145. Export Contract

Export autorisé :

```text
JSON
```

avec :

```text
contractVersion
schemaVersion
hash
```

---

# 146. Import Contract

BM-CDC-07 ne doit pas accepter un import arbitraire comme remplacement direct des modèles internes.

Tout import doit passer par le moteur propriétaire du domaine.

---

# 147. Contract Documentation

Chaque contrat doit documenter :

```text
purpose
owner
schema
version
compatibility
required fields
optional fields
examples
error behavior
security classification
```

---

# 148. Tests — Contract Registry

Tester :

```text
register contributor
duplicate namespace rejected
contract retrieval
version retrieval
unknown contract
validation
deterministic assembly
```

---

# 149. Tests — Runtime Manifest

```text
complete manifest
missing required contributor
invalid contributor
hash deterministic
hash changes on functional change
environment resolution
channel resolution
secret exclusion
```

---

# 150. Tests — Compatibility

```text
same major compatible
compatible minor
breaking major
unsupported consumer
unknown version
diff
```

---

# 151. Tests — Runtime Readiness

```text
all valid → READY
invalid navigation → NOT READY
invalid config → NOT READY
required integration invalid → NOT READY
optional integration unavailable → WARNING
```

---

# 152. Tests — Integration Binding

```text
create
update
validate
test
enable
disable
invalid target
invalid adapter
invalid mapping ref
published mutation denied
```

---

# 153. Tests — ERP Isolation

```text
no direct ERP DB dependency
no ERP native class dependency
adapter contract only
mapping references only
```

---

# 154. Tests — Security

```text
unauthenticated denied
unauthorized denied
cross-tenant denied
cross-application denied
cross-version denied
secret absent
SSRF protections
invalid adapterKey rejected
published mutation denied
```

---

# 155. Tests — Cache

```text
cache hit
cache miss
invalidation on data change
invalidation on feature change
invalidation on menu change
invalidation on config change
invalidation on binding change
ETag
304
```

---

# 156. Tests Frontend

```text
Runtime Overview
Manifest Viewer
Contract Catalog
Contract Detail
Contract Diff
Integration Catalog
Binding List
Binding Wizard
Validation
Test Connection
Readiness
Snapshot
History
Loading
Empty
Error
Forbidden
Read-only
Conflict
Responsive
```

---

# 157. E2E — Runtime Manifest

```text
Application Boutique
↓
Version 1.0.0
↓
Data Model valid
Features valid
Navigation valid
Configuration valid
↓
Generate Runtime Manifest
↓
Manifest contains all approved contracts
↓
Hash generated
```

---

# 158. E2E — ERP Binding

```text
Version 1.0.0
↓
Add ERP Integration
↓
Select ERP Target
↓
Reference Mapping Profile
↓
Validate Binding
↓
Test Adapter
↓
VALID
↓
Runtime Readiness
READY
```

---

# 159. E2E — Required Integration Failure

```text
ERP required
↓
Adapter unavailable / invalid binding
↓
Runtime Readiness
NOT READY
```

---

# 160. E2E — Published Snapshot

```text
Version READY
↓
Quality Gate
↓
Runtime Readiness
↓
Generate Runtime Snapshot
↓
Publish
↓
Snapshot immutable
```

---

# 161. E2E — Runtime Consumer

```text
APP RUNTIME
↓
GET RuntimeManifest
↓
Compatibility Check
↓
Capabilities
Navigation
Configuration
↓
Render application
```

---

# 162. E2E — Contract Breaking Change

```text
RuntimeManifest v1
↓
Contract schema breaking change
↓
Compatibility
INCOMPATIBLE
↓
Publication blocked / migration required
```

---

# 163. Répartition Team 3 — Avotra

### Frontend fonctionnel

```text
Runtime Overview
Runtime Readiness UI
Contract Catalog
Contract Detail
Integration Catalog
Binding List
Binding Wizard
Validation UI
Test Connection UI
Snapshot UI
History UI
Loading / Empty / Error
Responsive
API integration
```

---

# 164. Répartition Team 3 — Belardo

### Frontend architecture

```text
Integration workspace architecture
Manifest Viewer
JSON/Tree Viewer
Contract Diff Viewer
Compatibility UI
Runtime state management
Read-only propagation
Conflict UX
Cache/refresh UX
Reusable contract components
Frontend test architecture
Performance
```

---

# 165. Répartition Team 3 — Ranja

### Backend

```text
Contract Registry
Contract Contributors
Contract schemas
Contract versioning
Compatibility Service
Contract Diff

Runtime Bridge
Runtime Resolver
Manifest Assembler
Runtime Readiness
Runtime Snapshot
Hashing
Revision
Cache invalidation

Integration Registry
Integration Binding
Adapter Registry
Adapter Contract
Binding validation
Test connection orchestration

Event Contracts
IAM Context
Tenant/Application/Version isolation
Version Guard
Optimistic locking
Transactions
Security
SSRF protection
ActivityEvent
Audit
Observability
Backend tests
```

---

# 166. Livrables Backend

```text
✓ BusinessContractRegistry
✓ BusinessContractContributor
✓ Contract schemas
✓ Contract versions
✓ Contract validation
✓ Contract compatibility
✓ Contract diff
✓ Contract hash

✓ RuntimeManifest
✓ RuntimeResolver
✓ BusinessRuntimeBridge
✓ ManifestAssembler
✓ RuntimeReadiness
✓ RuntimeSnapshot
✓ Snapshot hash
✓ Revision
✓ Cache invalidation

✓ IntegrationRegistry
✓ IntegrationDefinition
✓ IntegrationBinding
✓ IntegrationAdapterRegistry
✓ IntegrationAdapter Contract
✓ Binding validation
✓ Test connection

✓ EventContract
✓ Event versioning
✓ Correlation

✓ APIs
✓ Permissions
✓ IAM Context
✓ Isolation
✓ Version Guard
✓ Optimistic locking
✓ Transactions
✓ Audit
✓ ActivityEvent
✓ Observability
✓ Security
✓ Tests
✓ Documentation
```

---

# 167. Livrables Frontend

```text
✓ Integration & Runtime Overview
✓ Runtime Readiness
✓ Manifest Viewer
✓ Contract Catalog
✓ Contract Detail
✓ Contract Diff
✓ Compatibility Viewer
✓ Integration Catalog
✓ Binding List
✓ Binding Wizard
✓ Test Connection
✓ Validation
✓ Snapshots
✓ History
✓ Loading / Empty / Error
✓ Forbidden
✓ Read-only
✓ Conflict
✓ Responsive
✓ Tests
```

---

# 168. Critères d’acceptation

BM-CDC-07 est accepté lorsque :

```text
✓ Les CDC 01-06 peuvent enregistrer leurs Contract Contributors
✓ Les contrats sont générés sans exposer les modèles internes
✓ Les contrats sont versionnés
✓ Les contrats sont validés
✓ La compatibilité peut être calculée
✓ Les breaking changes peuvent être détectés
✓ Les contrats sont déterministes et hashés

✓ RuntimeManifest peut être généré
✓ RuntimeManifest agrège les fragments nécessaires
✓ RuntimeManifest exclut les secrets
✓ RuntimeManifest est contextualisé par version/environnement
✓ Runtime Readiness fonctionne
✓ Les problèmes bloquants empêchent READY

✓ RuntimeSnapshot peut être généré
✓ Le snapshot est déterministe
✓ Les snapshots publiés sont immuables
✓ Les snapshots obsolètes sont détectés

✓ Integration Registry fonctionne
✓ Une Integration Binding peut être créée
✓ Une Binding peut être validée
✓ Une connexion Adapter peut être testée
✓ Une intégration requise invalide bloque Readiness

✓ ERP Adapter est consommé uniquement par contrat
✓ Aucun accès direct aux tables/classes ERP n’existe
✓ Data Mapping n’est pas dupliqué
✓ Capability Mapping n’est pas dupliqué

✓ Event Contracts sont versionnés
✓ traceId/correlationId sont propagés

✓ Tenant isolation fonctionne
✓ Application isolation fonctionne
✓ Version isolation fonctionne
✓ Permissions fonctionnent
✓ Version Guard fonctionne
✓ Optimistic locking fonctionne
✓ Transactions fonctionnent

✓ Cache et invalidation fonctionnent
✓ Secrets ne sont jamais exposés
✓ SSRF protections existent pour URLs configurables
✓ Audit fonctionne
✓ Observabilité fonctionne

✓ Frontend PASS
✓ Backend PASS
✓ Integration Tests PASS
✓ Documentation complète
```

---

# 169. Definition of Done — BM-CDC-07

```text
BM-CDC-07 — INTEGRATION, CONTRACTS & RUNTIME BRIDGE

Contract Registry                 ✓
Contract Contributors             ✓
Application Contract              ✓
Version Contract                  ✓
Data Model Contract               ✓
Feature Contract                  ✓
Capability Contract               ✓
Navigation Contract               ✓
Configuration Contract            ✓
Metadata Contract                 ✓

Contract Versioning               ✓
Contract Compatibility            ✓
Contract Diff                     ✓
Contract Validation               ✓
Contract Hash                     ✓

Runtime Context                   ✓
Runtime Resolver                  ✓
Runtime Manifest                  ✓
Manifest Assembler                ✓
Runtime Readiness                 ✓
Runtime Snapshot                  ✓
Snapshot Hash                     ✓
Snapshot Immutability             ✓
Snapshot Outdated                 ✓

Integration Registry              ✓
Integration Definition            ✓
Integration Binding               ✓
Adapter Registry                  ✓
Adapter Contract                  ✓
Binding Validation                ✓
Connection Test                   ✓

ERP Adapter Contract              ✓
No Direct ERP Coupling            ✓

Event Contracts                   ✓
Event Versioning                  ✓
Correlation                       ✓

Cache                             ✓
Cache Invalidation                ✓
ETag-ready                        ✓

Permissions                       ✓
IAM Context                       ✓
Tenant Isolation                  ✓
Application Isolation             ✓
Version Isolation                 ✓
Version Guard                     ✓

Secret Protection                 ✓
SSRF Protection                   ✓
Optimistic Locking                ✓
Transactions                      ✓
ActivityEvent                     ✓
Audit                             ✓
Observability                     ✓

Frontend                          ✓
Backend                           ✓
Database                          ✓
API                               ✓

Loading / Empty / Error           ✓
Forbidden                         ✓
Read-only                         ✓
Conflict                          ✓
Responsive                        ✓

Frontend Tests                    ✓
Backend Tests                     ✓
Integration Tests                 ✓
Documentation                     ✓
Demo                              ✓

STATUS
READY FOR BM-CDC-08
```

---

# 170. Architecture finale

```text
                    BUSINESS MANAGER INTERNAL

     APPLICATION ───────┐
     VERSION ───────────┤
     DATA MODEL ────────┤
     FEATURES ──────────┤
     CAPABILITIES ──────┤
     NAVIGATION ────────┤
     CONFIGURATION ─────┤
                        ▼
              CONTRACT CONTRIBUTORS
                        │
                        ▼
                 CONTRACT REGISTRY
                        │
                        ▼
                  RUNTIME RESOLVER
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
      RUNTIME MANIFEST      INTEGRATION BINDINGS
             │                     │
             ▼                     ▼
      RUNTIME SNAPSHOT       ADAPTER REGISTRY
             │                     │
      ┌──────┼───────┐             ▼
      ▼      ▼       ▼         ERP / EXTERNAL
     APP    PACK     API
   RUNTIME RUNTIME   LAYER
```

---

# 171. Chaîne officielle

```text
BM-CDC-00
Socle, Architecture & Contrats communs
        ↓
BM-CDC-01
Application Manager
        ↓
BM-CDC-02
Version & Lifecycle Manager
        ↓
BM-CDC-03
Data Model Manager
        ↓
BM-CDC-04
Feature & Capability Manager
        ↓
BM-CDC-05
Menu Engine & Navigation Manager
        ↓
BM-CDC-06
Configuration & Metadata Manager
        ↓
BM-CDC-07
Integration, Contracts & Runtime Bridge
        ↓
BM-CDC-08
Validation, Tests & Quality Manager
```

---

# 172. Règle finale

> **BM-CDC-07 est la frontière contractuelle du Business Manager. Aucun Runtime, ERP Adapter ou autre moteur ne doit avoir besoin de connaître les tables ou les classes internes du Business Manager pour consommer une ApplicationVersion.**

La chaîne cible est :

```text
Business Configuration
        +
Version
        +
Data Model
        +
Features / Capabilities
        +
Navigation
        +
Resolved Configuration
        +
Integration Bindings
        ↓
Stable Contracts
        ↓
Runtime Manifest
        ↓
Immutable Snapshot
        ↓
Runtime / ERP Adapter / Pack Runtime / API Layer
```
