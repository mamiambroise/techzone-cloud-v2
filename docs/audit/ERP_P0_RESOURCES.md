# ERP P0 - recette du credential technique

Date UTC : 2026-10-03T03:32:04.621Z. Compte techzone_api (ID 2). **P0 NOT DONE.**

Tenant : 8031055e-14af-4b43-979f-904e820306e9. Authentication = OK. Credential configured: YES.

| Resource | Techzone endpoint | Dolibarr endpoint | Techzone HTTP | Dolibarr HTTP | Duration ms | Final UI state | Count | Capability | Capability state |
|---|---|---|---|---|---|---|---|---|---|
| clients | /api/erp/clients | /api/index.php/thirdparties | 200 | 404 | 606 | EMPTY | 0 | societe.lire | VERIFIED |
| products | /api/erp/products | /api/index.php/products | 200 | 200 | 940 | EMPTY | 0 | produit.lire | VERIFIED |
| orders | /api/erp/orders | /api/index.php/orders | 200 | 200 | 984 | EMPTY | 0 | commande.lire | VERIFIED |
| invoices | /api/erp/invoices | /api/index.php/invoices | 502 | 403 | 1000 | FORBIDDEN | non recu | facture.lire | FAILED |
| stocks | /api/erp/stocks | /api/index.php/products?includestockdata=1 | 200 | 200 | 999 | EMPTY | 0 | produit.lire + stock.lire | FAILED |
| stock-movements | /api/erp/stock-movements | /api/index.php/stockmovements | 502 | 403 | 937 | N/A - API explicite | non recu | stock.lire | FAILED |
| warehouses | /api/erp/warehouses | /api/index.php/warehouses | 502 | 403 | 917 | N/A - API explicite | non recu | stock.lire | FAILED |

| Resource | traceId | correlationId |
|---|---|---|
| clients | 11c1bbc9-fdb7-4438-9803-ff44552d2acc | 11c1bbc9-fdb7-4438-9803-ff44552d2acc |
| products | 8be6c5c2-ae26-4205-9f5d-e15a07949194 | 8be6c5c2-ae26-4205-9f5d-e15a07949194 |
| orders | d7d4d455-928e-40b9-80ad-ece364cbc351 | d7d4d455-928e-40b9-80ad-ece364cbc351 |
| invoices | bd51b6f9-b8f5-4875-8189-3079073e4506 | bd51b6f9-b8f5-4875-8189-3079073e4506 |
| stocks | 8477ff5a-c23c-4cc2-b8a6-ba5657cc87e4 | 8477ff5a-c23c-4cc2-b8a6-ba5657cc87e4 |
| stock-movements | 1039e4a8-38b8-4e79-934f-1a0b31239250 | 1039e4a8-38b8-4e79-934f-1a0b31239250 |
| warehouses | 0b73ba01-3f93-44f7-96e8-98a8ad599751 | 0b73ba01-3f93-44f7-96e8-98a8ad599751 |

Clients : le 404 exact "No third parties found" signifie une collection vide, verifie sur Dolibarr 23.0.3. Les autres 404 restent des erreurs.
Stocks : la carte EMPTY indique seulement aucun produit. Les mouvements et entrepots repondent 403 ; aucune quantite reelle ne peut etre validee. Capability Stock FAILED.
Factures, mouvements et entrepots : ERP_PERMISSION_DENIED. Tiers/Produits/Commandes actifs ; Factures/Stocks inactifs selon les deux endpoints administratifs.
Le compte technique a des permissions existantes plus larges que la lecture seule ; aucune permission modifiee pendant cette intervention.
Le Registry refuse la mutation avec le compte IAM de recette (403 erp:write). La cle technique utilise donc le stockage local ignore, deja pris en charge et lie au tenant. Aucun contournement IAM.
Voir ERP_P0_RECHECK_REPORT.md pour les blocages, actions administratives restantes et resultats des tests.
