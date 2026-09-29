# Business journeys

Attempted login returned 500. Downstream steps were not executed. Unit tests and static observations are listed in the main report, never counted as journey REAL_PASS. Journey definitions follow the user request.

| JOURNEY | START | STEPS_TOTAL | REAL_PASS | PARTIAL | MOCK | BLOCKED | FIRST_FAILURE | ROOT_CAUSE | STEPS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A AUTH | BLOCKED_AT_AUTH | 7 | 0 | 0 | 0 | 7 | Login 500 | IAM schema/model mismatch; missing test membership | Login → Cookie → me → ProtectedRoute → Refresh → Logout → refusal |
| B TENANT | BLOCKED_AT_AUTH | 8 | 0 | 0 | 0 | 8 | Login 500 | IAM schema/model mismatch; missing test membership | Login → context → membership → role → permissions → entitlements → Sidebar → API |
| C APPLICATION | BLOCKED_AT_AUTH | 8 | 0 | 0 | 0 | 8 | Prerequisite authenticated tenant | IAM schema/model mismatch; missing test membership | Tenant → application → create → read → update → config → validation → archive |
| D BUSINESS | BLOCKED_AT_AUTH | 6 | 0 | 0 | 0 | 6 | Prerequisite authenticated tenant | IAM schema/model mismatch; missing test membership | Application → data model → feature/capability → menu → rule → workflow |
| E PACK | BLOCKED_AT_AUTH | 6 | 0 | 0 | 0 | 6 | Prerequisite authenticated tenant | IAM schema/model mismatch; missing test membership | Application → pack → version → dependencies → publication → runtime |
| F ERP/DATA | BLOCKED_AT_AUTH | 7 | 0 | 0 | 0 | 7 | Prerequisite authenticated tenant | IAM schema/model mismatch; missing test membership | Registry → adapter → mapping → runtime → query → result → audit |
| G AUTOMATION | BLOCKED_AT_AUTH | 6 | 0 | 0 | 0 | 6 | Prerequisite authenticated tenant | IAM schema/model mismatch; missing test membership | Trigger → rule → workflow → action → result → audit |

## Safe CRUD / states

Applications, Packs, ERP Registry, workflow, subscriptions: CREATE/READ/UPDATE/DELETE, pagination, server filtering, sorting and duplicate submissions remain NOT_EXECUTED_AUTH_BLOCKED. No business E2E data created or cleaned. Anonymous 401, malformed login 400, cross-site 403 and missing /ready 404 were measured; 409/503 and authenticated 500 UI states were not comprehensively exercised.
