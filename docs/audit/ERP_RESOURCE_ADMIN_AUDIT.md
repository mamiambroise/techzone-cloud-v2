# ERP Phase 11.1 — audit ressources, capabilities et administration

Date : 2026-10-06
Branche : `mami` (`1d74ec18` au départ de l'audit)
Méthode : audit des deux CDC ERP/Integration Hub v2, recherche dépôt, historique, code, schéma Prisma, tests ciblés et sonde Dolibarr réelle. Aucun code produit, migration, reset ou modification du legacy n'a été effectué.

## Verdict

| Sujet | Verdict | Justification |
| --- | --- | --- |
| ERP ADAPTER EXISTING | PASS | Adapter Dolibarr, registre tenant, routes ERP, mapper, contrats et protection IAM existent. Les limites sont inventoriées, non masquées. |
| DOLIBARR REAL CONNECTION | PASS | `/status` réel : 200, Dolibarr 23.0.3, compte API actif/non admin; sonde connecteur : 200 et credential configuré. |
| RESOURCE DISCOVERY | PASS | 28 surfaces (dont variantes, devis, documents, retours, POS, agenda, projets) distinguées entre adapter, routes et preuves fournisseur. |
| CAPABILITY DISCOVERY | PASS, PARTIAL CATALOGUE | 18 capabilities réellement sondées; la liste ne couvre pas toutes les surfaces adapter et le probe Agenda cible le mauvais endpoint. |
| ADMIN CONTROL EXISTING | YES, séparation obligatoire | Le Hub possède l'administration générique des Connector/Credential/Sync, mais elle est globale et distincte du registre ERP tenant-scoped. |
| FRONTEND RESOURCE SOURCE IDENTIFIED | PASS | Les cinq cartes viennent de `ERP_RESOURCES` hardcodé dans `frontend/src/erp/useErpResources.js`, pas d'un catalogue backend. |
| READY FOR PHASE 11.2 | GO, with guardrails | Le catalogue suivant doit dériver des preuves ci-dessous, garder les statuts UNKNOWN et ne pas activer les droits/modules Dolibarr. |

## Résultats réels du fournisseur

Le compte `techzone_api` est actif, non administrateur, sans groupe. Les modules actuellement actifs sont : société/tiers, produit, commande, agenda, user et API. Facture et stock sont désactivés. Les droits effectivement lus incluent `societe.lire/creer`, `produit.lire/creer/supprimer`, `commande.lire/creer/supprimer` et Agenda read/create/delete; les familles `facture`, `stock`, fournisseur et projet ne figurent pas dans le compte audité.

La sonde actuelle établit :

- Available : Customer read/create, Product read/create, Order read/create/update.
- Permission denied : Invoice read/create, Supplier order read, Warehouse read, Stock movement read, Project read.
- Not supported : Payment create (`501` Dolibarr REST 23.0.3).
- Unknown : Customer/Product update (`500` sur l'identifiant fictif), ainsi que toute surface non sondée en lecture réelle.
- Probe defect : Agenda est implémenté côté adapter avec `/agendaevents`, mais la sonde utilise `/agenda` et observe `501`.

La matrice détaillée, y compris les routes, mappings, tests, module/permission et état de chaque ressource, se trouve dans [DOLIBARR_RESOURCE_CAPABILITY_MATRIX.md](DOLIBARR_RESOURCE_CAPABILITY_MATRIX.md).

## Cause de `ERP_PERMISSION_DENIED` sur Factures

Ce n'est pas un refus IAM Techzone. La requête courante a franchi l'authentification Techzone et a obtenu une réponse structurée `502 / ERP_PERMISSION_DENIED` de connecteur `dolibarr`; la sonde fournisseur a reçu `403` sur `/invoices`. Le traceId courant est `06d27712-41f6-43bf-bf2f-0820a5f12dd3`.

La cause fournisseur prouvée est double : le module `modFacture` est désactivé et le compte ne possède aucune permission `facture.*`. Le correctif légitime est à réaliser dans Dolibarr par son administrateur : activer réellement le module, puis attribuer le droit minimal correspondant. L'audit ne modifie ni le compte ni la politique Dolibarr.

## Racine des cinq cartes frontend

Le dashboard [`frontend/src/pages/ERPDashboard.jsx`](../../frontend/src/pages/ERPDashboard.jsx) itère sur `ERP_RESOURCES`, défini exactement comme `clients`, `products`, `orders`, `invoices`, `stocks` dans [`frontend/src/erp/useErpResources.js`](../../frontend/src/erp/useErpResources.js). [`frontend/src/pages/ErpResourcesNav.jsx`](../../frontend/src/pages/ErpResourcesNav.jsx) réutilise le même objet.

Ce n'est ni une liste renvoyée par le backend, ni les capabilities du registre. En parallèle, [`frontend/src/erp/modulesConfig.js`](../../frontend/src/erp/modulesConfig.js) contient un catalogue statique bien plus large (fournisseurs, devis, paiements, entrepôts, documents, achats, mouvements, agenda, projets et autres) utilisé par la route générique `ErpModule`. Il existe donc deux sources frontend statiques incohérentes, plus une troisième source backend (interface adapter et probe de capabilities). Phase 11.2 doit les réconcilier par réutilisation d'un seul catalogue capability-aware; elle ne doit pas simplement remplacer « 5 » par une liste plus longue.

## Administration existante et décision de réutilisation

### Existe déjà

- `ERPRegistry` : connecteur Dolibarr réel tenant-scoped, credentials chiffrés, CRUD sous `/api/erp-registry`, health/capabilities/test et audit events.
- `ExternalResourceLink` : relation tenant-scoped local ↔ external pour les commandes par contrat.
- Integration Hub : `/api/integrations/connectors`, credentials, synchronizations, webhooks, diagnostics; permissions `integration:read`, `integration:write`, `integration:execute`, `integration:credential:*`, `integration:diagnostic:read`.
- Le Hub permet à un administrateur de créer/valider/activer/désactiver/archiver un connecteur générique et de déclarer des capabilities JSON.

### Limite essentielle

Le modèle Hub `Connector` est global, sans `tenantId`, et son `healthCheck` utilise `MockIntegrationProvider`; ce n'est pas le chemin Dolibarr réel. Le registre ERP est celui qui porte les deux boutiques. Le contrôle admin existant est donc **à réutiliser pour les primitives/permissions UI**, mais **pas à substituer** au `ERPRegistry` tenant-scoped et à son `ErpCapabilityService`.

### Recommandation Phase 11.2

1. Conserver `ERPRegistry` comme autorité de configuration et de santé Dolibarr par tenant.
2. Exposer un catalogue dérivé du couple **adapter implémenté + probe réel + contrats exécutables**, sans déclarer AVAILABLE lorsque la preuve manque.
3. Corriger le catalogue/probe Agenda et documenter les routes non standard avant d'afficher de nouvelles cartes.
4. Étendre les contrats et le Data Runtime seulement pour les ressources réellement validées; ne pas annoncer les méthodes interface comme des opérations utilisables.
5. Réutiliser les permissions ERP pour l'ERP tenant-scoped; ne pas accorder `integration:write` au simple compte ERP afin de contourner le registre.

## Gaps confirmés, sans implémentation en Phase 11.1

| Domaine | Constat | Décision Phase 11.2 |
| --- | --- | --- |
| Capability probe | 18 entrées seulement; Agenda `/agenda` est erroné; aucune sonde de Supplier, Service, User, Category, etc. | COMPLETE catalogue de probes non destructifs |
| Contrats | Les contrats Customer/Product/Order/Agenda existent, mais `customer.read`, `product.read`, `order.read` ne sont pas dispatchés dans `ErpCommandService.invoke()` | FIX avant exposition catalogue de contrats |
| Data Runtime | limité à Product, Client, Order, Stock | ADAPT seulement aux resources prouvées |
| Sync | aucun moteur de sync par ressource; liens externes seulement après commande | NE PAS présenter comme synchronisation |
| Mapping | mapper riche, mais tests unitaires détaillés concentrés sur Client/Product/Order/Stock | COMPLETE tests au fur et à mesure des ressources retenues |
| UI | dashboard cinq cartes hardcodées; config modules large mais statique | REUSE puis unifier, sans réécriture d'écran pendant 11.1 |
| Administration Hub | administration générique globale, health mock | KEEP séparé; ne pas l'utiliser comme source de vérité ERP tenant |
| Factures/Stock | module désactivé et droits fournisseur insuffisants | BLOCKED EXTERNAL : administrateur Dolibarr |

## Base de données

**DATABASE CHANGE REQUIRED : NO pour Phase 11.1.** L'audit a trouvé `ERPRegistry`, `ExternalResourceLink`, `Connector`, `CredentialReference`, `Synchronization` et `IntegrationLog`. Aucun changement de persistance ne permettrait de résoudre les permissions/modules Dolibarr ou de transformer une capability non prouvée en capability réelle. La nécessité d'une migration future reste **UNKNOWN** tant qu'un catalogue de capabilities tenant-scoped précis n'est pas spécifié en Phase 11.2.

## Validation effectuée

- Audit Dolibarr lecture seule : `node scripts/erp-dolibarr-account-audit.cjs` — 7 requêtes, toutes `200`.
- Sonde connecteur réelle WiFi/IT : les deux connexions sont configurées; la sonde IT a obtenu `200` et les 18 résultats détaillés de capability.
- Reproduction facture : `GET /api/erp/invoices` → `502 / ERP_PERMISSION_DENIED` avec traceId, corroborée par un `403` Dolibarr de la sonde.
- Tests ciblés : 7 suites, 169 tests passants (adapter, mapper/timeout, erreurs HTTP, resolver tenant, registre, provider Data Runtime, autorisation Integration Hub).
- Historique : `2cb9021f` a introduit capabilities, contracts, command service, external links et le seed boutiques; `1d74ec18` a réparé le wiring/diagnostic tenant. Aucun changement de code n'a été fait par cette phase d'audit.
