# Audit des données métier locales frontend

## Règle

Le navigateur n’est jamais une base métier. Les seules écritures locales autorisées concernent les préférences UI ; actuellement : `ui.sidebar.collapsed`.

| Zone inspectée | Ancien risque | État final | Source autoritaire |
|---|---|---|---|
| `AppContext.jsx` BM | seeds, mutations et IDs locaux | supprimés | API BM |
| `AppContext.jsx` PM | seeds et moteurs locaux | supprimés | API PM |
| Runtime | manifest/hash calculés dans le navigateur | supprimés | API PR |
| Validation BM | moteur/règles frontend | moteur supprimé ; catalogue affiche API_MISSING | Quality API |
| Auth/IAM | comptes, logs, reset et session locale | supprimés ; JWT en mémoire seulement | Auth API |
| Sidebar | deux arborescences concurrentes | une arborescence canonique | `navigationConfig.js` |
| Préférence sidebar | `localStorage` | conservée | UI_ONLY |

## Fichiers retirés

- `mockData.js`, `mockPackData.js` ;
- `validationEngine.js`, `snapshotService.js`, `packManifestService.js` ;
- `iamStatusService.js` et les cartes de statut IAM simulées devenues orphelines.

## Scan final

- collections métier initialisées localement : **0** ;
- persistance `localStorage`/`sessionStorage` métier : **0** ;
- occurrences `localStorage` : **2**, lecture/écriture de la préférence sidebar ;
- jeton JWT persistant : **0**, mémoire de processus navigateur uniquement ;
- actions métier simulant un succès : **0**.

Les fixtures backend et données créées par les tests restent hors du runtime frontend et sont autorisées comme données de test.
