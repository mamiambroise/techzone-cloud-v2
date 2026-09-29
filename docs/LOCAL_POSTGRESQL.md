# PostgreSQL local

Instance PostgreSQL 18 dédiée au projet : `127.0.0.1:55432`.
Base : `techzonecloud_local`. Schéma : `business_manager`.

Structure créée depuis `backend/prisma/schema.prisma` avec Prisma `db push` :
76 tables. Il ne s'agit pas d'une copie vérifiée du catalogue distant ni d'une
restauration de ses données. Le compte de test `techzonetest` a été créé via
le service IAM du projet, sans droits administrateur.

La connexion locale est définie dans `backend/.env` et `backend/.env.local`,
ignorés par Git. L'ancienne configuration distante de `backend/.env` est
sauvegardée hors dépôt dans `%LOCALAPPDATA%\TechzoneLocalPostgres\backend.env.backup-*`.
L'ancien fichier
`.env.local` est sauvegardé hors dépôt dans
`%LOCALAPPDATA%\TechzoneLocalPostgres\backend.env.local.backup`.
Les données PostgreSQL et les identifiants de cette instance sont également
dans ce dossier utilisateur. Aucun mot de passe n'est enregistré dans ce document.

Sous Windows, double-cliquer sur `Lancer-Techzone.cmd` à la racine du projet.
Le lanceur démarre PostgreSQL, le frontend et le backend en arrière-plan,
puis ouvre `http://localhost:3000`. Il réutilise les services déjà démarrés.
Les journaux de lancement sont dans `logs/windows-*.log`.

Pour démarrer sans ouvrir le navigateur : `Lancer-Techzone.cmd -NoBrowser`.

Alternative depuis la racine du projet :

```powershell
powershell -ExecutionPolicy Bypass -File scripts/local-postgres.ps1 start
npm run dev
```

Pour vérifier ou arrêter cette instance, utiliser le même script avec
`status` ou `stop`. Elle n'est pas installée comme service Windows.
`npm run stop` arrête les services applicatifs, pas PostgreSQL.

Vérifications réalisées : login HTTP 200, `/api/iam/me` HTTP 200,
renouvellement de session HTTP 200, résolution du contexte HTTP 201 / RESOLVED.
Les autres fonctionnalités et données métier ne sont pas validées par ces contrôles.
