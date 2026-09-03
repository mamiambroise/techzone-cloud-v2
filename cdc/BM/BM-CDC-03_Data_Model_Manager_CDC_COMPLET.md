# CAHIER DES CHARGES COMPLET ET DÉTAILLÉ — BUSINESS MANAGER

## BM-CDC-03 — Data Model Manager

### Moteur de conception, validation et évolution du modèle de données d’une ApplicationVersion

**Projet :** Techzone Cloud — Business Manager  
**Référence :** `BM-CDC-03`  
**Priorité :** 🔴 P0 — Core indispensable  
**Prérequis :** `BM-CDC-00 — Socle, Architecture & Contrats communs`, `BM-CDC-01 — Application Manager`, `BM-CDC-02 — Version & Lifecycle Manager`
**Socle transversal :** `BM-CDC-00 — Socle, Architecture & Contrats communs`  
**Type de livrable :** Backend + Base de données + Frontend + Validation + Tests + Documentation  
**Consommateurs principaux :** `BM-CDC-04 — Feature & Capability Manager`, `BM-CDC-05 — Menu Engine`, futurs Form/Page/Rule/Workflow Builders, Data Runtime et Adapters  
**Statut :** Spécification fonctionnelle de référence

> **Nomenclature officielle :** ce document reprend le contenu fonctionnel validé de l'ancien Data Model Manager `BM-P0.2`, désormais reclassé sous la référence **BM-CDC-03**.  
> `BM-CDC-01` fournit l'Application ; `BM-CDC-02` fournit l'ApplicationVersion et son cycle de vie ; `BM-CDC-03` définit le modèle de données de cette version.

---

# 1. Introduction

Le **Data Model Manager** constitue le deuxième grand bloc du Business Manager.

Après la création d’une Application et d’une `ApplicationVersion` dans BM-CDC-01 / BM-CDC-02, il doit permettre de **définir visuellement la structure des données nécessaires à cette application**, sans développer manuellement un modèle spécifique pour chaque métier.

Le Business Manager doit pouvoir représenter dynamiquement des métiers très différents.

```text
Application : Boutique
├── Product
├── Customer
├── Order
├── OrderLine
├── Payment
└── StockMovement
```

```text
Application : École
├── Student
├── Teacher
├── Class
├── Enrollment
├── Payment
└── Grade
```

Le moteur ne connaît pas spécifiquement `Product`, `Student`, `Vehicle` ou `Patient`.

Il connaît uniquement des concepts génériques :

```text
Entity
Field
Relation
Constraint
Index
Validation
Formula
```

C’est cette abstraction qui permet au Business Manager de construire différents types d’applications sans modifier son Core.

---

# 2. Objectif général

Le Data Model Manager doit permettre de construire visuellement :

```text
APPLICATION
     ↓
APPLICATION VERSION
     ↓
DATA MODEL
     ↓
ENTITIES
     ↓
FIELDS
     ↓
RELATIONS
     ↓
CONSTRAINTS
     ↓
VALIDATIONS
     ↓
COMPUTED FIELDS
```

Le système doit également permettre de :

- visualiser le modèle ;
- détecter les erreurs ;
- analyser les dépendances ;
- évaluer l’impact d’une modification ;
- comparer deux versions ;
- préparer les migrations ;
- classifier les données ;
- gérer leur scope ;
- tester un modèle en environnement isolé ;
- versionner le modèle ;
- préparer sa publication.

---

# 3. Résultat final attendu

L’utilisateur doit pouvoir effectuer entièrement depuis l’interface :

```text
Créer Application
→ Créer Version
→ Ouvrir Data Model
→ Créer Entity
→ Ajouter Fields
→ Créer Relations
→ Définir Constraints
→ Définir Validations
→ Ajouter Computed Fields
→ Visualiser Schema
→ Analyser Dependencies
→ Valider Schema
→ Comparer changements
→ Préparer Migration
→ Valider Version
→ Publication via BM-CDC-01 / BM-CDC-02
```

Aucune modification manuelle du code métier ne doit être nécessaire pour définir ces modèles.

---

# 4. Principe architectural fondamental

Le **Data Model Manager définit la structure** des données.

Le **Data Runtime / Data Platform** exécutera et stockera les données métier.

```text
BUSINESS MANAGER
       ↓
DATA MODEL MANAGER
       ↓ définit
DATA MODEL DEFINITION
       ↓
DATA RUNTIME / DATA PLATFORM
       ├── Storage
       ├── Query
       ├── Mutation
       ├── Validation runtime
       └── Transactions
```

Le Data Model Manager ne doit donc pas devenir lui-même le moteur complet d’exploitation des données métier.

---

# 5. Position dans Business Manager

```text
BUSINESS MANAGER
├── BM-CDC-01 / BM-CDC-02 Application & Version Manager
├── BM-CDC-03 Data Model Manager
│   ├── Entities
│   ├── Fields
│   ├── Relations
│   ├── Constraints
│   ├── Indexes
│   ├── Validations
│   ├── Computed Fields
│   ├── Schema
│   ├── Dependencies
│   ├── Migration
│   └── Versioning
├── BM-CDC-04 Feature & Capability Manager
├── BM-CDC-05 Menu Engine
├── Page Builder
├── Form Builder
├── Dashboard Builder
├── Rule Engine
├── Workflow Engine
└── Automation Engine
```

---

# 6. Relation avec BM-CDC-01 / BM-CDC-02

Chaque Data Model appartient obligatoirement à :

```text
application_id
application_version_id
```

Exemple :

```text
Boutique
├── Version 1.0.0 — PUBLISHED
│   └── Data Model V1
└── Version 1.1.0 — DRAFT
    └── Data Model V2
```

Une version publiée ne doit jamais être modifiée directement.

Toute évolution est préparée dans une nouvelle `ApplicationVersion`.

---

# 7. Blocs fonctionnels

| Bloc | Fonction |
|---|---|
| **Entity Manager** | Gestion des objets métier |
| **Field Builder** | Construction des champs |
| **Data Type Registry** | Catalogue extensible des types |
| **Relation Builder** | Relations entre entités |
| **Constraint Manager** | Contraintes structurelles |
| **Index Manager** | Gestion des indexes |
| **Validation Engine** | Règles de validation |
| **Computed Field Engine** | Champs calculés |
| **Schema Visualizer** | Diagramme visuel |
| **Dependency Graph** | Dépendances |
| **Impact Analysis** | Analyse d’impact |
| **Schema Validator** | Validation globale |
| **Schema Diff** | Comparaison de versions |
| **Migration Planner** | Préparation des migrations |
| **Migration Mapping** | Transformation source → cible |
| **Data Scope** | Portée des données |
| **Data Classification** | Sensibilité des données |
| **Templates** | Modèles réutilisables |
| **Sandbox** | Test isolé |
| **Sample Data** | Données de test |
| **Import / Export** | Portabilité des schémas |
| **Undo / Redo** | Annulation/restauration |
| **Autosave** | Sauvegarde automatique |
| **Concurrency** | Gestion des éditions simultanées |

---

# 8. Entity Manager

Une `Entity` représente un objet métier.

Exemples :

```text
Product
Customer
Order
Invoice
Student
Vehicle
Appointment
```

Une Entity doit posséder au minimum :

```text
id
application_id
application_version_id
code
name
plural_name
description
icon
status
scope
classification
created_by
created_at
updated_at
version
```

Actions :

```text
Create
Read
Update
Duplicate
Archive
Search
Filter
```

La suppression physique ne doit pas être l’action standard.

---

# 9. Règles de nommage

Chaque Entity possède :

```text
ID technique
Code technique
Nom affiché
Nom pluriel
```

Le `code` doit être :

- unique dans son contexte ;
- normalisé ;
- stable ;
- compatible techniquement.

Exemples :

```text
product
stock_movement
customer_address
```

---

# 10. Field Builder

Chaque Entity contient des Fields.

Exemple :

```text
Product
├── name
├── reference
├── description
├── purchase_price
├── selling_price
├── quantity
├── active
└── created_at
```

Un Field doit pouvoir définir :

```text
id
entity_id
code
label
description
type
required
unique
readonly
indexed
default_value
position
scope
classification
validation
configuration
version
```

Actions :

```text
Create
Read
Update
Reorder
Archive
Duplicate
```

---

# 11. Data Type Registry

Un registre central et extensible des types doit être prévu.

Types standards :

```text
TEXT
LONG_TEXT
INTEGER
BIG_INTEGER
DECIMAL
CURRENCY
PERCENTAGE
BOOLEAN
DATE
DATETIME
TIME
EMAIL
PHONE
URL
ENUM
MULTI_ENUM
UUID
SEQUENCE
FILE
IMAGE
JSON
RELATION
FORMULA
```

Chaque Data Type peut déclarer :

```text
code
label
category
configuration_schema
validation_capabilities
storage_hint
ui_hint
filter_capabilities
sortable
searchable
```

Le registre doit être extensible sans modifier le cœur des Entities.

---

# 12. Relation Builder

Relations supportées :

```text
ONE_TO_ONE
ONE_TO_MANY
MANY_TO_ONE
MANY_TO_MANY
```

Une relation doit définir au minimum :

```text
id
application_version_id
source_entity_id
target_entity_id
relation_type
source_label
target_label
required
delete_behavior
configuration
version
```

Delete behaviors :

```text
RESTRICT
CASCADE
SET_NULL
```

`CASCADE` doit être signalé comme potentiellement dangereux dans l’analyse d’impact.

---

# 13. Constraint Manager

Contraintes supportées :

```text
PRIMARY
UNIQUE
NOT_NULL
VALUE_RANGE
FORMAT
RELATION
COMPOSITE_UNIQUE
DECLARATIVE_CUSTOM
```

Les contraintes doivent être stockées comme des définitions déclaratives et validées avant sauvegarde.

---

# 14. Index Manager

Types :

```text
SIMPLE
UNIQUE
COMPOSITE
```

Le module configure les indexes mais ne doit pas devenir un optimiseur complet de base de données.

Chaque index doit pouvoir référencer un ou plusieurs Fields.

---

# 15. Validation Engine

Validations déclaratives minimum :

```text
required
min
max
minLength
maxLength
regex
email
url
allowedValues
precision
scale
```

Les validations sont stockées comme définitions, jamais comme code arbitraire.

Le système doit vérifier que chaque validation est compatible avec le type du Field.

---

# 16. Computed Field Engine

Exemples :

```text
subtotal = quantity * unit_price
full_name = first_name + " " + last_name
```

Le moteur doit :

- parser l’expression ;
- vérifier les références ;
- vérifier les types ;
- détecter les dépendances ;
- détecter les cycles ;
- refuser les expressions dangereuses.

L’exécution de code arbitraire fourni par l’utilisateur est interdite.

---

# 17. Field Groups

Permettre de regrouper des champs logiquement.

```text
ADDRESS
├── address_line
├── city
├── postal_code
└── country
```

Autres exemples :

```text
Contact Information
Dimensions
Pricing
Identity Information
```

---

# 18. Data Scope

Valeurs de base :

```text
GLOBAL
ORGANIZATION
SITE
USER
CONTEXT
```

Exemple :

```text
Product        → ORGANIZATION
Stock          → SITE
UserPreference → USER
```

Le Scope est une métadonnée exploitable ultérieurement par le Runtime et les règles d’autorisation.

---

# 19. Data Classification

Classification recommandée :

```text
PUBLIC
INTERNAL
CONFIDENTIAL
SENSITIVE
```

Cette classification pourra être exploitée par :

```text
IAM
Audit
Export
Reporting
AI
API
Runtime
```

---

# 20. Retention Policy

Prévoir les métadonnées :

```text
retention_duration
archive_policy
anonymization_policy
deletion_policy
```

Leur exécution pourra appartenir à une autre couche.

---

# 21. Schema Visualizer

Le modèle doit être visualisable graphiquement.

Fonctions attendues :

- zoom ;
- déplacement ;
- sélection ;
- ouverture d’une Entity ;
- affichage des relations ;
- filtres ;
- réorganisation du diagramme ;
- mise en évidence des dépendances.

---

# 22. Dependency Graph

Construire un graphe de dépendances.

Exemple :

```text
Product.price
├── Formula: OrderLine.subtotal
├── Form: ProductForm
├── Page: ProductDetails
├── Query: SalesReport
└── Rule: DiscountRule
```

Dans BM-CDC-03, le graphe doit déjà gérer les dépendances internes au Data Model.

Les autres moteurs enrichiront progressivement ce graphe.

---

# 23. Impact Analysis

Avant une modification structurante, le système doit indiquer ce qui risque d’être cassé.

Niveaux de risque :

```text
SAFE
WARNING
BREAKING
DATA_LOSS_RISK
```

Exemples :

```text
Ajouter champ nullable
→ SAFE

Renommer champ
→ WARNING

Changer TEXT → INTEGER
→ BREAKING

Supprimer champ contenant des données
→ DATA_LOSS_RISK
```

---

# 24. Schema Validator

Contrôles minimum :

```text
Entity codes
Field codes
Duplicate names
Field types
Relations
Constraints
Indexes
Validation definitions
Formula references
Circular dependencies
Scope consistency
Classification consistency
Broken references
```

Résultat :

```text
VALID
```

ou :

```text
INVALID
3 Errors
2 Warnings
```

Le résultat doit respecter le `ValidationResult` commun de BM-CDC-00.

---

# 25. Schema Diff

Deux versions doivent pouvoir être comparées.

Le système doit identifier au minimum :

```text
ENTITY_ADDED
ENTITY_UPDATED
ENTITY_RENAMED
ENTITY_ARCHIVED

FIELD_ADDED
FIELD_UPDATED
FIELD_RENAMED
FIELD_REMOVED
FIELD_TYPE_CHANGED

RELATION_ADDED
RELATION_UPDATED
RELATION_REMOVED

CONSTRAINT_ADDED
CONSTRAINT_REMOVED

INDEX_ADDED
INDEX_REMOVED

VALIDATION_CHANGED
FORMULA_CHANGED
```

---

# 26. Migration Planner

Flux :

```text
VERSION A
→ SCHEMA DIFF
→ IMPACT ANALYSIS
→ RISK ANALYSIS
→ MIGRATION PLAN
→ PREVIEW
→ VALIDATION
```

BM-CDC-03 **prépare** la migration.

L’exécution physique des migrations sur les données métier appartient au Data Runtime / Data Platform ou à l’Adapter concerné.

---

# 27. Migration Mapping

Pour les transformations complexes, le plan doit pouvoir définir :

```text
source
target
transformation
default
fallback
validation
```

Aucune transformation arbitraire non sécurisée ne doit être exécutée.

---

# 28. Versioning

Toutes les définitions appartiennent à :

```text
application_id
application_version_id
```

Une version publiée reste intacte pendant la préparation de la suivante.

```text
PUBLISHED
→ READ ONLY

DRAFT
→ EDITABLE
```

Le backend reste l’autorité sur cette règle.

---

# 29. Templates réutilisables

Prévoir des structures réutilisables :

```text
Customer
Address
Contact
Product
Money
Audit Fields
Location
```

Après application d’un template, la définition copiée appartient à l’Application.

Le template ne doit pas devenir une dépendance runtime obligatoire.

---

# 30. Sandbox

Un modèle DRAFT doit pouvoir être testé sans modifier la version publiée.

```text
Published Schema
→ reste intact

Draft Schema
→ Sandbox
→ Validation
→ Test
```

---

# 31. Sample Data

La Sandbox doit pouvoir utiliser des données de test clairement séparées des données réelles.

Les Sample Data ne doivent jamais être confondues avec les données de production.

---

# 32. Import / Export Schema

Import :

```text
Import
→ Parse
→ Validate
→ Preview
→ Detect Conflicts
→ Confirm
```

Aucun import silencieux dans une version publiée.

L’export doit inclure si nécessaire :

```text
schemaVersion
applicationVersion
Entities
Fields
Relations
Constraints
Indexes
Validations
Formulas
Scope
Classification
Metadata
```

---

# 33. Autosave / Undo / Redo

Le travail en DRAFT doit supporter :

- Autosave ;
- état `Saving` ;
- état `Saved` ;
- état `Unsaved changes` ;
- Undo ;
- Redo.

L’Autosave ne doit jamais déclencher une publication.

---

# 34. Gestion de concurrence

Utiliser au minimum une stratégie de version optimiste.

```text
expected_version = 12
database_version = 13

→ VERSION_CONFLICT
```

Le Frontend propose :

```text
Reload
Compare
Resolve
```

Aucun écrasement silencieux n’est autorisé.

---

# 35. Interface principale

Dans le Workspace :

```text
Application : Boutique

Overview
Data                 ← BM-CDC-03
Features
Menus
Pages
Forms
Dashboards
Rules
Workflows
Automations
Versions
Settings
```

Navigation Data :

```text
Overview
Entities
Relations
Schema
Dependencies
Validation
Changes
Migration
```

---

# 36. Data Dashboard

Le Dashboard BM-CDC-03 doit afficher au minimum :

```text
Nombre d’Entities
Nombre de Fields
Nombre de Relations
Nombre de Constraints
Nombre de Validations
Nombre de Formulas
Schema Status
Errors
Warnings
Changes since previous version
Migration risk
Last saved
```

Actions rapides :

```text
Create Entity
Open Schema
Validate
View Changes
Prepare Migration
```

---

# 37. Écran Entities

Fonctions :

- recherche ;
- filtre ;
- tri ;
- pagination ;
- création ;
- duplication ;
- archivage ;
- ouverture.

Chaque ligne peut afficher :

```text
Name
Code
Fields count
Relations count
Scope
Classification
Status
Updated At
```

---

# 38. Entity Workspace

```text
PRODUCT

General
Fields
Relations
Constraints
Indexes
Validation
Dependencies
```

---

# 39. Field Builder

Le Field Builder doit permettre :

- ajouter ;
- éditer ;
- réordonner ;
- supprimer/archiver selon policy ;
- définir Type ;
- définir Default ;
- définir Validation ;
- définir Constraints ;
- définir Scope ;
- définir Classification ;
- définir les options avancées.

---

# 40. Relation Builder UI

Configuration :

```text
Source
Target
Type
Required
Delete behavior
Labels
```

Le rendu doit être compréhensible visuellement.

La création d’une relation doit montrer les effets structuraux avant confirmation lorsque nécessaire.

---

# 41. Constraint / Index / Validation Editors

Le frontend doit fournir des éditeurs dédiés ou un panneau cohérent permettant :

```text
Create
Edit
Disable
Archive
Validate
```

Les options proposées doivent dépendre du type de Field ou d’Entity sélectionné.

---

# 42. Formula Editor

Le Formula Editor doit proposer :

```text
Expression input
Available fields
Type hints
Dependency preview
Validation result
Cycle warning
Preview
```

Il ne doit jamais exécuter du code arbitraire.

---

# 43. Schema Screen

Fonctions :

```text
View Entities
View Fields
View Relations
Zoom
Pan
Filter
Open Entity
Highlight Dependencies
Auto layout
```

---

# 44. Dependencies Screen

Afficher :

```text
Selected resource
Direct dependencies
Reverse dependencies
Dependency type
Source
Target
Risk
```

---

# 45. Validation Screen

Afficher :

```text
Schema Status
Completeness
Errors
Warnings
Infos
Target resource
Issue code
Message
Suggested correction
```

---

# 46. Changes Screen

Afficher les changements de la version courante et leur risque.

```text
Change
Target
Previous value
New value
Risk
Dependencies
Migration required
```

---

# 47. Migration Screen

Afficher un résumé :

```text
Safe Changes
Warnings
Breaking
Data Loss Risk
```

Puis le détail du plan :

```text
Step
Operation
Source
Target
Transformation
Risk
Validation
```

---

# 48. Responsabilités Backend

Le Backend doit gérer :

```text
Entity Domain
Field Domain
Data Type Registry
Relations
Constraints
Indexes
Validations
Computed Fields
Schema Validation
Dependency Graph
Impact Analysis
Schema Diff
Migration Plan
Migration Mapping
Scope
Classification
Templates
Versioning
Concurrency
Audit
Permissions
Transactions
API
Snapshot
```

---

# 49. Services Backend recommandés

```text
DataModelService
EntityService
FieldService
DataTypeRegistryService
RelationService
ConstraintService
IndexService
ValidationDefinitionService
FormulaService
SchemaService
SchemaValidatorService
DependencyGraphService
ImpactAnalysisService
SchemaDiffService
MigrationPlannerService
TemplateService
SandboxService
ImportExportService
DataModelSnapshotService
```

---

# 50. Repositories recommandés

```text
DataModelRepository
EntityRepository
FieldRepository
RelationRepository
ConstraintRepository
IndexRepository
ValidationRepository
FormulaRepository
MigrationPlanRepository
```

---

# 51. API — base recommandée

```text
/api/v1/business-manager/applications/:applicationId/versions/:versionId/data-model
```

---

# 52. API — Data Model

```text
GET /data-model
GET /data-model/overview
GET /data-model/schema
POST /data-model/validate
GET /data-model/dependencies
POST /data-model/impact-analysis
GET /data-model/changes
POST /data-model/migration-plan
GET /data-model/snapshot
```

---

# 53. API — Entities

```text
GET    /data-model/entities
POST   /data-model/entities
GET    /data-model/entities/:entityId
PATCH  /data-model/entities/:entityId
POST   /data-model/entities/:entityId/duplicate
POST   /data-model/entities/:entityId/archive
```

---

# 54. API — Fields

```text
GET    /data-model/entities/:entityId/fields
POST   /data-model/entities/:entityId/fields
GET    /data-model/fields/:fieldId
PATCH  /data-model/fields/:fieldId
POST   /data-model/fields/:fieldId/archive
POST   /data-model/entities/:entityId/fields/reorder
```

---

# 55. API — Relations

```text
GET    /data-model/relations
POST   /data-model/relations
GET    /data-model/relations/:relationId
PATCH  /data-model/relations/:relationId
POST   /data-model/relations/:relationId/archive
```

---

# 56. API — Constraints / Indexes / Validations

```text
GET/POST/PATCH /data-model/constraints
GET/POST/PATCH /data-model/indexes
GET/POST/PATCH /data-model/validations
```

Les endpoints détaillés peuvent être imbriqués sous Entity/Field lorsque le contexte l’exige.

---

# 57. API — Formulas

```text
GET    /data-model/formulas
POST   /data-model/formulas
PATCH  /data-model/formulas/:formulaId
POST   /data-model/formulas/:formulaId/validate
POST   /data-model/formulas/:formulaId/archive
```

---

# 58. API — Import / Export

```text
POST /data-model/import/preview
POST /data-model/import/apply
GET  /data-model/export
```

---

# 59. Contrat API

Toutes les APIs doivent réutiliser BM-CDC-00.

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
    "code": "SCHEMA_INVALID",
    "message": "Schema validation failed",
    "details": []
  },
  "meta": {
    "traceId": "..."
  }
}
```

---

# 60. Permissions

Permissions recommandées :

```text
business.data.read
business.data.create
business.data.update
business.data.archive

business.data.entity.manage
business.data.field.manage
business.data.relation.manage
business.data.constraint.manage
business.data.index.manage
business.data.validation.manage
business.data.formula.manage

business.data.schema.validate
business.data.schema.compare
business.data.dependencies.read
business.data.impact.read

business.data.migration.read
business.data.migration.prepare

business.data.template.use
business.data.export
business.data.import
```

---

# 61. Audit et Events

Actions à auditer :

```text
entity.create
entity.update
entity.archive
entity.clone

field.create
field.update
field.archive

relation.create
relation.update
relation.remove

constraint.change
index.change
validation.change
formula.change

schema.validate
schema.import
schema.export

migration.plan.create
```

Événements recommandés :

```text
data.entity.created
data.entity.updated
data.entity.archived

data.field.created
data.field.updated
data.field.archived

data.relation.created
data.relation.updated
data.relation.removed

data.schema.changed
data.schema.validated
data.migration.plan.created
```

---

# 62. Sécurité

Le module doit empêcher :

- injection de code via Formula ;
- expression arbitraire ;
- références cross-Application non autorisées ;
- modification d’une version publiée ;
- suppression silencieuse ;
- migration destructrice non confirmée ;
- modification concurrente silencieuse ;
- import de schéma non validé.

Le backend doit récupérer l’acteur et le tenant depuis IAM/Context.

---

# 63. Isolation Tenant / Application / Version

Chaque requête doit revalider :

```text
tenantId
applicationId
applicationVersionId
permission
version status
```

Une ressource d’une ApplicationVersion ne doit jamais être exposée dans une autre ApplicationVersion sans opération de clone/versioning explicite.

---

# 64. Transactions

Les opérations multi-écriture doivent être transactionnelles.

Exemples :

```text
Create Entity + default metadata
Create Relation + dependency update
Archive Field + dependency update
Import Schema
Apply Template
Create Migration Plan
```

---

# 65. Optimistic Locking

Toutes les définitions modifiables importantes doivent supporter :

```text
version
```

Conflit :

```text
409 VERSION_CONFLICT
```

---

# 66. Snapshot Data Model

Une version validée doit pouvoir produire un snapshot déterministe.

```text
DataModelSnapshot
│
├── schemaVersion
├── applicationId
├── applicationVersionId
├── entities[]
├── fields[]
├── relations[]
├── constraints[]
├── indexes[]
├── validations[]
├── formulas[]
├── scopes
├── classifications
├── generatedAt
└── snapshotHash
```

Ce snapshot sera consommable par les moteurs suivants et le Runtime.

---

# 67. Performance et scalabilité

Prévoir :

```text
incremental validation
dependency cache
schema snapshot
diff ciblé
pagination
lazy loading
graph filtering
```

L’architecture doit supporter à terme des modèles contenant quelques Entities comme plusieurs centaines.

Le Schema Visualizer doit filtrer les grands graphes.

---

# 68. Automatisation sans IA

Automatisations sûres :

```text
Create Entity
→ Generate ID metadata

Create Relation
→ Generate relation metadata

Change Field
→ Revalidate affected dependencies

Create Application Version
→ Copy Data Model definitions

Change Schema
→ Recalculate Diff
```

---

# 69. Assistance IA future

L’IA pourra proposer :

```text
Entities
Fields
Relations
Validations
Indexes
```

Règle obligatoire :

```text
AI PROPOSES
→ USER REVIEWS
→ SCHEMA VALIDATOR
→ USER CONFIRMS
→ SYSTEM APPLIES
```

L’IA ne publie jamais directement une modification structurelle.

---

# 70. Intégrations futures

Le Data Model Manager devient une source structurante pour :

```text
BM-CDC-04 Feature & Capability Manager
Form Builder
Page Builder
Query Engine
Rule Engine
Workflow Engine
Automation Engine
Reporting
AI
ERP Adapter
Data Runtime
Import / Export
```

Tous doivent consommer les IDs stables du Data Model au lieu de recréer leurs propres définitions.

---

# 71. Contrat avec BM-CDC-04

BM-CDC-04 doit pouvoir référencer :

```text
Entity ID
Field ID
Relation ID
Data Model Snapshot
```

Exemple :

```text
Capability: sale.create
requires:
  Entity Sale
  Entity SaleItem
  Relation Sale → SaleItem
```

BM-CDC-04 ne recrée pas les Entities de BM-CDC-03.

---

# 72. Contrat avec ERP Adapter

Le futur ERP Adapter pourra mapper :

```text
Business Entity
→ ERP Object

Business Field
→ ERP Field

Business Relation
→ ERP Relation
```

BM-CDC-03 définit le modèle générique ; l’Adapter définit la correspondance avec l’ERP.

---

# 73. Hors périmètre BM-CDC-03

Ne pas développer ici :

```text
Page Builder complet
Form Builder complet
Menu Manager
Dashboard Builder
Rule Engine complet
Workflow Engine complet
Automation Engine complet
Reporting Engine
Document Engine
Runtime métier complet
ERP Mapping complet
```

BM-CDC-03 expose les contrats nécessaires sans implémenter prématurément les autres moteurs.

---

# 74. Tests Backend

Tester au minimum :

```text
Entity CRUD
Field CRUD
Relation CRUD
Constraints
Indexes
Validation
Formula parser
Circular dependencies
Schema validation
Dependency graph
Impact analysis
Schema diff
Migration plan
Version isolation
Concurrency
Archive behavior
Transactions
Permissions
Audit
Snapshot determinism
Tenant isolation
Published version protection
```

---

# 75. Tests Frontend

Tester :

```text
Data Dashboard
Entity List
Create Entity
Edit Entity
Field Builder
Reorder Fields
Relation Builder
Constraint Editor
Index Editor
Validation Editor
Formula Editor
Schema Viewer
Validation Viewer
Dependency Viewer
Impact Analysis
Changes Viewer
Migration Preview
Autosave
Undo / Redo
Conflict handling
Read-only published version
Empty states
Error states
Responsive
```

---

# 76. Test E2E principal

Créer `Boutique`, puis :

```text
Product
Customer
Order
OrderLine
```

Créer :

```text
Customer 1:N Order
Order 1:N OrderLine
Product 1:N OrderLine
```

Valider et publier une version `1.0.0`.

Puis créer une version `1.1.0 DRAFT` et ajouter :

```text
Product.reference
Product.purchase_price
```

Le système doit produire :

```text
Schema Diff
Impact Analysis
Migration Plan
Validation
```

tout en conservant la version `1.0.0` intacte.

---

# 77. Test critique — Breaking Change

Supprimer `Product.price` alors qu’il est utilisé par une Formula doit produire :

```text
BREAKING
Dependency detected
Confirmation / migration required
```

---

# 78. Test critique — Circular Dependency

```text
A = B + 1
B = A + 1
```

doit produire :

```text
CIRCULAR_DEPENDENCY
Schema INVALID
```

---

# 79. Test critique — Concurrence

Une modification basée sur une version obsolète doit retourner :

```text
409 VERSION_CONFLICT
```

---

# 80. Test critique — Published Version

```text
ApplicationVersion 1.0.0
status = PUBLISHED

PATCH Entity
→ DENIED

VERSION_NOT_EDITABLE
```

---

# 81. Test critique — Cross Tenant

```text
Tenant A
→ Application A

Tenant B
→ Application B

Context Tenant A
→ access Application B Data Model
→ DENIED
```

---

# 82. Répartition Team 3 — Avotra

## Avotra — Frontend fonctionnel

Responsabilités principales :

```text
Data Dashboard
Entity List
Entity Editor
Field Builder
Constraint Editor
Validation Editor
Formula Editor UI
Forms and dialogs
Search / filters
Loading / Empty / Error
Responsive
API integration
Validation result display
Impact result display
```

Avotra porte principalement l’expérience utilisateur fonctionnelle du Data Model Manager.

---

# 83. Répartition Team 3 — Belardo

## Belardo — Frontend Architecture & Visual Modeling

Responsabilités principales :

```text
Frontend architecture BM-CDC-03
Data Workspace layout
Shared builder components
Schema Visualizer
Relation visual rendering
Dependency Viewer
Impact Viewer architecture
Schema Diff Viewer
Migration Preview
State management
Autosave architecture
Undo / Redo
Conflict resolution UI
Performance large schemas
Frontend test foundation
```

Belardo porte principalement l’architecture frontend et les interfaces de modélisation visuelle complexes.

---

# 84. Répartition Team 3 — Ranja

## Ranja — Backend

Responsabilités principales :

```text
Data Model Domain
Entity Domain
Field Domain
Data Type Registry
Relation Domain
Constraint Service
Index Service
Validation Engine
Formula Parser
Dependency Graph
Impact Analysis
Schema Validator
Schema Diff
Migration Planner
Migration Mapping
Repositories
Database migrations
API
Transactions
IAM / Context
Tenant isolation
Version isolation
Optimistic locking
Activity / Audit
Snapshot
Backend tests
```

Ranja reste l’autorité backend sur les règles de structure et de validation.

---

# 85. Coordination Frontend / Backend

Les trois développeurs doivent valider ensemble :

```text
Entity Contract
Field Contract
Relation Contract
Validation Contract
Schema Contract
Dependency Contract
Impact Contract
Diff Contract
Migration Plan Contract
Error codes
API payloads
Read-only rules
Conflict handling
```

Le frontend ne doit pas recréer les règles critiques du Schema Validator.

---

# 86. Definition of Done Backend

Le Backend est DONE lorsque sont opérationnels :

```text
Entity
Fields
Types
Relations
Constraints
Indexes
Validations
Computed Fields
Schema Validation
Dependencies
Impact Analysis
Schema Diff
Migration Plan
Scope
Classification
Versioning
Concurrency
Audit
Permissions
Transactions
Snapshot
Tests
```

---

# 87. Definition of Done Frontend

Le Frontend est DONE lorsque sont opérationnels :

```text
Data Dashboard
Entity Manager
Field Builder
Relation Builder
Constraint Editor
Index Editor
Validation Editor
Formula Editor
Schema Viewer
Validation Viewer
Dependency Viewer
Impact Viewer
Changes Viewer
Migration Preview
Templates
Sandbox
Autosave
Undo / Redo
Conflict UI
Loading / Empty / Error
Read-only mode
```

---

# 88. Definition of Done globale

BM-CDC-03 est terminé seulement lorsque le parcours suivant fonctionne réellement :

```text
Application
→ Application Version
→ Create Entity
→ Create Fields
→ Create Relations
→ Configure Constraints
→ Configure Validations
→ Create Formula
→ Visualize Schema
→ Validate
→ Analyze Dependencies
→ Modify Schema
→ Compare Changes
→ Analyze Impact
→ Prepare Migration
→ Validate Version
```

---

# 89. Livrables attendus

```text
Backend
├── Domain
├── Services
├── Repositories
├── APIs
├── Validation Engine
├── Dependency Engine
├── Diff Engine
├── Migration Planner
├── Snapshot
└── Tests

Frontend
├── Data Dashboard
├── Entity Manager
├── Field Builder
├── Relation Builder
├── Constraint / Index / Validation Editors
├── Formula Editor
├── Schema Viewer
├── Dependency Viewer
├── Impact Viewer
├── Validation
├── Changes
├── Migration Preview
└── Tests

Database
├── Data Model metadata schema
├── migrations
├── constraints
└── indexes

Documentation
├── API
├── architecture
├── data contracts
├── validation rules
├── migration rules
└── acceptance tests
```

---

# 90. Critères d’acceptation

Le module est accepté si l’utilisateur peut :

1. créer plusieurs Entities depuis l’interface ;
2. ajouter et configurer leurs Fields ;
3. créer des Relations ;
4. configurer Constraints et Validations ;
5. créer un champ calculé ;
6. visualiser le Schema ;
7. détecter une Relation invalide ;
8. détecter une dépendance circulaire ;
9. connaître l’impact d’une modification ;
10. comparer deux versions ;
11. détecter un changement dangereux ;
12. générer un Migration Plan ;
13. conserver intacte la version publiée ;
14. travailler sur une version DRAFT ;
15. gérer un conflit de modification ;
16. retrouver les actions importantes dans l’Audit ;
17. générer un snapshot stable du Data Model ;
18. fournir à BM-CDC-04 des références Entity/Field stables ;
19. respecter l’isolation Tenant/Application/Version ;
20. réaliser le parcours E2E sans modification manuelle du code métier.

---

# 91. Règle finale d’architecture

> **Une Application publiée ne contient pas un Data Model mutable. Elle référence une version immuable de sa définition. Toute évolution est préparée dans une nouvelle ApplicationVersion.**

```text
APPLICATION
     │
     ├── VERSION 1.0.0 — PUBLISHED
     │       └── DATA MODEL SNAPSHOT
     │
     └── VERSION 1.1.0 — DRAFT
             ├── Entities
             ├── Fields
             ├── Relations
             ├── Constraints
             ├── Validations
             └── Formulas
                     ↓
               Schema Validation
                     ↓
               Dependency Analysis
                     ↓
                 Schema Diff
                     ↓
                Impact Analysis
                     ↓
                Migration Plan
                     ↓
                  VALIDATE
                     ↓
             BM-CDC-02 PUBLICATION
```

---

# 92. Architecture finale

```text
                         APPLICATION VERSION
                                │
                                ▼
                       BM-CDC-03 DATA MODEL MANAGER
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
       ENTITIES               FIELDS              RELATIONS
          │                     │                     │
          └──────────────┬──────┴──────────────┬─────┘
                         ▼                     ▼
                  CONSTRAINTS             VALIDATIONS
                         │                     │
                         └──────────┬──────────┘
                                    ▼
                              COMPUTED FIELDS
                                    │
                                    ▼
                                SCHEMA
                                    │
                 ┌──────────────────┼──────────────────┐
                 ▼                  ▼                  ▼
            VALIDATOR        DEPENDENCY GRAPH     SCHEMA DIFF
                 │                  │                  │
                 └──────────────┬───┴──────────────┬──┘
                                ▼                  ▼
                         IMPACT ANALYSIS      MIGRATION PLAN
                                │                  │
                                └────────┬─────────┘
                                         ▼
                                  DATA MODEL SNAPSHOT
                                         │
                  ┌──────────────────────┼──────────────────────┐
                  ▼                      ▼                      ▼
                BM-CDC-04               DATA RUNTIME           ERP ADAPTER
          Feature/Capability
```

---

# 93. Résultat final

Avec BM-CDC-03, le Business Manager ne dispose plus d’un simple éditeur de tables.

Il dispose d’un **moteur générique de modélisation de données**, capable de :

```text
DEFINE
VALIDATE
VISUALIZE
VERSION
COMPARE
ANALYZE
PREPARE MIGRATION
SNAPSHOT
```

sans coder séparément le modèle de chaque métier.

Le résultat de BM-CDC-03 devient une source de définition stable pour **BM-CDC-04 Feature & Capability Manager**, les futurs Builders, le Runtime et les Adapters.
