# DESIGN SYSTEM - TECHZONE CLOUD

## Objectif
Appliquer un thème SaaS moderne et cohérent à toutes les pages existantes et futures.

## Palette officielle (tokens)

| Token | Valeur | Usage |
|---|---|---|
| `--color-bg` | `#EFF6FF` | Fond principal |
| `--color-surface` | `#FFFFFF` | Cartes, surfaces |
| `--color-primary` | `#0866F5` | Actions et états actifs |
| `--color-primary-hover` | `#0554D8` | Survol primaire |
| `--color-primary-soft` | `#EDF4FF` | Accent primaire doux |
| `--color-bg` | `#EFF6FF` | Fond principal |
| `--color-surface` | `#FFFFFF` | Cartes, surfaces |
| `--color-surface-2` | `#F8FAFF` | Surfaces secondaires |
| `--color-border` | `#E1EAF5` | Bordures |
| `--color-text-primary` | `#101C48` | Texte principal |
| `--color-text-secondary` | `#64748B` | Texte secondaire |
| `--color-text-muted` | `#94A3B8` | Texte atténué |
| `--color-success` | `#08A66A` | Succès |
| `--color-warning` | `#FF9800` | Avertissement |
| `--color-danger` | `#F22640` | Erreur et danger |
| `--color-info` | `#0866F5` | Information |
| `--color-sidebar` | `#0D1B2A` | Fond sidebar |
| `--color-header` | `#0D1B2A` | Header |
| `--color-sidebar-text` | `#CBD5E1` | Texte de navigation |
| `--color-sidebar-active` | `#0866F5` | Navigation active |
| `--module-packs` | `#08A66A` | Module Packs |
| `--module-deployments` | `#7C18F5` | Module Deployments |
| `--module-billing` | `#FF9800` | Module Billing |
| `--module-resources` | `#0CB7A7` | Module Resources |

## Layout
- Sidebar largeur : 260px (rétractable via class `sidebar-collapsed` ou état)
- Sidebar et header : fond `#0D1B2A`, texte de navigation `#CBD5E1`, état actif `#0866F5`
- Header hauteur : 64px
- Rayon : 6px (petit), 10px (standard), 14px (grand)
- Ombre carte : `0 2px 12px rgba(16, 28, 72, 0.05)`
- Police UI : Inter, puis polices système de secours

## Primitives disponibles

- `.tz-page` : conteneur responsive des vues, limité à 1600 px.
- `.tz-surface` : carte blanche, bordure, rayon 16 px et ombre douce.
- `.tz-surface-interactive` : surface cliquable avec élévation discrète.
- `.tz-scroll-x` : défilement horizontal compact des outils et tableaux étroits.
- `Card`, `PageHeader`, `ConfirmModal` et les primitives `Bm*` : composants à privilégier avant de recréer une variante locale.

## Interactions, formulaires et tableaux

- Les boutons non-submit d’un formulaire reçoivent `type="button"`.
- Un champ doit garder un `label` associé, un focus visible et un message d’erreur annoncé.
- Les actions icon-only ont un `aria-label` explicite.
- Les tableaux larges sont contenus dans une zone de défilement horizontal et conservent leurs en-têtes et libellés accessibles.
- Les modales utilisent `role="dialog"`, `aria-modal`, un titre associé, Échap et la restitution du focus.

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
