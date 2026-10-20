# Pack Runtime V3 — frontend

Travail sur `Nassa`, en conservant les modifications déjà présentes dans l’index Git. Aucun backend, contrat, schéma ou donnée métier modifié pour cette étape frontend.

## Pages et parcours

| Route | Fonctionnement |
|---|---|
| `/runtime` | Indicateurs, applications actives, contrôles providers, cache, dernières résolutions et lancement |
| `/runtime/applications` | Applications avec contexte actif, version, pack, environnement et readiness |
| `/runtime/resolutions` | Recherche, filtre de statut, pagination locale et inspection d’une résolution |
| `/runtime/activations` | Activations persistées, acteurs, états et désactivation confirmée |
| `/runtime/context` | Contextes persistés, identité et détail sélectionné |
| `/runtime/resolver` | Application, version métier, pack publié et environnement actif ; résolution réelle |
| `/runtime/manifest` | Inspecteur ouvert sur le manifeste effectif sélectionné |
| `/runtime/effective` | Inspecteur ouvert sur la configuration effective sélectionnée |
| `/runtime/cache` | Métriques réelles, entrées sans contenu sensible et invalidation ciblée confirmée |
| `/runtime/diagnostics` | Recherche par code/message/ressource, sévérité, corrélation et détail |
| `/runtime/history` | Événements disponibles de résolution, activation et désactivation |

Le paramètre `?resolution=<id>` conserve la sélection entre les vues. Les liens existants et le layout global sont réutilisés.

Le parcours d’ouverture est : sélection → POST resolve → examen du résultat → POST activate → contexte ACTIVE/READY → ouverture explicite. `PublishedApplication` conserve sa revalidation serveur. Un état BLOCKED/EXPIRED/INACTIVE empêche l’ouverture ; une expiration connue retire le rendu lors du rafraîchissement de l’horloge UI.

L’inspecteur couvre les maquettes M05–M16, M18–M20 et M25–M28 par onglets et panneaux, sans inventer des pages ou des APIs supplémentaires. M01–M04, M17, M21–M24 et M29 correspondent aux vues de supervision/lancement/cache/diagnostics/historique. M30 est traité par les règles responsive du même module.

## Réutilisation et sécurité

- Primitives `Bm*`, confirmation partagée et `PublishedApplication` conservés.
- Styles uniquement dans `frontend/src/index.css`, limités à `.runtime-workspace`.
- Palette officielle, police Inter, accents vert/turquoise, focus visible et réduction des animations.
- Chargement indépendant de chaque API ; un refus de cache/provider ne bloque pas les résolutions autorisées.
- Appels administratifs conditionnés aux permissions ; le backend reste l’autorité.
- Annulation des lectures et mutations lors d’un changement de tenant ou d’un démontage ; verrou local contre les doubles clics.
- Données JSON privées masquées défensivement dans l’inspecteur ; aucun manifeste fourni par le navigateur utilisé comme autorisation.

## Périmètre et limites

Les listes sont limitées aux 100 dernières résolutions renvoyées par le backend ; pagination et recherche sont locales à ce jeu. Les compteurs dérivés des contextes annoncent ce périmètre. Le total des blocages est celui du dashboard serveur.

La readiness affichée est celle du contexte persisté, accompagnée des preuves disponibles. Aucune disponibilité Registry/Automation/Integration absente de la réponse n’est inventée. Les capacités sans état de provider affichent « Non fourni ».

L’historique est construit depuis les événements persistés exposés ; il n’est pas présenté comme l’audit global. Le journal affiche les étapes de résolution, pas des logs d’infrastructure en streaming. Les traces détaillées sont visibles lorsque le backend les a enregistrées.

Les validations de composants et les aperçus visuels utilisent des fixtures explicites. La recette métier complète avec publication et données PostgreSQL réelles reste distincte et n’est pas déclarée PASS par ces tests frontend.

## Validation réalisée

- Build Vite final : PASS (2352 modules, code de sortie 0).
- Suite Runtime et architecture de navigation : 97 tests verts avant ajout du cas de route avec slash final ; dernière passe des 9 tests de parcours Runtime : PASS, avec ce cas supplémentaire.
- Scénarios vérifiés : attente du tenant, erreur de cache isolée, permissions de lecture, réponse tardive d’un ancien tenant ignorée, résolution depuis les catalogues réels du contrat, BLOCKED sans rendu/activation, ouverture explicite ACTIVE/READY et invalidation confirmée avec focus contenu.
- Contrôle visuel Chromium sur fixtures : 1440 px desktop et 390 px mobile ; aucun débordement horizontal de page détecté dans les deux aperçus. Les tableaux restent défilants dans leur propre région.
- `git diff --check` : PASS. Branche `Nassa`. Aucun commit ni changement du backend effectué pour cette étape.

Aperçus du module isolé, avec données fictives signalées dans les captures : [desktop](runtime-frontend-desktop.png) et [mobile](runtime-frontend-mobile.png). Le layout global de Techzone Cloud est conservé dans l’application réelle.
