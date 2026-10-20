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

- Barre de contexte commune : tenant, application, version, page, device et statut ; position sticky sur tablette/desktop, flux normal sur mobile pour préserver la place du canvas.
- État de sauvegarde annoncé avec `role="status"` dans le contexte commun.
- Inspecteur : Propriétés, Données, Actions, Visibilité, Responsive, Avancé ; définition avancée en lecture seule, sans saisie de code arbitraire.
- Les liens de validation ciblent la page et `?component=<id>` ; seuls les composants présents dans l’arbre chargé sont sélectionnés.
- Aperçu : badge PREVIEW et expansion plein écran, avec bouton explicite de retour.
- La complétion est le ratio d’étapes READY parmi les étapes serveur ; sans étapes, afficher « — ».
- Validation immédiate des routes : message textuel et `aria-invalid`, sans remplacer la validation serveur.
- Conflit de sauvegarde : conserver l’arbre local, annoncer le conflit, afficher les révisions et une comparaison ; rechargement serveur après confirmation explicite. Bloquer autosave et sauvegarde manuelle tant que le conflit n’est pas résolu.

## Pack Runtime — exécution contrôlée

- Le rendu publié attend une résolution `EXECUTABLE` et un contexte serveur `ACTIVE` avec readiness `READY` ; afficher un panneau bloquant dans les autres états.
- L’action « Activer l’application » est distincte de la résolution ; la désactivation demande confirmation et retire le rendu actif après rechargement.
- Les listes d’activations utilisent les contextes persistés, jamais une liste de résolutions présentée comme des activations.
- Les cartes de santé et de cache affichent « Non vérifiée » en l’absence de mesure ; aucun statut « Active » ou « OK » par défaut.
- Les appels de cache et de providers sont conditionnés aux permissions ; leur absence ne doit pas empêcher la consultation autorisée du Runtime.
- Toutes les règles spécifiques au module sont regroupées dans `frontend/src/index.css`, sous `.runtime-workspace` et les classes `rt-*` ; aucun reset supplémentaire ni feuille de style globale concurrente.
- Navigation interne horizontale et défilante sur mobile ; les liens conservent la résolution sélectionnée et exposent `aria-current`.
- Indicateurs en bandeau de supervision, détails via tableaux filtrables et paginés localement ; le périmètre maximal de 100 résolutions est annoncé.
- L’inspecteur sépare Synthèse, Manifeste, Capacités, Dépendances, Configuration, Données & services et Journal des étapes. Le chargement de l’inspecteur est différé.
- Une résolution exécutable ne rend pas automatiquement l’application : l’utilisateur active, vérifie le contexte prêt, puis choisit « Ouvrir l’application ».
- Cache : confirmation du périmètre Tenant/Application/Pack/Entrée ; confirmation partagée et focus clavier contenu dans le dialogue.
- Erreurs et traces restent visibles dans le panneau concerné, sans bloquer les données chargées par les autres API. Les réponses tardives sont annulées lors d’un changement de tenant ou de sélection.
