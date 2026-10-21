# Scénario de recette avancée — Techzone Boutique Pro

> **Statut :** spécification de recette cible, non exécutée. Les modèles, pages et résultats attendus ci-dessous ne constituent pas une preuve d'implémentation.

## 1. Identification de l'application

| Paramètre | Valeur |
|---|---|
| Nom commercial | Techzone Boutique Pro |
| Code application | `TECHZONE_BOUTIQUE` |
| Version de référence | `1.0.0` |
| Version cible | `1.1.0` |
| Tenant principal | `TENANT_BOUTIQUE_A` |
| Tenant de contrôle | `TENANT_BOUTIQUE_B` |
| Pack | `PACK_BOUTIQUE_VENTE` |
| Devise | MGA (Ariary) |
| Activité | Vente de matériels informatiques et accessoires |
| Modes de vente | Comptoir, commande, livraison |
| Périmètre | Back-office commercial et interface de vente |

**Principe :** réutiliser les objets déjà créés dans `1.0.0`, terminer les blocages IAM/RBAC et la publication, puis ajouter les fonctionnalités de `1.1.0`. Ne pas dupliquer les modèles existants.

## 2. Contexte métier

Techzone Boutique Pro achète des marchandises auprès de fournisseurs locaux et internationaux, les réceptionne dans un dépôt principal, les transfère au magasin, puis les vend à des particuliers et entreprises. Les ventes peuvent être réglées en espèces, par Mobile Money ou à crédit. Les commandes peuvent être livrées en plusieurs fois. Les retours peuvent donner lieu à un remboursement ou un avoir.

Le parcours métier de référence est : **Fournisseur → Commande d'achat → Réception → Stock → Catalogue → Vente → Paiement → Livraison → Retour/SAV**. La traçabilité, les permissions, l'isolation des tenants et les rapports s'appliquent à toutes les étapes.

**Objectif de la recette :** vérifier les interfaces, les API réelles, la persistance PostgreSQL, les règles métier, les transactions, les refus d'accès et la publication de l'application.

## 3. Modèles de données cibles (25)

### 3.1 Référentiel et catalogue — 5 modèles

| Modèle | Champs principaux | Relations / finalité |
|---|---|---|
| `Category` | `code`, `name`, `parentId`, `status` | Hiérarchie de catégories et produits |
| `Brand` | `code`, `name`, `status` | Marques associées aux produits |
| `Product` | `sku`, `name`, `categoryId`, `brandId`, `purchasePrice`, `salePrice`, `minStock`, `status` | Catalogue, ventes, achats, stocks |
| `ProductVariant` | `productId`, `barcode`, `color`, `size`, `priceAdjustment` | Variantes d'un produit |
| `Supplier` | `code`, `name`, `phone`, `country`, `status` | Fournisseurs et commandes |

**Tests :** créer catégories et sous-catégories, produits et variantes ; vérifier unicité du SKU, cohérence des prix, filtres, relations et exclusion d'un produit inactif des nouvelles ventes. **Attendu :** données liées, aucun doublon non autorisé, historique préservé.

### 3.2 Achats et approvisionnement — 3 modèles

| Modèle | Champs principaux | Relations / finalité |
|---|---|---|
| `PurchaseOrder` | `reference`, `supplierId`, `orderDate`, `expectedDate`, `total`, `status` | Commande fournisseur |
| `PurchaseOrderLine` | `purchaseOrderId`, `productId`, `quantity`, `unitCost`, `receivedQuantity` | Lignes et reliquats |
| `GoodsReceipt` | `reference`, `purchaseOrderId`, `receiptDate`, `status` | Réceptions et mouvements associés |

**Tests :** commande de 30 souris, réception partielle de 20 puis de 10. **Attendu :** reliquat correct, impossibilité de réceptionner davantage sans règle explicite, stock incrémenté une seule fois par réception validée.

### 3.3 Stocks et dépôts — 4 modèles

| Modèle | Champs principaux | Relations / finalité |
|---|---|---|
| `Warehouse` | `code`, `name`, `location`, `status` | Magasin et dépôts |
| `InventoryBalance` | `warehouseId`, `productId`, `quantityOnHand`, `reservedQuantity` | Solde par produit et dépôt |
| `StockMovement` | `reference`, `productId`, `warehouseId`, `type`, `quantity`, `sourceReference`, `createdAt` | Traçabilité des entrées et sorties |
| `StockTransfer` | `reference`, `sourceWarehouseId`, `destinationWarehouseId`, `status` | Transferts entre dépôts |

**Tests :** transferts, ajustements autorisés, seuils d'alerte et tentatives de double validation. **Attendu :** stock consolidé inchangé lors d'un transfert ; mouvements traçables ; pas de stock négatif si interdit.

### 3.4 Clients et ventes — 5 modèles

| Modèle | Champs principaux | Relations / finalité |
|---|---|---|
| `Customer` | `code`, `name`, `phone`, `email`, `creditLimit`, `status` | Fiches clients |
| `Sale` | `reference`, `customerId`, `saleDate`, `subtotal`, `discount`, `total`, `status` | Ventes |
| `SaleLine` | `saleId`, `productId`, `quantity`, `unitPrice`, `discount`, `subtotal` | Lignes de vente |
| `Return` | `reference`, `saleId`, `reason`, `status`, `refundAmount` | Retours et remboursements |
| `ReturnLine` | `returnId`, `saleLineId`, `quantity`, `condition` | Articles retournés |

**Tests :** vente multiligne, remise, annulation, retour partiel. **Attendu :** totaux exacts, pas de retour supérieur à la quantité vendue, vente originale conservée et annulations traçables.

### 3.5 Paiements et créances — 3 modèles

| Modèle | Champs principaux | Relations / finalité |
|---|---|---|
| `Payment` | `reference`, `saleId`, `amount`, `method`, `status`, `paidAt` | Encaissements |
| `PaymentAllocation` | `paymentId`, `saleId`, `allocatedAmount` | Affectation des règlements |
| `CustomerReceivable` | `customerId`, `saleId`, `originalAmount`, `remainingAmount`, `dueDate`, `status` | Crédit et solde client |

**Tests :** paiements mixtes, paiements partiels, solde ultérieur, surpaiement. **Attendu :** aucun double comptage, soldes exacts, surallocation refusée.

### 3.6 Livraisons — 2 modèles

| Modèle | Champs principaux | Relations / finalité |
|---|---|---|
| `Delivery` | `reference`, `saleId`, `address`, `deliveryDate`, `status` | Expédition et livraison |
| `DeliveryLine` | `deliveryId`, `saleLineId`, `quantity`, `deliveredQuantity` | Quantités livrées et reliquats |

**Tests :** livraison partielle puis solde. **Attendu :** reliquat correct, livraison excédentaire refusée.

### 3.7 Traçabilité — 1 modèle

| Modèle | Champs principaux | Relations / finalité |
|---|---|---|
| `BusinessAuditEvent` | `actorId`, `tenantId`, `entityType`, `entityId`, `action`, `occurredAt` | Audit des opérations sensibles |

**Tests :** changement de prix, ajustement de stock, annulation. **Attendu :** acteur et opération identifiables, historique protégé. Réutiliser le dispositif d'audit existant s'il couvre ce besoin.

**Total : 25 modèles métier cibles.** Les identités, tenants, rôles et permissions restent gérés par les modules plateforme/IAM existants.

## 4. Pages UI Builder à créer ou compléter (20)

| N° | Page | Route | Composants et interactions |
|---|---|---|---|
| 01 | Tableau de bord | `/dashboard` | KPI, graphiques, alertes de stock, dernières ventes |
| 02 | Produits | `/products` | Tableau, recherche, filtres, ajout, modification |
| 03 | Fiche produit | `/products/:id` | Variantes, prix, stock par dépôt, historique |
| 04 | Catégories et marques | `/catalog/references` | Listes et formulaires de référence |
| 05 | Fournisseurs | `/suppliers` | Annuaire, formulaire, statut |
| 06 | Commandes fournisseur | `/purchases` | Création, lignes, validation, suivi |
| 07 | Réception marchandise | `/receipts` | Réceptions partielles, écarts, confirmation |
| 08 | Vue des stocks | `/inventory` | Quantités par dépôt, réservations, alertes |
| 09 | Mouvements de stock | `/inventory/movements` | Historique, filtres, ajustements autorisés |
| 10 | Transferts | `/inventory/transfers` | Dépôts source/destination, articles, statuts |
| 11 | Clients | `/customers` | Liste, fiche, achats et solde |
| 12 | Nouvelle vente | `/sales/new` | Produits, panier, remises, validation, encaissement |
| 13 | Historique des ventes | `/sales` | Filtres, statuts, détail, annulation autorisée |
| 14 | Détail d'une vente | `/sales/:id` | Lignes, paiements, livraisons, retours |
| 15 | Encaissements | `/payments` | Modes, paiements, rapprochement et soldes |
| 16 | Créances clients | `/receivables` | Échéances, montants dus, règlements |
| 17 | Retours et SAV | `/returns` | Motifs, articles, décision, remboursement/avoir |
| 18 | Livraisons | `/deliveries` | Préparation, suivi, livraison partielle |
| 19 | Rapports et statistiques | `/reports` | Chiffre d'affaires, marge, stock, créances |
| 20 | Paramètres boutique | `/settings` | Devise, dépôts, règles commerciales |

**Exigence transversale pour chaque page :** tester affichage, navigation, formulaire, états vide/chargement/erreur, permissions, appel API et persistance PostgreSQL. Les pages doivent utiliser des bindings réels ; un simple rendu statique n'est pas suffisant.

## 5. Scénarios de recette avancés et résultats attendus

### SC-01 — Approvisionnement partiel

**Contexte :** commande de 30 souris USB à 12 000 Ar l'unité.

| Action | Résultat attendu |
|---|---|
| Créer la commande | Total 360 000 Ar |
| Réceptionner 20 souris | Stock +20, reliquat 10 |
| Réceptionner 10 souris | Stock +10, reliquat 0 |
| Tenter de réceptionner encore 5 | Refus |
| Consulter les mouvements | Deux réceptions liées à la commande |

**Critère de réussite :** 30 unités réceptionnées, aucune entrée dupliquée.

### SC-02 — Vente multiligne avec remise

**Contexte :** 2 claviers à 40 000 Ar, 1 webcam à 65 000 Ar, 3 câbles HDMI à 15 000 Ar. Remise globale de 5 % sous réserve d'autorisation.

| Élément | Montant |
|---|---:|
| 2 claviers | 80 000 Ar |
| 1 webcam | 65 000 Ar |
| 3 câbles | 45 000 Ar |
| Sous-total | 190 000 Ar |
| Remise 5 % | −9 500 Ar |
| **Total** | **180 500 Ar** |

**Attendu :** remise appliquée selon le contrat, stock décrémenté une seule fois, vente et lignes persistées, marge calculée sur les coûts réels.

### SC-03 — Paiement mixte et crédit

**Contexte :** Société Alpha achète pour 500 000 Ar.

| Moyen | Montant |
|---|---:|
| Espèces | 150 000 Ar |
| Mobile Money | 200 000 Ar |
| Crédit client | 150 000 Ar |
| Total | 500 000 Ar |

**Attendu :** encaissements de 350 000 Ar, créance de 150 000 Ar, statut partiellement payé, solde à zéro après règlement complémentaire. Le crédit n'est pas compté comme un paiement encaissé.

### SC-04 — Transfert entre deux dépôts

**Contexte :** dépôt principal = 20 webcams ; magasin = 3 webcams ; transfert de 8 webcams vers le magasin.

**Attendu :** dépôt principal = 12, magasin = 11, total consolidé = 23. Une seconde confirmation de la même opération ne modifie pas le stock.

### SC-05 — Concurrence sur la dernière unité

**Contexte :** une seule unité de routeur reste disponible. Deux vendeurs la commandent simultanément.

**Attendu :** une seule vente confirmée, l'autre rejetée ou placée en attente selon le contrat ; stock final = 0 ; aucune double sortie ni quantité négative.

### SC-06 — Retour partiel et remboursement

**Contexte :** vente de 3 casques audio à 35 000 Ar, soit 105 000 Ar. Un casque est retourné comme défectueux.

**Attendu :** vente originale conservée ; retour et remboursement/avoir de 35 000 Ar selon le contrat ; article défectueux non réintégré au stock vendable ; audit conservé.

### SC-07 — Sécurité des rôles et isolation tenant

**Contexte :** un vendeur de `TENANT_BOUTIQUE_A` tente de consulter ou modifier une vente de `TENANT_BOUTIQUE_B`. Un lecteur tente d'annuler une vente.

**Attendu :** accès refusés côté serveur, aucune fuite de données, aucun changement en base, événements sensibles tracés. Les rôles doivent exister dans le catalogue IAM/RBAC réel.

### SC-08 — Versionnement et publication

**Contexte :** `1.0.0` contient la boutique de référence ; `1.1.0` ajoute les fournisseurs, transferts, créances et pages associées.

**Attendu :** ancienne version préservée ; nouveau contrat et nouvelles pages validés ; snapshot/hash cohérents ; publication via Pack Manager ; manifest EXECUTABLE ; Runtime opérationnel et isolé par tenant.

## 6. Tests attendus par module Techzone Cloud V3

| Module | Contexte et opérations | Résultat attendu |
|---|---|---|
| Environment / Deployment | Préparer environnement, vérifier gates, readiness et déploiement | États exacts, échecs explicites, pas de faux succès |
| Prisma / Tenant Foundation | Créer objets liés dans deux tenants, tester contraintes | Relations cohérentes, intégrité, séparation des données |
| Auth / IAM | Administrateur, vendeur, stockiste, lecteur, contrôles d'accès | Autorisations réelles, refus serveur, pas de privilège implicite |
| Business Manager V3 | Modèles, relations, features, navigation, configuration, contrat | Gate métier PASS seulement si exigences réellement satisfaites |
| UI Builder V3 | Construire les 20 pages, formulaires et tables | Navigation, validation UI, bindings réels, interactions fonctionnelles |
| Pack Manager V3 | PackVersion `1.1.0`, validation, snapshot, hash, publication | Contrat valide, snapshot intègre, publication contrôlée |
| Pack Runtime V3 | Résoudre et ouvrir l'application publiée | Manifest EXECUTABLE, tenant/version corrects, pages accessibles |
| Data Runtime | CRUD, relations, transactions, filtres et permissions | Données PostgreSQL exactes, opérations atomiques, refus justifiés |

## 7. Critères globaux d'acceptation

- [ ] Les 25 modèles cibles sont créés ou réutilisés, sans doublons.
- [ ] Les relations et contraintes sont validées.
- [ ] Les 20 pages sont accessibles selon les permissions.
- [ ] Les formulaires enregistrent des données réelles.
- [ ] Les montants, remises et marges sont calculés correctement.
- [ ] Les paiements et créances restent cohérents.
- [ ] Les réceptions, transferts et retours conservent l'intégrité des stocks.
- [ ] La concurrence sur une dernière unité est maîtrisée.
- [ ] Les accès inter-tenant sont refusés.
- [ ] Le snapshot, la publication et le Runtime sont opérationnels.
- [ ] Les preuves HTTP, PostgreSQL et UI sont conservées.
- [ ] Les étapes non exécutées sont notées **NOT TESTED** ou **BLOCKED**, jamais **PASS**.

## 8. Ordre d'exécution recommandé

1. Résoudre les prérequis IAM/RBAC (`REG-012`, `REG-013`) sur `techzone_test`.
2. Terminer la publication et la recette réelle de `TECHZONE_BOUTIQUE` version `1.0.0`.
3. Créer la version `1.1.0` sans modifier silencieusement `1.0.0`.
4. Compléter les 25 modèles et leurs relations.
5. Construire et lier les 20 pages UI Builder.
6. Valider Business Manager, UI Builder et Pack Manager.
7. Publier puis exécuter l'application dans Pack Runtime.
8. Exécuter les scénarios SC-01 à SC-08 avec preuves API/PostgreSQL/UI.
9. Produire un verdict **GO / NO-GO** argumenté, sans assimiler des tests unitaires à une recette métier complète.

**Règles de sécurité :** utiliser uniquement la base isolée `techzone_test` ; ne pas exécuter de reset, `db push`, suppression destructive ou modification de production sans autorisation ; ne pas contourner IAM ; ne pas créer de succès fictif ; ne pas effectuer de push/PR/merge sans accord.
