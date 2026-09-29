# Mock / fake / NO-OP inventory

Reviewed significant occurrences follow. The raw 164-marker index in inventory.json retains unclassified candidates as REVIEW_REQUIRED rather than falsely declaring them mocks. Production reachability is based on imported code, not authenticated execution.

| PATH | MODULE | PRODUCTION_REACHABLE | PURPOSE | STATUS |
| --- | --- | --- | --- | --- |
| frontend/src/store/applicationsSlice.js | Applications/Packs | YES | Initial hardcoded business applications and versions | MOCK_PRODUCTION |
| frontend/src/store/integrationSlice.js:1361 | Integration | YES | Random connector latency and delivery metrics | MOCK_PRODUCTION |
| frontend/src/components/integration/SyncManagerView.jsx:154 | Sync | YES | Random processed row counts | MOCK_PRODUCTION |
| frontend/src/components/integration/IntegrationContractsV1View.jsx:299 | Contracts | YES | Random duration/assertion count | MOCK_PRODUCTION |
| frontend/src/components/GeneralOverviewView.jsx | Packs | YES | Timer and success toast instead of refresh API | NO_OP |
| frontend/src/components/PublicationView.jsx | Publication | YES | Success toast without API operation | NO_OP |
| backend/src/automation/action/action.engine.ts:87 | Actions | YES | Missing handler yields SUCCEEDED | NO_OP |
| backend/src/automation/mock/mock.automation.ts | Automation | YES | Unconditionally initialized mock rules/workflows/actions | MOCK_PRODUCTION |
| backend/src/iam/iam-health.controller.ts | Readiness | YES | Ready is constant, no dependency check | NO_OP |
| frontend/src/pages/iam/observability/ObservabilityOverview.jsx:174 | Observability | YES | Static security events mixed with API data | MOCK_PRODUCTION |
| frontend/src/pages/iam/IdentitiesPage.jsx:406 | Identities | YES | Mock-named object used only for display colors here | LEGITIMATE_STATIC_DATA |
| frontend/src/pages/iam/UsersPage.jsx:4 | IAM | IMPORT_ONLY | Unused mock import; not proof of mock list | LEGITIMATE_STATIC_DATA |
| frontend/src/app/demoPages.json | Billing and demo pages | YES_EXPLICIT_PLACEHOLDER | Declared demo/placeholder screens | DEMO_ONLY |
| backend/src/erp-adapter/mock/mock.adapter.ts | ERP | CONDITIONAL | Explicit MOCK provider; not Dolibarr evidence | DEMO_ONLY |
| backend/src/automation/history/automation-history.service.ts | Automation history | YES | Volatile in-memory storage; durability missing | INCOMPLETE |
| backend/src/data-runtime/history/history.service.ts | Data history | YES | Volatile in-memory storage | INCOMPLETE |
| backend/src/common/filters/all-exceptions.filter.ts | Error trace | YES | Fallback trace identifier; not business data | LEGITIMATE_STATIC_DATA |
| frontend/src/store/platformSlice.js | Toasts | YES | Random toast ID | LEGITIMATE_STATIC_DATA |
| backend/src/**/*.spec.ts | Tests | NO | Isolated service/guard test doubles | TEST_ONLY |
| scripts/full-runtime-route-check.cjs | Review unit test | NO | Explicit unit auth context only; no live session claim | TEST_ONLY |

## Raw search index

| PATH | LINE | MARKER | TRIAGE |
| --- | --- | --- | --- |
| frontend/src/app/navigationConfig.js | 794 | demo | REVIEW_REQUIRED |
| frontend/src/app/navigationConfig.js | 795 | demo | REVIEW_REQUIRED |
| frontend/src/components/ContractsView.jsx | 157 | Math.random | REVIEW_REQUIRED |
| frontend/src/components/deployment/DeploymentContractsV1View.jsx | 95 | setTimeout | REVIEW_REQUIRED |
| frontend/src/components/deployment/DepSpecificationsView.jsx | 172 | setTimeout | REVIEW_REQUIRED |
| frontend/src/components/deployment/ReleaseManagerView.jsx | 56 | setTimeout | REVIEW_REQUIRED |
| frontend/src/components/GeneralOverviewView.jsx | 37 | setTimeout | REVIEW_REQUIRED |
| frontend/src/components/integration/ApiManagerView.jsx | 127 | Math.random | LEGITIMATE_STATIC_DATA |
| frontend/src/components/integration/ApiManagerView.jsx | 131 | Math.random | REVIEW_REQUIRED |
| frontend/src/components/integration/ApiManagerView.jsx | 175 | setTimeout | REVIEW_REQUIRED |
| frontend/src/components/integration/ApiManagerView.jsx | 177 | Math.random | LEGITIMATE_STATIC_DATA |
| frontend/src/components/integration/ApiManagerView.jsx | 181 | Math.random | REVIEW_REQUIRED |
| frontend/src/components/integration/ApiManagerView.jsx | 196 | Math.random | REVIEW_REQUIRED |
| frontend/src/components/integration/ConnectorManagerView.jsx | 93 | setTimeout | REVIEW_REQUIRED |
| frontend/src/components/integration/CredentialsManagerView.jsx | 87 | setTimeout | REVIEW_REQUIRED |
| frontend/src/components/integration/CredentialsManagerView.jsx | 152 | setTimeout | REVIEW_REQUIRED |
| frontend/src/components/integration/IntegrationContractsV1View.jsx | 294 | setTimeout | REVIEW_REQUIRED |
| frontend/src/components/integration/IntegrationContractsV1View.jsx | 299 | Math.random | REVIEW_REQUIRED |
| frontend/src/components/integration/IntegrationContractsV1View.jsx | 300 | Math.random | REVIEW_REQUIRED |
| frontend/src/components/integration/IntegrationContractsV1View.jsx | 327 | setTimeout | REVIEW_REQUIRED |
| frontend/src/components/integration/IntegrationDiagnosticsView.jsx | 144 | setTimeout | REVIEW_REQUIRED |
| frontend/src/components/integration/SyncManagerView.jsx | 154 | Math.random | REVIEW_REQUIRED |
| frontend/src/components/integration/WebhookManagerView.jsx | 118 | setTimeout | REVIEW_REQUIRED |
| frontend/src/features/erp-account/IamUsers.jsx | 54 | setTimeout | REVIEW_REQUIRED |
| frontend/src/features/iam-demo/api/invitations.js | 3 | demo | DEMO_ONLY |
| frontend/src/features/iam-demo/api/invitations.js | 14 | setTimeout | DEMO_ONLY |
| frontend/src/features/iam-demo/components/observability/useToast.js | 10 | setTimeout | DEMO_ONLY |
| frontend/src/features/iam-demo/data/mock.js | 378 | demo | DEMO_ONLY |
| frontend/src/features/iam-demo/pages/IamOverview/IamOverviewPage.jsx | 101 | setTimeout | DEMO_ONLY |
| frontend/src/features/iam-demo/pages/IamOverview/IamOverviewPage.jsx | 107 | setTimeout | DEMO_ONLY |
| frontend/src/features/iam-demo/pages/IamOverview/IamOverviewPage.jsx | 115 | console.log | DEMO_ONLY |
| frontend/src/features/iam-demo/pages/IamOverview/IamOverviewPage.jsx | 122 | TODO | DEMO_ONLY |
| frontend/src/features/iam-demo/pages/Identities/IdentitiesPage.jsx | 55 | setTimeout | DEMO_ONLY |
| frontend/src/features/iam-demo/pages/Invitation/InvitationPage.jsx | 58 | Demo | DEMO_ONLY |
| frontend/src/features/iam-demo/pages/Invitation/InvitationPage.jsx | 59 | demo | DEMO_ONLY |
| frontend/src/features/iam-demo/pages/Observability/AuditPage.jsx | 51 | setTimeout | DEMO_ONLY |
| frontend/src/features/iam-demo/pages/Observability/AuditPage.jsx | 126 | setTimeout | DEMO_ONLY |
| frontend/src/features/iam-demo/pages/Observability/LogsPage.jsx | 52 | setTimeout | DEMO_ONLY |
| frontend/src/features/iam-demo/pages/Observability/LogsPage.jsx | 140 | setTimeout | DEMO_ONLY |
| frontend/src/features/iam-demo/pages/Observability/MonitoringPage.jsx | 45 | setTimeout | DEMO_ONLY |
| frontend/src/features/iam-demo/pages/Observability/MonitoringPage.jsx | 107 | setTimeout | DEMO_ONLY |
| frontend/src/features/iam-demo/pages/Observability/ObservabilityOverview.jsx | 152 | setTimeout | DEMO_ONLY |
| frontend/src/features/iam-demo/pages/Observability/SecurityEventsPage.jsx | 49 | setTimeout | DEMO_ONLY |
| frontend/src/features/iam-demo/pages/Observability/SecurityEventsPage.jsx | 118 | setTimeout | DEMO_ONLY |
| frontend/src/features/iam-demo/pages/Organisations/OrganisationsPage.jsx | 30 | setTimeout | DEMO_ONLY |
| frontend/src/features/iam-demo/pages/Policies/PoliciesPage.jsx | 32 | setTimeout | DEMO_ONLY |
| frontend/src/features/iam-demo/pages/Roles/RolesPage.jsx | 28 | setTimeout | DEMO_ONLY |
| frontend/src/features/iam-demo/pages/Tenants/TenantsPage.jsx | 30 | setTimeout | DEMO_ONLY |
| frontend/src/features/iam-demo/pages/Users/UsersPage.jsx | 38 | setTimeout | DEMO_ONLY |
| frontend/src/features/iam-demo/services/usersService.js | 1 | demo | DEMO_ONLY |
| frontend/src/pages/DemoPage.jsx | 8 | demo | REVIEW_REQUIRED |
| frontend/src/pages/DemoPage.jsx | 23 | demo | REVIEW_REQUIRED |
| frontend/src/pages/ErpModule.jsx | 173 | setTimeout | REVIEW_REQUIRED |
| frontend/src/pages/ErpModule.jsx | 376 | setTimeout | REVIEW_REQUIRED |
| frontend/src/pages/ErpModule.jsx | 388 | setTimeout | REVIEW_REQUIRED |
| frontend/src/pages/iam/IdentitiesPage.jsx | 21 | mockData | REVIEW_REQUIRED |
| frontend/src/pages/iam/observability/AlertManagerPage.jsx | 13 | mockData | REVIEW_REQUIRED |
| frontend/src/pages/iam/observability/AuditPage.jsx | 16 | mockData | REVIEW_REQUIRED |
| frontend/src/pages/iam/observability/LogsPage.jsx | 16 | mockData | REVIEW_REQUIRED |
| frontend/src/pages/iam/observability/MonitoringPage.jsx | 14 | mockData | REVIEW_REQUIRED |
| frontend/src/pages/iam/observability/ObservabilityOverview.jsx | 21 | mockData | REVIEW_REQUIRED |
| frontend/src/pages/iam/observability/SecurityEventsPage.jsx | 13 | mockData | REVIEW_REQUIRED |
| frontend/src/pages/iam/PoliciesPage.jsx | 18 | mockData | REVIEW_REQUIRED |
| frontend/src/pages/iam/RolesPage.jsx | 19 | mockData | REVIEW_REQUIRED |
| frontend/src/pages/iam/SessionsPage.jsx | 13 | mockData | REVIEW_REQUIRED |
| frontend/src/pages/iam/TenantsPage.jsx | 22 | mockData | REVIEW_REQUIRED |
| frontend/src/pages/iam/UsersPage.jsx | 4 | mockData | REVIEW_REQUIRED |
| frontend/src/services/authService.js | 28 | Math.random | LEGITIMATE_STATIC_DATA |
| frontend/src/store/auditSlice.js | 81 | Math.random | LEGITIMATE_STATIC_DATA |
| frontend/src/store/integrationSlice.js | 94 | setTimeout | REVIEW_REQUIRED |
| frontend/src/store/integrationSlice.js | 205 | setTimeout | REVIEW_REQUIRED |
| frontend/src/store/integrationSlice.js | 1361 | Math.random | REVIEW_REQUIRED |
| frontend/src/store/integrationSlice.js | 1386 | Math.random | REVIEW_REQUIRED |
| frontend/src/store/integrationSlice.js | 1393 | Math.random | REVIEW_REQUIRED |
| frontend/src/store/integrationSlice.js | 1395 | Math.random | LEGITIMATE_STATIC_DATA |
| frontend/src/store/integrationSlice.js | 1512 | Math.random | REVIEW_REQUIRED |
| frontend/src/store/integrationSlice.js | 1513 | Math.random | REVIEW_REQUIRED |
| frontend/src/store/platformSlice.js | 148 | Math.random | LEGITIMATE_STATIC_DATA |
| backend/src/automation/action/action.engine.ts | 89 | no-op handler | NO_OP |
| backend/src/automation/automation.controller.ts | 253 | Math.random | LEGITIMATE_STATIC_DATA |
| backend/src/automation/automation.controller.ts | 263 | Math.random | LEGITIMATE_STATIC_DATA |
| backend/src/automation/workflow/workflow.engine.ts | 130 | Math.random | LEGITIMATE_STATIC_DATA |
| backend/src/common/filters/all-exceptions.filter.ts | 22 | Math.random | REVIEW_REQUIRED |
| backend/src/common/logger/winston.logger.ts | 48 | Math.random | LEGITIMATE_STATIC_DATA |
| backend/src/common/providers/mock-integration.provider.ts | 58 | setTimeout | REVIEW_REQUIRED |
| backend/src/common/providers/real-integration.provider.ts | 136 | setTimeout | REVIEW_REQUIRED |
| backend/src/common/resilience/integration-resilience.service.ts | 49 | setTimeout | REVIEW_REQUIRED |
| backend/src/common/resilience/integration-resilience.service.ts | 120 | setTimeout | REVIEW_REQUIRED |
| backend/src/common/resilience/integration-resilience.service.ts | 126 | setTimeout | REVIEW_REQUIRED |
| backend/src/common/resilience/integration-resilience.service.ts | 140 | setTimeout | REVIEW_REQUIRED |
| backend/src/common/types/integration.types.ts | 21 | setTimeout | REVIEW_REQUIRED |
| backend/src/data-runtime/data-runtime.controller.ts | 177 | Math.random | LEGITIMATE_STATIC_DATA |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.spec.ts | 11 | ToDo | TEST_ONLY |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.spec.ts | 33 | ToDo | TEST_ONLY |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.spec.ts | 57 | ToDo | TEST_ONLY |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.ts | 39 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.ts | 80 | setTimeout | REVIEW_REQUIRED |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.ts | 122 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.ts | 129 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.ts | 168 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.ts | 175 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.ts | 205 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.ts | 208 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.ts | 405 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.ts | 412 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.ts | 423 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.ts | 456 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.ts | 463 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.ts | 474 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.ts | 528 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.ts | 569 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.ts | 746 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.ts | 822 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.ts | 867 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.ts | 921 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.ts | 966 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.ts | 1018 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.ts | 1072 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.ts | 1147 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.ts | 1162 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.ts | 1163 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.ts | 1223 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.adapter.ts | 1241 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 25 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 41 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 72 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 102 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 138 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 147 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 150 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 151 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 177 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 186 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 189 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 190 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 232 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 255 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 281 | Math.random | REVIEW_REQUIRED |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 332 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 362 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 388 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 412 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 439 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 477 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 505 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 537 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 570 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 594 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 619 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 644 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 649 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 650 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 667 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/dolibarr/dolibarr.mapper.ts | 673 | ToDo | INCOMPLETE |
| backend/src/erp-adapter/trace-id.middleware.ts | 30 | Math.random | REVIEW_REQUIRED |
| backend/src/iam/iam-mfa.service.ts | 219 | Math.random | REVIEW_REQUIRED |
| backend/src/iam/iam-observability.service.ts | 272 | Math.random | REVIEW_REQUIRED |
| backend/src/iam/iam-observability.service.ts | 281 | Math.random | REVIEW_REQUIRED |
| backend/src/iam/iam-observability.service.ts | 290 | Math.random | REVIEW_REQUIRED |
| backend/src/modules/integration/synchronizations/synchronization.service.ts | 412 | setTimeout | REVIEW_REQUIRED |
| backend/src/modules/integration/webhooks/webhook-delivery.service.ts | 257 | setTimeout | REVIEW_REQUIRED |
| backend/src/modules/platform/platform.service.ts | 242 | console.log | REVIEW_REQUIRED |
| backend/src/prisma/seed.ts | 34 | console.log | REVIEW_REQUIRED |
| backend/src/prisma/seed.ts | 642 | console.log | REVIEW_REQUIRED |
