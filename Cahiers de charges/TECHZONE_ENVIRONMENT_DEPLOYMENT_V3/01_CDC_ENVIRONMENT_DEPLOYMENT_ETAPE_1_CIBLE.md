# CAHIER DES CHARGES — TECHZONE CLOUD ENVIRONMENT & DEPLOYMENT MANAGER
## Étape 1 — Cible fonctionnelle et architecturale

**Projet :** Techzone Cloud  
**Module :** Environment & Deployment Manager  
**Version cible :** 3.0  
**Statut :** Spécification cible  
**Principe :** orchestrer des déploiements tenant-scoped de Packs publiés et validés vers des environnements réels, sans dupliquer Pack Manager, Pack Runtime, Data Runtime, Integration Hub ou Observability.

---

# 1. Objet

Environment & Deployment Manager répond à deux questions :

```text
ENVIRONMENT MANAGER
→ Où l’application peut-elle être exécutée ?

DEPLOYMENT MANAGER
→ Quelle version publiée est déployée, où, quand, par qui, avec quel résultat ?
```

---

# 2. Position dans Techzone Cloud

```text
BUSINESS MANAGER
      ↓
UI BUILDER
      ↓
AUTOMATION
      ↓
PACK MANAGER
Publication • Manifest • Snapshot
      ↓
ENVIRONMENT & DEPLOYMENT MANAGER
Environment • Release Reference • Deployment • Rollback
      ↓
PACK RUNTIME
Load • Validate • Resolve • Activate • Execute
      ↓
OBSERVABILITY
Health • Logs • Metrics • Diagnostics
```

---

# 3. Frontières de responsabilité

## Pack Manager possède

- Pack ;
- Pack Version ;
- composition ;
- validation ;
- Manifest ;
- publication ;
- snapshot publié ;
- historique de publication.

## Environment Manager possède

- Environment ;
- status ;
- runtime target ;
- configuration de déploiement ;
- policies ;
- capabilities disponibles ;
- refs de secrets/config ;
- restrictions.

## Deployment Manager possède

- Deployment ;
- Deployment Attempt ;
- pré-check ;
- orchestration ;
- retry ;
- cancellation ;
- rollback ;
- historique ;
- diagnostics de déploiement.

## Pack Runtime possède

- load ;
- runtime validation ;
- resolution ;
- Runtime Context ;
- activation ;
- deactivation ;
- readiness ;
- execution.

## Observability possède

- logs ;
- metrics ;
- traces ;
- supervision transversale.

---

# 4. Principe de continuité

```text
KEEP       → existant et fonctionnel
IMPROVE    → fonctionnel mais améliorable
FIX        → présent mais incorrect ou dangereux
COMPLETE   → partiel
ADAPT      → réutilisable
IMPLEMENT  → réellement absent
```

Aucune fonctionnalité saine ne doit être réécrite sans nécessité.

---

# 5. Navigation

Dans la Sidebar globale :

```text
PLATEFORME
├── Registry
├── Environnements
├── Déploiements
├── Sécurité & IAM
├── Observabilité
├── Abonnements
└── Administration
```

Workspaces :

```text
Environnements
├── Vue d’ensemble
├── Liste
└── Détail Environment

Déploiements
├── Vue d’ensemble
├── Déploiements
├── Releases
├── Historique
├── Rollbacks
└── Diagnostics
```

Runtime reste :

```text
EXÉCUTION
└── Runtime
```

---

# 6. Contexte obligatoire

```text
Tenant
→ Application
→ Environment
→ Published Pack Version
→ Deployment
→ Runtime Context
```

Toutes les ressources sont tenant-scoped.

Aucun identifiant fourni par le frontend ne suffit à autoriser l’accès.

---

# 7. Environment

Modèle conceptuel :

```text
Environment
├── id
├── tenantId
├── applicationId?
├── key
├── name
├── description
├── type
├── status
├── runtimeTarget
├── region?
├── capabilities
├── configurationRef
├── secretRef
├── deploymentPolicy
├── metadata
├── createdBy
├── createdAt
└── updatedAt
```

Types possibles :

```text
DEVELOPMENT
TEST
STAGING
PRODUCTION
CUSTOM
```

Ne pas créer automatiquement ces environnements.

---

# 8. Environment Lifecycle

États conceptuels :

```text
UNCONFIGURED
CONFIGURED
CHECKING
READY
DEGRADED
UNAVAILABLE
DISABLED
ERROR
```

Règle :

```text
CONFIGURED ≠ READY
```

`READY` provient d’une vérification réelle.

---

# 9. Environment Capabilities

Exemples :

```text
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

Règle :

```text
REGISTERED ≠ AVAILABLE
```

Une capability doit être vérifiée réellement.

---

# 10. Environment Configuration

Peut contenir :

- runtime target ;
- data source refs ;
- integration refs ;
- configuration refs ;
- secret refs ;
- deployment strategy ;
- timeout policy ;
- retry policy ;
- maintenance state ;
- overrides autorisés.

Aucun secret en clair dans frontend, logs, audit ou diagnostics.

---

# 11. Configuration Resolution

Ordre conceptuel :

```text
Platform Defaults
→ Tenant Configuration
→ Application Configuration
→ Pack Configuration
→ Environment Overrides
→ Effective Runtime Configuration
```

Le Runtime reste propriétaire de la configuration effective d’exécution.

---

# 12. Environment Policies

Une policy peut définir :

- qui peut déployer ;
- Packs admissibles ;
- publication obligatoire ;
- Manifest valide obligatoire ;
- compatibilité Runtime ;
- environnement protégé ;
- confirmation renforcée ;
- fenêtre de déploiement ;
- rollback autorisé ;
- restrictions connecteurs ;
- version Runtime minimale.

---

# 13. Release

Une Release est une référence immuable vers un artefact publié.

Concept :

```text
Release
├── Pack
├── PackVersion
├── Publication
├── ManifestVersion
├── BusinessDefinitionRef
├── UiDefinitionRef
├── AutomationDefinitionRef
├── ConfigurationSnapshotRef
└── CompatibilityMetadata
```

Si Pack Manager possède déjà cet objet, Deployment ne crée pas de modèle concurrent.

---

# 14. Pack déployable

Déployable uniquement si :

```text
PackVersion.status = PUBLISHED
AND
Manifest = VALID
AND
Required Definitions = AVAILABLE
AND
Environment = READY
AND
Authorization = ALLOW
```

---

# 15. Deployment

Modèle conceptuel :

```text
Deployment
├── id
├── tenantId
├── applicationId
├── environmentId
├── packId
├── packVersionId
├── publicationId?
├── manifestRef
├── status
├── strategy
├── requestedBy
├── startedAt
├── completedAt
├── previousDeploymentId?
├── runtimeContextId?
├── errorCode?
├── errorMessage?
├── metadata
├── createdAt
└── updatedAt
```

`requestedBy` doit provenir du principal IAM serveur.

---

# 16. Deployment Lifecycle

États conceptuels :

```text
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

Ne pas ajouter d’état si l’existant possède un lifecycle équivalent.

---

# 17. Pipeline de déploiement

```text
REQUEST DEPLOYMENT
↓
AUTHENTICATION
↓
TENANT CONTEXT
↓
AUTHORIZATION
↓
ENVIRONMENT RESOLUTION
↓
PACK PUBLICATION CHECK
↓
MANIFEST VALIDATION
↓
COMPATIBILITY CHECK
↓
DEPENDENCY / CAPABILITY CHECK
↓
CONFIGURATION CHECK
↓
DATA REQUIREMENTS CHECK
↓
INTEGRATION REQUIREMENTS CHECK
↓
CREATE DEPLOYMENT RECORD
↓
RUNTIME LOAD
↓
RUNTIME RESOLVE
↓
ACTIVATE
↓
READINESS CHECK
↓
MARK SUCCEEDED
```

Chaque étape produit un résultat réel.

---

# 18. Pre-Deployment Checks

Vérifier :

- Tenant ;
- Environment ;
- Permission ;
- Pack ;
- publication ;
- Manifest ;
- schema version ;
- Runtime compatibility ;
- dependencies ;
- capabilities ;
- Data requirements ;
- Integration requirements ;
- config/secrets ;
- policies.

Résultats :

```text
PASS
WARNING
ERROR
```

`ERROR` bloque.

---

# 19. Compatibility

Comparer :

```text
Pack Requirements
vs
Environment Capabilities
vs
Runtime Capabilities
vs
Registry Availability
```

Une capability déclarée mais indisponible ne satisfait pas la contrainte.

---

# 20. Deployment Strategy

MVP :

```text
STANDARD
```

Évolutions uniquement si réellement implémentées :

```text
ROLLING
BLUE_GREEN
CANARY
```

Ne jamais simuler une stratégie par simple changement de statut.

---

# 21. Runtime Bridge

Frontière :

```text
Deployment Manager
→ Runtime Deployment Contract
→ Pack Runtime
```

Opérations possibles :

```text
prepareDeployment
validateDeployment
activatePack
getActivationStatus
deactivatePack
rollbackTo
```

Adapter aux services existants.

---

# 22. Succès réel

Un Deployment n’est `SUCCEEDED` qu’après :

```text
DEPLOY
→ LOAD
→ RESOLVE
→ ACTIVATE
→ READINESS
→ SUCCESS
```

Le frontend ne peut jamais inventer ce statut.

---

# 23. Active Deployment

Le système doit connaître réellement :

- Active Deployment ;
- Active Pack ;
- Active Pack Version ;
- Activation Time ;
- Runtime Context ;
- Runtime Status.

---

# 24. Retry

Un Retry :

- conserve l’échec précédent ;
- crée une nouvelle tentative traçable ;
- utilise une clé/idempotency strategy si nécessaire ;
- ne masque pas l’erreur précédente.

---

# 25. Rollback

```text
CURRENT DEPLOYMENT
↓
SELECT PREVIOUS VALID RELEASE
↓
CHECK TENANT
↓
CHECK COMPATIBILITY
↓
CHECK POLICY
↓
CREATE ROLLBACK DEPLOYMENT
↓
RUNTIME ACTIVATE PREVIOUS RELEASE
↓
READINESS
↓
ROLLED_BACK
```

Le rollback ne modifie jamais une Pack Version historique.

---

# 26. Concurrence

Empêcher/sérialiser des Deployments incompatibles vers la même cible pendant :

```text
DEPLOYING
ACTIVATING
VERIFYING
ROLLING_BACK
```

---

# 27. Idempotence

Une répétition réseau ne doit pas créer :

- deux Deployments identiques ;
- deux activations ;
- deux rollbacks ;
- deux retries non désirés.

---

# 28. Timeouts

Aucune opération ne reste indéfiniment transitoire.

Prévoir :

- timeout ;
- failure state ;
- recovery ;
- retry policy ;
- diagnostics.

---

# 29. Health / Readiness

Distinguer :

```text
Environment Health
Runtime Process Health
Runtime Readiness
Deployment Verification
Application Context Health
```

Aucun health fictif.

---

# 30. Diagnostics

Contrat :

```text
stage
code
severity
message
resource
timestamp
details
correlationId
```

Codes possibles :

```text
ENVIRONMENT_NOT_READY
PACK_NOT_PUBLISHED
MANIFEST_INVALID
RUNTIME_INCOMPATIBLE
DEPENDENCY_UNRESOLVED
CAPABILITY_MISSING
CONFIGURATION_INVALID
SECRET_UNAVAILABLE
CONNECTOR_UNAVAILABLE
DATA_PROVIDER_UNAVAILABLE
RUNTIME_ACTIVATION_FAILED
READINESS_FAILED
DEPLOYMENT_TIMEOUT
ROLLBACK_FAILED
```

---

# 31. IAM / Permissions

Permissions conceptuelles :

```text
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

Adapter au Permission Registry réel.

Backend = autorité.

---

# 32. Multi-Tenant

Tenant A ne peut jamais :

- lire Environment B ;
- lister Deployments B ;
- exécuter Deployment B ;
- rollback B ;
- diagnostiquer B ;
- utiliser secrets B ;
- utiliser connectors B ;
- utiliser Runtime Context B.

---

# 33. Audit Fields

Sont server-controlled :

```text
createdBy
requestedBy
approvedBy
bypassedBy
executedBy
rolledBackBy
```

Ils viennent du principal IAM ou d’une service identity autorisée.

Jamais du body frontend.

---

# 34. API conceptuelle

```http
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

Adapter aux routes existantes.

---

# 35. Intégration Pack Manager

Pack Manager fournit :

- publication ;
- Pack Version ;
- Manifest ;
- snapshots ;
- requirements.

Deployment ne les modifie pas.

---

# 36. Intégration Pack Runtime

Pack Runtime reçoit une demande contrôlée et retourne :

- load result ;
- resolve result ;
- activation result ;
- readiness ;
- Runtime Context ;
- errors.

---

# 37. Data Requirements

Deployment vérifie les contrats Data requis.

Il ne doit pas exécuter lui-même les queries métier.

---

# 38. Integration Requirements

Les connecteurs sont vérifiés via Integration Hub.

Aucun client Dolibarr direct dans Deployment Manager.

---

# 39. Registry

Registry permet de vérifier :

- capabilities ;
- provider availability ;
- schemas ;
- versions ;
- compatibility.

---

# 40. Observability

Deployment consomme :

- logs ;
- metrics ;
- traces ;
- correlation IDs.

Il ne recrée pas un système parallèle.

---

# 41. UI Environments

Vue liste :

```text
Environment
Type
Status
Applications
Active Pack
Runtime
Last Deployment
Updated
Actions
```

Workspace :

```text
Overview
Deployments
Configuration
Capabilities
Integrations
Runtime
Diagnostics
History
```

---

# 42. UI Deployment

Afficher :

- Environment ;
- Application ;
- Pack ;
- Pack Version ;
- status ;
- requestedBy ;
- dates ;
- duration ;
- strategy ;
- previous deployment ;
- runtime activation ;
- validation ;
- warnings ;
- errors.

---

# 43. Timeline

```text
Requested
Validation
Preparation
Deployment
Activation
Readiness
Completed
```

Étapes réelles uniquement.

---

# 44. Wizard

```text
1 Environment
2 Application
3 Published Pack Version
4 Compatibility
5 Configuration
6 Review
7 Deploy
```

---

# 45. Protected Environment

Pour production/protected :

- permission renforcée ;
- confirmation ;
- policies backend ;
- éventuellement fenêtre de déploiement ;
- Audit.

Une confirmation UI ne remplace pas IAM.

---

# 46. Tests obligatoires

Unit :
- Environment CRUD ;
- status ;
- policies ;
- lifecycle ;
- pre-check ;
- retry ;
- rollback ;
- concurrency ;
- idempotence.

Integration :
- Pack publication → Deployment ;
- Deployment → Runtime ;
- Registry ;
- Data Requirements ;
- Integration Requirements ;
- Audit ;
- Observability.

Security :
- anonymous ;
- missing permission ;
- wrong tenant ;
- forged IDs ;
- cross-tenant rollback ;
- secret exposure ;
- diagnostics exposure ;
- replay.

---

# 47. E2E

```text
LOGIN
→ TENANT
→ BUSINESS MANAGER
→ UI BUILDER
→ AUTOMATION
→ PACK MANAGER
→ VALIDATE
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
```

---

# 48. Definition of Done

DONE uniquement si :

- tenant scope réel partout ;
- permissions backend ;
- audit fields server-controlled ;
- secrets protégés ;
- Environment réel ;
- Packs publiés uniquement ;
- Manifest vérifié ;
- compatibility vérifiée ;
- Runtime Bridge réel ;
- `SUCCEEDED` confirmé par Runtime ;
- retry/rollback traçables ;
- concurrence contrôlée ;
- idempotence ;
- diagnostics structurés ;
- tests cross-tenant verts ;
- aucun mock silencieux en REAL ;
- build/tests/E2E verts.
