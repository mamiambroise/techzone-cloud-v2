# Rapport de rationalisation BM / PM / PR

## Avant / après

| Indicateur | Avant | Après |
|---|---:|---:|
| lignes `AppContext.jsx` | 4 771 | 1 065 |
| lignes `LoginPage.jsx` | 1 743 | 152 |
| collections métier initialisées localement | plusieurs seeds BM/PM/IAM | 0 |
| fichiers frontend de seed/moteur métier local actifs | au moins 6 | 0 |
| pages BM/PM/PR inventoriées | non consolidé | 27 |
| pages annoncées `FUNCTIONAL` | non justifié | 8 vérifiées |
| routes BM/PM/PR cassées | non mesuré | 0 |
| actions manquantes avec comportement explicite | hétérogène | 29 centralisées |
| tests backend unitaires | 24 avant PR-CDC-07 | 28/28 |
| tests E2E API | suite historique obsolète | 13/13 |
| chaîne critique | non automatisée | 6/6 |
| tests navigateur multi-largeur | absents | 6/6 scénarios |

## Suppressions et simplifications

- suppression de `mockData.js`, `mockPackData.js`, des moteurs locaux validation/snapshot/manifest et de la télémétrie IAM simulée ;
- réduction de la sidebar à une seule arborescence canonique ;
- suppression du rôle switchable, notifications et timer de session factices ;
- jeton JWT conservé uniquement en mémoire ;
- remplacement du banc E2E simulé par un écran de santé lisant les endpoints PR réels ;
- rapprochement des écrans PM validation/publication/manifest dans le workspace de version PM ;
- standardisation des en-têtes, états vides/erreur/API manquante, badges, cycle de vie, JSON et confirmations.

## Preuves de validation

Commandes finales exécutées le 2026-09-03 :

- frontend : `npm run lint` et `npm run build` — succès ;
- backend : `npm test -- --runInBand` — **28/28** ; `npm run build` — succès ;
- E2E API : `DB_SYNCHRONIZE=true npm run test:e2e -- --runInBand` — **13/13** ;
- chaîne : `npm run test:chain` — **6/6** ;
- navigateur : `npm run test:e2e:ui` — **6/6**, Chromium, 1440×900, 1280×800 et 1024×768.

Le seul avertissement de build frontend concerne un chunk JavaScript supérieur à 500 kB. Il ne bloque pas le fonctionnement mais justifie un futur découpage par route.
