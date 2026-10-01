# Consolidation Business Manager / Pack Manager / Runtime

## État initial et matrice avant implémentation

Base observée : `10bf388f`, main, workspace propre. Aucun commit, push ou merge autorisé pour cette mission.

Inventaire CDC : 24 documents, BM-CDC-01 à 08, PM-CDC-00 à 07, PR-CDC-00 à 07. Les critères de recette de chacun ont été rapprochés des routes et services montés. BM-CDC-00 et 09 ne sont pas présents dans ces répertoires. Les extensions avancées des CDC ne doivent pas être déclarées complètes sur la seule présence d'un fichier.

| Domaine / fonction | CDC | Backend actuel | Frontend actuel | Mami | Statut initial | Action / priorité |
|---|---|---|---|---|---|---|
| Applications, versions | BM 01–02 | CRUD tenant, lifecycle partiel | Routes réelles, contexte | Modèle différent | PARTIAL | KEEP, contrôler intégration P1 |
| Data model | BM 03 | Entités/champs/relations/contraintes | Workspace réel | Ne pas remplacer | PARTIAL | KEEP, recette P1 |
| Features, navigation | BM 04–05 | CRUD et résolveur | Workspace réel | Ne pas remplacer | PARTIAL | KEEP P1 |
| Configuration | BM 06 | Scopes plateforme/application/version | API réelle | Autre architecture | PARTIAL | KEEP P1 |
| Runtime Bridge, qualité | BM 07–08 | Bridge et rapports existants | Validation réelle | Signature incompatible | PARTIAL | IMPROVE contrat consommateur P0 |
| Packs / cockpit | PM 01–02 | Absent | Mes Packs affiche applications | CRUD utilisable, audit distinct | MISSING / UI_ONLY | ADAPT modèle et service P0 |
| Versions / manifest / publication | PM 00,03 | Absent | Pages applications réutilisées à tort | Transactions partielles, validation insuffisante | MISSING | ADAPT et renforcer P0 |
| Modules / features / capacités | PM 04–05 | Absent | Absent | Création seulement | MISSING | ADAPT puis compléter CRUD P1 |
| Dépendances / règles | PM 06–07 | Absent | Placeholders | Pas de SemVer effectif, règles peu validées | MISSING | Renforcer moteur partagé P0 |
| Loader / résolution | PR 00,02–06 | Absent | Placeholder doublonné sous Packs | Accès direct PM, contexte non fiable, ENABLE peut annuler un blocage | MISSING | Adapter frontière par contrat, fail closed P0 |
| Cache / diagnostics | PR 01,07 | Absent | Absent | Cache mémoire, clés sans acteur, diagnostics persistés | MISSING | Adapter identité/permissions/tenant P0 |
| Auth | Transverse | IAM cookies et refresh canonique | Login sombre minimal | Inutile | PARTIAL | IMPROVE UI sans remplacer IAM P2 |
| Navigation | Transverse | — | Runtime doublonné, Packs sémantiquement faux | Autre route registry | DUPLICATE | Canonicaliser routes et liens P1 |

## Architecture conservée

NestJS et PrismaService canonique (`src/generated/prisma/client`), guards globaux IamJwtGuard / IamPermissionGuard / IamPermissionsGuard, principal authentifié et tenant obligatoire. AuditEvent et OutboxEvent existent : ne pas importer les tables d'audit concurrentes de Mami. Frontend : routeDefinitions, AuthProvider, apiClient, TenantBoundary et composants BM `bm/ui.jsx` conservés. Data Runtime et ERP Adapter restent hors authoring PM et hors résolution de définitions.

## Comparaison historique

Source locale disponible : `jasmina-bm/Mami`, consultée avec `git show`, sans merge. Les rapports historiques 03 et 04 surestiment la couverture : les fichiers réels diffèrent de leur inventaire et plusieurs vérifications critiques manquent. Les modules PM/PR de cette source constituent une base PARTIAL, jamais une preuve de conformité.

## Validation finale

Rapport du 30 septembre 2026. Le parcours local BM → contrat verrouillé → qualité → pack validé/publié → résolution Runtime est implémenté et testé avec les API et PostgreSQL réels. La conformité exhaustive aux 24 CDC n'est pas revendiquée : les extensions restantes sont détaillées ci-dessous.

### Résultat fonctionnel

| Périmètre | Résultat livré | État et limite |
|---|---|---|
| BM 01–02 | Applications/versions existantes conservées ; sélection effective dans Runtime | Parcours intégré validé ; lifecycle avancé non recertifié |
| BM 03–05 | Entités/champs, fonctionnalités et navigation existants conservés | Recette de lecture des écrans ; création entité/champ par API |
| BM 06 | Configuration publique active fusionnée par scope côté serveur | Secrets exclus ; pas de nouvelle implémentation concurrente |
| BM 07 | Contrats créés/verrouillés depuis Validation ; contexte applicatif par Runtime Bridge | Lien réel vers PM/Runtime ; connecteurs distants non ajoutés |
| BM 08 | Qualité liée à une empreinte de la définition ; une modification rend l'ancien rapport caduc | PASS puis modification → Runtime BLOCKED puis revalidation → RESOLVED vérifié |
| PM 00–01 | Module Nest canonique, cockpit, audit et compteurs réels | Implémenté pour le périmètre local |
| PM 02 | Définition pack, édition optimiste, archive/restauration, duplication de définition | Duplication de métadonnées explicitement nommée ; pas de copie implicite des versions |
| PM 03 | Versions SemVer, clone avec remappage des références, comparaison API, validation, snapshot, manifest, publication | Publication transactionnelle et immutable ; comparaison visuelle avancée restante |
| PM 04–05 | Modules/features éditables, capacités et associations PROVIDES/REQUIRES/USES | Catalogue tenant/global ; pas de providers externes de capacités |
| PM 06 | Dépendances, compatibilité SemVer, conflits, cycles, vérification des packs publiés transitifs | Moteur local ; visualisation de graphe/impact avancée restante |
| PM 07 | Éditeur de conditions, JSON avancé, validation structurée et règles évaluées sans eval | DENY prioritaire ; scénarios de simulation comparée avancés restants |
| PR 00–02 | Runtime canonique, manifest publié vérifié par hash et contrat, contexte serveur, pipeline persisté | Ne lit pas directement les tables PM pour charger le contrat |
| PR 03–05 | Modules/features, dépendances/capacités/règles et propagation des blocages | Aucun contexte ou permission fourni par le navigateur accepté |
| PR 06 | Effective manifest persisté, état executable, diagnostic et inspection JSON | Résolution de définitions ; ne prétend pas exécuter du code métier |
| PR 07 | Cache mémoire TTL, single-flight, intégrité, isolation tenant/acteur/permissions, invalidation auditée, diagnostics | Pas de Redis, résilience de providers distants ou circuit breaker simulé |
| Auth | Écran responsive, labels/autofill, visibilité mot de passe, erreur inline, pending anti-double-submit, session expirée | IAM/cookies/refresh existants conservés |
| Navigation/UI | 11 sections PM, 7 Runtime, ancien Runtime BM redirigé, composants BM partagés, états vides/chargement/erreur | Les captures et recettes ne certifient pas toutes les combinaisons de données possibles |

### Sécurité et cohérence

Tenant obligatoire depuis IamPrincipal ; permissions explicites pack.* et runtime.* aux contrôleurs. Les comptes ordinaires n'obtiennent pas les permissions administrateur. Les écritures PM passent par une transaction Serializable et contrôlent les versions optimistes. Les versions publiées ne sont plus éditables. Validation et publication recalculent les entrées et les dépendances ; snapshots/manifests ont des empreintes déterministes. AuditEvent et OutboxEvent canoniques sont réutilisés.

Runtime charge exclusivement un manifest publié et vérifié via PackManagerService, puis demande au Bridge BM l'application, sa version, son environnement et sa qualité actuelle. Un rapport obsolète bloque la résolution. Identité, permissions et configuration sont établies côté serveur. Les lectures croisées entre tenants renvoient 404 ; les permissions manquantes renvoient 403. Les valeurs secrètes sont refusées dans les configurations publiques. Ces contrôles ne constituent pas un audit de sécurité exhaustif.

### Changements principaux

- Backend : `modules/pack-manager`, `modules/pack-runtime`, `business-manager/definition-revision.ts`, qualité et Runtime Bridge, module racine et permissions IAM.
- Prisma : 15 modèles PM/PR ; relations composites incluant tenant/version ; empreinte des rapports qualité. Dépendance SemVer ajoutée avec son lockfile.
- Frontend : `PackManagerPage`, `RuntimePage`, formulaires/règles PM, `BMContractsPanel`, Login/AuthProvider, routes et composants BM partagés.
- Navigation : les anciens Runtime BM redirigent vers `/runtime/context` avec les identifiants métier ; historique de déploiement conservé. Les anciennes alertes initiales fictives ont été retirées.
- Recettes : `scripts/consolidation-acceptance.cjs`, `scripts/consolidation-browser.cjs`, tests ciblés PM/Runtime et Auth.
- Aucun changement au legacy `techzone/`, aux builders BM-CDC-09 ou à AI Layer. Aucun merge de Mami : adaptation sélective de son socle, puis renforcement des contrats et contrôles.

### Données et migrations

Deux migrations additives sont fournies : `20260930010000_pack_manager_runtime` (15 tables) et `20260930020000_quality_input_revision` (colonne inputHash nullable). Leur SQL a été appliqué transactionnellement uniquement à la base locale sur 127.0.0.1:55432, après contrôle de la cible. Aucune suppression de données.

Prisma validate et generate passent. La base locale ne possède pas d'historique `_prisma_migrations` ; migrate status signale donc 17 migrations en attente. Le diff global révèle aussi des dérives antérieures IAM/platform. Aucun diff ne concerne les nouvelles tables PM/PR ni la table de qualité modifiée. Le SQL global de réconciliation n'a pas été exécuté : il faudrait inventorier et baseliner la base avant un migrate deploy, sans rejouer aveuglément les anciennes migrations.

Deux tenants et comptes administrateurs de recette isolés ont été créés localement ; aucun compte existant n'a été élevé. Les identifiants aléatoires restent dans le répertoire temporaire de la machine, hors dépôt. Les recettes ajoutent des données dans ces tenants dédiés ; elles ne nettoient pas les données métier.

### Vérifications techniques

| Contrôle | Résultat |
|---|---|
| Build backend Nest | PASS, dernière compilation du 30/09 |
| Build frontend Vite | PASS ; avertissement existant de taille de chunk > 500 kB |
| TypeScript production backend | PASS avec tsconfig.build.json |
| TypeScript frontend | PASS |
| Tests frontend complets | 56 PASS, 6 skipped, 11 suites PASS et 1 skipped |
| Tests backend ciblés finaux | 45 PASS / 8 suites (PM, Runtime, qualité, Bridge, applications/versions) |
| Recette backend élargie précédente | 66 PASS / 13 suites ciblées |
| Tests backend globaux | 365 PASS, 11 FAIL / 44 suites PASS, 4 FAIL |
| Lint frontend/backend | Exit 0, avertissements conservés |
| Prisma validate/generate | PASS |
| Prisma migration status / diff global | Non verts : historique absent et drift antérieur décrits ci-dessus |
| git diff --check | PASS |

Les 11 échecs globaux se situent dans les suites deployment release, deployments, environment-deployment et rollback : elles attendent des fixtures de déploiement absentes de cette base (`findMany()[0]`, puis accès à id/release). Ces fichiers n'ont pas été modifiés. Le typecheck incluant tous les tests révèle également des erreurs de typage de mocks préexistantes ; le build production passe. Ces échecs restent visibles, ils n'ont pas été masqués ni transformés en skips. Une invocation intermédiaire de Jest sans le lanceur ESM a échoué ; la commande canonique `npm test -- --runInBand --testPathPatterns=...` a ensuite été utilisée avec succès.

### Recette API réelle

Preuve : [api-acceptance.json](api-acceptance.json), 50 contrôles réussis sur le backend recompilé. Création application/version/environnement, entité/champ, contrat verrouillé, qualité, pack/version/module/feature/capacité/dépendance/règle, validation/manifest/publication, résolution et cache. Cas négatifs : publication anticipée, version optimiste périmée, modification de publication, règle invalide, secret public, contexte injecté, accès inter-tenant. Modification BM après validation puis reprise après revalidation. Clone/remappage, comparaison, archive/restauration et endpoints de cockpit vérifiés.

Les scripts requièrent les fixtures locales temporaires préparées ; ils ne sont pas présentés comme un bootstrap CI autonome. Ils utilisent des codes uniques pour permettre plusieurs exécutions sans collision.

### Recette navigateur et visuels

Preuve : [browser-acceptance.json](browser-acceptance.json). 25 routes BM/PM/Runtime visitées avec session réelle et URL vérifiée, création puis modification d'un module par l'interface. 24 contrôles responsive : trois écrans métier et la connexion, chacun à 1920, 1440, 1280, 1024, 768 et 390 px. Aucun débordement horizontal global, aucune erreur JavaScript ou réponse API inattendue pendant cette recette.

Rafraîchissement authentifié, redirection anonyme, erreur de connexion, révocation réelle de session suivie de 401 et retour à la connexion, double soumission limitée à une requête, retour à la route initiale et refus 403 d'un compte ordinaire vérifiés. Les 401 attendus sont consignés séparément dans la preuve.

Captures conservées dans `screenshots/` : cockpit PM, Runtime mobile et connexion desktop/mobile. Inspection visuelle réalisée. Les tableaux longs restent scrollables dans leur conteneur sur mobile. Navigation des onglets au clavier et réduction des animations prises en compte ; aucun audit WCAG complet n'est revendiqué.

### Écarts restant à traiter

1. Comparaison visuelle détaillée des versions, prévisualisation d'impact/graphe et import/export authoring avancé ; l'API compare et l'inspection des manifests existent.
2. Pagination UI au-delà de la première page du catalogue, workflows de lifecycle avancés et édition visuelle de toutes les formes imbriquées de règles.
3. Cache partagé multi-instance, providers distants, entitlements externes et politiques de résilience distribuée. Les endpoints de santé signalent le périmètre local réel.
4. Régularisation séparée de l'historique Prisma/drift existant et fiabilisation des fixtures des quatre suites deployment.
5. Certification exhaustive de tous les critères CDC, tests d'accessibilité assistive et charge/concurrence à grande échelle.

Le parcours principal est livré et vérifié ; les points ci-dessus empêchent de qualifier l'ensemble des CDC de DONE. Les CDC ont été déplacés dans `Cahiers de charges/` pendant la session ; ce déplacement externe aux changements applicatifs a été conservé. Aucun commit, push ou merge n'a été effectué, conformément à la dernière mission.
