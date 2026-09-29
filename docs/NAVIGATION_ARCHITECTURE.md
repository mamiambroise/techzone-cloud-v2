# Architecture de navigation

État final de la navigation, adapté à la demande Phase 1.5 : routes Business Manager sous /business-manager/* et ComingSoon pour les pages absentes. Aucun moteur métier manquant reconstruit.

## Sources

- SIDEBAR_SOURCE = frontend/src/app/navigationConfig.js
- ROUTES_SOURCE = frontend/src/app/routes.js
- SUBNAV_SOURCE = pageDefinitions dans navigationConfig.js
- NAVIGATION_CONFIG_COUNT = 1
- SIDEBAR_IMPLEMENTATION_COUNT = 1 (Sidebar.jsx)
- Sidebar, SubNav, Header et métadonnées du guard utilisent la même configuration.
- Les onglets d’édition locaux (WorkspaceConfigView) restent des états de formulaire, pas une seconde navigation globale.

## Ordre et sections

1. Tableau de bord — Principal
2. Applications — Principal
3. Business Manager — Construction
4. UI Builder — Construction
5. Automatisation — Construction
6. Packs — Construction
7. Données & ERP — Intégrations
8. Abonnements & Facturation — Plateforme
9. IAM & Administration — Plateforme
10. Observabilité — Plateforme
11. Paramètres — Plateforme

## Routes et compatibilité

La matrice exhaustive est dans NAVIGATION_ROUTE_MATRIX.md. resolveRoute utilise matchPath, avec priorité aux chemins statiques puis dynamiques. /erp et /erps restent distincts. /erp/stocks réutilise le module existant stock-movements ; aucune gestion de stock supplémentaire créée. /data-runtime/query redirige vers le formulaire existant #query.

Les anciennes URLs utiles redirigent sans perdre query string et fragment. Les chemins inconnus aboutissent à NotFound ; une session absente redirige au login en conservant la destination. Les refus de permission affichent Forbidden. ComingSoon affiche un titre et une description spécifiques, sans compter comme fonctionnalité réalisée.

## Application context

APPLICATION_CONTEXT = PARTIAL. Redux applications.selectedAppId existe et est partagé par les vues historiques. Le détail application le synchronise depuis l’URL. Les routes BM versionnées transportent applicationId/versionId. Les nouveaux squelettes BM ne chargent pas encore un contexte métier complet ; Configuration nécessite également environmentId pour résoudre les valeurs effectives. Aucun nouveau moteur de contexte ajouté.

## Permissions et entitlements

PERMISSION_NAVIGATION = PARTIAL. navigationAccess utilise la session AuthProvider, jamais IAM_ROLES de démonstration. Les grants admin/user sont ceux définis par iam.constants.ts ; /me ne renvoie pas de permissions commerciales ou tenant fines. Les permissions explicitement présentes prennent priorité. Sidebar/SubNav et ProtectedRoute appliquent le même prédicat. Les guards serveur restent la sécurité effective.

NAVIGATION_ENTITLEMENTS = NOT_IMPLEMENTED. Pas de source commerciale frontend active ; aucun entitlement attribué artificiellement. Le metadata optionnel échoue fermé si absent de la session.

Le profil techzonetest est standard : IAM et Observabilité sont masqués et les accès directs refusés. Les 11 groupes sont vérifiés avec un profil admin uniquement en test unitaire, pas dans une session admin réelle.

## Audit et limites fonctionnelles

Audit préalable : navigation/AUDIT_BEFORE.md et navigation/before.json (74 routes initiales). Les changements intermédiaires présents dans le workspace lors de la Phase 1.5 ont été conservés et réconciliés.

UI Builder, formules, actions, Pack Manager/Registry/dépendances/runtime, facturation et certains paramètres sont NOT_IMPLEMENTED. Les maquettes historiques sont conservées uniquement comme pages contextuelles lorsqu’elles existaient.

Les nouveaux BMApplicationsRoute/BMVersionsRoute/BMOverview sont des squelettes (tableaux vides ou compteurs fixes), donc PARTIAL et non REAL_PASS. Le formulaire préparatoire BM est désactivé pour ne pas simuler une création. L’ancienne gestion d’applications est conservée.

Automatisation : pages PARTIAL, conditions/règles disposent d’appels API ; automation.module.ts charge MockAutomation et action.engine.ts contient un handler NO_OP. La navigation ne change pas leur réalité. Business Manager ne propose pas un deuxième moteur de règles/formules/workflows.

## Validation

node scripts/check-navigation.mjs : contrôle des composants, imports, chemins, redirects, pertes de routes historiques, collisions et permissions. Résultats dans navigation/check-results.json.

31 actions Redux-only ont été migrées vers React Router. Deux copies des sous-onglets BM et le switch de titres Header ont été remplacés par des métadonnées communes. Aucune seconde Sidebar globale supprimée : il n’y en avait qu’une. Les anciens chemins actifs /business/* ne subsistent que dans les redirects et leurs tests.

Recette réelle et limites : business-manager/BM_PHASE_1_5_RUNTIME_UI_REPORT.md.
