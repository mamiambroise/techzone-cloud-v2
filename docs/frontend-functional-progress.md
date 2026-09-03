# Progression fonctionnelle frontend

| Domaine | Résultat du lot | Statut |
|---|---|---|
| BM | overview distinct, CRUD principal API, quality campaigns/gate/report, états explicites | 3 FUNCTIONAL / 6 PARTIAL |
| PM | overview distinct, workspace versions, composition, validation/manifest/publication, confirmation | 2 FUNCTIONAL / 8 PARTIAL |
| PR | resolver, effective manifest, providers, cache, résilience, diagnostics et re-resolve | 3 FUNCTIONAL / 5 PARTIAL |
| Auth | session JWT backend sans registre utilisateur navigateur | PARTIAL hors périmètre |
| Navigation | arborescence canonique, routes BM/PM/PR sans 404 | FUNCTIONAL |

Validation frontend : TypeScript et build Vite passent ; Playwright passe 6/6 sur 1440, 1280 et 1024. Le détail par page est dans `bm-pm-pr-page-compliance.md`.
