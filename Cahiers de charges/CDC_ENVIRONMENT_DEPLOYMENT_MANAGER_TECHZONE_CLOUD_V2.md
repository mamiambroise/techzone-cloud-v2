# CAHIER DES CHARGES --- TECHZONE CLOUD ENVIRONMENT & DEPLOYMENT MANAGER

**Version :** 2.0 --- Consolidation et extension\
**Date :** Septembre 2026\
**Projet :** Techzone Cloud\
**Module :** Environment & Deployment Manager\
**Statut :** Spécification fonctionnelle et technique consolidée\
**Principe :** continuité de l'existant --- déployer uniquement des
Packs publiés et validés, sans dupliquer Pack Manager ni Pack Runtime.

------------------------------------------------------------------------

## 1. Objet et vision

Environment & Deployment Manager constitue la couche de gestion des
**environnements** et d'**orchestration des déploiements** de Techzone
Cloud.

-   **Environment Manager** répond à : « Où une application peut-elle
    être exécutée ? »
-   **Deployment Manager** répond à : « Quelle version publiée est
    déployée dans quel environnement, quand, par qui et avec quel
    résultat ? »

``` text
BUSINESS MANAGER
      ↓
UI BUILDER
      ↓
AUTOMATION
      ↓
PACK MANAGER
Composition • Validation • Manifest • Publication
      ↓
ENVIRONMENT & DEPLOYMENT MANAGER
Environnements • Releases • Déploiements • Rollback
      ↓
PACK RUNTIME
Load • Validate • Resolve • Activate • Execute
      ↓
OBSERVABILITY
Health • Logs • Metrics • Diagnostics
```

Règle de continuité :

``` text
EXISTANT + FONCTIONNEL   → KEEP
EXISTANT + UI/UX FAIBLE  → IMPROVE
PARTIEL                  → COMPLETE
ANCIEN MAIS RÉUTILISABLE → ADAPT
RÉELLEMENT ABSENT        → IMPLEMENT
```

Aucune fonctionnalité fonctionnelle ne doit être réécrite sans audit
préalable.

## 2. Frontières de responsabilité

**Pack Manager** possède Pack, Pack Version, composition, modules,
features, capabilities, dépendances, règles, validation, Manifest,
publication et historique de publication.

**Environment Manager** possède Environment, état, Runtime cible,
capacités disponibles, configuration de déploiement, références de
secrets, politiques et restrictions.

**Deployment Manager** possède Deployment, Deployment Attempt,
pré-vérifications, orchestration, activation demandée au Runtime, retry,
rollback, historique et diagnostics de déploiement.

**Pack Runtime** possède chargement du Pack publié, validation Runtime,
résolution, Runtime Context, configuration effective, cache,
activation/désactivation, health/readiness et exécution.

**Observability** possède les mécanismes transversaux de logs,
métriques, traces et supervision. Deployment Manager les consomme sans
les dupliquer.

## 3. Architecture fonctionnelle et navigation

``` text
Environment & Deployment Manager
├── Vue d’ensemble
├── Environnements
├── Déploiements
├── Releases
├── Historique
├── Rollbacks
└── Diagnostics
```

Dans la Sidebar globale :

``` text
PLATEFORME
├── Registry
├── Environnements
├── Déploiements
├── Sécurité & IAM
├── Observabilité
├── Abonnements
└── Administration
```

Releases, Rollbacks et Historique peuvent rester dans les workspaces
afin d'éviter une Sidebar trop profonde. Runtime reste uniquement sous
`EXÉCUTION → Runtime`.

## 4. Contexte

``` text
Tenant
→ Application
→ Environment
→ Published Pack Version
→ Deployment
→ Runtime Context
```

Toutes les ressources et opérations sont tenant-scoped. Aucun
identifiant fourni par le frontend ne suffit à autoriser l'accès à une
ressource.

## 5. Environment

Modèle conceptuel :

``` text
id
tenantId
applicationId?
key
name
description
type
status
runtimeTarget
region?
capabilities
configurationRef
secretRef
deploymentPolicy
metadata
createdBy
createdAt
updatedAt
```

Les champs exacts doivent être adaptés au schéma existant.

Types potentiels : `DEVELOPMENT`, `TEST`, `STAGING`, `PRODUCTION`,
`CUSTOM`. Ce sont des classifications possibles, pas des environnements
à créer automatiquement.

États conceptuels : `UNCONFIGURED`, `CONFIGURED`, `CHECKING`, `READY`,
`DEGRADED`, `UNAVAILABLE`, `DISABLED`, `ERROR`.

`CONFIGURED` ne signifie pas `READY`. `READY` doit provenir d'une
vérification réelle.

## 6. Capacités et configuration

Un Environment peut exposer des capacités telles que :

``` text
runtime.pack.v2
runtime.ui-definition.v1
runtime.automation.v1
data.provider.prisma
integration.connector.dolibarr
storage
scheduler
webhook
email
```

Les clés doivent rester cohérentes avec Registry Platform.
`REGISTERED ≠ AVAILABLE`.

Configuration possible : Runtime target, Data Source references,
Integration connector references, overrides autorisés, policies,
deployment strategy, timeouts, retry policy et maintenance state.

Les valeurs sensibles utilisent `secretRef`, `credentialRef` ou
`configurationRef`. Aucun secret en clair ne doit atteindre le frontend,
les logs, l'audit ou les diagnostics.

Résolution conceptuelle :

``` text
Platform Defaults
→ Tenant Configuration
→ Application Configuration
→ Pack Configuration
→ Environment Overrides
→ Effective Runtime Configuration
```

Le Runtime reste propriétaire de la résolution effective.

## 7. Environment Policies

Une politique peut définir :

-   qui peut déployer ;
-   quels Packs sont admissibles ;
-   validation obligatoire ;
-   environnement protégé ;
-   confirmation renforcée ;
-   fenêtres de déploiement ;
-   rollback autorisé ;
-   rétention des versions ;
-   restrictions de connecteurs ;
-   version Runtime minimale.

Exemple :

``` json
{
  "requirePublishedPack": true,
  "requireValidManifest": true,
  "requireRuntimeCompatibility": true,
  "allowRollback": true
}
```

Ne pas inventer de workflow d'approbation s'il n'existe pas dans la
plateforme.

## 8. Pack déployable et Release

Seule une version publiée et conforme peut être déployée :

``` text
Pack Version = PUBLISHED
Manifest = VALID
Required Definitions = AVAILABLE
```

Les Business/UI/Automation Definitions et les exigences
Data/Integration/Runtime doivent être cohérentes.

Une Release est conceptuellement une combinaison immuable :

``` text
Pack
Pack Version
Manifest Version
Business Definition Ref
UI Definition Ref
Automation Definition Ref
Configuration Snapshot Ref
Compatibility Metadata
```

Si Pack Manager possède déjà cet équivalent, ne pas créer un modèle
concurrent : le Deployment référence le snapshot publié existant.

## 9. Deployment

Modèle conceptuel :

``` text
id
tenantId
applicationId
environmentId
packId
packVersionId
publicationId?
manifestRef
status
strategy
requestedBy
startedAt
completedAt
previousDeploymentId?
runtimeContextId?
errorCode?
errorMessage?
metadata
createdAt
updatedAt
```

États conceptuels :

``` text
DRAFT
QUEUED
PREPARING
VALIDATING
READY
DEPLOYING
ACTIVATING
VERIFYING
SUCCEEDED
FAILED
CANCELLED
ROLLING_BACK
ROLLED_BACK
```

Auditer le lifecycle existant avant d'ajouter des états.

## 10. Pipeline de déploiement

``` text
REQUEST DEPLOYMENT
→ AUTHENTICATION
→ TENANT CONTEXT
→ AUTHORIZATION
→ ENVIRONMENT RESOLUTION
→ PACK PUBLICATION CHECK
→ MANIFEST VALIDATION
→ COMPATIBILITY CHECK
→ DEPENDENCY / CAPABILITY CHECK
→ CONFIGURATION CHECK
→ DATA / CONNECTOR REQUIREMENT CHECK
→ CREATE DEPLOYMENT RECORD
→ RUNTIME LOAD
→ RUNTIME RESOLVE
→ ACTIVATE
→ READINESS / HEALTH CHECK
→ MARK SUCCEEDED
```

Chaque étape doit produire un résultat réel et, en cas d'échec, une
erreur structurée.

## 11. Pre-Deployment Checks

Vérifier au minimum : Tenant, Environment, autorisation, Pack,
publication, Manifest, schemaVersion, compatibilité Runtime,
dépendances, capabilities, Data requirements, Integration requirements,
configuration/secrets et règles bloquantes.

Résultat :

``` text
PASS
WARNING
ERROR
```

`ERROR` bloque. `WARNING` suit la politique applicable.

## 12. Compatibility

Comparer :

``` text
Pack Requirements
vs
Environment Capabilities
vs
Runtime Capabilities
vs
Registry Availability
```

Une capability simplement déclarée dans le code ne suffit pas : sa
disponibilité réelle doit être vérifiée.

## 13. Deployment Strategy

Le MVP peut commencer par `STANDARD`.

`ROLLING`, `BLUE_GREEN` et `CANARY` ne doivent être annoncés que
lorsqu'ils sont réellement implémentés. Ne jamais simuler une stratégie
par un simple changement de statut.

## 14. Runtime Bridge et activation

Frontière :

``` text
Deployment Manager
→ Runtime Deployment Contract
→ Pack Runtime
```

Opérations conceptuelles : `prepareDeployment`, `validateDeployment`,
`activatePack`, `getActivationStatus`, `deactivatePack`, `rollbackTo`.
Adapter aux services existants.

Un Deployment n'est `SUCCEEDED` qu'après activation et readiness réelles
:

``` text
DEPLOY → LOAD → RESOLVE → ACTIVATE → READINESS → SUCCESS
```

## 15. Active Deployment et historique

Le système doit déterminer réellement : Active Deployment, Active Pack,
Active Pack Version, Activation Time, Runtime Context et Deployment
Status.

Historique exemple :

``` text
Deployment #42 → Pack 1.4.0 → SUCCEEDED
Deployment #41 → Pack 1.3.2 → SUCCEEDED
Deployment #40 → Pack 1.3.1 → FAILED
Deployment #39 → Pack 1.3.0 → ROLLED_BACK
```

Conserver version, statut, acteur, date, durée, stratégie, version
précédente, résultat Runtime, erreurs et avertissements.

## 16. Retry, Rollback, concurrence et idempotence

Un Retry conserve l'échec précédent et crée une tentative traçable.

Rollback :

``` text
CURRENT DEPLOYMENT
→ SELECT PREVIOUS VALID RELEASE
→ CHECK COMPATIBILITY
→ CHECK POLICY
→ CREATE ROLLBACK DEPLOYMENT
→ RUNTIME ACTIVATE PREVIOUS RELEASE
→ READINESS
→ ROLLED_BACK
```

Le rollback ne modifie jamais une Pack Version historique.

Empêcher ou sérialiser les déploiements concurrents incompatibles sur la
même cible pendant `DEPLOYING`, `ACTIVATING`, `VERIFYING` ou
`ROLLING_BACK`.

Les opérations critiques doivent être idempotentes lorsque nécessaire.
Une répétition réseau ne doit pas créer plusieurs activations
identiques.

L'annulation n'est autorisée que dans les états où elle est sûre.

## 17. Health, Readiness et diagnostics

Distinguer :

``` text
Environment Health
Runtime Process Health
Runtime Readiness
Deployment Verification
Application Context Health
```

Exemple :

``` text
Environment      READY
Runtime Process  HEALTHY
Runtime Context  ACTIVE
ERP Connector    DEGRADED
Deployment       SUCCEEDED
```

Aucun état ne doit être fictif.

Diagnostic structuré :

``` text
stage
code
severity
message
resource
timestamp
details
correlationId
```

Codes possibles : `ENVIRONMENT_NOT_READY`, `PACK_NOT_PUBLISHED`,
`MANIFEST_INVALID`, `RUNTIME_INCOMPATIBLE`, `DEPENDENCY_UNRESOLVED`,
`CAPABILITY_MISSING`, `CONFIGURATION_INVALID`, `SECRET_UNAVAILABLE`,
`CONNECTOR_UNAVAILABLE`, `DATA_PROVIDER_UNAVAILABLE`,
`RUNTIME_ACTIVATION_FAILED`, `READINESS_FAILED`, `DEPLOYMENT_TIMEOUT`,
`ROLLBACK_FAILED`.

## 18. Timeouts, audit et IAM

Aucune opération ne doit rester indéfiniment dans un état transitoire
sans mécanisme de récupération.

Auditer au minimum : création/modification/désactivation Environment,
Deployment demandé/commencé/réussi/échoué/annulé, retry et rollback.

Permissions conceptuelles, à adapter à l'IAM existant :

``` text
environment.read
environment.create
environment.update
environment.disable
deployment.read
deployment.create
deployment.execute
deployment.cancel
deployment.retry
deployment.rollback
deployment.diagnostics
```

Le backend reste l'autorité.

## 19. Multi-tenant et sécurité

Tenant A ne peut jamais lire, déployer, diagnostiquer ou rollback une
ressource de Tenant B, ni utiliser ses secrets, connecteurs ou Runtime
Context.

Aucun secret dans Environment, Deployment, Manifest frontend, logs,
audit ou diagnostics.

## 20. API conceptuelle

Adapter aux conventions existantes et ne pas dupliquer les APIs stables
:

``` http
GET    /api/environments
POST   /api/environments
GET    /api/environments/:id
PATCH  /api/environments/:id
GET    /api/environments/:id/status
POST   /api/environments/:id/check

GET    /api/deployments
POST   /api/deployments
GET    /api/deployments/:id
POST   /api/deployments/:id/execute
POST   /api/deployments/:id/cancel
POST   /api/deployments/:id/retry
POST   /api/deployments/:id/rollback
GET    /api/deployments/:id/diagnostics
GET    /api/environments/:id/deployments
```

## 21. UI --- Environments

Overview avec données réelles : nombre d'environnements,
Ready/Degraded/Unavailable, Active Deployments, déploiements et échecs
récents uniquement si disponibles.

Liste possible :

``` text
Environment | Type | Status | Applications | Active Pack | Runtime | Last Deployment | Updated | Actions
```

Workspace :

``` text
Production Madagascar
READY

Overview
Deployments
Configuration
Capabilities
Integrations
Runtime
Diagnostics
History
```

Les onglets restent locaux au workspace.

## 22. UI --- Deployment

Afficher Environment, Application, Pack, Pack Version, status,
requestedBy, dates/durée, stratégie, previous deployment, Runtime
activation, validation, warnings et errors.

Timeline :

``` text
Requested   ✓
Validation  ✓
Preparation ✓
Deployment  ✓
Activation  ✓
Readiness   ✓
Completed   ✓
```

La timeline reflète des étapes réelles.

Wizard recommandé :

``` text
1. Environment
2. Application
3. Published Pack Version
4. Compatibility
5. Configuration
6. Review
7. Deploy
```

Pour un environnement protégé, demander une confirmation claire sans
remplacer l'autorisation backend.

## 23. Intégrations plateforme

**Dashboard** agrège Environments, Deployments, failures, Runtime status
et last deployment, avec deep links.

**Sidebar** expose `PLATEFORME → Environnements` et
`PLATEFORME → Déploiements`. Runtime reste `EXÉCUTION → Runtime`.

**Pack Manager** fournit publication, Pack Version, Manifest et
requirements ; Deployment Manager ne les modifie pas.

**Pack Runtime** réalise load/validate/resolve/activate/verify et
retourne des résultats structurés.

**Registry** sert à vérifier capabilities, providers, connectors, schema
versions, compatibility et availability.

**Data** vérifie les Data Requirements via les contrats officiels sans
exécuter les queries métier dans Deployment Manager.

**Integration Hub / ERP** vérifie les Connector Requirements via
Integration Hub, jamais avec un client Dolibarr direct.

**Automation** ne reçoit aucun pouvoir implicite de déployer en
Production. Toute intégration future doit être explicite, enregistrée,
autorisée et soumise aux policies.

## 24. Events, notifications et observability

Événements conceptuels :

``` text
environment.created
environment.status.changed
deployment.requested
deployment.started
deployment.succeeded
deployment.failed
deployment.cancelled
deployment.rollback.started
deployment.rollback.succeeded
deployment.rollback.failed
```

Ils peuvent alimenter Audit, Observability, Notifications, Dashboard et
Automation si autorisé.

Notifications possibles : succès/échec Deployment, échec activation
Runtime, succès/échec rollback, Environment degraded. Réutiliser le
moteur transversal existant.

Correlation recommandée :

``` text
deploymentId
correlationId
tenantId
environmentId
applicationId
packVersionId
runtimeContextId
```

## 25. UI/UX

Direction : **Techzone Cloud SaaS B2B 2026**.

Fond slate clair, surfaces blanches, Techzone Blue, bordures fines,
radius 10--12 px, ombres discrètes, statuts lisibles, timeline compacte,
densité professionnelle, responsive et accessible.

États UI obligatoires : `LOADING`, `LOADED`, `EMPTY`, `ERROR`,
`FORBIDDEN`, `UNAVAILABLE`. Opérations : `CHECKING`, `VALIDATING`,
`DEPLOYING`, `ROLLING_BACK`.

Desktop : tables/workspace/timeline. Tablet : colonnes prioritaires et
drawers. Mobile : cards/listes et actions critiques sans overflow
incontrôlé.

Accessibilité : clavier, focus visible, aria, contraste, modales
accessibles et libellés textuels des statuts.

## 26. Performance et résilience

Éviter polling agressif, N+1 API, reload global et re-render massif.
Utiliser agrégation backend, cache contrôlé, polling raisonnable pendant
un Deployment actif, invalidation et pagination.

Une panne Observability n'est pas forcément bloquante. Une panne Runtime
bloque l'activation. Un connecteur optionnel peut produire WARNING ; une
capability obligatoire manquante produit ERROR.

## 27. Persistence

Modèles potentiels :

``` text
Environment
EnvironmentCapability
EnvironmentPolicy
Deployment
DeploymentAttempt
DeploymentEvent
DeploymentDiagnostic
```

Ne pas créer toutes ces tables automatiquement.

``` text
AUDIT
→ REUSE EXISTING MODELS
→ DETERMINE REQUIRED PERSISTENCE
→ MINIMAL SCHEMA CHANGE
```

Audit/Observability peuvent déjà couvrir Events/Diagnostics.

## 28. Business Rules

**RG-ENV-001** --- Tout Environment appartient à un Tenant.\
**RG-ENV-002** --- DEV/STAGING/PRODUCTION ne sont jamais créés
implicitement.\
**RG-ENV-003** --- READY provient d'une vérification réelle.\
**RG-ENV-004** --- Les secrets ne sont jamais exposés en clair.\
**RG-ENV-005** --- Les capabilities annoncées doivent être réellement
disponibles.\
**RG-ENV-006** --- Un Environment désactivé n'accepte aucun nouveau
Deployment.\
**RG-ENV-007** --- Les Environment Policies sont appliquées côté
backend.\
**RG-ENV-008** --- La Sidebar n'est pas une couche de sécurité.\
**RG-DEP-001** --- Seule une Pack Version publiée peut être déployée.\
**RG-DEP-002** --- Un Deployment référence une version exacte et
immuable.\
**RG-DEP-003** --- Deployment Manager ne modifie jamais le Manifest
publié.\
**RG-DEP-004** --- Toute opération respecte Tenant Context.\
**RG-DEP-005** --- Tout Deployment est autorisé par IAM.\
**RG-DEP-006** --- Les Pre-Deployment Checks précèdent l'activation.\
**RG-DEP-007** --- Une incompatibilité bloquante empêche le Deployment.\
**RG-DEP-008** --- `SUCCEEDED` exige une confirmation Runtime réelle.\
**RG-DEP-009** --- Un échec Runtime n'est jamais converti
silencieusement en succès.\
**RG-DEP-010** --- Retry conserve la traçabilité de l'échec précédent.\
**RG-DEP-011** --- Rollback crée une nouvelle opération traçable.\
**RG-DEP-012** --- Rollback ne modifie jamais une ancienne Pack
Version.\
**RG-DEP-013** --- Les déploiements concurrents incompatibles sont
empêchés ou sérialisés.\
**RG-DEP-014** --- Les opérations critiques sont idempotentes lorsque
nécessaire.\
**RG-DEP-015** --- Aucun statut Runtime n'est inventé par le frontend.\
**RG-DEP-016** --- Les diagnostics n'exposent jamais les secrets.\
**RG-DEP-017** --- Une capability enregistrée mais indisponible ne
satisfait pas une exigence.\
**RG-DEP-018** --- Les connecteurs sont vérifiés via Integration Hub.\
**RG-DEP-019** --- Les Data Requirements utilisent les contrats Data
officiels.\
**RG-DEP-020** --- Runtime reste propriétaire de l'activation et du
Runtime Context.\
**RG-DEP-021** --- Pack Manager reste propriétaire de la publication.\
**RG-DEP-022** --- Environment/Deployment Manager reste propriétaire de
l'orchestration.\
**RG-DEP-023** --- Dashboard ne possède pas les données Deployment.\
**RG-DEP-024** --- Observability reste propriétaire des
logs/métriques/traces transversaux.\
**RG-DEP-025** --- Toute transition importante produit Audit/Event
lorsque disponible.\
**RG-DEP-026** --- Les timeouts empêchent les Deployments bloqués
indéfiniment.\
**RG-DEP-027** --- Les environnements protégés appliquent leurs règles
côté backend.\
**RG-DEP-028** --- Les versions proposées doivent être réellement
déployables.\
**RG-DEP-029** --- Aucun historique/diagnostic cross-tenant n'est
visible.\
**RG-DEP-030** --- Aucun mock ou fallback silencieux en mode REAL.

## 29. Tests

Tests unitaires : Environment
CRUD/validation/status/capabilities/policies/tenant ; Deployment
creation, unpublished Pack, invalid Manifest, incompatible Runtime,
missing capability, transitions, success/failure, retry, rollback,
cancellation, concurrency et idempotence.

Tests d'intégration :

``` text
Pack Manager Publication → Deployment Manager
Deployment Manager → Registry
Deployment Manager → Data requirements
Deployment Manager → Integration requirements
Deployment Manager → Pack Runtime
Pack Runtime → Deployment verification
Deployment → Audit
Deployment → Dashboard
Deployment → Observability
```

Tests sécurité : anonymous, missing permission, wrong tenant, forged
IDs, rollback cross-tenant, secret exposure, diagnostics exposure,
protected Environment et replay.

## 30. E2E

``` text
LOGIN
→ TENANT
→ BUSINESS MANAGER
→ UI BUILDER
→ AUTOMATION
→ PACK MANAGER
→ VALIDATE
→ MANIFEST
→ PUBLISH
→ ENVIRONMENT
→ CREATE DEPLOYMENT
→ PRE-CHECK
→ DEPLOY
→ PACK RUNTIME
→ LOAD
→ RESOLVE
→ ACTIVATE
→ READINESS
→ SUCCEEDED
→ DASHBOARD / OBSERVABILITY
```

Tester aussi capability manquante et rollback vers une Release
antérieure compatible. Ne pas simuler une étape dont le module voisin
n'est pas réellement disponible.

## 31. Plan d'implémentation

**Phase 0 --- Audit :** rechercher Environment/Deployment existants,
APIs, Prisma, Runtime activation, Pack publication, Dashboard, Sidebar,
IAM et tests.

**Phase 1 --- Gap Matrix :**
`KEEP / IMPROVE / COMPLETE / ADAPT / IMPLEMENT`.

**Phase 2 --- Environment Core :** registry, status, configuration,
capabilities, policies, Tenant/IAM.

**Phase 3 --- Deployment Core :** model/service, lifecycle, history,
diagnostics.

**Phase 4 --- Pre-Deployment :** publication, Manifest, compatibility,
capabilities, Data/Integration requirements.

**Phase 5 --- Runtime Bridge :** load, resolve, activate, readiness,
structured results.

**Phase 6 --- Retry/Rollback :** retry, rollback, concurrency,
idempotency.

**Phase 7 --- UI :** Overview, lists/workspaces, wizard, timeline,
diagnostics.

**Phase 8 --- Platform Integration :** Sidebar, Dashboard, Registry,
Audit, Observability.

**Phase 9 --- Tests :** unit, integration, security, E2E et recette
navigateur.

## 32. Gap Matrix obligatoire

  Domaine       Exigence CDC                Existant   État   Décision   Tests
  ------------- --------------------------- ---------- ------ ---------- -------
  Environment   Registry                    ...        ...    KEEP/...   ...
  Environment   Status                      ...        ...    ...        ...
  Environment   Capabilities                ...        ...    ...        ...
  Deployment    Lifecycle                   ...        ...    ...        ...
  Deployment    Pre-check                   ...        ...    ...        ...
  Deployment    Runtime bridge              ...        ...    ...        ...
  Deployment    Retry/Rollback              ...        ...    ...        ...
  Integration   Pack Manager                ...        ...    ...        ...
  Integration   Runtime/Registry/Data/ERP   ...        ...    ...        ...
  Security      IAM/Tenant                  ...        ...    ...        ...
  Platform      Dashboard/Sidebar           ...        ...    ...        ...

Ne jamais déclarer `IMPLEMENT` avant recherche réelle.

## 33. Definition of Done

DONE uniquement si : CDC voisins respectés ; audit et Gap Matrix
réalisés ; Environment tenant-scoped ; IAM appliqué ; secrets protégés ;
environnements réels ; seuls les Packs publiés sont déployables ;
Manifest/compatibility/capabilities/Data/Integration requirements
vérifiés ; Runtime Bridge réel ; lifecycle et historique réels ;
`SUCCEEDED` confirmé par Runtime ; diagnostics structurés ;
retry/rollback traçables ; concurrence contrôlée ; idempotence traitée ;
Sidebar et Dashboard intégrés ; aucun faux Health/Environment/Deployment
; aucun mock silencieux ; UI avec états complets, responsive et
accessibilité ; Prisma/build/tests/E2E applicables validés.

## 34. Principe final

``` text
PACK MANAGER
Qu’est-ce qui est validé et publié ?
        ↓
ENVIRONMENT MANAGER
Où peut-il être exécuté ?
        ↓
DEPLOYMENT MANAGER
Quelle version est déployée où, quand et avec quel résultat ?
        ↓
PACK RUNTIME
Comment est-elle chargée, résolue, activée et exécutée ?
        ↓
OBSERVABILITY
Que se passe-t-il réellement pendant et après l’exécution ?
```

Règle de développement :

``` text
AUDIT
→ KEEP WHAT WORKS
→ FIX WHAT IS BROKEN
→ COMPLETE WHAT IS PARTIAL
→ IMPLEMENT WHAT IS REALLY MISSING
→ INTEGRATE
→ TEST
```
