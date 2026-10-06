# ERP INTEGRATION — PHASE 10 GAP MATRIX

**Date :** 2026-10-06
**Mission :** Phase 10 — Audit + Restauration + Consolidation ERP Adapter / Integration Hub
**Branche :** `mami` (baseline `a178c17f`, origin/mami同步)
**CDC de référence :** `Cahiers de charges/CDC_ERP_ADAPTER_INTEGRATION_HUB_TECHZONE_CLOUD_V2.md` + `CDC_ERP_ADAPTER_INTEGRATION_HUB_V2_REGENERE.md`
**Méthode :** `READ → DISCOVER → AUDIT → COMPARE WITH CDC → CLASSIFY → REUSE → REPAIR → COMPLETE → TEST → E2E`
**Précédent :** `docs/audit/ERP_GAP_MATRIX_CDC_V2.md` (2026-10-01, plan C1–C8/D/E) + `docs/audit/DOLIBARR_CONNECTION_FIX_REPORT.md` (2026-09-28)

---

## 1. Décision sur les deux CDC

Les deux CDC sont **architecturalement identiques** (même flux `Module → Integration Contract → Integration Hub → ERP Adapter → Dolibarr`, même responsabilités). Le CDC régénéré ajoute du détail (§ pipeline command/query, § conflict strategies, § webhook dedup) mais **n'introduit aucune architecture concurrente**. **Décision : aucune divergence à arbitrer — les deux sont satisfaits par la même implémentation.** Aucune troisième architecture inventée.

## 2. Séparation des 3 responsabilités (mission §5)

| Concept | Localisation réelle | Statut |
|---|---|---|
| **A. ERP Adapter** (connecteur Dolibarr spécialisé) | `backend/src/erp-adapter/` (`dolibarr.adapter.ts` 1127 l., `erp-adapter.service.ts`, `erp-adapter.controller.ts` 1305 l.) | EXISTANT, réutilisé |
| **B. Integration Hub** (infrastructure générique) | `backend/src/modules/integration/` (connectors, credentials, synchronizations, webhooks, diagnostics, api-manager) | EXISTANT, réutilisé |
| **C. API Integration Manager** (exposition APIs Techzone) | `backend/src/modules/integration/api-manager/` | EXISTANT, distinct de l'ERP Adapter — non fusionné |

## 3. ROOT CAUSE de « configuration ERP perdue »

1. **Où vit la configuration :** table `erp_registry` (modèle `ERPRegistry`), tenant-scoped (`tenantId`, `@@unique([tenantId, code])`).
2. **Ce que contient la DB :** **1 seule ligne**, pour le tenant `techzone-test` (`8031055e-14af-4b43-979f-904e820306e9`), `capabilities: {}` (aucune clé chiffrée — repose sur le fallback env `DOLIBARR_TENANT_ID`/`DOLIBARR_API_KEY`).
3. **Pourquoi elle semble perdue :** les **deux boutiques Phase 7** (`techzone-wifi-services` = `0cf0f403-…`, `techzone-informatique` = `672202ea-…`) n'ont **aucune ligne** `erp_registry`. Au switch tenant, `ErpRegistryService.getActiveForTenant` lève `ERP_INSTANCE_NOT_CONFIGURED` (503) → l'utilisateur voit « configuration perdue ».
4. **Contexte historique :** le rapport 2026-09-28 documentait un registre **vide** (0 ligne) + `DOLIBARR_API_KEY` absente. Depuis, la clé API a été fournie dans `backend/.env.local` (valide, vérifiée) et une ligne `techzone-test` a été créée — mais les deux boutiques Phase 7 n'ont jamais été provisionnées.

## 4. Connectivité Dolibarr réelle (vérifications du 2026-10-06)

| Sonde | Résultat |
|---|---|
| `GET /` (racine) | HTTP 200 (HTML) — instance joignable |
| `GET /api/index.php/status` | HTTP 200, `dolibarr_version: 23.0.3`, `environment: non-production` |
| `GET /api/index.php/thirdparties?limit=5` (clé valide) | HTTP 404 `Not Found: No third parties found` = collection vide (route existe) |
| `GET /api/index.php/products?limit=5` (clé valide) | HTTP 200 `[]` |
| `GET /api/index.php/thirdparties` (clé invalide) | HTTP 401 `Error user not valid` → **la clé valide est confirmée** |

**Conclusion : DOLIBARR_REACHABLE + AUTH_PASS.** Le credential existe et fonctionne. Aucun `MISSING_EXTERNAL_CREDENTIAL`.

## 5. Matrice des capabilities réelles (sondée sur le Dolibarr réel, 2026-10-06)

La clé API de recette a des **droits limités**. Capacités déterminées par sonde réelle (GET limit=1 pour les reads ; POST corps vide non destructif pour les creates — une 400 « champ manquant » prouve la route sans créer de données) :

| Capability | Sonde réelle | Statut réel |
|---|---|---|
| `customer.read` | GET /thirdparties → 404 « No third parties found » | **AVAILABLE** (collection vide, route+clé OK) |
| `customer.create` | POST /thirdparties {} → 400 « name field missing » | **AVAILABLE** |
| `product.read` | GET /products → 200 `[]` | **AVAILABLE** |
| `product.create` | POST /products {} → 400 « ref field missing » | **AVAILABLE** |
| `order.read` | GET /orders → 200 `[]` | **AVAILABLE** |
| `order.create` | POST /orders {} → 400 « socid field missing » | **AVAILABLE** |
| `agenda.read` | GET /agendaevents → 200 | **AVAILABLE** |
| `agenda.create` | POST /agendaevents {} → 400 « userownerid field missing » | **AVAILABLE** |
| `invoice.read` | GET /invoices → 403 Forbidden | **UNAVAILABLE** (droits insuffisants) |
| `invoice.create` | POST /invoices {} → 403 « Insufficiant rights » | **UNAVAILABLE** |
| `supplierorder.read/create` | 403 | **UNAVAILABLE** |
| `warehouse.read/create` | 403 | **UNAVAILABLE** |
| `stockmovement.read` | 403 | **UNAVAILABLE** |
| `project.read/create` | 403 | **UNAVAILABLE** |
| `payment.create` | POST /payments → 501 « API not found » | **UNAVAILABLE** (non exposé par Dolibarr 23.0.3) |

→ Le connecteur réel est **DEGRADED** (capacités métier critiques invoice/payment indisponibles), jamais un faux AVAILABLE.

## 6. GAP MATRIX (colonnes requises)

Légende STATUS : WORKING · PARTIAL · BROKEN · MISSING · LEGACY · UNUSED · UNKNOWN
Légende DECISION : KEEP · IMPROVE · COMPLETE · ADAPT · IMPLEMENT · REMOVE-DEAD-CODE · PRESERVE-UNKNOWN

| FEATURE | CDC EXPECTED | CURRENT BACKEND | CURRENT FRONTEND | DATABASE | TESTS | STATUS | DECISION | FILES | NOTES |
|---|---|---|---|---|---|---|---|---|---|
| ERP Adapter | connecteur Dolibarr encapsulé | `erp-adapter/` complet (1127 l.) | — | — | 3 specs | WORKING | KEEP | `erp-adapter/dolibarr/dolibarr.adapter.ts` | REST client, SSRF, timeout, retry safe-reads |
| Dolibarr Client | axios + headers + pagination + erreurs | `dolibarr.adapter.ts` | — | — | 1 spec | WORKING | KEEP | `erp-adapter/dolibarr/*` | DOLAPIKEY, `/api/index.php`, gestion 404 vide Dolibarr 23 |
| Connector Registry | tenant-scoped (RG-INT-001) | `ERPRegistry` tenant-scoped ✅ ; Hub `Connector` sans tenantId ❌ | ERPList/Create/Edit | `erp_registry` (tenantId, unique[tenantId,code]) ; `connectors` (pas tenantId) | specs isolation | PARTIAL | ADAPT | `erp-registry/*`, `modules/integration/connectors/*` | **D1** : ERPRegistry = connecteur ERP tenant-scoped (réutilisé). Hub Connector = concept générique distinct, non utilisé par les boutiques — scoping C1 différé/documenté |
| Connector configuration | tenant-scoped, URL validée | `ERPRegistry` CRUD + `validateDolibarrUrl` | ERPList | `erp_registry.url` | specs | WORKING | KEEP | `erp-registry/erp-registry.service.ts`, `dolibarr-destination.ts` | URL depuis registre uniquement (SSRF) |
| Tenant scope | isolation stricte A↔B | `tenantId` vérifié sur tout /erp-registry + /erp/* | tenant switch | `tenantId` index | specs isolation | WORKING | KEEP | `erp-registry.service.ts`, `erp-adapter.service.ts` | WiFi ne peut lire/exécuter le connecteur IT |
| Credentials | credentialRef/secretRef, jamais exposés | AES-256-GCM (tenantId AAD) + `safeErpRegistry` masque | jamais | `capabilities.encryptedApiKey` | specs creds | WORKING | KEEP | `erp-credentials.ts` | credentialStatus CONFIGURED/MISSING seulement |
| Capabilities | réelles, testées | JSON `capabilities` (env/entity/key) — **pas de détection réelle** | — | `capabilities` JSON | — | BROKEN | COMPLETE | `erp-adapter.service.ts` | **C2** : ajouter `ErpCapabilityService` (sonde réelle Dolibarr) |
| Contracts | stables, versionnés | `modules/integration/contracts/` (interfaces) + `Contract` DB (API contracts, autre concept) | specifications tab | `contract` (API contracts) | 2 specs | PARTIAL | COMPLETE | `modules/integration/contracts/*` | **D2** : registry de contrats ERP en code (customer.create.v1…) |
| Resource mapping | centralisé, versionné | `EntityMapping` (entity↔erpEntity, fieldMappings JSON, version) | Mapping.jsx (statique) | `entity_mapping` (tenantId, unique[tenantId,erpId,entity]) | — | PARTIAL | IMPROVE | `erp-registry/`, `frontend/pages/Mapping.jsx` | **D3** : appliquer le mapping dans le pipeline + CRUD UI |
| Field mapping | champ à champ contrôlé | `fieldMappings` JSON (non appliqué côté adapter) | Mapping.jsx | `entity_mapping.field_mappings` | — | PARTIAL | COMPLETE | `dolibarr.mapper.ts` | **C3** : centraliser l'application du mapping |
| Queries | GET/LIST/SEARCH normalisées | GET /erp/* (clients, products, orders…) | ErpModule tables | — | 3 specs | WORKING | KEEP | `erp-adapter.controller.ts` | réponse normalisée Techzone |
| Commands | create/update structurés | POST/PUT/DELETE /erp/* | ErpModule forms | — | 3 specs | WORKING | KEEP | `erp-adapter.controller.ts` | create client/product/order |
| External IDs | local↔external préservé | **aucun modèle** | — | — | — | MISSING | IMPLEMENT | nouveau `ExternalResourceLink` | **D4** : migration additive + modèle + service |
| Sync | ON_DEMAND/EVENT/SCHEDULED | `synchronizations/` (pipeline run/resume/pause/checkpoint) | ErpSynchronizations | `synchronizations` | 1 spec | WORKING | KEEP | `modules/integration/synchronizations/*` | ON_DEMAND réel ; SCHEDULED phase 2 |
| Webhooks | authentifiés, dédupliqués | inbound (HMAC) + outbound (signature, retry, idempot) | WebhookManagerView | `webhooks`, `webhook_deliveries`, `webhook_event` | 1 spec | WORKING | KEEP | `modules/integration/webhooks/*` | Dolibarr actuel n'en dépend pas |
| Idempotency | sur creates sensibles | `IdempotencyService` (sync) ; **aucune clé sur commands ERP** | — | — | — | PARTIAL | COMPLETE | `common/resilience/idempotency.service.ts` | **C4** : clé Idempotency-Key sur creates ERP |
| Retry | timeout/429/5xx uniquement | adapter : safe-reads 408/429/502/503/504, max 2, backoff | — | — | 1 spec | WORKING | KEEP | `dolibarr.adapter.ts` | pas de retry sur 400/401/403 |
| Timeout | tout appel externe | 10s wall-clock `AbortSignal.timeout` + axios timeout | 15s client | — | 1 spec | WORKING | KEEP | `dolibarr.adapter.ts` | budget absolu DNS→response |
| Health | config/creds/reach/auth/capabilities distincts | `/erp/health` public (REGISTERED, pas CONNECTED) + `/erp/health/tenant` (CONNECTED/DEGRADED/UNAVAILABLE/NOT_CONFIGURED) | ERPDashboard | `erp_registry.healthStatus` | — | PARTIAL | IMPROVE | `erp-adapter.controller.ts` | **C5** : health tenant = capabilities réelles (DEGRADED si invoice/payment UNAVAILABLE) |
| Diagnostics | structurés, secrets masqués | `diagnostics/` (recherche logs tenant-scoped, redaction) + `IntegrationLog` | IntegrationDiagnosticsView | `integration_logs` (tenantId) | 1 spec | WORKING | KEEP | `modules/integration/diagnostics/*` | request diagnostics à enrichir (C6) |
| Error translation | codes structurés | `ErpError` + `AllExceptionsFilter` (DolibarrError→structuré) + `fromDolibarr` (401→AUTH_FAILED, 403→PERMISSION_DENIED…) | apiClient mapping | — | 11 specs filtre | WORKING | KEEP | `erp-error.ts`, `common/filters/all-exceptions.filter.ts` | `{code,message,traceId,connector}` conforme §30 |
| Audit | événements sensibles | `auditEvent` (ERP_CONNECTOR_CREATED/CONFIGURED/TESTED…) | — | `audit_event` | — | WORKING | KEEP | `erp-registry.service.ts` | aucun secret dans l'audit |
| Observability | traceId corrélation | `integrationRequestContext` (AsyncLocalStorage traceId) + `X-Trace-Id` | traceId affiché | — | — | WORKING | KEEP | `common/integration-request-context.ts` | — |
| IAM | RBAC tenant-scoped (Phase 8) | `@Permissions(ERP_READ/WRITE)` + `INTEGRATION_*` | gating nav | `role_assignment` | specs IAM | WORKING | KEEP | `iam/iam.constants.ts` | application_manager a erp:read ; erp:write admin |
| Data Runtime intégration | Runtime→ERP Provider→Hub→Adapter | `data-runtime/data-access/erp-adapter.provider.ts` | DataRuntime | — | specs data-runtime | WORKING | KEEP | `data-runtime/data-access/erp-adapter.provider.ts` | chaîne §23 réalisée |
| Automation intégration | actions ERP_* enregistrées | **0 action ERP_*** | AutomationCockpit | — | — | MISSING | DEFER | — | **C7** : phase ultérieure (hors périmètre GO) |
| Pack Manager intégration | manifest déclare connector | manifest sans connectorRequirements | PackManager | `pack_manifest` | — | MISSING | DEFER | — | **C8** : phase ultérieure (hors périmètre GO) |
| Pack Runtime intégration | vérifie requirements | 0 hit CONNECTOR_CAPABILITY_MISSING | — | — | — | MISSING | DEFER | — | **C8** : phase ultérieure (hors périmètre GO) |
| Frontend ERP workspace | Vue d'ensemble/Config/Ressources/Mappings/Diagnostics | ERPDashboard + ErpModule(28) + ERPList + Mapping + ErpSynchronizations + Settings + Adapters | ✅ réel | — | 4 specs panel | PARTIAL | COMPLETE | `frontend/src/erp/*`, `frontend/src/pages/*` | **D** : ajouter Test Connection réel + capabilities + statut connecteur |
| Browser UX | états LOADING/LOADED/EMPTY/ERROR/FORBIDDEN/UNAVAILABLE/CHECKING | useErpResources (UNCONFIGURED/FORBIDDEN/UNAVAILABLE/ERROR/LOADED/EMPTY) | ✅ | — | erp.test.jsx | WORKING | KEEP | `frontend/src/erp/useErpResources.js` | — |
| Provisioning boutiques | 2 connecteurs tenant-scoped | **0 ligne** pour wifi/IT | — | `erp_registry` (1 ligne techzone-test) | — | MISSING | IMPLEMENT | `prisma/seed-erp-boutiques.ts` | ** cœur de la mission** : provisionner wifi + IT |

---

## 7. Décisions architecturales documentées

- **D1 — Connecteur ERP = `ERPRegistry` (réutilisé, pas dupliqué).** Le `ERPRegistry` est déjà le registre de connecteurs ERP tenant-scoped (tenantId, url, status, capabilities chiffrées, healthStatus). Le `Connector` du Hub est un concept générique distinct (SAP/Stripe/…) non utilisé par le chemin ERP des boutiques. Conformément à la mission §5 (« ne pas fusionner artificiellement ») et §14 (« ne pas dupliquer un modèle existant »), le connecteur ERP/Dolibarr des boutiques est le `ERPRegistry`. Le scoping tenant du `Connector` Hub (C1) est documenté comme écart restant — hors périmètre GO car aucune boutique ne le consomme.
- **D2 — Contrats d'intégration ERP en code (registry versionné).** Conformément CDC §26 (« ne pas créer un énorme moteur générique »), les contrats ERP (`customer.create.v1`, `product.read.v1`…) sont un registry TypeScript versionné avec validation d'entrée/sortie, consommé par le pipeline command/query. Pas de nouvelle table.
- **D3 — Capabilities réelles sondées.** `ErpCapabilityService` sonde le Dolibarr réel (reads GET limit=1 ; creates POST corps vide non destructif) et stocke la matrice dans `ERPRegistry.capabilities.capabilities` + `lastCapabilityCheck` + `providerVersion`. CONFIGURED ≠ AVAILABLE (RG-INT-003/004).
- **D4 — ExternalResourceLink (migration additive).** Nouveau modèle tenant-scoped pour préserver local ID ↔ external ERP ID (CDC §15/§25, E2E mission §46). `@@unique([tenantId, connectorId, resourceType, localId])`. Aucune migration existante modifiée.
- **D5 — Credential réutilisé, pas inventé.** La `DOLIBARR_API_KEY` valide de `backend/.env.local` est chiffrée par tenant via `encryptErpKey(apiKey, tenantId)` (AAD = tenantId). Chaque boutique a sa propre copy chiffrée isolée — aucun secret partagé en clair, aucun fallback inter-tenant.
- **D6 — Codes connecteur distincts par tenant.** `ERPRegistry.code` est globalement unique (`@unique`). Les deux boutiques utilisent des codes distincts (`dolibarr_wifi_services`, `dolibarr_informatique`) → connectorId distinct + ownership tenant distinct (mission §16/§48).

## 8. Synthèse

| Catégorie | Détail |
|---|---|
| WORKING (KEEP) | ERP Adapter, Dolibarr Client, configuration, tenant scope, credentials, queries, commands, sync, webhooks, retry, timeout, error translation, diagnostics, audit, observability, IAM, Data Runtime, frontend resources |
| COMPLETE (ce phase) | Capabilities réelles (C2), health réel avec capabilities (C5), test connection pipeline, contrats ERP (D2), ExternalResourceLink (D4), provisioning boutiques, idempotence creates (C4), frontend Test Connection/capabilities |
| IMPROVE | Resource/Field mapping appliqué (C3/D3), diagnostics request (C6) |
| DEFER (hors périmètre GO) | Automation ERP actions (C7), Pack Manager/Runtime connector requirements (C8), Hub Connector tenant-scoping (C1), scheduled sync avancé, circuit breaker |

## 9. Périmètre GO (mission §65)

Le GO requiert : audit ✅ + réutilisation ✅ + config tenant-scoped (provisioning) + WiFi connector fonctionnel + IT connector fonctionnel + connexion Dolibarr testée ✅ + health réel + capabilities réelles + cross-tenant bloqué + credentials protégés + tests/builds PASS + aucune migration historique modifiée.
