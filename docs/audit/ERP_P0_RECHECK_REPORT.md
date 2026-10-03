# CDC07 — nouvelle vérification avec techzone_api

2026-10-03, branche `mami`. **P0 NOT DONE.** Aucun changement des permissions ni des modules Dolibarr pendant cette intervention. Aucun changement du code applicatif pour transformer un refus en succès.

## Identité et credential réellement utilisés

La clé initialement chargée depuis l'environnement identifiait encore `superadmin` (ID 1). Le Connector Registry ne contenait ni clé chiffrée ni clé legacy pour le connecteur concerné. Le mot de passe aléatoire du seul compte technique, déjà présent dans le stockage local sécurisé, a permis de récupérer son token par le mécanisme officiel `POST /login`, `reset=0`, HTTP 200. Aucun mot de passe humain consulté ou modifié ; aucune rotation forcée.

Vérification directe avec ce credential : **GET `/users/info?includepermissions=1` → HTTP 200**, login **techzone_api**, ID **2**, actif, non administrateur, entité **1**, aucun groupe. **Authentication = OK. Credential configured: YES.**

Les permissions réellement retournées incluent `societe.lire`, `produit.lire` et `commande.lire`. Les familles `facture` et `stock` sont absentes. Des droits supplémentaires d'écriture, suppression et gestion des utilisateurs sont également présents ; ils n'ont pas été modifiés conformément à la consigne de préserver les permissions existantes.

La tentative d'enregistrement chiffré via `PUT /api/erp-registry/cb3e3316-ee4e-4b7c-96d9-45192b6a13d8` a été refusée par l'IAM local (HTTP 403, permission `erp:write`). Aucun contournement par SQL, élévation de rôle ou appel interne au service. Le credential technique a donc été configuré dans le mécanisme local existant, `backend/.env.local`, explicitement lié par `DOLIBARR_TENANT_ID` au tenant **Techzone Test**, `8031055e-14af-4b43-979f-904e820306e9`. Le connecteur **dolibarr_prod** est ACTIVE et appartient à ce tenant.

Le backend a été redémarré avant la recette. `superadmin` n'est plus le credential du connecteur : son ancienne clé est isolée dans la variable locale `DOLIBARR_ADMIN_AUDIT_API_KEY`, uniquement utilisée pour les lectures administratives de l'audit, jamais par le resolver. Le stockage chiffré sera utilisable via l'API lorsqu'un acteur IAM disposant déjà de `erp:write` sera disponible. La clé de chiffrement serveur existe et son format a été vérifié sans divulgation.

## Modules : état relu, pas déduit

Instance configurée : `http://167.86.71.186:8082`, Dolibarr 23.0.3, entité 1. Lectures administratives `/setup/modules` et `/setup/modules/status/all?status=all`, avec l'ancienne clé isolée pour cet audit :

| Module | État réellement retourné |
|---|---|
| Societe | ACTIVE |
| Product | ACTIVE |
| Commande | ACTIVE |
| Facture | **INACTIVE** |
| Stock | **INACTIVE** |

Aucune nouvelle tentative d'activation ni modification de permission n'a été effectuée. La cause immédiate confirmée des refus est l'absence des modules actifs et des droits correspondants. La cause interne de l'échec d'activation antérieur n'est toujours pas observable : aucun accès aux logs du serveur Dolibarr n'est disponible dans les outils/configurations identifiés. Les logs Techzone confirment les 403, pas leur cause d'installation. Aucun problème de fichier ou SQL distant n'est affirmé sans preuve.

## Blocages exacts et action administrative restante

| Module | Endpoint Dolibarr | HTTP | Permission / capability | traceId Techzone | Action restante |
|---|---|---|---|---|---|
| Facture | `/api/index.php/invoices` | 403 | `facture.lire`, lecture factures | `bd51b6f9-b8f5-4875-8189-3079073e4506` | Diagnostiquer puis terminer l'activation réelle sur cette instance/entité ; vérifier ensuite le droit de lecture du compte technique |
| Stock | `/api/index.php/stockmovements` | 403 | `stock.lire`, lecture mouvements | `1039e4a8-38b8-4e79-934f-1a0b31239250` | Diagnostiquer puis terminer l'activation réelle de Stock ; vérifier ensuite le droit de lecture |
| Stock | `/api/index.php/warehouses` | 403 | `stock.lire`, lecture entrepôts | `0b73ba01-3f93-44f7-96e8-98a8ad599751` | Même prérequis Stock ; retester cet endpoint séparément |

Le fait que `/products?includestockdata=1` retourne `[]` ne valide pas Stock. Aucune quantité réelle n'a pu être lue : aucun produit n'est retourné et les endpoints dédiés sont refusés. Aucune donnée n'a été créée pour remplir ce vide.

## Recette et validation

Les cinq appels Techzone et les cinq écrans de ressources ont été rejoués dans Edge avec session IAM réelle. Clients, Produits et Commandes sont vides ; Factures affiche le refus ; l'écran Stocks affiche le refus de stock-movements. Aucun chargement infini, aucun crash JavaScript, session préservée, pas de mock ni interception. Carte Stocks EMPTY mais capability explicitement FAILED dans la preuve.

La page Connexion ERP et son bouton de test ont été ouverts réellement ; `/api/erp/health/tenant` répond 200. Ce test de `/status` indique la joignabilité, pas la disponibilité de toutes les capabilities. L'authentification est prouvée séparément par `/users/info` avec le credential technique. Historique et registry répondent 200 en lecture.

Preuves actualisées :

- `ERP_P0_RESOURCE_EVIDENCE.json` : cinq ressources, deux contrôles Stock, compte technique/tenant, codes, durées, compteurs, capabilities, traceId et correlationId.
- `ERP_P0_RESOURCES.md` : tableau lisible des sept appels.
- `ERP_DOLIBARR_ACCOUNT_AUDIT.json` : identité et droits expurgés, modules ; distinction credential CONNECTOR / ADMIN_AUDIT_ONLY.

P1/P2/P3 ne sont pas engagés puisque le prérequis P0 échoue encore sur Factures et Stock. Les protections existantes (timeouts, traduction des erreurs, SSRF, tenant binding, annulation, chiffrement disponible) sont conservées.

Validation rejouée : **236 tests backend / 23 suites PASS** (dont IAM/Tenant), **7 tests frontend PASS**, **builds Nest et Vite PASS**. Les warnings Vite préexistants restent hors périmètre. `git check-ignore backend/.env.local` confirme l'exclusion ; vérification du diff indexé contre les valeurs secrètes locales avant commit. Aucun push.
