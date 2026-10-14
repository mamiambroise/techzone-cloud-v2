# UI migration progress — Techzone Cloud

Date de mise à jour : 14 octobre 2026
Branche : `mami`

## État de cette passe

- [x] Audit du shell, des tokens et des composants transverses.
- [x] Palette officielle, typographie, surfaces, focus visibles, mouvement réduit et scrollbar compacte dans `frontend/src/index.css`.
- [x] Sidebar sombre de 260 px, header blanc de 64 px, recherche globale, sous-navigation et notifications harmonisés.
- [x] Primitives `Card`, `PageHeader`, `ConfirmModal`, `ContextBar` et Business Manager consolidées.
- [x] Connexion, accueil, catalogue d’applications, Business Manager et UI Builder : corrections de réactivité et d’accessibilité ciblées.
- [x] Automation : correction de l’icône manquante ; UI Builder : sélection initiale et contrats de champs stabilisés.
- [x] Observabilité : tableau Alert Manager, filtres, panneau de détail, erreurs et navigation clavier renforcés.
- [~] Pack Manager : alignement ciblé des composants déjà modifiés ; les autres modules restent compatibles avec le socle commun sans changement de contrat.

## Périmètre volontairement préservé

- Aucune route, permission, API, schéma Prisma, contrat backend ou donnée métier n’a été modifié.
- Les pages ERP, intégrations, billing, déploiement et les vues prévues continuent d’utiliser leurs flux existants ; leur dette visuelle est tracée dans l’audit global plutôt que masquée par des maquettes.
- Les documents de migration V2/V3 présents hors de ce périmètre ne font pas partie de cette passe UI.

## Vérifications réelles

| Commande | Résultat |
| --- | --- |
| `npm.cmd test -- --reporter=dot --silent` | 29 fichiers réussis, 3 ignorés ; 273 tests réussis, 8 ignorés |
| `npm.cmd run lint` | réussi (`tsc --noEmit`) |
| `npm.cmd run build` | réussi (`vite build`) ; seul avertissement : chunk principal supérieur à 500 kB |

## Références

- [Design system](DESIGN_SYSTEM.md)
- [Audit global UI/UX](ui-audit/AUDIT_GLOBAL_UI_UX.md)
