# UI Builder — consolidation technique sur Ranja

## Existant préservé et vérifié

API et guards IAM/tenant, DTO en liste blanche, store Redux, registre, bindings Business Manager, références Automation, tokens de thème, validation, UI Definition 1.1 et consommation Pack/Runtime sont conservés. CALL_API reste exclu du contrat. Les tests de service couvrent tenant absent, identifiants forgés, versions étrangères, routes, bindings, workflows et payloads malveillants. Les tests Pack couvrent validation préalable, hash déterministe, immutabilité publiée et rejet de snapshots altérés.

## Changements

- `resolveEditorPage` applique route valide → sélection valide → première page → null ; réutilisé par l’éditeur et testé indépendamment.
- Contrats BmSelect/BmSearchInput par valeur conservés, avec tests consumers existants.
- Le canvas utilise le Shared Renderer avec un adaptateur `decorateNode` pour les contrôles d’édition ; le switch de rendu de feuilles propre à l’éditeur est supprimé.
- Les tests de parité comparent le HTML statique aperçu/runtime pour les trois devices ; ils ne certifient pas l’équivalence des mutations, désactivées en aperçu.
- Rejet des propriétés de composants absentes du schéma du registre.
- Correction de la validation du titre dans UpdateUiPageDto (`MinLength`). Tests de rejet des champs privilégiés et des révisions mal formées.
- Sauvegarde optimiste via `expectedUpdatedAt`, vérifié dans le WHERE de l’UPDATE Prisma avec tenant et version ; P2025 devient 409 / UI_SAVE_CONFLICT. Le client transmet le jeton reçu du serveur et avance sa révision même lorsqu’une saisie continue pendant l’écriture.
- Au conflit, conservation locale, comparaison et rechargement explicite ; autosave et écritures bloquées. Compatibilité : le DTO reste optionnel pour les autres consommateurs ; sans jeton client, seule la concurrence survenant après la lecture serveur est détectée.
- Ordre des pages déterministe avec id en dernier critère.
- Index unique tenant/version/route dans Prisma et migration SQL ; P2002 traduit en erreurs de route ou de clé existantes, sans changer leurs codes publics.

## Déploiement et limites

La migration `20261016100000_ui_page_route_unique` est préparée mais non appliquée. Avant déploiement, contrôler les doublons de routes puis appliquer la migration avec le processus habituel. Aucun doublon n’est supprimé automatiquement. Les lignes legacy sans tenant conservent la sémantique NULL PostgreSQL ; le service refuse le contexte sans tenant.

Les tests ici utilisent les mocks Prisma pour les écritures concurrentes ; une exécution contre PostgreSQL reste nécessaire pour certifier l’index et la concurrence réelle. Aucun accès à une base distante ni migration n’a été effectué pendant cette passe.

Node 20.19.2 échoue dans Nest CLI (ERR_REQUIRE_CYCLE_MODULE / ora). Le build Nest a été vérifié avec le Node 22.23.2 déjà installé et le typage avec TypeScript local.

L’historique persistant des révisions n’est pas ajouté : la récupération de conflit utilise la révision courante et ne constitue pas une timeline.
