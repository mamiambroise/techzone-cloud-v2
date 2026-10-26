# Migration UI/UX — Techzone Classic Accent Tabs B

## État de cette livraison

| Élément | Résultat |
|---|---|
| Phase | Fondations, shell global et navigation |
| Statut | Terminé pour le shell; migration des vues métier progressive |
| Modules concernés | Tous les modules enregistrés dans `navigationMenu.js` |
| Fichiers principaux | `index.css`, `Header.jsx`, `Sidebar.jsx`, `SubNavBar.jsx`, `ModuleTabs.jsx` |
| Sécurité | Les permissions existantes et `RequireNavigationAccess` restent l’autorité |
| Captures avant/après | Non disponibles — aucun outil Playwright/capture n’est configuré |

## Convention appliquée

Le thème est centralisé dans `frontend/src/index.css`. La sidebar présente une
seule destination par module et garde son filtrage IAM. Les écrans internes
utilisent `ModuleTabs` quand les routes sont directement accessibles. Les
éditeurs qui exigent un contexte application/version/page conservent leurs
contrôles contextuels pour préserver les deep links.

## Matrice de migration

| Module | Layout global | Onglets | Permissions | Statut |
|---|---|---|---|---|
| Tableau de bord | Oui | N/A | Préservées | Shell migré |
| Business Manager | Oui | Contextuels existants | Préservées | Shell migré |
| UI Builder | Oui | ModuleTabs + contexte éditeur | Préservées | Pilote migré |
| Abonnements & Facturation | Oui | Tenant ou plateforme selon la route | Préservées | Pilote finalisé |
| Pack Manager / Runtime | Oui | ModuleTabs selon routes réelles | Préservées | Shell migré |
| Automation, Données, ERP, API | Oui | ModuleTabs selon routes réelles | Préservées | ERP finalisé; autres shell migré |
| IAM, Observabilité, Registry, Administration | Oui | ModuleTabs selon routes réelles | Préservées | Shell migré |

## Vérifications exécutées

| Vérification | Résultat |
|---|---|
| `frontend/npm run build` | PASS |
| Navigation, registre et sidebar (90 tests Vitest) | PASS |
| Régression visuelle automatisée | NOT RUN — Playwright absent |
| Parcours E2E connecté au backend | NOT RUN — hors environnement de cette livraison |

## Travaux suivants

1. Migrer les styles locaux restants des vues métier vers les primitives et tokens.
2. Ajouter les captures déterministes lorsque Playwright sera disponible.
3. Étendre les contrôles de conformité aux nouvelles couleurs codées en dur,
   sans bloquer les exceptions documentées (canvas et graphiques).
