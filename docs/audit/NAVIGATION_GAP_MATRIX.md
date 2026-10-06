# NAVIGATION_GAP_MATRIX.md — Sidebar & Navigation Globale V2

**Projet :** Techzone Cloud
**Branche :** `mami`
**HEAD de référence :** `81d3c9b9575678862e0a4420ba51bbdf22435b56`
**CDC de référence :** `Cahiers de charges/CDC_SIDEBAR_NAVIGATION_GLOBALE_TECHZONE_CLOUD_V2.md`
**Date :** 3 octobre 2026

> Méthode appliquée : READ → UNDERSTAND → COMPARE → GAP MATRIX → KEEP / IMPROVE /
> COMPLETE / ADAPT / IMPLEMENT → CODE → TEST.
> Aucun `MISSING` n'est conclu sans recherche réelle dans le code.

---

## 0. Vérification Git préalable

| Contrôle | Résultat |
| --- | --- |
| `git branch --show-current` | `mami` |
| `git rev-parse HEAD` | `81d3c9b9575678862e0a4420ba51bbdf22435b56` (conforme) |
| `git status` | working tree clean |
| `git rev-parse refs/remotes/origin/mami` | `81d3c9b9575678862e0a4420ba51bbdf22435b56` |
| `git rev-parse refs/remotes/origin/Mami` | `10bf388f8042e5657d13d8adff954a0518ca5e9a` |
| `core.ignorecase` | `true` (risque de collision NTFS confirmé) |

Les deux refs sont **distinctes** et se résolvent de façon stable et non ambiguë après
`git fetch --all --prune`. `origin/Mami` n'est jamais mergé. Aucune résolution ambiguë
n'a été observée.

**État initial des tests (baseline avant toute modification) :**

| Suite | Résultat |
| --- | --- |
| `frontend: npm test` | 15 fichiers passés / 1 ignoré — 97 tests passés / 6 ignorés |
| `backend: npm test` | 56 suites / 478 tests passés |

---

## 1. Sources de vérité existantes (audit réel)

| Fichier | Rôle | Verdict |
| --- | --- | --- |
| `frontend/src/app/routes.js` | `ROUTES` — chemins canoniques UI | KEEP |
| `frontend/src/app/navigationConfig.js` | `navigationSections`, `navigationGroups`, `pageDefinitions`, redirects, `resolveRoute`, `activeNavigation`, `groupEntries`, `effectiveNavigation` | KEEP — **source de vérité unique déjà en place** |
| `frontend/src/app/navigationAccess.js` | `canAccess(entry, session)` — filtre IAM frontend | KEEP |
| `frontend/src/app/navigationIcons.js` | registre d'icônes `lucide-react` | KEEP |
| `frontend/src/components/Sidebar.jsx` | rendu Sidebar, accordéon, collapsed, recherche, tooltips, drawer mobile | KEEP / IMPROVE |
| `frontend/src/components/Header.jsx` | fil d'Ariane + sélecteur tenant + menu utilisateur | KEEP / IMPROVE |
| `frontend/src/components/SubNavBar.jsx` | barre de sous-navigation par module | KEEP / IMPROVE |
| `frontend/src/auth/ProtectedRoute.jsx` | garde auth **+** contrôle d'accès IAM | ADAPT |
| `frontend/src/contexts/TenantProvider.jsx` | contexte tenant, switch, génération anti-course | KEEP |
| `frontend/src/components/TenantBoundary.jsx` | chargement / erreur / sélection tenant | KEEP |
| `frontend/src/app/RouteToTabSync.jsx` | synchronisation route → onglets Redux | KEEP |

**Constats structurants :**

- Il n'existe **aucune** base Prisma Navigation.
- Il n'existe **aucun** endpoint `GET /api/sidebar`.
- `App.jsx` ne redéfinit **aucune** route : il/itère `routeDefinitions` issu de
  `navigationConfig.js`. Il n'y a donc pas de double source de vérité routes/navigation.
- `Sidebar`, `Header`, `SubNavBar`, `ProtectedRoute` et `RouteToTabSync` consomment tous
  `navigationConfig.js`. RG-NAV-030 **satisfait**.

---

## 2. Architecture AVANT (effective, super-admin)

```text
ACCUEIL
└── Tableau de bord                          (real)

CONSTRUCTION
├── Business Manager
│   └── Vue d'ensemble, Applications, Modèles de données,
│       Fonctionnalités, Navigation, Configuration, Validation
├── UI Builder
│   └── Pages, Formulaires, Composants, Thème, Aperçu & Test,
│       UI Builder, Navigation                ← ordre + label incorrects
├── Automatisation
│   └── Vue d'ensemble, Règles, Formules, Workflows,
│       Déclencheurs, Actions, Exécutions     ← ordre incorrect
└── Pack Manager
    └── Vue d'ensemble, Packs, Versions, Modules, Fonctionnalités,
        Capacités, Dépendances, Règles, Validation & Manifest, Publication

EXÉCUTION
└── Runtime
    └── Vue d'ensemble, Contextes, Manifest, Résolution,
        Configuration effective, Cache, Diagnostics

DONNÉES & INTÉGRATIONS
├── Données
│   └── Requêtes, Requêtes, Historique        ← DOUBLON "Requêtes", pas de Vue d'ensemble
├── ERP / Dolibarr
│   └── Vue d'ensemble, Clients, Produits, Commandes, Factures,
│       Stocks, Mappings, Configuration ERP    ← détail fonctionnel exposé en global
└── API & Intégrations
    └── Vue d'ensemble, Connecteurs, Webhooks, Diagnostics

PLATEFORME
├── Registry            └── Vue d'ensemble (Bientôt)
├── Environnements      └── Environnements
├── Déploiements       └── Vue d'ensemble
├── Sécurité & IAM      └── Utilisateurs, Identités, Tenants, Rôles,
│                          Politiques, Sessions, Organisations / Sites (Bientôt),
│                          Appareils (Bientôt), Sécurité (Bientôt)
├── Observabilité       └── Vue d'ensemble, Monitoring, Logs, Audit,
│                          Événements de sécurité, Alertes
├── Abonnements         └── Plans, Abonnements, Entitlements, Quotas, Facturation (Bientôt)
└── Administration     └── Paramètres généraux (Bientôt), Profil (Bendments)
```

**Niveau module : conforme au CDC §50.** Les écarts sont au niveau des sous-menus,
de l'ordre, de l'active state et de la sécurité de route.

---

## 3. GAP MATRIX

Légende : `EXISTING` conforme · `PARTIAL` présent mais incomplet · `MISSING` absent après
recherche · `BROKEN` présent et defective · `DUPLICATED` présent en double.

| # | Domaine | État | Preuve (fichier:ligne) | Décision |
| --- | --- | --- | --- | --- |
| 1 | Sidebar (composant) | EXISTING | `components/Sidebar.jsx` — 5 sections, accordéon, collapsed `w-20`/`w-72`, recherche, tooltips, drawer | KEEP |
| 2 | Sections | EXISTING | `navigationConfig.js:4` — ACCUEIL, CONSTRUCTION, EXÉCUTION, DONNÉES & INTÉGRATIONS, PLATEFORME ; ordre exact du CDC | KEEP |
| 3 | Ordre des modules par section | EXISTING | `navigationGroups` ordre = ordre du CDC §50 (registry déclaré 1er → premier sous PLATEFORME) | KEEP |
| 4 | Routes | EXISTING | `routes.js` + `pageDefinitions` ; `App.jsx:160` génère les routes | KEEP |
| 5 | Source de vérité unique | EXISTING | `navigationConfig.js` alimente Sidebar/Header/SubNavBar/Guard/RouteToTabSync | KEEP |
| 6 | Icônes | EXISTING | `navigationIcons.js` — 18 icônes, toutes résolues ; test `navigationIcons.test.jsx` ligne 12 | KEEP |
| 7 | Business Manager | EXISTING | 7 entrées menu dans l'ordre exact du CDC §5 ; **pas** de publication | KEEP |
| 8 | UI Builder — ordre | BROKEN | `navigationConfig.js:153-161` — « UI Builder » (Vue d'ensemble) arrive **après** Pages/Formulaires/Composants/Thème/Aperçu | ADAPT |
| 9 | UI Builder — label Vue d'ensemble | BROKEN | `navigationConfig.js:159` — enfant dupliqué du nom de groupe (« UI Builder ») | ADAPT |
| 10 | UI Builder — Éditeur visuel | EXISTING | `/ui/builder/:pageId` `menu:false` : ressource dynamique, atteint depuis Pages et Vue d'ensemble (RG-NAV-003) | KEEP |
| 11 | Automatisation — ordre | BROKEN | `navigationConfig.js:162-169` — Règles et Formules avant Workflows, contraire au CDC §7 | ADAPT |
| 12 | Automatisation — entrées CDC manquantes | MISSING | aucun Planifications / Modèles / Diagnostics | IMPLEMENT (ComingSoon) |
| 13 | Pack Manager | EXISTING | 10 entrées, ordre exact CDC §8, dont `pmpublication` | KEEP |
| 14 | Pack Runtime sous Pack Manager | EXISTING (conforme) | `grep "Pack Runtime"` → 0 occurrence de navigation ; `/packs/runtime` est un legacyRedirect vers `/runtime` | KEEP |
| 15 | Runtime global unique | EXISTING (conforme) | un seul groupe `runtime` sous `execution`, 7 entrées CDC §9 | KEEP |
| 16 | `bmRuntime` / `bmRuntimeIndex` | EXISTING | `menu:false`, simple redirect vers `/runtime/context` — pas de doublon visuel | KEEP |
| 17 | Données — doublon de label | DUPLICATED | `navigationConfig.js:177` et `:183` portent tous deux le label « Requêtes » | ADAPT |
| 18 | Données — Vue d'ensemble | MISSING | aucun point d'entrée d'ensemble | ADAPT (relabel `/data-runtime`) |
| 19 | Données — Data Platform / Data Runtime | EXISTING (conforme) | `grep "Data Platform"` → 0 entrée de navigation ; un seul groupe `data` | KEEP |
| 20 | ERP — détail fonctionnel en navigation globale | BROKEN | `navigationConfig.js:171-175` exposent Clients/Produits/Commandes/Factures/Stocks dans la Sidebar globale, contraire au CDC §11 + §4 | ADAPT |
| 21 | ERP — hub Ressources | MISSING | aucun point d'entrée « Ressources » alors que les 5 ressources existent | IMPLEMENT (hub de navigation pur) |
| 22 | ERP — Synchronisations | MISSING | aucun écran ERP dédié | IMPLEMENT (ComingSoon) |
| 23 | ERP — Diagnostics | PARTIAL | `/settings/erp` réel,.libellé « Configuration ERP » ; l'écran ERP le présente comme « Parametres et diagnostics » | ADAPT |
| 24 | ERP — non-régression métier | EXISTING | `ERPDashboard.jsx:15` nav workspace ; `ERPList/ErpModule/ERPCreate/ERPEdit` intacts | KEEP — **ne pas modifier** |
| 25 | Dolibarr dupliqué ERP / API | EXISTING (conforme) | un seul groupe `erp` + un seul groupe `api` ; aucun label Dolibarr dans `navigationGroups` | KEEP |
| 26 | API & Intégrations | EXISTING | 4 entrées = CDC §12 exactement | KEEP |
| 27 | API & Intégrations — permission | PARTIAL | `navigationConfig.js:211-226` : les 4 entrées exigent `erp:read` alors que les contrôleurs Integration Hub n'ont **aucun** `@RequirePermission` (`backend/src/modules/integration/*/…controller.ts`) | KEEP + documenter (hors périmètre : Integration Hub) |
| 28 | Registry — module plateforme | EXISTING (conforme) | `navigationConfig.js:6` `section:'platform'`, déclaré 1er | KEEP |
| 29 | Registry — contenu | MISSING | aucun module Registry backend (`grep registry` dans `backend/src/modules` → 0) ; `ComingSoon` assumé | KEEP (Bientôt) |
| 30 | Registry — permission | EXISTING | aucune permission existante ne l'interdit ; rien à protéger | KEEP |
| 31 | Environnements | EXISTING (conforme) | entrée unique ; DEV/STAGING/PROD restent des ressources dynamiques (CDC §14) | KEEP |
| 32 | Déploiements | PARTIAL | seule « Vue d'ensemble » est navigable ; `/history` est une page réelle orpheline (`navigationConfig.js:108` `menu:false`) | COMPLETE |
| 33 | Sécurité & IAM | EXISTING | 6 écrans réels + 3 ComingSoon ; CDC §16 couvert pour l'existant | KEEP |
| 34 | Observabilité | EXISTING | Vue d'ensemble, Monitoring, Logs, Audit, Événements de sécurité, Alertes — aligné sur l'existant | KEEP |
| 35 | Abonnements | EXISTING | 5 ComingSoon, aucun faux écran | KEEP |
| 36 | Administration | PARTIAL | pas de Vue d'ensemble ; « Profil » présent (fallback §20) | ADAPT |
| 37 | IAM filtering (menu) | EXISTING | `navigationAccess.js:2` ; filtrage dans `effectiveNavigation` | KEEP |
| 38 | IAM filtering (route) | PARTIAL | `ProtectedRoute.jsx:37` renvoie `ForbiddenPage`, mais **hors du layout** (perte Sidebar/fil d'Ariane/déconnexion) et libellé « Accès interdit » ≠ « Accès refusé » | IMPROVE |
| 39 | Masquage ≠ autorisation | PARTIAL | aucune API de navigation n'est protégée par construction ; le contrôle réel est porté par les contrôleurs métier (`@RequirePermission`) — conforme pour pack/runtime/automation/ERP/data | KEEP + documenter |
| 40 | Tenant filtering (menu) | EXISTING | `navigationConfig.js:367` — sans tenant, en chargement ou en erreur : **seul** Tableau de bord | KEEP |
| 41 | Tenant Context — switch | EXISTING | `TenantProvider.jsx:19-32` — switch, `refreshPrincipal`, génération anti-course, commit atomique | KEEP |
| 42 | Tenant switch — invalidation de cache | PARTIAL | Redux n'est pas purgé au switch ; les modules clés sont remontés par `key={activeTenant?.id}` (cf. `ERPDashboard.jsx:38`) | KEEP + documenter |
| 43 | Active route | EXISTING | `activeNavigation()` + table d'alias (deep links BM) | IMPROVE (alias ERP) |
| 44 | Parent route conservé | PARTIAL | `Sidebar.jsx:193` auto-déplie `active.group` ; mais `/erp/clients`, `/erp/:moduleKey`, `/erps/create`, `/erps/edit/:id` n'activent aucun enfant visible | ADAPT |
| 45 | Accordéon | EXISTING | `Sidebar.jsx:92-118` ; `aria-expanded`, `aria-controls`, persistance `techzone.nav.expanded` | KEEP |
| 46 | Collapsed mode | EXISTING | `w-20` (80 px) vs `w-72` (288 px) — dans les fourchettes CDC §28 | KEEP |
| 47 | Tooltips collapsed | EXISTING | `Sidebar.jsx:394-402` `role="tooltip"`, déclenché au hover **et** au focus | KEEP |
| 48 | Responsive | EXISTING | `lg:` fixe, drawer sous 1024 px, `matchMedia` + `inert` (`Sidebar.jsx:206-214`) | KEEP |
| 49 | Escape ferme le drawer | EXISTING | `Sidebar.jsx:226-229` + focus trap Tab | KEEP |
| 50 | Recherche Sidebar | EXISTING | filtre **uniquement** les entrées déjà visibles (post-`canAccess`) → ne révèle jamais un module masqué | KEEP |
| 51 | Breadcrumb | PARTIAL | `Header.jsx:86-112` : 2 niveaux derived des métadonnées ; le 3e niveau dynamique vient de `BmBreadcrumb` dans BM / Runtime / Pack Manager | KEEP |
| 52 | Deep links | PARTIAL | résolus et protégés, mais active state parent/enfant incomplet sur ERP (§44) | ADAPT |
| 53 | 404 | EXISTING | `App.jsx:168` `path="*"` → `pages/NotFound.jsx` | KEEP |
| 54 | 403 | PARTIAL | existe mais mal présenté (§38) | IMPROVE |
| 55 | Unavailable | EXISTING | `ComingSoon` (« Bientôt ») pour non-implémenté ; `TenantBoundary` pour contexte tenant indisponible ; états par ressource dans `ErpErrorPanel` | KEEP |
| 56 | Module availability | EXISTING | mécanisme unique `implemented:false` → badge « Bientôt » ; aucun statut inventé (CDC §25) | KEEP |
| 57 | Pas de faux écran | EXISTING | toute page non implémentée passe par `ComingSoon` avec description explicite | KEEP |
| 58 | Loading | EXISTING | `AuthLoadingBoundary` + `TenantBoundary` + Suspense | KEEP |
| 59 | Accessibilité | EXISTING | `aria-label`, `aria-expanded`, `aria-current`, skip-link, focus visible, Escape, Enter/Space natifs (`<button>`/`<a>`) | KEEP |
| 60 | Performance | EXISTING | `effectiveNavigation` mémoïsé (`Sidebar.jsx:167`), lazy loading, définitions de routes stables | KEEP |
| 61 | Tests unitaires navigation | PARTIAL | `navigationConfig.test.js` (structure) + `navigationIcons.test.jsx` (rendu) — **aucun** test de filtre IAM/tenant, d'ordre, d'accordéon, de collapsed | IMPLEMENT |
| 62 | Tests de sécurité | MISSING | aucun test d'accès direct à une route masquée | IMPLEMENT |
| 63 | `ComingSoon` — lien de retour | BROKEN | `components/ComingSoon.jsx:13` renvoie **toujours** vers `ROUTES.bm` (« Retour au Business Manager ») — depuis Registry, Abonnements, IAM, Administration, ERP, Automatisation ou Données | IMPROVE |
| 64 | `SubNavBar` — écrans hors navigation | PARTIAL | `SubNavBar.jsx:13` expose `/erps/create` dans « Autres écrans ERP » | IMPROVE |
| 65 | Doublons multiples | EXISTING (conforme) | aucun groupe `Pack Runtime`, aucun `Data Platform`, aucun module en double dans une section | KEEP |
| 66 | Publication au bon endroit | EXISTING (conforme) | `pmpublication` dans `packs` ; aucun `publication` dans `bm` (RG-NAV-013/014) | KEEP |

---

## 4. Plan de correction retenu

| # | Action | Décision | Fichiers |
| --- | --- | --- | --- |
| A1 | UI Builder : « Vue d'ensemble » en tête, label corrigé | ADAPT | `navigationConfig.js` |
| A2 | Automatisation : ordre CDC §7 + Planifications / Modèles / Diagnostics en `ComingSoon` | ADAPT + IMPLEMENT | `navigationConfig.js`, `routes.js` |
| A3 | Données : suppression du doublon « Requêtes », `/data-runtime` devient « Vue d'ensemble », Sources / Modèles & Contrats / Politiques / Diagnostics en `ComingSoon` | ADAPT + IMPLEMENT | `navigationConfig.js`, `routes.js` |
| A4 | ERP : navigation globale alignée CDC §11 ; détail fonctionnel conservé dans le workspace ERP ; hub « Ressources » ; « Synchronisations » en `ComingSoon` ; `/settings/erp` renommé « Paramètres & diagnostics » | ADAPT + IMPLEMENT | `navigationConfig.js`, `routes.js`, `App.jsx`, nouveau `ErpResourcesNav.jsx` |
| A5 | Déploiements : `/history` devient navigable (page réelle) | COMPLETE | `navigationConfig.js` |
| A6 | Administration : ajout d'une Vue d'ensemble `ComingSoon` | ADAPT | `navigationConfig.js`, `routes.js` |
| A7 | Alias d'active state ERP (`/erp/:moduleKey`, `/erps/*` → Ressources / Registre) | ADAPT | `navigationConfig.js` |
| A8 | 403 rendu **dans** le layout, libellé « Accès refusé », code 403 explicite | IMPROVE | `ProtectedRoute.jsx`, `App.jsx`, nouveau `RequireNavigationAccess.jsx`, `ForbiddenPage.jsx` |
| A9 | `ComingSoon` : lien de retour vers le home du module réellement concerné | IMPROVE | `ComingSoon.jsx`, `App.jsx` |
| A10 | `SubNavBar` : exclusion des routes create/edit du complément | IMPROVE | `SubNavBar.jsx` |
| A11 | Redirect `/data` → `/data-runtime` (profondeur du nom de module) | IMPROVE | `navigationConfig.js` |
| A12 | Tests : filtrage IAM / tenant / ordre / active state / accordéon / collapsed / disponibilité / sécurité | IMPLEMENT | `navigationConfig.test.js`, nouveau `navigationAccess.test.js`, nouveau `Sidebar.test.jsx` |

**Hors périmètre — documenté, non corrigé :**

- Absence de `@RequirePermission` sur les contrôleurs Integration Hub (mission §2 : ne pas
  réécrire l'Integration Hub). Le filtre `erp:read` du groupe `api` reste donc le seul
  garde frontend ; il est plus restrictif que l'API. À traiter dans une mission sécurité.
- Absence de purge de cache Redux lors du `switchTenant` ; la mitigation actuelle est
  le remontage par `key={activeTenant?.id}`.
- `/packs/registry`, `/settings/general`, `iam/contexts`, `billing/*` historiques :
  écrans de démonstration(`DemoPage`) maintenus hors navigation globale.

---

## 8. État après correction (validation réelle)

Recette effectuée sur `http://localhost:3000` avec une session réelle (profil standard,
tenant unique), le 3 octobre 2026.

### 8.1 Actions A1 → A12 : appliquées

Toutes les actions du tableau §7 sont implémentées. Aucun écart résiduel sur les
cinq sections, l'ordre des groupes, les active states, le filtrage IAM et le 403.

### 8.2 Écarts détectés en recette et corrigés

| # | Constat | Cause | Correction |
| --- | --- | --- | --- |
| P1 | `/history` affichait une page blanche (`TypeError: Cannot read properties of undefined (reading 'name')`) | `HistoryRollbackView` déréférence `currentApp.name` sans garde ; le bug préexistait mais la route était `menu:false`, donc non atteignable | Garde `currentApp?.name ?? 'la plateforme'` ; `/history` reste navigable comme exigé par A5 |
| P2 | `/billing/plans` renvoyait vers une autre page `ComingSoon` | `groupDestination('billing')` et `groupDestination('admin')` pointent sur des vues d'ensemble elles-mêmes planifiées | Le lien de retour n'est retenu que si la destination est `implemented === true`, sinon repli sur `/dashboard` (règle testée) |
| P3 | La page 403 proposait `/registry`, page elle-même `ComingSoon` | `ForbiddenPage` listait tous les homes joignables sans filtrer la disponibilité | Les destinations proposées sont filtrées sur `implemented === true`, avec repli sur « Tableau de bord » |
| P4 | `/environments` affichait une page blanche (`reading 'code'`) | `EnvironmentsView` : `currentEnv` vaut `undefined` quand la liste d'environnements est vide, puis `currentEnv.code` est déréférencé. Bug **préexistant et déjà atteignable depuis la sidebar en HEAD** | État vide explicite rendu avant le retour principal (aucun hook après `currentEnv`, donc retour anticipé sûr) |
| P5 | `/environments` plantait ensuite sur `reading 'map'` | `currentEnv.allowedRoles` n'est pas toujours présent dans la charge utile ; c'est le seul tableau non gardé (`history` et `deployedApps` l'étaient déjà) | `allowedRoles ?? []` avec message explicite quand la liste est vide |

> P4 et P5 ne sont pas des régressions de la mission : ils existaient en HEAD sur une
> destination de premier niveau. Ils sont corrigés ici parce qu'une page blanche sur
> une entrée principale de la sidebar n'est pas conforme à l'exigence de robustesse
> du CDC, et parce que le correctif est purement défensif (aucun changement de
> comportement quand les données sont présentes).

### 8.3 Vérifications Manuelement confirmées

- Ordre sidebar : ACCUEIL, CONSTRUCTION (Business Manager, UI Builder, Automatisation),
  DONNÉES & INTÉGRATIONS (Données, ERP / Dolibarr, API & Intégrations), PLATEFORME
  (Registry, Environnements, Déploiements, Abonnements, Administration).
- Profil standard : les groupes IAM et Observabilité sont absents de la sidebar, et
  leurs URL directes sont refusées en 403. 55 liens, aucune exception.
- Active state contextuel : `/erp/clients` → surligne « Ressources » ; `/erp/ressources`,
  `/automation/schedules`, `/data-runtime/sources`, `/data-runtime/history`,
  `/integrations/connectors` surlignent leur entrée ; `/history` surligne « Historique » ;
  `/erps` (page contextuelle hors menu) ne surligne rien, ce qui est attendu.
- Redirect `/data` → `/data-runtime`.
- 403 dans le shell : `/iam/users` et `/packs/packs` refusés avec « Accès refusé ».
- Recherche sidebar : « synchron » trouve `Synchronisations` ; « zzz » affiche « Aucun résultat. ».
- Collapsed : 288 px → 80 px, libellé `Réduire le menu` ↔ `Agrandir le menu`, 9 groupes conservés.
- Mobile 390 px : bouton « Ouvrir le menu », tiroir 288 px, 55 liens.
- Deep link Pack Manager `?pack=` : route reconnue puis refusée par le garde IAM (permission absente).
- Parcours sans crash sur toutes les destinations de menu : `/dashboard`, `/deployment`,
  `/history`, `/business-manager/*`, `/ui*`, `/automation*`, `/data-runtime*`, `/erp*`,
  `/erps`, `/settings/erp`, `/settings/integrations`, `/integrations/*`, `/registry`,
  `/environments`, `/billing/*`, `/admin`.
- Aucun nouveau warning oxlint : parité avec la base (108 `no-useless-spread` dans
  `navigationConfig.js` avant et après ; les avertissements de `HistoryRollbackView`
  et `EnvironmentsView` sont des imports inutilisés préexistants).

### 8.4 Volumétrie

- Frontend : 214 tests passés, 6 ignorés, 0 échec (19 fichiers, 1 ignoré).
- Backend : 56 suites / 478 tests passés, aucun backend modifié.
- Builds : `vite build` OK, `nest build` OK.