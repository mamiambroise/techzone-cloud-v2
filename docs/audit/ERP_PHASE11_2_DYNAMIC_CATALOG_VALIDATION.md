# ERP Phase 11.2 — Dynamic Catalog Validation

Date: 2026-10-06

## Canonical catalog

`backend/src/erp-adapter/catalog/erp-resource-catalog.ts` is the sole technical source of truth for the ERP resource catalog. It contains the 29 resources enumerated in the Phase 11.2 brief (the Phase 11.1 wording said 28 while also listing Category and ERP Stats), their category, provider, adapter implementation state, operations, capability names, probe support, contract support, mapping support and ERP API route metadata.

The effective tenant catalog is exposed by `GET /api/erp/catalog`. It combines:

1. the immutable canonical definitions;
2. the platform resource policy;
3. the active tenant-scoped `ERPRegistry` connector;
4. persisted real capability evidence from that connector.

The response intentionally excludes URL credentials, `encryptedApiKey`, `apiKey`, credential references and connector identifiers. It returns only the connector code/type/health summary needed by the UI.

## Provider capabilities and classification

The capability probes are defined beside the catalog instead of in an unrelated local array. There are 30 non-destructive probes. Reads use limited collections; writes use an invalid payload or a fictitious identifier and never create a business record.

- Agenda is corrected to `GET/POST /agendaevents`, matching `DolibarrAdapter`.
- Payment read uses `/paiements`, matching the adapter; payment create remains `POST /payments` and `501` becomes `NOT_SUPPORTED`.
- Invoice, warehouse and stock-related `403` responses retain the documented `MODULE_DISABLED` evidence.
- Other `403` responses are `PERMISSION_DENIED`; an update against ID `0` producing `5xx` remains `UNKNOWN`.
- Timeout is `UNAVAILABLE`; unclassified provider failure is `ERROR`.

`AVAILABLE` is never inferred from `adapterImplemented` or `platformAllowed`. A resource can be implemented and platform-authorized while remaining `MODULE_DISABLED`, `PERMISSION_DENIED`, `NOT_SUPPORTED`, `UNKNOWN` or `NOT_IMPLEMENTED`.

## Platform administration policy

The existing generic `Configuration` storage is reused, with a global `PLATFORM` configuration key `erp.resource-policy`; no schema or migration change is required. The default is allow-all. A policy record is written only when a platform administrator changes an override.

`PATCH /api/erp/catalog/policy/:resourceKey` accepts only a boolean `platformAllowed`, validates the catalog key and writes an `AuditEvent` with actor, resource, old value, new value and timestamp. The route is protected by both `iam:admin` and `IamAdminGuard`. `application_manager` can read its effective ERP catalog through `erp:read`, but cannot read or change platform policy.

The policy is not a Dolibarr permission writer. It does not modify external modules, rights or credentials.

## Frontend migration

`useErpResources.js` no longer owns a five-resource `ERP_RESOURCES` list. It loads one `/api/erp/catalog` response for the active tenant and cancels stale responses after a tenant change. The dashboard and resource navigation render the dynamic catalog by category, with compact status cards, filters, loading/error/empty states and no automatic loading of 29 business collections.

`modulesConfig.js` remains only the presentation/action mapping used by existing detailed resource screens; it is not used to determine availability.

The dashboard exposes the existing real connector test (`POST /api/erp-registry/test`) as “Tester les capabilities”. A policy toggle is rendered only for an `iam:admin`/superadmin principal. Its final default state is allow-all.

## Contracts and scope boundaries

`ErpCommandService.invoke()` now dispatches `customer.read@1`, `product.read@1` and `order.read@1` to their existing list semantics. No contract expansion to the whole catalog was made. The Data Runtime remains restricted to its existing Product, Client, Order and Stock scope; no synchronization engine is claimed or created.

`ERPRegistry` remains the tenant-scoped Dolibarr authority. The global Integration Hub connector and its mock health provider are not used for catalog health or tenant resolution.

## Validation

- `npx prisma validate`: PASS.
- `npx prisma generate`: PASS.
- Backend targeted tests: PASS (5 suites, 23 tests), covering catalog completeness/keys, status classification, corrected Agenda probes, effective availability, policy audit persistence, secret masking/tenant connector resolution and contract read dispatch.
- Frontend catalog tests: PASS (5 tests), covering one metadata call, loading/error state and stale tenant cancellation.
- `npx nest build`: PASS.
- `npx vite build`: PASS.
- Full backend suite: PASS (75 suites, 721 tests).
- Full frontend suite: PASS (25 suites, 264 tests; 3 suites / 8 tests explicitly skipped).
- The local stack was relaunched with `npm run dev`; frontend, backend and legacy Dolibarr listener are UP. The legacy ERP was not modified.
- Real tenant recipe (`techzonetest`): WiFi and IT each completed `POST /api/erp-registry/test` with HTTP `200` / connector `AVAILABLE`, then `GET /api/erp/catalog` with HTTP `200`. Each catalog has 29 resources, 7 `AVAILABLE`, 6 `PERMISSION_DENIED`, 3 `MODULE_DISABLED`, 5 `NOT_SUPPORTED`, 5 `NOT_IMPLEMENTED`, 2 `UNKNOWN` and 1 `ERROR`; all resources are platform-allowed by default. The two connector codes remain distinct and no secret or connector ID was present in either response.
- Corrected Agenda probe: `agenda.read` and non-destructive `agenda.create` are both `AVAILABLE` on the real provider. `payment.create` is explicitly `NOT_SUPPORTED` (`501`); payment read remains provider-permission-denied on the audited account.
- The non-admin application account receives `403` on `GET /api/erp/catalog/policy`, proving it cannot access or mutate the platform policy.
- Browser recipe: PASS for WiFi → Informatique → WiFi. Each tenant renders 29 resource cards; no horizontal overflow was detected at 320, 768, 1024 or 1440 px.

## Remaining external blockers

The catalog represents these real provider conditions rather than hiding them:

- Invoice: external Dolibarr Invoice module/rights remain blocked.
- Stock and stock-derived resources: external stock module/rights remain blocked or unproven.
- Supplier order: provider permission remains external.
- Payment create: Dolibarr REST returns `501`, therefore `NOT_SUPPORTED`.

No database migration is required for Phase 11.2.
