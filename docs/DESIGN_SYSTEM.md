# DESIGN SYSTEM - TECHZONE CLOUD

## Objectif
Appliquer un thème SaaS moderne et cohérent à toutes les pages existantes et futures.

## Techzone Classic — Accent Tabs B

Le shell applicatif adopte le thème **Techzone Classic — Accent Tabs B** : sidebar
marine (`#0B1730`), header clair, workspace `#F5F8FC`, action primaire
`#1769FF` et accents de navigation sobres. Les tokens source sont définis dans
`frontend/src/index.css`; les composants ne doivent pas recopier ces valeurs.

- La sidebar ne contient qu’un lien par module principal. Les destinations
  internes vivent dans les onglets horizontaux ou dans un contrôle contextuel
  existant lorsqu’il dépend d’identifiants métier.
- `components/ui/ModuleTabs.jsx` est le composant à utiliser pour une
  navigation de module à routes réelles. Il reçoit des destinations issues du
  registre, conserve `aria-current` et ne s’appuie pas sur la couleur seule.
- Les routes avec paramètres (application, version, page…) ne doivent pas être
  placées dans un onglet générique : conserver leur navigation contextuelle afin
  de ne jamais perdre les identifiants ni les permissions.
- Sur écran étroit, les onglets restent sur une ligne et défilent
  horizontalement; leur hauteur tactile minimale est de 44 px.

## Palette officielle (tokens)

| Token | Valeur | Usage |
|---|---|---|
| `--color-bg` | `#F3F4F6` | Fond principal |
| `--color-surface` | `#FFFFFF` | Cartes, surfaces |
| `--color-primary` | `#2563EB` | Actions et états actifs |
| `--color-primary-hover` | `#1D4ED8` | Survol primaire |
| `--color-primary-soft` | `#EFF6FF` | Accent primaire doux |
| `--color-secondary` | `#6F46E5` | Accent secondaire |
| `--color-accent` | `#06B6D4` | Accent complémentaire |
| `--color-surface-2` | `#F9FAFB` | Surfaces secondaires |
| `--color-border` | `#D1D5DB` | Bordures |
| `--color-text-primary` | `#111827` | Texte principal |
| `--color-text-secondary` | `#4B5563` | Texte secondaire |
| `--color-text-muted` | `#6B7280` | Texte atténué |
| `--color-success` | `#22C55E` | Succès |
| `--color-warning` | `#F59E0B` | Avertissement |
| `--color-error` | `#EF4444` | Erreur et danger |
| `--color-info` | `#3882F6` | Information |
| `--color-sidebar` | `#0F172A` | Fond sidebar |
| `--color-sidebar-hover` | `#1E293B` | Survol sidebar |
| `--color-header` | `#0F172A` | Header |
| `--color-sidebar-text` | `#CBD5E1` | Texte de navigation |
| `--color-sidebar-active` | `#2563EB` | Navigation active |
| `--module-packs` | `var(--color-success)` | Module Packs |
| `--module-deployments` | `var(--color-secondary)` | Module Deployments |
| `--module-billing` | `var(--color-warning)` | Module Billing |
| `--module-resources` | `var(--color-accent)` | Module Resources |

## Layout
- Sidebar largeur : 260px (rétractable via class `sidebar-collapsed` ou état)
- Sidebar et header : fond `#0F172A`, texte de navigation `#CBD5E1`, état actif `#2563EB`
- Header hauteur : 64px
- Rayon : 6px (petit), 10px (standard), 14px (grand)
- Ombre carte : `0 1px 3px rgba(15, 23, 42, .08)` avec élévation discrète au survol
- Police UI : Inter, puis polices système de secours

## Primitives disponibles

- `.tz-page` : conteneur responsive des vues, limité à 1600 px.
- `.tz-surface` : carte blanche, bordure, rayon 16 px et ombre douce.
- `.tz-surface-interactive` : surface cliquable avec élévation discrète.
- `.tz-scroll-x` : défilement horizontal compact des outils et tableaux étroits.
- `Card`, `PageHeader`, `ConfirmModal` et les primitives `Bm*` : composants à privilégier avant de recréer une variante locale. `PageHeader` accepte `actions` pour grouper plusieurs contrôles de page, tout en conservant `action` pour l’action simple historique.

## Interactions, formulaires et tableaux

- Les boutons non-submit d’un formulaire reçoivent `type="button"`.
- Un champ doit garder un `label` associé, un focus visible et un message d’erreur annoncé.
- Les actions icon-only ont un `aria-label` explicite.
- Les tableaux larges sont contenus dans une zone de défilement horizontal et conservent leurs en-têtes et libellés accessibles.
- Les modales utilisent `role="dialog"`, `aria-modal`, un titre associé, Échap et la restitution du focus.

## Automation V3

- Automation réutilise le layout global et ses onglets existants ; le contexte App/Version et les bannières sont rendus dans le layout du module, sans seconde sidebar ni second header global.
- Les bannières MOCK, SIMULATION et RUNTIME_BLOCKED ne sont affichées qu’à partir de l’état Redux réel, d’une réponse API ou de l’historique serveur. Une action qui démarre un workflow est libellée comme une exécution réelle, pas comme un test sandbox.
- Le badge rouge Diagnostics reflète uniquement le nombre d’exécutions BLOCKED reçues du serveur.
- Les opérations d’écriture et d’exécution sont enveloppées dans `PermissionGate` avec les permissions Automation effectivement déclarées côté backend ; les contrôles backend restent l’autorité.

## Console Registry

- Les vues Registry réutilisent les jetons de surface et les badges d’état de ce système; AVAILABLE est vert, DEPRECATED/DEGRADED ambre, et UNAVAILABLE/DISABLED/INCOMPATIBLE rouge.
- Les listes restent lisibles sur mobile via un défilement horizontal contenant le tableau.
- Un état ou une disponibilité ne s’affiche que s’il provient du registre persistant; une absence de données est présentée comme un état vide, jamais comme une donnée de démonstration.
- Les formulaires d’enregistrement ne demandent pas l’owner ni le provider: l’autorité backend du namespace en est la source.

## Règles
- Réutiliser les composants existants (`components/`, `components/ui/`, `components/common/`)
- Respecter palette, espacement 4/8/12/16/24/32px
- Utiliser les tokens CSS de la palette officielle pour les nouveaux éléments.
- WCAG AA, focus visible
- Mobile first, responsive
- Respecter `prefers-reduced-motion`
- Ne pas supprimer fonctionnalités
- Ne pas modifier backend/API

## UI Builder — contexte et inspection

- Le UI Builder conserve la palette primaire Techzone Cloud pour les actions globales ; son accent de module indigo est réservé à sa navigation, sa sélection de canvas et ses états d’édition.
- Le thème du module est défini dans `frontend/src/index.css` sous `.uib-workspace` (`--uib-accent`, `--uib-accent-soft`, `--uib-canvas`, etc.) afin de ne pas modifier les couleurs des autres modules.
- Les vues utilisent `.uib-content` pour les surfaces et contrôles harmonisés ; l’éditeur utilise `.uib-editor-toolbar`, `.uib-editor-panel`, `.uib-canvas` et `.uib-canvas-frame` pour sa disposition à trois colonnes et son adaptation mobile.
- Barre de contexte commune : tenant, application, version, page, device et statut ; position sticky sur tablette/desktop, flux normal sur mobile pour préserver la place du canvas.
- État de sauvegarde annoncé avec `role="status"` dans le contexte commun.
- Inspecteur : Propriétés, Données, Actions, Visibilité, Responsive, Avancé ; définition avancée en lecture seule, sans saisie de code arbitraire.
- Les liens de validation ciblent la page et `?component=<id>` ; seuls les composants présents dans l’arbre chargé sont sélectionnés.
- Aperçu : badge PREVIEW et expansion plein écran, avec bouton explicite de retour.
- La complétion est le ratio d’étapes READY parmi les étapes serveur ; sans étapes, afficher « — ».
- Validation immédiate des routes : message textuel et `aria-invalid`, sans remplacer la validation serveur.
- Conflit de sauvegarde : conserver l’arbre local, annoncer le conflit, afficher les révisions et une comparaison ; rechargement serveur après confirmation explicite. Bloquer autosave et sauvegarde manuelle tant que le conflit n’est pas résolu.
- Le panneau Thème édite des tokens gouvernés (palette, police, tailles, rayons, ombres, largeur et breakpoints) avec presets et prévisualisation Desktop/Tablette/Mobile ; aucun CSS libre n’est accepté.
- Le Shared Renderer applique les tokens de thème de la même UI Definition dans l’éditeur, l’aperçu et l’application publiée. Les valeurs du manifeste sont bornées/filtrées avant d’être converties en variables CSS locales au renderer.
