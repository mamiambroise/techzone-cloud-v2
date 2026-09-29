# Runtime Windows P0.5

Depuis la racine, avec les dépendances frontend/backend installées et Node 22 :

```powershell
npm --prefix backend run build
npm run test-user:provision
npm run windows:start
npm run windows:status
npm run windows:test
npm run windows:restart
npm run windows:stop
```

Ne pas reconstruire `backend/dist` pendant un démarrage/redémarrage. Arrêter le runtime avant une reconstruction. Le démarrage signale un build absent ; il ne lance aucune migration.

`Lancer-Techzone.cmd` et `scripts/start-windows.ps1` délèguent au même runtime. Les anciennes commandes `dev` restent un workflow historique distinct et ne doivent pas tourner simultanément sur les mêmes ports.

Le runtime conserve les identités de ses processus dans `.runtime/*.pid` (PID, date de création, exécutable, commande). Il refuse d'arrêter un PID réutilisé ou de remplacer un processus inconnu. Il laisse PostgreSQL en service et ne démarre ni PHP/Dolibarr ni un IAM séparé. Les sorties privées et les captures de recette sont dans `.runtime/`, ignoré par Git.

## Profils

LOCAL charge `backend/.env`, puis `backend/.env.local`. REMOTE charge uniquement `backend/.env.remote`. Les variables explicitement définies dans le terminal prennent priorité. `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` sont obligatoires. Conserver CORS pour `http://localhost:3000`. Le port backend est fixé à 3003 et celui du frontend à 3000.

```powershell
npm run windows:start:local
npm run windows:start:remote
# Pour changer un runtime déjà démarré :
npm run windows:restart -- -Mode remote
npm run windows:status -- -Mode remote
npm run windows:test -- -Mode remote
```

Créer le fichier privé `.env.remote` à partir des clés du modèle `.env.example`, avec les valeurs distantes appropriées. Aucune valeur distante n'est inventée et aucun basculement automatique n'a lieu après timeout. Le profil distant n'est pas certifié par cette recette locale.

Dans `.env.local` ou les variables du terminal :

```dotenv
TEST_USER_USERNAME=techzonetest
TEST_USER_PASSWORD=
```

Renseigner le mot de passe existant dans la variable privée. Le provisioning vérifie le credential avec bcrypt et utilise les services IAM officiels. Il ne réinitialise pas un compte existant. Pour un nouveau compte sans mot de passe, il exige un terminal interactif, génère un secret fort et l'affiche une seule fois ; le saisir ensuite dans la configuration locale pour les recettes suivantes. Aucun secret ne doit être copié dans les rapports.

Le compte normal bénéficie des permissions USER existantes (lecture ERP/Data/configuration), sans élévation IAM. Le tenant `techzone-test` et son membership sont réutilisés. Un compte ou membership inactif provoque une erreur explicite.

## Recette

`windows:test` réalise de vrais appels HTTP et vérifie les cookies HttpOnly, l'identité non administrateur, le tenant de session et les API. Il s'arrête avec un code non nul au premier échec. La partie navigateur utilise Edge et Playwright (`npm --prefix frontend install --save-dev @playwright/test` si absent). Le poste de cette recette dispose déjà de Playwright dans `logs/browser-tools`. Aucun mock n'est utilisé par ce runner. Les tests unitaires restent distincts.

`/ready` vérifie une connexion SQL (`SELECT 1`), pas la conformité du schéma. Un `/ready` HTTP 200 ne suffit donc pas à certifier les API métier. Voir le [rapport P0.5](audit/P0_5_RUNTIME_WINDOWS_REPORT.md) pour le blocage actuel : migration tenant non appliquée et incohérente avec le schéma UUID actuel.
