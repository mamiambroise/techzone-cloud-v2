# DESIGN SYSTEM - TECHZONE CLOUD

## Objectif
Appliquer un thème SaaS moderne et cohérent à toutes les pages existantes et futures.

## Palette officielle (tokens)

| Token | Valeur | Usage |
|---|---|---|
| `--color-bg` | `#F5F8FD` | Fond principal |
| `--color-surface` | `#FFFFFF` | Cartes, surfaces |
| `--color-surface-2` | `#F8FAFC` | Surfaces secondaires |
| `--color-border` | `#E2E8F0` | Bordures |
| `--color-text` | `#0F172A` | Texte principal |
| `--color-text-muted` | `#64748B` | Texte secondaire |
| `--color-primary` | `#2563EB` | Bouton/hover principal |
| `--color-primary-hover` | `#1D4ED8` | Hover primaire |
| `--color-indigo` | `#4F46E5` | Accent indigo |
| `--color-violet` | `#7C3AED` | Accent violet |
| `--color-success` | `#10B981` | Succès |
| `--color-warning` | `#F59E0B` | Avertissement |
| `--color-error` | `#EF4444` | Erreur |
| `--color-info` | `#06B6D4` | Info |
| `--color-sidebar` | `#0B1730` | Fond sidebar |
| `--color-sidebar-2` | `#142747` | Sidebar secondaire |
| `--color-header` | `#FFFFFF` | Header |

## Layout
- Sidebar largeur : 260px (rétractable via class `sidebar-collapsed` ou état)
- Header hauteur : 64px
- Rayon : 8-12px (boutons), 16px (cartes)
- Ombrage : `0 1px 2px 0 rgb(0 0 0 / 0.05)`, `0 4px 6px -1px rgb(0 0 0 / 0.1)`

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
- WCAG AA, focus visible
- Mobile first, responsive
- Respecter `prefers-reduced-motion`
- Ne pas supprimer fonctionnalités
- Ne pas modifier backend/API
