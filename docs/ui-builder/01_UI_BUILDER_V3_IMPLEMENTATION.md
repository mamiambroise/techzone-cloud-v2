# UI Builder V3 — implémentation et couverture réelle

## Navigation et contexte

La navigation visible du module est volontairement réduite à **Pages** et
**Éditeur visuel**. Les fonctions avancées restent accessibles depuis les
panneaux contextuels ou leurs liens profonds existants afin d'éviter une
duplication sidebar / onglets / studio.

Le contexte `Tenant → Application → Version → Page` est résolu avec les données
Business Manager. Les sélecteurs Application et Version du workspace mettent à
jour les paramètres relatifs `applicationId` et `versionId`, conservent la
persistance tenant-scopée existante et invalident la version lors d'un changement
d'application. Les versions publiées restent soumises aux protections backend et
aux états lecture seule déjà exposés par le studio.

## Matrice de couverture

| Fonctionnalité | État réel | Fichiers principaux | Vérification |
|---|---|---|---|
| Contexte Application / Version | Fonctionnel | `useUiBuilderContext.js`, `UiBuilderLayout.jsx` | tests de hook et éditeur |
| Pages et liens profonds | Fonctionnel | `UiPagesManager.jsx`, `resolveEditorPage.js` | tests de résolution |
| Canvas / sélection / arborescence | Fonctionnel | `UiVisualEditor.jsx`, `Renderer.jsx` | tests éditeur et renderer |
| Ajout, déplacement, duplication, suppression, undo/redo | Fonctionnel | `uiBuilderSlice.js`, `UiVisualEditor.jsx` | tests slice et contrôles |
| Registry central | Fonctionnel pour le catalogue déclaré | `componentRegistry.js` | tests registry |
| Bindings et rendu runtime | Fonctionnel pour les bindings déclarés | `bindingResolver.js`, `runtimeBinding.js`, `Renderer.jsx` | tests de parité et sécurité |
| Aperçu et validation | Fonctionnel | `UiPreviewValidation.jsx`, validation backend | tests éditeur / backend existants |
| Bibliothèque exhaustive de la maquette | Partielle | registry et renderer | les composants sans contrat renderer ne sont pas annoncés comme disponibles |

## Limites explicites

Le catalogue ne prétend pas couvrir les composants pour lesquels le renderer,
les contrats de persistance et le runtime ne possèdent pas encore de définition
commune. Aucun composant décoratif, donnée métier ou capacité Business Manager
fictive n'a été ajouté.
