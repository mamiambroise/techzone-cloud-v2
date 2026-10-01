# Dashboard et navigation — audit avant développement

30/09/2026. Base canonique : main, avec consolidation BM/PM/Runtime locale de la mission précédente. Aucun merge historique. Le nouvel ordre autorise commit et push après recette.

## Sources

Inventaire du dépôt (Markdown, texte, DOCX, documentation) : dix CDC actuels dans `Cahiers de charges/` : Dashboard v2, Sidebar v2, Business Manager v2, UI Builder v1, Automation v1, Pack Manager v2, Pack Runtime v2, Data Platform/Data Runtime v2, ERP Adapter/Integration Hub v2, Registry Platform v2. Lecture des responsabilités, navigation, contrats, IAM/tenant, états, données réelles et critères de recette de ces documents. Dashboard et Sidebar lus intégralement. Aucun CDC autonome IAM, Billing, Administration ou Deployment présent dans l'inventaire actuel ; code et rapports existants font foi pour leurs capacités. Aucun DOCX trouvé hors dépendances/legacy.

Priorité de résolution des divergences : la mission et Sidebar v2 imposent « Validation » au BM malgré le libellé historique toléré par BM v2 ; ERP reste spécialisé et séparé des connecteurs génériques ; les routes existantes restent canoniques, les chemins des CDC sont indicatifs.

## Matrice

| Élément / CDC | Existant frontend / route | Backend et données | IAM/tenant | Tests existants | Décision |
|---|---|---|---|---|---|
| Dashboard v2 | CockpitView `/dashboard`, GeneralOverviewView historique ; nombreuses valeurs dérivées de Redux, état santé éditable, faux refresh | PlatformService dashboard est en réalité monté sur `/api/business-manager/dashboard`, pas `/api/platform/dashboard` ; agrégation Foundation tout-ou-rien | TenantGuard existant ; pas de sélection des widgets par permission | Pas de tests du dashboard global | REFACTOR vue montée ; COMPLETE agrégation globale dans PlatformModule, conserver contrat BM |
| KPI applications | Redux applications | Application tenant-scoped propriétaire BM | Auth + BmTenantGuard, pas de permission BM dédiée existante | Tests services BM | KEEP propriétaire ; count serveur |
| KPI packs / récents | PackManagerPage `/packs` | Pack/PackVersion tenant-scoped réels | pack.read et autres permissions granulaires | Tests PM + recette précédente | COMPLETE projection dashboard limitée |
| Déploiements / environnements | DeploymentPublicationView, EnvironmentsView | Deployment/Environment tenantId existant | Routes historiques authentifiées ; ne pas élargir accès | Quatre suites dépendantes de fixtures absentes | KEEP routes ; projections tenant strictes |
| Sources Data | DataRuntime `/data-runtime` | Pas de DataSource persistant autonome trouvé ; ERPRegistry existe pour ERP | data-runtime:read | Tests moteur Data | KEEP page ; afficher métrique UNAVAILABLE, ne pas compter arbitrairement les ERP comme toutes les sources |
| Connecteurs | IntegrationsView et ERP spécialisé | Connector générique n'a pas de tenantId ; ERPRegistry est tenant-scoped | Ne pas exposer catalogue global comme compteur tenant | Tests ERP/IAM | KEEP APIs ; compteur générique UNAVAILABLE jusqu'à contrat tenant sûr |
| Activité / alertes | Ancien audit Redux, alerts slice | AuditEvent, PM validation, Runtime diagnostics, Deployment et BM quality | Filtrer à la source tenant + permission ; ne jamais retourner before/after/secrets | Tests de domaines | IMPLEMENT projection bornée, erreurs par source |
| Sidebar v2 | Sidebar.jsx + navigationConfig/routes + navigationAccess | Pas de besoin de table Sidebar | Fallback de grants frontend actuellement basé isAdmin | navigationConfig, icons, configuration/session tests | IMPROVE composants ; permissions authentifiées exposées par me, fallback fermé |
| Accordéons / réduit | Lien parent navigue ; bouton séparé ; état reset à chaque route ; title seul | Sans objet | Menus filtrés | Couverture incomplète | REFACTOR parent bouton, persistance non sensible, tooltip focus/hover |
| Mobile | Overlay/Escape, pas de focus trap ni inert | Sans objet | TenantBoundary existe | Recette responsive précédente | COMPLETE focus, retour hamburger, fermeture route, scroll |
| Runtime / Data | Runtime unique ; Data possède enfant « Data Runtime » | Services réels conservés | Permissions granulaires Runtime | Recette précédente | KEEP routes ; labels orientés utilisateur |
| Registry | PM registre publié + ERPRegistry + registres spécialisés ; pas de console Registry Platform trouvée | Pas de Registry Core global monté | Ne pas inventer availability | Tests spécialisés | ADAPT entrée plateforme informative Bientôt via ComingSoon existant ; garder registre PM contextuel |
| UI Builder / Billing / Admin | Routes ComingSoon et maquettes séparées | Modules complets non montés | Pas de fausses permissions commerciales | Tests ComingSoon | KEEP Bientôt explicite ; aucune fausse fonctionnalité |
| Automation / ERP / API | Pages réelles, menus partiels et écrans prévus | Moteurs existants | automation:read/execute, erp:read/write | Tests domaines | KEEP routes ; exposer les sous-pages existantes utiles sans inventer les autres |
| Breadcrumb / recherche | Header répète module ; recherche Redux apps/env/config | Pas de recherche globale serveur existante | Risque de contexte obsolète | Tests navigation | IMPROVE métadonnées communes ; recherche agrégée bornée et filtrée serveur |
| Tenant switch | TenantProvider + reset Redux + TenantBoundary | Membership vérifiée, cookies remplacés | Profil permissions non rafraîchi actuellement | session-navigation | COMPLETE refresh du principal et annulation/ignorance des requêtes anciennes |

## Fichiers audités

Frontend : App, Sidebar, Header, GlobalSearch, SubNavBar, TechzoneLayout, CockpitView, GeneralOverviewView, navigationConfig/routes/navigationAccess/navigationIcons, AuthProvider, TenantProvider, TenantBoundary, store et apiClient. Backend : PlatformController/Service/Module, Prisma, IAM principal/guards/auth/constants, BM applications, PM/Runtime, ERPRegistry et contrôleurs Deployment. Rapports de consolidation précédents utilisés comme contexte, pas comme preuve du fonctionnement actuel.

## Plan retenu

Une vue Dashboard montée, un agrégateur global dans le module Platform existant, aucune migration nécessaire. Lectures limitées, indépendantes avec états LOADED/EMPTY/ERROR/FORBIDDEN/UNAVAILABLE ; pas de statut global de santé inventé. Une définition de routes/navigation conservée. Tests ciblés puis contrôles globaux, navigateur réel et revue avant Git.
