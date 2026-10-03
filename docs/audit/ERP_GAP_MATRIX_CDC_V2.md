# ERP GAP MATRIX — ERP Adapter / Integration Hub

**Date :** 2026-10-01
**Branche :** `mami` (baseline `d684aaf` + commits `be024b7`, `371629e`, `42c774c`)
**CDC de référence :** `Cahiers de charges/CDC_ERP_ADAPTER_INTEGRATION_HUB_TECHZONE_CLOUD_V2.md` (§48 matrice obligatoire, §49 procédure d'audit)
**Méthode :** `READ → UNDERSTAND → COMPARE → EXTRACT → ADAPT → TEST` — chaque ligne est tranchée après recherche réelle dans le code. Aucune ligne déclarée `MISSING` sans recherche préalable.
**Matrices transversales croisées :** `docs/audit/GLOBAL_IMPLEMENTATION_MATRIX.md`, `docs/audit/GLOBAL_API_MATRIX.md`.

---

## 1. Inventaire d'audit (recherches réelles effectuées)

### Backend
| Zone recherchée | Résultat |
|---|---|
| `backend/src/erp-adapter/` | `erp-adapter.controller.ts` (42 routes `@Permissions`), `erp-adapter.service.ts` (resolveAdapterForTenant, cache/tenant), `dolibarr/dolibarr.adapter.ts` (1 369 l. axios, retry exponentiel, `handleError → DolibarrError`), `dolibarr/dolibarr.error.ts`, `mock/mock.adapter.ts`, `erp-error.ts` (contrat ErpError v1), `interfaces/`, `dto/`, `trace-id.middleware.ts`, 3 specs |
| `backend/src/erp-registry/` | CRUD registre ERP tenant-scoped (`getActiveForTenant → ErpError 503 ERP_INSTANCE_NOT_CONFIGURED`) |
| `backend/src/modules/integration/` | **Hub complet existant** : `connectors/` (controller+service+DTO), `contracts/` (interfaces + 2 specs), `credentials/` (service+spec), `api-manager/` (service+spec), `diagnostics/` (service+spec), `synchronizations/` (service+spec), `webhooks/` (inbound controller, delivery, signature+spec), `integration.controller.ts` → `@Controller('api/integrations')` |
| Routes Hub | `api/integrations`, `/apis`, `/connectors`, `/credentials`, `/diagnostics`, `/synchronizations`, `/webhooks`, `api/webhooks/inbound` |
| Retry / Timeout | Dolibarr adapter : retry exponentiel + timeouts axios ; synchronizations : 17 références retry/timeout/idempot |
| Idempotency | Présent côté synchronizations ; **aucune clé d'idempotence sur les commandes ERP POST** (recherche `idempot` : 0 hit dans `erp-adapter/`) |
| Webhooks | `WebhookEvent` (Prisma), signature service + spec, delivery service |
| External IDs | `ExternalIdentityLink` (Prisma) |
| Automation ERP | Recherche `ERP_CREATE_CUSTOMER|ERP_CREATE_ORDER|ERP_SYNC|ERP_REGISTER` : **0 hit** → actions ERP absentes de l'Action Engine |
| Data Runtime | `data-runtime/data-access/erp-adapter.provider.ts` **existe** (chaîne §23 réalisée) |
| Pack Manager/Runtime | Recherche `CONNECTOR_CAPABILITY_MISSING|connector` dans pack-* : **0 hit** → vérification capabilities absente (RG-INT-021) |
| Filtre d'exceptions | `common/filters/all-exceptions.filter.ts` : ne matchait ni `DolibarrError` ni axios → **4×500 racine corrigée** (`371629e`, spec 11 tests) |

### Schéma Prisma
| Modèle | Rôle | Isolation tenant |
|---|---|---|
| `ERPRegistry` | ERP actifs (url, status, capabilities, healthStatus) | ✅ `tenantId`, unique `[tenantId, code]` |
| `EntityMapping` | Resource + Field Mapping (`entity ↔ erpEntity`, `fieldMappings Json`, `version`) | ✅ `tenantId`, unique `[tenantId, erpId, entity]` |
| `AdapterRegistry` | Adaptateurs enregistrés (process) | N/A (catalogue global) |
| `Connector` | Connector Registry Hub (providerType, credentialRef, capabilities, health) | ❌ **sans `tenantId`** |
| `IntegrationLog` | Journal d'exécution intégration | via `connectorId` |
| `ExternalIdentityLink`, `WebhookEvent`, `Synchronization`, `ApiDefinition` | Sync, webhooks, API manager | audit en cours |

### Frontend
| Surface | État |
|---|---|
| `ERPDashboard.jsx` | PARTIAL — panneau dédupliqué + état UNCONFIGURED/CTA ajoutés (`42c774c`) ; polls `/erp/health` public |
| `ErpModule.jsx` + `modulesConfig.js` | 24 modules réels (clients, produits…) avec états error/empty propres |
| Pages routes `/erp/*` | Clients/Produits/Commandes/Factures/Stocks → `ErpModule` via `moduleKeyOverride` (réel) ; `Mapping.jsx` PARTIAL ; `ERPList/ERPCreate/ERPEdit` PARTIAL ; `Settings` (settingsErp) PARTIAL ; `Adapters.jsx` réel |
| `ApiErrorBanner.jsx` | Global — suppression `/erp/*` ajoutée (plus de doubles) |
| `ErpErrorPanel.jsx` | Nouveau — panneau unique par erreur + CTA (`42c774c`, 4 specs) |
| Navigation | Groupe `erp` : Vue d'ensemble, Clients, Produits, Commandes, Factures, Stocks, Mappings, Registre, Configuration, Adaptateurs, route `erp-:moduleKey` |

### Tests (état avant Étape E)
- Backend : **52 suites / 431 tests PASS** (dont 11 specs filtre, 3 erp-adapter, 7 integration).
- Frontend : 100 tests dont **2 échecs préexistants** (`navigationIcons.test.jsx` lien « Navigation » dupliqué — lié au WIP navigation non committé ; `bmRenderRecipe.test.jsx` Écran 7 gate `PASS`).

---

## 2. Gap Matrix (§48)

Légende décision : `KEEP` conserver · `FIX` corriger l'existant · `COMPLETE` compléter l'existant · `ADAPTER` adapter à un contrat/réalité · `IMPLEMENT` créer (uniquement si réellement absent).

| # | Fonction | Existant (audit) | Backend | Frontend | Tests | Décision | Action plan |
|---|---|---|---|---|---|---|---|
| 1 | ERP Adapter | 42 routes + service + mock | ✅ | ✅ dashboard/modules | 3 specs | **KEEP + FIX** | ✅ filtre structuré `371629e` (racine des 4×500) |
| 2 | Dolibarr Client | axios + retry + `DolibarrError` | ✅ | — | 1 spec | **KEEP** | `fromDolibarr` branché au filtre ; audits retry (§17) en Étape C |
| 3 | Connector Registry | `modules/integration/connectors` + `Connector` + `AdapterRegistry` | ⚠️ sans tenant | ✅ IntegrationsView | 1 spec | **ADAPT** | **C1** : `tenantId` sur `Connector` + scoping (RG-INT-001, §12) |
| 4 | Capabilities | `capabilities Json` (Connector, ERPRegistry) | ⚠️ annonces vs impl. | partiel | — | **COMPLETE** | **C2** : vérifier annonce = impl (RG-INT-028) + déclarer capabilities Dolibarr réelles |
| 5 | Integration Contracts | `integration/contracts/` interfaces | ✅ | ✅ | 2 specs | **KEEP** | aucune action |
| 6 | Resource Mapping | `EntityMapping` + route `/erp/mappings` | ✅ | ⚠️ Mapping PARTIAL | — | **KEEP + COMPLETE** | **D** : finaliser page Mapping (CRUD + statut + version) |
| 7 | Field Mapping | `fieldMappings Json` versionné | ⚠️ non appliqué côté adapter | Mapping | — | **COMPLETE** | **C3** : centraliser l'application du mapping dans le pipeline query/command + spec |
| 8 | ERP Commands | POST create/update (clients, produits, commandes, factures…) | ✅ | ErpModule forms | 3 specs | **KEEP + COMPLETE** | **C4** : idempotence des creates sensibles (RG-INT-012, §17) — retry POST non rejouable interdit |
| 9 | ERP Queries | GET/LIST/SEARCH + filtres | ✅ | ✅ tables | 3 specs | **KEEP** | aucune action |
| 10 | Sync | `synchronizations/` + `ExternalIdentityLink` | ✅ | IntegrationsView | 1 spec | **KEEP** | stratégies de conflit §16 : documentées, UI phase 2 |
| 11 | Webhooks | inbound + signature + `WebhookEvent` | ✅ | ✅ | 1 spec | **KEEP** | audit dédup/secret (RG-INT-015/016) en Étape E |
| 12 | Idempotency | synchronizations seulement | ❌ sur commandes ERP | — | — | **IMPLEMENT** (ciblé) | **C4** : clé `Idempotency-Key` sur creates ERP + spec |
| 13 | Retry / Timeout | adapter axios (exponentiel) + sync | ✅ | timeout axios 15 s | 1 spec | **KEEP** | vérifier « pas de retry sur non-idempotent » (RG-INT-011) en Étape C |
| 14 | Health | `/erp/health` public **toujours `CONNECTED`** + `/erp/health/tenant` réel | ⚠️ faux statut public | dashboard → endpoint public | — | **FIX** | **C5** : frontend → `/erp/health/tenant` ; endpoint public ne déclare plus `CONNECTED` (RG-INT-025, §28) |
| 15 | Diagnostics | `diagnostics/` + `IntegrationLog` + traceId global | ✅ | diagnostics view | 1 spec | **KEEP + IMPROVE** | **C6** : request diagnostics (connector, operation, duration, attempts) requises par §29 |
| 16 | Error Translation | `ErpError` + **filtre corrigé** `{code,message,traceId,connector}` | ✅ `371629e` | mapping codes apiClient | 11 specs | **FIX ✅ fait** | alias `CONNECTOR_*` : seulement si requis par le Hub (non requis actuellement) |
| 17 | Automation Integration (§22) | Action Engine existe, **0 action `ERP_*`** | ❌ | cockpit ✅ | — | **IMPLEMENT** | **C7** : enregistrer `ERP_CREATE_CUSTOMER/ORDER/INVOICE`, `ERP_SYNC_PRODUCT` déléguant à l'adapter (RG-INT-023) |
| 18 | Data Runtime Integration (§23) | `erp-adapter.provider.ts` | ✅ | ✅ | specs data-runtime | **KEEP** | aucune action |
| 19 | Pack Manager Requirements (§24) | manifest **sans** déclaration connector | ❌ | — | — | **COMPLETE** (léger) | **C8** : champ `connectorRequirements` dans le manifest + validation publication |
| 20 | Pack Runtime Compatibility (§25) | 0 hit `CONNECTOR_CAPABILITY_MISSING` | ❌ | — | — | **COMPLETE** (léger) | **C8** : vérification au resolve → erreur structurée (RG-INT-021) |
| 21 | Multi-tenant (§12) | ERPRegistry/EntityMapping ✅, Connector ❌ | ⚠️ | — | specs isolation erp | **ADAPT** | couvert par **C1** |
| 22 | Credentials (§13) | `credentials/` + `credentialRef` | ✅ | jamais exposé | 1 spec | **KEEP** | vérif fuite clé (registre/health) en Étape E |
| 23 | SSRF / destinations (§35) | URL depuis registre uniquement | ✅ | pas d'URL arbitraire | — | **KEEP** | vérification sécurité Étape E |
| 24 | IAM / permissions (§33) | `@Permissions(ERP_READ/WRITE)` sur 42 routes | ✅ | gating nav | — | **KEEP** | aucune action |
| 25 | Observability / Audit (§31-32) | traceId UUID global + `IntegrationLog` + audit PM/BM | ✅ | traceId affiché | filtre spec | **KEEP** | aucune action |
| 26 | UI — 9 pages ERP | dashboard + 5 ressources (ErpModule) + Mapping + Registre + Configuration | — | ⚠️ PARTIAL | 4 specs panel | **ADAPT + COMPLETE** | **D** : 9 pages dédiées avec `ErpErrorPanel`, états (Loading/Empty/Error/UNCONFIGURED) |
| 27 | Mode démo vs réel (RG-INT-030) | `mock.adapter` + registry `MOCK` | ✅ explicite | badge `données réelles` | mock spec | **KEEP** | jamais de bascule REAL→MOCK silencieuse ; test Étape E |
| 28 | Tests §46 | 52 backend / 100 frontend | ✅ | ⚠️ 2 échecs préexistants | à étendre | **COMPLETE** | **E** : + tests tenant-cross, résilience (500→structuré), fix 2 échecs, builds PASS |

---

## 3. Écarts bloquants identifiés (synthèse)

1. **Racine des 4×500** sur `/api/erp/clients|products|orders|invoices` : `DolibarrError` jamais mappée → **CORRIGÉ** (`371629e`), format `{code,message,traceId,connector}` conforme §30.
2. **Bannières en double** : banner global + cartes dashboard → **CORRIGÉ** (`42c774c`, panneau unique dédupliqué + CTA UNCONFIGURED).
3. **`Connector` non tenant-scoped** → violation RG-INT-001/§12 → **C1**.
4. **Faux statut `CONNECTED`** de `/erp/health` consommé par le dashboard → violation RG-INT-025 → **C5**.
5. **Actions `ERP_*` absentes** d'Automation → RG-INT-023 → **C7**.
6. **Compatibilité connecteur Pack absente** → RG-INT-021 → **C8**.
7. **Idempotence des commandes ERP absente** → RG-INT-012 → **C4**.
8. **Baseline pack incohérent** (2 générations mélangées, 146 erreurs) → **CORRIGÉ** (`be024b7`).

---

## 4. Plan d'exécution découlé de la matrice

| Étape | Contenu | Lignes |
|---|---|---|
| **A (fait)** | Fix racine 500 + UI dédupliquée | #1, #2, #16, #26 partiel |
| **B (ce document)** | Gap Matrix + commit | §48-49 |
| **C** | Integration Hub manquant : **C1** tenant Connector · **C2** capabilities réelles · **C3** mapping appliqué · **C4** idempotence + retry-safe · **C5** health réelle · **C6** request diagnostics · **C7** actions ERP Automation · **C8** connector requirements Pack | #3, #4, #7, #8, #12, #14, #15, #17, #19, #20, #21 |
| **D** | 9 pages ERP frontend + navigation | #6, #26 |
| **E** | Tests (fix 2 échecs + tenant/résilience), builds, prisma PASS, preuves | #28 + DONE §50 |

---

## 5. Conformité DONE (§50) — état cible

- ✅ ERP Adapter préservé et consolidé (aucune réécriture — `KEEP`)
- ⬜ Connector Registry fonctionnel **tenant-scoped** → C1
- ✅ Dolibarr Connector fonctionnel (retry/timeout/DolibarrError)
- ✅ Credentials sécurisés (`credentialRef`, jamais au frontend)
- ⬜ Capabilities réelles vérifiées → C2
- ✅ Integration Contracts fonctionnels (specs)
- ⬜ Resource/Field Mapping appliqués dans les pipelines → C3/D
- ⬜ Idempotency sur opérations nécessaires → C4
- ✅ Error Translation fonctionnelle `{code,message,traceId,connector}` (Étape A)
- ✅ Timeouts configurés (axios 15 s adapter + client)
- ⬜ Retry vérifié retry-safe → C4
- ⬜ Automation intégré (actions `ERP_*`) → C7
- ✅ Data Runtime intégré (`erp-adapter.provider.ts`)
- ⬜ Pack Manager/Runtime intégrés (connector requirements) → C8
- ⬜ Health réelle (faux `CONNECTED` supprimé) → C5
- ⬜ Diagnostics request enrichis → C6
- ⬜ Tenant Isolation vérifiée (Connector) → C1 + tests E
- ✅ IAM / Audit / Observability préservés
- ⬜ Aucun faux statut AVAILABLE → C5 + tests E
- ⬜ Aucun mock silencieux en REAL → tests E
- ⬜ Prisma validate/generate · builds · tests · recette → Étape E preuves
