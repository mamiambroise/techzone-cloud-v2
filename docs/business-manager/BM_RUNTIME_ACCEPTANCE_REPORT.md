# Business Manager — recette réelle du 29 septembre 2026

P0 utilisable sur le runtime local : navigateur Edge → React → API NestJS → PostgreSQL,
avec le compte de recette existant et son unique tenant autorisé. Aucun mock ni insertion
SQL de données métier. Les enregistrements de recette sont conservés pour vérification.

| Domaine | Backend | Frontend | E2E |
|---|---|---|---|
| Applications | PASS | PASS | PASS |
| Versions | PASS | PASS | PASS |
| Data Model | PARTIAL | PARTIAL | PASS |
| Entities | PASS | PASS | PASS |
| Fields | PASS | PASS | PASS |
| Relations | PARTIAL | PARTIAL | PASS |
| Features | PASS | PASS | PASS |
| Capabilities | PASS | PASS | PASS |
| Navigation | PASS | PASS | PASS |
| Configuration | PASS | PARTIAL | PARTIAL |
| Quality | PARTIAL | PASS | PASS |
| Contracts | PASS | MISSING | PARTIAL |
| Runtime | PARTIAL | MISSING | PARTIAL |
| Publication | PARTIAL | MISSING | BLOCKED |

PASS désigne les opérations vérifiées ci-dessous, pas une certification de tous les CDC.

## Preuves

- 46 tests backend ciblés, 18 tests frontend ciblés : PASS.
- `npx nest build`, `npx vite build`, `npx tsc --noEmit` frontend : PASS.
- Recette API principale : 33 réponses 2xx, login et sélection du tenant compris.
- Application LIST/CREATE/READ/UPDATE, version CREATE, entité CREATE/UPDATE,
  champ CREATE/UPDATE/DELETE avec relecture du type et du booléen, contrainte/relation CREATE,
  feature/capability CREATE/UPDATE, capability ARCHIVE, menu/item CREATE/UPDATE,
  navigation RESOLVE, validation RUN/REPORTS/GATE : API réelles.
- Configuration CREATE/UPDATE : PLATFORM, APPLICATION, APPLICATION_VERSION, ENVIRONMENT,
  TENANT. Consultation Configuration vérifiée dans le navigateur ; CRUD UI non recetté.
- Contrat CREATE/VALIDATE/ASSEMBLE et manifest CREATE/RESOLVE : accessibles.
  Le resolver retourne réellement NOT_READY ; liste des snapshots accessible.
- Edge sans interception réseau : login, application CREATE/READ/UPDATE, version CREATE/OPEN,
  entité/champ CREATE, champ UPDATE, feature/capability CREATE, navigation UPDATE,
  validation RUN, Configuration OPEN. Aucune erreur React. Contexte conservé via le sidebar.
- Refus HTTP 404 d'une relation dont les entités appartiennent à une autre version.
  Tests unitaires des filtres tenant et du refus de contexte absent, y compris super-admin.
  Aucun second tenant de recette disponible : isolation inter-tenant HTTP non certifiée.

## Corrections et base locale

Le schéma local manquait de colonnes tenant et de toutes les tables BM. Application de
la migration tenant existante `20260927010000_add_tenant_id_to_platform_models`, puis
de `20260929000000_business_manager_core`, générée depuis le schéma Prisma canonique.
Application transactionnelle sur le PostgreSQL local, sans suppression de données.
Le schéma local ne dispose pas de registre `_prisma_migrations` : ces applications SQL
ne constituent pas une validation de `prisma migrate deploy` sur un autre environnement.

Blocages corrigés : DTO Application rejetant code/name, include Prisma `relations`
inexistant, DTO contrainte invalide, type de champ ignoré en UPDATE, collision des routes
contrats plateforme/BM, faux PASS sans rapport qualité, compte de relations figé à zéro,
absence de garde tenant explicite BM et de vérification des références inter-version.
La configuration utilise les API réelles, conserve les erreurs de sauvegarde et omet
scopeId pour PLATFORM. Aucun KPI contrats inventé sur l'overview.

## Limites restantes

- Relations et contraintes : création/lecture uniquement selon les endpoints existants.
  Entités/features/capabilities : archivage contrôlé plutôt que suppression physique.
- Quality : règles existantes seulement ; ce n'est pas un contrôle exhaustif des CDC.
- Contracts/runtime : API vérifiées, interface contextuelle spécialisée non ajoutée.
- Publication : le changement de statut existant n'orchestre pas qualité, readiness et
  snapshot atomiquement. Aucun déploiement/publication exécuté ; reste PARTIAL/BLOCKED.
- Environnement non sélectionné : affiché comme tel, sans valeur inventée.
- Avertissement Vite sur les chunks volumineux, non bloquant.

## Fichiers touchés par cette intervention

- Frontend : `App.jsx`, `app/navigationConfig.js`, `components/ConfigurationView.jsx`,
  `store/configSlice.js` ; dans `components/business-manager/` : `BMOverview.jsx`,
  `BMApplicationsRoute.jsx`, `BMApplicationNewRoute.jsx`, `BMApplicationDetailRoute.jsx`,
  `BMVersionsRoute.jsx`, nouveaux `BMWorkspaceRoute.jsx`, `BMResourceEditor.jsx`,
  `BMWorkspaceRoute.test.jsx`.
- Backend BM : nouveaux `bm-tenant.guard.ts`, `bm-regressions.spec.ts` ; six contrôleurs
  des domaines ; services data-model/features/quality ; DTO data-model/features ; test quality.
- Backend plateforme : contrôleurs applications/application-versions/configuration/
  environments/contracts/snapshots ; DTO de création application.
- Migration BM citée ci-dessus ; trois matrices/checklists existantes et ce rapport.

BM_BACKEND = PARTIAL — BM_FRONTEND = PARTIAL — BM_E2E = PARTIAL — BM_OVERALL = PARTIAL.
Le parcours CRUD P0 fonctionne ; publication et couverture CDC complète restent à terminer.
