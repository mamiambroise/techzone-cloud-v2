# UI Builder V3 — consolidation sur Ranja

Le CDC cible est conservé dans `Cahiers de charges/TECHZONE_UI_BUILDER_V3/`.
Cette consolidation conserve les API, les routes et le modèle métier existants.
Elle ne constitue pas une certification de toute la Definition of Done V3.

## État constaté

- Les consommateurs UI Builder de BmSelect/BmSearchInput utilisent déjà les valeurs ; les tests de contrôles couvrent recherche, création de page, formulaire et inspecteur.
- L'éditeur résout déjà une page au chargement, synchronise son URL et propose la création si aucune page n'existe. Une régression supplémentaire couvre un identifiant inexistant/supprimé.
- L'aperçu importe UiRenderer, comme PublishedApplication dans Pack Runtime. Le canvas de conception conserve des représentations simplifiées : la parité visuelle complète reste à certifier.
- Le service backend possède des contrôles tenant/version et des tests d'appartenance, de bindings, de routes, de registry et d'actions. Leur existence ne remplace pas un test réel avec deux tenants.

## Correctifs de cette consolidation

- Purge complète du contexte Redux lors d'un changement de tenant/version ou d'une désélection : pages, contexte métier, validation, erreurs, statuts et historique.
- Les réponses de lecture dépassées sont ignorées grâce à leur identifiant de requête, y compris lors de deux lectures successives de la même version.
- Les réponses de création, suppression et thème ne réinjectent pas l'ancien contexte après une purge.
- La sauvegarde retient la page et l'arbre envoyés. Une réponse tardive n'utilise plus le canvas de la page suivante et ne marque pas les nouvelles modifications comme enregistrées.
- L'historique reste utilisable après sauvegarde ; la sélection racine utilise l'identifiant réel de la nouvelle page.

## Limites à traiter avant certification V3

- Conflits entre deux utilisateurs : aucun contrôle optimiste de révision n'est ajouté au contrat API actuel.
- Certification PostgreSQL/E2E du parcours version → édition → validation → snapshot → publication → rendu, avec contrôle de l'immuabilité et de la version du snapshot.
- Validation exhaustive des références permissions, capabilities, contrats de données et workflows réels.
- Tests de sécurité réels cross-tenant et contrôle des props/actions malveillantes.
- Parité complète canvas/aperçu/runtime, au-delà du renderer partagé aperçu/runtime.

Les changements nécessaires au backend ou aux contrats restent hors de cette consolidation, conformément aux instructions du dépôt.

## Vérifications exécutées

- Frontend UI Builder : `npm test -- src/features/ui-builder --maxWorkers=1 --testTimeout=20000` — 77 tests réussis, 2 ignorés (intégrations PostgreSQL conditionnelles).
- Store final : 24 tests réussis, dont isolation des réponses tardives, sauvegarde concurrente, paramètres et changement de page.
- Backend UI Builder : `npm test -- --runInBand ui-builder` — 21 tests réussis, 2 suites.
- Build frontend : `npm run build` réussi ; avertissement de taille de bundle Vite.
- `git diff --check` réussi.

Les tests d'interface attendent désormais jusqu'à 5 secondes le chargement du contexte ; le mock PATCH retourne la page demandée et les données envoyées, au lieu de toujours retourner la deuxième page.
