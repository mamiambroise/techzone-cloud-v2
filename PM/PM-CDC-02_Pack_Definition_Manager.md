# PM-CDC-02 — Pack Definition Manager

**Projet :** Techzone Cloud  
**Module :** Pack Manager  
**Équipe :** Team 3 — Business Manager, Pack & UI Runtime  
**Référence :** PM-CDC-02  
**Version :** 1.0  
**Statut :** Cahier des charges fonctionnel et technique  
**Dépendance obligatoire :** PM-CDC-00 — Socle, Architecture & Contrats communs  
**Stack cible :** React · NestJS · Prisma · PostgreSQL

---

## 1. Objet

PM-CDC-02 définit le **Pack Definition Manager**, responsable de la création, consultation, modification, duplication, archivage et gestion de l’identité générale d’un pack.

Il répond à la question :

> **Qu’est-ce que ce pack, indépendamment de ses versions, modules, features et règles détaillées ?**

PM-CDC-02 gère l’identité stable du pack. Les versions sont gérées par PM-CDC-03.

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
FEATURES
 ↓
DEPENDENCIES
 ↓
RULES
```

---

## 3. Responsabilité fonctionnelle

PM-CDC-02 doit permettre de :

- créer un pack ;
- consulter la liste des packs ;
- rechercher un pack ;
- filtrer par catégorie, statut ou source ;
- modifier les métadonnées générales ;
- dupliquer un pack ;
- archiver un pack ;
- restaurer un pack archivé si autorisé ;
- consulter l’historique de modification ;
- accéder aux versions associées ;
- vérifier si un pack peut être modifié ou archivé ;
- exposer des données fiables à PM-CDC-01 et PM-CDC-03.

---

## 4. Ce que PM-CDC-02 ne gère pas

PM-CDC-02 ne doit pas gérer directement :

- les détails des versions ;
- le contenu des modules ;
- les features ;
- les capabilities ;
- les dépendances ;
- les règles d’activation ;
- la publication d’une version ;
- l’exécution du pack ;
- les données ERP.

Ces responsabilités appartiennent aux autres CDC.

---

## 5. Modèle Pack

Champs recommandés :

```text
id
tenantId
code
name
shortName
description
categoryId
iconKey
logoRef
status
sourceType
metadata
createdAt
createdBy
updatedAt
updatedBy
archivedAt
version
```

---

## 6. Code du pack

Le `code` est l’identifiant métier stable.

Exemples :

```text
stock
sales
restaurant
beauty
pharmacy
garage
school
```

Règles :

- obligatoire ;
- unique dans le scope tenant défini ;
- lowercase recommandé ;
- sans espace ;
- caractères sûrs uniquement ;
- stable après création ;
- changement interdit après publication d’une version, sauf procédure de migration explicite.

Regex indicative :

```text
^[a-z][a-z0-9_-]{2,63}$
```

---

## 7. Nom et shortName

### name
Nom complet visible par les administrateurs.

### shortName
Nom court utilisé dans certaines interfaces.

Exemple :

```text
name      = Gestion de stock
shortName = Stock
```

---

## 8. Description

La description explique l’objectif du pack.

Elle doit être :

- facultative mais recommandée ;
- limitée en longueur ;
- sans HTML arbitraire ;
- compatible Markdown filtré si Markdown est retenu.

---

## 9. Catégorie

Un pack peut être associé à une catégorie.

Exemples :

```text
Commerce
Stock
Service
Finance
Éducation
Santé
Administration
```

La gestion détaillée des catégories peut être transverse avec Business Manager ou un registry commun selon architecture retenue.

Le Pack Manager doit consommer ce référentiel par contrat ou par modèle partagé clairement gouverné.

---

## 10. Icone et logo

Champs :

```text
iconKey
logoRef
```

`iconKey` pointe vers un registre d’icônes autorisées.

`logoRef` pointe vers un asset géré par le système.

Aucune URL externe non validée ne doit être enregistrée directement comme source de confiance.

---

## 11. Statut du Pack

États recommandés :

```text
DRAFT
ACTIVE
SUSPENDED
DEPRECATED
ARCHIVED
```

### DRAFT
Pack en préparation.

### ACTIVE
Pack utilisable pour créer ou gérer des versions.

### SUSPENDED
Pack temporairement indisponible.

### DEPRECATED
Pack ancien, encore visible mais déconseillé pour de nouvelles utilisations.

### ARCHIVED
Pack retiré des opérations normales.

---

## 12. Source Type

Types recommandés :

```text
SYSTEM
TEMPLATE
CUSTOM
IMPORTED
CLONED
GENERATED
```

### SYSTEM
Pack fourni par la plateforme.

### TEMPLATE
Pack issu d’un modèle.

### CUSTOM
Pack créé manuellement.

### IMPORTED
Pack importé.

### CLONED
Pack dupliqué depuis un autre pack.

### GENERATED
Pack généré par outil ou automatisation validée.

---

## 13. Création d’un pack

Modes possibles :

```text
EMPTY
FROM_TEMPLATE
DUPLICATE
IMPORT
```

Le mode `GENERATED` pourra être pris en charge ultérieurement par un flux IA contrôlé.

---

## 14. Création vide

L’utilisateur renseigne :

- code ;
- nom ;
- shortName ;
- description ;
- catégorie ;
- icône ;
- sourceType = CUSTOM.

Le backend :

1. valide les données ;
2. vérifie l’unicité ;
3. résout le tenant ;
4. crée le pack ;
5. écrit l’audit ;
6. produit un Outbox Event ;
7. renvoie le pack créé.

---

## 15. Création depuis Template

Flux :

```text
Choisir Template
 ↓
Preview
 ↓
Personnaliser identité
 ↓
Impact Preview
 ↓
Créer Pack
 ↓
Créer première PackVersion DRAFT si prévu
```

Le template ne doit pas être copié sans validation.

---

## 16. Duplication

La duplication doit permettre :

```text
Pack source
 ↓
Clone identité
 ↓
Nouveau code
 ↓
Nouveau nom
 ↓
Option : cloner dernière version DRAFT/PUBLISHED
 ↓
Nouveau Pack
```

La duplication ne doit jamais conserver des identifiants internes provoquant des collisions.

---

## 17. Archivage

Un pack peut être archivé seulement si les règles métier le permettent.

Contrôles possibles :

- aucune publication active critique ;
- aucune dépendance REQUIRED non résolue chez un consommateur ;
- utilisateur autorisé ;
- confirmation explicite.

Le backend doit produire une analyse d’impact avant archivage si nécessaire.

---

## 18. Restauration

Un pack archivé peut être restauré si :

- le code n’a pas été réutilisé ;
- aucune contrainte bloquante n’existe ;
- l’utilisateur a la permission.

---

## 19. Suppression physique

Interdite par défaut.

La suppression physique est réservée à :

- données de test ;
- cas techniques maîtrisés ;
- opérations administratives exceptionnelles.

Le comportement standard est l’archivage.

---

## 20. Liste des packs

Colonnes recommandées :

```text
Nom
Code
Catégorie
Statut
Source
Nb Versions
Dernière Version
Dernière Modification
Auteur
Actions
```

Actions :

```text
Voir
Modifier
Versions
Dupliquer
Archiver
```

---

## 21. Recherche

Recherche par :

- code ;
- nom ;
- shortName ;
- description ;
- catégorie.

La recherche est :

- backend ;
- paginée ;
- tenant-scoped ;
- protégée contre requêtes excessives.

---

## 22. Filtres

Filtres minimaux :

```text
status
category
sourceType
archived
createdBy
updatedFrom
updatedTo
```

---

## 23. Tri

Tri :

```text
name
code
createdAt
updatedAt
status
category
```

---

## 24. Fiche détail Pack

Sections recommandées :

```text
Identité
Statut
Métadonnées
Catégorie
Versions
Utilisation
Historique
Audit
```

La fiche doit afficher un résumé des versions, sans remplacer PM-CDC-03.

---

## 25. Modification

Champs modifiables selon statut :

### DRAFT / ACTIVE
- name ;
- shortName ;
- description ;
- category ;
- iconKey ;
- logoRef ;
- metadata autorisées.

### PUBLISHED version existante
Le Pack lui-même peut garder certaines métadonnées modifiables, mais aucune modification ne doit changer rétroactivement un snapshot de PackVersion publiée.

---

## 26. Optimistic Locking

Toute mise à jour utilise la version technique.

Exemple :

```json
{
  "id": "pack_001",
  "version": 4,
  "name": "Gestion de stock"
}
```

Si la base contient `version = 5` :

```text
409 CONFLICT
PACK_VERSION_CONFLICT
```

---

## 27. API — Liste

```http
GET /api/pack-manager/packs
```

Query parameters :

```text
search?
status?
categoryId?
sourceType?
archived?
cursor?
limit?
sort?
order?
```

---

## 28. API — Détail

```http
GET /api/pack-manager/packs/:id
```

Doit retourner :

- identité ;
- statut ;
- métadonnées ;
- résumé versions ;
- compteurs utiles ;
- droits applicables si nécessaire.

---

## 29. API — Création

```http
POST /api/pack-manager/packs
```

Exemple :

```json
{
  "code": "stock",
  "name": "Gestion de stock",
  "shortName": "Stock",
  "description": "Pack de gestion de stock",
  "categoryId": "cat_commerce",
  "iconKey": "warehouse",
  "sourceType": "CUSTOM"
}
```

---

## 30. API — Modification

```http
PATCH /api/pack-manager/packs/:id
```

Doit inclure la version technique attendue.

---

## 31. API — Duplication

```http
POST /api/pack-manager/packs/:id/duplicate
```

Payload :

```json
{
  "code": "stock-pro",
  "name": "Stock Pro",
  "cloneLatestVersion": true
}
```

---

## 32. API — Archivage

```http
POST /api/pack-manager/packs/:id/archive
```

Payload :

```json
{
  "reason": "Pack remplacé par une nouvelle offre"
}
```

---

## 33. API — Restore

```http
POST /api/pack-manager/packs/:id/restore
```

---

## 34. Permissions IAM

Permissions recommandées :

```text
pack.read
pack.create
pack.update
pack.duplicate
pack.archive
pack.restore
```

Le backend vérifie systématiquement les permissions.

---

## 35. Multi-tenant

Toutes les opérations doivent être tenant-scoped.

Le backend résout le tenant depuis le contexte IAM.

Le client ne doit jamais pouvoir forcer un `tenantId` arbitraire.

---

## 36. Audit

Événements :

```text
pack.created
pack.updated
pack.duplicated
pack.archived
pack.restored
```

Champs :

```text
traceId
tenantId
actorId
packId
action
before
after
result
timestamp
```

---

## 37. Outbox Events

Événements :

```text
pack.created
pack.updated
pack.archived
pack.restored
```

Consommateurs possibles :

- PM-CDC-01 Dashboard ;
- PM-CDC-03 Versions ;
- Pack Runtime Registry ;
- Publication / Deployment.

---

## 38. Validation métier

Création ou modification refusée si :

- code invalide ;
- code déjà utilisé ;
- catégorie inexistante ;
- sourceType invalide ;
- pack archivé ;
- version technique obsolète ;
- permission absente.

---

## 39. Codes d’erreur

```text
PACK_NOT_FOUND
PACK_CODE_ALREADY_EXISTS
PACK_CODE_INVALID
PACK_ARCHIVED
PACK_VERSION_CONFLICT
PACK_CATEGORY_NOT_FOUND
PACK_OPERATION_FORBIDDEN
PACK_ARCHIVE_BLOCKED
PACK_RESTORE_BLOCKED
```

---

## 40. États UI

```text
LOADING
READY
EMPTY
ERROR
FORBIDDEN
READ_ONLY
SAVING
SAVED
UNSAVED
CONFLICT
ARCHIVING
```

---

## 41. Formulaire création/édition

Sections :

```text
Informations générales
├── Code
├── Nom
├── Nom court
├── Description
├── Catégorie
├── Icône
└── Logo

Configuration
├── Source Type
└── Metadata autorisées
```

---

## 42. UX création

Flux :

```text
Créer Pack
 ↓
Informations générales
 ↓
Validation locale
 ↓
Validation backend
 ↓
Créer
 ↓
Pack créé
 ↓
[Créer une version] ou [Retour liste]
```

---

## 43. Confirmation des actions sensibles

Obligatoire pour :

- archivage ;
- restauration si impact ;
- duplication avec clonage de version ;
- changements pouvant modifier l’usage global du pack.

---

## 44. Frontend React

Organisation indicative :

```text
src/features/pack-manager/packs/
├── pages/
├── components/
├── forms/
├── hooks/
├── services/
├── types/
└── tests/
```

Composants possibles :

```text
PackList
PackFilters
PackCard
PackDetails
PackForm
PackStatusBadge
PackActionsMenu
ArchivePackDialog
DuplicatePackDialog
```

---

## 45. Backend NestJS

Organisation indicative :

```text
src/pack-manager/packs/
├── packs.controller.ts
├── packs.service.ts
├── packs.repository.ts
├── packs.mapper.ts
├── dto/
├── domain/
└── tests/
```

---

## 46. Prisma — Modèle conceptuel

```text
Pack
├── id
├── tenantId
├── code
├── name
├── shortName
├── description
├── categoryId
├── iconKey
├── logoRef
├── status
├── sourceType
├── metadata
├── createdAt
├── createdBy
├── updatedAt
├── updatedBy
├── archivedAt
└── version
```

Relations :

```text
Pack
├── PackVersion[]
├── AuditEvent[]
└── OutboxEvent[]
```

---

## 47. Contraintes DB

Prévoir :

- UUID PK ;
- index tenantId ;
- index status ;
- index categoryId ;
- unique `(tenantId, code)` ;
- index updatedAt ;
- version technique ;
- archivedAt.

---

## 48. Performance

La liste doit utiliser :

- pagination ;
- filtres SQL ;
- index ;
- select ciblé ;
- compteurs optimisés ;
- absence de N+1.

---

## 49. Mock / Simulation

PM-CDC-02 doit être testable même si PM-CDC-03 n’est pas terminé.

Exemple :

```text
PackService
   ↓
PackVersionSummaryProvider
   ├── Mock Provider
   └── Real Provider
```

Le contrat entre PM-CDC-02 et PM-CDC-03 doit être stabilisé avant intégration.

---

## 50. Contract Tests

Tester :

- Pack Summary Contract ;
- Version Summary Contract ;
- erreurs ;
- pagination ;
- enums ;
- tenant isolation ;
- optimistic locking.

---

## 51. Tests unitaires

- code validation ;
- lifecycle pack ;
- duplication ;
- archivage ;
- restore ;
- version conflict ;
- mapping DTO/domain.

---

## 52. Tests intégration

- Prisma ;
- unique code ;
- tenant isolation ;
- transactions ;
- archivage ;
- pagination ;
- recherche ;
- filtres.

---

## 53. Tests E2E web

```text
Ouvrir Pack Manager
→ Packs
→ Créer
→ Sauvegarder
→ Ouvrir fiche
→ Modifier
→ Dupliquer
→ Archiver
→ Restaurer
```

---

## 54. Critères d’acceptation

PM-CDC-02 est conforme si :

- liste packs disponible ;
- création fonctionnelle ;
- modification sécurisée ;
- duplication fonctionnelle ;
- archivage/restauration contrôlés ;
- code unique ;
- optimistic locking ;
- IAM appliqué ;
- tenant isolation ;
- audit ;
- outbox ;
- responsive ;
- tests passants.

---

## 55. Definition of Done

```text
PM-CDC-02 DONE
├── Pack Model
├── Pack List
├── Search
├── Filters
├── Detail
├── Create
├── Edit
├── Duplicate
├── Archive
├── Restore
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

## 56. Résultat attendu

À la fin de PM-CDC-02, Techzone Cloud dispose d’un registre fiable des packs.

```text
PACK IDENTITY
+
STATUS
+
CATEGORY
+
SOURCE
+
AUDIT
+
VERSION SAFETY
=
BASE STABLE POUR PM-CDC-03
```

> **PM-CDC-02 définit l’identité stable du pack. PM-CDC-03 porte son évolution versionnée.**
