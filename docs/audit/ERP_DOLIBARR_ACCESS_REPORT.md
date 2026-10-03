# CDC07 — déblocage Dolibarr réel, 2026-10-03

**P0 NOT DONE.** Compte technique créé, mais aucun credential technique configuré et aucune permission métier attribuée à ce compte. Factures et Stocks ne sont pas réellement activés. P1–P3 ne sont pas engagés avant résolution de ces prérequis.

## Compte, modules et actions réellement effectuées

Dolibarr installé : **23.0.3**, environnement déclaré **non-production**. La clé préexistante appartient à `superadmin`, ID **1**, actif, administrateur, entité **0**, aucun groupe. Aucun autre utilisateur n'existait avant cette intervention. Aucun mot de passe de cet utilisateur n'a été consulté, demandé ou modifié.

Le diagnostic précédent était incomplet : les cinq modules métier étaient désactivés. Les familles de droits absentes ne résultaient donc pas seulement d'une affectation de permissions insuffisante. L'API administrative officielle expose l'activation des modules et la création des utilisateurs.

Actions administratives effectuées avec la clé déjà autorisée :

| Action | Résultat HTTP | Vérification après action |
|---|---|---|
| PUT `/setup/modules/modSociete/enable` | 200, success | societe actif |
| PUT `/setup/modules/modProduct/enable` | 200, success | product actif |
| PUT `/setup/modules/modCommande/enable` | 200, success | commande actif |
| PUT `/setup/modules/modFacture/enable` | 200, success | **facture toujours inactif** |
| PUT `/setup/modules/modStock/enable` | 200, success | **stock toujours inactif** |
| POST `/users` : `techzone_api` | 200, ID 2 | Compte non administrateur, entité 1, aucun groupe, aucun droit métier |

L'activation des trois premiers modules a automatiquement ajouté leurs droits au compte administrateur selon le comportement Dolibarr. Aucun droit n'a été attribué manuellement au compte humain, et aucun de ces droits n'a été transféré au compte technique.

Le compte **techzone_api**, ID **2**, est nouvellement créé. La relecture indique **actif**, malgré le champ legacy `statut: 0` envoyé à la création ; le statut relu fait foi. Son mot de passe technique aléatoire est uniquement dans `backend/.env.local`, ignoré par Git. Aucun envoi de courriel ni adresse personnelle n'est utilisé. Le compte reste sans groupe, sans permission métier et sans clé API dédiée.

## Blocages exacts

1. **Attribution des droits et clé API** : le Swagger réel ne fournit pas d'opération de gestion des permissions utilisateur. Le mécanisme standard de création/modification utilisateur refuse le champ `api_key`. La documentation officielle indique de définir la clé sur la fiche utilisateur. Il faut une session administrative Dolibarr disponible ou un accès serveur administratif explicitement identifié pour terminer ces opérations. Aucun mot de passe personnel n'est requis dans la conversation. Aucun compte administrateur temporaire, contournement de droits, modification de PHP ou changement de politique globale n'a été introduit.
2. **Activation Factures/Stocks** : l'API répond success, mais `/setup/modules` et `/setup/modules/status/all?status=all` confirment leur désactivation. Dans le code standard consulté, l'API ne vérifie pas le résultat d'`activateModule`. La cause précise de l'échec d'initialisation distant n'est pas observable avec les accès actuels. Il faut consulter le résultat d'activation dans le backoffice ou les logs serveur. Une erreur de fichiers/SQL reste une hypothèse, pas un diagnostic établi.
3. **Credential technique non configuré** : la configuration Techzone n'a pas été basculée vers un compte sans droits et sans clé. La clé préexistante n'est utilisée que pour les diagnostics autorisés ; elle ne constitue pas la solution technique permanente.

Permissions à attribuer au seul compte technique : `societe.lire`, `produit.lire`, `commande.lire`, `facture.lire`, `stock.lire`. Aucun create/update/delete/validate/payment/admin demandé. Utiliser les libellés de la version installée et vérifier la relecture après affectation.

## Configuration Techzone

Tenant réel : **Techzone Test**, `8031055e-14af-4b43-979f-904e820306e9`.
Connector réel : `cb3e3316-ee4e-4b7c-96d9-45192b6a13d8`, DOLIBARR ACTIVE.

Credential existant configured: **YES**. Credential dédié techzone_api configured: **NO**.
Le mécanisme actuel est `DOLIBARR_API_KEY` lié explicitement à `DOLIBARR_TENANT_ID`, dans l'environnement local. `ERP_CREDENTIAL_ENCRYPTION_KEY` existe, format 32 octets/64 caractères hexadécimaux valide. `git check-ignore backend/.env.local` confirme l'exclusion. La future clé technique devra être enregistrée dans le Connector Registry chiffré existant ; aucun deuxième coffre n'a été créé. La destination publique configurée fonctionne sans assouplissement SSRF ni allowlist supplémentaire.

Les services ont été redémarrés proprement ; frontend, backend, readiness et base répondent. Aucun secret n'apparaît dans les preuves.

## Recette réelle après activation partielle

Cette recette utilise encore le compte précédent **superadmin**, uniquement pour confirmer les effets des modules. Elle ne valide donc pas le compte technique ni DONE P0.

| Resource | Techzone endpoint | Dolibarr endpoint | Techzone HTTP | Dolibarr HTTP | Duration navigateur | Final UI state | Count returned | Error code |
|---|---|---|---|---|---|---|---|---|
| Clients | `/api/erp/clients` | `/api/index.php/thirdparties` | 200 | 404¹ | 869 ms | EMPTY | 0 | — |
| Produits | `/api/erp/products` | `/api/index.php/products` | 200 | 200 | 2195 ms | EMPTY | 0 | — |
| Commandes | `/api/erp/orders` | `/api/index.php/orders` | 200 | 200 | 2196 ms | EMPTY | 0 | — |
| Factures | `/api/erp/invoices` | `/api/index.php/invoices` | 502 | 403 | 1036 ms | FORBIDDEN | non reçu | ERP_PERMISSION_DENIED |
| Stocks | `/api/erp/stocks` | `/api/index.php/products?includestockdata=1` | 200 | 200 | 4263 ms | EMPTY² | 0 | — |

¹ Dolibarr renvoie exactement `Not Found: No third parties found` sur une collection vide. Cette réponse documentée par le code et constatée sur le serveur est maintenant traduite en liste vide ; un 404 différent reste une erreur. Deux tests transport couvrent cette distinction. Aucun fallback générique vers zéro ou tableau vide n'est ajouté.

² Zéro produit implique une liste de stock vide, même avec le module Stock inactif. **Cela ne prouve pas la capability stock.lire ni le fonctionnement des entrepôts.** Stocks n'est pas déclaré AVAILABLE.

| Resource | traceId | correlationId (header X-Request-Id) |
|---|---|---|
| Clients | e863c388-c398-463b-b5c2-8149be8e3e85 | e863c388-c398-463b-b5c2-8149be8e3e85 |
| Produits | 6d607476-a34e-425d-9572-c508402a8275 | 6d607476-a34e-425d-9572-c508402a8275 |
| Commandes | 69055d74-72fc-4ff2-9a68-e6d4508524ae | 69055d74-72fc-4ff2-9a68-e6d4508524ae |
| Factures | d29a8bc9-dbd8-430b-8471-27dbd256afd9 | d29a8bc9-dbd8-430b-8471-27dbd256afd9 |
| Stocks | 09fb0f52-26a1-4d0b-a431-ee0cc6ffd10a | 09fb0f52-26a1-4d0b-a431-ee0cc6ffd10a |

Aucune carte LOADING restante, aucun mock/interception, aucune exception JavaScript, aucun overflow aux largeurs 1440/768/390. `status: PASS` dans la preuve signifie seulement que la terminaison est correcte ; `dataAccessStatus: FAIL` exprime explicitement le refus restant.

## Validation et preuves

- Backend : **236 tests / 23 suites PASS**, dont IAM/Tenant ; build Nest PASS.
- Frontend : **7 tests PASS**, build Vite PASS (warnings préexistants de chunk et case FormField).
- Les cinq écrans de ressources ont aussi été ouverts et attendus : Clients/Produits/Commandes vides ; Factures refusées ; l'écran Stocks appelle `/api/erp/stock-movements` et reste refusé (`ERP_PERMISSION_DENIED`), contrairement à la carte de synthèse vide. Cette différence confirme que la capability Stocks n'est pas validée. Aucun crash ni perte de session IAM.
- Connexion ERP : test réel HTTP 200, registre HTTP 200 et historique HTTP 200. Ce test `/status` confirme la joignabilité ; l'authentification de la clé précédente est corroborée par `/users/info` HTTP 200. Il ne valide ni la clé technique absente ni toutes les capabilities métier.
- Audit : `ERP_DOLIBARR_ACCOUNT_AUDIT.json`, uniquement champs autorisés ; aucune réponse utilisateur brute ni secret.
- Ressources : `ERP_ACCESS_RESOURCE_EVIDENCE.json`, compte précédent explicitement identifié dans ce rapport ; preuves P0 antérieures conservées séparément.
- Scripts : `erp-dolibarr-account-audit.cjs` en lecture seule ; recette navigateur enrichie avec count, traceId, correlationId et validation séparée de l'accès aux données.

Référence officielle : [API REST Dolibarr — activation des modules et clé sur la fiche utilisateur](https://wiki.dolibarr.org/index.php/Module_Web_Services_API_REST_%28developer%29).
