# CAHIER DES CHARGES COMPLET ET DÉTAILLÉ — BUSINESS MANAGER

## BM-CDC-06 — Configuration & Metadata Manager

### Gestion centralisée des paramètres, métadonnées, catégories, tags, schémas de configuration et valeurs versionnées

**Projet :** Techzone Cloud — Business Manager  
**Référence :** `BM-CDC-06`  
**Nom :** Configuration & Metadata Manager  
**Priorité :** 🔴 P0 — Core transversal  
**Type de livrable :** Backend + Base de données + Frontend + Validation + Resolver + Snapshot + Tests + Documentation  
**Prérequis :** `BM-CDC-00 — Socle, Architecture & Contrats communs`, `BM-CDC-01 — Application Manager`, `BM-CDC-02 — Version & Lifecycle Manager`  
**Dépendances fonctionnelles :** `BM-CDC-03 — Data Model Manager`, `BM-CDC-04 — Feature & Capability Manager`, `BM-CDC-05 — Menu Engine & Navigation Manager` lorsque leurs ressources consomment des métadonnées ou configurations  
**Consommateurs principaux :** `BM-CDC-07 — Integration, Contracts & Runtime Bridge`, `BM-CDC-08 — Validation, Tests & Quality Manager`, Pack Manager, Pack Runtime, Application/UI Runtime  
**Statut :** Spécification fonctionnelle de référence

---

# 1. Finalité

BM-CDC-06 doit fournir le **moteur central de configuration et de métadonnées** du Business Manager.

Il répond à la question :

> **Quels paramètres, métadonnées, catégories, tags et valeurs configurables s’appliquent à une Application ou à une ApplicationVersion, selon quel schéma, avec quelles règles, quelles priorités et quel résultat final résolu ?**

Le module ne doit pas devenir un simple écran `Paramètres`.

Il doit devenir un véritable moteur capable de gérer :

```text
Configuration Definition
        ↓
Configuration Schema
        ↓
Configuration Scope
        ↓
Configuration Values
        ↓
Inheritance / Override
        ↓
Validation
        ↓
Resolution
        ↓
Snapshot
        ↓
Runtime Consumption
```

---

# 2. Contexte

Après les CDC précédents, Business Manager connaît déjà :

```text
BM-CDC-01
Application

BM-CDC-02
ApplicationVersion
Lifecycle
Publication

BM-CDC-03
Entities
Fields
Relations

BM-CDC-04
Features
Capabilities

BM-CDC-05
Menus
Navigation
```

Il manque encore un mécanisme cohérent permettant de définir et stocker des paramètres tels que :

```text
Devise par défaut
Format de date
Fuseau horaire
Préfixe facture
Décimales
Gestion stock négatif
Mode de numérotation
Seuil d’alerte
Logo métier
Paramètres POS
Paramètres d’impression
Valeurs métier personnalisées
Catégories
Tags
Options d’interface
Options d’intégration
Paramètres runtime
```

Ce mécanisme est BM-CDC-06.

---

# 3. Principe fondamental

BM-CDC-06 doit séparer :

```text
DEFINITION
≠
VALUE
≠
RESOLUTION
```

Exemple :

```text
ConfigurationDefinition
code = stock.allow_negative
type = BOOLEAN
defaultValue = false
scope = VERSION

ConfigurationValue
applicationVersionId = 123
value = true

ResolvedConfiguration
stock.allow_negative = true
```

Cette séparation est obligatoire pour maintenir le système générique.

---

# 4. Objectifs fonctionnels

À la fin de BM-CDC-06, Business Manager doit pouvoir :

```text
Créer une définition de paramètre
Définir son type
Définir sa valeur par défaut
Définir ses contraintes
Définir son scope
Créer un schéma de configuration
Regrouper les paramètres
Créer catégories et tags
Affecter métadonnées aux ressources
Définir des valeurs par Application
Définir des valeurs par ApplicationVersion
Gérer les overrides
Valider les valeurs
Comparer deux configurations
Analyser les impacts
Résoudre la configuration effective
Générer un snapshot
Historiser les modifications
Protéger les versions publiées
Exposer la configuration au Runtime
```

---

# 5. Hors périmètre

BM-CDC-06 ne doit pas gérer directement :

```text
Application CRUD                 → BM-CDC-01
Lifecycle / Publication          → BM-CDC-02
Entity / Field / Relation        → BM-CDC-03
Feature / Capability             → BM-CDC-04
Menu / Navigation                → BM-CDC-05
ERP Mapping / Runtime Bridge     → BM-CDC-07
Quality global / recette         → BM-CDC-08
```

Il peut stocker ou exposer des métadonnées concernant ces ressources, mais il ne doit pas remplacer leurs moteurs.

---

# 6. Architecture fonctionnelle cible

```text
                    BM-CDC-06
          CONFIGURATION & METADATA MANAGER
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
 DEFINITIONS          VALUES           METADATA
       │                 │                 │
       ├── Schemas       ├── Overrides     ├── Categories
       ├── Types         ├── Inheritance   ├── Tags
       ├── Constraints   ├── Resolution    ├── Attributes
       └── Defaults      └── Snapshot      └── Classification
                         │
                         ▼
                 RESOLVED CONFIG
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       Runtime        Integration     Validation
```

---

# 7. Concepts principaux

BM-CDC-06 doit introduire au minimum :

```text
ConfigurationDefinition
ConfigurationSchema
ConfigurationSection
ConfigurationField
ConfigurationValue
ConfigurationScope
ConfigurationOverride
ResolvedConfiguration
MetadataDefinition
MetadataValue
Category
Tag
ResourceTag
ConfigurationSnapshot
ConfigurationDiff
ConfigurationImpact
```

---

# 8. ConfigurationDefinition

Une `ConfigurationDefinition` décrit un paramètre configurable.

Structure :

```text
ConfigurationDefinition
│
├── id
├── code
├── name
├── description
├── dataType
├── defaultValue
├── required
├── nullable
├── scope
├── category
├── validationRules
├── allowedValues
├── sensitive
├── secret
├── runtimeExposed
├── deprecated
├── sortOrder
├── metadata
├── createdAt
└── updatedAt
```

---

# 9. Code de configuration

Exemples :

```text
general.currency
general.locale
general.timezone

stock.allow_negative
stock.low_threshold

sale.invoice_prefix
sale.default_tax_rate

pos.receipt_auto_print

runtime.cache.enabled
```

Règles :

```text
unique
stable
lowercase recommandé
namespace obligatoire
non dépendant du libellé
```

---

# 10. Namespaces

Les codes doivent être structurés :

```text
<domain>.<resource>.<property>
```

Exemple :

```text
stock.alert.low_threshold
sale.invoice.prefix
customer.default_country
pos.receipt.auto_print
```

---

# 11. Data Types

Types minimaux :

```text
STRING
TEXT
INTEGER
DECIMAL
BOOLEAN
DATE
DATETIME
TIME
ENUM
MULTI_ENUM
COLOR
ICON
URL
EMAIL
PHONE
JSON
REFERENCE
LIST
MAP
SECRET
```

---

# 12. SECRET

`SECRET` doit être traité séparément.

Exemples :

```text
API Key
Webhook secret
Integration token
Private credential
```

Règles :

```text
jamais renvoyé en clair après stockage
jamais présent dans audit before/after en clair
jamais intégré dans snapshot public
chiffré au repos si persistant
masqué dans Frontend
rotation possible
```

---

# 13. Configuration Scope

Scopes minimaux :

```text
PLATFORM
TENANT
APPLICATION
APPLICATION_VERSION
ENVIRONMENT
RUNTIME_CONTEXT
```

Pour BM-CDC-06 Business Manager, les scopes critiques sont :

```text
APPLICATION
APPLICATION_VERSION
ENVIRONMENT
```

---

# 14. Scope APPLICATION

Configuration stable au niveau Application.

Exemple :

```text
Application = Boutique

general.default_locale = fr
general.timezone = Indian/Antananarivo
```

Elle peut servir de valeur héritée par les versions.

---

# 15. Scope APPLICATION_VERSION

Paramètre propre à une version.

```text
Version 1.0.0
stock.allow_negative = false

Version 1.1.0
stock.allow_negative = true
```

Une version publiée reste immuable.

---

# 16. Scope ENVIRONMENT

Permet une variation :

```text
DEV
TEST
STAGING
PROD
```

Exemple :

```text
integration.erp.timeout

DEV  = 10
PROD = 3
```

---

# 17. Ordre de résolution

Ordre recommandé :

```text
Default
   ↓
Platform
   ↓
Tenant
   ↓
Application
   ↓
ApplicationVersion
   ↓
Environment
   ↓
Runtime Context
```

La valeur la plus spécifique autorisée prend priorité.

---

# 18. ConfigurationResolver

Créer :

```text
ConfigurationResolver
```

Responsabilités :

```text
resolve()
resolveOne()
resolveSection()
resolveSchema()
getEffectiveSource()
explainResolution()
```

---

# 19. Résolution explicable

Le système doit pouvoir expliquer :

```text
stock.allow_negative = true

Source:
APPLICATION_VERSION

ApplicationVersion:
1.1.0

Inherited from:
none

Default:
false
```

---

# 20. ResolvedConfiguration

Structure :

```text
ResolvedConfiguration
│
├── applicationId
├── applicationVersionId
├── environment
├── values
├── sources
├── warnings
├── generatedAt
└── hash
```

---

# 21. ConfigurationSchema

Un `ConfigurationSchema` regroupe et structure plusieurs paramètres.

Exemple :

```text
POS Settings
├── Général
├── Paiement
├── Ticket
├── Impression
└── Sécurité
```

---

# 22. Modèle ConfigurationSchema

```text
ConfigurationSchema
│
├── id
├── code
├── name
├── description
├── version
├── targetType
├── targetKey
├── sections[]
├── status
├── metadata
├── createdAt
└── updatedAt
```

---

# 23. TargetType

Le schéma peut viser :

```text
APPLICATION
FEATURE
CAPABILITY
MENU
ENTITY
RUNTIME
INTEGRATION
CUSTOM
```

BM-CDC-06 ne doit pas connaître la logique métier interne de la cible.

Il référence uniquement son type et son identifiant stable.

---

# 24. ConfigurationSection

```text
ConfigurationSection
│
├── id
├── schemaId
├── code
├── name
├── description
├── icon
├── order
├── collapsible
├── visibility
└── metadata
```

---

# 25. ConfigurationField

```text
ConfigurationField
│
├── id
├── sectionId
├── definitionId
├── label
├── helpText
├── placeholder
├── order
├── visible
├── readonly
└── uiMetadata
```

---

# 26. UI Metadata

Exemples :

```text
widget
width
group
placeholder
helpText
prefix
suffix
icon
displayCondition
```

Aucune expression arbitraire JavaScript/PHP ne doit être exécutée.

---

# 27. Conditions UI

Les conditions doivent être déclaratives.

Exemple :

```json
{
  "field": "pos.receipt.auto_print",
  "operator": "EQ",
  "value": true
}
```

Opérateurs minimaux :

```text
EQ
NEQ
IN
NOT_IN
GT
GTE
LT
LTE
EXISTS
NOT_EXISTS
```

---

# 28. ConfigurationValue

Structure :

```text
ConfigurationValue
│
├── id
├── definitionId
├── tenantId
├── applicationId
├── applicationVersionId
├── environment
├── value
├── valueType
├── source
├── createdBy
├── createdAt
├── updatedBy
├── updatedAt
└── version
```

---

# 29. Validation des valeurs

Chaque valeur doit être validée contre sa définition.

Exemples :

```text
INTEGER → entier valide
DECIMAL → nombre valide
ENUM → valeur autorisée
URL → URL valide
EMAIL → email valide
REFERENCE → ressource existante
BOOLEAN → true/false
```

---

# 30. ValidationRules

Support minimal :

```text
required
min
max
minLength
maxLength
pattern
allowedValues
unique
referenceExists
customValidatorKey
```

---

# 31. Custom Validator

Prévoir :

```text
ConfigurationValidator
```

Les autres moteurs peuvent enregistrer des validateurs.

Exemple :

```text
POSReceiptValidator
StockThresholdValidator
IntegrationEndpointValidator
```

Sans dépendance forte entre modules.

---

# 32. Category Manager

BM-CDC-06 doit gérer un catalogue générique de catégories.

Une catégorie peut servir à classifier :

```text
Applications
Features
Menus
Templates
Configurations
Documents
Custom resources
```

---

# 33. Category Model

```text
Category
│
├── id
├── tenantId
├── code
├── name
├── description
├── parentId
├── icon
├── order
├── colorKey
├── targetType
├── active
├── metadata
├── createdAt
└── updatedAt
```

---

# 34. Catégories hiérarchiques

Prévoir :

```text
Commerce
├── Boutique
├── Restaurant
└── Services

Éducation
├── École
└── Formation
```

Règles :

```text
cycle interdit
profondeur maximale configurable
parent même scope/target compatible
```

---

# 35. Tag Manager

Un Tag permet une classification souple et multiple.

Exemples :

```text
retail
mobile
premium
inventory
finance
beta
internal
```

---

# 36. Tag Model

```text
Tag
│
├── id
├── tenantId
├── code
├── name
├── description
├── targetType
├── colorKey
├── active
├── metadata
├── createdAt
└── updatedAt
```

---

# 37. ResourceTag

Association :

```text
ResourceTag
│
├── id
├── resourceType
├── resourceId
├── tagId
├── createdBy
└── createdAt
```

---

# 38. Metadata Definition

BM-CDC-06 doit permettre de créer des métadonnées extensibles sans modifier le schéma SQL principal de chaque moteur.

Exemple :

```text
Application
metadata:
  industry = retail
  complexity = medium
  recommended_device = tablet
```

---

# 39. MetadataDefinition

```text
MetadataDefinition
│
├── id
├── code
├── targetType
├── name
├── description
├── dataType
├── multiple
├── required
├── defaultValue
├── validationRules
├── searchable
├── filterable
├── runtimeExposed
└── metadata
```

---

# 40. MetadataValue

```text
MetadataValue
│
├── id
├── definitionId
├── resourceType
├── resourceId
├── value
├── createdBy
├── createdAt
├── updatedBy
└── updatedAt
```

---

# 41. Métadonnée ≠ Configuration

Règle :

```text
Metadata
→ décrit une ressource

Configuration
→ modifie son comportement
```

Exemple :

```text
metadata.industry = retail

configuration.stock.allow_negative = false
```

Ne pas mélanger systématiquement les deux.

---

# 42. Métadonnée ≠ Data Model Field

Un champ métier :

```text
Customer.email
Product.price
```

appartient à BM-CDC-03.

Une métadonnée :

```text
Entity.display_group
Entity.documentation_url
```

peut appartenir à BM-CDC-06.

---

# 43. Catégorie ≠ Tag

```text
Category
→ classification structurée
→ généralement une catégorie principale

Tag
→ classification libre
→ plusieurs tags possibles
```

---

# 44. Configuration Catalog

Frontend :

```text
CONFIGURATION MANAGER

Schemas
Definitions
Values
Metadata
Categories
Tags
Snapshots
Activity
```

---

# 45. Dashboard Configuration

Afficher :

```text
Configuration definitions
Schemas
Configured values
Missing required values
Overrides
Validation errors
Categories
Tags
Last modifications
```

---

# 46. Definitions Page

Colonnes :

```text
Code
Name
Type
Scope
Default
Required
Sensitive
Runtime
Status
Actions
```

---

# 47. Create Definition Wizard

Étapes :

```text
1. Identity
2. Type
3. Scope
4. Default Value
5. Validation
6. Security
7. Runtime Exposure
8. Review
```

---

# 48. Schema Builder

Écran :

```text
Schema
├── Section Général
│   ├── Currency
│   ├── Locale
│   └── Timezone
│
├── Section Stock
│   ├── Allow Negative
│   └── Low Threshold
│
└── Section POS
    └── Auto Print
```

Support :

```text
drag & drop sections
drag & drop fields
ordering
preview
validation
```

---

# 49. Configuration Form Renderer

À partir d’un `ConfigurationSchema`, le frontend doit pouvoir générer automatiquement un formulaire.

```text
Schema
  ↓
Sections
  ↓
Fields
  ↓
Definitions
  ↓
Dynamic Form
```

---

# 50. Dynamic Widget Mapping

Exemple :

```text
BOOLEAN      → Switch
ENUM         → Select
MULTI_ENUM   → MultiSelect
STRING       → Input
TEXT         → Textarea
INTEGER      → NumberInput
DECIMAL      → DecimalInput
DATE         → DatePicker
COLOR        → ColorPicker
SECRET       → SecretInput
REFERENCE    → ResourceSelector
```

---

# 51. Configuration Preview

Avant sauvegarde :

```text
Current value
New value
Effective source
Validation
Impact
```

---

# 52. Override UI

Le frontend doit distinguer :

```text
Default
Inherited
Overridden
```

Exemple :

```text
Currency
MGA
Source: Application

[ Override for version ]
```

---

# 53. Reset Override

Action :

```text
Reset to inherited value
```

Elle supprime l’override, pas la définition.

---

# 54. Effective Value

Toujours afficher lorsque pertinent :

```text
Stored Value
Effective Value
Source
```

---

# 55. Read-only Published Version

Si `ApplicationVersion = PUBLISHED` :

```text
Configuration values versionnées
→ READ ONLY
```

Le frontend affiche le verrou.

Le backend rejette toute mutation.

---

# 56. Application-Level Configuration

Les configurations Application non versionnées restent gérées selon leurs propres permissions.

Une modification doit néanmoins passer par :

```text
Impact
Validation
Audit
```

si elle influence le Runtime.

---

# 57. Configuration Clone Contributor

BM-CDC-06 doit contribuer au clonage de Version.

Contrat :

```text
VersionCloneContributor
```

Action :

```text
Source Version
    ↓
Clone ConfigurationValues
    ↓
New Version
```

---

# 58. Application Clone Contributor

Pour les configurations de scope APPLICATION :

```text
ApplicationCloneContributor
```

---

# 59. Snapshot Contributor

BM-CDC-06 doit enregistrer :

```text
VersionSnapshotContributor
```

Le fragment contient :

```text
definitions references
resolved values
version-specific values
metadata required by runtime
schema versions
```

---

# 60. Configuration Snapshot

Structure :

```text
ConfigurationSnapshot
│
├── schemaVersion
├── applicationId
├── applicationVersionId
├── environment
├── definitionsVersion
├── values
├── metadata
├── generatedAt
└── snapshotHash
```

---

# 61. Déterminisme Snapshot

Même configuration logique :

```text
→ même représentation normalisée
→ même hash
```

L’ordre non fonctionnel des clés ne doit pas modifier le hash.

---

# 62. Secret dans Snapshot

Un secret ne doit jamais être exporté dans un snapshot public.

Selon besoin Runtime :

```text
secretReference
```

plutôt que valeur brute.

---

# 63. Configuration Diff

Comparer :

```text
Version 1.0.0
vs
Version 1.1.0
```

Résultat :

```text
ADDED
REMOVED
CHANGED
INHERITED_CHANGED
DEFAULT_CHANGED
```

---

# 64. ConfigurationDiffResult

```text
sourceVersionId
targetVersionId
changes[]
breakingChanges[]
warnings[]
metadata
```

---

# 65. Impact Analysis

Exemples :

```text
Changement devise
→ impacts reporting / POS / facturation

Désactivation stock négatif
→ impact validation vente

Modification route API
→ impact intégration
```

BM-CDC-06 ne doit pas inventer seul tous les impacts.

Il agrège des `ImpactContributor`.

---

# 66. ImpactContributor

Contrat :

```text
ConfigurationImpactContributor
```

Les autres CDC peuvent déclarer leur analyse.

---

# 67. Configuration Validation

Validation globale :

```text
Definition validation
Value validation
Schema validation
Scope validation
Reference validation
Security validation
Runtime readiness
```

---

# 68. Configuration Completeness

Calcul possible :

```text
required total = 20
required configured = 18

completeness = 90%
```

Mais `completeness` ne remplace pas les erreurs bloquantes.

---

# 69. ValidationIssue

Réutiliser BM-CDC-00 :

```text
severity
code
message
targetType
targetId
field
metadata
suggestedAction
```

---

# 70. Errors spécifiques

Prévoir :

```text
CONFIG_DEFINITION_NOT_FOUND
CONFIG_DEFINITION_CODE_EXISTS
CONFIG_SCHEMA_NOT_FOUND
CONFIG_SCHEMA_INVALID
CONFIG_VALUE_INVALID
CONFIG_VALUE_REQUIRED
CONFIG_SCOPE_INVALID
CONFIG_OVERRIDE_INVALID
CONFIG_REFERENCE_NOT_FOUND
CONFIG_NOT_EDITABLE
CONFIG_RESOLUTION_FAILED
CONFIG_SNAPSHOT_FAILED

METADATA_DEFINITION_NOT_FOUND
METADATA_VALUE_INVALID

CATEGORY_NOT_FOUND
CATEGORY_CODE_EXISTS
CATEGORY_CYCLE
CATEGORY_DEPTH_EXCEEDED

TAG_NOT_FOUND
TAG_CODE_EXISTS

SECRET_ACCESS_DENIED
SECRET_WRITE_FAILED
```

---

# 71. API — Definitions

```text
GET    /configuration/definitions
POST   /configuration/definitions

GET    /configuration/definitions/:id
PATCH  /configuration/definitions/:id

POST   /configuration/definitions/:id/archive
```

---

# 72. API — Schemas

```text
GET    /configuration/schemas
POST   /configuration/schemas

GET    /configuration/schemas/:id
PATCH  /configuration/schemas/:id

POST   /configuration/schemas/:id/validate
GET    /configuration/schemas/:id/preview
```

---

# 73. API — Values

```text
GET  /applications/:applicationId/configuration
GET  /application-versions/:versionId/configuration

PUT  /applications/:applicationId/configuration/:code
PUT  /application-versions/:versionId/configuration/:code

DELETE /application-versions/:versionId/configuration/:code
```

`DELETE` signifie ici suppression de l’override, pas suppression de la définition.

---

# 74. API — Resolve

```text
GET /application-versions/:versionId/configuration/resolved
```

Query possible :

```text
environment
schema
section
codes[]
```

---

# 75. API — Explain Resolution

```text
GET /application-versions/:versionId/configuration/:code/explain
```

---

# 76. API — Validation

```text
POST /application-versions/:versionId/configuration/validate
GET  /application-versions/:versionId/configuration/validation
```

---

# 77. API — Diff

```text
GET /application-versions/:sourceVersionId/configuration/diff/:targetVersionId
```

---

# 78. API — Snapshot

```text
POST /application-versions/:versionId/configuration/snapshot
GET  /application-versions/:versionId/configuration/snapshot
```

---

# 79. API — Metadata

```text
GET    /metadata/definitions
POST   /metadata/definitions

GET    /resources/:resourceType/:resourceId/metadata
PUT    /resources/:resourceType/:resourceId/metadata/:code
DELETE /resources/:resourceType/:resourceId/metadata/:code
```

---

# 80. API — Categories

```text
GET    /categories
POST   /categories
GET    /categories/:id
PATCH  /categories/:id
POST   /categories/:id/archive
```

---

# 81. API — Tags

```text
GET    /tags
POST   /tags
GET    /tags/:id
PATCH  /tags/:id
POST   /tags/:id/archive
```

---

# 82. API — Resource Tags

```text
GET    /resources/:resourceType/:resourceId/tags
POST   /resources/:resourceType/:resourceId/tags/:tagId
DELETE /resources/:resourceType/:resourceId/tags/:tagId
```

---

# 83. Backend Architecture

```text
ConfigurationController
        ↓
ConfigurationService
        ↓
ConfigurationDomain
        ↓
ConfigurationRepository
        ↓
Database

ConfigurationResolver
ConfigurationValidator
SchemaService
MetadataService
CategoryService
TagService
SnapshotService
DiffService
ImpactService
```

---

# 84. ConfigurationService

Fonctions :

```text
createDefinition()
updateDefinition()
listDefinitions()

setValue()
removeOverride()
getValue()
getResolvedValue()
getResolvedConfiguration()

validateConfiguration()

cloneApplicationConfiguration()
cloneVersionConfiguration()

generateSnapshot()
compareConfigurations()
analyzeImpact()
```

---

# 85. SchemaService

```text
createSchema()
updateSchema()
addSection()
removeSection()
reorderSections()
addField()
removeField()
reorderFields()
validateSchema()
getSchemaPreview()
```

---

# 86. MetadataService

```text
createDefinition()
setMetadata()
removeMetadata()
listResourceMetadata()
searchByMetadata()
```

---

# 87. CategoryService

```text
createCategory()
updateCategory()
moveCategory()
archiveCategory()
getTree()
validateHierarchy()
```

---

# 88. TagService

```text
createTag()
updateTag()
archiveTag()
assignTag()
removeTag()
searchTags()
```

---

# 89. Database — Definitions

Table :

```text
bm_configuration_definitions
```

Champs :

```text
id
tenant_id
code
name
description
data_type
default_value
required
nullable
scope
category
validation_rules
allowed_values
sensitive
secret
runtime_exposed
deprecated
sort_order
metadata
created_by
created_at
updated_by
updated_at
version
```

---

# 90. Database — Schemas

```text
bm_configuration_schemas
```

Champs :

```text
id
tenant_id
code
name
description
schema_version
target_type
target_key
status
metadata
created_by
created_at
updated_by
updated_at
version
```

---

# 91. Database — Sections

```text
bm_configuration_sections
```

Champs :

```text
id
schema_id
code
name
description
icon_key
sort_order
collapsible
visibility
metadata
```

---

# 92. Database — Fields

```text
bm_configuration_fields
```

Champs :

```text
id
section_id
definition_id
label
help_text
placeholder
sort_order
visible
readonly
ui_metadata
```

---

# 93. Database — Values

```text
bm_configuration_values
```

Champs :

```text
id
definition_id
tenant_id
application_id
application_version_id
environment
value
encrypted_value
source
created_by
created_at
updated_by
updated_at
version
```

---

# 94. Database — Metadata Definitions

```text
bm_metadata_definitions
```

---

# 95. Database — Metadata Values

```text
bm_metadata_values
```

---

# 96. Database — Categories

```text
bm_categories
```

---

# 97. Database — Tags

```text
bm_tags
```

---

# 98. Database — Resource Tags

```text
bm_resource_tags
```

---

# 99. Contraintes DB importantes

Exemples :

```text
UNIQUE(tenant_id, configuration_definition.code)

UNIQUE(
  definition_id,
  application_id,
  application_version_id,
  environment
)

UNIQUE(tenant_id, category.code, target_type)

UNIQUE(tenant_id, tag.code, target_type)
```

Les contraintes exactes doivent tenir compte des valeurs NULL selon le moteur DB.

---

# 100. Indexes

Prévoir :

```text
tenant_id
application_id
application_version_id
definition_id
scope
environment
target_type
resource_type
resource_id
category_id
tag_id
updated_at
```

---

# 101. JSON

Les structures variables peuvent utiliser JSON :

```text
validation_rules
allowed_values
metadata
ui_metadata
```

Mais les éléments critiques pour recherche/intégrité doivent avoir des colonnes dédiées.

---

# 102. Sécurité

Règles minimales :

```text
server-side validation
tenant isolation
permission check
scope check
version editability
secret protection
no arbitrary code execution
no arbitrary SQL
no eval
audit
traceId
```

---

# 103. Permissions

Exemples :

```text
business.configuration.read
business.configuration.manage
business.configuration.definition.manage
business.configuration.schema.manage
business.configuration.value.update
business.configuration.resolve
business.configuration.snapshot

business.metadata.read
business.metadata.manage

business.category.read
business.category.manage

business.tag.read
business.tag.manage

business.secret.write
business.secret.rotate
```

---

# 104. Secret Permissions

Lire une ressource contenant un secret ne donne jamais automatiquement le droit de lire la valeur secrète.

Préférer :

```text
secretConfigured = true
```

plutôt que renvoyer la valeur.

---

# 105. IAM Context

Le backend récupère :

```text
tenantId
actorId
permissions
traceId
applicationId
applicationVersionId
environment
```

du contexte sécurisé.

---

# 106. Isolation

Chaîne :

```text
Tenant
  ↓
Application
  ↓
ApplicationVersion
  ↓
Configuration
```

Aucune fuite inter-tenant ou inter-version.

---

# 107. Version Guard

Pour un scope `APPLICATION_VERSION` :

```text
Version PUBLISHED
    ↓
Mutation
    ↓
DENIED
CONFIG_NOT_EDITABLE
```

---

# 108. Optimistic Locking

Utiliser `version`.

Exemple :

```text
Client version = 7
DB version = 8
↓
409 VERSION_CONFLICT
```

---

# 109. Transactions

Obligatoires pour :

```text
schema complexe
bulk configuration update
clone
import
snapshot
category tree move
tag batch assignment
```

---

# 110. Bulk Update

Prévoir :

```text
PATCH /application-versions/:versionId/configuration
```

avec plusieurs valeurs.

Le tout doit être validé avant commit.

---

# 111. Bulk Validation

Flux :

```text
Parse
↓
Validate every value
↓
Cross-field validation
↓
Impact
↓
Transaction
↓
Audit
↓
Commit
```

---

# 112. Cross-field Validation

Exemple :

```text
stock.min_threshold <= stock.max_threshold
```

Créer :

```text
ConfigurationCrossValidator
```

---

# 113. Import

BM-CDC-06 doit préparer :

```text
JSON
CSV
```

selon type.

Flux :

```text
Upload
↓
Parse
↓
Validate
↓
Preview
↓
Confirm
↓
Apply
```

Aucune écriture silencieuse directe.

---

# 114. Export

Export possible de :

```text
Definitions
Schemas
Non-secret values
Metadata
Categories
Tags
Resolved configuration
```

Les secrets sont exclus.

---

# 115. Configuration Template

Prévoir :

```text
ConfigurationTemplate
```

pour initialiser rapidement une ApplicationVersion.

Exemple :

```text
Retail Basic
Restaurant Basic
School Basic
```

---

# 116. Template Application

Lors d’une création depuis template :

```text
BM-CDC-01
Application creation
      ↓
BM-CDC-02
Version creation
      ↓
BM-CDC-06
Configuration template apply
```

---

# 117. Default Values

Une valeur par défaut appartient à la définition.

Elle ne doit pas forcément créer une ligne `ConfigurationValue`.

---

# 118. Inheritance

L’absence d’override signifie :

```text
inherit
```

Elle ne signifie pas :

```text
null
```

---

# 119. Null explicite

Si le paramètre autorise `null`, il faut distinguer :

```text
NO VALUE / INHERIT

EXPLICIT NULL

VALUE
```

---

# 120. Resolution Source

Enum recommandé :

```text
DEFAULT
PLATFORM
TENANT
APPLICATION
APPLICATION_VERSION
ENVIRONMENT
RUNTIME_CONTEXT
```

---

# 121. Deprecation

Une définition peut devenir :

```text
deprecated = true
```

Le système doit :

```text
afficher warning
empêcher nouvelles utilisations si configuré
conserver compatibilité historique
préparer remplacement
```

---

# 122. Replacement Key

Option :

```text
replacementDefinitionId
```

pour indiquer le paramètre remplaçant.

---

# 123. Breaking Change

Changer certains aspects d’une définition peut être breaking :

```text
dataType
scope
allowedValues
required
secret
```

Le système doit lancer une analyse d’impact.

---

# 124. Version des schémas

Un `ConfigurationSchema` doit avoir :

```text
schemaVersion
```

pour permettre aux snapshots/runtimes de connaître la structure attendue.

---

# 125. Historique

Afficher :

```text
definition created
definition changed
schema changed
value changed
override removed
category changed
tag assigned
metadata changed
snapshot generated
```

---

# 126. Activity Events

Événements :

```text
configuration.definition.created
configuration.definition.updated
configuration.schema.created
configuration.schema.updated
configuration.value.updated
configuration.override.removed
configuration.snapshot.generated

metadata.updated

category.created
category.updated
category.moved

tag.created
tag.updated
tag.assigned
tag.removed
```

---

# 127. Audit

Pour les valeurs normales :

```text
before
after
```

Pour les secrets :

```text
before = [REDACTED]
after = [REDACTED]
```

---

# 128. Search

Recherche definitions :

```text
code
name
description
category
```

---

# 129. Filters

```text
dataType
scope
required
sensitive
secret
runtimeExposed
deprecated
category
```

---

# 130. Pagination

Réutiliser BM-CDC-00.

---

# 131. Frontend Sidebar

Dans le Workspace Application :

```text
Configuration
├── Vue générale
├── Paramètres
├── Schémas
├── Métadonnées
├── Catégories
├── Tags
├── Snapshots
└── Historique
```

Éviter de dupliquer des menus déjà présents au niveau plateforme.

---

# 132. Configuration Overview

Cards :

```text
Definitions
Schemas
Configured
Missing Required
Validation Errors
Overrides
Metadata
Categories
Tags
```

---

# 133. Configuration Editor

Doit afficher :

```text
Section
Field
Current Value
Inherited Value
Effective Value
Source
Validation
Override state
```

---

# 134. Error State

Exemple :

```text
Impossible de charger la configuration.

Trace : abc123

[ Réessayer ]
```

---

# 135. Empty State

```text
Aucun schéma de configuration disponible.
```

ou :

```text
Aucun paramètre n’est encore défini.
```

---

# 136. Read-only State

```text
Cette version est publiée.
Sa configuration est en lecture seule.
```

---

# 137. Conflict State

```text
Cette configuration a été modifiée par un autre utilisateur.

[ Recharger ]
[ Comparer ]
```

---

# 138. Responsive

Desktop :

```text
2-column / 3-column settings layouts
```

Mobile :

```text
single column
sections accordéon
sticky save action
```

---

# 139. Accessibility

Support :

```text
labels
keyboard
focus
errors associated to fields
ARIA where relevant
contrast
```

---

# 140. Autosave

Possible pour certains paramètres simples.

Règles :

```text
debounced
visible state Saving/Saved/Error
never bypass backend validation
never bypass version guard
```

---

# 141. Manual Save

Pour changements à impact élevé :

```text
Review changes
↓
Impact
↓
Confirm
↓
Save
```

---

# 142. Risk Classification

Niveau :

```text
SAFE
WARNING
BREAKING
SECURITY_SENSITIVE
```

---

# 143. Configuration Impact UI

Afficher :

```text
Changed settings
Affected features
Affected navigation
Affected runtime
Affected integration
Breaking changes
Warnings
```

---

# 144. Runtime Exposure

Chaque définition doit préciser :

```text
runtimeExposed
```

Seules les valeurs autorisées apparaissent dans le Runtime snapshot.

---

# 145. Public vs Internal

Prévoir :

```text
exposure = INTERNAL
exposure = RUNTIME
exposure = PUBLIC_SAFE
```

selon architecture finale.

---

# 146. Runtime Contract

BM-CDC-07 doit recevoir :

```text
ResolvedConfiguration
```

et non les tables internes brutes.

---

# 147. Resolver Performance

Le Resolver doit éviter de recalculer inutilement toute la configuration.

Cache possible basé sur :

```text
tenantId
applicationId
applicationVersionId
environment
configurationRevision
```

---

# 148. Cache Invalidation

Lors d’une modification :

```text
value updated
↓
revision updated
↓
cache invalidated
↓
snapshot outdated
```

---

# 149. Configuration Revision

Prévoir :

```text
configurationRevision
```

ou mécanisme équivalent.

---

# 150. Snapshot Outdated

Après modification :

```text
Current snapshot
→ OUTDATED
```

BM-CDC-02 doit être informé via contrat/événement.

---

# 151. Validation Outdated

Une modification critique peut rendre la validation BM-CDC-02 :

```text
OUTDATED
```

---

# 152. Events vers BM-CDC-02

Exemple :

```text
configuration.changed
      ↓
VersionValidationStatus = OUTDATED
SnapshotStatus = OUTDATED
```

sans couplage direct si possible.

---

# 153. Contrat avec BM-CDC-01

BM-CDC-01 peut consommer :

```text
Categories
Tags
Application metadata definitions
Application-scope configuration
```

---

# 154. Contrat avec BM-CDC-02

BM-CDC-06 consomme :

```text
ApplicationVersion
editable
environment
snapshot registry
validation registry
clone registry
```

---

# 155. Contrat avec BM-CDC-03

BM-CDC-06 peut attacher :

```text
Metadata
ConfigurationSchema
```

à des Entity/Field references stables.

Il ne modifie pas leurs définitions de données.

---

# 156. Contrat avec BM-CDC-04

Une Feature/Capability peut déclarer :

```text
requiredConfigurationKeys[]
optionalConfigurationKeys[]
```

BM-CDC-06 résout les valeurs.

---

# 157. Contrat avec BM-CDC-05

Un Menu peut éventuellement exploiter des paramètres de configuration déclaratifs.

Exemple :

```text
visibility configuration requirement
```

Mais BM-CDC-05 reste propriétaire de la navigation.

---

# 158. Contrat avec BM-CDC-07

BM-CDC-07 consomme :

```text
ResolvedConfiguration
ConfigurationSnapshot
runtime-exposed metadata
secret references
```

---

# 159. Contrat avec BM-CDC-08

BM-CDC-08 peut vérifier :

```text
completeness
configuration consistency
security constraints
quality rules
runtime readiness
```

---

# 160. Tests Backend — Definitions

Tester :

```text
Create definition
Duplicate code rejected
Update definition
Invalid type rejected
Invalid scope rejected
Default validation
Allowed values validation
Breaking definition change detected
Deprecation
```

---

# 161. Tests Backend — Values

```text
Set application value
Set version value
Resolve inherited value
Override inherited value
Reset override
Explicit null
Invalid value rejected
Published version mutation rejected
```

---

# 162. Tests Backend — Resolver

```text
Default resolution
Application override
Version override
Environment override
Source explanation
Missing required
Secret resolution restrictions
```

---

# 163. Tests Backend — Schemas

```text
Create schema
Create sections
Add fields
Reorder
Duplicate field prevention
Invalid reference
Schema validation
Preview
```

---

# 164. Tests Backend — Metadata

```text
Create metadata definition
Set value
Invalid type rejected
Searchable metadata
Filterable metadata
Delete metadata
```

---

# 165. Tests Backend — Categories

```text
Create
Update
Move
Cycle rejected
Depth rejected
Archive
Hierarchy retrieval
```

---

# 166. Tests Backend — Tags

```text
Create
Duplicate rejected
Assign
Remove
Archive
Search
```

---

# 167. Tests Backend — Snapshot

```text
Generate
Deterministic hash
Changed value changes hash
Secret excluded
Published snapshot protected
```

---

# 168. Tests Backend — Security

```text
Unauthenticated denied
Unauthorized denied
Cross-tenant denied
Cross-application denied
Cross-version denied
Secret read denied
Secret not logged
Published mutation denied
```

---

# 169. Tests Frontend

Tester :

```text
Configuration overview
Definitions list
Search
Filters
Create definition

Schema builder
Drag & drop
Dynamic form rendering

Inherited value display
Override
Reset override
Validation errors

Categories tree
Tags manager
Metadata editor

Snapshot
Diff
Impact
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

# 170. Test E2E — Paramètre Application

```text
Open Application
↓
Configuration
↓
Set general.currency = MGA
↓
Save
↓
Resolve
↓
Effective value = MGA
```

---

# 171. Test E2E — Override Version

```text
Application
general.currency = MGA

Version 1.1.0
Override = USD

Resolved 1.1.0
→ USD
```

---

# 172. Test E2E — Reset Override

```text
Version override = USD
↓
Reset
↓
Resolved
→ MGA inherited
```

---

# 173. Test E2E — Published Version

```text
Version 1.0.0 PUBLISHED
↓
Change configuration
↓
DENIED
CONFIG_NOT_EDITABLE
```

---

# 174. Test E2E — Validation

```text
stock.low_threshold
type INTEGER
min = 0

User enters -5
↓
DENIED
CONFIG_VALUE_INVALID
```

---

# 175. Test E2E — Snapshot

```text
Resolved Config
↓
Generate Snapshot
↓
Normalize
↓
Hash
↓
Store metadata
```

---

# 176. Test E2E — Clone Version

```text
Version 1.0.0
Configuration A
↓
Clone Version
↓
Version 1.1.0
Configuration copied
↓
Independent editable values
```

---

# 177. Test E2E — Secret

```text
Set API Secret
↓
Encrypted persistence
↓
GET Configuration
↓
secretConfigured = true
value absent
↓
Audit
[REDACTED]
```

---

# 178. Performance cible

Indicatif :

```text
Definitions list              < 500 ms
Schema load                   < 500 ms
Resolved config               < 500 ms
Single value resolve          < 200 ms
Category tree                 < 500 ms
Tag search                    < 300 ms
```

hors dépendances externes.

---

# 179. Observabilité

Chaque opération importante :

```text
traceId
tenantId
applicationId
applicationVersionId
actorId
action
resource
duration
result
```

---

# 180. Logs sensibles

Interdit :

```text
secret values
passwords
tokens
private keys
sensitive payload raw
```

---

# 181. Documentation obligatoire

Livrer :

```text
Architecture
Configuration resolution rules
Data types
Scopes
Inheritance
Overrides
Schema contract
Metadata contract
Category contract
Tag contract
API
Permissions
Error codes
Security rules
Secret handling
Snapshot format
Testing plan
```

---

# 182. Répartition Team 3 — Avotra

### Frontend fonctionnel

```text
Configuration Overview
Definitions UI
Create Definition Wizard
Dynamic Settings Forms
Override UI
Reset Override
Metadata UI
Categories UI
Tags UI
Validation UI
Snapshot UI
Diff UI
Impact UI
History UI
Loading / Empty / Error
Responsive
API integration
```

---

# 183. Répartition Team 3 — Belardo

### Frontend Architecture

```text
Configuration workspace architecture
Schema Builder
Drag & Drop architecture
Dynamic Form Renderer
Widget Registry
Configuration state management
Inherited / Effective value states
Read-only propagation
Conflict handling
Secret field UX
Diff Viewer
Frontend tests foundation
Performance
```

---

# 184. Répartition Team 3 — Ranja

### Backend

```text
Configuration Domain
ConfigurationDefinition
ConfigurationValue
ConfigurationSchema
ConfigurationResolver
Validation Engine
Cross Validators
Metadata Domain
Category Domain
Tag Domain
Repositories
DB migrations
API
Inheritance
Overrides
Secret protection
Snapshot
Diff
Impact
Clone contributors
IAM Context
Tenant/Application/Version isolation
Version Guard
Optimistic locking
Transactions
ActivityEvent
Audit
Backend tests
```

---

# 185. Livrables Backend

```text
✓ Configuration definitions
✓ Configuration schemas
✓ Sections
✓ Fields
✓ Configuration values
✓ Resolver
✓ Inheritance
✓ Overrides
✓ Validation
✓ Cross validation
✓ Metadata definitions
✓ Metadata values
✓ Categories
✓ Tags
✓ Resource tags
✓ Snapshot
✓ Snapshot hash
✓ Diff
✓ Impact
✓ Clone contributors
✓ Secret protection
✓ APIs
✓ Permissions
✓ IAM Context
✓ Isolation
✓ Version Guard
✓ Transactions
✓ Optimistic locking
✓ Audit
✓ ActivityEvent
✓ Tests
✓ Documentation
```

---

# 186. Livrables Frontend

```text
✓ Configuration Overview
✓ Definitions Catalog
✓ Create/Edit Definition
✓ Schema Catalog
✓ Schema Builder
✓ Sections
✓ Dynamic Form Renderer
✓ Configuration Editor
✓ Effective Value UI
✓ Source UI
✓ Override
✓ Reset Override
✓ Metadata Manager
✓ Category Manager
✓ Tag Manager
✓ Snapshot
✓ Diff
✓ Impact
✓ Activity
✓ Secret UX
✓ Loading / Empty / Error
✓ Forbidden
✓ Read-only
✓ Conflict
✓ Responsive
✓ Tests
```

---

# 187. Critères d’acceptation

BM-CDC-06 est accepté lorsque :

```text
✓ Une définition de configuration peut être créée
✓ Son code est stable et unique
✓ Plusieurs types de données sont pris en charge
✓ Les valeurs par défaut fonctionnent
✓ Les règles de validation fonctionnent

✓ Un schéma peut être créé
✓ Des sections peuvent être organisées
✓ Les champs peuvent être ordonnés
✓ Un formulaire dynamique est généré depuis le schéma

✓ Une valeur Application peut être définie
✓ Une valeur ApplicationVersion peut être définie
✓ Les héritages fonctionnent
✓ Les overrides fonctionnent
✓ Reset override fonctionne
✓ La source effective est explicable

✓ Une version publiée est en lecture seule
✓ Le backend rejette les mutations publiées

✓ Les métadonnées extensibles fonctionnent
✓ Les catégories fonctionnent
✓ Les hiérarchies invalides sont rejetées
✓ Les tags peuvent être assignés et retirés

✓ Les secrets ne sont jamais exposés en clair
✓ Les secrets ne sont pas présents dans l’audit

✓ La configuration peut être validée
✓ Les cross-validations fonctionnent
✓ Les erreurs bloquantes sont détectées

✓ Une configuration peut être comparée entre versions
✓ L’impact peut être analysé
✓ Le snapshot est déterministe

✓ La configuration modifiée rend les snapshots/validations concernés obsolètes
✓ BM-CDC-07 peut consommer ResolvedConfiguration

✓ Tenant isolation fonctionne
✓ Application isolation fonctionne
✓ Version isolation fonctionne
✓ Permissions IAM fonctionnent
✓ Optimistic locking fonctionne
✓ Transactions fonctionnent
✓ Audit fonctionne
✓ ActivityEvent fonctionne

✓ Frontend PASS
✓ Backend PASS
✓ Integration tests PASS
```

---

# 188. Definition of Done — BM-CDC-06

```text
BM-CDC-06 — CONFIGURATION & METADATA MANAGER

Configuration Definition       ✓
Configuration Types            ✓
Configuration Scope            ✓
Default Values                 ✓
Validation Rules               ✓

Configuration Schema           ✓
Sections                       ✓
Fields                         ✓
Schema Builder                 ✓
Dynamic Form Renderer          ✓

Configuration Values           ✓
Application Scope              ✓
Version Scope                  ✓
Environment Scope              ✓
Inheritance                    ✓
Overrides                      ✓
Reset Override                 ✓

Configuration Resolver         ✓
Effective Value                ✓
Resolution Source              ✓
Resolution Explain             ✓

Metadata Definitions           ✓
Metadata Values                ✓

Categories                     ✓
Category Hierarchy             ✓
Cycle Detection                ✓

Tags                           ✓
Resource Tags                  ✓

Secret Management              ✓
Secret Masking                 ✓
Secret Audit Redaction         ✓

Validation                     ✓
Cross Validation               ✓
Completeness                   ✓

Diff                           ✓
Impact                         ✓

Snapshot                       ✓
Snapshot Hash                  ✓
Secret-safe Snapshot           ✓
Snapshot Outdated              ✓

Clone Contributor              ✓
Version Integration            ✓
Runtime Contract               ✓

Permissions                    ✓
IAM Context                    ✓
Tenant Isolation               ✓
Application Isolation          ✓
Version Isolation              ✓
Version Guard                  ✓

Optimistic Locking             ✓
Transactions                   ✓
ActivityEvent                  ✓
Audit                          ✓

Frontend                       ✓
Backend                        ✓
Database                       ✓
API                            ✓

Loading / Empty / Error        ✓
Forbidden                      ✓
Read-only                      ✓
Conflict                       ✓
Responsive                     ✓

Frontend Tests                 ✓
Backend Tests                  ✓
Integration Tests              ✓
Documentation                  ✓
Demo                           ✓

STATUS
READY FOR BM-CDC-07+
```

---

# 189. Architecture finale

```text
                         APPLICATION
                              │
                              ▼
                    APPLICATION VERSION
                              │
                              ▼
                  CONFIGURATION MANAGER
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   DEFINITIONS              SCHEMAS              METADATA
        │                     │                     │
        ▼                     ▼                     ├── Categories
      VALUES               SECTIONS                 └── Tags
        │                     │
        ▼                     ▼
    INHERITANCE             FIELDS
        │                     │
        └──────────────┬──────┘
                       ▼
                  VALIDATION
                       │
                       ▼
                    RESOLVER
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
      RESOLVED CONFIG         SNAPSHOT
             │                   │
             └─────────┬─────────┘
                       ▼
                  BM-CDC-07
          INTEGRATION / RUNTIME BRIDGE
```

---

# 190. Chaîne officielle Business Manager

```text
BM-CDC-00
Socle & contrats
        ↓
BM-CDC-01
Application
        ↓
BM-CDC-02
Version & Lifecycle
        ↓
BM-CDC-03
Data Model
        ↓
BM-CDC-04
Features & Capabilities
        ↓
BM-CDC-05
Menu & Navigation
        ↓
BM-CDC-06
Configuration & Metadata
        ↓
BM-CDC-07
Integration & Runtime Bridge
        ↓
BM-CDC-08
Validation, Tests & Quality
```

---

# 191. Règle finale

> **BM-CDC-06 ne doit pas être un simple écran de paramètres. Il doit être la source centralisée, versionnable, validable et résoluble de toute configuration déclarative du Business Manager.**

Il doit garantir :

```text
une définition stable
+
une valeur contextualisée
+
un système d’héritage
+
une validation
+
une résolution déterministe
+
un snapshot
=
une configuration fiable consommable par le Runtime
```
