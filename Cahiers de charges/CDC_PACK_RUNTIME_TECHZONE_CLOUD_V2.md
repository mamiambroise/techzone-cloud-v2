# CAHIER DES CHARGES --- TECHZONE CLOUD PACK RUNTIME

**Version :** 2.0 --- Consolidation et extension\
**Date :** Septembre 2026\
**Projet :** Techzone Cloud\
**Module :** Pack Runtime\
**Statut :** Spécification fonctionnelle et technique consolidée\
**Principe :** Continuité du Pack Runtime existant --- pas de
reconstruction globale

------------------------------------------------------------------------

# 1. Objet

Le présent cahier des charges consolide et étend le **Pack Runtime** de
Techzone Cloud.

Le Pack Runtime constitue la couche d'exécution des Packs publiés par
Pack Manager.

Il ne doit pas reconstruire les responsabilités du Business Manager, UI
Builder, Automation ou Pack Manager.

La branche `main` reste la base canonique.

Avant toute modification :

``` text
EXISTANT + FONCTIONNEL → KEEP
EXISTANT + UI/UX FAIBLE → IMPROVE
PARTIEL → COMPLETE
ANCIEN MAIS RÉUTILISABLE → ADAPT
RÉELLEMENT ABSENT → IMPLEMENT
```

Aucune architecture fonctionnelle existante ne doit être remplacée sans
audit préalable.

------------------------------------------------------------------------

# 2. Vision

Le Pack Runtime transforme un **Pack publié et validé** en **contexte
d'exécution effectif**.

Chaîne globale :

``` text
BUSINESS MANAGER
      ↓
Business Definition

UI BUILDER
      ↓
UI Definition

AUTOMATION
      ↓
Automation Definition

      ↓
PACK MANAGER
Composition
Validation
Manifest
Publication
      ↓
PACK RUNTIME
Manifest Loader
Manifest Validator
Runtime Context
Dependency Resolver
Capability Resolver
Rule Resolver
Configuration Resolver
Registry
Cache
Execution Contracts
Diagnostics
      ↓
APPLICATION ACTIVE
```

Principe :

``` text
PUBLISHED PACK
      ↓
LOAD
      ↓
VALIDATE
      ↓
RESOLVE
      ↓
CONFIGURE
      ↓
ACTIVATE
      ↓
EXECUTE
      ↓
OBSERVE
```

------------------------------------------------------------------------

# 3. Frontière Pack Manager / Pack Runtime

## Pack Manager

Pack Manager :

``` text
compose
versionne
valide
génère le Manifest
publie
conserve l'historique de publication
```

## Pack Runtime

Pack Runtime :

``` text
charge
valide la compatibilité Runtime
résout
construit le contexte effectif
met en cache
active
expose les définitions aux moteurs Runtime
diagnostique
observe
```

Règle fondamentale :

> Pack Manager prépare et publie. Pack Runtime charge, résout et
> exécute.

Runtime ne modifie jamais directement la définition d'un Pack publié.

------------------------------------------------------------------------

# 4. Responsabilités

Pack Runtime possède notamment :

-   Published Pack Loader ;
-   Manifest Loader ;
-   Manifest Validator ;
-   Runtime Context ;
-   Context Resolver ;
-   Dependency Resolver Runtime ;
-   Feature Resolver ;
-   Capability Resolver ;
-   Rule Resolver ;
-   Effective Configuration Resolver ;
-   Runtime Registry ;
-   Runtime Cache ;
-   Activation / Deactivation ;
-   Runtime compatibility ;
-   Definition providers ;
-   Health / Readiness ;
-   Diagnostics ;
-   Runtime errors ;
-   Observability ;
-   Runtime audit.

Pack Runtime ne possède pas :

``` text
Entity authoring → Business Manager
Page authoring → UI Builder
Workflow authoring → Automation
Pack composition → Pack Manager
Manifest authoring métier → Pack Manager
IAM authoring → IAM
```

------------------------------------------------------------------------

# 5. Architecture fonctionnelle

Navigation cible :

``` text
Runtime
├── Vue d'ensemble
├── Contextes
├── Manifest
├── Résolution
├── Configuration effective
├── Cache
└── Diagnostics
```

Le Runtime doit apparaître une seule fois dans la navigation globale :

``` text
EXÉCUTION
└── Runtime
```

Il ne doit pas exister un second « Pack Runtime » sous Pack Manager.

------------------------------------------------------------------------

# 6. Runtime Cockpit

Le cockpit doit afficher uniquement des informations réelles.

Exemple :

``` text
Runtime — TechBoutique

Pack Version            1.4.0
Publication             PUBLISHED
Runtime State           ACTIVE
Manifest                VALID
Context                 RESOLVED

Dependencies            12 / 12
Capabilities            34 / 34
Configuration           RESOLVED
Cache                   READY

Errors                   0
Warnings                 2
```

Afficher également :

-   tenant ;
-   application ;
-   environment ;
-   publication active ;
-   manifest version ;
-   runtime version ;
-   dernière activation ;
-   dernière résolution ;
-   dernière erreur ;
-   dernière invalidation cache.

Ne jamais afficher `Healthy`, `Active`, `Resolved` ou équivalent avec
des données fictives.

------------------------------------------------------------------------

# 7. Pipeline Runtime

Pipeline de référence :

``` text
Published Pack
      ↓
Manifest Loader
      ↓
Manifest Validator
      ↓
Compatibility Check
      ↓
Runtime Context Builder
      ↓
Dependency Resolver
      ↓
Feature / Capability Resolver
      ↓
Rule Resolver
      ↓
Effective Configuration Resolver
      ↓
Definition Registry
      ↓
Cache
      ↓
ACTIVE RUNTIME CONTEXT
```

Chaque étape doit être observable et diagnostiquable.

------------------------------------------------------------------------

# 8. Published Pack Loader

Le loader récupère une publication exacte.

Entrées conceptuelles :

``` text
tenantId
applicationId
packId
packVersionId
publicationId
environment
```

Le loader ne doit jamais choisir silencieusement une version DRAFT.

Une application en production doit utiliser une publication explicite.

------------------------------------------------------------------------

# 9. Règles de chargement

Le Loader doit vérifier au minimum :

``` text
Publication exists
Publication belongs to tenant
Pack version is published
Manifest exists
Manifest belongs to publication
Manifest is immutable
Required definitions exist
Runtime compatibility can be evaluated
```

En cas d'échec, le Runtime doit produire une erreur structurée.

------------------------------------------------------------------------

# 10. Manifest Loader

Le Manifest Loader charge le Manifest publié.

Il ne le reconstruit pas.

Exemple conceptuel :

``` json
{
  "manifestVersion": "1.0",
  "pack": {
    "key": "techboutique",
    "version": "1.4.0"
  },
  "business": {
    "schemaVersion": "2.0"
  },
  "ui": {
    "schemaVersion": "1.0"
  },
  "automation": {
    "schemaVersion": "1.0"
  },
  "modules": [],
  "features": [],
  "capabilities": [],
  "dependencies": [],
  "runtime": {}
}
```

------------------------------------------------------------------------

# 11. Manifest Validator

Le Runtime doit vérifier :

``` text
manifestVersion
pack identity
pack version
publication identity
definition references
schema versions
dependencies
runtime requirements
required capabilities
connector requirements
integrity information
```

Résultats :

``` text
VALID
INVALID
INCOMPATIBLE
```

------------------------------------------------------------------------

# 12. Manifest Integrity

Si Pack Manager fournit une empreinte :

``` text
manifestHash
```

Runtime peut vérifier que le Manifest chargé correspond à l'artefact
publié.

Une erreur d'intégrité doit empêcher l'activation.

Exemple :

``` text
MANIFEST_INTEGRITY_ERROR
```

------------------------------------------------------------------------

# 13. Runtime Compatibility

Runtime doit comparer :

``` text
Pack Requirements
        ↕
Runtime Capabilities
```

Exemple :

``` text
Pack requires:

business.definition.v2
ui.definition.v1
automation.workflow.v1
datatable.v1
erp.adapter.v1
```

Runtime doit déterminer si ces capacités sont réellement disponibles.

------------------------------------------------------------------------

# 14. Compatibility Result

Exemple :

``` text
business.definition.v2     ✓
ui.definition.v1           ✓
automation.workflow.v1     ✓
datatable.v1               ✓
erp.adapter.v1             ✕
```

Résultat :

``` text
INCOMPATIBLE
```

L'activation doit être bloquée si une exigence obligatoire manque.

------------------------------------------------------------------------

# 15. Runtime Context

Le Runtime Context représente l'état effectif d'une application publiée
dans un contexte donné.

Exemple conceptuel :

``` json
{
  "tenantId": "...",
  "applicationId": "...",
  "applicationVersionId": "...",
  "packId": "...",
  "packVersionId": "...",
  "publicationId": "...",
  "environment": "production",
  "runtimeVersion": "...",
  "status": "ACTIVE"
}
```

------------------------------------------------------------------------

# 16. Runtime Context Identity

Un contexte doit être identifiable de façon déterministe.

Conceptuellement :

``` text
Tenant
+
Application
+
Published Pack Version
+
Environment
```

La clé exacte doit suivre l'architecture existante.

------------------------------------------------------------------------

# 17. Context Resolver

Le Context Resolver doit déterminer :

``` text
tenant
application
pack publication
environment
effective configuration
available capabilities
enabled features
definition versions
connector availability
```

Il ne doit jamais faire confiance uniquement aux valeurs reçues du
frontend.

------------------------------------------------------------------------

# 18. Isolation multi-tenant

Chaque contexte Runtime est tenant-scoped.

Tenant B ne doit jamais pouvoir :

``` text
load
inspect
resolve
activate
invalidate cache
diagnose
```

un contexte du Tenant A.

------------------------------------------------------------------------

# 19. Dependency Resolver Runtime

Le Pack Manager valide les dépendances avant publication.

Runtime les **résout à nouveau dans son environnement réel** lorsque
nécessaire.

Exemple :

``` text
Pack
├── Orders
│   └── Catalog
├── Invoicing
│   ├── Orders
│   └── Customers
└── Payments
```

Runtime vérifie la disponibilité effective.

------------------------------------------------------------------------

# 20. Différence PM Resolver / Runtime Resolver

Pack Manager :

``` text
La composition est-elle théoriquement valide ?
```

Runtime :

``` text
Les dépendances nécessaires sont-elles réellement disponibles ici et maintenant ?
```

Cette distinction doit rester explicite.

------------------------------------------------------------------------

# 21. Dependency Errors

Codes conceptuels :

``` text
DEPENDENCY_MISSING
DEPENDENCY_VERSION_MISMATCH
DEPENDENCY_UNAVAILABLE
CIRCULAR_DEPENDENCY
CONNECTOR_UNAVAILABLE
RUNTIME_CAPABILITY_MISSING
```

Chaque erreur doit indiquer :

``` text
source
target
requirement
actual state
severity
traceId
```

------------------------------------------------------------------------

# 22. Feature Resolver

Runtime détermine les Features réellement activées.

Sources possibles :

``` text
Pack Manifest
Runtime Compatibility
Configuration
Environment
Feature Requirements
```

Résultat conceptuel :

``` text
catalog             ENABLED
inventory           ENABLED
payments            ENABLED
advanced-reports    DISABLED
```

------------------------------------------------------------------------

# 23. Capability Resolver

Runtime construit l'ensemble des capacités effectives.

Exemple :

``` text
order.create        AVAILABLE
order.validate      AVAILABLE
invoice.generate    AVAILABLE
stock.adjust        AVAILABLE
payment.capture     UNAVAILABLE
```

Une capacité peut être déclarée dans le Pack mais indisponible si une
dépendance Runtime obligatoire manque.

------------------------------------------------------------------------

# 24. Capability Registry

Le Runtime Registry doit permettre de répondre :

``` text
Capability exists?
Capability available?
Capability version?
Provider?
Status?
```

Exemple conceptuel :

``` json
{
  "key": "invoice.generate",
  "status": "AVAILABLE",
  "provider": "invoicing",
  "version": "1.2.0"
}
```

------------------------------------------------------------------------

# 25. Rule Resolver

Pack Manager valide les règles de composition.

Runtime évalue les règles dépendant du contexte effectif.

Exemples :

``` text
IF payments enabled
THEN payment connector available

IF ERP automation active
THEN ERP Adapter runtime available

IF feature requires runtime >= 1.4
THEN runtime version compatible
```

Résultats :

``` text
PASS
WARNING
ERROR
```

------------------------------------------------------------------------

# 26. Effective Configuration Resolver

Le Runtime doit produire une **configuration effective** déterministe.

Pipeline conceptuel :

``` text
Configuration Definition
      ↓
Platform Defaults
      ↓
Tenant Overrides
      ↓
Application Overrides
      ↓
Application Version
      ↓
Environment Overrides
      ↓
Runtime Resolution
      ↓
Effective Configuration
```

N'utiliser que les scopes réellement supportés.

------------------------------------------------------------------------

# 27. Effective Configuration

Exemple :

``` json
{
  "currency": "MGA",
  "locale": "fr-MG",
  "inventory": {
    "allowNegativeStock": false
  },
  "orders": {
    "autoNumbering": true
  }
}
```

Cette configuration est consommée par les moteurs Runtime.

------------------------------------------------------------------------

# 28. Configuration Provenance

Le diagnostic devrait idéalement pouvoir expliquer :

``` text
currency = MGA

Source:
Application Version Override
```

ou :

``` text
allowNegativeStock = false

Source:
Tenant Configuration
```

Cela facilite fortement le diagnostic.

------------------------------------------------------------------------

# 29. Secrets

Les secrets ne doivent jamais apparaître dans :

``` text
Manifest
Runtime diagnostics publics
Frontend payload
Audit logs
Execution logs
```

Le Runtime utilise uniquement :

``` text
secretRef
```

ou le mécanisme sécurisé existant.

------------------------------------------------------------------------

# 30. Business Definition Runtime

Runtime doit fournir la Business Definition publiée aux moteurs qui en
ont besoin.

Exemples :

``` text
Entity Registry
Field Registry
Relation Registry
Feature Registry
Capability Registry
Business Event Registry
```

Runtime ne permet pas de modifier ces définitions.

------------------------------------------------------------------------

# 31. UI Definition Runtime

Le Runtime doit exposer la UI Definition publiée au renderer.

Flux :

``` text
Published UI Definition
      ↓
UI Definition Provider
      ↓
Component Registry
      ↓
Runtime Renderer
      ↓
React UI
```

Runtime doit vérifier la compatibilité des composants.

------------------------------------------------------------------------

# 32. UI Runtime Contract

Le contrat peut contenir :

``` text
schemaVersion
pages
components
bindings
actions
navigation
theme
responsive
```

Runtime refuse proprement :

``` text
UNKNOWN_COMPONENT
UNSUPPORTED_UI_SCHEMA
INVALID_BINDING
UNSUPPORTED_ACTION
```

------------------------------------------------------------------------

# 33. Automation Runtime Contract

Automation Definition publiée doit pouvoir être enregistrée auprès du
moteur Automation.

Flux :

``` text
Published Automation Definition
      ↓
Automation Definition Provider
      ↓
Workflow Registry
      ↓
Trigger Registry
      ↓
Workflow Engine
```

Pack Runtime fournit le contexte publié ; Automation Engine reste
responsable de l'exécution métier des workflows.

------------------------------------------------------------------------

# 34. Automation Compatibility

Vérifier :

``` text
Workflow schema version
Node types
Action types
Trigger types
Connector requirements
Runtime capabilities
```

Une incompatibilité doit être visible avant activation lorsque possible.

------------------------------------------------------------------------

# 35. ERP Adapter Runtime Contract

Si le Pack nécessite ERP :

``` text
Pack Runtime
      ↓
ERP Adapter Contract
      ↓
ERP Adapter
      ↓
Dolibarr
```

Runtime ne doit pas contourner l'ERP Adapter pour appeler directement
Dolibarr lorsque l'Adapter constitue la couche d'intégration officielle.

------------------------------------------------------------------------

# 36. Runtime Registry

Le Registry centralise les ressources disponibles.

Conceptuellement :

``` text
Pack Registry
Definition Registry
Module Registry
Feature Registry
Capability Registry
Connector Registry
Runtime Capability Registry
```

Ne pas créer plusieurs registries concurrents si des structures
équivalentes existent déjà.

------------------------------------------------------------------------

# 37. Runtime Registry Entry

Exemple :

``` json
{
  "type": "CAPABILITY",
  "key": "stock.adjust",
  "provider": "inventory",
  "version": "1.0.0",
  "status": "AVAILABLE"
}
```

------------------------------------------------------------------------

# 38. Cache

Le Runtime doit éviter de recalculer toute la résolution à chaque
requête.

Caches possibles :

``` text
Manifest Cache
Runtime Context Cache
Effective Configuration Cache
Capability Cache
Feature Cache
Definition Cache
```

Utiliser l'infrastructure de cache existante.

Ne pas ajouter Redis ou une nouvelle technologie sans audit.

------------------------------------------------------------------------

# 39. Cache Keys

Conceptuellement :

``` text
tenant
application
packVersion
environment
resource
```

Exemple :

``` text
runtime:{tenant}:{application}:{packVersion}:{environment}
```

Le format final suit les conventions existantes.

------------------------------------------------------------------------

# 40. Cache Invalidation

Invalidation lors de :

``` text
new publication activation
environment change
configuration change requiring refresh
connector state change when applicable
manual authorized invalidation
runtime deployment
```

Une publication DRAFT ne doit pas invalider un contexte PUBLISHED actif.

------------------------------------------------------------------------

# 41. Cache Safety

Le cache doit respecter strictement le tenant.

Une clé de cache insuffisamment scopée ne doit jamais permettre une
fuite inter-tenant.

------------------------------------------------------------------------

# 42. Activation

Activation conceptuelle :

``` text
Published Pack
      ↓
Load
      ↓
Validate
      ↓
Resolve
      ↓
Build Runtime Context
      ↓
Cache
      ↓
ACTIVE
```

L'activation doit être transactionnelle ou compensable selon
l'architecture existante.

------------------------------------------------------------------------

# 43. Runtime States

États proposés :

``` text
INACTIVE
LOADING
VALIDATING
RESOLVING
READY
ACTIVE
DEGRADED
ERROR
```

Les enums existants doivent être audités avant modification.

------------------------------------------------------------------------

# 44. ACTIVE vs READY

`READY` :

``` text
Le contexte est valide et peut être activé.
```

`ACTIVE` :

``` text
Le contexte est celui actuellement utilisé.
```

Cette distinction est utile si l'architecture la supporte.

------------------------------------------------------------------------

# 45. DEGRADED

`DEGRADED` ne doit être utilisé que si l'application peut réellement
continuer avec une capacité non critique indisponible.

Exemple :

``` text
Core business        AVAILABLE
Email connector      UNAVAILABLE
Email optional       YES
```

Sinon utiliser `ERROR`.

------------------------------------------------------------------------

# 46. Deactivation

Une désactivation doit être explicite et autorisée.

Elle peut :

``` text
mark context inactive
stop new runtime resolution for that publication
invalidate relevant cache
update registry
audit operation
```

Elle ne supprime pas l'historique de publication.

------------------------------------------------------------------------

# 47. Fallback

Aucun fallback silencieux vers une ancienne version.

Si un fallback est supporté :

``` text
must be explicitly configured
must target a published compatible version
must be audited
must be visible in diagnostics
```

------------------------------------------------------------------------

# 48. Health

Le Runtime doit distinguer plusieurs niveaux.

## Process Health

``` text
Le service Runtime répond-il ?
```

## Readiness

``` text
Le Runtime peut-il servir ce contexte ?
```

## Context Health

``` text
Ce Pack précis est-il correctement résolu ?
```

Ne pas afficher un seul `Healthy` fictif pour tout.

------------------------------------------------------------------------

# 49. Health Example

``` json
{
  "service": "UP",
  "runtime": "READY",
  "context": "ACTIVE",
  "manifest": "VALID",
  "dependencies": "RESOLVED",
  "configuration": "RESOLVED"
}
```

Les valeurs doivent venir de contrôles réels.

------------------------------------------------------------------------

# 50. Diagnostics Cockpit

Le Runtime doit disposer d'un cockpit de diagnostic.

Exemple :

``` text
Runtime Diagnostics

Manifest               VALID
Compatibility          PASS
Dependencies           12 / 12
Features               18 / 18
Capabilities           34 / 35
Configuration          RESOLVED
Cache                  READY
Connectors             3 / 4

Warnings               1
Errors                 0
```

------------------------------------------------------------------------

# 51. Diagnostic Drill-down

Un clic sur :

``` text
Capabilities 34 / 35
```

doit montrer :

``` text
payment.capture

Status:
UNAVAILABLE

Reason:
payment.gateway connector unavailable

Required by:
Payments module
```

------------------------------------------------------------------------

# 52. Runtime Errors

Les erreurs doivent être structurées.

Exemple :

``` json
{
  "code": "RUNTIME_CAPABILITY_MISSING",
  "message": "Required capability is unavailable",
  "context": {
    "capability": "payment.capture"
  },
  "traceId": "..."
}
```

Le frontend ne doit pas remplacer les erreurs backend par des messages
génériques trompeurs.

------------------------------------------------------------------------

# 53. Error Categories

Exemples :

``` text
MANIFEST_ERROR
COMPATIBILITY_ERROR
DEPENDENCY_ERROR
CAPABILITY_ERROR
FEATURE_ERROR
CONFIGURATION_ERROR
CONNECTOR_ERROR
CACHE_ERROR
CONTEXT_ERROR
SECURITY_ERROR
```

------------------------------------------------------------------------

# 54. Observabilité

Champs utiles :

``` text
requestId
traceId
tenantId
userId
applicationId
packId
packVersionId
publicationId
runtimeContextId
environment
```

------------------------------------------------------------------------

# 55. Metrics

Si l'infrastructure le permet :

``` text
context_resolution_duration
manifest_load_duration
cache_hit_ratio
cache_miss_ratio
activation_duration
runtime_errors_total
dependency_resolution_errors
configuration_resolution_errors
```

Ne pas créer un système de métriques parallèle si Observability existe
déjà.

------------------------------------------------------------------------

# 56. Logs

Logs structurés :

``` text
timestamp
level
traceId
tenantId
applicationId
packVersion
runtimeContextId
operation
duration
status
errorCode
```

Ne jamais journaliser des secrets.

------------------------------------------------------------------------

# 57. Audit

Événements significatifs :

``` text
RUNTIME_CONTEXT_CREATED
RUNTIME_CONTEXT_RESOLVED
RUNTIME_ACTIVATED
RUNTIME_DEACTIVATED
RUNTIME_DEGRADED
RUNTIME_ERROR
CACHE_INVALIDATED
RUNTIME_FALLBACK_ACTIVATED
```

Éviter l'audit de chaque lecture normale.

------------------------------------------------------------------------

# 58. IAM

Pack Runtime réutilise IAM existant.

Permissions indicatives :

``` text
runtime.read
runtime.context.read
runtime.manifest.read
runtime.configuration.read
runtime.cache.read
runtime.cache.invalidate
runtime.diagnostics.read
runtime.activate
runtime.deactivate
```

Adapter aux permissions réellement présentes.

------------------------------------------------------------------------

# 59. Security

Pipeline :

``` text
Authentication
      ↓
Tenant Context
      ↓
Authorization
      ↓
Runtime Context Validation
      ↓
Operation
      ↓
Audit
```

Le Runtime ne doit jamais faire confiance à un tenantId fourni
arbitrairement par le client.

------------------------------------------------------------------------

# 60. Runtime API indicative

Préfixe conceptuel :

``` text
/api/runtime
```

## Overview

``` http
GET /overview
```

## Contexts

``` http
GET /contexts
GET /contexts/:id
POST /contexts/:id/resolve
```

## Manifest

``` http
GET /contexts/:id/manifest
```

## Resolution

``` http
GET  /contexts/:id/resolution
POST /contexts/:id/resolve
```

## Effective Configuration

``` http
GET /contexts/:id/configuration
```

## Cache

``` http
GET  /contexts/:id/cache
POST /contexts/:id/cache/invalidate
```

## Diagnostics

``` http
GET /contexts/:id/diagnostics
```

## Activation

``` http
POST /contexts/:id/activate
POST /contexts/:id/deactivate
```

Les routes finales doivent suivre l'API existante.

------------------------------------------------------------------------

# 61. Runtime Bridge API

Pack Manager peut utiliser un contrat interne ou service pour :

``` text
publish notification
register publication
request activation
query runtime compatibility
query runtime capabilities
```

Éviter les dépendances circulaires PM ↔ Runtime.

------------------------------------------------------------------------

# 62. Modèle conceptuel

Concepts possibles :

``` text
RuntimeContext
RuntimeManifestSnapshot
RuntimeResolution
RuntimeDependencyState
RuntimeFeatureState
RuntimeCapabilityState
RuntimeConfigurationSnapshot
RuntimeCacheEntry
RuntimeDiagnostic
RuntimeActivation
```

Ne pas créer automatiquement toutes ces tables.

Certaines données peuvent être calculées ou stockées dans le cache.

------------------------------------------------------------------------

# 63. RuntimeContext conceptuel

``` text
id
tenantId
applicationId
applicationVersionId
packId
packVersionId
publicationId
environment
status
runtimeVersion
resolvedAt
activatedAt
createdAt
updatedAt
```

------------------------------------------------------------------------

# 64. Runtime Resolution Snapshot

Une résolution peut conserver :

``` text
manifestVersion
dependencyState
featureState
capabilityState
configurationSnapshot
compatibilityState
resolvedAt
```

Utile pour diagnostics et reproductibilité si l'architecture le
justifie.

------------------------------------------------------------------------

# 65. Prisma

Avant toute migration :

``` text
1. lire schema.prisma ;
2. rechercher tous les modèles Runtime ;
3. rechercher Pack / PackVersion / Publication ;
4. rechercher cache et runtime context existants ;
5. rechercher enums Runtime ;
6. réutiliser les structures existantes ;
7. créer uniquement ce qui manque réellement ;
8. respecter tenantId ;
9. respecter FK composites ;
10. respecter indexes et uniques.
```

Aucune réécriture aveugle du schéma.

------------------------------------------------------------------------

# 66. Runtime UI --- Vue d'ensemble

Exemple :

``` text
Runtime

TechBoutique
Production

ACTIVE
Pack 1.4.0

Manifest
VALID

Dependencies
12 / 12

Capabilities
34 / 34

Configuration
RESOLVED

Cache
READY
```

CTA contextuels :

``` text
View Context
Diagnostics
Refresh
```

L'activation/désactivation n'est visible que si l'utilisateur possède la
permission.

------------------------------------------------------------------------

# 67. Contextes

Écran :

``` text
Runtime Contexts

Application     Environment     Pack       State
TechBoutique    Production      1.4.0      ACTIVE
TechBoutique    Staging         1.5.0      READY
CRM             Production      2.1.0      ACTIVE
```

Filtres :

``` text
Tenant
Application
Environment
State
Pack Version
```

------------------------------------------------------------------------

# 68. Manifest Screen

Afficher en lecture seule :

``` text
Manifest Version
Pack
Pack Version
Publication
Generated At
Integrity
Runtime Requirements
```

Sections :

``` text
Business
UI
Automation
Modules
Features
Capabilities
Dependencies
Configuration Requirements
Connectors
Runtime
```

Possibilité de consulter le JSON publié.

Aucune édition.

------------------------------------------------------------------------

# 69. Résolution

Écran pipeline :

``` text
Manifest
   ✓
   ↓
Compatibility
   ✓
   ↓
Dependencies
   ✓
   ↓
Features
   ✓
   ↓
Capabilities
   ⚠
   ↓
Configuration
   ✓
   ↓
Context
   READY
```

Cliquer sur une étape ouvre son diagnostic.

------------------------------------------------------------------------

# 70. Configuration Effective Screen

Afficher :

``` text
Key
Effective Value
Source
Scope
Status
```

Exemple :

``` text
currency              MGA       Application     APPLICATION    RESOLVED
allowNegativeStock    false     Tenant          TENANT         RESOLVED
locale                fr-MG     Platform        PLATFORM       RESOLVED
```

Masquer les valeurs sensibles.

------------------------------------------------------------------------

# 71. Cache Screen

Afficher des informations réelles :

``` text
Cache Type
Status
Entries
Last Refresh
Last Invalidation
```

Actions selon permission :

``` text
Refresh
Invalidate
```

Ne pas permettre une invalidation globale dangereuse sans confirmation.

------------------------------------------------------------------------

# 72. Diagnostics Screen

Sections :

``` text
Summary
Manifest
Compatibility
Dependencies
Features
Capabilities
Configuration
Connectors
Cache
Errors
Warnings
Trace
```

Objectif : permettre au développeur ou administrateur de comprendre
**pourquoi** un contexte n'est pas ACTIVE.

------------------------------------------------------------------------

# 73. UI/UX

Design commun Techzone Cloud :

-   fond slate clair ;
-   surfaces blanches ;
-   bleu Techzone ;
-   bordures fines ;
-   radius 10--12 px ;
-   ombres légères ;
-   densité professionnelle ;
-   statuts lisibles ;
-   icônes cohérentes.

Runtime doit avoir une identité de **cockpit d'exécution et
diagnostic**, distincte de Business Manager et Pack Manager.

------------------------------------------------------------------------

# 74. Status Design

Les statuts doivent utiliser :

``` text
icon
label
color
text
```

Ne jamais dépendre uniquement de la couleur.

Exemples :

``` text
✓ ACTIVE
⚠ DEGRADED
✕ ERROR
○ INACTIVE
```

------------------------------------------------------------------------

# 75. États UX

``` text
Loading
Loaded
Empty
Error
Unauthorized
Forbidden
Resolving
Resolved
Activating
Active
Deactivating
Degraded
Cache Refreshing
```

------------------------------------------------------------------------

# 76. Micro-interactions

Animations légères :

``` text
150–220 ms
```

Pour :

``` text
tabs
drawers
status transition
diagnostic expansion
pipeline steps
cache refresh
```

Respecter `prefers-reduced-motion`.

------------------------------------------------------------------------

# 77. Responsive

Desktop :

``` text
Sidebar + Runtime Workspace + Diagnostics
```

Laptop :

``` text
Compact Sidebar + Workspace
```

Tablet :

``` text
Workspace + drawers
```

Mobile :

priorité à :

``` text
Runtime status
Manifest status
Diagnostics
Errors
Warnings
Active Pack
```

Les opérations sensibles restent Desktop-first si nécessaire.

------------------------------------------------------------------------

# 78. Performance

Objectifs :

``` text
Avoid resolving context on every request
Cache stable definitions
Cache effective configuration
Invalidate deterministically
Lazy load diagnostic details
Paginate runtime contexts
Avoid frontend polling excessive
```

Le système ne doit pas masquer les données obsolètes comme actuelles.

------------------------------------------------------------------------

# 79. Concurrency

Prévoir les risques :

``` text
two activations
activation + invalidation
publication + resolution
configuration refresh + request
```

Utiliser les mécanismes de verrouillage/transaction existants.

Ne pas ajouter une nouvelle queue ou lock infrastructure sans audit.

------------------------------------------------------------------------

# 80. Resilience

Pour chaque dépendance externe :

``` text
timeout
error classification
retry policy if safe
fallback only if explicitly supported
diagnostics
```

Ne pas faire de retry infini.

------------------------------------------------------------------------

# 81. Startup Behavior

Au démarrage Runtime :

``` text
Load runtime capabilities
Initialize registries
Initialize cache
Validate infrastructure
Restore/reload active contexts as required
Expose readiness
```

Le service ne doit pas annoncer READY avant que les préconditions
critiques soient satisfaites.

------------------------------------------------------------------------

# 82. Runtime Upgrade

Lorsqu'une nouvelle version Runtime est déployée :

``` text
Runtime v1.4
      ↓
check active Pack compatibility
      ↓
reload compatible contexts
      ↓
flag incompatible contexts
```

Ne pas rendre silencieusement un Pack incompatible actif.

------------------------------------------------------------------------

# 83. Schema Compatibility

Runtime doit connaître les versions supportées :

``` text
Business Definition schemas
UI Definition schemas
Automation Definition schemas
Manifest schemas
```

Exemple :

``` text
business.definition.v2 → SUPPORTED
ui.definition.v1       → SUPPORTED
automation.workflow.v1 → SUPPORTED
manifest.v1            → SUPPORTED
```

------------------------------------------------------------------------

# 84. Graceful Rejection

Une définition incompatible produit :

``` text
UNSUPPORTED_SCHEMA_VERSION
```

avec :

``` text
receivedVersion
supportedVersions
component
traceId
```

et non un crash générique.

------------------------------------------------------------------------

# 85. AI Runtime Assistant

Une IA peut assister le diagnostic.

Exemples :

> Pourquoi TechBoutique est en DEGRADED ?

> Quelle Capability manque ?

> Pourquoi la configuration currency vaut MGA ?

> Pourquoi Pack 1.5.0 ne peut pas être activé ?

L'IA utilise uniquement les diagnostics et métadonnées autorisés.

Elle ne doit pas activer/désactiver silencieusement un contexte.

------------------------------------------------------------------------

# 86. AI Diagnostic Flow

``` text
Runtime State
      ↓
Structured Diagnostics
      ↓
AI Explanation
      ↓
Suggested Actions
      ↓
User Decision
```

L'IA ne doit jamais inventer un statut ou une cause absente des données.

------------------------------------------------------------------------

# 87. Règles de gestion

-   **RG-PR-001** --- Runtime ne charge que des Packs publiés ou
    explicitement autorisés par l'architecture.
-   **RG-PR-002** --- Un Runtime Context appartient à un tenant.
-   **RG-PR-003** --- Toute résolution est tenant-scoped.
-   **RG-PR-004** --- Runtime ne modifie jamais une Pack Version
    publiée.
-   **RG-PR-005** --- Runtime charge le Manifest publié ; il ne le
    reconstruit pas arbitrairement.
-   **RG-PR-006** --- Un Manifest invalide empêche l'activation.
-   **RG-PR-007** --- Une incompatibilité Runtime obligatoire empêche
    l'activation.
-   **RG-PR-008** --- Une dépendance obligatoire indisponible empêche
    l'activation.
-   **RG-PR-009** --- Une Capability obligatoire indisponible empêche
    l'activation.
-   **RG-PR-010** --- Les secrets ne sont jamais exposés dans le
    Manifest, diagnostics ou frontend.
-   **RG-PR-011** --- La configuration effective suit les règles de
    résolution officielles.
-   **RG-PR-012** --- Une configuration DRAFT ne modifie pas
    silencieusement un contexte publié actif.
-   **RG-PR-013** --- Les clés cache incluent le scope tenant
    nécessaire.
-   **RG-PR-014** --- Une invalidation cache est auditée lorsqu'elle est
    significative.
-   **RG-PR-015** --- Un fallback ne peut pas être silencieux.
-   **RG-PR-016** --- Une ancienne version ne peut être utilisée comme
    fallback que si elle est publiée et compatible.
-   **RG-PR-017** --- Runtime réutilise IAM.
-   **RG-PR-018** --- Runtime réutilise le Tenant Context officiel.
-   **RG-PR-019** --- UI Runtime consomme uniquement des composants
    supportés.
-   **RG-PR-020** --- Automation Runtime consomme uniquement des
    nodes/actions supportés.
-   **RG-PR-021** --- Les appels ERP passent par ERP Adapter lorsque
    celui-ci est la couche officielle.
-   **RG-PR-022** --- Un statut Healthy/Active/Resolved doit provenir
    d'un contrôle réel.
-   **RG-PR-023** --- Les erreurs Runtime sont structurées et traçables.
-   **RG-PR-024** --- Une activation est auditée.
-   **RG-PR-025** --- Une désactivation est auditée.
-   **RG-PR-026** --- Une publication DRAFT ne peut pas remplacer
    silencieusement un contexte actif.
-   **RG-PR-027** --- Les définitions publiées sont consommées en
    lecture seule.
-   **RG-PR-028** --- Runtime doit rejeter proprement une schemaVersion
    non supportée.
-   **RG-PR-029** --- Runtime ne doit pas créer un second système de
    permissions.
-   **RG-PR-030** --- Aucun mock silencieux n'est autorisé en mode REAL.

------------------------------------------------------------------------

# 88. MVP Pack Runtime v2

Ordre recommandé :

``` text
1. Audit Runtime existant
2. Gap Matrix
3. Published Pack Loader
4. Manifest Loader
5. Manifest Validator
6. Runtime Compatibility
7. Runtime Context
8. Context Resolver
9. Dependency Resolver
10. Feature Resolver
11. Capability Resolver
12. Rule Resolver
13. Effective Configuration
14. Runtime Registry
15. Runtime Cache
16. Activation
17. Deactivation
18. Health / Readiness
19. Diagnostics
20. Runtime Bridge PM
21. Business Definition Provider
22. UI Definition Provider
23. Automation Definition Provider
24. ERP Adapter Contract
25. Security Tests
26. E2E
```

------------------------------------------------------------------------

# 89. Phase 2

``` text
Advanced Cache Strategy
Environment Management
Runtime Context Comparison
Resolution Snapshot History
Advanced Compatibility Matrix
Controlled Fallback
Runtime Upgrade Assistant
Advanced Metrics
AI Diagnostics
```

------------------------------------------------------------------------

# 90. Phase 3

``` text
Distributed Runtime Registry
Multi-region Runtime
Advanced Resilience
Canary Runtime Activation
Progressive Rollout
Runtime Policy Engine
Advanced Circuit Breakers
Runtime Marketplace Capabilities
```

Ne pas alourdir le MVP avec ces fonctionnalités.

------------------------------------------------------------------------

# 91. Tests unitaires

Tester :

``` text
Manifest Loader
Manifest Validator
Compatibility Resolver
Context Resolver
Dependency Resolver
Feature Resolver
Capability Resolver
Rule Resolver
Configuration Resolver
Cache Key Builder
Cache Invalidation
Runtime State Machine
Schema Compatibility
```

------------------------------------------------------------------------

# 92. Tests d'intégration

Tester :

``` text
Pack Manager → Pack Runtime

Published Pack
→ Manifest Loader
→ Resolver
→ Runtime Context

Business Definition
→ Runtime Registry

UI Definition
→ UI Runtime Provider

Automation Definition
→ Automation Runtime Provider

Runtime
→ ERP Adapter
```

------------------------------------------------------------------------

# 93. Tests sécurité

Tester explicitement :

``` text
Cross-Tenant Runtime Context Read
Cross-Tenant Manifest Read
Cross-Tenant Configuration Read
Cross-Tenant Cache Invalidation
Cross-Tenant Activation
Cross-Tenant Diagnostics

Unauthorized Activation
Unauthorized Deactivation
Unauthorized Cache Invalidation
Unauthorized Diagnostics

Secret Leakage
Malformed Manifest
Unsupported Schema
Invalid Tenant Context
```

------------------------------------------------------------------------

# 94. Tests Cache

Tester :

``` text
Cache hit
Cache miss
Tenant isolation
Pack version isolation
Environment isolation
Invalidation
New publication
Configuration refresh
No stale active context after activation
```

------------------------------------------------------------------------

# 95. Tests de résilience

Tester :

``` text
Connector timeout
Connector unavailable
Cache unavailable
Manifest invalid
Dependency unavailable
Configuration resolution error
Runtime capability missing
Activation interrupted
Concurrent activation
```

------------------------------------------------------------------------

# 96. E2E principal

``` text
LOGIN
  ↓
BUSINESS MANAGER
  ↓
Business Definition READY
  ↓
UI BUILDER
  ↓
UI Definition READY
  ↓
AUTOMATION
  ↓
Automation Definition READY
  ↓
PACK MANAGER
  ↓
Pack Composition
  ↓
Validation
  ↓
Manifest
  ↓
Publication
  ↓
PACK RUNTIME
  ↓
Published Pack Loader
  ↓
Manifest Loader
  ↓
Manifest Validator
  ↓
Compatibility
  ↓
Runtime Context
  ↓
Dependency Resolver
  ↓
Feature Resolver
  ↓
Capability Resolver
  ↓
Rule Resolver
  ↓
Effective Configuration
  ↓
Runtime Registry
  ↓
Cache
  ↓
READY
  ↓
ACTIVE
  ↓
Application Runtime
```

Ce parcours constitue la recette E2E de référence.

------------------------------------------------------------------------

# 97. Organisation technique indicative

Backend :

``` text
backend/src/modules/pack-runtime/
├── loader/
├── manifest/
├── context/
├── compatibility/
├── dependencies/
├── features/
├── capabilities/
├── rules/
├── configuration/
├── registry/
├── cache/
├── activation/
├── health/
└── diagnostics/
```

Frontend :

``` text
frontend/src/components/runtime/
├── overview/
├── contexts/
├── manifest/
├── resolution/
├── configuration/
├── cache/
└── diagnostics/
```

Cette organisation est indicative.

Réutiliser les modules/services existants lorsqu'ils existent.

------------------------------------------------------------------------

# 98. Gap Matrix obligatoire

Avant développement, produire :

  Fonction                  Existant    Backend   Frontend   Tests   Décision
  ------------------------- ----------- --------- ---------- ------- ----------
  Published Pack Loader     À auditer   ---       N/A        ---     AUDIT
  Manifest Loader           À auditer   ---       ---        ---     AUDIT
  Manifest Validator        À auditer   ---       ---        ---     AUDIT
  Runtime Context           À auditer   ---       ---        ---     AUDIT
  Dependency Resolver       À auditer   ---       ---        ---     AUDIT
  Feature Resolver          À auditer   ---       ---        ---     AUDIT
  Capability Resolver       À auditer   ---       ---        ---     AUDIT
  Rule Resolver             À auditer   ---       ---        ---     AUDIT
  Effective Configuration   À auditer   ---       ---        ---     AUDIT
  Registry                  À auditer   ---       ---        ---     AUDIT
  Cache                     À auditer   ---       ---        ---     AUDIT
  Diagnostics               À auditer   ---       ---        ---     AUDIT
  Runtime Bridge            À auditer   ---       ---        ---     AUDIT

Ne jamais déclarer `MISSING` avant recherche réelle.

------------------------------------------------------------------------

# 99. Instructions Codex / Freebuff / IA

Avant toute modification :

``` text
1. Considérer main comme base canonique.

2. Vérifier le workspace et l'état Git.

3. Lire tous les CDC Pack Runtime existants.

4. Lire tous les CDC Pack Manager existants.

5. Lire le CDC Pack Manager v2.

6. Lire le CDC Business Manager v2.

7. Lire le CDC UI Builder.

8. Lire le CDC Automation.

9. Rechercher tout code Pack Runtime existant.

10. Rechercher Runtime Controller / Module / Service.

11. Rechercher Runtime Cache.

12. Rechercher Runtime Bridge.

13. Rechercher Manifest Loader.

14. Rechercher Dependency Resolver.

15. Rechercher Rule Resolver.

16. Rechercher Effective Configuration.

17. Rechercher Runtime Context.

18. Rechercher Registry.

19. Examiner Prisma.

20. Examiner IAM.

21. Examiner Tenant Context.

22. Examiner ERP Adapter.

23. Examiner navigation/routing.

24. Examiner design system.

25. Examiner tests.

26. Produire Gap Matrix.

27. Seulement ensuite coder.
```

------------------------------------------------------------------------

# 100. Intégration de code historique

Si une implémentation Runtime utile existe dans une branche historique :

``` text
NE PAS FAIRE DE MERGE AVEUGLE
```

Utiliser :

``` text
READ
  ↓
UNDERSTAND
  ↓
COMPARE
  ↓
EXTRACT
  ↓
ADAPT
  ↓
TEST
```

Ne pas importer aveuglément :

``` text
anciens Guards
ancien IAM
ancien Tenant Context
ancien Prisma
ancienne configuration
ancien cache
ancienne navigation
ancienne structure Backend/
```

------------------------------------------------------------------------

# 101. Définition de DONE

Pack Runtime v2 est DONE lorsque :

``` text
✓ Published Pack Loader réel

✓ Manifest Loader fonctionnel
✓ Manifest Validator fonctionnel

✓ Runtime Compatibility fonctionnelle

✓ Runtime Context fonctionnel
✓ Context Resolver fonctionnel

✓ Dependency Resolver fonctionnel
✓ Feature Resolver fonctionnel
✓ Capability Resolver fonctionnel
✓ Rule Resolver fonctionnel

✓ Effective Configuration fonctionnelle

✓ Runtime Registry fonctionnel

✓ Cache fonctionnel
✓ Invalidation correcte

✓ Activation fonctionnelle
✓ Deactivation fonctionnelle

✓ Health réel
✓ Readiness réelle

✓ Diagnostics réels

✓ Business Definition Provider intégré
✓ UI Definition Provider intégré
✓ Automation Definition Provider intégré

✓ ERP Adapter Contract intégré si requis

✓ Pack Manager Runtime Bridge fonctionnel

✓ Tenant isolation vérifiée
✓ IAM vérifié
✓ Audit vérifié

✓ Secrets protégés

✓ Aucun faux statut Healthy
✓ Aucun mock silencieux en REAL mode

✓ Prisma validate PASS
✓ Prisma generate PASS

✓ Backend build PASS
✓ Frontend build PASS

✓ Tests Runtime PASS
✓ Tests Runtime Bridge PASS
✓ Tests Tenant PASS
✓ Tests Cache PASS
✓ Tests Security PASS

✓ Recette navigateur PASS
✓ E2E Publication → Runtime → ACTIVE PASS
```

------------------------------------------------------------------------

# 102. Principe produit final

``` text
BUSINESS MANAGER
      │
      │ définit le métier
      ▼
 UI BUILDER ───────── AUTOMATION
      │                   │
      │ expérience        │ processus
      └─────────┬─────────┘
                ▼
          PACK MANAGER
                │
                │ compose
                │ valide
                │ versionne
                │ manifeste
                │ publie
                ▼
           PACK RUNTIME
                │
                │ charge
                │ valide
                │ résout
                │ configure
                │ active
                │ observe
                ▼
       APPLICATION ACTIVE
```

Le Pack Runtime n'est pas un second Pack Manager.

Il est le **moteur de résolution et d'exécution des Packs publiés de
Techzone Cloud**.

Son rôle fondamental est de garantir qu'une publication donnée, pour un
tenant et un environnement donnés, puisse être chargée de façon
déterministe, vérifiée, résolue, configurée, activée et diagnostiquée
sans modifier la définition publiée.

------------------------------------------------------------------------

# FIN DU CAHIER DES CHARGES

**Techzone Cloud --- Pack Runtime v2.0**\
**Consolidation et extension de l'existant**
