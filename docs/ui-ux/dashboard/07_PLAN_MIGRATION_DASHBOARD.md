# Plan de migration — Dashboard Techzone Cloud V3

**Lot :** DASH-00 — audit, analyse des écarts et planification.
**Statut :** terminé, sans modification applicative.
**Route concernée :** `/dashboard` (alias conservés : `/` et `/cockpit`).

## Références et périmètre

Références lues :

- `docs/ui-ux/dashboard/01_AUDIT_DASHBOARD_EXISTANT.md`
- `docs/ui-ux/dashboard/03_SPEC_UI_DASHBOARD_V3.md`
- `docs/ui-ux/dashboard/06_MAQUETTES_DASHBOARD_V3.md`
- `AGENTS.md` et `docs/DESIGN_SYSTEM.md`
- `docs/dashboard-navigation/GAP_MATRIX.md` et les captures existantes `dashboard-desktop.png`, `dashboard-mobile.png`, `sidebar-mobile.png`

`CDC_TABLEAU_DE_BORD_TECHZONE_CLOUD_V2` n'a pas été trouvé. Les spécifications V3 le citent comme référence historique ; ses exigences ne sont donc pas présumées au-delà de celles reprises explicitement dans les documents V3.

Ce plan concerne le cockpit plateforme. Il exclut `ERPDashboard` à `/erp`, qui est un écran distinct de catalogue/capacités Dolibarr. Il ne crée aucune route, ne modifie aucun contrat et ne transforme pas une donnée mockée en donnée de production.

## Décisions d'architecture issues de DASH-00

1. La page canonique reste `/dashboard`, rendue par `CockpitView` dans `TechzoneLayout`.
2. `DashboardProvider` et `GET /api/platform/dashboard` restent la source de l'accueil tant qu'aucun contrat propriétaire plus précis n'est validé.
3. Les protections existantes restent non négociables : session IAM persistée, RBAC tenant, `BmTenantGuard`, filtrage par widget, contrôle de `tenantId` côté client, annulation des requêtes et purge des stores lors d'une bascule de tenant.
4. Les données connues sont utilisées telles quelles ; les données sans contrat (tendances, santé globale, quotas, applications actives, catalogues de sources/connecteurs) restent absentes ou explicitement `UNAVAILABLE`.
5. La maquette V3 guide la hiérarchie et les états UI, pas les chiffres, statuts, séries temporelles ni routes.

## Cartographie des dépendances

```text
AuthProvider + TenantProvider
          │  session, principal RBAC, tenant actif, purge à la bascule
          ▼
TechzoneLayout ── Sidebar / Header / GlobalSearch / DashboardProvider
          │                                      │
          │                                      ├─ GET /api/platform/search
          ▼                                      └─ GET /api/platform/dashboard[?widget]
CockpitView ── DashboardWidgets                        │
          │                                            ▼
          └─ routes propriétaires             DashboardService (lecture Prisma)
                                                application / pack / deployment /
                                                environment / audit / diagnostics
```

Les widgets ne possèdent pas d'état métier : ils présentent des projections limitées issues des modules propriétaires. Tout ajout de donnée doit conserver cette frontière.

## Navigation cible : correspondance sans nouvelles routes

| Groupe V3 | Modules demandés | Couverture actuelle et décision |
|---|---|---|
| Accueil | Tableau de bord | `/dashboard` : conserver. |
| Création d'applications | Business Manager, UI Builder, Automatisation | Groupes existants `bm`, `ui`, `automation` : réorganiser les intitulés/sections sans modifier les deep links. |
| Publication & exécution | Pack Manager, Environnements & Déploiements, Pack Runtime | `packs`, `environments`, `deployments`, `runtime` existent. La cible fusionne visuellement environnements/déploiements ; le menu ne doit pas perdre leurs routes distinctes. |
| Données & intégrations | Data Platform, ERP / Integration Hub, API Manager | `data`, `erp`, `api` existent ; conserver les permissions et routes actuelles. |
| Supervision | Observabilité | `observability` existe ; la carte dashboard reste un aperçu et non un second cockpit. |
| Commercial | Abonnements & Facturation | `billing` existe ; afficher uniquement aux droits existants et ne pas inventer de quotas. |
| Administration & infrastructure | Administration Platform, Auth / IAM, Registry, Prisma / Tenant Foundation | `admin`, `iam`, `registry` existent. Aucune route/navigation « Prisma / Tenant Foundation » confirmée : différer et ne pas exposer un module technique aux utilisateurs ordinaires. |

## Matrice de migration

| Fonctionnalité | Composant existant | Source réelle | Maquette cible | Décision | Risque | Test |
|---|---|---|---|---|---|---|
| Route et shell accueil | `App.jsx`, `TechzoneLayout`, `CockpitView` | Routage React réel | M01 | CONSERVER | Perte des aliases ou du layout partagé | Deep links `/`, `/cockpit`, `/dashboard` |
| Sidebar par espaces | `Sidebar`, `navigationMenu`, `navigationConfig` | Mapping et permissions réels | M02 | AMÉLIORER | Casser routes, filtrage IAM ou drawer | Menu/route parity, rôles, desktop/mobile |
| Groupes 15 modules | `navigationMenu.js` | Routes actuelles uniquement | M02 | FUSIONNER | Fusion visuelle qui masque Environnements ou Déploiements ; exposition d'un module technique | Tous les liens existants, 403 direct, navigation active |
| Topbar et breadcrumb | `Header` | Route active, tenant, session | M03 | AMÉLIORER | Régression de la navigation mobile ou du fil d'Ariane | Header desktop/mobile, clavier |
| Sélecteur tenant | `TenantProvider`, `Header`, `TenantBoundary` | IAM `/auth/tenants`, `/auth/tenant/switch` | M03 | RÉUTILISER | Données résiduelles inter-tenant | A → B → A, erreur/refus, réponse obsolète |
| Recherche globale | `GlobalSearch` | `/api/platform/search` : applications, packs autorisés, environnements | M13 | CONSERVER | Fuite d'un résultat interdit ou tenant obsolète | Recherche IAM/tenant, vide, erreur, clavier |
| Notifications | `Header`, `DashboardProvider`, alertes widgets | Alertes Business, Pack, Runtime, Deployment | M14 | FUSIONNER | Doubler les alertes ou perdre la topbar au refactor | Même liste/droits dans cockpit et topbar |
| Profil et compte | `Header`, `AuthProvider` | Principal IAM, déconnexion réelle | M03 | AMÉLIORER | Ajouter un faux lien profil ou contourner logout | Menu compte, logout, lien seulement si route confirmée |
| Rafraîchissement / fraîcheur | `CockpitView`, `DashboardProvider` | Refresh réel, `generatedAt` | M03/M04 | CONSERVER | Rafraîchissement trop large ou stale data | Refresh global/ciblé, abort |
| En-tête d'accueil | `CockpitView` hero | Tenant actif réel | M04 | AMÉLIORER | Dupliquer les KPI ou afficher un état plateforme fictif | Tenant unique/multiple, petit écran |
| KPI Applications | widget `applications` | `application.count` tenant-scoped | M05 | CONSERVER | Confondre 0 et indisponible | 0, loading, erreur, tenant |
| KPI Packs | widget `packs` | `pack.count` tenant-scoped, `pack.read` | M05 | AMÉLIORER | Compter tous les packs au lieu des publiés demandés | Permission et sémantique de statut avant changement |
| KPI Déploiements | widget `deployments` | `deployment.count` tenant-scoped | M05 | AMÉLIORER | Afficher sans période explicitée | Valeur, période, lien propriétaire |
| KPI Sources / Connecteurs | `dataSources`, `connectors` | Aucun catalogue tenant : `UNAVAILABLE` explicite | M05 | CONSERVER | Présenter 0 ou un chiffre fictif | `UNAVAILABLE`, `FORBIDDEN`, droits |
| KPI actifs, alertes critiques, quotas | Aucun widget conforme | Aucun contrat confirmé | M05 | DIFFÉRER | Inventer métrique, période ou quota | Tests de contrat avant toute carte |
| Graphique / sélecteur de période | Aucun dans cockpit | Aucune série temporelle contractuelle | M06 | DIFFÉRER | Graphe trompeur, unités incompatibles | Contrat série + a11y + alternative tabulaire |
| Santé des services | Environnements + alertes, pas d'agrégat | Statuts partiels seulement | M07 | DIFFÉRER | Déclarer « sain » un service inconnu | Contrat santé, états UNKNOWN/UNAVAILABLE |
| Accès rapides | `ModuleCard`, actions rapides, sidebar | Routes et `canAccess` réels | M08 | FUSIONNER | Triple navigation, CTA vers page partielle | 6–8 liens autorisés, clics et états |
| Alertes / incidents | `alertKeys`, `DashboardSection` | BMQ, PackVersion, RuntimeDiagnostic, Deployment | M09 | AMÉLIORER | Masquage incohérent des interdits / tri non prioritaire | Sévérité, droits, deep links, erreur partielle |
| Activité récente | widget `activity` | `auditEvent` filtré/limité tenant | M10 | AMÉLIORER | Lien trop général, acteur/ressource non exposés | Payload autorisé, max. 5–8, deep links |
| Packs récents | widget `recentPacks` | Pack/PackVersion tenant, `pack.read` | M11 | CONSERVER | Perdre version/statut ou exposer un pack interdit | Empty, permission, lien pack |
| Environnements | widget `environments` | Environment + dernier deployment tenant | M11 | CONSERVER | Simuler DEV/STAGING/PROD ou santé runtime | Empty, statut connu, lien |
| Guide de démarrage | Aucun | Applications/permissions connues, autres jalons non confirmés | M12 | AJOUTER | Progression fictive ou CTA interdit | Tenant vide, droits limités, guide statique |
| États widgets | `WidgetBody` | États API réels | M15/M16 | RÉUTILISER | Erreur globale masquant un succès ; `FORBIDDEN` incohérent | LOADING, 0, EMPTY, ERROR, FORBIDDEN, UNAVAILABLE |
| Responsive et a11y | `Sidebar`, `Header`, grilles Tailwind | Comportements UI réels | M17/M18 | AMÉLIORER | Focus/drawer/overflow cassés | 390/768/1024/1440, clavier, zoom 200 % |

## Lots proposés et critères de passage

### DASH-00 — audit et plan

Produit : audit actualisé, présente matrice, dépendances, risques et stratégie de test.
Fin de lot : aucune modification de code ; références lues ; données sans contrat différées.

### DASH-01 — navigation, topbar et structure

Modifier seulement l'organisation visuelle de `Sidebar`, `Header` et les styles/tokens nécessaires. Les 15 modules sont représentés par regroupement, mais les routes existantes et permissions restent la seule source de vérité. Le tenant unique doit être lisible en lecture seule ; aucun écran profil n'est ajouté sans route confirmée.

**Passage :** navigation/deep links/IAM, switch tenant, drawer mobile et tests sidebar/header validés.

### DASH-02 — en-tête, KPI et raccourcis

Réemployer `CockpitView`, `DashboardProvider`, `WidgetBody` et les widgets actuels. Limiter les raccourcis initiaux à 6–8 et fusionner cartes modules/actions rapides au lieu de dupliquer trois navigations. Les KPI additionnels restent absents ou `UNAVAILABLE` selon leur source.

**Passage :** valeurs réelles, zéro distinct, liens propriétaires, chaque état widget et aucune requête supplémentaire inutile.

### DASH-03 — activité, alertes, packs et environnements

Recomposer les sections avec les mêmes projections réelles. Améliorer la lisibilité de la sévérité, du module source et des routes profondes sans changer la politique IAM ni les payloads sensibles.

**Passage :** panne d'un widget isolée, aucun événement/alerte d'un autre tenant, listes bornées et navigateurs de destination corrects.

### DASH-04 — santé, tendances et guide

Le guide statique permission-aware peut être ajouté si les routes d'étapes sont confirmées. Une progression, la santé et les graphiques ne peuvent être implémentés qu'après validation de sources, unités, périodes, permissions et tests de contrat. Les modules non disponibles restent explicitement différés.

**Passage :** aucune métrique, tendance, disponibilité ou progression fictive ; validation produit des nouveaux contrats éventuels.

### DASH-05 — responsive, accessibilité et non-régression

Finaliser les scénarios 390/768/1024/1440+, focus, lecteur d'écran, clavier, contrastes, `prefers-reduced-motion`, erreurs partielles, parcours multi-tenant et accès directs interdits.

**Passage :** suites frontend/backend ciblées, build, recette responsive et IAM tenant validés.

## Risques, garde-fous et dépendances bloquantes

| Sujet | Garde-fou / décision |
|---|---|
| Vue visuelle non disponible dans le dépôt | Les documents V3 servent de référence. Les captures trouvées sont celles de l'existant ; aucune interprétation d'une image absente n'est implémentée. |
| Tendance, santé, quotas, applications actives | Bloqués jusqu'à l'existence d'un contrat propriétaire tenant-scoped et permissionné. |
| « Packs publiés » | La projection actuelle compte les packs non archivés, pas exclusivement les versions publiées : une décision fonctionnelle/API est requise avant changement de libellé ou calcul. |
| « Prisma / Tenant Foundation » | Aucun module/route utilisateur confirmé : ne pas le créer ni l'afficher comme navigation métier. |
| Topbar profil | Le menu actuel permet la déconnexion ; aucun accès personnel confirmé n'est ajouté sans route existante. |
| Modifications préexistantes | Les fichiers non liés restent hors staging/commit ; chaque lot ne versionne que ses fichiers. |
| Erreurs de sources | Préserver les états indépendants et le retry local ; ne pas convertir une erreur ou indisponibilité en zéro. |

## Plan de tests de régression

- Unitaires backend : isolation tenant, permissions widget, listes bornées, timeout, absence de données sensibles et contrats de tout nouveau widget.
- Unitaires frontend : rendu complet `CockpitView`, `DashboardProvider`, `WidgetBody`, `Header` et sidebar pour tous les états.
- Intégration : tenant A → B → A, abort/réponse tardive, recherche et notifications tenant-scoped, erreurs partielles et refresh ciblé.
- Navigation : profil permissionné/non permissionné, liens KPI/alertes/activité, deep links historiques, menu actif et modules masqués.
- Responsive/a11y : 390, 768, 1024, 1440 px ; navigation clavier, Échap, focus trap/restauration, contraste, zoom 200 % et lecteurs d'écran.
- Validation finale de chaque lot : `npm test` frontend ciblé, `npm test` backend ciblé, puis builds frontend/backend avant le lot de finition.

## Prochain lot autorisé

DASH-01 peut commencer : la route, les dépendances, les références et les risques de navigation sont connus. Les limites bloquantes de données concernent DASH-04, pas la modernisation structurelle. Toute proposition qui ajouterait une route, un contrat backend, une métrique ou une permission doit être validée avant implémentation.
