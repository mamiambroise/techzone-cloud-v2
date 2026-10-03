# Recette réelle des cinq ressources ERP

2026-10-03 03:00:12 UTC (06:00:12 Bagdad), Edge, écran `http://localhost:3000/erp`, serveur Techzone `http://localhost:3003`, Dolibarr configuré `http://167.86.71.186:8082`. Toutes les requêtes sont GET. Aucun mock, aucune interception des réponses, aucun compteur de démonstration.

| Resource | Techzone endpoint | Dolibarr endpoint | HTTP Techzone / Dolibarr | Duration navigateur / upstream | Final UI state | Error code | Root cause | Correction appliquée |
|---|---|---|---|---|---|---|---|---|
| Clients | `/api/erp/clients` | `/api/index.php/thirdparties` | 502 / 403 | 866 / 492 ms | FORBIDDEN | ERP_PERMISSION_DENIED | Compte API sans societe.lire ; erreur fournisseur mal traduite | Traduction 403, état indépendant, timeout 10 s backend / 15 s UI |
| Produits | `/api/erp/products` | `/api/index.php/products` | 502 / 403 | 1316 / 824 ms | FORBIDDEN | ERP_PERMISSION_DENIED | Compte API sans produit.lire | Même correction ; validation de liste |
| Commandes | `/api/erp/orders` | `/api/index.php/orders` | 502 / 403 | 909 / 486 ms | FORBIDDEN | ERP_PERMISSION_DENIED | Compte API sans commande.lire (lecture commandes clients) | Traduction conforme du vrai 403, aucun retry ni contournement |
| Factures | `/api/erp/invoices` | `/api/index.php/invoices` | 502 / 403 | 1014 / 819 ms | FORBIDDEN | ERP_PERMISSION_DENIED | Compte API sans facture.lire | Traduction 403, état indépendant, timeout 10 s backend / 15 s UI |
| Stocks | `/api/erp/stocks` | `/api/index.php/products?includestockdata=1` | 502 / 403 | 1065 / 865 ms | FORBIDDEN | ERP_PERMISSION_DENIED | Premier contrôle produit.lire refusé ; stock.lire également absent | Même protection ; données stock demandées explicitement, quantité absente refusée au lieu de zéro |

Paramètres de pagination : entity=1, limit=100 ; page=0 sur les quatre listes métier. Les logs omettent volontairement la query et conservent le chemin. Les durées navigateur couvrent l'appel Techzone et la lecture de sa réponse ; les durées upstream couvrent le transport Dolibarr. Les statuts 403 viennent réellement de Dolibarr ; `ERR_BAD_REQUEST` est le nom générique Axios pour cette classe de réponses, pas un HTTP 400.

| Resource | traceId de réponse et logs backend |
|---|---|
| Clients | `397db738-1208-4e67-8f9c-d83aa5852f16` |
| Produits | `df130aa6-5d06-4d7a-afdf-160da9b4dabe` |
| Commandes | `d1d92b73-9d65-47d4-892d-f20fa8a8dd8d` |
| Factures | `1b0154cf-0186-4cd0-ba5e-9e4af43464a7` |
| Stocks | `05a5c46a-4a22-44fe-bdde-b838dd2b986d` |

Les cinq requêtes actives sont terminées ; aucune carte ne reste en LOADING. Les requêtes du premier montage StrictMode sont annulées par AbortController et remplacées. Aucune exception JavaScript, aucun débordement horizontal aux largeurs 1440/768/390.

Une capture antérieure sur le même serveur a aussi réellement exercé la limite backend : Clients en 10314 ms (transport 10002 ms, trace `2b6b012f-15a9-4a6e-b898-5a321c566a88`) et Stocks en 10361 ms (transport 10008 ms, trace `230fb42f-8b73-4af5-8743-091dc5be2225`) ont fini en UNAVAILABLE / INTEGRATION_TIMEOUT, HTTP Techzone 504. Aucun statut HTTP distant n'avait été reçu dans ces deux cas. Le 408 initialement porté par la classe d'erreur était synthétique : il n'est plus présenté comme preuve upstream.

**Conclusion de recette : 5/5 états terminaux cohérents vérifiés. P0 global non déclaré terminé.** Les permissions Dolibarr restent un blocage réel à la lecture des données. Aucun diagnostic ne prétend que les droits ont été corrigés ni que les données métier ont été validées.
