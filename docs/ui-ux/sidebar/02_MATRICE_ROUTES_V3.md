# Matrice routes Sidebar V3

## Surface réellement utilisée

Le routeur actif est `frontend/src/App.jsx`. La page Accueil est `/dashboard` → `CockpitRoute` → `CockpitView`, montée dans `TechzoneLayout`. La sidebar effective est `components/Sidebar.jsx`, alimentée par `app/navigationMenu.js` et `app/navigationConfig.js`; elle n'est pas remplacée par les écrans de démonstration `features/iam-demo`.

`CDC_SIDEBAR_NAVIGATION_GLOBALE_TECHZONE_CLOUD_V2.md` et `DASHBOARD_REFERENCE_V3.png` n'ont pas été trouvés. Les routes de cette matrice sont celles inspectées dans le routeur actif.

| Espace V3 | Module affiché | Sous-menus réellement affichés | Route d'entrée | Accès |
|---|---|---|---|---|
| Accueil | Tableau de bord | Tableau de bord | `/dashboard` | Authentifié + tenant |
| Création | Business Manager | Vue, applications, modèle, fonctionnalités, navigation, configuration, validation | `/business-manager` | Route existante |
| Création | UI Builder | Vue, pages, éditeur, composants, formulaires, navigation, thème, aperçu | `/ui` | `ui-builder:read` |
| Création | Automatisation | Vue, workflows, triggers, actions, planifications, exécutions, règles | `/automation` | `automation:read` |
| Publication | Pack Manager | Vue, packs, versions, modules, dépendances, validation, publication, historique | `/packs` | `pack.read` |
| Publication | Environnements & Déploiements | Environnements, déploiements, historique des déploiements | `/environments`, `/deployment` | Routes existantes |
| Publication | Pack Runtime | Vue, contextes, manifest, résolution, configuration, cache, diagnostics | `/runtime` | `runtime.resolution.read` |
| Données | Data Platform | Vue, sources, contrats, requêtes, politiques, diagnostics, historique | `/data-runtime` | `data-runtime:read` |
| Données | ERP / Integration Hub | Vue, ressources, mappings, synchronisations, diagnostics | `/erp` | `erp:read` |
| Données | API Manager | Vue, connecteurs, webhooks, diagnostics | `/settings/integrations` | Route existante |
| Supervision | Observabilité | Vue, monitoring, logs, traces, erreurs, alertes, audit, sécurité | `/observability` | Permissions de route |
| Commercial | Abonnements & Facturation | Vue, plans, abonnements, entitlements, quotas, facturation | `/billing/overview` | Permissions de route |
| Administration | Administration Platform | Vue, paramètres, profil (planifié) | `/admin` | Routes existantes |
| Administration | Auth / IAM | Utilisateurs, identités, rôles, policies, tenants, organisations, sessions | `/iam/users` | Permissions de route |
| Administration | Registry Transversal | Vue, entrées, capacités, providers, compatibilité, diagnostics | `/packs/registry` | Selon route |

## Éléments volontairement non affichés

- **Prisma / Tenant Foundation** : aucune route utilisateur technique confirmée ; non affiché afin de ne pas créer de destination fictive.
- Les actions telles que déployer, rollback, publication et assistants restent dans les modules propriétaires.
- Les onglets contextuels (versions, bindings, tests, readiness, préflight) restent dans leurs pages lorsqu'aucune route autonome n'est enregistrée.

## Garanties

Chaque entrée est construite depuis `navigationConfig.js`, filtrée par `canAccess`, et les URLs directes restent protégées par `RequireNavigationAccess`. Les routes de déploiement ont été regroupées visuellement sous Environnements & Déploiements sans modifier leurs URL.
