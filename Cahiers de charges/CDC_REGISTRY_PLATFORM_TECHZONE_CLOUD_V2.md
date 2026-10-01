# CAHIER DES CHARGES --- TECHZONE CLOUD REGISTRY PLATFORM

**Version :** 2.0 --- Consolidation et extension\
**Date :** Septembre 2026\
**Projet :** Techzone Cloud\
**Statut :** Spécification fonctionnelle et technique consolidée\
**Principe :** registre transversal de découverte, versioning,
capacités, compatibilité et disponibilité, sans reprendre la propriété
des modules sources.

------------------------------------------------------------------------

## 1. Vision

Registry Platform répond aux questions suivantes :

-   Qu'est-ce qui existe dans Techzone Cloud ?
-   Quel module en est propriétaire ?
-   Quelle version est disponible ?
-   Quelles capacités sont supportées ?
-   Quel schéma ou contrat est compatible ?
-   L'élément est-il disponible dans le tenant et l'environnement
    courants ?
-   Peut-il être utilisé par le Pack Manager et le Pack Runtime ?

Le Registry **référence et indexe** les définitions. Il ne les réinvente
pas.

``` text
MODULE OWNER
définit et implémente
        ↓
REGISTRY PLATFORM
indexe • décrit • versionne • rend découvrable
        ↓
PACK MANAGER
valide • compose • verrouille
        ↓
PACK RUNTIME
résout • vérifie • exécute
```

La branche `main` reste canonique. Avant toute modification : `KEEP`,
`IMPROVE`, `COMPLETE`, `ADAPT` ou `IMPLEMENT`, uniquement après audit
réel.

------------------------------------------------------------------------

## 2. Architecture

``` text
                     REGISTRY PLATFORM
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
 BUSINESS REGISTRY     UI REGISTRY      AUTOMATION REGISTRY
 Features              Components       Nodes
 Capabilities          Actions          Triggers
 Events                Templates        Actions
       │                   │                   │
       ├───────────────────┼───────────────────┤
       ▼                   ▼                   ▼
 DATA REGISTRY      INTEGRATION REGISTRY  RUNTIME REGISTRY
 Providers          Connectors             Runtime Capabilities
 Contracts          Capabilities           Schema Versions
 Repositories       Contracts              Compatibility
```

Propriétaires :

-   Business Manager : Features, Business Capabilities, Business Events.
-   UI Builder : Components, UI Actions, Templates.
-   Automation : Nodes, Triggers, Actions.
-   Data Platform : Providers, Repositories, Data Contracts.
-   Integration Hub : Connectors, Integration Contracts et Connector
    Capabilities.
-   Pack Runtime : Runtime Capabilities et support des schémas runtime.

Registry Platform rend ces éléments découvrables et résolvables.

------------------------------------------------------------------------

## 3. Registry Core

Fonctions communes :

``` text
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
```

Une entrée conceptuelle peut contenir :

``` text
id
namespace
key
version
type
owner
provider
scope
status
capabilities
schemaRef
metadata
compatibility
createdAt
updatedAt
```

Toutes ces propriétés ne nécessitent pas obligatoirement une table
Prisma dédiée.

------------------------------------------------------------------------

## 4. Stable Keys et namespaces

Les clés inter-modules sont stables et indépendantes des labels UI.

Exemples :

``` text
business.feature.inventory
business.capability.invoice.generate
business.event.order.created

ui.component.datatable
ui.action.navigate

automation.node.condition
automation.action.send-email

data.provider.prisma
data.capability.transaction

integration.connector.dolibarr
integration.capability.invoice.create

runtime.capability.business-definition-v2
runtime.capability.ui-definition-v1
```

Namespaces proposés :

``` text
business
ui
automation
data
integration
runtime
platform
```

Sous-domaines possibles :

``` text
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
```

Auditer la nomenclature existante avant d'en imposer une nouvelle.

------------------------------------------------------------------------

## 5. Registres spécialisés

### Business Registry

Indexe Features, Capabilities, Business Events et versions de contrats.
Business Manager reste propriétaire.

### UI Registry

Indexe Components, Actions, Templates, bindings et capacités responsive.
UI Builder reste propriétaire.

### Automation Registry

Indexe Nodes, Triggers, Actions, Transforms et capacités d'exécution.
Automation reste propriétaire.

### Data Registry

Indexe Providers, Repositories, Data Contracts et Data Capabilities.
Data Platform reste propriétaire.

### Integration Registry

Indexe Connectors, Integration Contracts, Connector Capabilities et
versions provider. Integration Hub reste propriétaire.

### Runtime Registry

Indexe Runtime Capabilities, Definition Schemas supportés et métadonnées
de compatibilité. Pack Runtime reste propriétaire de l'exécution.

------------------------------------------------------------------------

## 6. Registration et autorité

Un module peut enregistrer ses éléments au démarrage, au déploiement ou
via configuration contrôlée.

Exemple :

``` json
{
  "namespace": "ui.component",
  "key": "datatable",
  "version": "1.2.0",
  "owner": "ui-builder",
  "provider": "core",
  "status": "AVAILABLE",
  "capabilities": ["binding", "pagination", "sorting"]
}
```

Un module ne peut pas enregistrer arbitrairement des éléments dans le
namespace d'un autre domaine. Des exceptions plateforme doivent être
explicites.

------------------------------------------------------------------------

## 7. Discovery et Resolution

Discovery permet de chercher par :

``` text
key
namespace
type
capability
provider
version
status
scope
```

Resolution sélectionne une entrée compatible avec une exigence.

Exemple :

``` text
Required: ui.component.datatable >= 1.1.0
Available: 1.0.0 / 1.2.0 / 1.3.0
Resolved: 1.3.0
```

Seulement si les règles réelles du projet autorisent cette résolution.

Pour les Packs publiés, privilégier une résolution déterministe :

``` text
Pack preparation → version range autorisée
Pack publication → version exacte verrouillée
Runtime          → version exacte reproductible
```

------------------------------------------------------------------------

## 8. Versioning et lifecycle

SemVer `MAJOR.MINOR.PATCH` est recommandé lorsque pertinent, sans
remplacer un mécanisme stable déjà existant.

États proposés :

``` text
REGISTERED
AVAILABLE
DEPRECATED
DISABLED
UNAVAILABLE
REMOVED
```

`REGISTERED` ne signifie pas `AVAILABLE`.

Une entrée dépréciée peut conserver :

``` text
replacementKey
deprecatedSince
removalTarget
message
```

Avant retrait, vérifier les références, Packs publiés, Runtime Contexts
actifs et dépendances.

------------------------------------------------------------------------

## 9. Availability et Scope

Distinguer métadonnée statique et disponibilité runtime.

``` text
integration.connector.dolibarr
Registered       YES
Configured       YES
Reachable        NO
Effective Status UNAVAILABLE
```

Scopes possibles :

``` text
GLOBAL
TENANT
APPLICATION
APPLICATION_VERSION
ENVIRONMENT
```

N'utiliser que ceux nécessaires.

Toute entrée tenant-scoped est strictement isolée. Les entrées globales
plateforme doivent être explicitement globales.

------------------------------------------------------------------------

## 10. Providers et Capabilities

Chaque entrée conserve son owner/provider, par exemple :

``` text
core
business-manager
ui-builder
automation
data-platform
integration-hub
pack-runtime
plugin
```

Exemple UI :

``` text
ui.component.datatable
capabilities:
binding
sorting
filtering
pagination
row-actions
```

Exemple Data :

``` text
data.provider.prisma
capabilities:
read
create
update
delete
transaction
aggregate
```

Ne pas fusionner arbitrairement Business Capability, Runtime Capability
et Connector Capability.

------------------------------------------------------------------------

## 11. Schema Registry et compatibilité

Le Registry peut référencer :

``` text
business.definition.v2
ui.definition.v1
automation.definition.v1
data.contract.v1
pack.manifest.v1
```

Exemple :

``` text
Runtime supports:
business.definition.v2
ui.definition.v1
automation.definition.v1
```

Si un Pack exige `ui.definition.v2` non supporté :

``` text
SCHEMA_VERSION_UNSUPPORTED
```

Le Compatibility Engine peut vérifier :

``` text
key
version
schema version
required capabilities
provider
status
environment
```

Il ne doit pas dupliquer le Dependency Resolver complet du Pack Manager.

------------------------------------------------------------------------

## 12. Intégrations inter-modules

### Business Manager

Expose Features, Capabilities, Business Events et versions de contrats.

### UI Builder

Expose Component Registry, Action Registry, Template Registry et
bindings supportés. L'éditeur ne propose que les éléments réellement
supportés.

### Automation

Expose Node Registry, Trigger Registry, Action Registry et Transform
Registry. Le Workflow Builder et l'IA ne génèrent que des types
enregistrés.

### Data Platform / Runtime

Expose Provider Registry, Repository Registry, Data Contract Registry et
Data Capabilities.

### Integration Hub

Expose Connector Registry, Integration Contract Registry et Connector
Capabilities.

### Pack Manager

Consomme les registries pour vérifier modules, features, capabilities,
UI components, Automation nodes/actions, Data providers, connectors et
Runtime capabilities, puis verrouille les références publiées.

### Pack Runtime

Résout le Manifest publié, vérifie compatibilité et disponibilité puis
construit le Runtime Context. Aucune version incompatible ne doit être
sélectionnée silencieusement.

------------------------------------------------------------------------

## 13. Environment & Deployment

Le Registry doit pouvoir répondre, lorsque nécessaire :

``` text
Is capability X available in DEV?
Is capability X available in STAGING?
Is capability X available in PRODUCTION?
```

Cette information sera consommée par Environment & Deployment Manager.

------------------------------------------------------------------------

## 14. Cache et synchronisation

Caches possibles :

``` text
registry entry
capability lookup
schema support
compatibility metadata
```

Clés tenant/environment-aware lorsque nécessaire.

Invalidation lors de registration, metadata update, enable/disable,
deprecation, deployment ou changement de disponibilité provider.

Si les registries sont distribués, l'agrégation peut utiliser :

``` text
startup registration
event-driven registration
API discovery
configuration loading
```

Choisir la solution la plus simple compatible avec l'existant.

------------------------------------------------------------------------

## 15. Doublons et collisions

Détecter :

``` text
same namespace
same key
same version
different owner/provider
```

Erreur possible :

``` text
REGISTRY_DUPLICATE_KEY
```

Une clé stable ne peut pas être remplacée silencieusement. Toute
politique d'override/plugin doit être explicite.

------------------------------------------------------------------------

## 16. Diagnostics

Cockpit conceptuel :

``` text
Registry Platform

Entries              148
Available            142
Deprecated             4
Unavailable            2
Conflicts              0

Business             Healthy
UI                   Healthy
Automation           Healthy
Data                 Healthy
Integration          Degraded
Runtime              Healthy
```

Uniquement avec des données réelles.

Détail d'entrée :

``` text
integration.connector.dolibarr
Owner                integration-hub
Version              2.0.0
Registry Status      AVAILABLE
Runtime Availability DEGRADED
Capabilities         customer.read / invoice.create
Used by              published pack versions
```

Resolution Diagnostics affiche requirement, candidats, version
sélectionnée, candidats rejetés, raisons et résultat de compatibilité.

------------------------------------------------------------------------

## 17. Erreurs structurées

Codes possibles :

``` text
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
REGISTRY_COMPATIBILITY_FAILED
```

Chaque erreur importante doit être traçable par `traceId`.

------------------------------------------------------------------------

## 18. API indicative

Préfixe conceptuel :

``` text
/api/registry
```

Lecture/résolution :

``` http
GET  /entries
GET  /entries/:namespace/:key
GET  /entries/:namespace/:key/versions
GET  /capabilities
GET  /providers
POST /resolve
POST /compatibility/check
GET  /diagnostics
```

Gestion contrôlée :

``` http
POST  /entries
PATCH /entries/:id
POST  /entries/:id/deprecate
POST  /entries/:id/disable
```

Privilégier l'enregistrement interne contrôlé à une API publique
générique.

------------------------------------------------------------------------

## 19. Sécurité, IAM et audit

Pipeline :

``` text
Authentication
→ Tenant Context
→ Authorization
→ Namespace Ownership
→ DTO Validation
→ Registry Validation
→ Persistence / Resolution
→ Audit
```

Permissions indicatives :

``` text
registry.read
registry.resolve
registry.diagnostics.read
registry.manage
registry.deprecate
registry.disable
```

Réutiliser IAM existant.

Auditer notamment :

``` text
ENTRY_REGISTERED
ENTRY_UPDATED
ENTRY_DEPRECATED
ENTRY_DISABLED
ENTRY_DEREGISTERED
REGISTRY_CONFLICT_DETECTED
```

------------------------------------------------------------------------

## 20. Observability

Contexte :

``` text
requestId
traceId
tenantId
applicationId
environment
namespace
key
version
provider
operation
duration
status
errorCode
```

Métriques si infrastructure disponible :

``` text
registry_entries_total
registry_resolution_total
registry_resolution_errors
registry_compatibility_failures
registry_conflicts_total
registry_cache_hit_ratio
registry_unavailable_entries
```

------------------------------------------------------------------------

## 21. Interface Registry

Navigation technique :

``` text
PLATEFORME
└── Registry
    ├── Vue d'ensemble
    ├── Entrées
    ├── Capacités
    ├── Providers
    ├── Compatibilité
    └── Diagnostics
```

Colonnes Entries :

``` text
Key
Namespace
Version
Owner
Provider
Scope
Status
```

Détail :

``` text
Overview
Versions
Capabilities
Compatibility
References
Diagnostics
```

Design : canvas slate clair, surfaces blanches, bleu Techzone, bordures
fines, radius 10--12 px, ombres légères et densité professionnelle.

États : Loading, Loaded, Empty, Error, Unauthorized, Forbidden,
Available, Deprecated, Disabled, Unavailable, Conflict, Resolving,
Compatible, Incompatible.

------------------------------------------------------------------------

## 22. Performance et résilience

Prévoir :

``` text
indexed stable keys
pagination
server-side filtering
cache
batch resolution
lazy diagnostics
efficient compatibility checks
```

Pack Manager et Runtime peuvent résoudre plusieurs références en une
opération.

Si Registry devient momentanément indisponible, un Runtime Context déjà
activé peut continuer avec son snapshot validé si l'architecture le
permet. Un nouveau contexte ne doit jamais inventer une résolution.

------------------------------------------------------------------------

## 23. Snapshots

Publication/activation peut figer :

``` text
key
resolvedVersion
provider
capabilities
schema
```

Pack Manager et Pack Runtime restent propriétaires de leurs snapshots
respectifs.

------------------------------------------------------------------------

## 24. AI Assistant

L'IA peut expliquer une incompatibilité, rechercher une capability,
proposer le remplacement d'une entrée dépréciée ou expliquer pourquoi un
Pack ne peut pas être publié.

Elle ne doit jamais enregistrer silencieusement une capability, modifier
une version publiée, inventer un provider ou forcer une compatibilité.

------------------------------------------------------------------------

## 25. Règles de gestion

-   **RG-REG-001** --- Toute entrée possède une clé stable.
-   **RG-REG-002** --- Une clé stable ne dépend pas du label UI.
-   **RG-REG-003** --- Chaque entrée possède un owner identifiable.
-   **RG-REG-004** --- Registry ne devient pas propriétaire des
    définitions des modules.
-   **RG-REG-005** --- Une entrée tenant-scoped est isolée par tenant.
-   **RG-REG-006** --- Les entrées globales sont explicitement globales.
-   **RG-REG-007** --- Un namespace est modifiable uniquement par une
    autorité autorisée.
-   **RG-REG-008** --- Une duplicate key/version conflictuelle est
    rejetée.
-   **RG-REG-009** --- Une capability annoncée existe réellement.
-   **RG-REG-010** --- REGISTERED ne signifie pas automatiquement
    AVAILABLE.
-   **RG-REG-011** --- La disponibilité runtime peut dépendre de
    l'environnement.
-   **RG-REG-012** --- Une résolution publiée est déterministe.
-   **RG-REG-013** --- Une version publiée n'est pas remplacée
    silencieusement.
-   **RG-REG-014** --- Une entrée dépréciée reste identifiable tant que
    nécessaire.
-   **RG-REG-015** --- Le retrait vérifie les références existantes.
-   **RG-REG-016** --- Pack Manager consomme les registries officiels.
-   **RG-REG-017** --- Pack Runtime ne résout pas silencieusement une
    version incompatible.
-   **RG-REG-018** --- UI Builder ne propose que les composants/actions
    supportés.
-   **RG-REG-019** --- Automation ne propose que les
    nodes/triggers/actions enregistrés.
-   **RG-REG-020** --- Data Runtime utilise les providers/contracts
    officiels.
-   **RG-REG-021** --- Integration Hub expose ses
    connecteurs/capabilities.
-   **RG-REG-022** --- Les schémas incompatibles sont explicitement
    rejetés.
-   **RG-REG-023** --- Le frontend n'est jamais l'autorité du Registry.
-   **RG-REG-024** --- IAM protège les opérations de gestion.
-   **RG-REG-025** --- Les changements significatifs sont auditables.
-   **RG-REG-026** --- Les erreurs de résolution sont structurées.
-   **RG-REG-027** --- Les diagnostics n'inventent aucun statut.
-   **RG-REG-028** --- Les clés cache respectent tenant/environnement si
    nécessaire.
-   **RG-REG-029** --- Les snapshots actifs restent reproductibles.
-   **RG-REG-030** --- Aucun mock silencieux en mode REAL.

------------------------------------------------------------------------

## 26. Modèle conceptuel et Prisma

Concepts possibles :

``` text
RegistryEntry
RegistryVersion
RegistryCapability
RegistryProvider
RegistrySchema
RegistryCompatibility
RegistryAvailability
RegistryDiagnostic
```

Ne pas créer automatiquement toutes ces tables. Certaines données
peuvent être code registry, configuration, metadata dérivée, runtime
state ou cache.

Avant migration, rechercher dans `schema.prisma` et le dépôt : Registry,
Feature Registry, Capability Registry, Component Registry, Automation
Node Registry, Provider Registry, Connector Registry et Runtime
Capability Registry.

Respecter tenantId, UUID conventions, FK, indexes, uniques, timestamps
et audit.

------------------------------------------------------------------------

## 27. Tests

Unitaires :

``` text
Stable Key Validation
Namespace Validation
Registration
Duplicate Detection
Version Resolver
Capability Resolver
Schema Compatibility
Provider Resolution
Scope Resolver
Availability Resolver
Deprecation
Cache Key Builder
```

Intégration :

``` text
Business Manager → Registry
UI Builder → Registry
Automation → Registry
Data Platform → Registry
Integration Hub → Registry
Pack Manager → Registry
Pack Runtime → Registry
```

Sécurité :

``` text
Cross-tenant discovery/resolve/update
Unauthorized registration/deprecation/disable
Namespace takeover
Duplicate provider injection
Invalid schema reference
Malicious metadata
```

Compatibilité :

``` text
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

------------------------------------------------------------------------

## 28. E2E de référence

``` text
LOGIN
  ↓
BUSINESS MANAGER
Feature / Capability / Event
  ↓
REGISTRY
  ↓
UI BUILDER registers Components
  ↓
AUTOMATION registers Nodes / Actions
  ↓
DATA PLATFORM registers Providers
  ↓
INTEGRATION HUB registers Dolibarr
  ↓
PACK MANAGER resolves requirements
  ↓
VALIDATION
  ↓
MANIFEST locks exact references
  ↓
PUBLICATION
  ↓
PACK RUNTIME
  ↓
REGISTRY COMPATIBILITY
  ↓
RUNTIME CONTEXT
  ↓
APPLICATION ACTIVE
```

------------------------------------------------------------------------

## 29. Gap Matrix obligatoire

  Domaine                       Existant    Backend   Frontend   Tests   Décision
  ----------------------------- ----------- --------- ---------- ------- ----------
  Registry Core                 À auditer   ---       ---        ---     AUDIT
  Stable Keys                   À auditer   ---       ---        ---     AUDIT
  Namespaces                    À auditer   ---       ---        ---     AUDIT
  Business Registry             À auditer   ---       ---        ---     AUDIT
  UI Component Registry         À auditer   ---       ---        ---     AUDIT
  Automation Registry           À auditer   ---       ---        ---     AUDIT
  Data Provider Registry        À auditer   ---       ---        ---     AUDIT
  Connector Registry            À auditer   ---       ---        ---     AUDIT
  Runtime Capability Registry   À auditer   ---       ---        ---     AUDIT
  Version Resolution            À auditer   ---       ---        ---     AUDIT
  Compatibility                 À auditer   ---       ---        ---     AUDIT
  Availability                  À auditer   ---       ---        ---     AUDIT
  Cache                         À auditer   ---       ---        ---     AUDIT
  Diagnostics                   À auditer   ---       ---        ---     AUDIT

Ne jamais conclure `MISSING` avant recherche réelle.

------------------------------------------------------------------------

## 30. Instructions Codex / Freebuff

``` text
1. main est canonique.
2. Lire tous les CDC Registry existants.
3. Rechercher Registry/registries dans tout le dépôt.
4. Rechercher Feature/Capability Registry.
5. Rechercher UI Component Registry.
6. Rechercher Automation Node/Action Registry.
7. Rechercher Data Provider/Repository Registry.
8. Rechercher Connector Registry.
9. Rechercher Runtime Capability Registry.
10. Rechercher schema/version compatibility.
11. Examiner Business Manager, UI Builder, Automation,
    Data Platform/Data Runtime, Pack Manager, Pack Runtime,
    ERP Adapter/Integration Hub.
12. Examiner IAM, Tenant Context, schema.prisma, cache,
    audit, observability et tests.
13. Produire la Gap Matrix.
14. Seulement ensuite coder.
```

Pour tout code historique :

``` text
READ → UNDERSTAND → COMPARE → EXTRACT → ADAPT → TEST
```

Aucun merge aveugle.

------------------------------------------------------------------------

## 31. MVP recommandé

``` text
1. Audit
2. Gap Matrix
3. Registry Core
4. Stable Keys
5. Namespace Rules
6. Registration
7. Discovery
8. Version Metadata
9. Capability Metadata
10. Provider Metadata
11. Business Registry Integration
12. UI Registry Integration
13. Automation Registry Integration
14. Data Registry Integration
15. Integration Registry
16. Runtime Registry
17. Resolution
18. Compatibility
19. Availability
20. Pack Manager Integration
21. Pack Runtime Integration
22. Cache
23. Diagnostics
24. IAM / Tenant Isolation
25. Audit / Observability
26. Security Tests
27. E2E
```

Phase 2 : Advanced Schema Registry, dependency graph, Registry Diff,
migration assistant, plugins/extensions, compatibility matrix,
environment-aware availability, AI Diagnostics.

Phase 3 : Distributed Registry, Registry Federation, Marketplace
Registry, signed metadata, supply-chain verification, Partner Registry
et cross-platform capability discovery.

------------------------------------------------------------------------

## 32. Définition de DONE

``` text
✓ Registry Core fonctionnel
✓ Stable Keys appliquées
✓ Namespaces contrôlés
✓ Registration / Discovery / Resolution fonctionnelles
✓ Version / Capability / Provider metadata fonctionnelles
✓ Schema compatibility fonctionnelle si retenue

✓ Business Registry intégré
✓ UI Registry intégré
✓ Automation Registry intégré
✓ Data Registry intégré
✓ Integration Registry intégré
✓ Runtime Registry intégré

✓ Pack Manager consomme Registry
✓ Pack Runtime consomme Registry

✓ Tenant Isolation vérifiée
✓ IAM vérifié
✓ Duplicate detection fonctionnelle
✓ Deprecation fonctionnelle
✓ Compatibility checks fonctionnels

✓ Cache tenant-safe si nécessaire
✓ Diagnostics réels
✓ Audit et Observability fonctionnels

✓ Aucun faux statut AVAILABLE
✓ Aucun mock silencieux en REAL mode

✓ Prisma validate PASS
✓ Prisma generate PASS
✓ Backend build PASS
✓ Frontend build PASS
✓ Tests Registry / Compatibility / Tenant / Security PASS
✓ E2E PASS
```

------------------------------------------------------------------------

## 33. Architecture cible consolidée

``` text
                         REGISTRY PLATFORM
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
 BUSINESS MANAGER          UI BUILDER             AUTOMATION
 Features                  Components             Nodes
 Capabilities              Actions                Triggers
 Events                    Templates              Actions
         │                      │                      │
         └──────────┬───────────┼───────────┬──────────┘
                    ▼                       ▼
              DATA PLATFORM          INTEGRATION HUB
              Providers              Connectors
              Contracts              Capabilities
              Repositories           Contracts
                    │                       │
                    └──────────┬────────────┘
                               ▼
                         PACK MANAGER
                               │
                  Validation • Resolution
                         Manifest
                               │
                               ▼
                         PACK RUNTIME
                               │
                 Runtime Registry • Compatibility
                         Runtime Context
                               │
                               ▼
                      APPLICATION ACTIVE
```

------------------------------------------------------------------------

# FIN DU CAHIER DES CHARGES

**Techzone Cloud --- Registry Platform v2.0**\
**Consolidation et extension de l'existant**
