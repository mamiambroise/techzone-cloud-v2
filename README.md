# Techzone Cloud — démarrage local

Le lanceur à la racine démarre les composants suivants :

| Composant | Dossier | Adresse |
| --- | --- | --- |
| Business Manager (React/Vite) | `team4-platform-api/frontend` | http://localhost:3007 |
| Console ERP (React) | `new erp-adapter-platform/frontend` | http://localhost:3100 |
| Auth/IAM (Express/Prisma) | `Auth_AIM/backend` | http://localhost:5001/health |
| API ERP (NestJS/Prisma) | `new erp-adapter-platform/backend` | http://localhost:3002/api/docs |
| API plateforme Jasmina (NestJS/Prisma) | `backend` | http://localhost:3003 |
| Dolibarr (PHP/MySQL) | `techzone/htdocs` | http://127.0.0.1:8080 |

Prérequis : Node.js avec npm, PHP dans le PATH, PostgreSQL et MySQL/MariaDB.
Le lanceur ne démarre pas les serveurs de bases de données.

Depuis la racine du projet :

```powershell
npm.cmd run dev
npm.cmd run status
npm.cmd run stop
```

Sur macOS/Linux, utiliser `npm` à la place de `npm.cmd`.
`npm.cmd run dev:rebuild` recompile les deux API NestJS avant leur lancement
(les services déjà en écoute sont ignorés ; les arrêter avant de recompiler).

Lors d'une installation ou d'un changement de système d'exploitation, exécuter
`npm.cmd install --include=optional` dans chacun des cinq dossiers JavaScript
du tableau. Ne pas réutiliser les `node_modules` d'un autre système.
Dans `Auth_AIM/backend` et `new erp-adapter-platform/backend`, régénérer aussi
le client avec `npx.cmd prisma generate`.

Configurer `DATABASE_URL` dans les fichiers `.env` des trois API avec les
identifiants PostgreSQL. La configuration actuelle utilise la base distante
`techzonecloud`, avec `?schema=auth_aim` pour Auth/IAM, `?schema=erp_adapter`
pour l'API ERP et `?schema=business_manager` pour Jasmina. Leurs tables sont
séparées : conserver ces paramètres de schéma. Les identifiants restent dans
les fichiers `.env` ignorés par Git.
La connexion MySQL de Dolibarr est définie dans `techzone/htdocs/conf/conf.php`
et référence actuellement `techzone_erp`.

Diagnostic du 16 septembre 2026 : connexion PostgreSQL distante validée au
démarrage des trois API, puis délais d'attente réseau pendant les tests métier
(connexion TCP également en timeout). Le tableau de bord renvoie alors HTTP 500.
Les tables `Feature` et `WebhookEvent` manquent dans le schéma `auth_aim` ;
les migrations correspondantes n'ont pas été appliquées pendant le démarrage.
MySQL n'écoute pas sur le port 3306 : Dolibarr reste à configurer séparément.

Les autres dossiers `frontend`, `Auth_AIM/frontend` et `team4-platform-api/backend`
ne font pas partie du lanceur racine actuel. Les proxies de Business Manager
dirigent les requêtes vers les API sur les ports 5001, 3002 et 3003.
