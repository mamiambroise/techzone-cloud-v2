# Remédiation localStorage BM

Remédiation terminée : toutes les collections et sessions BM/PM ont été retirées de `localStorage` et `sessionStorage`. Le JWT est conservé uniquement en mémoire ; un rechargement complet impose donc une nouvelle session backend.

| Usage | Décision | État |
|---|---|---|
| applications, versions, activités, modèles, features, menus, configurations, intégrations | API seulement | REMOVED_LOCAL |
| packs, versions et composants PM | API seulement | REMOVED_LOCAL |
| session/JWT/identité | JWT backend, mémoire seulement | REMOVED_PERSISTENCE |
| préférence sidebar repliée | localStorage UI | ALLOWED |

Le scan final et les fichiers supprimés sont détaillés dans `local-business-data-audit.md`.
