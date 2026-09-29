# PM-CDC-03 — Pack Version Manager

**Projet :** Techzone Cloud  
**Module :** Pack Manager  
**Équipe :** Team 3 — Business Manager, Pack & UI Runtime  
**Référence :** PM-CDC-03  
**Version :** 1.0  
**Statut :** Cahier des charges fonctionnel et technique  
**Dépendances obligatoires :** PM-CDC-00 — Socle, Architecture & Contrats communs ; PM-CDC-02 — Pack Definition Manager  
**Stack cible :** React · NestJS · Prisma · PostgreSQL

---

## 1. Objet

PM-CDC-03 définit le **Pack Version Manager**, responsable du cycle de vie, de la création, du clonage, de la comparaison, de la validation, de la préparation à la publication, de la publication et de l’historique des versions d’un pack.

Il répond à la question :

> **Comment faire évoluer un pack dans le temps sans casser les versions déjà publiées ?**

PM-CDC-03 est la couche de gouvernance des versions.

---

## 2. Position dans le Pack Manager

```text
PACK MANAGER
│
├── Vue d’ensemble        → PM-CDC-01
├── Packs                 → PM-CDC-02
├── Versions de packs     → PM-CDC-03
├── Modules               → PM-CDC-04
├── Features              → PM-CDC-05
├── Dépendances           → PM-CDC-06
└── Règles & Conditions   → PM-CDC-07
```

Flux principal :

```text
PACK
 ↓
PACK VERSION
 ↓
MODULES
 ↓
FEATURES / CAPABILITIES
 ↓
DEPENDENCIES
 ↓
RULES / CONDITIONS
 ↓
VALIDATION
 ↓
SNAPSHOT
 ↓
MANIFEST
 ↓
PUBLICATION
```

---

## 3. Responsabilité fonctionnelle

PM-CDC-03 doit permettre de :

- créer une nouvelle version ;
- créer une version depuis zéro ;
- cloner une version existante ;
- gérer le numéro de version ;
- consulter les versions d’un pack ;
- comparer deux versions ;
- afficher les changements ;
- lancer une validation ;
- visualiser les erreurs ;
- préparer une version à la publication ;
- publier une version ;
- rendre les versions publiées immuables ;
- marquer une version comme superseded/deprecated ;
- archiver une version ;
- générer et conserver un snapshot ;
- générer le Pack Manifest ;
- consulter l’historique.

---

## 4. Ce que PM-CDC-03 ne gère pas directement

PM-CDC-03 ne doit pas implémenter lui-même :

- la définition détaillée des modules ;
- le catalogue de features/capabilities ;
- la résolution métier détaillée des dépendances ;
- l’éditeur des règles ;
- l’exécution du Pack Runtime.

Il orchestre ces domaines et agrège leur état pour gérer la version.

---

## 5. Modèle PackVersion

Champs recommandés :

```text
id
tenantId
packId
versionNumber
label
description
status
validationStatus
manifestStatus
sourceVersionId
changeType
releaseNotes
snapshotHash
manifestHash
createdAt
createdBy
updatedAt
updatedBy
validatedAt
validatedBy
publishedAt
publishedBy
deprecatedAt
archivedAt
rowVersion
```

---

## 6. Numéro de version

Convention recommandée :

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

- unique par pack ;
- immuable après publication ;
- validé côté backend ;
- compatible avec la stratégie de versioning de PM-CDC-00.

---

## 7. Change Type

Types :

```text
MAJOR
MINOR
PATCH
```

Utilité :

- guider l’utilisateur ;
- calculer une version suggérée ;
- signaler les breaking changes ;
- documenter la nature de l’évolution.

---

## 8. Lifecycle

États recommandés :

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
 ↓
SUPERSEDED
 ↓
DEPRECATED
 ↓
ARCHIVED
```

États exceptionnels :

```text
INVALID
ERROR
```

---

## 9. Règles de transition

Exemples :

```text
DRAFT → CONFIGURING
CONFIGURING → VALIDATING
VALIDATING → READY
VALIDATING → INVALID
INVALID → CONFIGURING
READY → PUBLISHED
PUBLISHED → SUPERSEDED
PUBLISHED → DEPRECATED
SUPERSEDED → ARCHIVED
DEPRECATED → ARCHIVED
```

Les transitions doivent être contrôlées côté backend.

---

## 10. Version publiée immuable

Une version `PUBLISHED` est en lecture seule.

Interdiction de modifier directement :

- modules ;
- features ;
- capabilities ;
- dépendances ;
- règles ;
- configuration ;
- numéro de version ;
- snapshot ;
- manifest.

Pour modifier :

```text
PUBLISHED
 ↓ CLONE
Nouvelle version DRAFT
```

---

## 11. Création d’une version

Modes :

```text
EMPTY
FROM_PREVIOUS
FROM_SPECIFIC_VERSION
FROM_TEMPLATE
```

Création minimale :

```text
packId
versionNumber
label
description
changeType
```

---

## 12. Clonage d’une version

Flux :

```text
Choisir version source
 ↓
Analyser contenu
 ↓
Choisir nouvelle version
 ↓
Cloner configuration
 ↓
Réinitialiser états techniques
 ↓
Créer DRAFT
```

Ne pas recopier tels quels :

```text
id
publishedAt
publishedBy
validatedAt
validationStatus=VALID
manifestHash
snapshotHash
```

La nouvelle version doit repartir avec :

```text
status = DRAFT
validationStatus = NOT_RUN
manifestStatus = NOT_GENERATED
```

---

## 13. Version suggérée

Le backend peut proposer automatiquement :

```text
PATCH → 1.2.3 devient 1.2.4
MINOR → 1.2.3 devient 1.3.0
MAJOR → 1.2.3 devient 2.0.0
```

Le calcul doit rester déterministe.

---

## 14. Liste des versions

Colonnes recommandées :

```text
Version
Label
Status
Validation
Manifest
Change Type
Created At
Published At
Auteur
Actions
```

Actions :

```text
Voir
Modifier
Comparer
Cloner
Valider
Générer Manifest
Publier
Déprécier
Archiver
```

Les actions visibles dépendent du statut et des permissions.

---

## 15. Fiche Version

Sections :

```text
Résumé
Configuration
Modules
Features
Capabilities
Dépendances
Règles
Validation
Manifest
Snapshot
Diff
Historique
Audit
```

---

## 16. Comparaison de versions

L’utilisateur doit pouvoir comparer :

```text
Version A
vs
Version B
```

Le système doit identifier :

```text
ADDED
REMOVED
CHANGED
UNCHANGED
```

Objets comparés :

- metadata version ;
- modules ;
- features ;
- capabilities ;
- dépendances ;
- règles ;
- configuration.

---

## 17. Diff fonctionnel

Exemple :

```text
+ Module Inventory
+ Feature stock.multi_warehouse
~ Dependency catalog >=1 → >=2
- Feature stock.legacy_export
```

Le diff doit être compréhensible visuellement.

---

## 18. Breaking Change Detection

Le système doit signaler les changements potentiellement cassants.

Exemples :

- suppression d’une capability ;
- suppression d’un module requis ;
- modification incompatible d’une dépendance ;
- suppression d’une feature utilisée ;
- modification d’un contrat exposé ;
- hausse d’une version minimale requise.

Statuts :

```text
NONE
POTENTIAL
CONFIRMED
```

---

## 19. Release Notes

Chaque version publiable doit pouvoir contenir :

```text
Résumé
Nouveautés
Corrections
Breaking Changes
Migration Notes
Known Issues
```

La publication peut rendre certains champs obligatoires si `changeType = MAJOR`.

---

## 20. Validation

L’action :

```http
POST /api/pack-manager/versions/:id/validate
```

doit déclencher une validation orchestrée.

Contrôles :

```text
PackVersion
Modules
Features
Capabilities
Dependencies
Rules
Configuration
Contract Compatibility
Security
Manifest Readiness
```

---

## 21. Validation Status

```text
NOT_RUN
RUNNING
VALID
INVALID
OUTDATED
ERROR
```

Toute modification significative après validation :

```text
VALID → OUTDATED
```

---

## 22. Validation Report

Le rapport doit contenir :

```text
validationId
versionId
status
startedAt
finishedAt
duration
errors[]
warnings[]
infos[]
summary
traceId
```

Chaque problème :

```text
code
severity
domain
resourceType
resourceId
message
path
suggestedAction
```

---

## 23. Severity

```text
ERROR
WARNING
INFO
```

Règle :

- ERROR bloque `READY` ;
- WARNING n’empêche pas forcément ;
- INFO est informatif.

---

## 24. Passage à READY

Une version peut devenir `READY` si :

```text
validationStatus = VALID
AND
aucune ERROR
AND
dépendances bloquantes résolues
AND
règles valides
AND
permissions disponibles
```

---

## 25. Snapshot

Avant publication, créer un snapshot complet et déterministe.

Le snapshot doit représenter tout ce qui influence le comportement du pack.

Exemple conceptuel :

```text
Pack Identity
Pack Version
Modules
Features
Capabilities
Dependencies
Rules
Configuration
Contract Versions
```

---

## 26. Snapshot Hash

Hash recommandé :

```text
SHA-256
```

Principe :

```text
Canonical Snapshot
 ↓
SHA-256
 ↓
snapshotHash
```

Le même contenu logique doit produire le même hash.

---

## 27. Pack Manifest

Le manifest est construit depuis une version validée.

Statuts :

```text
NOT_GENERATED
GENERATING
VALID
INVALID
OUTDATED
ERROR
```

---

## 28. Génération Manifest

Action :

```http
POST /api/pack-manager/versions/:id/manifest
```

Flux :

```text
Check Version
 ↓
Check Validation
 ↓
Resolve Dependencies
 ↓
Build Canonical Manifest
 ↓
Validate Contract
 ↓
Calculate Hash
 ↓
Store
```

---

## 29. Publication

Action :

```http
POST /api/pack-manager/versions/:id/publish
```

Conditions minimales :

```text
status = READY
validationStatus = VALID
manifestStatus = VALID
validation fresh
snapshot exists
manifestHash exists
snapshotHash exists
actor authorized
```

---

## 30. Transaction de publication

```text
BEGIN
 ↓
Recheck Permissions
 ↓
Recheck Current State
 ↓
Lock Version
 ↓
Generate/Verify Snapshot
 ↓
Generate/Verify Manifest
 ↓
Set PUBLISHED
 ↓
Set publishedAt/by
 ↓
Update Previous Version if needed
 ↓
Audit
 ↓
Outbox
 ↓
COMMIT
```

En cas d’échec critique :

```text
ROLLBACK
```

---

## 31. Version précédente

Lors d’une publication, une version PUBLISHED précédente peut devenir :

```text
SUPERSEDED
```

Cette transition doit être contrôlée et historisée.

---

## 32. Dépréciation

Une version peut devenir `DEPRECATED`.

Elle reste disponible pour compatibilité mais :

- ne doit plus être recommandée ;
- doit afficher un avertissement ;
- peut contenir une date de fin de support.

---

## 33. Archivage

Archiver une version seulement si :

- elle n’est plus utilisée de façon bloquante ;
- l’analyse d’impact est correcte ;
- les droits sont suffisants.

Une version publiée archivée conserve son historique, snapshot et manifest.

---

## 34. Rollback conceptuel

Le Pack Version Manager ne modifie pas rétroactivement une version publiée.

Un rollback de produit consiste à sélectionner/réactiver une version publiée compatible via la couche de publication/déploiement.

```text
2.0.0 PUBLISHED
 ↓ problème
Sélectionner 1.9.0
 ↓
Publication/Deployment
```

Le Pack Manager fournit les artefacts immuables nécessaires.

---

## 35. API — Liste

```http
GET /api/pack-manager/packs/:packId/versions
```

Filtres :

```text
status?
validationStatus?
manifestStatus?
changeType?
search?
cursor?
limit?
```

---

## 36. API — Détail

```http
GET /api/pack-manager/versions/:id
```

---

## 37. API — Création

```http
POST /api/pack-manager/packs/:packId/versions
```

Exemple :

```json
{
  "versionNumber": "1.2.0",
  "label": "Inventory improvements",
  "description": "Ajout du multi-entrepôt",
  "changeType": "MINOR",
  "sourceVersionId": "version_110"
}
```

---

## 38. API — Modification

```http
PATCH /api/pack-manager/versions/:id
```

Uniquement sur version mutable.

Inclure `rowVersion`.

---

## 39. API — Clone

```http
POST /api/pack-manager/versions/:id/clone
```

---

## 40. API — Compare

```http
GET /api/pack-manager/versions/compare?left=:idA&right=:idB
```

---

## 41. API — Validation

```http
POST /api/pack-manager/versions/:id/validate
GET  /api/pack-manager/versions/:id/validation
```

---

## 42. API — Manifest

```http
POST /api/pack-manager/versions/:id/manifest
GET  /api/pack-manager/versions/:id/manifest
```

---

## 43. API — Publish

```http
POST /api/pack-manager/versions/:id/publish
```

Idempotency Key recommandée.

---

## 44. API — Deprecate / Archive

```http
POST /api/pack-manager/versions/:id/deprecate
POST /api/pack-manager/versions/:id/archive
```

---

## 45. Permissions IAM

Permissions recommandées :

```text
pack.version.read
pack.version.create
pack.version.update
pack.version.clone
pack.version.compare
pack.version.validate
pack.version.generate_manifest
pack.version.publish
pack.version.deprecate
pack.version.archive
```

---

## 46. Multi-tenant

Toutes les versions héritent du scope du pack.

Règles :

- pack du tenant obligatoire ;
- version du même tenant ;
- références croisées vérifiées ;
- impossible de cloner vers un tenant arbitraire sans procédure explicite.

---

## 47. Optimistic Locking

Utiliser :

```text
rowVersion
```

Modification :

```text
WHERE id = ? AND rowVersion = ?
```

Si aucune ligne modifiée :

```text
409 CONFLICT
PACK_VERSION_CONFLICT
```

---

## 48. Audit

Événements :

```text
pack.version.created
pack.version.updated
pack.version.cloned
pack.version.validation_started
pack.version.validated
pack.version.manifest_generated
pack.version.published
pack.version.superseded
pack.version.deprecated
pack.version.archived
```

---

## 49. Outbox Events

Événements utiles :

```text
pack.version.created
pack.version.ready
pack.version.published
pack.version.deprecated
pack.version.archived
pack.manifest.generated
```

Consommateurs :

- PM-CDC-01 ;
- Pack Runtime ;
- Publication / Deployment ;
- Observability ;
- API / Integration.

---

## 50. Codes d’erreur

```text
PACK_VERSION_NOT_FOUND
PACK_VERSION_ALREADY_EXISTS
PACK_VERSION_INVALID_NUMBER
PACK_VERSION_IMMUTABLE
PACK_VERSION_CONFLICT
PACK_VERSION_INVALID_STATE
PACK_VERSION_VALIDATION_FAILED
PACK_VERSION_VALIDATION_OUTDATED
PACK_VERSION_MANIFEST_INVALID
PACK_VERSION_PUBLICATION_BLOCKED
PACK_VERSION_ARCHIVE_BLOCKED
PACK_VERSION_BREAKING_CHANGE
```

---

## 51. Frontend React

Structure indicative :

```text
src/features/pack-manager/versions/
├── pages/
├── components/
├── forms/
├── compare/
├── validation/
├── manifest/
├── hooks/
├── services/
├── types/
└── tests/
```

Composants :

```text
VersionList
VersionStatusBadge
VersionForm
VersionCloneDialog
VersionCompare
VersionDiffViewer
ValidationReport
ManifestViewer
PublishDialog
DeprecateDialog
ArchiveDialog
```

---

## 52. UX — Création

```text
Créer Version
 ↓
Choisir Mode
 ↓
Numéro / Change Type
 ↓
Source éventuelle
 ↓
Preview
 ↓
Créer DRAFT
```

---

## 53. UX — Publication

```text
Version READY
 ↓
Review validation
 ↓
Review diff
 ↓
Review breaking changes
 ↓
Review release notes
 ↓
Confirm publication
 ↓
Publish
```

Le bouton Publier doit afficher clairement les blocages.

---

## 54. UX — Comparaison

Vue recommandée :

```text
LEFT VERSION       RIGHT VERSION
1.1.0              1.2.0
---------------------------------
Modules      +1
Features     +3 / -1
Dependencies ~2
Rules        +1
Breaking     1 potential
```

Puis détails par section.

---

## 55. États UI

```text
LOADING
READY
EMPTY
ERROR
FORBIDDEN
READ_ONLY
SAVING
VALIDATING
GENERATING_MANIFEST
PUBLISHING
CONFLICT
```

---

## 56. Backend NestJS

Structure indicative :

```text
src/pack-manager/versions/
├── versions.controller.ts
├── versions.service.ts
├── versions.repository.ts
├── version-lifecycle.service.ts
├── version-clone.service.ts
├── version-compare.service.ts
├── validation-orchestrator.service.ts
├── snapshot.service.ts
├── manifest.service.ts
├── publication.service.ts
├── dto/
├── domain/
└── tests/
```

---

## 57. Prisma — Modèle conceptuel

```text
PackVersion
├── id
├── tenantId
├── packId
├── versionNumber
├── label
├── description
├── status
├── validationStatus
├── manifestStatus
├── changeType
├── sourceVersionId
├── releaseNotes
├── snapshotHash
├── manifestHash
├── createdAt/by
├── updatedAt/by
├── validatedAt/by
├── publishedAt/by
├── deprecatedAt
├── archivedAt
└── rowVersion
```

Relations :

```text
PackVersion
├── Modules[]
├── Features[]
├── Dependencies[]
├── Rules[]
├── Validations[]
├── Snapshot
└── Manifest
```

---

## 58. Contraintes DB

Prévoir :

```text
UNIQUE(packId, versionNumber)
INDEX(packId, status)
INDEX(validationStatus)
INDEX(manifestStatus)
INDEX(publishedAt)
INDEX(sourceVersionId)
```

---

## 59. Performance

Prévoir :

- pagination ;
- chargement des résumés ;
- détails à la demande ;
- génération diff optimisée ;
- génération snapshot asynchrone si volumineuse ;
- pas de N+1 ;
- cache des manifests immuables.

---

## 60. Jobs asynchrones

Les traitements lourds peuvent passer par jobs :

```text
VALIDATE_VERSION
GENERATE_SNAPSHOT
GENERATE_MANIFEST
COMPARE_LARGE_VERSIONS
```

Chaque job doit être :

- traçable ;
- idempotent si possible ;
- retryable ;
- observable.

---

## 61. Mock / Simulation

PM-CDC-03 doit être développable même si PM-CDC-04 à 07 ne sont pas finalisés.

Contrats intermédiaires :

```text
ModuleSummaryProvider
FeatureSummaryProvider
DependencyValidationProvider
RuleValidationProvider
```

Chaque contrat :

```text
Contract v1 🔒
├── Mock
└── Real
```

---

## 62. Contract Tests

Tester :

- contrat de résumé module ;
- contrat feature/capability ;
- contrat dependency validation ;
- contrat rule validation ;
- Pack Manifest Contract ;
- snapshot contract ;
- erreurs ;
- versioning.

---

## 63. Tests unitaires

- transitions lifecycle ;
- version suggestion ;
- immutabilité ;
- clone ;
- diff ;
- breaking change detection ;
- validation state ;
- publication guard ;
- hash canonical.

---

## 64. Tests intégration

- Prisma ;
- unique version ;
- optimistic locking ;
- transactions publication ;
- audit ;
- outbox ;
- tenant isolation ;
- snapshot/manifest persistence.

---

## 65. Tests E2E web

```text
Ouvrir Pack
→ Versions
→ Créer 1.1.0 depuis 1.0.0
→ Modifier contenu
→ Comparer 1.0.0 vs 1.1.0
→ Valider
→ Corriger éventuelles erreurs
→ Générer Manifest
→ Publier
→ Vérifier version READ_ONLY
```

---

## 66. Critères d’acceptation

PM-CDC-03 est conforme si :

- création de version fonctionnelle ;
- clonage fonctionnel ;
- version unique ;
- lifecycle contrôlé ;
- versions publiées immuables ;
- comparaison disponible ;
- breaking changes signalés ;
- validation orchestrée ;
- snapshot déterministe ;
- manifest généré ;
- publication transactionnelle ;
- audit/outbox ;
- IAM ;
- tenant isolation ;
- tests passants.

---

## 67. Definition of Done

```text
PM-CDC-03 DONE
├── PackVersion Model
├── Version List
├── Version Detail
├── Create
├── Clone
├── Version Suggestion
├── Lifecycle
├── Compare
├── Diff
├── Breaking Change Detection
├── Validation
├── Snapshot
├── Manifest
├── Publication
├── Deprecation
├── Archive
├── IAM
├── Tenant Isolation
├── Optimistic Locking
├── Audit
├── Outbox
├── Mock Contracts
├── Contract Tests
├── Unit Tests
├── Integration Tests
└── E2E Web
```

---

## 68. Résultat attendu

À la fin de PM-CDC-03, chaque pack peut évoluer de façon maîtrisée :

```text
PACK
 ↓
VERSION DRAFT
 ↓
CONFIGURATION
 ↓
VALIDATION
 ↓
READY
 ↓
SNAPSHOT
 ↓
MANIFEST
 ↓
PUBLISHED 🔒
```

> **PM-CDC-03 garantit que l’évolution d’un pack est versionnée, comparable, validée, auditable, publiable et reproductible sans modifier les versions déjà publiées.**
