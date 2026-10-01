# CAHIER DES CHARGES --- TECHZONE CLOUD SIDEBAR & NAVIGATION GLOBALE

**Version :** 2.0 --- Consolidation de la navigation plateforme\
**Date :** Septembre 2026\
**Projet :** Techzone Cloud\
**Statut :** Spécification fonctionnelle et technique consolidée\
**Position :** Navigation globale de la plateforme

------------------------------------------------------------------------

## 1. Objectif

La Sidebar est le système principal de navigation globale de Techzone
Cloud.

Elle doit permettre de comprendre immédiatement la structure de la
plateforme :

``` text
ACCUEIL
    ↓
CONSTRUCTION
    ↓
EXÉCUTION
    ↓
DONNÉES & INTÉGRATIONS
    ↓
PLATEFORME
```

Elle doit être dynamique, permission-aware, tenant-aware, responsive,
extensible, cohérente avec Registry, capable de gérer les modules
indisponibles et sans duplication de navigation.

**Principe fondamental : la Sidebar navigue ; elle ne possède aucune
logique métier.**

------------------------------------------------------------------------

## 2. Architecture cible

``` text
TECHZONE CLOUD

ACCUEIL
└── Tableau de bord

CONSTRUCTION
├── Business Manager
│   ├── Vue d'ensemble
│   ├── Applications
│   ├── Modèles de données
│   ├── Fonctionnalités
│   ├── Navigation
│   ├── Configuration
│   └── Validation
│
├── UI Builder
│   ├── Vue d'ensemble
│   ├── Pages
│   ├── Éditeur visuel
│   ├── Composants
│   ├── Formulaires
│   ├── Navigation
│   ├── Thème
│   └── Aperçu & Test
│
├── Automatisation
│   ├── Vue d'ensemble
│   ├── Workflows
│   ├── Déclencheurs
│   ├── Actions
│   ├── Planifications
│   ├── Exécutions
│   ├── Modèles
│   └── Diagnostics
│
└── Pack Manager
    ├── Vue d'ensemble
    ├── Packs
    ├── Versions
    ├── Modules
    ├── Fonctionnalités
    ├── Capacités
    ├── Dépendances
    ├── Règles
    ├── Validation & Manifest
    └── Publication

EXÉCUTION
└── Runtime
    ├── Vue d'ensemble
    ├── Contextes
    ├── Manifest
    ├── Résolution
    ├── Configuration effective
    ├── Cache
    └── Diagnostics

DONNÉES & INTÉGRATIONS
├── Données
│   ├── Vue d'ensemble
│   ├── Sources
│   ├── Modèles & Contrats
│   ├── Requêtes
│   ├── Politiques
│   └── Diagnostics
│
├── ERP / Dolibarr
│   ├── Vue d'ensemble
│   ├── Ressources
│   ├── Mappings
│   ├── Synchronisations
│   └── Diagnostics
│
└── API & Intégrations
    ├── Vue d'ensemble
    ├── Connecteurs
    ├── Webhooks
    └── Diagnostics

PLATEFORME
├── Registry
│   ├── Vue d'ensemble
│   ├── Entrées
│   ├── Capacités
│   ├── Providers
│   ├── Compatibilité
│   └── Diagnostics
│
├── Environnements
├── Déploiements
├── Sécurité & IAM
├── Observabilité
├── Abonnements
└── Administration
```

------------------------------------------------------------------------

## 3. Règle de responsabilité

``` text
SIDEBAR
   ↓
Navigation Definition
   ↓
Route
   ↓
Module propriétaire
```

La Sidebar ne contient ni publication de Pack, ni exécution Runtime, ni
workflow Automation, ni requête Data, ni synchronisation ERP.

------------------------------------------------------------------------

## 4. Niveaux de navigation

Maximum recommandé : trois niveaux globaux.

``` text
NIVEAU 1 : Section
NIVEAU 2 : Module
NIVEAU 3 : Page du module
```

Les ressources dynamiques et détails métier restent dans le workspace du
module.

Exemple :

``` text
SIDEBAR
Pack Manager
├── Packs
├── Versions
└── Validation & Manifest

WORKSPACE
TechBoutique / v1.2.0 / DRAFT
Overview | Composition | Modules | Features | Dependencies | Validation
```

------------------------------------------------------------------------

## 5. Business Manager

``` text
Business Manager
├── Vue d'ensemble
├── Applications
├── Modèles de données
├── Fonctionnalités
├── Navigation
├── Configuration
└── Validation
```

`Validation & publication` devient `Validation` : Business Manager
valide la Business Definition ; Pack Manager possède la publication
globale.

------------------------------------------------------------------------

## 6. UI Builder

``` text
UI Builder
├── Vue d'ensemble
├── Pages
├── Éditeur visuel
├── Composants
├── Formulaires
├── Navigation
├── Thème
└── Aperçu & Test
```

Bindings, actions UI, responsive et propriétés restent contextuels dans
l'éditeur.

------------------------------------------------------------------------

## 7. Automatisation

``` text
Automatisation
├── Vue d'ensemble
├── Workflows
├── Déclencheurs
├── Actions
├── Planifications
├── Exécutions
├── Modèles
└── Diagnostics
```

Conditions, branches, variables et nodes restent principalement dans le
Workflow Builder.

------------------------------------------------------------------------

## 8. Pack Manager

``` text
Pack Manager
├── Vue d'ensemble
├── Packs
├── Versions
├── Modules
├── Fonctionnalités
├── Capacités
├── Dépendances
├── Règles
├── Validation & Manifest
└── Publication
```

**Interdit :** ajouter `Pack Runtime` comme enfant de Pack Manager.

------------------------------------------------------------------------

## 9. Runtime

Une seule entrée globale sous `EXÉCUTION` :

``` text
Runtime
├── Vue d'ensemble
├── Contextes
├── Manifest
├── Résolution
├── Configuration effective
├── Cache
└── Diagnostics
```

Elle représente Pack Runtime fonctionnellement sans dupliquer Runtime
dans la Sidebar.

------------------------------------------------------------------------

## 10. Données

L'expérience utilisateur expose `Données`, pas deux menus
`Data Platform` et `Data Runtime`.

``` text
Données
├── Vue d'ensemble
├── Sources
├── Modèles & Contrats
├── Requêtes
├── Politiques
└── Diagnostics
```

La séparation Data Platform / Data Runtime reste technique.

------------------------------------------------------------------------

## 11. ERP / Dolibarr

``` text
ERP / Dolibarr
├── Vue d'ensemble
├── Ressources
├── Mappings
├── Synchronisations
└── Diagnostics
```

Architecture sous-jacente :

``` text
ERP / Dolibarr
      ↓
ERP Adapter
      ↓
Integration Hub
```

------------------------------------------------------------------------

## 12. API & Intégrations

``` text
API & Intégrations
├── Vue d'ensemble
├── Connecteurs
├── Webhooks
└── Diagnostics
```

Les connecteurs non ERP sont gérés ici. Éviter de faire apparaître deux
fois le même connecteur Dolibarr.

------------------------------------------------------------------------

## 13. Registry

``` text
Registry
├── Vue d'ensemble
├── Entrées
├── Capacités
├── Providers
├── Compatibilité
└── Diagnostics
```

Registry appartient à `PLATEFORME` et peut être masqué pour les profils
métier ne disposant pas des permissions nécessaires.

------------------------------------------------------------------------

## 14. Environnements

Avant consolidation du module :

``` text
Environnements
```

À terme :

``` text
Environnements
├── Vue d'ensemble
├── Environnements
├── Variables
├── Configuration
└── Diagnostics
```

DEV, STAGING et PRODUCTION sont des ressources dynamiques et ne doivent
pas devenir des entrées statiques principales.

------------------------------------------------------------------------

## 15. Déploiements

Architecture cible :

``` text
Déploiements
├── Vue d'ensemble
├── Déploiements
├── Activations
├── Historique
└── Rollback
```

------------------------------------------------------------------------

## 16. Sécurité & IAM

Architecture indicative :

``` text
Sécurité & IAM
├── Vue d'ensemble
├── Utilisateurs
├── Identités
├── Rôles
├── Permissions
├── Entreprises / Tenants
├── Sessions
└── Audit sécurité
```

La sous-navigation finale doit être alignée sur le CDC IAM et
l'implémentation existante.

------------------------------------------------------------------------

## 17. Observabilité

Architecture cible :

``` text
Observabilité
├── Vue d'ensemble
├── Santé
├── Logs
├── Traces
├── Métriques
├── Erreurs
└── Alertes
```

Ne pas afficher comme fonctionnelles des pages qui ne sont pas
réellement disponibles.

------------------------------------------------------------------------

## 18. Abonnements

Architecture cible indicative :

``` text
Abonnements
├── Vue d'ensemble
├── Plans
├── Abonnements
├── Usage
├── Facturation
└── Historique
```

À consolider avec le CDC Subscription & Billing.

------------------------------------------------------------------------

## 19. Administration

``` text
Administration
├── Vue d'ensemble
├── Paramètres plateforme
├── Fonctionnalités
├── Maintenance
└── Audit
```

Ne pas déplacer dans Administration les responsabilités déjà détenues
par un module officiel.

------------------------------------------------------------------------

## 20. Navigation dynamique

La Sidebar ne doit pas nécessairement être un grand tableau React codé
en dur.

Modèle conceptuel :

``` json
{
  "key": "pack-manager",
  "label": "Pack Manager",
  "icon": "Package",
  "section": "construction",
  "route": "/pack-manager",
  "permission": "pack.read",
  "children": []
}
```

Une configuration frontend/backend contrôlée peut suffire. Ne pas créer
une base de données de navigation sans besoin réel.

------------------------------------------------------------------------

## 21. Effective Navigation

``` text
Base Navigation
      +
IAM Permissions
      +
Tenant Context
      +
Features
      +
Module Availability
      ↓
Effective Navigation
```

Registry peut contribuer à la disponibilité des modules/capacités, sans
devenir l'autorité unique de toute l'UX.

------------------------------------------------------------------------

## 22. IAM et visibilité

Une entrée peut dépendre de :

``` text
permission
role
feature
capability
availability
```

Sans permission :

``` text
entrée masquée
+
route protégée
+
API protégée
```

Masquer une entrée n'est jamais une mesure de sécurité suffisante.

------------------------------------------------------------------------

## 23. Tenant-aware Navigation

``` text
User
 ↓
Tenant Context
 ↓
Permissions
 ↓
Features / Subscription
 ↓
Available Modules
 ↓
Sidebar
```

Un changement de tenant doit recalculer la navigation effective et
invalider les données tenant-scoped.

------------------------------------------------------------------------

## 24. Abonnements et navigation

La Sidebar pourra ultérieurement refléter les modules autorisés par un
plan commercial, uniquement après définition du modèle
Subscription/Billing.

Aucune restriction commerciale ne doit être inventée avant ce CDC.

------------------------------------------------------------------------

## 25. États des modules

États possibles lorsque réellement supportés :

``` text
AVAILABLE
COMING_SOON
BETA
DEGRADED
UNAVAILABLE
```

`Bientôt` peut être utilisé pour un module planifié mais non disponible.
Il doit être non cliquable ou ouvrir une vraie page informative.

Les statuts techniques détaillés restent dans Diagnostics ; la Sidebar
ne doit pas devenir un écran de monitoring.

------------------------------------------------------------------------

## 26. Active State

Module actif :

``` text
fond bleu très clair
texte bleu Techzone
icône bleue
```

Enfant actif :

``` text
fond léger
accent visuel
font-medium
```

Une route profonde telle que `/pack-manager/packs/123` conserve Pack
Manager ouvert et Packs actif.

------------------------------------------------------------------------

## 27. Accordéons et persistance

Comportement :

``` text
click module → expand/collapse
click child  → navigate
```

La Sidebar peut mémoriser localement :

``` text
sidebar collapsed
expanded modules
```

Aucune donnée sensible ne doit être stockée.

------------------------------------------------------------------------

## 28. Mode réduit

Desktop normal : environ 270--290 px.\
Desktop collapsed : environ 72--80 px.

En mode collapsed, les icônes restent visibles et les tooltips
deviennent obligatoires.

------------------------------------------------------------------------

## 29. Responsive

### Desktop

Sidebar fixe avec possibilité de collapse.

### Tablet

Sidebar réductible.

### Mobile

Sidebar transformée en Drawer/Sheet et fermable avec Escape.

------------------------------------------------------------------------

## 30. Recherche Sidebar

Une recherche locale peut filtrer les modules/pages visibles :

``` text
Business Manager
UI Builder
Automatisation
Pack Manager
Runtime
Données
ERP
Registry
...
```

Elle ne remplace pas la recherche globale du Header.

------------------------------------------------------------------------

## 31. Footer utilisateur

Bas de Sidebar :

``` text
Avatar
Nom utilisateur
Rôle
```

Actions possibles : Profil, Préférences, Déconnexion.

------------------------------------------------------------------------

## 32. Sélecteur Tenant

S'il existe plusieurs entreprises, utiliser un seul sélecteur cohérent
dans le Header ou la partie supérieure de la Sidebar.

Pipeline :

``` text
Select Tenant
→ Validate Membership
→ Update Tenant Context
→ Invalidate tenant caches
→ Reload Effective Navigation
→ Reload current module
```

Aucune ancienne donnée tenant ne doit rester affichée.

------------------------------------------------------------------------

## 33. Icônes et couleurs

Utiliser une seule bibliothèque d'icônes déjà présente.

Les titres de sections restent neutres :

``` text
CONSTRUCTION
EXÉCUTION
DONNÉES & INTÉGRATIONS
PLATEFORME
```

Les icônes peuvent recevoir des accents mesurés. Éviter une couleur
différente pour chaque titre de section.

------------------------------------------------------------------------

## 34. Accessibilité

Support obligatoire :

``` text
keyboard navigation
focus visible
aria-expanded
aria-current
aria-label
Escape on mobile drawer
Enter/Space activation
```

Les contrastes doivent rester suffisants.

------------------------------------------------------------------------

## 35. Performance

Prévoir :

``` text
memoized navigation
permission map
feature map
stable route definitions
lazy module loading
```

Éviter de recalculer toute la navigation à chaque rendu.

------------------------------------------------------------------------

## 36. Routes et métadonnées

Chaque entrée possède au minimum :

``` text
stable key
route
label
icon
permission
section
order
children
```

Optionnel :

``` text
feature
capability
status
badge
```

Éviter plusieurs sources de vérité concurrentes entre routes, navigation
et breadcrumbs.

------------------------------------------------------------------------

## 37. Breadcrumb

La Sidebar et le Breadcrumb utilisent autant que possible les mêmes
métadonnées.

Exemple :

``` text
Pack Manager
→ Packs
→ TechBoutique
```

Le dernier niveau dynamique vient du workspace.

------------------------------------------------------------------------

## 38. Deep Links

Une URL directe comme :

``` text
/pack-manager/packs/123/validation
```

doit ouvrir le bon module, restaurer son état visuel, charger la
ressource et marquer la page appropriée active.

------------------------------------------------------------------------

## 39. Gestion 404 / 403 / indisponibilité

Route inexistante : `Not Found`.

Route existante mais non autorisée : `Accès refusé`.

Module valide mais indisponible : écran explicite `Module indisponible`.

Ne pas rediriger silencieusement toutes les erreurs vers le Dashboard.

------------------------------------------------------------------------

## 40. Loading et fallback sécurisé

Pendant le chargement IAM/Tenant, utiliser un skeleton ou un état
stable.

Ne pas afficher temporairement tous les menus avant de les masquer.

Si le calcul dynamique échoue, afficher une navigation minimale sûre :

``` text
Tableau de bord
Profil
Déconnexion
```

Ne jamais autoriser tous les modules par défaut.

------------------------------------------------------------------------

## 41. Audit et Observabilité

Les clics ordinaires ne nécessitent pas d'audit métier.

Événements potentiellement auditables :

``` text
tenant switch
administrative navigation configuration change
feature enable/disable
```

Pour les erreurs :

``` text
route
user
tenant
permission
module
errorCode
traceId
```

sans données sensibles inutiles.

------------------------------------------------------------------------

## 42. Modèle conceptuel

Concepts possibles :

``` text
NavigationSection
NavigationModule
NavigationItem
NavigationBadge
NavigationRequirement
```

Ils ne nécessitent pas obligatoirement des tables Prisma.

------------------------------------------------------------------------

## 43. API

Ne pas créer automatiquement `GET /api/sidebar` si la navigation peut
être correctement dérivée des routes, IAM, Tenant Context, Features et
Registry.

Un endpoint `effective-navigation` devient pertinent uniquement si le
backend doit réellement contrôler la composition dynamique.

------------------------------------------------------------------------

## 44. Règles de gestion

-   **RG-NAV-001** --- La Sidebar ne contient aucune logique métier.
-   **RG-NAV-002** --- Maximum trois niveaux globaux.
-   **RG-NAV-003** --- Les ressources dynamiques ne deviennent pas des
    menus statiques.
-   **RG-NAV-004** --- Les routes sont stables.
-   **RG-NAV-005** --- Les labels peuvent évoluer sans modifier les
    stable keys.
-   **RG-NAV-006** --- Toute entrée protégée respecte IAM.
-   **RG-NAV-007** --- Masquer un menu ne remplace pas l'autorisation
    backend.
-   **RG-NAV-008** --- La navigation respecte Tenant Context.
-   **RG-NAV-009** --- Le changement de tenant invalide les données
    tenant-scoped.
-   **RG-NAV-010** --- Pack Runtime n'apparaît pas sous Pack Manager.
-   **RG-NAV-011** --- Un seul Runtime global apparaît sous EXÉCUTION.
-   **RG-NAV-012** --- Data Platform et Data Runtime sont présentés sous
    Données.
-   **RG-NAV-013** --- Business Manager ne possède pas la publication
    globale.
-   **RG-NAV-014** --- Publication reste dans Pack Manager.
-   **RG-NAV-015** --- Registry est un module plateforme.
-   **RG-NAV-016** --- ERP et Integration Hub ne créent pas de menus
    dupliqués.
-   **RG-NAV-017** --- Les modules non fonctionnels sont marqués Bientôt
    ou masqués.
-   **RG-NAV-018** --- Aucun faux statut de module n'est affiché.
-   **RG-NAV-019** --- L'état actif correspond à la route réelle.
-   **RG-NAV-020** --- Les deep links restaurent le bon contexte visuel.
-   **RG-NAV-021** --- La Sidebar est utilisable au clavier.
-   **RG-NAV-022** --- La Sidebar est responsive.
-   **RG-NAV-023** --- Le mode collapsed fournit des tooltips.
-   **RG-NAV-024** --- Les icônes restent cohérentes.
-   **RG-NAV-025** --- Les sections utilisent un ordre stable.
-   **RG-NAV-026** --- Une route non autorisée reste protégée via URL
    directe.
-   **RG-NAV-027** --- Les informations tenant ne persistent pas après
    tenant switch.
-   **RG-NAV-028** --- La navigation ne dépend pas de mocks en mode
    REAL.
-   **RG-NAV-029** --- Les erreurs partielles utilisent un fallback
    sécurisé.
-   **RG-NAV-030** --- Sidebar, routes et breadcrumbs partagent leurs
    métadonnées autant que possible.

------------------------------------------------------------------------

## 45. Gap Matrix obligatoire

  Domaine              Existant    Frontend   Backend/IAM   Tests   Décision
  -------------------- ----------- ---------- ------------- ------- ----------
  Sidebar actuelle     À auditer   ---        ---           ---     AUDIT
  Sections             À auditer   ---        ---           ---     AUDIT
  Routes               À auditer   ---        ---           ---     AUDIT
  Business Manager     À auditer   ---        ---           ---     AUDIT
  UI Builder           À auditer   ---        ---           ---     AUDIT
  Automation           À auditer   ---        ---           ---     AUDIT
  Pack Manager         À auditer   ---        ---           ---     AUDIT
  Runtime              À auditer   ---        ---           ---     AUDIT
  Data                 À auditer   ---        ---           ---     AUDIT
  ERP / Integrations   À auditer   ---        ---           ---     AUDIT
  Registry             À auditer   ---        ---           ---     AUDIT
  IAM filtering        À auditer   ---        ---           ---     AUDIT
  Tenant filtering     À auditer   ---        ---           ---     AUDIT
  Responsive           À auditer   ---        ---           ---     AUDIT
  Collapsed mode       À auditer   ---        ---           ---     AUDIT
  Active route         À auditer   ---        ---           ---     AUDIT
  Breadcrumb           À auditer   ---        ---           ---     AUDIT
  Deep links           À auditer   ---        ---           ---     AUDIT

Décisions autorisées :

``` text
KEEP
IMPROVE
COMPLETE
ADAPT
IMPLEMENT
```

Ne jamais conclure `MISSING` avant recherche réelle.

------------------------------------------------------------------------

## 46. Instructions Codex / Freebuff

``` text
1. main est canonique.
2. Auditer la Sidebar et le layout actuels.
3. Auditer toutes les routes frontend.
4. Auditer les métadonnées de navigation existantes.
5. Auditer IAM et Tenant Context.
6. Auditer le système de permissions frontend/backend.
7. Rechercher les menus dupliqués.
8. Vérifier Pack Manager / Runtime.
9. Vérifier Data Platform / Data Runtime.
10. Vérifier ERP Adapter / Integration Hub.
11. Vérifier Registry Platform.
12. Vérifier breadcrumbs et deep links.
13. Vérifier responsive/mobile/collapsed mode.
14. Produire la Gap Matrix.
15. KEEP / IMPROVE / COMPLETE / ADAPT / IMPLEMENT.
16. Seulement ensuite coder.
17. Aucun commit/push/merge sans autorisation.
```

Pour tout code historique :

``` text
READ → UNDERSTAND → COMPARE → EXTRACT → ADAPT → TEST
```

------------------------------------------------------------------------

## 47. MVP

``` text
1. Audit navigation existante
2. Gap Matrix
3. Stable Navigation Definition
4. Sections globales
5. Business Manager
6. UI Builder
7. Automation
8. Pack Manager
9. Runtime unique
10. Données
11. ERP / Dolibarr
12. API & Intégrations
13. Registry
14. Plateforme
15. Active Route
16. Accordion
17. IAM Filtering
18. Tenant-aware Navigation
19. Collapsed Mode
20. Mobile Drawer
21. Breadcrumb Integration
22. Loading / Forbidden / Unavailable
23. Accessibility
24. Tests
```

------------------------------------------------------------------------

## 48. Tests

### Unitaires

``` text
navigation filtering
permission filtering
tenant filtering
active route
parent route
badge
module availability
stable ordering
```

### Sécurité

``` text
hidden route direct access
cross-tenant navigation
unauthorized module
unauthorized child route
tenant switch
```

### UI

``` text
expand
collapse
active state
collapsed mode
tooltip
mobile drawer
keyboard
scroll
long menu
```

### E2E

``` text
LOGIN
 ↓
SIDEBAR
 ↓
Business Manager
 ↓
UI Builder
 ↓
Automatisation
 ↓
Pack Manager
 ↓
Runtime
 ↓
Données
 ↓
ERP
 ↓
Registry
 ↓
Tenant Switch
 ↓
Effective Navigation Reload
```

------------------------------------------------------------------------

## 49. Définition de DONE

``` text
✓ Hiérarchie globale cohérente
✓ Navigation réelle
✓ Runtime non dupliqué
✓ Data Runtime non dupliqué dans la Sidebar
✓ Publication au bon endroit
✓ Registry intégré
✓ IAM appliqué
✓ Tenant Context appliqué
✓ Routes directes sécurisées
✓ Active states corrects
✓ Accordéons corrects
✓ Collapsed mode fonctionnel
✓ Mobile fonctionnel
✓ Clavier/accessibilité fonctionnels
✓ Breadcrumbs cohérents
✓ Deep links fonctionnels
✓ Modules indisponibles correctement traités
✓ Aucun faux écran fonctionnel
✓ Aucun faux statut
✓ Aucun mock silencieux
✓ Frontend build PASS
✓ Tests navigation PASS
✓ Tests IAM/Tenant PASS
✓ Recette navigateur PASS
✓ E2E PASS
```

------------------------------------------------------------------------

## 50. Architecture finale de référence

``` text
ACCUEIL
  Tableau de bord

CONSTRUCTION
  Business Manager
  UI Builder
  Automatisation
  Pack Manager

EXÉCUTION
  Runtime

DONNÉES & INTÉGRATIONS
  Données
  ERP / Dolibarr
  API & Intégrations

PLATEFORME
  Registry
  Environnements
  Déploiements
  Sécurité & IAM
  Observabilité
  Abonnements
  Administration
```

Cette structure constitue la baseline de navigation globale Techzone
Cloud v2.

------------------------------------------------------------------------

# FIN DU CAHIER DES CHARGES

**Techzone Cloud --- Sidebar & Navigation globale v2.0**\
**Navigation transversale de la plateforme**
