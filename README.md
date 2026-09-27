# Techzone Cloud — consolidation de l’existant

La console canonique est `frontend/`. Les responsabilités serveur restent séparées :

 | Composant | Dossier | Port | Vérification |
 |---|---|---:|---|
 | Console React/Vite | `frontend` | 3000 | `/login` |
 | IAM, Auth, contexte, billing, administration | `backend` (module IAM) | 3003 | `/api/iam/health` |
 | ERP, Data Runtime, Automation | `backend` | 3003 | `/api/config/public` |
 | Platform, intégration, publication/déploiement | `backend` | 3003 | `/health` |
 | Dolibarr externe | `techzone/htdocs` | 8080 | nécessite MySQL |

```powershell
npm.cmd run dev
npm.cmd run status
npm.cmd run stop
```

`npm.cmd run dev:rebuild` compile les API avant démarrage. Arrêter les services avant de recompiler : les ports déjà occupés sont ignorés. `scripts/dev.mjs` délègue au même lanceur. Le frontend utilise le port strict 3000.

Chaque serveur charge son propre `.env`, depuis son dossier de travail. Conserver les paramètres de schéma PostgreSQL : `auth_aim`, `erp_adapter`, `business_manager`. Aucun `.env` modifié pendant la consolidation. La base distante présente des interruptions de connexion ; un health HTTP de processus ne prouve pas sa disponibilité continue.

La console utilise les cookies HttpOnly IAM, jamais un JWT dans le stockage navigateur. L’API plateforme consomme les contrats IAM `/sessions/validate` et `/context/resolve` ; `IAM_API_URL` configure leur adresse serveur. L’API ERP valide également le contexte auprès d’IAM. Les appels navigateur passent par les proxies Vite.

Les anciennes interfaces `Auth_AIM/frontend`, `new erp-adapter-platform/frontend` et `team4-platform-api/frontend`, ainsi que `team4-platform-api/backend`, ont ete supprimees apres migration. Leurs fonctions uniques ont ete integrees dans `backend/` et `frontend/`. Leur schema PostgreSQL `auth_aim` reste supporte pour la retention des donnees historiques IAM.

Voir le [rapport de consolidation](docs/TECHZONE_CLOUD_CONSOLIDATION_REPORT.md), le [diagnostic PostgreSQL](docs/consolidation/DATABASE_DIAGNOSIS.md) et les preuves dans `docs/consolidation/`.

## État final (sanitisation terminée)

- Dossiers outils (`.kilo/`, `.claude-dev-helper/`) supprimés après vérification qu'aucun contenu utile n'avait été récupéré.
- Aucune application Express autonome : le backend est NestJS exclusivement. Express n'est présent qu'en tant que dépendance interne de `@nestjs/platform-express`.
- Un seul frontend (`frontend/`) et un seul backend NestJS (`backend/`).
- Un seul Sidebar (`frontend/src/components/Sidebar.jsx`) et une seule `navigationConfig` (`frontend/src/app/navigationConfig.js`).
- Variables d'environnement non versionnées ; `backend/.env.example` fourni comme modèle.
- Logs runtime non versionnés.
