# Audit global UI/UX — Techzone Cloud

Date : 14 octobre 2026
Branche auditée : `mami`
Périmètre : frontend React/Vite, styles, layouts, composants partagés, documentation UI et tests frontend.

## Résumé exécutif

L’application possède une base React réelle et un routage centralisé, mais son expérience visuelle reste hétérogène : les nouveaux tokens sont présents, tandis qu’une grande partie des écrans emploie encore des couleurs, rayons et espacements Tailwind codés localement. La migration doit donc s’appuyer sur les primitives et le layout communs plutôt que créer un deuxième système.

Le worktree était déjà modifié avant cet audit. Ces changements sont préservés ; aucune suppression, réinitialisation, fusion ou modification backend n’est autorisée dans ce chantier.

## Inventaire

| Élément | Constat |
| --- | --- |
| Routage | Environ 123 déclarations de routes dans `navigationConfig.js`, rendues par `App.jsx`. |
| Écrans/composants de page | 66 composants `Page`, `View` ou `Route` recensés dans `pages`, `components` et `features/billing`. |
| Modules | Accueil, Applications, Business Manager, UI Builder, Automation, Packs, Runtime, Données, ERP, API/Intégrations, Environnements, Déploiements, IAM, Observabilité, Billing et Administration. |
| Design system | Tokens globaux, layout, Card, PageHeader, ConfirmModal et primitives BM déjà amorcés. |
| Tests de base | 267 réussis, 8 ignorés, 0 échec le 14 octobre 2026. |

## État des fondations

### Déjà conforme ou réutilisable

- `TechzoneLayout` apporte une structure accessible : lien d’évitement, header, sidebar, sous-navigation, zone principale et footer.
- `index.css` contient la palette officielle, les rayons, espacements et des états de mouvement réduit.
- Les primitives `Card`, `PageHeader`, `ConfirmModal` et `components/business-manager/bm/ui.jsx` sont les bons points d’extension.
- La navigation est déclarative et les modules gardent leurs routes métier.

### Écarts constatés

- L’adoption des tokens est incomplète : de nombreux écrans conservent des couleurs/espacements codés localement.
- Il n’existe pas de `components/ui/DataTable` canonique malgré une mention dans la progression ; les tableaux restent distribués par module.
- Sidebar et Header n’exploitent pas encore pleinement les tokens officiels de sidebar sombre.
- La documentation de progression est optimiste et incomplète : elle cite des résultats, mais des étapes restent ouvertes et des modules ne sont pas listés.

## Problèmes et priorités

| Priorité | Problème | Impact | Action |
| --- | --- | --- | --- |
| P1 | Texte corrompu/BOM dans `index.css` et `LoginPage.jsx` | Libellés français illisibles et risque de parsing CSS | Corriger l’encodage UTF-8 sans BOM et les chaînes concernées. |
| P1 | UI Builder : contrat `BmSelect`/`BmSearchInput` incompatible avec certains consommateurs | Sélecteurs et recherche peuvent planter | Uniformiser les callbacks et couvrir par test. |
| P1 | UI Builder : `/ui/builder/editor` ne sélectionne pas de page | Canvas vide à l’entrée principale | Sélectionner une page valide ou rediriger. |
| P1 | Automation : icône `Bell` utilisée sans import | La page Workflows peut échouer au rendu | Ajouter l’import et un test de rendu. |
| P2 | Composants partagés incomplets et styles distribués | Incohérence entre modules et coût de maintenance | Compléter les primitives sans changer les contrats. |
| P2 | Sidebar/Header non totalement alignés aux tokens officiels | Thème global incomplet | Appliquer palette, focus, responsive et contraste. |
| P3 | Documentation et suivi incomplets | Reprise de chantier difficile | Mettre à jour Design System et progression après chaque module. |

## Risques et garde-fous

- Ne pas modifier les routes, API, permissions, backend ou schémas de données.
- Préserver tous les changements Git existants, notamment les documents et composants déjà modifiés.
- Ne pas remplacer les données réelles par des fixtures visuelles.
- Toute modernisation doit préserver props, exports, interactions, états de chargement, erreurs et comportements clavier.

## Plan de réalisation

1. Corriger les bloqueurs UI/UX et l’encodage.
2. Stabiliser tokens, layout et primitives communes.
3. Harmoniser les modules par familles de routes, sans modifier les contrats.
4. Mettre à jour les documents de design et de progression.
5. Exécuter les tests frontend, le typecheck et le build Vite, puis consigner les résultats réels.

## État après intervention

| Sujet | Résultat |
| --- | --- |
| Encodage et socle CSS | `index.css` et la page de connexion sont stabilisés en UTF-8 ; tokens, contrastes, focus et mouvement réduit sont centralisés. |
| Shell de navigation | Sidebar `#0B1730` (260 px), header blanc 64 px, recherche, sous-navigation et notifications appliquent les tokens officiels. |
| Composants partagés | `Card`, `PageHeader`, `ConfirmModal`, `ContextBar`, toasts et bannière d’erreur ont été rendus plus cohérents et accessibles. |
| UI Builder et Automation | Les callbacks de sélecteurs/recherche sont alignés, l’éditeur sans `:pageId` choisit une page valide et l’icône Automation manquante est importée. |
| Écrans prioritaires | Connexion, accueil, catalogue, Business Manager, UI Builder, Automation, Pack Manager ciblé et Alert Manager ont reçu des corrections UI/a11y sans contrat métier modifié. |
| Vérification | 273 tests frontend réussis, 8 ignorés ; `tsc --noEmit` et le build Vite sont réussis. |

### Dette restante, sans faux statut

- Les modules ERP, intégrations, billing et déploiement restent visuellement hétérogènes dans leurs écrans historiques ; leurs flux et contrats ont volontairement été préservés.
- Le build signale un chunk principal supérieur à 500 kB. Une stratégie de découpage nécessite une passe dédiée, car elle touche les frontières de chargement des routes.
