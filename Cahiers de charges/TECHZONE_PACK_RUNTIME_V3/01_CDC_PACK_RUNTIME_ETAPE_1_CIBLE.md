# CAHIER DES CHARGES — TECHZONE CLOUD PACK RUNTIME
## Étape 1 — Cible fonctionnelle et architecturale

**Projet :** Techzone Cloud  
**Module :** Pack Runtime  
**Version cible :** 3.0  
**Statut :** Spécification cible  
**Principe :** Pack Runtime est la frontière d’exécution qui transforme une PackVersion publiée en Runtime Context exécutable, tenant-scoped, validé, résolu et activé.

---

# 1. Objet

Pack Runtime répond à :

```text
COMMENT UNE VERSION PUBLIÉE
EST-ELLE CHARGÉE, VALIDÉE, RÉSOLUE,
ACTIVÉE ET EXÉCUTÉE EN SÉCURITÉ ?
```

Il ne se contente pas de lire un Manifest.

Il décide si le Pack est réellement exécutable dans un contexte donné.

---

# 2. Position dans Techzone Cloud

```text
PACK MANAGER
PackVersion publiée
Manifest
Snapshot
        ↓
ENVIRONMENT & DEPLOYMENT
Environment / Deployment
        ↓
PACK RUNTIME
Load
Validate
Resolve
Effective Manifest
Runtime Context
Activate
Readiness
Execute
        ↓
APPLICATION RUNTIME
UI Renderer
Data Runtime
Automation Runtime
Integrations
```

---

# 3. Responsabilités

Pack Runtime possède :

- chargement PackVersion publiée ;
- vérification publication ;
- vérification hash/intégrité ;
- Runtime validation ;
- résolution des dépendances ;
- résolution des capabilities ;
- résolution configuration effective ;
- résolution Data/Integration requirements ;
- Effective Manifest ;
- Runtime Resolution ;
- Runtime Context ;
- activation ;
- désactivation ;
- readiness ;
- runtime cache ;
- diagnostics Runtime ;
- execution gate.

---

# 4. Hors périmètre

## Pack Manager possède
- composition ;
- validation globale du Pack ;
- snapshot ;
- Manifest publié ;
- publication.

## Environment/Deployment possède
- Environment ;
- pre-deployment ;
- orchestration ;
- rollback workflow ;
- deployment lifecycle.

## Business Manager possède
- Business Definition.

## UI Builder possède
- UI Definition.

## Automation possède
- Workflow Definitions.

## Data Runtime possède
- query/read/write métier.

Pack Runtime autorise l’accès au Data Runtime dans le contexte exécutable mais ne réimplémente pas son moteur de données.

---

# 5. Continuité

```text
KEEP       → fonctionnel
IMPROVE    → fonctionnel mais améliorable
FIX        → incorrect
COMPLETE   → partiel
ADAPT      → réutilisable
IMPLEMENT  → absent
```

Ne pas reconstruire la résolution réelle déjà existante.

---

# 6. Navigation

Runtime reste sous :

```text
EXÉCUTION
└── Runtime
```

Workspace :

```text
Runtime
├── Vue d’ensemble
├── Applications actives
├── Résolutions
├── Activations
├── Cache
├── Diagnostics
└── Historique
```

---

# 7. Contexte Runtime

Contexte minimum :

```text
Tenant
↓
Application
↓
ApplicationVersion
↓
Published PackVersion
↓
Environment
↓
Deployment
↓
Runtime Resolution
↓
Runtime Context
```

Aucun identifiant frontend seul ne constitue une autorisation.

---

# 8. Published Pack Loading

Le Runtime charge uniquement :

```text
PackVersion.status = PUBLISHED
```

et vérifie :

- tenant ;
- PackVersion ;
- Manifest ;
- snapshot ;
- hash ;
- schema version.

---

# 9. Runtime Resolution

Une résolution représente l’évaluation serveur d’un Pack dans un contexte précis.

Modèle conceptuel :

```text
RuntimeResolution
├── id / resolutionId
├── tenantId
├── applicationId
├── applicationVersionId
├── packId
├── packVersionId
├── publicationId?
├── environmentId?
├── deploymentId?
├── status
├── effectiveManifestRef
├── configurationHash?
├── createdAt
├── expiresAt?
└── diagnostics
```

---

# 10. Resolution Status

États conceptuels :

```text
RESOLVING
EXECUTABLE
BLOCKED
ERROR
EXPIRED
```

Seul :

```text
EXECUTABLE
```

autorise l’exécution.

---

# 11. Execution Gate

Règle critique :

```text
NO EXECUTABLE RESOLUTION
=
NO UI RENDER
NO DATA READ/WRITE
NO AUTOMATION EXECUTION
NO INTEGRATION EXECUTION
```

Le Runtime doit être la barrière d’exécution.

---

# 12. resolutionId

Une exécution sensible doit être associée à une résolution serveur valide.

Concept :

```text
resolutionId
↓
server lookup
↓
tenant matches
↓
status = EXECUTABLE
↓
not expired
↓
PackVersion matches
↓
ApplicationVersion matches
↓
environment/deployment matches if required
↓
ALLOW
```

---

# 13. Effective Manifest

Le Runtime ne doit pas exécuter directement le Manifest publié brut.

Pipeline :

```text
Published Manifest
↓
Runtime validation
↓
Dependencies
↓
Capabilities
↓
Configuration
↓
Environment
↓
Registry availability
↓
Data/Integration requirements
↓
Effective Manifest
```

---

# 14. Effective Manifest Contract

Structure indicative :

```json
{
  "resolutionId": "...",
  "tenantId": "...",
  "applicationId": "...",
  "applicationVersionId": "...",
  "packVersionId": "...",
  "environmentId": "...",
  "business": {},
  "ui": {},
  "automation": {},
  "configuration": {},
  "capabilities": [],
  "data": {},
  "integrations": {},
  "runtime": {},
  "integrity": {}
}
```

Ne jamais envoyer de secrets au navigateur.

---

# 15. ApplicationVersion Consistency

Règle obligatoire :

```text
Requested ApplicationVersion
==
PackVersion.applicationVersionId
==
Business Definition version
==
UI Snapshot version
==
Automation Definition version
```

selon les contrats applicables.

Toute incohérence bloque la résolution.

---

# 16. Runtime Validation

Vérifier :

- Pack publié ;
- Manifest valide ;
- hash ;
- Tenant ;
- Application ;
- ApplicationVersion ;
- dependencies ;
- capabilities ;
- Data requirements ;
- Integration requirements ;
- Runtime version ;
- Environment capabilities ;
- configuration ;
- secret refs availability ;
- policies.

---

# 17. Capabilities

Distinction :

```text
DECLARED
REGISTERED
AVAILABLE
EXECUTABLE
```

Une capability déclarée ne suffit pas.

---

# 18. Dependency Resolution

Chaque dépendance obligatoire doit produire :

```text
RESOLVED
MISSING
INCOMPATIBLE
UNAVAILABLE
```

`MISSING`/`INCOMPATIBLE` obligatoire => BLOCKED.

---

# 19. Configuration Effective

Résolution :

```text
Platform
↓
Tenant
↓
Application
↓
Pack
↓
Environment
↓
Runtime Effective Configuration
```

Secrets restent server-side.

---

# 20. Runtime Context

Une activation produit un Runtime Context.

Modèle conceptuel :

```text
RuntimeContext
├── id
├── tenantId
├── applicationId
├── applicationVersionId
├── packVersionId
├── environmentId
├── deploymentId?
├── resolutionId
├── status
├── activatedAt
├── deactivatedAt?
├── configurationHash
└── metadata
```

---

# 21. Runtime Context Status

```text
INACTIVE
ACTIVATING
ACTIVE
DEGRADED
BLOCKED
DEACTIVATING
INACTIVE
ERROR
```

Adapter au modèle réel.

---

# 22. Activation

Pipeline :

```text
EXECUTABLE RESOLUTION
↓
CREATE/UPDATE ACTIVATION
↓
BUILD RUNTIME CONTEXT
↓
REGISTER ACTIVE VERSION
↓
WARM CACHE IF NEEDED
↓
READINESS
↓
ACTIVE
```

---

# 23. Persisted Activation

L’activation doit être persistée au minimum par :

```text
tenant
application
applicationVersion
packVersion
environment
```

selon le modèle d’environnement retenu.

Un redémarrage backend ne doit pas faire perdre silencieusement la connaissance de la version active.

---

# 24. One Active Version

Définir une règle claire par scope.

Exemple :

```text
one ACTIVE RuntimeContext
per tenant + application + environment
```

sauf architecture multi-slot explicitement implémentée.

---

# 25. Deactivation

La désactivation :

- vérifie IAM ;
- vérifie Tenant ;
- invalide cache ;
- rend la résolution/context non exécutable si applicable ;
- audit.

---

# 26. Readiness

ACTIVE n’est obtenu qu’après readiness réelle.

Readiness peut vérifier :

- effective manifest loaded ;
- data provider available ;
- mandatory integration available ;
- automation engine available if required ;
- required capabilities executable.

---

# 27. Health vs Readiness

Distinguer :

```text
Process Health
Runtime Resolution Status
Runtime Context Status
Application Readiness
Dependency Health
```

Pas de statut fictif.

---

# 28. UI Renderer Contract

Le Renderer reçoit :

```text
resolutionId
+
effective UI definition
+
Runtime Context
```

Il ne charge pas seul un Manifest publié brut pour décider d’exécuter.

---

# 29. PublishedApplication

Doit utiliser :

```text
Effective Manifest
```

et non :

```text
Published Manifest direct
```

pour l’exécution.

---

# 30. Data Runtime Contract

Chaque opération Data Runtime provenant d’une application publiée doit porter ou résoudre une preuve Runtime :

```text
resolutionId
```

Le serveur vérifie :

- executable ;
- tenant ;
- app/version ;
- capability/data binding ;
- authorization IAM.

---

# 31. Automation Runtime Contract

Une Automation exécutée dans une PackVersion doit utiliser le Runtime Context effectif.

BLOCKED => aucune exécution.

---

# 32. Integration Runtime Contract

Les connectors requis doivent être validés via Integration Hub/Registry.

BLOCKED => pas d’appel externe métier autorisé depuis cette résolution.

---

# 33. Cache

Cache minimum actuel possible :

```text
L1_MEMORY
```

Évolution possible :

```text
L2 distributed
```

Cache key doit inclure suffisamment de contexte :

```text
tenant
packVersion
environment
configuration version/hash
```

---

# 34. Cache Invalidation

Invalider sur :

- new publication ;
- activation ;
- deactivation ;
- relevant configuration change ;
- capability/provider change ;
- deployment switch ;
- explicit invalidation.

---

# 35. Publication Event

Si outbox :

```text
pack.version.published
```

existe, le Runtime doit soit :
- le consommer réellement ;
- soit documenter clairement un autre mécanisme.

Pas d’événement inutilisé présenté comme fonctionnalité active.

---

# 36. Integrity

Avant exécution :

- verify Manifest hash ;
- verify snapshot integrity ;
- reject tampered data.

---

# 37. IAM

Permissions conceptuelles :

```text
runtime.read
runtime.resolve
runtime.activate
runtime.deactivate
runtime.diagnostics
runtime.cache.manage
```

Renderer utilisateur peut avoir un contrat d’exécution différent des permissions d’administration.

---

# 38. Tenant Isolation

Tenant A ne peut jamais :

- résoudre Pack B ;
- lire Effective Manifest B ;
- activer B ;
- utiliser resolutionId B ;
- lire Runtime Context B ;
- exécuter Data Runtime B ;
- diagnostiquer B.

---

# 39. Resolution Ownership

Un `resolutionId` doit être :

- opaque ;
- server-generated ;
- tenant-scoped ;
- non forgeable comme autorisation ;
- expiré/invalide selon lifecycle.

---

# 40. API conceptuelle

```http
POST /api/pack-runtime/resolve
GET  /api/pack-runtime/resolutions/:id
POST /api/pack-runtime/resolutions/:id/activate
POST /api/pack-runtime/contexts/:id/deactivate

GET  /api/pack-runtime/contexts
GET  /api/pack-runtime/contexts/:id
GET  /api/pack-runtime/contexts/:id/readiness
GET  /api/pack-runtime/contexts/:id/diagnostics

POST /api/pack-runtime/cache/invalidate
```

Adapter aux APIs existantes.

---

# 41. Resolve Request

Entrées conceptuelles :

```text
packVersionId
applicationVersionId
environmentId?
deploymentId?
```

Tenant vient du contexte IAM.

---

# 42. Resolve Response

```json
{
  "resolutionId": "...",
  "status": "EXECUTABLE",
  "applicationVersionId": "...",
  "packVersionId": "...",
  "effectiveManifest": {},
  "diagnostics": []
}
```

Pour BLOCKED :

```json
{
  "resolutionId": "...",
  "status": "BLOCKED",
  "effectiveManifest": null,
  "diagnostics": []
}
```

---

# 43. Diagnostics

Structure :

```text
stage
code
severity
message
resource
timestamp
correlationId
```

Codes :

```text
PACK_NOT_PUBLISHED
MANIFEST_INVALID
HASH_MISMATCH
APPLICATION_VERSION_MISMATCH
DEPENDENCY_MISSING
CAPABILITY_MISSING
PROVIDER_UNAVAILABLE
CONFIGURATION_INVALID
SECRET_UNAVAILABLE
DATA_PROVIDER_UNAVAILABLE
CONNECTOR_UNAVAILABLE
RESOLUTION_BLOCKED
ACTIVATION_FAILED
READINESS_FAILED
RUNTIME_CONTEXT_NOT_ACTIVE
RESOLUTION_EXPIRED
```

---

# 44. Observability

Tracer :

- resolution duration ;
- cache hit/miss ;
- activation ;
- deactivation ;
- blocked reasons ;
- readiness ;
- runtime errors.

Aucun secret.

---

# 45. UI Runtime Overview

Afficher données réelles :

- Active Applications ;
- Executable Resolutions ;
- Blocked Resolutions ;
- Active Contexts ;
- Degraded Contexts ;
- Cache status.

---

# 46. Runtime Application Detail

Afficher :

- Tenant ;
- Application ;
- ApplicationVersion ;
- PackVersion ;
- Environment ;
- Resolution ;
- Activation ;
- Readiness ;
- dependencies ;
- capabilities ;
- diagnostics.

---

# 47. Blocked Runtime UX

Si BLOCKED :

```text
NO APPLICATION RENDER
```

Afficher un écran contrôlé :

- Runtime Blocked ;
- blocking diagnostics ;
- correlation ID ;
- actions admin permises.

---

# 48. Runtime Launch Flow

```text
Select Published Application
↓
Resolve
↓
EXECUTABLE ?
  NO → Blocked Screen
  YES
↓
Activate / Use active context
↓
Readiness
↓
Render Published Application
```

---

# 49. Security

Frontend ne peut jamais :
- forcer status EXECUTABLE ;
- fournir tenant autoritaire ;
- fournir effective manifest arbitraire ;
- bypass resolution.

---

# 50. Prisma

Avant nouvelles tables :

```text
AUDIT
→ reuse existing Pack Runtime models
→ identify activation persistence gap
→ minimal additive migration
```

---

# 51. Tests unitaires

Tester :

- resolver ;
- manifest validator ;
- version consistency ;
- dependency resolver ;
- capability resolver ;
- effective config ;
- activation ;
- cache ;
- readiness ;
- execution gate.

---

# 52. Tests intégration

```text
Pack Manager Publication → Pack Runtime
Deployment → Resolve
Resolve → Effective Manifest
Resolve → Activate
Runtime → Data Runtime
Runtime → Automation
Runtime → Integration Hub
Runtime → Observability
```

---

# 53. Tests sécurité

- cross-tenant resolution ;
- forged resolutionId ;
- blocked runtime render ;
- blocked runtime data write ;
- expired resolution ;
- AppVersion mismatch ;
- tampered Manifest ;
- unauthorized activation ;
- cross-environment context.

---

# 54. E2E

```text
LOGIN
↓
Tenant
↓
Published PackVersion
↓
Environment
↓
Deployment
↓
Pack Runtime Resolve
↓
EXECUTABLE
↓
Activate
↓
Readiness
↓
Render UI
↓
Data Runtime Read/Write
↓
Automation
```

Negative E2E :

```text
Resolve = BLOCKED
↓
NO UI
NO DATA WRITE
NO AUTOMATION
```

---

# 55. Definition of Done

Pack Runtime est DONE si :

- résolution réelle préservée ;
- Effective Manifest utilisé ;
- BLOCKED empêche l’exécution ;
- resolutionId exigé dans les chemins Runtime pertinents ;
- AppVersion strictement vérifiée ;
- activation persistée ;
- Runtime Context réel ;
- Data Runtime lié à une résolution exécutable ;
- cache correctement invalidé ;
- event publication consommé ou clarifié ;
- tenant isolation ;
- tests BLOCKED verts ;
- E2E UI → Runtime → Data vert ;
- build/test/Prisma verts.
