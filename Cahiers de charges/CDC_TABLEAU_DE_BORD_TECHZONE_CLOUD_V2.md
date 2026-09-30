# CAHIER DES CHARGES --- TECHZONE CLOUD TABLEAU DE BORD

**Version :** 2.0 --- Cockpit global plateforme\
**Date :** Septembre 2026\
**Projet :** Techzone Cloud\
**Position :** `ACCUEIL → Tableau de bord`\
**Statut :** Spécification fonctionnelle et technique consolidée

## 1. Objectif

Le Tableau de bord est le cockpit global de Techzone Cloud. Il agrège
les informations réelles de Business Manager, UI Builder, Automation,
Pack Manager, Pack Runtime, Data Platform/Data Runtime, ERP
Adapter/Integration Hub, Registry Platform, Environnements/Déploiements,
IAM, Observabilité et Abonnements.

**Principe : le Tableau de bord affiche et agrège ; il n'est
propriétaire d'aucune donnée métier.**

## 2. Structure

``` text
TABLEAU DE BORD
├── Header global
├── Hero / Bienvenue
├── Indicateurs clés
├── Modules principaux
├── Activité récente
├── Packs récents
├── Environnements
├── Alertes & problèmes
└── Actions rapides
```

## 3. Header global

Contient breadcrumb `Accueil > Tableau de bord`, recherche globale,
notifications et profil utilisateur.

Recherche cible : Applications, Packs, Workflows, Pages UI, Entités,
Connecteurs, Registry Entries et Déploiements. Tous les résultats
respectent IAM et le tenant courant.

## 4. Hero

Présente Techzone Cloud et sa proposition de valeur. Badges descriptifs
possibles : Modulaire, Multi-tenant, Intégré, Prêt pour l'ERP. Aucun
badge ne doit simuler un état technique.

## 5. KPI

KPI recommandés :

  Indicateur           Source
  -------------------- --------------------
  Applications         Business Manager
  Packs                Pack Manager
  Déploiements         Deployment Manager
  Sources de données   Data Platform
  Connecteurs          Integration Hub

Toutes les valeurs proviennent des APIs réelles. Les tendances
(`+2 ce mois`) ne sont affichées que si l'historique permet leur calcul.

## 6. Modules principaux

Maximum recommandé : 6 à 8 raccourcis.

-   **Business Manager** --- applications métier, données et
    fonctionnalités.
-   **UI Builder** --- interfaces et éditeur visuel.
-   **Automatisation** --- workflows et processus métier.
-   **Pack Manager** --- composition, validation et publication.
-   **Runtime** --- exécution des Packs publiés.
-   **Données** --- sources, contrats et accès.
-   **ERP / Dolibarr** --- intégration ERP et synchronisations.
-   **Registry** --- composants, capacités, providers et compatibilité.

Chaque carte ouvre le module propriétaire.

## 7. Activité récente

Agrège uniquement des événements réels : Pack publié, workflow exécuté,
composant enregistré, synchronisation ERP, déploiement, création
d'application ou validation.

Champs utiles : type, module, resource, action, actor, timestamp,
status, targetRoute.

Sources privilégiées : Audit, Publication History, Deployment History,
Workflow Execution, Registry Events et Integration Executions.

## 8. Packs récents

Afficher nom, version, nombre de modules si disponible, statut et
dernière modification/publication. Chaque ligne ouvre le Pack concerné.

## 9. Environnements

Lorsque Environment Manager est disponible : Environment, Active Pack
Version, Deployment Status, Last Deployment et Runtime Status. Ne jamais
inventer DEV/STAGING/PRODUCTION s'ils n'existent pas.

## 10. Alertes & problèmes

Remonter erreurs de validation, connecteurs indisponibles, déploiements
échoués, workflows en erreur, incompatibilités Pack/Runtime et Runtime
dégradé.

Sévérités : `CRITICAL`, `ERROR`, `WARNING`, `INFO`.

Sources : Business Validation, Pack Validation, Runtime Diagnostics,
Automation Executions, Data Diagnostics, Integration Diagnostics,
Registry Compatibility, Deployment Diagnostics et Observability.

Chaque alerte deep-linke vers le module propriétaire.

## 11. Actions rapides

Selon permissions : Nouvelle application, Nouveau workflow, Nouveau
Pack, Déployer. Le Dashboard redirige vers le module propriétaire au
lieu de recréer sa logique.

## 12. Personnalisation par rôle

-   Administrateur : Applications, Packs, Runtime, Registry,
    Connecteurs, Déploiements, Environnements, Observabilité, IAM.
-   Builder/développeur : Business Manager, UI Builder, Automation,
    Data, Pack Manager, Validation.
-   Opérateur : Runtime, Déploiements, Diagnostics, Intégrations,
    Observabilité.

Les APIs restent protégées par IAM ; le masquage visuel ne suffit pas.

## 13. Tenant Context

``` text
Current User
→ Current Tenant
→ Permissions
→ Dashboard Data
```

Aucune donnée d'un autre tenant ne doit être exposée.

## 14. API Dashboard

Endpoint agrégateur indicatif :

``` http
GET /api/platform/dashboard
```

Contrat conceptuel :

``` json
{
  "summary": {
    "applications": 8,
    "packs": 12,
    "deployments": 5,
    "dataSources": 6,
    "connectors": 4
  },
  "modules": [],
  "recentActivity": [],
  "recentPacks": [],
  "environments": [],
  "alerts": []
}
```

Si un endpoint stable existe, le conserver.

Architecture :
`Frontend → Platform Dashboard API → Aggregation Services → Modules propriétaires`.

## 15. Dégradation partielle

Une panne ERP ou Runtime ne doit pas casser toute la page. Chaque widget
gère indépendamment : `LOADING`, `LOADED`, `EMPTY`, `ERROR`,
`FORBIDDEN`, `UNAVAILABLE`.

## 16. Refresh et cache

Prévoir initial load, manual refresh et selective refresh. Temps réel
non obligatoire au MVP. Cache court possible, strictement tenant-aware
et permission-aware.

## 17. Performance

Priorités : requête agrégée principale, chargement progressif, activités
limitées, pagination, lazy loading des diagnostics.

## 18. Responsive

Desktop : sidebar/header, KPI et modules en grilles.\
Laptop : réduction des colonnes.\
Tablet : environ 2 KPI/modules par ligne.\
Mobile : sidebar Drawer, 1--2 KPI par ligne et sections empilées.

## 19. Design System

Canvas slate clair, surfaces blanches, Techzone Blue, bordures fines,
radius 10--12 px, ombres légères, hiérarchie typographique forte et
densité professionnelle. Micro-interactions 150--220 ms avec
`prefers-reduced-motion`.

## 20. Recherche globale et notifications

Recherche transversale permission-aware sur Applications, Packs,
Entities, Pages, Workflows, Data Contracts, Connectors, Registry Entries
et Deployments.

Notifications possibles : Deployment failed, Pack validation failed,
Connector unavailable, Workflow failed, Runtime degraded. Elles résument
et redirigent sans dupliquer Observability.

## 21. Règles de gestion

-   **RG-DASH-001** --- Toutes les données sont tenant-scoped.
-   **RG-DASH-002** --- Toutes les données respectent IAM.
-   **RG-DASH-003** --- Dashboard n'est propriétaire d'aucune donnée
    métier.
-   **RG-DASH-004** --- Les métriques proviennent des modules
    propriétaires.
-   **RG-DASH-005** --- Aucun KPI REAL ne provient d'un mock.
-   **RG-DASH-006** --- Un module inaccessible ne bloque pas tout le
    Dashboard.
-   **RG-DASH-007** --- Une carte inaccessible par permission n'est pas
    proposée.
-   **RG-DASH-008** --- Les alertes redirigent vers leur module
    propriétaire.
-   **RG-DASH-009** --- Dashboard ne réalise pas la validation globale
    des Packs.
-   **RG-DASH-010** --- Dashboard ne publie pas directement un Pack.
-   **RG-DASH-011** --- Dashboard ne contourne pas Deployment Manager.
-   **RG-DASH-012** --- Le statut Runtime provient du Runtime réel.
-   **RG-DASH-013** --- Le statut ERP provient d'Integration Hub.
-   **RG-DASH-014** --- Le statut Registry provient de Registry
    Platform.
-   **RG-DASH-015** --- Les activités proviennent d'événements/audits
    réels.
-   **RG-DASH-016** --- Les tendances ne sont affichées que si
    calculables.
-   **RG-DASH-017** --- Aucune donnée d'un autre tenant n'est exposée.
-   **RG-DASH-018** --- Une erreur partielle est isolée au widget
    concerné.
-   **RG-DASH-019** --- Les actions/routes rapides respectent les
    permissions.
-   **RG-DASH-020** --- Aucun mock silencieux en mode REAL.

## 22. MVP

``` text
1. Audit Dashboard existant
2. Gap Matrix
3. Header
4. Tenant Context
5. API agrégée
6. KPI Applications
7. KPI Packs
8. KPI Sources
9. KPI Connecteurs
10. Modules principaux
11. Activité récente
12. Packs récents
13. Alertes
14. Loading / Empty / Error / Forbidden
15. IAM
16. Responsive
17. Tests
```

Puis Environnements, Déploiements, Runtime, Registry, Observabilité,
recherche globale et notifications au fur et à mesure de leur
disponibilité réelle.

## 23. Gap Matrix obligatoire

  Fonction                 Existant    Backend   Frontend   Tests   Décision
  ------------------------ ----------- --------- ---------- ------- ----------
  Layout Dashboard         À auditer   ---       ---        ---     AUDIT
  KPI                      À auditer   ---       ---        ---     AUDIT
  Platform Dashboard API   À auditer   ---       ---        ---     AUDIT
  Store / State            À auditer   ---       ---        ---     AUDIT
  Applications             À auditer   ---       ---        ---     AUDIT
  Packs                    À auditer   ---       ---        ---     AUDIT
  Runtime                  À auditer   ---       ---        ---     AUDIT
  Data                     À auditer   ---       ---        ---     AUDIT
  ERP                      À auditer   ---       ---        ---     AUDIT
  Registry                 À auditer   ---       ---        ---     AUDIT
  Activité récente         À auditer   ---       ---        ---     AUDIT
  Alertes                  À auditer   ---       ---        ---     AUDIT
  IAM                      À auditer   ---       ---        ---     AUDIT
  Tenant Isolation         À auditer   ---       ---        ---     AUDIT
  Responsive               À auditer   ---       ---        ---     AUDIT

Ne jamais conclure `MISSING` avant recherche réelle.

## 24. Instructions Codex / Freebuff

``` text
1. main est canonique.
2. Auditer le Dashboard frontend existant.
3. Auditer platformDashboardService et le store/slice existants.
4. Auditer GeneralOverviewView et les routes réelles.
5. Rechercher l’API Dashboard backend existante.
6. Identifier les sources réelles des KPI, activités et alertes.
7. Examiner IAM et Tenant Context.
8. Examiner Business Manager, Pack Manager, Runtime, Data,
   Integration Hub, Registry et Deployment.
9. Produire la Gap Matrix.
10. KEEP / IMPROVE / COMPLETE / ADAPT / IMPLEMENT.
11. Seulement ensuite coder.
12. Aucun commit/push/merge sans autorisation.
```

## 25. Tests

Unitaires : agrégation KPI, mapping statuts, permissions, filtrage
alertes, cache tenant-aware, transformation activité.

Intégration : Business Manager, Pack Manager, Data, Integration Hub,
Registry, Runtime/Deployment vers Dashboard.

Sécurité : cross-tenant metrics/activity/alerts, widgets/actions non
autorisés et fuite via recherche.

Résilience : ERP/Runtime/Registry indisponibles, erreur partielle,
timeout module et compte vide.

## 26. Recette E2E

``` text
LOGIN
→ TENANT CONTEXT
→ TABLEAU DE BORD
→ Real Applications count
→ Real Packs count
→ Real Data Sources
→ Real Connectors
→ Recent Activity
→ Alerts
→ Click Pack
→ PACK MANAGER
→ Back Dashboard
→ Click ERP alert
→ ERP Diagnostics
```

Tester Admin, Builder, Operator, Unauthorized, Tenant A/B, services
indisponibles et compte vide.

## 27. Définition de DONE

``` text
✓ Layout et Header fonctionnels
✓ Tenant Context appliqué
✓ KPI réels
✓ Modules principaux réels
✓ Activité récente réelle
✓ Packs récents réels
✓ Alertes réelles
✓ Deep links fonctionnels
✓ Actions rapides permission-aware
✓ Dégradation partielle fonctionnelle
✓ États Loading / Empty / Error / Forbidden
✓ Responsive validé
✓ IAM et Tenant Isolation vérifiés
✓ Aucun faux KPI ou faux statut
✓ Aucun mock silencieux en REAL mode
✓ Backend build PASS
✓ Frontend build PASS
✓ Tests Dashboard / Tenant / Security PASS
✓ Recette navigateur PASS
✓ E2E PASS
```

## 28. Principe final

``` text
MODULES PROPRIÉTAIRES
        ↓
DONNÉES / STATUTS / ÉVÉNEMENTS RÉELS
        ↓
PLATFORM DASHBOARD API
        ↓
TABLEAU DE BORD
        ↓
VISION GLOBALE + NAVIGATION + ALERTES
```

Le Dashboard est la porte d'entrée de Techzone Cloud, sans remplacer
Business Manager, Pack Manager, Runtime ou Observability.

------------------------------------------------------------------------

# FIN DU CAHIER DES CHARGES

**Techzone Cloud --- Tableau de bord v2.0**\
**Cockpit global plateforme**
