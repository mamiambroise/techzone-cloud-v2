# BM-CDC-02 — Version & Lifecycle Manager

**Projet :** Techzone Cloud  
**Module :** Business Manager  
**Référence :** `BM-CDC-02`  
**Nom :** Version & Lifecycle Manager  
**Priorité :** 🔴 P0 — Fonction cœur  
**Type :** Fonctionnel — Frontend + Backend + Base de données + API + Validation + Tests  
**Prérequis :** `BM-CDC-00 — Socle, Architecture & Contrats communs` et `BM-CDC-01 — Application Manager`  
**Consommateurs :** `BM-CDC-03` à `BM-CDC-08`

---

## 1. Finalité

BM-CDC-02 doit gérer le **cycle de vie versionné d’une Application**.

BM-CDC-01 crée l’Application. BM-CDC-02 répond ensuite à :

> **Quelles versions possède cette Application, dans quel état se trouve chaque version, laquelle est publiée, laquelle est en préparation, et comment gérer validation, publication, rollback et historique ?**

```text
APPLICATION
    │
    ▼
APPLICATION VERSION
    │
    ├── DRAFT
    ├── CONFIGURING
    ├── VALIDATING
    ├── READY
    ├── PUBLISHED
    ├── SUPERSEDED
    ├── DEPRECATED
    └── ARCHIVED
```

---

## 2. Position dans l’architecture

```text
BM-CDC-00
Socle commun
    │
    ▼
BM-CDC-01
Application Manager
    │
    ▼
BM-CDC-02
Version & Lifecycle Manager
    │
    ├────► BM-CDC-03 Data Model
    ├────► BM-CDC-04 Feature & Capability
    ├────► BM-CDC-05 Menu Engine
    ├────► BM-CDC-06 Configuration
    ├────► BM-CDC-07 Integration / Runtime
    └────► BM-CDC-08 Validation / Quality
```

---

## 3. Responsabilité principale

BM-CDC-02 doit gérer :

```text
ApplicationVersion
Version Numbering
Version Lifecycle
Version Status
Version Creation
Version Clone
Version Comparison
Validation Orchestration
Publication
Publication History
Rollback
Immutability
Version Snapshot
Version Hash
Version Activity
Version Audit
Optimistic Locking
Transactions
Permissions
Tenant/Application/Version Isolation
```

---

## 4. Hors périmètre

BM-CDC-02 ne doit pas recréer :

```text
Application CRUD                → BM-CDC-01
Entity / Field / Relation       → BM-CDC-03
Feature / Capability            → BM-CDC-04
Menu / Navigation               → BM-CDC-05
Configuration métier avancée    → BM-CDC-06
Runtime / Adapter               → BM-CDC-07
Validation qualité globale      → BM-CDC-08
```

Il orchestre ces moteurs autour de `ApplicationVersion`.

---

## 5. Concept ApplicationVersion

Une `ApplicationVersion` représente un état versionné de la configuration d’une Application.

```text
Application : Boutique

Version 1.0.0
PUBLISHED

Version 1.1.0
DRAFT

Version 2.0.0
FUTURE
```

---

## 6. Pourquoi versionner

Le versioning doit permettre :

```text
modifier sans casser la production
tester avant publication
comparer les changements
revenir à une version stable
conserver l’historique
garantir l’immutabilité publiée
préparer les migrations
produire des snapshots
```

---

## 7. Modèle ApplicationVersion

```text
ApplicationVersion
│
├── id
├── applicationId
├── versionNumber
├── label
├── description
├── status
├── environment
├── sourceVersionId
├── validationStatus
├── completeness
├── snapshotHash
├── createdBy
├── createdAt
├── updatedBy
├── updatedAt
├── validatedAt
├── publishedAt
├── deprecatedAt
├── archivedAt
└── version
```

---

## 8. Version Number

Format recommandé :

```text
MAJOR.MINOR.PATCH
```

Exemples :

```text
1.0.0
1.1.0
1.1.1
2.0.0
```

Règles :

```text
obligatoire
unique dans une Application
stable
non réutilisé
```

Contrainte :

```text
UNIQUE(application_id, version_number)
```

---

## 9. Sémantique MAJOR / MINOR / PATCH

```text
MAJOR → breaking change important
MINOR → ajout compatible
PATCH → correction compatible
```

Le système peut suggérer le prochain numéro, mais l’utilisateur autorisé reste maître de la valeur finale.

---

## 10. Version Status

```text
DRAFT
CONFIGURING
VALIDATING
READY
PUBLISHED
SUPERSEDED
DEPRECATED
ARCHIVED
ERROR
```

---

## 11. DRAFT

```text
version créée
modifiable
pas encore prête
```

---

## 12. CONFIGURING

```text
configuration active en cours
CDC-03 à CDC-06 peuvent encore modifier
```

---

## 13. VALIDATING

```text
validation en cours
écritures critiques éventuellement limitées
```

---

## 14. READY

```text
validation bloquante = PASS
version prête à publication
```

---

## 15. PUBLISHED

```text
version publiée
référence active
READ ONLY
```

Toute mutation doit être refusée.

---

## 16. SUPERSEDED

Ancienne version publiée remplacée par une nouvelle. Elle reste consultable et historisée.

---

## 17. DEPRECATED

Version encore connue mais déconseillée ou en sortie progressive.

---

## 18. ARCHIVED

Version retirée de l’usage courant avec historique conservé.

---

## 19. ERROR

État réservé à une version présentant une incohérence ou un incident nécessitant intervention.

---

## 20. Lifecycle principal

```text
DRAFT
   ↓
CONFIGURING
   ↓
VALIDATING
   ↓
READY
   ↓
PUBLISHED
```

Puis :

```text
PUBLISHED
   ↓
SUPERSEDED
   ↓
DEPRECATED
   ↓
ARCHIVED
```

---

## 21. Transitions contrôlées

Le backend est l’autorité.

```text
DRAFT → CONFIGURING
CONFIGURING → VALIDATING
VALIDATING → CONFIGURING
VALIDATING → READY
READY → CONFIGURING
READY → PUBLISHED
PUBLISHED → SUPERSEDED
SUPERSEDED → DEPRECATED
DEPRECATED → ARCHIVED
```

---

## 22. Transitions interdites

```text
DRAFT → PUBLISHED
ARCHIVED → PUBLISHED
PUBLISHED → CONFIGURING
PUBLISHED → DRAFT
```

sauf procédure spéciale explicitement prévue.

---

## 23. VersionLifecycleService

```text
getAllowedTransitions()
canTransition()
transition()
validateTransition()
recordTransition()
```

---

## 24. Version Editability

```text
DRAFT        → EDITABLE
CONFIGURING  → EDITABLE
VALIDATING   → LIMITED / CONTROLLED
READY        → CONTROLLED
PUBLISHED    → READ ONLY
SUPERSEDED   → READ ONLY
DEPRECATED   → READ ONLY
ARCHIVED     → READ ONLY
```

BM-CDC-00 fournit le mécanisme commun `VersionEditabilityGuard`; BM-CDC-02 définit la règle métier précise.

Erreur :

```text
VERSION_NOT_EDITABLE
```

---

## 25. Création de version

Modes :

```text
EMPTY
FROM_CURRENT_DRAFT
FROM_PUBLISHED
FROM_VERSION
```

---

## 26. Création vide

```text
Application
   ↓
New Version
   ↓
Version 1.0.0 DRAFT
```

---

## 27. Création depuis version publiée

```text
Version 1.0.0 PUBLISHED
       ↓ clone
Version 1.1.0 DRAFT
```

La version 1.0.0 reste intacte.

---

## 28. Source Version

Champ :

```text
sourceVersionId
```

permet de savoir de quelle version est issue une nouvelle version.

---

## 29. Clone de version

Le clone doit créer de nouvelles données versionnées.

```text
Source Version
      ↓
Clone
      ↓
Target Version
```

Aucune ligne versionnée du clone ne doit rester liée en écriture à la source.

---

## 30. VersionCloneContributor

Prévoir :

```text
VersionCloneContributor
```

Les autres CDC peuvent s’enregistrer :

```text
CDC-03 → clone Data Model
CDC-04 → clone Features / Capabilities
CDC-05 → clone Menus
CDC-06 → clone Configuration
```

---

## 31. Orchestration du clone

```text
Create Version
      ↓
Create ApplicationVersion
      ↓
Run VersionCloneContributors
      ↓
Generate ActivityEvent
      ↓
Audit
      ↓
COMMIT
```

En cas d’échec critique :

```text
ROLLBACK
```

---

## 32. Version Catalog

```text
VERSIONS — Boutique

Version   Status       Source   Validation   Published
-------------------------------------------------------
1.1.0     DRAFT        1.0.0    78%          -
1.0.0     PUBLISHED    -        PASS         20/08/2026
0.9.0     SUPERSEDED   -        PASS         01/08/2026
```

Fonctions :

```text
Lister
Rechercher
Filtrer
Trier
Créer
Ouvrir
Cloner
Comparer
Valider
Publier
Rollback
Archiver
Consulter historique
```

---

## 33. Filtres

```text
status
environment
validationStatus
sourceVersionId
createdBy
createdFrom
createdTo
publishedFrom
publishedTo
```

---

## 34. Version Detail

Sous-onglets :

```text
Overview
Validation
Changes
Snapshot
Publications
Activity
```

---

## 35. Version Overview

Afficher :

```text
Version number
Status
Environment
Source version
Created by
Created at
Last updated
Validation status
Completeness
Snapshot hash
Published at
```

---

## 36. Environment

Prévoir au minimum :

```text
DEV
TEST
STAGING
PROD
```

ou un modèle configurable par Techzone Cloud.

---

## 37. Validation Orchestration

Créer :

```text
VersionValidationOrchestrator
```

Il ne recrée pas les validateurs métier. Il appelle les validateurs enregistrés par les autres CDC.

---

## 38. Validator Registry

Contrat :

```text
VersionValidator
```

Chaque moteur peut fournir :

```text
key
order
validate(applicationVersionId)
```

Exemples :

```text
CDC-03 → DataModelValidator
CDC-04 → FeatureValidator
CDC-05 → NavigationValidator
CDC-06 → ConfigurationValidator
CDC-07 → RuntimeCompatibilityValidator
CDC-08 → QualityValidator
```

---

## 39. Validation Flow

```text
ApplicationVersion
      ↓
Core checks
      ↓
Registered validators
      ↓
Aggregate
      ↓
ValidationResult
      ↓
Completeness
      ↓
Status decision
```

---

## 40. ValidationResult

Réutiliser BM-CDC-00 :

```text
valid
errors[]
warnings[]
infos[]
completeness
issues[]
traceId
```

---

## 41. Validation Status

```text
NOT_RUN
RUNNING
VALID
INVALID
OUTDATED
```

---

## 42. Validation Outdated

Si la version est modifiée après validation :

```text
VALID
  ↓ modification
OUTDATED
```

Une publication ne doit pas se baser sur une validation obsolète.

---

## 43. Completeness

Score :

```text
0 → 100
```

Le score informe mais ne remplace pas la règle :

```text
ERROR bloquante
→ publication interdite
```

---

## 44. Publication Manager

Créer :

```text
PublicationManager
```

Responsabilités :

```text
validatePublishability()
generateSnapshot()
createPublication()
activateVersion()
supersedePreviousVersion()
updateApplicationReference()
recordActivity()
recordAudit()
```

---

## 45. Publication Preconditions

```text
Application exists
Application accessible
Version exists
Version belongs to Application
Version status = READY
ValidationStatus = VALID
Validation not outdated
No blocking errors
Snapshot generated
Permission granted
```

---

## 46. Publication Flow

```text
READY Version
     ↓
Revalidate / confirm validation
     ↓
Generate Snapshot
     ↓
Confirm
     ↓
BEGIN
     ↓
Create Publication
     ↓
Set Version PUBLISHED
     ↓
Supersede old publication
     ↓
Update currentPublishedVersion
     ↓
ActivityEvent
     ↓
Audit
     ↓
COMMIT
```

---

## 47. Publication immutability

Après publication :

```text
PUBLISHED
→ READ ONLY
```

Toute modification doit passer par création d’une nouvelle version.

---

## 48. Publication Record

```text
Publication
│
├── id
├── applicationId
├── applicationVersionId
├── environment
├── type
├── status
├── snapshotHash
├── previousPublicationId
├── publishedBy
├── publishedAt
├── reason
└── metadata
```

---

## 49. Publication Type

```text
PUBLISH
ROLLBACK
REPUBLISH
```

---

## 50. Publication Status

```text
PENDING
SUCCESS
FAILED
ROLLED_BACK
```

---

## 51. Une publication active par scope

```text
MAX 1 publication courante
par Application + Environment
```

---

## 52. Historique de publication

Afficher :

```text
Version
Type
Environment
Published By
Published At
Previous Version
Snapshot Hash
Status
Reason
```

---

## 53. Rollback

Le rollback permet de revenir à une version antérieure publiée et valide.

Il ne doit jamais :

```text
supprimer l’historique
réécrire l’ancienne version
modifier une version publiée
```

Il crée une **nouvelle opération de publication**.

---

## 54. Rollback Flow

```text
Current 1.2.0
    ↓
Choose 1.1.0
    ↓
Impact
    ↓
Validate target
    ↓
Confirm
    ↓
Create ROLLBACK publication
    ↓
1.1.0 becomes active
    ↓
History preserved
```

---

## 55. Rollback Candidates

Le backend retourne uniquement les versions :

```text
appartenant à la même Application
compatibles avec l’environnement
ayant un snapshot valide
ayant déjà été publiées ou explicitement éligibles
non archivées de façon incompatible
```

---

## 56. Impact avant Rollback

Afficher :

```text
Current Version
Target Version
Data migration risk
Feature differences
Navigation differences
Runtime compatibility
Warnings
Blocking issues
```

Les détails sont fournis par les autres moteurs via un contrat d’impact.

---

## 57. Version Diff

BM-CDC-02 orchestre la comparaison globale.

```text
CDC-03 → Data Model Diff
CDC-04 → Feature Diff
CDC-05 → Navigation Diff
CDC-06 → Configuration Diff
```

---

## 58. VersionComparisonResult

```text
sourceVersion
targetVersion
summary
domains[]
breakingChanges[]
warnings[]
snapshotHashes
```

---

## 59. Snapshot global

BM-CDC-02 doit orchestrer :

```text
ApplicationVersionSnapshot
│
├── Core version metadata
├── CDC-03 Data Model fragment
├── CDC-04 Feature fragment
├── CDC-05 Navigation fragment
├── CDC-06 Configuration fragment
├── CDC-07 Integration fragment
└── schemaVersion
```

---

## 60. Snapshot Registry

Prévoir :

```text
VersionSnapshotContributor
```

Chaque CDC fournit son fragment.

---

## 61. Snapshot déterministe

Même configuration logique :

```text
→ même snapshot normalisé
→ même snapshotHash
```

---

## 62. Snapshot Outdated

Si une configuration change :

```text
snapshot status = OUTDATED
```

Une nouvelle génération est requise avant publication.

---

## 63. Database — Application Versions

Table :

```text
bm_application_versions
```

Champs :

```text
id
application_id
version_number
label
description
status
environment
source_version_id
validation_status
completeness
snapshot_hash
created_by
created_at
updated_by
updated_at
validated_at
published_at
deprecated_at
archived_at
version
```

---

## 64. Database — Publications

Table :

```text
bm_publications
```

Champs :

```text
id
application_id
application_version_id
environment
type
status
snapshot_hash
previous_publication_id
published_by
published_at
reason
metadata
```

---

## 65. Database — Version Transitions

Table recommandée :

```text
bm_version_transitions
```

Champs :

```text
id
application_version_id
from_status
to_status
reason
actor_id
trace_id
created_at
```

---

## 66. Contraintes DB

```text
UNIQUE(application_id, version_number)
```

Foreign keys :

```text
application_id → bm_applications.id
source_version_id → bm_application_versions.id
publication.application_version_id → bm_application_versions.id
```

---

## 67. Indexes

```text
application_id
status
environment
validation_status
source_version_id
created_at
published_at
```

---

## 68. Optimistic Locking

Champ :

```text
version
```

Conflit :

```text
409 VERSION_CONFLICT
```

---

## 69. Backend Services

```text
ApplicationVersionService
VersionLifecycleService
VersionCloneService
VersionValidationOrchestrator
VersionComparisonService
PublicationManager
RollbackService
VersionSnapshotService
VersionActivityService
```

---

## 70. ApplicationVersionService

```text
createVersion()
getVersion()
listVersions()
updateVersionMetadata()
archiveVersion()
getCurrentDraft()
getCurrentPublished()
getVersionOverview()
```

---

## 71. VersionCloneService

```text
cloneVersion()
registerContributor()
executeContributors()
validateClone()
```

---

## 72. VersionValidationOrchestrator

```text
registerValidator()
validateVersion()
getValidationResult()
markValidationOutdated()
calculateCompleteness()
```

---

## 73. PublicationManager

```text
getCurrentPublication()
listPublications()
publishVersion()
validatePublication()
generatePublicationSnapshot()
```

---

## 74. RollbackService

```text
getRollbackCandidates()
getRollbackImpact()
validateTarget()
rollback()
```

---

## 75. VersionComparisonService

```text
compareVersions()
registerDiffContributor()
aggregateDiffs()
```

---

## 76. API — Versions

```text
GET  /applications/:applicationId/versions
POST /applications/:applicationId/versions

GET   /application-versions/:versionId
PATCH /application-versions/:versionId

POST /application-versions/:versionId/clone
POST /application-versions/:versionId/archive
```

---

## 77. API — Lifecycle

```text
GET  /application-versions/:versionId/transitions
POST /application-versions/:versionId/transition
```

Payload :

```json
{
  "targetStatus": "VALIDATING",
  "reason": "Configuration completed"
}
```

---

## 78. API — Validation

```text
POST /application-versions/:versionId/validate
GET  /application-versions/:versionId/validation
```

---

## 79. API — Comparison

```text
GET /application-versions/:versionId/compare/:targetVersionId
```

---

## 80. API — Snapshot

```text
POST /application-versions/:versionId/snapshot
GET  /application-versions/:versionId/snapshot
```

---

## 81. API — Publication

```text
POST /application-versions/:versionId/publish
GET /applications/:applicationId/publications
GET /applications/:applicationId/current-publication
```

---

## 82. API — Rollback

```text
GET  /applications/:applicationId/rollback-candidates
GET  /applications/:applicationId/rollback-impact/:targetVersionId
POST /applications/:applicationId/rollback
```

---

## 83. API Contract

Réutiliser BM-CDC-00.

Succès :

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {}
}
```

Erreur :

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VERSION_NOT_EDITABLE",
    "message": "Published versions are immutable",
    "details": []
  },
  "meta": {
    "traceId": "..."
  }
}
```

---

## 84. Error Codes

```text
VERSION_NOT_FOUND
VERSION_NUMBER_REQUIRED
VERSION_NUMBER_INVALID
VERSION_NUMBER_EXISTS
VERSION_NOT_EDITABLE
VERSION_CONFLICT
VERSION_TRANSITION_INVALID
VERSION_STATUS_INVALID
VALIDATION_REQUIRED
VALIDATION_FAILED
VALIDATION_OUTDATED
PUBLICATION_VALIDATION_FAILED
PUBLICATION_FAILED
PUBLICATION_ALREADY_EXISTS
ROLLBACK_TARGET_INVALID
ROLLBACK_NOT_ALLOWED
ROLLBACK_FAILED
SNAPSHOT_REQUIRED
SNAPSHOT_OUTDATED
SNAPSHOT_FAILED
TENANT_MISMATCH
APPLICATION_MISMATCH
PERMISSION_DENIED
```

---

## 85. Permissions

```text
business.version.read
business.version.create
business.version.update
business.version.clone
business.version.archive
business.version.transition
business.version.validate
business.version.compare
business.version.snapshot
business.version.publish
business.version.rollback
business.publication.read
```

---

## 86. IAM Context

Le backend récupère :

```text
actorId
tenantId
permissions
applicationId
traceId
```

depuis le contexte authentifié.

---

## 87. Isolation Tenant/Application/Version

```text
Tenant
  ↓
Application
  ↓
ApplicationVersion
```

Une Version appartenant à Application A ne doit jamais être utilisée depuis Application B.

---

## 88. Protection Published

Frontend :

```text
READ ONLY
```

Backend :

```text
MUTATION DENIED
```

---

## 89. Transactions

Obligatoires pour :

```text
clone version
publication
rollback
lifecycle transition complexe
snapshot + publication
```

---

## 90. Activity Events

```text
version.created
version.updated
version.cloned
version.transitioned
version.validation.started
version.validation.completed
version.snapshot.generated
version.published
version.superseded
version.rollback
version.archived
```

---

## 91. Audit

Auditer au minimum :

```text
create version
clone version
change lifecycle
validation
publication
rollback
archive
```

---

## 92. Frontend — Versions Page

```text
VERSIONS

[ + Nouvelle version ]

1.2.0
DRAFT
Validation OUTDATED

1.1.0
PUBLISHED
Validation PASS

1.0.0
SUPERSEDED
```

---

## 93. Create Version Dialog

```text
Version number
Label
Description
Environment
Creation mode
Source version
```

---

## 94. Version Selector

```text
Application
[Boutique]

Version
[1.1.0 PUBLISHED ▼]
```

---

## 95. Version Detail UI

```text
Overview
Validation
Changes
Snapshot
Publications
Activity
```

---

## 96. Lifecycle UI

```text
DRAFT
  →
CONFIGURING
  →
VALIDATING
  →
READY
  →
PUBLISHED
```

Le statut courant doit être clairement mis en évidence.

---

## 97. Allowed Actions

```text
DRAFT
→ Edit / Clone / Validate

CONFIGURING
→ Edit / Validate

VALIDATING
→ View validation / Return configuring

READY
→ Publish / Return configuring

PUBLISHED
→ View / Clone / Compare / Rollback target

SUPERSEDED
→ View / Compare / Rollback target
```

---

## 98. Validation Panel

```text
Core                   ✓
Data Model             ✓
Features               ✓
Navigation             ✗
Configuration          ⚠
Runtime compatibility  ✓

Overall
INVALID
```

---

## 99. Publication Confirmation

Afficher :

```text
Application
Version
Environment
Validation
Warnings
Snapshot Hash
Current Published Version
Breaking Changes
```

Boutons :

```text
[ Annuler ]
[ Publier ]
```

---

## 100. Rollback Confirmation

Afficher :

```text
Current Version
Target Version
Environment
Impact
Warnings
Reason
```

Boutons :

```text
[ Annuler ]
[ Restaurer cette version ]
```

---

## 101. Version Comparison UI

Deux colonnes :

```text
SOURCE           TARGET
1.0.0            1.1.0
```

Sections :

```text
Data
Features
Navigation
Configuration
Integration
Breaking Changes
```

---

## 102. Snapshot UI

Afficher :

```text
Snapshot status
Hash
Generated At
Schema Version
Contributors
```

Action :

```text
[ Regénérer Snapshot ]
```

si autorisé.

---

## 103. Published Read Only

Tous les écrans enfants de la version doivent recevoir :

```text
editable = false
```

Le backend reste l’autorité.

---

## 104. No Version State

```text
Aucune version

Créez une première version pour commencer la configuration.

[ + Créer une version ]
```

---

## 105. Performance

Objectifs indicatifs :

```text
Version list          < 500 ms
Version detail        < 300 ms
Transitions           < 300 ms
Core validation       < 1 s
Comparison summary    < 1 s hors gros contributeurs
```

---

## 106. Tests Backend

```text
Create Version
Duplicate version number rejected
Clone Version
Source version validation
Valid transition
Invalid transition
Published immutable
Validation PASS
Validation FAIL
Validation OUTDATED
Generate Snapshot
Same state → same hash
Changed state → different hash
Publish READY version
Reject non-ready version
Reject outdated validation
Single active publication
Supersede previous published version
Rollback valid target
Reject invalid rollback
Tenant isolation
Application isolation
Permissions
Optimistic locking
Transaction rollback
ActivityEvent
Audit
```

---

## 107. Tests Frontend

```text
Version list
Create Version
Clone Version
Version detail
Lifecycle display
Allowed actions
Validation Panel
Navigate validation errors
Version selector
Read-only published version
Publication confirmation
Rollback confirmation
Version comparison
Snapshot view
Loading
Empty
Error
Forbidden
Conflict
Responsive
```

---

## 108. Test E2E — Première version

```text
Application Boutique
      ↓
Create Version 1.0.0
      ↓
DRAFT
      ↓
CONFIGURING
      ↓
Validate
      ↓
READY
      ↓
Publish
      ↓
PUBLISHED
```

---

## 109. Test E2E — Nouvelle version

```text
1.0.0 PUBLISHED
      ↓
Clone
      ↓
1.1.0 DRAFT
      ↓
Modify through CDC-03/04/05
      ↓
Validation becomes OUTDATED
      ↓
Validate
      ↓
READY
      ↓
Publish
      ↓
1.1.0 PUBLISHED
1.0.0 SUPERSEDED
```

---

## 110. Test E2E — Publication invalide

```text
Version CONFIGURING
Validation INVALID
      ↓
Publish
      ↓
DENIED
PUBLICATION_VALIDATION_FAILED
```

---

## 111. Test E2E — Published immutable

```text
1.0.0 PUBLISHED
      ↓
PATCH
      ↓
DENIED
VERSION_NOT_EDITABLE
```

---

## 112. Test E2E — Rollback

```text
Current = 1.2.0
Target  = 1.1.0
      ↓
Impact Analysis
      ↓
Confirm
      ↓
ROLLBACK Publication
      ↓
1.1.0 active
History preserved
```

---

## 113. Test E2E — Conflict

```text
Client version = 5
DB version     = 6
      ↓
PATCH
      ↓
409 VERSION_CONFLICT
```

---

## 114. Test E2E — Isolation

```text
Application A / Version A1
Application B / Version B1

Context Application A
      ↓
Access Version B1
      ↓
DENIED
APPLICATION_MISMATCH
```

---

## 115. Extension Points

BM-CDC-02 doit permettre aux autres CDC de contribuer à :

```text
Clone
Validation
Snapshot
Diff
Impact
Publication readiness
Rollback readiness
```

---

## 116. Contrat avec BM-CDC-03

BM-CDC-03 reçoit :

```text
applicationId
applicationVersionId
editable
versionStatus
```

et rattache son Data Model à `ApplicationVersion`.

---

## 117. Contrat avec BM-CDC-04

BM-CDC-04 rattache :

```text
VersionFeatures
VersionCapabilities
```

à `applicationVersionId`.

---

## 118. Contrat avec BM-CDC-05

BM-CDC-05 rattache :

```text
VersionMenu
VersionMenuItems
```

à `applicationVersionId`.

---

## 119. Contrat avec BM-CDC-06

BM-CDC-06 rattache ses configurations versionnées à :

```text
applicationVersionId
```

lorsqu’elles doivent varier selon version.

---

## 120. Contrat avec BM-CDC-07

BM-CDC-07 doit pouvoir consommer :

```text
Published ApplicationVersion
Snapshot
SnapshotHash
Environment
Publication metadata
```

---

## 121. Contrat avec BM-CDC-08

BM-CDC-08 peut fournir :

```text
QualityValidator
Readiness checks
Integration test result
Compliance result
```

au Validator Registry de BM-CDC-02.

---

## 122. Répartition Team 3 — Avotra

### Frontend fonctionnel

```text
Version Catalog
Create Version form
Version Detail
Lifecycle visualization
Validation Panel
Publication confirmation
Rollback confirmation
Version Comparison
Snapshot display
Activity
Loading / Empty / Error
Responsive
API integration
```

---

## 123. Répartition Team 3 — Belardo

### Frontend Architecture

```text
Version Selector architecture
Version context
Read-only propagation
Workspace integration
State management
Lifecycle component
Comparison architecture
Diff viewer components
Optimistic locking UI
Conflict handling
Validation state synchronization
Frontend tests foundation
Performance
```

---

## 124. Répartition Team 3 — Ranja

### Backend

```text
ApplicationVersion Domain
DB migrations
Version Repository
VersionService
LifecycleService
VersionCloneService
Validator Registry
Validation Orchestrator
PublicationManager
RollbackService
ComparisonService
SnapshotService
Transactions
IAM Context
Tenant/Application/Version isolation
Optimistic locking
ActivityEvent
Audit
APIs
Backend tests
```

---

## 125. Livrables Backend

```text
✓ bm_application_versions
✓ bm_publications
✓ bm_version_transitions
✓ migrations
✓ indexes
✓ ApplicationVersion Domain
✓ VersionService
✓ LifecycleService
✓ CloneService
✓ Validator Registry
✓ Validation Orchestrator
✓ PublicationManager
✓ RollbackService
✓ ComparisonService
✓ SnapshotService
✓ APIs
✓ Permissions
✓ IAM Context
✓ Isolation
✓ Transactions
✓ Optimistic locking
✓ ActivityEvent
✓ Audit
✓ Backend tests
✓ API documentation
```

---

## 126. Livrables Frontend

```text
✓ Versions page
✓ Create Version
✓ Clone Version
✓ Version Detail
✓ Version Selector
✓ Lifecycle UI
✓ Validation UI
✓ Publication UI
✓ Rollback UI
✓ Comparison UI
✓ Snapshot UI
✓ Activity UI
✓ Read-only mode
✓ Loading / Empty / Error
✓ Forbidden
✓ Conflict
✓ Responsive
✓ Frontend tests
```

---

## 127. Critères d’acceptation

BM-CDC-02 est accepté lorsque :

```text
✓ Une Application peut posséder plusieurs versions
✓ Chaque numéro est unique dans l’Application
✓ Une version peut être créée
✓ Une version peut être clonée
✓ Le lifecycle est contrôlé par le backend
✓ Les transitions invalides sont rejetées
✓ Une version publiée est immuable
✓ Les moteurs enfants reçoivent editable=false
✓ La validation agrège les validateurs enregistrés
✓ Une modification rend la validation OUTDATED
✓ Les erreurs bloquantes empêchent READY/PUBLISH
✓ Un snapshot global peut être généré
✓ Le même état produit le même hash
✓ Une version READY peut être publiée
✓ Une version invalide ne peut pas être publiée
✓ Une seule publication courante existe par scope
✓ L’ancienne publication est historisée
✓ Un rollback conserve l’historique
✓ Le rollback crée une nouvelle opération de publication
✓ La comparaison entre versions fonctionne
✓ Les contributeurs Diff/Impact peuvent s’enregistrer
✓ Tenant/Application/Version isolation fonctionne
✓ IAM permissions fonctionnent
✓ Optimistic locking fonctionne
✓ Transactions fonctionnent
✓ ActivityEvent fonctionne
✓ Audit fonctionne
✓ Frontend PASS
✓ Backend PASS
✓ Integration tests PASS
```

---

## 128. Definition of Done — BM-CDC-02

```text
BM-CDC-02 — VERSION & LIFECYCLE MANAGER

ApplicationVersion Model       ✓
Database                       ✓
Migrations                     ✓
Version Numbering              ✓
Version Catalog                ✓
Create Version                 ✓
Clone Version                  ✓
Source Version                 ✓
Lifecycle                      ✓
Allowed Transitions            ✓
Version Editability            ✓
Published Immutability         ✓
Validator Registry             ✓
Validation Orchestrator        ✓
Validation Status              ✓
Completeness                   ✓
Validation Outdated            ✓
Version Diff                   ✓
Comparison                     ✓
Snapshot Registry              ✓
Global Snapshot                ✓
Snapshot Hash                  ✓
Snapshot Outdated              ✓
Publication Manager            ✓
Publication Transaction        ✓
Publication History            ✓
Single Current Publication     ✓
Supersede                      ✓
Rollback                       ✓
Rollback Candidates            ✓
Rollback Impact                ✓
Rollback Audit                 ✓
Version Selector               ✓
Version Context                ✓
Read-only propagation          ✓
Permissions                    ✓
IAM Context                    ✓
Tenant Isolation               ✓
Application Isolation          ✓
Version Isolation              ✓
Optimistic Locking             ✓
Transactions                   ✓
ActivityEvent                  ✓
Audit                          ✓
Frontend                       ✓
Backend                        ✓
API                            ✓
Loading / Empty / Error        ✓
Forbidden                      ✓
Conflict                       ✓
Responsive                     ✓
Frontend Tests                 ✓
Backend Tests                  ✓
Integration Tests              ✓
Documentation                  ✓
Demo                           ✓

STATUS
READY FOR BM-CDC-03+
```

---

## 129. Architecture finale

```text
                         APPLICATION
                              │
                              ▼
                     APPLICATION VERSION
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
       LIFECYCLE           VALIDATION          SNAPSHOT
          │                   │                   │
          └─────────────┬─────┴─────────────┬────┘
                        ▼                   ▼
                      READY              COMPARISON
                        │
                        ▼
                    PUBLICATION
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
          PUBLISHED            HISTORY
              │
              ▼
           ROLLBACK
              │
              ▼
      ACTIVE VERSION RESOLUTION
              │
        ┌─────┼─────┬─────┬─────┐
        ▼     ▼     ▼     ▼     ▼
      CDC-03 CDC-04 CDC-05 CDC-06 CDC-07
```

---

## 130. Règle finale

> **BM-CDC-02 gère le temps et l’état de l’Application : ses versions, leur évolution, leur validation, leur publication et leur historique.**

```text
BM-CDC-00
Comment le Business Manager fonctionne ?
        ↓
BM-CDC-01
Quelle Application existe ?
        ↓
BM-CDC-02
Quelle Version est en cours / publiée ?
        ↓
BM-CDC-03
Quelles données possède cette Version ?
        ↓
BM-CDC-04
Que sait faire cette Version ?
        ↓
BM-CDC-05
Comment l’utilisateur navigue dans cette Version ?
```
