# Audit du tableau de bord existant — Techzone Cloud V3

**Périmètre audité :** tableau de bord plateforme actuellement accessible par `/dashboard`, à la date de l'audit. Ce document décrit l'existant ; il ne propose ni ne déclenche de modification applicative.

> À ne pas confondre avec `/erp` : cette seconde route affiche `ERPDashboard`, un catalogue de ressources Dolibarr et leurs statuts de capacité. Ce n'est pas le cockpit global de la plateforme et il n'est pas inclus dans la modernisation du dashboard plateforme, sauf décision produit explicite.

## Synthèse

Le cockpit `/dashboard` est déjà une surface fonctionnelle, authentifiée et tenant-scoped. Il repose sur une projection serveur dédiée (`GET /api/platform/dashboard`) qui lit de vraies données Prisma, avec états par widget et filtrage IAM côté serveur. La navigation, la topbar, le sélecteur de tenant et la recherche globale sont aussi déjà partagés par le layout applicatif.

Le principal écart avec la cible n'est donc pas structurel mais informationnel et éditorial : il n'existe pas encore de tendances calculées, de synthèse de santé de services, ni de guide de démarrage contextuel. Les deux indicateurs « Sources de données » et « Connecteurs » sont explicitement indisponibles, et non des KPI réels. Le cockpit ne contient aucun graphique, malgré `recharts` dans les dépendances ; les graphiques présents sous `features/iam-demo` utilisent des données de démonstration et ne doivent pas être réemployés comme source produit.

## Architecture actuelle

| Couche | Éléments | Rôle observé |
|---|---|---|
| Routage | `frontend/src/app/routes.js`, `navigationConfig.js`, `App.jsx` | `/` et l'alias historique `/cockpit` redirigent vers `/dashboard`. La route rend `CockpitRoute`, puis `CockpitView`, dans `TechzoneLayout`. |
| Layout commun | `layouts/TechzoneLayout.jsx` | Monte `ModalProvider`, `DashboardProvider`, `Sidebar`, `Header`, `SubNavBar`, `ApiErrorBanner`, un `<Outlet>` et le footer. Le provider est donc actif sur toutes les pages protégées, pas uniquement sur `/dashboard`. |
| Vue cockpit | `components/CockpitView.jsx` | Assemble en-tête, hero, KPI, modules, activité, packs, environnements, alertes, actions rapides et horodatage. |
| Primitives dashboard | `components/dashboard/DashboardContext.jsx`, `DashboardWidgets.jsx` | Chargement/annulation, isolation par tenant/utilisateur/permissions, rendu des états widget, cartes de section, cartes module et formatage de date. |
| API | `backend/src/modules/platform/dashboard.controller.ts`, `dashboard.service.ts` | `GET /api/platform/dashboard[?widget=…]` et `GET /api/platform/search?q=…`; projections Prisma en lecture seule. |
| Contexte | `contexts/TenantProvider.jsx`, `auth/AuthProvider.jsx` | Charge les tenants IAM, bascule la session côté serveur, purge les stores tenant-scoped avant publication du nouveau tenant, puis recharge le principal. |
| Contrôle d'accès | `auth/ProtectedRoute.jsx`, `auth/RequireNavigationAccess.jsx`, `iam-jwt.guard.ts`, `bm-tenant.guard.ts` | Authentification, contrôle des routes frontend, principal RBAC issu de la session persistée, puis tenant obligatoire pour l'API plateforme. |

### Flux de données

```text
Session IAM persistée → IamJwtGuard → principal (tenant + permissions RBAC)
                                      ↓
TenantProvider → DashboardProvider → GET /api/platform/dashboard
                                      ↓
DashboardService → projections Prisma filtrées par tenantId
                                      ↓
CockpitView + Header (notifications) + GlobalSearch
```

Le client vérifie également que `data.tenantId` est celui du tenant actif avant d'afficher la réponse. Un changement de tenant annule les requêtes dashboard en cours et invalide visuellement les widgets via la clé de scope.

## Inventaire des écrans et composants

| Élément | Route / composant | Donnée / intégration | État |
|---|---|---|---|
| Cockpit plateforme | `/dashboard` → `CockpitRoute` → `CockpitView` | `/api/platform/dashboard` | EXISTANT, partiel par rapport à la cible |
| Ancienne URL cockpit | `/cockpit` | Redirection vers `/dashboard` | EXISTANT |
| Accueil racine | `/` | Redirection vers `/dashboard` | EXISTANT |
| Dashboard ERP distinct | `/erp` → `ERPDashboard` | `useErpCatalog`, services ERP | Hors périmètre du cockpit plateforme |
| Layout | `TechzoneLayout` | `DashboardProvider`, layout partagé | EXISTANT |
| Navigation latérale | `Sidebar` | `navigationMenu.js`, permissions du principal, contexte tenant | EXISTANT |
| Barre haute | `Header` | tenant, `GlobalSearch`, widgets d'alerte, profil | EXISTANT, partiel pour le profil/notifications |
| Recherche globale | `GlobalSearch` | `/api/platform/search` après 250 ms, min. 2 caractères | EXISTANT |
| Sélecteur tenant | `TenantProvider`, `Header`, `TenantBoundary` | `/api/iam/auth/tenants`, `/api/iam/auth/tenant/switch` | EXISTANT |

## Fonctionnalités observées

| Fonctionnalité | Route / composant | API ou service | Source | Statut | Problèmes UI/UX et risques | Recommandation |
|---|---|---|---|---|---|---|
| Accès au cockpit | `/dashboard`, `CockpitView` | — | Réel (routage) | Fonctionnel | Métadonnée navigation marquée `PARTIAL`, ce qui est cohérent avec les manques de contenu ; ne pas confondre avec une route inactive. | Conserver |
| KPI Applications | `metrics.applications` | widget `applications` | `application.count({ tenantId })` | Fonctionnel | Valeur sans tendance ni période de comparaison. | Conserver, enrichir seulement si une série fiable existe |
| KPI Packs | `metrics.packs` | widget `packs` | `pack.count`, permission `pack.read` | Fonctionnel | Carte visible avec « accès non autorisé » si permission absente ; manque de tendance. | Conserver, harmoniser la règle de masquage/explication |
| KPI Déploiements | `metrics.deployments` | widget `deployments` | `deployment.count({ tenantId })` | Fonctionnel | Compte global sans succès/échec, période ni santé. | Conserver, améliorer |
| KPI Sources de données | `metrics.dataSources` | widget `dataSources` | Aucun catalogue ; renvoie `UNAVAILABLE` si `data-runtime:read` | Partiel | Carte présente mais source explicitement absente (`DATA_SOURCE_CATALOG_NOT_AVAILABLE`). | Conserver le contrat d'indisponibilité, ne pas afficher un chiffre fictif |
| KPI Connecteurs | `metrics.connectors` | widget `connectors` | Aucun catalogue ; renvoie `UNAVAILABLE` si `erp:read` | Partiel | Même limite (`TENANT_CONNECTOR_CATALOG_NOT_AVAILABLE`). | Conserver le contrat d'indisponibilité, remplacer par métrique réelle seulement après API dédiée |
| Modules autorisés | `ModuleCard`, `navigationGroups` | Configuration navigation + `canAccess` | Configuration réelle et permissions du principal | Fonctionnel | Une carte peut mener à une page « bientôt » si l'entrée autorisée n'est pas implémentée ; le libellé le signale. | Conserver, rendre l'état de disponibilité plus explicite dans la future maquette |
| Actions rapides | bas de `CockpitView` | Liens de routes | Configuration et IAM côté client | Partiel | Doublonne les modules/sidebar ; « Nouvelle application » n'est pas contextualisée ; certaines destinations restent dépendantes de pages partielles. | Fusionner avec les accès rapides de la cible et exposer seulement actions réellement réalisables |
| Activité récente | `activity` | widget `activity` | `auditEvent`, 6 événements, préfixes filtrés et tenant-scoped | Fonctionnel | Mapping visuel incomplet des actions, pas de filtre, pas de tendance ni de destination très fine pour certains événements. | Conserver, améliorer |
| Packs récents | `recentPacks` | widget `recentPacks` | `pack`, dernière version et nombre de modules, max. 5, `pack.read` | Fonctionnel | Section absente sans `pack.read` ; c'est cohérent avec l'IAM mais aucun état explicatif n'est rendu. | Conserver |
| Environnements | `environments` | widget `environments` | `environment` + dernier `deployment`, max. 6 | Fonctionnel | Affiche un statut stocké, pas une agrégation de santé ni la fraîcheur de la télémétrie. | Conserver, transformer ensuite en santé lorsque la sémantique serveur existe |
| Alertes Business Manager | `businessAlerts` | widget correspondant | `bmqQualityReport` avec `gateResult=FAIL`, max. 5 | Fonctionnel | N'exprime pas la criticité métier au-delà de `ERROR`; source masquée si refusée selon le rendu alertes. | Conserver |
| Alertes Pack | `packAlerts` | widget correspondant | `packVersion.validationStatus=INVALID`, permission `pack.read` | Fonctionnel | Même limite de synthèse et de cycle de vie d'alerte. | Conserver |
| Alertes Runtime | `runtimeAlerts` | widget correspondant | `runtimeDiagnostic` WARNING/ERROR/CRITICAL, permission `runtime.diagnostic.read` | Fonctionnel | Présentation uniforme, sans accusé de réception ni regroupement. | Conserver |
| Alertes déploiement | `deploymentAlerts` | widget correspondant | `deployment.status=FAILED` | Fonctionnel | Ne couvre que les échecs et ne donne ni durée ni tendance. | Conserver, améliorer |
| Notifications topbar | `Header` + `alertKeys` | Même état `DashboardProvider` | Alertes dashboard réelles, 8 plus récentes | Partiel | C'est un second affichage des mêmes alertes ; aucune persistance lu/non-lu, aucun centre de notifications. | Fusionner visuellement avec une politique de notification documentée |
| Recherche globale | `GlobalSearch` | `/api/platform/search` | Applications, packs autorisés et environnements ; Prisma réel | Fonctionnel | Domaine de recherche restreint, sans raccourci clavier affiché de manière exacte sur Windows, ni résultats d'activité/alertes. | Conserver, étendre seulement avec des sources autorisées |
| Tenant actif | `Header`, `TenantProvider`, `TenantBoundary` | Services IAM | Données IAM réelles | Fonctionnel | Le sélecteur compact de topbar n'apparaît que si plusieurs tenants ; la vue d'un tenant unique est moins explicite. | Conserver, améliorer la lisibilité du contexte |
| Guide de démarrage | — | — | — | Absent | Le hero marketing et les actions rapides ne déduisent aucune étape de maturité. | Ajouter après définition de critères et données fiables |
| Tendances / graphiques | — | — | — | Absent | Aucun graphique dans le cockpit. `recharts` est installé mais non utilisé ici ; les charts de `features/iam-demo` sont des démos/mock. | Ajouter uniquement avec une API de séries temporelles contractuelle |

## Sidebar et topbar

### Sidebar

`Sidebar.jsx` implémente déjà la structure souhaitée par grands espaces : **Accueil**, **Construction**, **Exécution**, **Données & intégrations**, **Plateforme**. Elle est construite depuis `navigationMenu.js`, filtre les entrées avant la recherche selon `canAccess`, puis protège aussi l'accès direct avec `RequireNavigationAccess`.

Elle comprend la recherche de menu, les groupes repliables, la persistance locale de l'état replié/étendu, un mode compact desktop (260 px / 80 px), des infobulles, et un drawer mobile avec overlay, Échap, piège de focus et inert du contenu arrière-plan.

### Topbar

`Header.jsx` contient le fil d'Ariane, la recherche globale (desktop à partir de `md`, panneau mobile en dessous), le sélecteur de tenant lorsqu'il y en a plusieurs, le panneau d'alertes et le menu profil/déconnexion. Il n'existe pas d'accès profil dédié dans ce menu, ni de gestion persistante de notifications.

## Contexte tenant et IAM

L'application n'accorde pas l'accès métier seulement parce qu'un libellé de rôle est affiché : les permissions effectives sont recalculées par `IamJwtGuard` à partir de la session persistée et du RBAC tenant. `BmTenantGuard` refuse l'API dashboard sans tenant actif, y compris un super-administrateur.

Les widgets appliquent les permissions suivantes côté serveur :

| Widget | Permission nécessaire |
|---|---|
| Applications, déploiements, environnements, activité, alertes BM/déploiement | Authentification + tenant actif |
| Packs, packs récents, alertes pack | `pack.read` |
| Alertes Runtime | `runtime.diagnostic.read` |
| Sources de données | `data-runtime:read`, puis `UNAVAILABLE` (catalogue absent) |
| Connecteurs | `erp:read`, puis `UNAVAILABLE` (catalogue absent) |

Les permissions ne sont donc pas de simples conditions de rendu. Le service ne lance pas les requêtes Prisma des widgets interdits, et les projections utilisent `tenantId` dans chaque requête. La route `/dashboard` elle-même ne déclare pas de permission fonctionnelle spécifique : elle est ouverte à tout utilisateur authentifié avec un tenant, puis chaque donnée est filtrée.

## États et résilience

| État | Implémentation actuelle | Observation |
|---|---|---|
| Loading | Skeleton pulsé par `WidgetBody`; chargement de contexte dans `TenantBoundary` | Fonctionnel ; le chargement global masque les widgets jusqu'à réponse complète. |
| Empty | État `EMPTY` pour les listes ; les compteurs à zéro restent `LOADED` | Distinction correctement testée. |
| Error | `ERROR` par widget avec retry ; bannière globale si l'appel complet échoue | Bon découplage serveur, mais l'erreur complète masque tous les KPI/sections dépendants. |
| Forbidden | `FORBIDDEN` rendu « Accès non autorisé » par widget ; sources d'alertes interdites retirées | Incohérence de stratégie (rendu vs masquage) à décider pour la cible. |
| Unavailable | `UNAVAILABLE` et code de cause (`DATABASE_UNAVAILABLE`, `SOURCE_UNAVAILABLE`, ou catalogue manquant) | Le client ne rend pas le code précis ; le cas base indisponible n'est donc pas distingué visuellement. |
| Tenant absent / échec | `TenantBoundary` affiche sélection, absence d'autorisation ou retry ; sidebar en fallback dashboard seul | Fonctionnel et fail-closed. |

Chaque lecture de source est bornée par un délai de 4,5 secondes côté serveur. Les données sensibles d'audit (métadonnées et snapshots) ne sont pas sélectionnées pour l'activité.

## Responsive et accessibilité

La grille de KPI passe de deux colonnes à cinq (`xl`), les modules et sections se redistribuent aux seuils `sm`/`xl`, et les listes ont des retours à la ligne. La sidebar devient un tiroir mobile ; la topbar remplace la recherche inline par un panneau mobile. Les contrôles majeurs disposent de labels, de focus visible, de statuts ARIA, d'un lien d'évitement et du respect de `motion-reduce` sur les animations concernées.

À vérifier lors de la modernisation : le contenu dense des alertes, les titres/valeurs de KPI longs, les panneaux topbar sur très petit écran et la cohérence des zones tactiles. Aucune capture automatisée actuelle n'est rattachée directement au cockpit dans les tests identifiés.

## Écarts avec la cible

| Cible | Couverture existante | Écart à traiter sans présumer d'API |
|---|---|---|
| Sidebar par grands espaces | EXISTANT | Conserver l'architecture IAM et le comportement responsive ; moderniser le visuel, pas le modèle de sécurité. |
| Topbar tenant, recherche, notifications, profil | PARTIEL | Tenant/recherche/alertes/profil minimal existent. Ajouter seulement les interactions de profil et notification validées par le produit. |
| Indicateurs plateforme | PARTIEL | Trois compteurs sont réels ; deux KPI sont des indisponibilités explicites ; aucune comparaison temporelle. |
| Activité globale et tendances | PARTIEL | Activité réelle présente ; tendances absentes et aucune série contractuelle identifiée. |
| Santé services et alertes | PARTIEL | Alertes et statut d'environnements existent ; aucune santé globale ni disponibilité de services mesurée. |
| Accès rapides autorisés | PARTIEL | Modules et actions existent mais font doublon et certains liens mènent à des zones partielles. |
| Activités récentes | EXISTANT | Conserver les données tenant-scoped ; améliorer le vocabulaire, le filtre et les liens si utile. |
| Guide de démarrage contextuel | ABSENT | À construire à partir de signaux métier définis (pas de contenu fictif). |
| Responsive desktop/tablette/mobile | EXISTANT | Préserver drawer, focus et grilles ; ajouter tests visuels/de navigation ciblés cockpit. |

## Fonctionnalités à préserver

- Le chemin canonique `/dashboard`, les redirections `/` et `/cockpit`, et la séparation avec `/erp`.
- Les projections serveur en lecture seule, le filtrage systématique par tenant et les permissions widget par widget.
- La protection en profondeur : garde de route frontend, contrôle IAM backend, tenant obligatoire, validation client du `tenantId` de réponse et annulation des requêtes lors d'un changement de contexte.
- Les vrais états `LOADED` (y compris zéro), `EMPTY`, `ERROR`, `FORBIDDEN` et `UNAVAILABLE`, avec retry local.
- La navigation filtrée par permissions, la sidebar responsive/accessibile et la recherche de menu ne révélant pas d'élément interdit.
- La recherche globale limitée aux ressources autorisées et le nettoyage de l'état tenant-scoped lors d'une bascule.

## Redondances et décisions à arbitrer

- Les alertes sont affichées dans le cockpit et dans le panneau de notifications de la topbar. Une seule même source est consommée, ce qui évite une incohérence de données, mais une hiérarchie produit est nécessaire (aperçu topbar vs centre d'alertes vs widget dashboard).
- Les cartes « Vos modules », les actions rapides et la sidebar proposent tous des entrées vers les modules. Les conserver avec des rôles distincts : navigation exhaustive dans la sidebar, actions contextuelles dans le cockpit, et cartes limitées à l'orientation/onboarding.
- `DashboardProvider` est monté dans le layout global parce que la topbar utilise les alertes. Toute modernisation doit préserver ce besoin ou découpler explicitement le chargement de notifications pour éviter une régression/perte de données.
- Les sections Packs récents, Environnements et Alertes sont des listes opérationnelles, pas des graphiques ni une synthèse de santé. Ne pas les présenter comme telles.

## Risques de régression

| Risque | Mesure de prévention |
|---|---|
| Fuite inter-tenant après changement de sélection | Conserver purge, abort, scope et contrôle `data.tenantId`; tester A → B → A. |
| Révélation d'un module ou d'une métrique interdite | Garder `canAccess` pour l'UI et les permissions dans le service ; ne pas se contenter de masquer une carte. |
| Introduction de chiffres fictifs pour les KPI absents | Afficher `UNAVAILABLE` tant qu'aucune API contractuelle n'existe. |
| Perte des alertes topbar en refactorisant le dashboard | Découpler intentionnellement ou maintenir le provider partagé ; tester les deux emplacements. |
| Régression mobile/a11y de navigation | Préserver drawer, Échap, inert, focus, libellés et `motion-reduce`; ajouter des scénarios de viewport. |
| Confusion cockpit plateforme / dashboard ERP | Garder les routes, intitulés et sources distincts dans la maquette et le plan de migration. |
| Erreur base de données non actionnable | Ne pas exposer de détail sensible ; exploiter le code normalisé pour un message plus précis seulement si le produit le valide. |

## Proposition de migration incrémentale (sans implémentation à ce stade)

1. **Lot 0 — contrat et inventaire** : valider le périmètre `/dashboard`, le modèle de notification, la liste des accès rapides et les métriques réellement calculables. Décider quelle API fournira toute tendance ou santé globale.
2. **Lot 1 — shell visuel** : moderniser le layout dashboard en réemployant `TechzoneLayout`, `Sidebar`, `Header`, `DashboardProvider` et les états existants. Aucun changement de route, de payload ou de règle IAM.
3. **Lot 2 — contenu existant** : remaquetter KPI, activité, alertes, environnements, packs et accès rapides à partir des mêmes widgets. Clarifier l'état indisponible et la différence entre autorisation refusée et absence de source.
4. **Lot 3 — onboarding et consolidation** : ajouter le guide contextuel seulement après définition de critères à partir des données existantes (ex. aucune application, aucun environnement) ; dédoublonner les rôles sidebar/cartes/actions/notifications.
5. **Lot 4 — nouvelles données** : introduire tendances et santé uniquement avec de nouveaux contrats backend versionnés, tenant-scoped, permissionnés, bornés et testés. Aucun mock ne doit devenir un KPI de production.
6. **Lot 5 — recette et retrait contrôlé** : comparer anciennes/nouvelles surfaces sur les principaux profils IAM et tenants ; supprimer les variantes seulement après validation produit et accessibilité.

## Tests existants et tests nécessaires

### Tests existants identifiés

| Fichier | Couverture utile |
|---|---|
| `backend/src/modules/platform/dashboard.service.spec.ts` | Tenant requis, absence de requête interdite, isolation tenant, limites, erreurs sans fuite, zéro vs vide vs indisponible, refresh ciblé, audit sans payload sensible, recherche autorisée/bornée, timeout. |
| `frontend/src/components/dashboard/dashboard.test.jsx` | Navigation effective et rendu `WidgetBody` pour zéro, empty, unavailable, retry, forbidden et loading. |
| `frontend/src/components/Sidebar.test.jsx` | Sidebar active/repliée, recherche, permissions, fallback tenant, drawer mobile et accessibilité. |
| `frontend/src/app/navigationAccess.test.js` | Parité menu/route, permissions, fallback tenant et absence de doublons. |
| `frontend/src/tests/tenantSwitch.test.jsx` | Purge des données tenant-scoped et comportements de refus/erreur au changement de tenant. |
| `frontend/src/components/ContextBar.test.jsx` | Composant de contexte d'autres espaces, pas le tenant selector de la topbar. |

### Tests à ajouter avant ou pendant les lots

- Test de rendu intégral de `CockpitView` avec réponse réelle simulée : KPI, sections conditionnelles, liens et horodatage.
- Tests de contrat UI pour chaque widget (`LOADED`, zéro, `EMPTY`, `ERROR`, `FORBIDDEN`, `UNAVAILABLE` avec code) et cohérence de masquage des alertes.
- Test de `DashboardProvider` : abort, rejet de réponse d'un autre tenant, refresh total/ciblé et erreur globale.
- Tests `Header` : bascule tenant, notifications alimentées par les mêmes widgets, recherche desktop/mobile, menu profil et erreurs de bascule.
- Scénarios E2E multi-tenant et multi-rôles : aucun KPI, résultat de recherche, module, alerte ou route directe non autorisé n'est accessible.
- Régression responsive/a11y à 320 px, tablette et desktop : drawer/focus, navigation au clavier, zoom 200 %, lecteurs d'écran pour chargement et erreurs.
- Si des tendances/santé sont ajoutées : tests de contrat backend, calcul (période, fuseau, zéro), autorisations, indisponibilité partielle et rendu sans graphique trompeur.

## Conclusion d'audit

La modernisation peut démarrer sans refonte de routes, API ou modèle IAM : la base de données et les protections nécessaires à un dashboard tenant-aware existent déjà. La première phase doit préserver ce socle et ne visualiser que les widgets disponibles. Les tendances, la santé consolidée, le centre de notifications et le guide contextuel sont des capacités produit à spécifier avant toute implémentation.

## Mise à jour DASH-00 — références V3 vérifiées

Lors du lot DASH-00, l'audit a été recoupé avec `03_SPEC_UI_DASHBOARD_V3.md` et `06_MAQUETTES_DASHBOARD_V3.md`. Les deux documents confirment que la cible est une unique page d'accueil enrichie de composants et d'états responsive, et non dix-huit nouvelles routes. Ils ne fournissent aucune donnée de production supplémentaire : les graphiques, la santé consolidée, les quotas, les applications actives et la progression du guide restent conditionnels aux contrats réellement disponibles.

`CDC_TABLEAU_DE_BORD_TECHZONE_CLOUD_V2` n'a pas été trouvé dans le workspace au moment de cette vérification. Les captures `docs/dashboard-navigation/screenshots/dashboard-desktop.png` et `dashboard-mobile.png` ont été identifiées comme traces de l'interface existante, non comme maquette V3 de référence. Le plan de migration détaillé et la matrice de décision sont consignés dans `07_PLAN_MIGRATION_DASHBOARD.md`.
