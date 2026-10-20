# DESIGN SYSTEM - TECHZONE CLOUD

## Objectif
Appliquer un thème SaaS moderne et cohérent à toutes les pages existantes et futures.

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

- Barre de contexte commune : tenant, application, version, page, device et statut ; position sticky sur tablette/desktop, flux normal sur mobile pour préserver la place du canvas.
- État de sauvegarde annoncé avec `role="status"` dans le contexte commun.
- Inspecteur : Propriétés, Données, Actions, Visibilité, Responsive, Avancé ; définition avancée en lecture seule, sans saisie de code arbitraire.
- Les liens de validation ciblent la page et `?component=<id>` ; seuls les composants présents dans l’arbre chargé sont sélectionnés.
- Aperçu : badge PREVIEW et expansion plein écran, avec bouton explicite de retour.
- La complétion est le ratio d’étapes READY parmi les étapes serveur ; sans étapes, afficher « — ».
- Validation immédiate des routes : message textuel et `aria-invalid`, sans remplacer la validation serveur.
- Conflit de sauvegarde : conserver l’arbre local, annoncer le conflit, afficher les révisions et une comparaison ; rechargement serveur après confirmation explicite. Bloquer autosave et sauvegarde manuelle tant que le conflit n’est pas résolu.
