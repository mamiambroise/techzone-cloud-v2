# Dolibarr — matrice des ressources et capabilities

Date : 2026-10-06
Branche auditée : `mami`
Périmètre : code ERP Adapter, Integration Hub, registre tenant, UI ERP, preuve Dolibarr réelle. Aucun catalogue n'a été ajouté pendant cet audit.

## Sources de preuve et limites

- Code : `backend/src/erp-adapter/`, `backend/src/erp-registry/`, `backend/src/modules/integration/`, `frontend/src/erp/`.
- Sonde réelle actuelle, via les connecteurs tenant-scoped : `POST /api/erp-registry/test`. Elle a répondu `200`, credentials `CONFIGURED`, Dolibarr `AVAILABLE` pour le tenant informatique. Le tenant WiFi conserve le même jeu de capabilities issu d'une sonde réelle précédente.
- Audit de compte en lecture seule : `node scripts/erp-dolibarr-account-audit.cjs`, le 2026-10-06. Dolibarr répond `/status` en `200`, version `23.0.3`, environnement `non-production`; le compte API est actif, non administrateur, entité `1`.
- Les valeurs **UNKNOWN** ne sont pas des capacités négatives : elles n'ont pas été prouvées par une réponse fournisseur pendant cet audit. Une route Techzone qui existe n'est pas considérée comme une preuve Dolibarr.
- Les écritures n'ont pas été exécutées avec des données métier. La sonde de capability emploie un payload volontairement invalide; un `400`/`422` peut prouver l'exposition de la route sans créer de donnée. Aucun `2xx` d'écriture n'a été utilisé comme test.

### Légende

- **Adapter** : `I` = méthode Dolibarr implémentée; `P` = implémentation partielle; `N` = la méthode lève explicitement `CAPABILITY_UNAVAILABLE`.
- **API** : route Techzone exposée sous `/api/erp`; tous les reads exigent `erp:read`, les mutations `erp:write`.
- **Mapping** : `M` = `DolibarrMapper` bidirectionnel/normalisation dédiée; `P` = mapping direct/partiel; `—` = aucun mapping exécutable.
- **Sync** : aucune synchronisation PULL/PUSH par ressource n'est implémentée. `ExternalResourceLink` existe uniquement pour les commandes exécutées par contrat (Customer/Product/Order) et ne constitue pas une synchronisation.
- **Tests** : les suites applicables sont `dolibarr.adapter.spec.ts`, `dolibarr-timeout.spec.ts`, `erp-adapter.service.spec.ts`, `erp-resource-errors.spec.ts`, `erp-registry.security.spec.ts`, `erp-adapter.provider.spec.ts`.

## Capabilities réellement sondées

Les endpoints ci-dessous sont les endpoints Dolibarr réellement appelés par `ErpCapabilityService`; les statuts proviennent de la sonde réelle du connecteur `dolibarr_informatique` le 2026-10-06.

| Capability | Endpoint Dolibarr | Réponse réelle | Conclusion |
| --- | --- | --- | --- |
| `customer.read` | `GET /thirdparties` | 404, collection vide reconnue | AVAILABLE |
| `customer.create` | `POST /thirdparties` | 400, payload invalide | AVAILABLE |
| `customer.update` | `PUT /thirdparties/0` | 500 | UNKNOWN |
| `product.read` | `GET /products` | 200 | AVAILABLE |
| `product.create` | `POST /products` | 400, payload invalide | AVAILABLE |
| `product.update` | `PUT /products/0` | 500 | UNKNOWN |
| `order.read` | `GET /orders` | 200 | AVAILABLE |
| `order.create` | `POST /orders` | 400, payload invalide | AVAILABLE |
| `order.update` | `PUT /orders/0` | 400, route exposée | AVAILABLE |
| `invoice.read` | `GET /invoices` | 403 | PERMISSION_DENIED / MODULE_DISABLED |
| `invoice.create` | `POST /invoices` | 403 | PERMISSION_DENIED / MODULE_DISABLED |
| `payment.create` | `POST /payments` | 501 | NOT_SUPPORTED (Dolibarr REST 23.0.3) |
| `supplierorder.read` | `GET /supplierorders` | 403 | PERMISSION_DENIED |
| `warehouse.read` | `GET /warehouses` | 403 | PERMISSION_DENIED |
| `stockmovement.read` | `GET /stockmovements` | 403 | PERMISSION_DENIED / MODULE_DISABLED |
| `project.read` | `GET /projects` | 403 | PERMISSION_DENIED |
| `agenda.read` | `GET /agenda` | 501 | NOT_IMPLEMENTED (probe path does not match adapter path) |
| `agenda.create` | `POST /agenda` | 501 | NOT_IMPLEMENTED (probe path does not match adapter path) |

Important : l'adapter utilise réellement `/agendaevents`, alors que le probe utilise `/agenda`. La sonde ne permet donc pas de conclure qu'Agenda est refusé par le fournisseur; elle révèle une lacune de catalogue de capability à corriger en Phase 11.2, pas une permission à contourner.

## Inventaire du code et état fournisseur

| Resource | Adapter | API | Read | Create | Update | Delete | Sync | Mapping | Tests | Module Dolibarr / permission observée | Final |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Customer / ThirdParty | I | `/clients` | AVAILABLE | AVAILABLE | UNKNOWN | I, non sondé | No; link contrat | M | mapper + HTTP errors | `societe` actif; `societe.lire`, `societe.creer` présents | AVAILABLE |
| Supplier | I | `/suppliers` | I, non sondé | I, non sondé | I, non sondé | I, non sondé | No | P | adapter général seulement | droit/module fournisseur non établi | UNKNOWN |
| Product | I | `/products` | AVAILABLE | AVAILABLE | UNKNOWN | I, non sondé | No; link contrat | M | mapper + HTTP errors | `product` actif; `produit.lire`, `produit.creer`, `produit.supprimer` présents | AVAILABLE |
| Service | P (read/get/create) | `/services` | I, non sondé | I, non sondé | N | N | No | M | adapter général seulement | dépend du module Product; filtre `type=service` non sondé | UNKNOWN |
| Product variant | P (list only) | `/product-variants` | I, non sondé | N | N | N | No | M | adapter général seulement | attributs produit non établis | UNKNOWN |
| Customer Order | I | `/orders` | AVAILABLE | AVAILABLE | AVAILABLE | I, non sondé | No; link contrat | M | mapper + HTTP errors | `commande` actif; `commande.lire`, `commande.creer`, `commande.supprimer` présents | AVAILABLE |
| Supplier Order | P (read/get/create) | `/purchases` | 403 | non sondé | N | N | No | M | adapter général seulement | fournisseur/commande fournisseur absent du compte audité | PERMISSION_DENIED |
| Quote / Proposal | I | `/quotes` | I, non sondé | I, non sondé | I, non sondé | I, non sondé | No | M | adapter général seulement | module/droits proposition non établis | UNKNOWN |
| Invoice | I | `/invoices` | 403 | 403 | I, non sondé | I, non sondé | No | M | mapper + HTTP errors | `modFacture` désactivé; famille `facture` absente du compte | MODULE_DISABLED / PERMISSION_DENIED |
| Payment | P (read only) | `/payments` | I via `/paiements`, non sondé | N (`POST /payments` 501) | N | N | No | M read | adapter général seulement | paiement non établi; création REST non exposée | NOT_SUPPORTED |
| Stock (product quantity) | I | `/stock/:productId`, `/stocks` | I via products, non sondé | — | I | — | No | M | timeout/zero-stock tests | `stock` désactivé; `stock.lire` absent; product read seul ne prouve pas stock | MODULE_DISABLED / UNKNOWN |
| Warehouse | I | `/warehouses` | 403 | I, non sondé | I, non sondé | I, non sondé | No | M | adapter général seulement | stock/warehouse absent du compte audité | PERMISSION_DENIED |
| Stock Movement | I | `/stock-movements` | 403 | I, non sondé | — | — | No | M | adapter général only | `stock` désactivé; `stock.lire` absent | MODULE_DISABLED / PERMISSION_DENIED |
| Stock Transfer | P (read/create) | `/stock-transfers` | I, non sondé | I, non sondé | N | — | No | M | adapter général only | stock non établi | UNKNOWN |
| Inventory | P (read/get/create) | `/inventories` | I, non sondé | I, non sondé | N | — | No | M | adapter général only | stock non établi | UNKNOWN |
| Stock Alert | N | `/stock-alerts` | N | N | — | — | No | M read only | no resource test | aucune opération adapter | NOT_IMPLEMENTED |
| Shipment | P (read/get/create/update) | `/shipments` | I, non sondé | I, non sondé | I, non sondé | — | No | M | adapter général only | expédition non établie | UNKNOWN |
| Document | I (agrégation/upload/delete) | `/documents` | dépend de cinq ressources | I, non sondé | — | I, non sondé | No | M | adapter général only | dépend notamment des factures actuellement refusées | UNKNOWN |
| Return | P (read/get/create) | `/returns` | I, non sondé | I, non sondé | N | — | No | M | adapter général only | endpoint PowerERP non établi | UNKNOWN |
| Promotion | P (read/get/create) | `/promotions` | I, non sondé | I, non sondé | N | N | No | M | adapter général only | module promotion non établi | UNKNOWN |
| Purchase / Supplier order | P | `/purchases` | 403 | non sondé | N | — | No | M | adapter général only | même endpoint supplier order | PERMISSION_DENIED |
| Cash Register | P (read/get/create) | `/cash-registers` | I, non sondé | I, non sondé | N | — | No | M | adapter général only | module POS non établi | UNKNOWN |
| Expense | N | `/expenses` | N | N | — | N | No | M dead code only | no resource test | aucune opération adapter | NOT_IMPLEMENTED |
| Reservation | N | `/reservations` | N | N | N | — | No | M dead code only | no resource test | aucune opération adapter | NOT_IMPLEMENTED |
| Agenda Event | I | `/agenda` | probe mismatch; adapter route non sondée | probe mismatch; adapter route non sondée | I, non sondé | I, non sondé | No | M | adapter général only | `agenda` actif; droits actions read/create/delete présents | UNKNOWN |
| Project | I | `/projects` | 403 | non sondé | I, non sondé | — | No | M | adapter général only | project absent du compte audité | PERMISSION_DENIED |
| User | I (read only) | `/users` | I, non sondé | — | — | — | No | P inline | account audit proves `/users` and `/users/info` 200 | `user` actif; user read present | UNKNOWN |
| Category | N | no route | N | N | N | N | No | — | none | no adapter/catalogue route discovered | NOT_IMPLEMENTED |
| ERP Stats | N | `/stats` | N | — | — | — | No | — | none | explicitly throws capability unavailable | NOT_IMPLEMENTED |

## Contracts, links and runtime scope

- `ERP_CONTRACTS` exposes versioned contracts only for Customer, Product, Order and Agenda. Its `invoke()` currently handles `*.list`, `*.get`, Customer/Product/Order creates/updates and `agenda.read`; declared `customer.read`, `product.read` and `order.read` have no matching switch case. They are therefore declared but not executable through `/api/erp/commands` and must remain a Phase 11.2 gap.
- External resource links are tenant-scoped in `external_resource_links`; they are written only after a successful contract command. Current boutique link lists are empty; no sync fabricated them.
- `ERPAdapterDataProvider` exposes only Product, Client, Order and Stock (Stock only by id). It does not discover the broader adapter catalogue dynamically.
- The generic Integration Hub has its own global `Connector` model and administration routes. It is not the `ERPRegistry` used to resolve the tenant Dolibarr connector. Reusing it blindly for boutique ERP configuration would violate the tenant-scoping requirement.

## Invoice diagnostic

Current reproduction, tenant `techzone-informatique`:

| Layer | Evidence | Result |
| --- | --- | --- |
| Techzone IAM | tenant switch and `GET /api/erp/invoices` passed the controller boundary; an IAM refusal would be 403 | not denied by Techzone IAM |
| Provider | capability probe `GET /invoices` returned 403; endpoint call was translated | denied by Dolibarr |
| Techzone response | HTTP 502, `ERP_PERMISSION_DENIED`, connector `dolibarr`, traceId `06d27712-41f6-43bf-bf2f-0820a5f12dd3` | structured upstream refusal |

The account audit proves `modFacture` is currently disabled and the account has no `facture` permission family. The corrective action belongs to the Dolibarr administrator: enable the Invoice module successfully, then grant the least privilege needed (`facture.lire` for read; create/update rights only if those commands are explicitly approved). No security bypass is appropriate.

## Mise à jour Phase 11.2 (2026-10-06)

Le catalogue dynamique a remplacé la liste frontend de cinq cartes comme source d'autorité. Les deux connecteurs tenant-scoped ont été re-sondés avec les probes non destructifs étendus : Agenda utilise désormais `/agendaevents` et `agenda.read`/`agenda.create` sont `AVAILABLE`; `payment.create` reste `NOT_SUPPORTED`. Le détail des 29 ressources, de la politique plateforme et de la recette des deux boutiques est dans [ERP_PHASE11_2_DYNAMIC_CATALOG_VALIDATION.md](ERP_PHASE11_2_DYNAMIC_CATALOG_VALIDATION.md).
