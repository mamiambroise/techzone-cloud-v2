# ERP Phase 11.3 — Runtime capability enforcement

Date: 2026-10-06. No migration is required.

## Execution boundary

`erp-resource-catalog.ts` remains the single technical catalog. It now also declares the canonical binding between every exposed adapter method and its resource operation. `ErpResourceRuntimeService` wraps every tenant-resolved adapter returned to the ERP REST controller and calls `ErpResourceCatalogService.getOperationDecision()` before delegation.

The decision is fail-closed and requires: an existing canonical resource and operation, the relevant IAM permission (`erp:read` or `erp:write`), an active tenant connector, platform policy, mapping when requested, `AVAILABLE` provider capability, and a real Techzone adapter operation. Contract execution calls the same service and additionally requires the declared contract support. No secret, connector identifier or provider URL appears in decisions or UI data.

Normalized refusals are `ERP_PERMISSION_DENIED`, `ERP_PROVIDER_MODULE_DISABLED`, `ERP_OPERATION_NOT_SUPPORTED`, `ERP_OPERATION_NOT_IMPLEMENTED`, `ERP_CAPABILITY_UNKNOWN`, `ERP_PROVIDER_UNAVAILABLE`, `ERP_PLATFORM_DISABLED`, `ERP_RESOURCE_DISABLED`, and `ERP_CONTRACT_UNAVAILABLE`.

## Live matrix

Result from the real tenant sequence WiFi → Informatique → WiFi after capability probes. `R` means a currently executable read operation for the authenticated account; other operations remain fail-closed unless their own capability becomes `AVAILABLE`. Platform policy is allow-all for every row.

| Resource | Category | Ops / contract / mapping | WiFi | Informatique | Recommended action |
|---|---|---|---|---|---|
| customer | commercial | R,C,U,D / yes / FULL | AVAILABLE R | AVAILABLE R | Priority 1, operate read now |
| supplier | commercial | R,C,U,D / no / PARTIAL | AVAILABLE R | AVAILABLE R | Priority 2, read only |
| product | commercial | R,C,U,D / yes / FULL | AVAILABLE R | UNAVAILABLE | Priority 1; restore IT provider |
| service | commercial | R,C / no / FULL | AVAILABLE R | AVAILABLE R | Read only |
| productVariant | commercial | R / no / FULL | ERROR | ERROR | Verify provider endpoint |
| order | commercial | R,C,U,D / yes / FULL | AVAILABLE R | UNAVAILABLE (R evidence) | Priority 1; restore IT probe |
| supplierOrder | commercial | R,C / no / FULL | PERMISSION_DENIED | PERMISSION_DENIED | Grant Dolibarr right |
| quote | commercial | R,C,U,D / no / FULL | PERMISSION_DENIED | PERMISSION_DENIED | Grant Dolibarr right |
| invoice | finance | R,C,U,D / no / FULL | MODULE_DISABLED | MODULE_DISABLED | Enable invoice module/right |
| payment | finance | R,C / no / PARTIAL | PERMISSION_DENIED | PERMISSION_DENIED | Read needs provider right; create is NOT_SUPPORTED (501) |
| stock | stock-logistics | R,U / no / FULL | UNKNOWN | UNKNOWN | Probe/module validation before use |
| warehouse | stock-logistics | R,C,U,D / no / FULL | MODULE_DISABLED | MODULE_DISABLED | Enable stock/warehouse module |
| stockMovement | stock-logistics | R,C / no / FULL | MODULE_DISABLED | MODULE_DISABLED | Enable stock module |
| stockTransfer | stock-logistics | R,C,U / no / FULL | NOT_SUPPORTED | NOT_SUPPORTED | Do not expose action |
| inventory | stock-logistics | R,C,U / no / FULL | NOT_SUPPORTED | NOT_SUPPORTED | Do not expose action |
| stockAlert | stock-logistics | R,C / no / PARTIAL | NOT_IMPLEMENTED | NOT_IMPLEMENTED | Integrate later |
| shipment | stock-logistics | R,C,U / no / FULL | PERMISSION_DENIED | PERMISSION_DENIED | Grant Dolibarr right |
| document | collaboration | R,C,D / no / FULL | UNKNOWN | UNKNOWN | Verify capability |
| return | stock-logistics | R,C,U / no / FULL | NOT_SUPPORTED | NOT_SUPPORTED | Do not expose action |
| promotion | other | R,C,U,D / no / FULL | NOT_SUPPORTED | NOT_SUPPORTED | Do not expose action |
| purchase | commercial | R,C,U / no / FULL | PERMISSION_DENIED | PERMISSION_DENIED | Grant Dolibarr right |
| cashRegister | finance | R,C,U / no / FULL | NOT_SUPPORTED | NOT_SUPPORTED | Do not expose action |
| expense | finance | R,C,D / no / NONE | NOT_IMPLEMENTED | NOT_IMPLEMENTED | Integrate later |
| reservation | other | R,C,U / no / NONE | NOT_IMPLEMENTED | NOT_IMPLEMENTED | Integrate later |
| agenda | collaboration | R,C,U,D / `agenda.read` / FULL | AVAILABLE R (create capability AVAILABLE) | UNAVAILABLE | Priority 1 on WiFi; creation only after explicit user action |
| project | collaboration | R,C,U / no / FULL | PERMISSION_DENIED | PERMISSION_DENIED | Grant Dolibarr right |
| user | collaboration | R / no / PARTIAL | AVAILABLE R | AVAILABLE R | Read only |
| category | other | R,C,U,D / no / NONE | NOT_IMPLEMENTED | NOT_IMPLEMENTED | Integrate later |
| erpStats | other | R / no / NONE | NOT_IMPLEMENTED | NOT_IMPLEMENTED | Integrate later |

## UI and security

Cards and resource navigation open a route only when the exact read operation is executable. Otherwise they render the authoritative reason. A resource detail shows provider, status, operation/IAM requirement, last capability timestamp, platform policy, adapter, contract and mapping support; it contains no credential fields. The existing stale-response cancellation remains unchanged.

`iam:admin` plus `IamAdminGuard` remains required to mutate `erp.resource-policy`; the live non-admin `PATCH /api/erp/catalog/policy/customer` returned `403`. Policy changes keep their existing `AuditEvent` with actor, old/new value and timestamp. Capability tests remain audited by `ERP_CONNECTOR_TESTED` and no secret is logged.

Data Runtime remains restricted to Product, Client, Order and Stock. ERPRegistry remains tenant-scoped; no Integration Hub mock provider participates in capability decisions.

## Validation

- Prisma validate/generate: PASS.
- Nest build and Vite build: PASS.
- Targeted backend tests: PASS (54, then 55 after the explicit payment assertion).
- Full backend suite: PASS (76 suites, 732 tests).
- Full frontend suite: PASS (25 suites, 264 tests; 3 suites / 8 tests skipped).
- Live REST: catalogs returned 29 resources for WiFi → Informatique → WiFi; WiFi Agenda GET returned 200; invoice was stopped locally with `409 ERP_PROVIDER_MODULE_DISABLED`, before any provider business call.

The local legacy Dolibarr listener was not modified. Its unrelated local MySQL warning does not alter the tenant-scoped external connector evidence above.
