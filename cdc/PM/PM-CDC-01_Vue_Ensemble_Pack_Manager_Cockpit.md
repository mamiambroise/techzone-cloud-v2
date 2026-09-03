# PM-CDC-01 — Vue d’ensemble / Pack Manager Cockpit

**Projet :** Techzone Cloud  
**Module :** Pack Manager  
**Équipe :** Team 3 — Business Manager, Pack & UI Runtime  
**Référence :** PM-CDC-01  
**Version :** 1.0  
**Statut :** Cahier des charges fonctionnel et technique  
**Dépendance obligatoire :** PM-CDC-00 — Socle, Architecture & Contrats communs  
**Stack cible :** React · NestJS · Prisma · PostgreSQL

---

## 1. Objet

PM-CDC-01 définit la **Vue d’ensemble / Pack Manager Cockpit**.

Cette vue est le point d’entrée opérationnel du Pack Manager. Elle doit permettre à un développeur, administrateur ou responsable produit de comprendre immédiatement :

- quels packs existent ;
- leur état ;
- leurs versions ;
- leur niveau de validation ;
- leurs dépendances ;
- leurs anomalies ;
- leur état de publication ;
- leur capacité à produire un Pack Manifest valide ;
- leur consommation éventuelle par le Pack Runtime.

PM-CDC-01 ne remplace pas PM-CDC-02 à PM-CDC-07. Il agrège et synthétise les informations provenant de ces modules.

---

## 2. Position dans le Pack Manager

```text
PACK MANAGER
│
├── Vue d’ensemble        ← PM-CDC-01
├── Packs                 ← PM-CDC-02
├── Versions de packs     ← PM-CDC-03
├── Modules               ← PM-CDC-04
├── Features              ← PM-CDC-05
├── Dépendances           ← PM-CDC-06
└── Règles & Conditions   ← PM-CDC-07
```

La Vue d’ensemble agit comme un **cockpit de supervision et de navigation**.

---

## 3. Objectifs fonctionnels

Le cockpit doit permettre de :

1. visualiser l’état global du Pack Manager ;
2. connaître le nombre de packs par statut ;
3. détecter les versions non valides ou obsolètes ;
4. identifier les dépendances manquantes ou conflictuelles ;
5. identifier les versions prêtes à publier ;
6. identifier les versions publiées ;
7. vérifier l’état des Pack Manifests ;
8. visualiser les derniers événements ;
9. accéder rapidement aux packs nécessitant une action ;
10. filtrer les informations par tenant, application, version, environnement ou statut selon le contexte disponible.

---

## 4. Principes UX

La Vue d’ensemble doit être lisible sans expertise technique avancée.

Elle doit répondre en priorité à cinq questions :

```text
1. Combien de packs existent ?
2. Quels packs sont sains ?
3. Quels packs ont un problème ?
4. Quels packs sont prêts à publier ?
5. Où faut-il agir maintenant ?
```

Le cockpit doit éviter l’effet "dashboard décoratif". Chaque indicateur doit pouvoir conduire vers un écran d’action.

---

## 5. Structure recommandée de l’écran

```text
PACK MANAGER — VUE D’ENSEMBLE

┌─────────────────────────────────────────────────────┐
│ Header contexte                                     │
│ Tenant • Application • Version • Environment        │
└─────────────────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────┐
│ Packs    │ Draft    │ Ready    │ Published│
│ total    │          │          │          │
└──────────┴──────────┴──────────┴──────────┘

┌──────────────────────────────┐
│ Santé globale des packs      │
└──────────────────────────────┘

┌──────────────────────────────┬──────────────────────┐
│ Validation                   │ Dépendances          │
│ Valid / Invalid / Outdated   │ OK / Missing/Conflict│
└──────────────────────────────┴──────────────────────┘

┌──────────────────────────────┬──────────────────────┐
│ Manifests                    │ Publications         │
│ Valid / Missing / Invalid    │ Ready / Published    │
└──────────────────────────────┴──────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Packs nécessitant une action                        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Activité récente / historique                       │
└─────────────────────────────────────────────────────┘
```

---

## 6. Bloc — Header de contexte

Le header doit afficher le contexte courant.

Champs possibles :

- tenant ;
- application ;
- application version ;
- environnement ;
- filtre de statut ;
- recherche.

Exemple :

```text
Tenant       : Techzone Demo
Application  : Gestion Commerciale
Version      : 1.4.0
Environment  : TEST
```

Le contexte doit provenir du contrat IAM / Application Context concerné.

Le navigateur ne doit pas être considéré comme source de vérité pour `tenantId`, `actorId` ou permissions.

---

## 7. Bloc — KPI principaux

KPI minimaux :

- Total Packs ;
- Draft ;
- Configuring ;
- Validating ;
- Ready ;
- Published ;
- Invalid ;
- Archived.

Exemple :

```text
Total Packs       18
Draft              5
Ready              4
Published          7
Invalid            2
```

Chaque KPI est cliquable et applique un filtre.

---

## 8. Bloc — Santé globale

Le cockpit calcule un état synthétique.

États recommandés :

```text
HEALTHY
WARNING
CRITICAL
UNKNOWN
```

Exemple de règles :

### HEALTHY
- aucune version invalide ;
- aucune dépendance bloquante ;
- aucun manifest invalide ;
- aucune validation obsolète critique.

### WARNING
- validation OUTDATED ;
- dépendance optionnelle manquante ;
- pack DRAFT ancien ;
- manifest non encore généré sur une version non publiée.

### CRITICAL
- dépendance REQUIRED manquante ;
- cycle interdit ;
- conflit de versions ;
- manifest invalide ;
- version publiée incohérente ;
- erreur de génération répétée.

---

## 9. Bloc — Validation

Afficher les états :

```text
NOT_RUN
RUNNING
VALID
INVALID
OUTDATED
ERROR
```

Indicateurs :

- nombre par statut ;
- taux de validation ;
- dernières validations ;
- temps moyen de validation ;
- validations échouées récemment.

Les entrées `INVALID`, `OUTDATED` et `ERROR` doivent être accessibles directement.

---

## 10. Bloc — Dépendances

Afficher :

- dépendances totales ;
- dépendances REQUIRED ;
- dépendances OPTIONAL ;
- dépendances manquantes ;
- conflits ;
- incompatibilités de versions ;
- cycles détectés.

Exemple :

```text
Dependencies
✓ 42 resolved
⚠ 3 optional missing
✕ 2 blocking conflicts
```

Cliquer ouvre PM-CDC-06 avec les filtres correspondants.

---

## 11. Bloc — Pack Manifest

Indicateurs :

- manifests générés ;
- manifests valides ;
- manifests invalides ;
- manifests absents ;
- manifests obsolètes ;
- dernière génération ;
- hash du dernier manifest publié.

États recommandés :

```text
NOT_GENERATED
GENERATING
VALID
INVALID
OUTDATED
ERROR
```

Le cockpit doit permettre d’identifier immédiatement une version `READY` sans manifest valide.

---

## 12. Bloc — Publication

Afficher :

- versions prêtes ;
- versions publiées ;
- versions bloquées ;
- dernières publications ;
- dernières erreurs de publication.

Actions possibles selon permissions :

```text
Voir
Valider
Générer Manifest
Comparer
Publier
```

La publication ne doit jamais être exécutée sans les règles de PM-CDC-00.

---

## 13. Bloc — Packs nécessitant une action

Le cockpit doit produire une liste priorisée.

Exemples :

```text
CRITICAL — Pack Stock 2.0.0
Dependency "catalog >= 2.0" missing

ERROR — Pack Vente 1.4.0
Manifest generation failed

WARNING — Pack Restaurant 1.2.0
Validation outdated

INFO — Pack Garage 1.0.0
Ready for publication
```

Colonnes recommandées :

- severity ;
- pack ;
- version ;
- problème ;
- origine ;
- date ;
- action principale.

---

## 14. Priorité des alertes

Ordre recommandé :

```text
CRITICAL
ERROR
WARNING
INFO
```

Les alertes critiques doivent toujours apparaître avant les indicateurs non bloquants.

---

## 15. Bloc — Activité récente

Afficher les derniers événements du Pack Manager.

Événements exemples :

```text
pack.created
pack.updated
pack.archived
pack.version.created
pack.version.cloned
pack.version.validated
pack.version.ready
pack.version.published
pack.manifest.generated
dependency.added
dependency.conflict_detected
feature.enabled
rule.updated
```

Colonnes :

- date ;
- acteur ;
- événement ;
- cible ;
- résultat ;
- traceId.

---

## 16. Recherche globale

La recherche doit pouvoir retrouver au minimum :

- code de pack ;
- nom ;
- version ;
- module ;
- feature ;
- capability.

La recherche doit être backend, paginée et tenant-scoped.

---

## 17. Filtres

Filtres recommandés :

- status ;
- validationStatus ;
- manifestStatus ;
- category ;
- sourceType ;
- tenant ;
- application ;
- applicationVersion ;
- environment ;
- date de mise à jour ;
- auteur.

Les filtres actifs doivent rester visibles.

---

## 18. Tri

Tri minimal :

- nom ;
- code ;
- dernière modification ;
- statut ;
- version ;
- validation ;
- publication.

---

## 19. États UI

Le cockpit doit gérer explicitement :

```text
LOADING
READY
EMPTY
ERROR
FORBIDDEN
READ_ONLY
PARTIAL
REFRESHING
```

### EMPTY
Aucun pack disponible.

Proposer selon permission :

```text
Créer un pack
Importer un pack
```

### PARTIAL
Certaines sources d’information sont indisponibles. Le cockpit continue d’afficher les données disponibles et signale la partie manquante.

---

## 20. Navigation contextuelle

Depuis le cockpit :

```text
Pack → PM-CDC-02
Version → PM-CDC-03
Module → PM-CDC-04
Feature → PM-CDC-05
Dependency → PM-CDC-06
Rule → PM-CDC-07
```

Le cockpit ne doit pas réimplémenter les écrans spécialisés.

---

## 21. Backend NestJS

Module indicatif :

```text
src/pack-manager/dashboard/
├── dashboard.controller.ts
├── dashboard.service.ts
├── dashboard.repository.ts
├── dashboard.types.ts
├── dashboard.mapper.ts
└── dashboard.spec.ts
```

Responsabilités du backend :

- agréger les données ;
- appliquer tenant scope ;
- vérifier IAM ;
- calculer les indicateurs ;
- produire les anomalies ;
- limiter la volumétrie ;
- tracer les requêtes ;
- fournir des liens/identifiants vers les ressources concernées.

---

## 22. API — Dashboard

Endpoint recommandé :

```http
GET /api/pack-manager/dashboard
```

Paramètres :

```text
applicationId?
applicationVersionId?
environment?
status?
validationStatus?
category?
search?
```

Réponse conceptuelle :

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalPacks": 18,
      "draft": 5,
      "ready": 4,
      "published": 7,
      "invalid": 2
    },
    "health": {
      "status": "WARNING"
    },
    "validation": {},
    "dependencies": {},
    "manifests": {},
    "publication": {},
    "attention": [],
    "recentActivity": []
  },
  "error": null,
  "meta": {
    "traceId": "trace_123"
  }
}
```

---

## 23. API — Packs nécessitant une action

```http
GET /api/pack-manager/dashboard/attention
```

Paramètres possibles :

```text
severity?
limit?
cursor?
```

---

## 24. API — Activité récente

```http
GET /api/pack-manager/dashboard/activity
```

Filtres :

```text
eventType?
actorId?
packId?
from?
to?
limit?
cursor?
```

---

## 25. Performance

Le dashboard ne doit pas exécuter une multitude de requêtes N+1.

Prévoir :

- agrégations SQL ;
- index ;
- requêtes optimisées ;
- pagination ;
- cache court des KPI si nécessaire ;
- invalidation sur événements Pack Manager.

Exemple :

```text
pack.updated
        ↓
invalidate dashboard summary
```

---

## 26. Cache

Le cache du cockpit peut être utilisé pour les agrégats non critiques.

Ne pas mettre en cache de manière longue :

- permissions ;
- erreurs critiques ;
- décisions de publication ;
- données nécessitant une cohérence immédiate.

---

## 27. Sécurité

Toutes les APIs doivent :

- exiger authentification ;
- résoudre le tenant côté backend ;
- vérifier les permissions ;
- filtrer les données par tenant ;
- éviter l’exposition de secrets ;
- appliquer les limites de pagination ;
- journaliser les opérations sensibles.

Permission indicative :

```text
pack.dashboard.read
```

Les actions rapides réutilisent les permissions de leur domaine :

```text
pack.version.publish
pack.version.validate
pack.update
```

---

## 28. Audit

Une simple consultation du cockpit n’a pas besoin d’un audit métier exhaustif.

Les actions déclenchées depuis le cockpit doivent toutefois être auditées par leurs domaines respectifs.

Exemple :

```text
Utilisateur clique Publier
        ↓
PM-CDC-03 / publication service
        ↓
Audit Event
```

---

## 29. Observabilité technique

Mesures utiles :

- latence endpoint dashboard ;
- erreurs ;
- timeouts ;
- cache hit ratio ;
- taille de réponse ;
- nombre de packs agrégés ;
- temps de calcul santé ;
- appels aux contrats externes.

Chaque requête utilise un `traceId`.

---

## 30. Données externes et contrats

Le cockpit peut afficher certaines informations provenant d’autres domaines, mais uniquement par contrat.

Exemples :

```text
IAM Context Contract
Application Context Contract
Pack Manifest Contract
Runtime Status Contract
```

Il ne doit pas accéder directement aux tables internes d’un autre pack.

---

## 31. Simulation / Mock

Le cockpit doit être développable avant que tous les sous-modules soient terminés.

Exemple :

```text
DashboardService
   │
   ├── PackSummaryProvider
   ├── ValidationSummaryProvider
   ├── DependencySummaryProvider
   └── ManifestSummaryProvider
```

Chaque provider peut disposer de :

```text
MockProvider
RealProvider
```

Règle :

```text
CONTRACT v1 🔒
+
MOCK CONFORME
=
DÉVELOPPEMENT PARALLÈLE
```

---

## 32. Contract Tests

Les données simulées et réelles doivent respecter les mêmes contrats.

Tests :

- structure du summary ;
- enums ;
- severity ;
- pagination ;
- erreurs ;
- tenant isolation ;
- absence de secrets ;
- compatibilité des versions.

---

## 33. Maquette fonctionnelle cible

```text
┌─────────────────────────────────────────────────────┐
│ PACK MANAGER                           [Refresh]     │
│ Tenant A / Application Vente / TEST                 │
├─────────────────────────────────────────────────────┤
│ Total 18 │ Draft 5 │ Ready 4 │ Published 7 │ Err 2 │
├───────────────────────┬─────────────────────────────┤
│ HEALTH                │ VALIDATION                  │
│ ⚠ WARNING             │ 14 Valid / 2 Outdated      │
├───────────────────────┼─────────────────────────────┤
│ DEPENDENCIES          │ MANIFESTS                   │
│ 42 OK / 2 Conflicts   │ 12 Valid / 1 Invalid       │
├─────────────────────────────────────────────────────┤
│ ATTENTION REQUIRED                                  │
│ 🔴 Stock 2.0  Missing dependency                    │
│ 🟠 Vente 1.4  Manifest invalid                      │
│ 🟡 Resto 1.2  Validation outdated                   │
├─────────────────────────────────────────────────────┤
│ RECENT ACTIVITY                                     │
│ 10:42 Pack Stock validated                          │
│ 10:31 Pack Vente updated                            │
└─────────────────────────────────────────────────────┘
```

---

## 34. Responsive

### Desktop
Vue complète avec cartes + tableaux.

### Tablette
2 colonnes.

### Mobile
1 colonne, KPI compactés, tables converties en listes/cartes.

---

## 35. Accessibilité

Prévoir :

- labels explicites ;
- navigation clavier ;
- contraste suffisant ;
- état non communiqué uniquement par couleur ;
- icône + texte pour severity ;
- aria-label sur actions ;
- focus visible.

---

## 36. Critères d’acceptation frontend

Le frontend est conforme si :

- la sidebar Pack Manager ouvre `Vue d’ensemble` ;
- les KPI sont visibles ;
- les filtres fonctionnent ;
- les états loading/empty/error sont gérés ;
- les alertes sont priorisées ;
- un clic sur une anomalie ouvre le bon écran ;
- les actions sont visibles uniquement si pertinentes ;
- l’UI reste lisible sur desktop/tablette/mobile ;
- aucun calcul de permission critique n’est effectué uniquement côté client.

---

## 37. Critères d’acceptation backend

Le backend est conforme si :

- endpoint dashboard disponible ;
- tenant isolation appliquée ;
- IAM appliqué ;
- agrégations correctes ;
- pagination correcte ;
- traceId présent ;
- performance acceptable ;
- contrats internes respectés ;
- erreurs standardisées ;
- aucune dépendance directe aux tables d’un autre domaine ;
- tests disponibles.

---

## 38. Tests obligatoires

### Unit
- calcul des KPI ;
- calcul de health ;
- priorité severity ;
- mapping des anomalies.

### Integration
- Prisma ;
- tenant isolation ;
- filtres ;
- pagination ;
- agrégations.

### Contract
- Mock vs Real providers ;
- dashboard response contract.

### E2E Web
```text
Ouvrir Pack Manager
→ Voir Vue d’ensemble
→ Filtrer
→ Ouvrir une anomalie
→ Aller au pack/version concerné
→ Retour cockpit
```

---

## 39. Definition of Done

```text
PM-CDC-01 DONE
├── Vue d’ensemble React
├── Context header
├── KPI
├── Health
├── Validation summary
├── Dependency summary
├── Manifest summary
├── Publication summary
├── Attention list
├── Recent activity
├── Filters
├── Search
├── NestJS APIs
├── IAM / Tenant isolation
├── Mocks
├── Contract Tests
├── Unit Tests
├── Integration Tests
└── E2E Web
```

---

## 40. Résultat attendu

La Vue d’ensemble doit permettre de savoir en quelques secondes :

```text
QUELS PACKS EXISTENT
        +
DANS QUEL ÉTAT
        +
QUELS PROBLÈMES BLOQUENT
        +
QUELS PACKS SONT PRÊTS
        +
QUELLE ACTION FAIRE ENSUITE
```

> **PM-CDC-01 est le cockpit du Pack Manager : il observe, synthétise et oriente l’utilisateur vers PM-CDC-02 à PM-CDC-07 sans dupliquer leur logique métier.**
